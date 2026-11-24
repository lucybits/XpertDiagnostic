-- Quita "Enfermedades preexistentes": elimina la FK y la columna PACIENTES.IdEnfermedadPreexistente.
-- Se puede correr varias veces: cada paso revisa antes si existe.
USE XpertDiagnostic;
GO

IF OBJECT_ID(N'dbo.PACIENTES', N'U') IS NULL
    THROW 50001, 'No existe la tabla dbo.PACIENTES.', 1;
GO

-- Cualquier FK sobre la columna (normalmente FK_PACIENTES_ENFERMEDAD_PREEX), sin depender del nombre.
DECLARE @sql NVARCHAR(MAX) = N'';
SELECT @sql += N'ALTER TABLE dbo.PACIENTES DROP CONSTRAINT ' + QUOTENAME(fk.name) + N';'
FROM sys.foreign_keys AS fk
JOIN sys.foreign_key_columns AS fkc ON fkc.constraint_object_id = fk.object_id
JOIN sys.columns AS c ON c.object_id = fkc.parent_object_id AND c.column_id = fkc.parent_column_id
WHERE fk.parent_object_id = OBJECT_ID(N'dbo.PACIENTES')
  AND c.name = N'IdEnfermedadPreexistente';
IF @sql <> N'' EXEC sys.sp_executesql @sql;
GO

IF COL_LENGTH(N'dbo.PACIENTES', N'IdEnfermedadPreexistente') IS NOT NULL
    ALTER TABLE dbo.PACIENTES DROP COLUMN IdEnfermedadPreexistente;
GO
