/*
    Migración de dbo.PACIENTES (P-144): el administrador da de alta al paciente con nombre(s),
    apellido paterno, apellido materno y fecha de nacimiento. La edad ya no se guarda: se calcula
    de la fecha.

    Cómo usarlo (una sola vez, en bases creadas antes de P-144):
      sqlcmd -S localhost -E -C -d XpertDiagnostic -i UpdatePatientsNameAndBirthDate.sql
    Se puede repetir: si la tabla ya está migrada, no cambia nada.

    Qué hace, en una sola transacción:
      1. Agrega Nombres, ApellidoPaterno, ApellidoMaterno y FechaNacimiento.
      2. Rellena FechaNacimiento con el 1 de enero del año que corresponde a la Edad guardada.
      3. Rellena las partes del nombre a partir de NombreCompleto (sin "(ficticio)"): las dos últimas
         palabras son los apellidos y el resto, los nombres. Si tiene menos de tres palabras, se quedan
         en NULL y NombreCompleto se sigue mostrando igual.
      4. Quita la columna Edad y su regla CK_PACIENTES_EDAD.
*/

SET NOCOUNT ON;
SET XACT_ABORT ON;

IF DB_NAME() IN (N'master', N'model', N'msdb', N'tempdb')
    THROW 50010, 'Selecciona la base de datos XpertDiagnostic antes de ejecutar este script.', 1;

IF OBJECT_ID(N'dbo.PACIENTES', N'U') IS NULL
    THROW 50011, 'No existe dbo.PACIENTES. Ejecuta primero CreateClinicalTables.sql.', 1;

BEGIN TRANSACTION;

IF COL_LENGTH(N'dbo.PACIENTES', N'Nombres') IS NULL
    ALTER TABLE dbo.PACIENTES ADD Nombres NVARCHAR(60) NULL;
IF COL_LENGTH(N'dbo.PACIENTES', N'ApellidoPaterno') IS NULL
    ALTER TABLE dbo.PACIENTES ADD ApellidoPaterno NVARCHAR(40) NULL;
IF COL_LENGTH(N'dbo.PACIENTES', N'ApellidoMaterno') IS NULL
    ALTER TABLE dbo.PACIENTES ADD ApellidoMaterno NVARCHAR(40) NULL;
IF COL_LENGTH(N'dbo.PACIENTES', N'FechaNacimiento') IS NULL
    ALTER TABLE dbo.PACIENTES ADD FechaNacimiento DATE NULL;

-- Las columnas nuevas se usan con EXEC: en el mismo lote todavía no existen al compilar.
IF COL_LENGTH(N'dbo.PACIENTES', N'Edad') IS NOT NULL
    EXEC (N'UPDATE dbo.PACIENTES
            SET FechaNacimiento = DATEFROMPARTS(YEAR(GETDATE()) - Edad, 1, 1)
            WHERE FechaNacimiento IS NULL;');

EXEC (N'
UPDATE p
SET Nombres = LEFT(partes.Resto, partes.EspacioResto - 1),
    ApellidoPaterno = SUBSTRING(partes.Resto, partes.EspacioResto + 1, 40),
    ApellidoMaterno = SUBSTRING(partes.Base, partes.EspacioBase + 1, 40)
FROM dbo.PACIENTES p
CROSS APPLY (SELECT LTRIM(RTRIM(REPLACE(p.NombreCompleto, N''(ficticio)'', N''''))) AS Base) b
CROSS APPLY (SELECT LEN(b.Base) - CHARINDEX(N'' '', REVERSE(b.Base)) + 1 AS EspacioBase) eb
CROSS APPLY (SELECT LEFT(b.Base, eb.EspacioBase - 1) AS Resto) r
CROSS APPLY (SELECT b.Base, eb.EspacioBase, r.Resto,
                    LEN(r.Resto) - CHARINDEX(N'' '', REVERSE(r.Resto)) + 1 AS EspacioResto) partes
WHERE p.Nombres IS NULL
  AND CHARINDEX(N'' '', b.Base) > 0
  AND CHARINDEX(N'' '', r.Resto) > 0;');

IF OBJECT_ID(N'dbo.CK_PACIENTES_EDAD', N'C') IS NOT NULL
    ALTER TABLE dbo.PACIENTES DROP CONSTRAINT CK_PACIENTES_EDAD;
IF COL_LENGTH(N'dbo.PACIENTES', N'Edad') IS NOT NULL
    ALTER TABLE dbo.PACIENTES DROP COLUMN Edad;

IF EXISTS (SELECT 1 FROM sys.columns WHERE object_id = OBJECT_ID(N'dbo.PACIENTES') AND name = N'FechaNacimiento' AND is_nullable = 1)
    ALTER TABLE dbo.PACIENTES ALTER COLUMN FechaNacimiento DATE NOT NULL;

IF OBJECT_ID(N'dbo.CK_PACIENTES_FECHA_NACIMIENTO', N'C') IS NULL
    EXEC (N'ALTER TABLE dbo.PACIENTES WITH CHECK
            ADD CONSTRAINT CK_PACIENTES_FECHA_NACIMIENTO CHECK (FechaNacimiento >= ''1890-01-01'');');

COMMIT TRANSACTION;

PRINT 'PACIENTES migrada: nombres separados y fecha de nacimiento.';
