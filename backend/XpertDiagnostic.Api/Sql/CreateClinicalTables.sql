/*
    Tablas clínicas de XpertDiagnostic (base de conocimiento y pacientes de prueba).

    Cómo usarlo:
      1. En SSMS, seleccionar la base XpertDiagnostic (o ejecutar con sqlcmd -d XpertDiagnostic).
      2. Ejecutar este script: crea solo las tablas que no existen; no toca dbo.USUARIOS.
      3. Ejecutar SeedClinicalData.sql para cargar los datos de los CSV.

    Fuente: Sql/ClinicalData/IO_*.csv (Windows-1252). El script de carga se genera con
    Sql/Tools/generate_clinical_seed.py.

    Convenciones:
      - Los identificadores conservan el formato de los CSV: <AREA><n°enfermedad><TIPO><n°>,
        p. ej. CARDI00017SINTO00001. Los 10 primeros caracteres son la enfermedad.
      - Textos en NVARCHAR para conservar acentos.
      - Los catálogos (síntomas, signos, estudios...) pertenecen a una enfermedad; la relación
        paciente-hallazgo vive solo en HALLAZGOS_PACIENTE.
*/

SET NOCOUNT ON;

IF DB_NAME() IN (N'master', N'model', N'msdb', N'tempdb')
    THROW 50010, 'Selecciona la base de datos XpertDiagnostic antes de ejecutar este script.', 1;

/* ---------- Base de conocimiento ---------- */

IF OBJECT_ID(N'dbo.ENFERMEDADES', N'U') IS NULL
CREATE TABLE dbo.ENFERMEDADES (
    IdEnfermedad VARCHAR(10)   NOT NULL CONSTRAINT PK_ENFERMEDADES PRIMARY KEY,
    Nombre       NVARCHAR(150) NOT NULL
);

IF OBJECT_ID(N'dbo.SINTOMAS', N'U') IS NULL
CREATE TABLE dbo.SINTOMAS (
    IdSintoma      VARCHAR(20)   NOT NULL CONSTRAINT PK_SINTOMAS PRIMARY KEY,
    IdEnfermedad   VARCHAR(10)   NOT NULL CONSTRAINT FK_SINTOMAS_ENFERMEDADES REFERENCES dbo.ENFERMEDADES (IdEnfermedad),
    Descripcion    NVARCHAR(300) NOT NULL,
    LimiteInferior DECIMAL(12,2) NULL,
    LimiteSuperior DECIMAL(12,2) NULL,
    Unidades       NVARCHAR(30)  NULL
);

IF OBJECT_ID(N'dbo.SIGNOS', N'U') IS NULL
CREATE TABLE dbo.SIGNOS (
    IdSigno        VARCHAR(20)   NOT NULL CONSTRAINT PK_SIGNOS PRIMARY KEY,
    IdEnfermedad   VARCHAR(10)   NOT NULL CONSTRAINT FK_SIGNOS_ENFERMEDADES REFERENCES dbo.ENFERMEDADES (IdEnfermedad),
    Descripcion    NVARCHAR(300) NOT NULL,
    LimiteInferior DECIMAL(12,2) NULL,
    LimiteSuperior DECIMAL(12,2) NULL,
    Unidades       NVARCHAR(30)  NULL
);

IF OBJECT_ID(N'dbo.ESTUDIOS_LABORATORIO', N'U') IS NULL
CREATE TABLE dbo.ESTUDIOS_LABORATORIO (
    IdEstudio      VARCHAR(20)   NOT NULL CONSTRAINT PK_ESTUDIOS_LABORATORIO PRIMARY KEY,
    IdEnfermedad   VARCHAR(10)   NOT NULL CONSTRAINT FK_ESTUDIOS_LABORATORIO_ENFERMEDADES REFERENCES dbo.ENFERMEDADES (IdEnfermedad),
    Descripcion    NVARCHAR(300) NOT NULL,
    LimiteInferior DECIMAL(12,2) NULL,
    LimiteSuperior DECIMAL(12,2) NULL,
    Unidades       NVARCHAR(30)  NULL
);

IF OBJECT_ID(N'dbo.ESTUDIOS_DIAGNOSTICO_DIFERENCIAL', N'U') IS NULL
CREATE TABLE dbo.ESTUDIOS_DIAGNOSTICO_DIFERENCIAL (
    IdEstudio      VARCHAR(20)   NOT NULL CONSTRAINT PK_ESTUDIOS_DIAGNOSTICO_DIFERENCIAL PRIMARY KEY,
    IdEnfermedad   VARCHAR(10)   NOT NULL CONSTRAINT FK_ESTUDIOS_DIAGNOSTICO_DIFERENCIAL_ENFERMEDADES REFERENCES dbo.ENFERMEDADES (IdEnfermedad),
    Descripcion    NVARCHAR(300) NOT NULL,
    LimiteInferior DECIMAL(12,2) NULL,
    LimiteSuperior DECIMAL(12,2) NULL,
    Unidades       NVARCHAR(30)  NULL
);

