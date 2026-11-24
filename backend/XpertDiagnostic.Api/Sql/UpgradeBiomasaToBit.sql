-- Cambia IO_AntecNoPatolPacientes.Biomasa de INT a BIT (sí/no), como las demás casillas de
-- antecedentes no patológicos, en bases creadas cuando era INT.
-- Los valores que ya existan se conservan: 0 queda en 0 (no), cualquier otro número en 1 (sí) y
-- NULL sigue en NULL.
-- Se puede correr varias veces: si la columna ya es BIT, no hace nada.
SET NOCOUNT ON;
SET XACT_ABORT ON;

IF DB_NAME() IN (N'master', N'model', N'msdb', N'tempdb')
    THROW 50010, 'Selecciona la base de datos XpertDiagnostic antes de ejecutar este script.', 1;

IF EXISTS (SELECT 1
           FROM sys.columns AS c
           JOIN sys.types AS t ON t.user_type_id = c.user_type_id
           WHERE c.object_id = OBJECT_ID(N'dbo.IO_AntecNoPatolPacientes')
             AND c.name = N'Biomasa'
             AND t.name <> N'bit')
BEGIN
    BEGIN TRANSACTION;
    UPDATE dbo.IO_AntecNoPatolPacientes SET Biomasa = 1 WHERE Biomasa NOT IN (0, 1);
    ALTER TABLE dbo.IO_AntecNoPatolPacientes ALTER COLUMN Biomasa BIT NULL;
    COMMIT TRANSACTION;
    PRINT 'IO_AntecNoPatolPacientes.Biomasa ahora es BIT.';
END
ELSE
    PRINT 'IO_AntecNoPatolPacientes.Biomasa ya es BIT (o la tabla no existe; créala con CreateClinicalTables.sql).';
