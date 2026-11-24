-- Pasa PACIENTES de guardar la Edad a guardar FechaNacimiento y Sexo, en bases creadas antes.
-- Después de correrlo, Edad es una columna calculada: los años cumplidos de FechaNacimiento a la
-- fecha actual (igual que en CreateClinicalTables.sql), así que ya no se escribe ni queda vieja.
-- A los pacientes que ya existen se les inventa una fecha de nacimiento que da su Edad guardada
-- (entre 1 y 300 días antes de su último cumpleaños).
-- Sexo es obligatorio ('F' o 'M' en mayúscula), pero los pacientes que ya existen no lo tienen: la
-- primera vez se agrega vacío y el script avisa. Recarga SeedClinicalData.sql (o captura el sexo de
-- los pacientes que falten) y vuelve a correr este script para dejarlo NOT NULL.
-- Se puede correr varias veces: cada paso revisa antes si ya se hizo.
SET NOCOUNT ON;
SET XACT_ABORT ON;

IF DB_NAME() IN (N'master', N'model', N'msdb', N'tempdb')
    THROW 50010, 'Selecciona la base de datos XpertDiagnostic antes de ejecutar este script.', 1;

IF OBJECT_ID(N'dbo.PACIENTES', N'U') IS NULL
    THROW 50001, 'No existe la tabla dbo.PACIENTES; créala con CreateClinicalTables.sql.', 1;

IF COL_LENGTH(N'dbo.PACIENTES', N'FechaNacimiento') IS NULL
    ALTER TABLE dbo.PACIENTES ADD FechaNacimiento DATE NULL;

IF COL_LENGTH(N'dbo.PACIENTES', N'Sexo') IS NULL
    ALTER TABLE dbo.PACIENTES ADD Sexo CHAR(1) NULL;
GO

-- La restricción se vuelve a crear para que sea binaria (una versión anterior aceptaba 'f' y 'm').
IF OBJECT_ID(N'dbo.CK_PACIENTES_SEXO', N'C') IS NOT NULL
    ALTER TABLE dbo.PACIENTES DROP CONSTRAINT CK_PACIENTES_SEXO;
IF EXISTS (SELECT 1 FROM dbo.PACIENTES WHERE Sexo IS NOT NULL AND Sexo COLLATE Latin1_General_BIN2 NOT IN ('F', 'M'))
    THROW 50040, 'Hay pacientes con un Sexo distinto de F o M; corrígelos antes de volver a correr el script.', 1;
ALTER TABLE dbo.PACIENTES ADD CONSTRAINT CK_PACIENTES_SEXO CHECK (Sexo COLLATE Latin1_General_BIN2 IN ('F', 'M'));
GO

-- Mientras Edad siga siendo una columna normal: inventa la fecha a partir de ella y la quita.
IF EXISTS (SELECT 1 FROM sys.columns
           WHERE object_id = OBJECT_ID(N'dbo.PACIENTES') AND name = N'Edad' AND is_computed = 0)
BEGIN
    BEGIN TRANSACTION;
    EXEC (N'UPDATE dbo.PACIENTES
            SET FechaNacimiento = DATEADD(DAY, -(ABS(CHECKSUM(Id_Paciente)) % 300 + 1),
                                          DATEADD(YEAR, -Edad, CAST(GETDATE() AS DATE)))
            WHERE FechaNacimiento IS NULL;');
    IF OBJECT_ID(N'dbo.CK_PACIENTES_EDAD', N'C') IS NOT NULL
        ALTER TABLE dbo.PACIENTES DROP CONSTRAINT CK_PACIENTES_EDAD;
    ALTER TABLE dbo.PACIENTES DROP COLUMN Edad;
    COMMIT TRANSACTION;
END
GO

IF EXISTS (SELECT 1 FROM dbo.PACIENTES WHERE FechaNacimiento IS NULL)
    THROW 50030, 'Hay pacientes sin FechaNacimiento; captúrala antes de volver a correr el script.', 1;
GO

IF EXISTS (SELECT 1 FROM sys.columns
           WHERE object_id = OBJECT_ID(N'dbo.PACIENTES') AND name = N'FechaNacimiento' AND is_nullable = 1)
    ALTER TABLE dbo.PACIENTES ALTER COLUMN FechaNacimiento DATE NOT NULL;

IF COL_LENGTH(N'dbo.PACIENTES', N'Edad') IS NULL
    ALTER TABLE dbo.PACIENTES ADD Edad AS (DATEDIFF(YEAR, FechaNacimiento, CAST(GETDATE() AS DATE))
                                  - CASE WHEN DATEADD(YEAR, DATEDIFF(YEAR, FechaNacimiento, CAST(GETDATE() AS DATE)), FechaNacimiento)
                                              > CAST(GETDATE() AS DATE) THEN 1 ELSE 0 END);
GO

IF EXISTS (SELECT 1 FROM dbo.PACIENTES WHERE Sexo IS NULL)
    PRINT 'AVISO: hay pacientes sin Sexo. Recarga SeedClinicalData.sql o captúralo, y vuelve a correr este script para dejarlo NOT NULL.';
ELSE IF EXISTS (SELECT 1 FROM sys.columns
                WHERE object_id = OBJECT_ID(N'dbo.PACIENTES') AND name = N'Sexo' AND is_nullable = 1)
    ALTER TABLE dbo.PACIENTES ALTER COLUMN Sexo CHAR(1) NOT NULL;
GO

PRINT 'PACIENTES tiene FechaNacimiento y Sexo; Edad se calcula de la fecha de nacimiento.';