IF OBJECT_ID(N'dbo.COMORBILIDADES', N'U') IS NULL
CREATE TABLE dbo.COMORBILIDADES (
    IdComorbilidad VARCHAR(20)   NOT NULL CONSTRAINT PK_COMORBILIDADES PRIMARY KEY,
    IdEnfermedad   VARCHAR(10)   NOT NULL CONSTRAINT FK_COMORBILIDADES_ENFERMEDADES REFERENCES dbo.ENFERMEDADES (IdEnfermedad),
    Descripcion    NVARCHAR(300) NOT NULL
);

IF OBJECT_ID(N'dbo.DEFECTOS_CONGENITOS', N'U') IS NULL
CREATE TABLE dbo.DEFECTOS_CONGENITOS (
    IdDefecto    VARCHAR(20)   NOT NULL CONSTRAINT PK_DEFECTOS_CONGENITOS PRIMARY KEY,
    IdEnfermedad VARCHAR(10)   NOT NULL CONSTRAINT FK_DEFECTOS_CONGENITOS_ENFERMEDADES REFERENCES dbo.ENFERMEDADES (IdEnfermedad),
    Descripcion  NVARCHAR(300) NOT NULL
);

IF OBJECT_ID(N'dbo.TRATAMIENTOS', N'U') IS NULL
CREATE TABLE dbo.TRATAMIENTOS (
    IdTratamiento VARCHAR(20)   NOT NULL CONSTRAINT PK_TRATAMIENTOS PRIMARY KEY,
    IdEnfermedad  VARCHAR(10)   NOT NULL CONSTRAINT FK_TRATAMIENTOS_ENFERMEDADES REFERENCES dbo.ENFERMEDADES (IdEnfermedad),
    Descripcion   NVARCHAR(300) NOT NULL,
    DosisMinima   DECIMAL(12,2) NULL,
    DosisMaxima   DECIMAL(12,2) NULL,
    Unidades      NVARCHAR(30)  NULL,
    CONSTRAINT CK_TRATAMIENTOS_DOSIS CHECK (DosisMinima IS NULL OR DosisMaxima IS NULL OR DosisMinima <= DosisMaxima)
);

IF OBJECT_ID(N'dbo.REGIONES', N'U') IS NULL
CREATE TABLE dbo.REGIONES (
    IdRegion VARCHAR(10)   NOT NULL CONSTRAINT PK_REGIONES PRIMARY KEY,
    Nombre   NVARCHAR(150) NOT NULL
);

/* IdEnfermedad sin llave foránea: los CSV citan enfermedades (CARDI00010, CARDI00020,
   CARDI00023) que todavía no están en ENFERMEDADES. Agregar la FK cuando existan. */
IF OBJECT_ID(N'dbo.ENFERMEDADES_ENDEMICAS', N'U') IS NULL
CREATE TABLE dbo.ENFERMEDADES_ENDEMICAS (
    IdEndemica   VARCHAR(20)   NOT NULL CONSTRAINT PK_ENFERMEDADES_ENDEMICAS PRIMARY KEY,
    IdRegion     VARCHAR(10)   NOT NULL CONSTRAINT FK_ENFERMEDADES_ENDEMICAS_REGIONES REFERENCES dbo.REGIONES (IdRegion),
    IdEnfermedad VARCHAR(10)   NOT NULL,
    Descripcion  NVARCHAR(300) NOT NULL
);

/* ---------- Pacientes ---------- */

IF OBJECT_ID(N'dbo.PLANES', N'U') IS NULL
CREATE TABLE dbo.PLANES (
    IdPlan      VARCHAR(10)    NOT NULL CONSTRAINT PK_PLANES PRIMARY KEY,
    PlanIndicado NVARCHAR(1000) NOT NULL,
    Pronostico  NVARCHAR(300)  NULL,
    Seguimiento NVARCHAR(300)  NULL
);

