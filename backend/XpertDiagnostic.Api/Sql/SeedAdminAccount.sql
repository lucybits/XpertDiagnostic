/*
    Cuenta de administrador de PRUEBA (P-116).

      ID:          654321
      Contraseña:  admin

    Solo para desarrollo y demostración: la contraseña es débil a propósito para las pruebas manuales.
    Se guarda como hash BCrypt (nunca en texto plano). En un entorno real, cámbiala desde el panel
    (Cambiar mi contraseña) o no ejecutes este script.

    Requisitos: haber ejecutado antes CreateDoctorsAndUsersTables.sql (IdMEDICO opcional).
    Se puede repetir: si la cuenta ya existe no la modifica (no restablece una contraseña ya cambiada).
*/

SET NOCOUNT ON;
SET XACT_ABORT ON;

IF DB_NAME() IN (N'master', N'model', N'msdb', N'tempdb')
    THROW 50010, 'Selecciona la base de datos XpertDiagnostic antes de ejecutar este script.', 1;

IF EXISTS (SELECT 1 FROM sys.columns WHERE object_id = OBJECT_ID(N'dbo.USUARIOS') AND name = N'IdMEDICO' AND is_nullable = 0)
    THROW 50011, 'Ejecuta primero CreateDoctorsAndUsersTables.sql: la cuenta de administrador no tiene registro de médico.', 1;

IF EXISTS (SELECT 1 FROM dbo.MEDICOS WHERE IdMedico = 654321)
    THROW 50012, 'El ID 654321 ya pertenece a un médico; no se puede usar para el administrador de prueba.', 1;

IF NOT EXISTS (SELECT 1 FROM dbo.USUARIOS WHERE IdUSUARIO = 654321)
BEGIN
    INSERT INTO dbo.USUARIOS (IdUSUARIO, PASS, ROL, IdMEDICO, IdAREA, BienvenidaVista, Activo)
    VALUES (654321, '$2a$11$awcLce16ICdrYN.wUWuCxOLcTI1u2oZiMTG6hf79MuNYUfkQpj2aG', 'A', NULL, NULL, 1, 1);
    PRINT 'Cuenta de administrador 654321 creada.';
END
ELSE
    PRINT 'La cuenta 654321 ya existía; no se modificó.';
