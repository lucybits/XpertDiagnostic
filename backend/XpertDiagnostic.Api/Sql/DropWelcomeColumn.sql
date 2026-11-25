-- Quita USUARIOS.BienvenidaVista y su valor por defecto (P-154): la bienvenida guiada y el chat del
-- asistente se retiraron, así que la cuenta ya no guarda si se vio.
-- Córrelo en bases creadas antes de P-154. Se puede correr varias veces: cada paso revisa antes si existe.
SET NOCOUNT ON;
SET XACT_ABORT ON;

IF DB_NAME() IN (N'master', N'model', N'msdb', N'tempdb')
    THROW 50010, 'Selecciona la base de datos XpertDiagnostic antes de ejecutar este script.', 1;

IF OBJECT_ID(N'dbo.USUARIOS', N'U') IS NULL
    THROW 50001, 'No existe la tabla dbo.USUARIOS; créala con CreateDoctorsAndUsersTables.sql.', 1;

BEGIN TRANSACTION;

-- El valor por defecto se busca por columna, no por nombre (pudo crearse con otro nombre).
DECLARE @default SYSNAME =
(
    SELECT dc.name
    FROM sys.default_constraints AS dc
    JOIN sys.columns AS c ON c.object_id = dc.parent_object_id AND c.column_id = dc.parent_column_id
    WHERE dc.parent_object_id = OBJECT_ID(N'dbo.USUARIOS') AND c.name = N'BienvenidaVista'
);
IF @default IS NOT NULL
BEGIN
    DECLARE @sql NVARCHAR(400) = N'ALTER TABLE dbo.USUARIOS DROP CONSTRAINT ' + QUOTENAME(@default) + N';';
    EXEC sys.sp_executesql @sql;
END

IF COL_LENGTH(N'dbo.USUARIOS', N'BienvenidaVista') IS NOT NULL
    ALTER TABLE dbo.USUARIOS DROP COLUMN BienvenidaVista;

COMMIT TRANSACTION;

PRINT 'USUARIOS sin la columna BienvenidaVista.';
