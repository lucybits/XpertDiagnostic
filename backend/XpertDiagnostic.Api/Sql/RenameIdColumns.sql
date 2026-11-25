-- Renombra las columnas de llave de todas las tablas al formato Id_Xxx (IdPaciente -> Id_Paciente,
-- IdMEDICO -> Id_Medico, ...), en bases creadas con los nombres anteriores.
-- Córrelo ANTES que los demás scripts: CreateClinicalTables.sql, CreateDoctorsAndUsersTables.sql,
-- los Seed*.sql y los Upgrade*.sql ya usan los nombres nuevos.
-- sp_rename actualiza solo las llaves foráneas, CHECK y columnas calculadas que usan cada columna.
-- Se puede correr varias veces: solo renombra si existe el nombre viejo y aún no existe el nuevo.
SET NOCOUNT ON;
SET XACT_ABORT ON;

IF DB_NAME() IN (N'master', N'model', N'msdb', N'tempdb')
    THROW 50010, 'Selecciona la base de datos XpertDiagnostic antes de ejecutar este script.', 1;

DECLARE @Renombres TABLE (Tabla SYSNAME, Viejo SYSNAME, Nuevo SYSNAME);
INSERT INTO @Renombres (Tabla, Viejo, Nuevo) VALUES
    (N'MEDICOS', N'IdMedico', N'Id_Medico'),
    (N'USUARIOS', N'IdUSUARIO', N'Id_Usuario'),
    (N'USUARIOS', N'IdMEDICO', N'Id_Medico'),
    (N'USUARIOS', N'IdAREA', N'Id_Area'),
    (N'ENFERMEDADES', N'IdEnfermedad', N'Id_Enfermedad'),
    (N'SINTOMAS', N'IdSintoma', N'Id_Sintoma'),
    (N'SINTOMAS', N'IdEnfermedad', N'Id_Enfermedad'),
    (N'SIGNOS', N'IdSigno', N'Id_Signo'),
    (N'SIGNOS', N'IdEnfermedad', N'Id_Enfermedad'),
    (N'ESTUDIOS_LABORATORIO', N'IdEstudio', N'Id_Estudio'),
    (N'ESTUDIOS_LABORATORIO', N'IdEnfermedad', N'Id_Enfermedad'),
    (N'ESTUDIOS_DIAGNOSTICO_DIFERENCIAL', N'IdEstudio', N'Id_Estudio'),
    (N'ESTUDIOS_DIAGNOSTICO_DIFERENCIAL', N'IdEnfermedad', N'Id_Enfermedad'),
    (N'COMORBILIDADES', N'IdComorbilidad', N'Id_Comorbilidad'),
    (N'COMORBILIDADES', N'IdEnfermedad', N'Id_Enfermedad'),
    (N'DEFECTOS_CONGENITOS', N'IdDefecto', N'Id_Defecto'),
    (N'DEFECTOS_CONGENITOS', N'IdEnfermedad', N'Id_Enfermedad'),
    (N'TRATAMIENTOS', N'IdTratamiento', N'Id_Tratamiento'),
    (N'TRATAMIENTOS', N'IdEnfermedad', N'Id_Enfermedad'),
    (N'REGIONES', N'IdRegion', N'Id_Region'),
    (N'ENFERMEDADES_ENDEMICAS', N'IdEndemica', N'Id_Endemica'),
    (N'ENFERMEDADES_ENDEMICAS', N'IdRegion', N'Id_Region'),
    (N'ENFERMEDADES_ENDEMICAS', N'IdEnfermedad', N'Id_Enfermedad'),
    (N'PLANES', N'IdPlan', N'Id_Plan'),
    (N'PACIENTES', N'IdPaciente', N'Id_Paciente'),
    (N'PACIENTES', N'IdEnfermedadDiagnosticada', N'Id_EnfermedadDiagnosticada'),
    (N'PACIENTES', N'IdComorbilidad', N'Id_Comorbilidad'),
    (N'PACIENTES', N'IdTratamiento', N'Id_Tratamiento'),
    (N'PACIENTES', N'IdPlan', N'Id_Plan'),
    (N'HALLAZGOS_PACIENTE', N'IdPaciente', N'Id_Paciente'),
    (N'HALLAZGOS_PACIENTE', N'IdRegistro', N'Id_Registro'),
    (N'ATENCIONES_PACIENTE', N'IdAtencion', N'Id_Atencion'),
    (N'ATENCIONES_PACIENTE', N'IdPaciente', N'Id_Paciente'),
    (N'ATENCIONES_PACIENTE', N'IdDoctor', N'Id_Doctor'),
    (N'ATENCIONES_PACIENTE', N'IdHospital', N'Id_Hospital'),
    (N'IO_Complicaciones', N'IdEnfermedad', N'Id_Enfermedad'),
    (N'IO_Complicaciones', N'IdPaciente', N'Id_Paciente'),
    (N'IO_ResultadosEsperados', N'IdPaciente', N'Id_Paciente'),
    (N'IO_ResultadosEsperados', N'IdEnfermedad', N'Id_Enfermedad'),
    (N'IO_AntecNoPatolPacientes', N'IdPaciente', N'Id_Paciente'),
    (N'IO_AntecPatolPacientes', N'IdPaciente', N'Id_Paciente'),
    (N'IO_AntecPerinatPacientes', N'IdPaciente', N'Id_Paciente'),
    (N'IO_AntecQuiruAnestesPacientes', N'IdPaciente', N'Id_Paciente'),
    (N'IO_AntecParaClinicPacientes', N'IdPaciente', N'Id_Paciente');

DECLARE @Tabla SYSNAME, @Viejo SYSNAME, @Nuevo SYSNAME, @Ruta NVARCHAR(400), @Cambios INT = 0;
DECLARE renombres CURSOR LOCAL FAST_FORWARD FOR SELECT Tabla, Viejo, Nuevo FROM @Renombres;

BEGIN TRANSACTION;
OPEN renombres;
FETCH NEXT FROM renombres INTO @Tabla, @Viejo, @Nuevo;
WHILE @@FETCH_STATUS = 0
BEGIN
    -- Comparación exacta del nombre: la collation de la base no distingue IdMEDICO de IdMedico.
    IF EXISTS (SELECT 1 FROM sys.columns
               WHERE object_id = OBJECT_ID(N'dbo.' + @Tabla) AND name COLLATE Latin1_General_BIN2 = @Viejo)
       AND COL_LENGTH(N'dbo.' + @Tabla, @Nuevo) IS NULL
    BEGIN
        SET @Ruta = N'dbo.' + QUOTENAME(@Tabla) + N'.' + QUOTENAME(@Viejo);
        EXEC sys.sp_rename @Ruta, @Nuevo, N'COLUMN';
        SET @Cambios += 1;
    END
    FETCH NEXT FROM renombres INTO @Tabla, @Viejo, @Nuevo;
END
CLOSE renombres;
DEALLOCATE renombres;
COMMIT TRANSACTION;

PRINT CONCAT('Columnas renombradas: ', @Cambios, '.');
