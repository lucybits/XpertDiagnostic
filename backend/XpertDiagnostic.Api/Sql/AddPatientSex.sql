-- Agrega PACIENTES.Sexo en bases creadas antes de esa columna: CHAR(1) obligatorio, 'F' o 'M' en
-- mayúscula (la comparación es binaria porque la collation de la base no distingue mayúsculas).
-- La fecha de nacimiento y los nombres separados los agrega UpdatePatientsNameAndBirthDate.sql.
--
-- Los pacientes que ya existen no tienen sexo: la primera vez la columna se agrega vacía y el script
-- avisa. Recarga SeedClinicalData.sql (o captura el sexo de los pacientes que falten) y vuelve a
-- correr este script para dejarla NOT NULL.
-- Se puede correr varias veces: cada paso revisa antes si ya se hizo.
SET NOCOUNT ON;
SET XACT_ABORT ON;

IF DB_NAME() IN (N'master', N'model', N'msdb', N'tempdb')
    THROW 50010, 'Selecciona la base de datos XpertDiagnostic antes de ejecutar este script.', 1;

IF OBJECT_ID(N'dbo.PACIENTES', N'U') IS NULL
    THROW 50001, 'No existe la tabla dbo.PACIENTES; créala con CreateClinicalTables.sql.', 1;

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

IF EXISTS (SELECT 1 FROM dbo.PACIENTES WHERE Sexo IS NULL)
    PRINT 'AVISO: hay pacientes sin Sexo. Recarga SeedClinicalData.sql o captúralo, y vuelve a correr este script para dejarlo NOT NULL.';
ELSE IF EXISTS (SELECT 1 FROM sys.columns
                WHERE object_id = OBJECT_ID(N'dbo.PACIENTES') AND name = N'Sexo' AND is_nullable = 1)
    ALTER TABLE dbo.PACIENTES ALTER COLUMN Sexo CHAR(1) NOT NULL;
GO

PRINT 'PACIENTES.Sexo lista.';
