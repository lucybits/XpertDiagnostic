-- Validación del diagnóstico por el médico internista (P-151).
-- Agrega a dbo.PACIENTES el estado de la validación y quién y cuándo envió y confirmó:
--   EstadoValidacion      'P' pendiente (el tratante lo envió) o 'C' confirmado (el internista lo validó).
--                         NULL: aún no se envía.
--   Id_MedicoSolicitante  médico tratante que envió el diagnóstico diferencial.
--   FechaSolicitud        cuándo lo envió (UTC).
--   Id_MedicoValidador    médico internista que confirmó el diagnóstico.
--   FechaValidacion       cuándo lo confirmó (UTC).
-- Los médicos no llevan llave foránea: el administrador puede eliminar a un médico y el historial del
-- paciente se conserva (el nombre se muestra vacío).
-- Se puede correr varias veces: cada paso revisa antes si ya se hizo.
SET NOCOUNT ON;
SET XACT_ABORT ON;

IF DB_NAME() IN (N'master', N'model', N'msdb', N'tempdb')
    THROW 50010, 'Selecciona la base de datos XpertDiagnostic antes de ejecutar este script.', 1;

IF OBJECT_ID(N'dbo.PACIENTES', N'U') IS NULL
    THROW 50001, 'No existe la tabla dbo.PACIENTES; créala con CreateClinicalTables.sql.', 1;

BEGIN TRANSACTION;

IF COL_LENGTH(N'dbo.PACIENTES', N'EstadoValidacion') IS NULL
    ALTER TABLE dbo.PACIENTES ADD EstadoValidacion CHAR(1) NULL;

IF COL_LENGTH(N'dbo.PACIENTES', N'Id_MedicoSolicitante') IS NULL
    ALTER TABLE dbo.PACIENTES ADD Id_MedicoSolicitante INT NULL;

IF COL_LENGTH(N'dbo.PACIENTES', N'FechaSolicitud') IS NULL
    ALTER TABLE dbo.PACIENTES ADD FechaSolicitud DATETIME2(0) NULL;

IF COL_LENGTH(N'dbo.PACIENTES', N'Id_MedicoValidador') IS NULL
    ALTER TABLE dbo.PACIENTES ADD Id_MedicoValidador INT NULL;

IF COL_LENGTH(N'dbo.PACIENTES', N'FechaValidacion') IS NULL
    ALTER TABLE dbo.PACIENTES ADD FechaValidacion DATETIME2(0) NULL;

COMMIT TRANSACTION;
GO

-- La regla se crea con SQL dinámico porque la columna pudo agregarse en el lote anterior.
IF OBJECT_ID(N'dbo.CK_PACIENTES_ESTADO_VALIDACION', N'C') IS NULL
    EXEC (N'ALTER TABLE dbo.PACIENTES WITH CHECK ADD CONSTRAINT CK_PACIENTES_ESTADO_VALIDACION
              CHECK (EstadoValidacion IS NULL OR EstadoValidacion COLLATE Latin1_General_BIN2 IN (''P'', ''C''));');

PRINT 'PACIENTES lista para la validación del médico internista.';