/* El número de expediente que muestra el buscador es IdPaciente. */
IF OBJECT_ID(N'dbo.PACIENTES', N'U') IS NULL
CREATE TABLE dbo.PACIENTES (
    IdPaciente                VARCHAR(10)   NOT NULL CONSTRAINT PK_PACIENTES PRIMARY KEY,
    NombreCompleto            NVARCHAR(150) NOT NULL,
    Edad                      INT           NOT NULL CONSTRAINT CK_PACIENTES_EDAD CHECK (Edad BETWEEN 0 AND 130),
    IdEnfermedadDiagnosticada VARCHAR(10)   NULL CONSTRAINT FK_PACIENTES_ENFERMEDAD_DIAG REFERENCES dbo.ENFERMEDADES (IdEnfermedad),
    IdComorbilidad            VARCHAR(20)   NULL CONSTRAINT FK_PACIENTES_COMORBILIDADES REFERENCES dbo.COMORBILIDADES (IdComorbilidad),
    IdTratamiento             VARCHAR(20)   NULL CONSTRAINT FK_PACIENTES_TRATAMIENTOS REFERENCES dbo.TRATAMIENTOS (IdTratamiento),
    IdPlan                    VARCHAR(10)   NULL CONSTRAINT FK_PACIENTES_PLANES REFERENCES dbo.PLANES (IdPlan)
);

/* IdRegistro apunta al catálogo que indica TipoHallazgo (SINTOMAS, SIGNOS, ...).
   Valor es 'presente' o una medición numérica en texto. */
IF OBJECT_ID(N'dbo.HALLAZGOS_PACIENTE', N'U') IS NULL
CREATE TABLE dbo.HALLAZGOS_PACIENTE (
    IdPaciente   VARCHAR(10)  NOT NULL CONSTRAINT FK_HALLAZGOS_PACIENTE_PACIENTES REFERENCES dbo.PACIENTES (IdPaciente),
    TipoHallazgo VARCHAR(20)  NOT NULL CONSTRAINT CK_HALLAZGOS_PACIENTE_TIPO
        CHECK (TipoHallazgo IN ('Sintoma', 'Signo', 'Complicacion', 'Estudio_lab', 'Estudio_diagdif', 'Comorbilidad')),
    IdRegistro   VARCHAR(20)  NOT NULL,
    Valor        NVARCHAR(50) NOT NULL,
    Unidades     NVARCHAR(30) NULL,
    CONSTRAINT PK_HALLAZGOS_PACIENTE PRIMARY KEY (IdPaciente, IdRegistro)
);

/* IdDoctor e IdHospital sin FK: aún no existen las tablas de doctores y hospitales. */
IF OBJECT_ID(N'dbo.ATENCIONES_PACIENTE', N'U') IS NULL
CREATE TABLE dbo.ATENCIONES_PACIENTE (
    IdAtencion INT           NOT NULL IDENTITY(1,1) CONSTRAINT PK_ATENCIONES_PACIENTE PRIMARY KEY,
    IdPaciente VARCHAR(10)   NOT NULL CONSTRAINT FK_ATENCIONES_PACIENTE_PACIENTES REFERENCES dbo.PACIENTES (IdPaciente),
    IdDoctor   VARCHAR(10)   NOT NULL,
    IdHospital VARCHAR(10)   NOT NULL,
    Motivo     NVARCHAR(200) NOT NULL
);

/* Complicaciones (reemplaza a COMPLICACIONES). Catálogo por enfermedad; IdPaciente indica a qué
   paciente de prueba se le registró (la relación que usa el sistema sigue en HALLAZGOS_PACIENTE). */
IF OBJECT_ID(N'dbo.IO_Complicaciones', N'U') IS NULL
CREATE TABLE dbo.IO_Complicaciones (
    Id_Complic   VARCHAR(20)   NOT NULL CONSTRAINT PK_IO_Complicaciones PRIMARY KEY,
    Complicac    NVARCHAR(255) NOT NULL,
    IdEnfermedad VARCHAR(10)   NOT NULL CONSTRAINT FK_IO_Complic_Enfermedades REFERENCES dbo.ENFERMEDADES (IdEnfermedad),
    IdPaciente   VARCHAR(10)   NULL     CONSTRAINT FK_IO_Complic_Pacientes REFERENCES dbo.PACIENTES (IdPaciente)
);

/* Respuesta correcta de cada paciente de prueba (reemplaza a RESULTADOS_ESPERADOS). Solo para
   evaluar al sistema experto: el motor de diagnóstico no debe leer esta tabla. */
