/*
    Cuenta de internista de PRUEBA.

      ID:          654322
      Contraseña:  admin

    Solo para desarrollo y demostración. La contraseña se guarda como hash BCrypt.
    No modifica una cuenta existente. Requiere CreateDoctorsAndUsersTables.sql.
*/

SET NOCOUNT ON;
SET XACT_ABORT ON;

IF DB_NAME() IN (N'master', N'model', N'msdb', N'tempdb')
    THROW 50010, 'Selecciona la base de datos XpertDiagnostic antes de ejecutar este script.', 1;

IF OBJECT_ID(N'dbo.USUARIOS', N'U') IS NULL OR OBJECT_ID(N'dbo.MEDICOS', N'U') IS NULL
    THROW 50011, 'Ejecuta primero CreateDoctorsAndUsersTables.sql.', 1;

IF EXISTS (
    SELECT 1
    FROM dbo.USUARIOS u
    INNER JOIN dbo.MEDICOS m ON m.Id_Medico = u.Id_Medico
    WHERE u.Id_Usuario = 654322 AND u.ROL = 'I' AND u.Id_Medico = 654322
)
BEGIN
    PRINT 'La cuenta internista 654322 ya existe; no se modificó.';
    RETURN;
END

IF EXISTS (SELECT 1 FROM dbo.USUARIOS WHERE Id_Usuario = 654322)
    THROW 50012, 'El ID 654322 ya pertenece a otra cuenta; no se modificó.', 1;

IF EXISTS (SELECT 1 FROM dbo.MEDICOS WHERE Id_Medico = 654322 OR CedulaProfesional = '65432202')
    THROW 50013, 'El ID o la cédula de prueba ya pertenece a otro médico; no se modificó.', 1;

BEGIN TRANSACTION;

INSERT INTO dbo.MEDICOS (Id_Medico, NombreCompleto, Especialidad, CedulaProfesional)
VALUES (654322, N'Internista de Prueba', N'Medicina Interna', '65432202');

INSERT INTO dbo.USUARIOS (Id_Usuario, PASS, ROL, Id_Medico, Id_Area, Activo)
VALUES (654322, '$2a$11$awcLce16ICdrYN.wUWuCxOLcTI1u2oZiMTG6hf79MuNYUfkQpj2aG', 'I', 654322, NULL, 1);

COMMIT TRANSACTION;

PRINT 'Cuenta internista de prueba 654322 creada.';