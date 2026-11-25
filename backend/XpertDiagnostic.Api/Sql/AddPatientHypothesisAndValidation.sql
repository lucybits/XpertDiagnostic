/*
    Migración de dbo.PACIENTES (P-145): flujo del médico tratante.
      - HipotesisInicial: hipótesis diagnóstica inicial que escribe el tratante antes de analizar.
      - EstadoValidacion: NULL = en captura; 'Pendiente' = el tratante confirmó el diagnóstico y lo
        envió a validación; 'Validado' = el internista lo validó y el tratante puede ver la salida.

    Cómo usarlo (una sola vez, en bases creadas antes de P-145):
      sqlcmd -S localhost -E -C -d XpertDiagnostic -i AddPatientHypothesisAndValidation.sql
    Se puede repetir: si las columnas ya existen, no cambia nada.
*/

SET NOCOUNT ON;
SET XACT_ABORT ON;

IF DB_NAME() IN (N'master', N'model', N'msdb', N'tempdb')
    THROW 50010, 'Selecciona la base de datos XpertDiagnostic antes de ejecutar este script.', 1;

IF OBJECT_ID(N'dbo.PACIENTES', N'U') IS NULL
    THROW 50011, 'No existe dbo.PACIENTES. Ejecuta primero CreateClinicalTables.sql.', 1;

BEGIN TRANSACTION;

IF COL_LENGTH(N'dbo.PACIENTES', N'HipotesisInicial') IS NULL
    ALTER TABLE dbo.PACIENTES ADD HipotesisInicial NVARCHAR(1000) NULL;

IF COL_LENGTH(N'dbo.PACIENTES', N'EstadoValidacion') IS NULL
    ALTER TABLE dbo.PACIENTES ADD EstadoValidacion VARCHAR(10) NULL;

IF OBJECT_ID(N'dbo.CK_PACIENTES_ESTADO_VALIDACION', N'C') IS NULL
    EXEC (N'ALTER TABLE dbo.PACIENTES WITH CHECK
            ADD CONSTRAINT CK_PACIENTES_ESTADO_VALIDACION CHECK (EstadoValidacion IN (''Pendiente'', ''Validado''));');

COMMIT TRANSACTION;

PRINT 'PACIENTES lista: hipótesis inicial y estado de validación.';