IF OBJECT_ID(N'dbo.IO_ResultadosEsperados', N'U') IS NULL
CREATE TABLE dbo.IO_ResultadosEsperados (
    IdPaciente   VARCHAR(10)   NOT NULL CONSTRAINT PK_IO_ResultadosEsperados PRIMARY KEY
                               CONSTRAINT FK_IO_Resultados_Pacientes REFERENCES dbo.PACIENTES (IdPaciente),
    IdEnfermedad VARCHAR(10)   NOT NULL CONSTRAINT FK_IO_Resultados_Enfermedades REFERENCES dbo.ENFERMEDADES (IdEnfermedad),
    Enfeespera   NVARCHAR(150) NOT NULL
);

/* ---------- Interrogatorio de antecedentes (uno por paciente) ---------- */

IF OBJECT_ID(N'dbo.IO_AntecNoPatolPacientes', N'U') IS NULL
CREATE TABLE dbo.IO_AntecNoPatolPacientes (
    IdPaciente VARCHAR(10)   NOT NULL CONSTRAINT PK_IO_AntecNoPatol PRIMARY KEY
                             CONSTRAINT FK_IO_AntecNoPatol_Pacientes REFERENCES dbo.PACIENTES (IdPaciente),
    Tabaquismo BIT           NOT NULL,
    Alcoholism BIT           NULL,
    Toxicomans BIT           NULL,
    Biomasa    INT           NULL,
    TatuajPerf BIT           NULL,
    Herbolaria BIT           NULL,
    Transfusio BIT           NULL
);

IF OBJECT_ID(N'dbo.IO_AntecPatolPacientes', N'U') IS NULL
CREATE TABLE dbo.IO_AntecPatolPacientes (
    IdPaciente  VARCHAR(10)   NOT NULL CONSTRAINT PK_IO_AntecPatol PRIMARY KEY
                              CONSTRAINT FK_IO_AntecPatol_Pacientes REFERENCES dbo.PACIENTES (IdPaciente),
    Alergias    NVARCHAR(255) NULL,
    CroniDegen  NVARCHAR(255) NULL,
    Endocrinol  NVARCHAR(255) NULL,
    Pulmonar    NVARCHAR(255) NULL,
    Cardiologic NVARCHAR(255) NULL,
    Dislipidem  NVARCHAR(255) NULL,
    Dermatolog  NVARCHAR(255) NULL,
    Neurologic  NVARCHAR(255) NULL,
    Reumatolog  NVARCHAR(255) NULL,
    Otorrinola  NVARCHAR(255) NULL,
    Neumologic  NVARCHAR(255) NULL,
    Psiquiatri  NVARCHAR(255) NULL,
    Gastrointe  NVARCHAR(255) NULL,
    Osteomuscu  NVARCHAR(255) NULL,
    UroloRenal  NVARCHAR(255) NULL,
    Oftalmolog  NVARCHAR(255) NULL,
    Infectolog  NVARCHAR(255) NULL,
    Hematologi  NVARCHAR(255) NULL,
    Oncologico  NVARCHAR(255) NULL,
    Ginecologi  NVARCHAR(255) NULL,
    Traumatism  NVARCHAR(255) NULL
);

IF OBJECT_ID(N'dbo.IO_AntecPerinatPacientes', N'U') IS NULL
CREATE TABLE dbo.IO_AntecPerinatPacientes (
    IdPaciente VARCHAR(10)   NOT NULL CONSTRAINT PK_IO_AntecPerinat PRIMARY KEY
                             CONSTRAINT FK_IO_AntecPerinat_Pacientes REFERENCES dbo.PACIENTES (IdPaciente),
    ProductEmb NVARCHAR(255) NOT NULL,
    PartCesare NVARCHAR(255) NOT NULL,
    PesoNacer  INT           NOT NULL,
    TallaNacer DECIMAL(5,2)  NOT NULL,
    CrecYDesar NVARCHAR(255) NOT NULL,
    Vacunacion NVARCHAR(255) NOT NULL
);

IF OBJECT_ID(N'dbo.IO_AntecQuiruAnestesPacientes', N'U') IS NULL
CREATE TABLE dbo.IO_AntecQuiruAnestesPacientes (
    IdPaciente VARCHAR(10)   NOT NULL CONSTRAINT PK_IO_AntecQuiru PRIMARY KEY
                             CONSTRAINT FK_IO_AntecQuiru_Pacientes REFERENCES dbo.PACIENTES (IdPaciente),
    Cirugias   NVARCHAR(255) NOT NULL,
    Hospitaliz NVARCHAR(255) NOT NULL,
    Medicament NVARCHAR(255) NOT NULL
);

IF OBJECT_ID(N'dbo.IO_AntecParaClinicPacientes', N'U') IS NULL
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

PRINT 'Tablas clínicas listas.';
