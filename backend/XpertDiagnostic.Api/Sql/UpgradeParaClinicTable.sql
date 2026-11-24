-- Reemplaza IO_AntecParaClinicPacientes en bases donde se creó con las columnas de perinatales
-- (ProductEmb, PartCesare, ...). La nueva tiene Consciente, Alerta, Cavidoral, etc.
-- Solo actúa si la tabla aún tiene la columna vieja ProductEmb, y no borra datos: si ya tiene
-- filas, se detiene con un error para revisarlas antes.
-- Se puede correr varias veces: si la tabla ya es la nueva, no hace nada.
SET NOCOUNT ON;
SET XACT_ABORT ON;

IF DB_NAME() IN (N'master', N'model', N'msdb', N'tempdb')
    THROW 50010, 'Selecciona la base de datos XpertDiagnostic antes de ejecutar este script.', 1;

IF COL_LENGTH(N'dbo.IO_AntecParaClinicPacientes', N'ProductEmb') IS NOT NULL
BEGIN
    IF EXISTS (SELECT 1 FROM dbo.IO_AntecParaClinicPacientes)
        THROW 50020, 'IO_AntecParaClinicPacientes tiene datos con las columnas viejas; revísalos antes de reemplazarla.', 1;

    BEGIN TRANSACTION;
    DROP TABLE dbo.IO_AntecParaClinicPacientes;
    CREATE TABLE dbo.IO_AntecParaClinicPacientes (
        IdPaciente VARCHAR(10)   NOT NULL CONSTRAINT PK_IO_AntecParaClinic PRIMARY KEY
                                 CONSTRAINT FK_IO_AntecParaClinic_Pacientes REFERENCES dbo.PACIENTES (IdPaciente),
        Consciente NVARCHAR(100) NULL,
        Alerta     NVARCHAR(100) NULL,
        Cavidoral  NVARCHAR(150) NULL,
        AperturaOr NVARCHAR(100) NULL,
        DentadComp NVARCHAR(150) NULL,
        Traquea    NVARCHAR(150) NULL,
        Pulmovent  NVARCHAR(255) NULL,
        RuidosCard NVARCHAR(255) NULL,
        Abdombland NVARCHAR(255) NULL,
        Miembpelvi NVARCHAR(255) NULL
    );
    COMMIT TRANSACTION;
    PRINT 'IO_AntecParaClinicPacientes reemplazada.';
END
ELSE
    PRINT 'IO_AntecParaClinicPacientes ya tiene las columnas nuevas (o no existe; créala con CreateClinicalTables.sql).';
