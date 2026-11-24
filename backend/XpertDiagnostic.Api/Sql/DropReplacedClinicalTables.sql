-- Quita las tablas que se reemplazaron por las IO_:
--   COMPLICACIONES       -> IO_Complicaciones
--   RESULTADOS_ESPERADOS -> IO_ResultadosEsperados
-- Orden para una base existente:
--   1. CreateClinicalTables.sql (crea las IO_ que falten).
--   2. Este script.
--   3. SeedClinicalData.sql (carga los datos en las IO_).
-- Se puede correr varias veces: DROP TABLE IF EXISTS no falla si ya no existen.
SET NOCOUNT ON;

IF DB_NAME() IN (N'master', N'model', N'msdb', N'tempdb')
    THROW 50010, 'Selecciona la base de datos XpertDiagnostic antes de ejecutar este script.', 1;

DROP TABLE IF EXISTS dbo.RESULTADOS_ESPERADOS;
DROP TABLE IF EXISTS dbo.COMPLICACIONES;

PRINT 'Tablas reemplazadas eliminadas.';
