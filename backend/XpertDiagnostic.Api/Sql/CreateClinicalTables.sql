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
    Id_Enfermedad VARCHAR(10)   NOT NULL CONSTRAINT PK_ENFERMEDADES PRIMARY KEY,
    Nombre       NVARCHAR(150) NOT NULL
);

IF OBJECT_ID(N'dbo.SINTOMAS', N'U') IS NULL
CREATE TABLE dbo.SINTOMAS (
    Id_Sintoma      VARCHAR(20)   NOT NULL CONSTRAINT PK_SINTOMAS PRIMARY KEY,
    Id_Enfermedad   VARCHAR(10)   NOT NULL CONSTRAINT FK_SINTOMAS_ENFERMEDADES REFERENCES dbo.ENFERMEDADES (Id_Enfermedad),
    Descripcion    NVARCHAR(300) NOT NULL,
    LimiteInferior DECIMAL(12,2) NULL,
    LimiteSuperior DECIMAL(12,2) NULL,
    Unidades       NVARCHAR(30)  NULL
);

IF OBJECT_ID(N'dbo.SIGNOS', N'U') IS NULL
CREATE TABLE dbo.SIGNOS (
    Id_Signo        VARCHAR(20)   NOT NULL CONSTRAINT PK_SIGNOS PRIMARY KEY,
    Id_Enfermedad   VARCHAR(10)   NOT NULL CONSTRAINT FK_SIGNOS_ENFERMEDADES REFERENCES dbo.ENFERMEDADES (Id_Enfermedad),
    Descripcion    NVARCHAR(300) NOT NULL,
    LimiteInferior DECIMAL(12,2) NULL,
    LimiteSuperior DECIMAL(12,2) NULL,
    Unidades       NVARCHAR(30)  NULL
);

IF OBJECT_ID(N'dbo.ESTUDIOS_LABORATORIO', N'U') IS NULL
CREATE TABLE dbo.ESTUDIOS_LABORATORIO (
    Id_Estudio      VARCHAR(20)   NOT NULL CONSTRAINT PK_ESTUDIOS_LABORATORIO PRIMARY KEY,
    Id_Enfermedad   VARCHAR(10)   NOT NULL CONSTRAINT FK_ESTUDIOS_LABORATORIO_ENFERMEDADES REFERENCES dbo.ENFERMEDADES (Id_Enfermedad),
    Descripcion    NVARCHAR(300) NOT NULL,
    LimiteInferior DECIMAL(12,2) NULL,
    LimiteSuperior DECIMAL(12,2) NULL,
    Unidades       NVARCHAR(30)  NULL
);

IF OBJECT_ID(N'dbo.ESTUDIOS_DIAGNOSTICO_DIFERENCIAL', N'U') IS NULL
CREATE TABLE dbo.ESTUDIOS_DIAGNOSTICO_DIFERENCIAL (
    Id_Estudio      VARCHAR(20)   NOT NULL CONSTRAINT PK_ESTUDIOS_DIAGNOSTICO_DIFERENCIAL PRIMARY KEY,
    Id_Enfermedad   VARCHAR(10)   NOT NULL CONSTRAINT FK_ESTUDIOS_DIAGNOSTICO_DIFERENCIAL_ENFERMEDADES REFERENCES dbo.ENFERMEDADES (Id_Enfermedad),
    Descripcion    NVARCHAR(300) NOT NULL,
    LimiteInferior DECIMAL(12,2) NULL,
    LimiteSuperior DECIMAL(12,2) NULL,
    Unidades       NVARCHAR(30)  NULL
);

IF OBJECT_ID(N'dbo.COMORBILIDADES', N'U') IS NULL
CREATE TABLE dbo.COMORBILIDADES (
    Id_Comorbilidad VARCHAR(20)   NOT NULL CONSTRAINT PK_COMORBILIDADES PRIMARY KEY,
    Id_Enfermedad   VARCHAR(10)   NOT NULL CONSTRAINT FK_COMORBILIDADES_ENFERMEDADES REFERENCES dbo.ENFERMEDADES (Id_Enfermedad),
    Descripcion    NVARCHAR(300) NOT NULL
);

IF OBJECT_ID(N'dbo.DEFECTOS_CONGENITOS', N'U') IS NULL
CREATE TABLE dbo.DEFECTOS_CONGENITOS (
    Id_Defecto    VARCHAR(20)   NOT NULL CONSTRAINT PK_DEFECTOS_CONGENITOS PRIMARY KEY,
    Id_Enfermedad VARCHAR(10)   NOT NULL CONSTRAINT FK_DEFECTOS_CONGENITOS_ENFERMEDADES REFERENCES dbo.ENFERMEDADES (Id_Enfermedad),
    Descripcion  NVARCHAR(300) NOT NULL
);

IF OBJECT_ID(N'dbo.TRATAMIENTOS', N'U') IS NULL
CREATE TABLE dbo.TRATAMIENTOS (
    Id_Tratamiento VARCHAR(20)   NOT NULL CONSTRAINT PK_TRATAMIENTOS PRIMARY KEY,
    Id_Enfermedad  VARCHAR(10)   NOT NULL CONSTRAINT FK_TRATAMIENTOS_ENFERMEDADES REFERENCES dbo.ENFERMEDADES (Id_Enfermedad),
    Descripcion   NVARCHAR(300) NOT NULL,
    DosisMinima   DECIMAL(12,2) NULL,
    DosisMaxima   DECIMAL(12,2) NULL,
    Unidades      NVARCHAR(30)  NULL,
    CONSTRAINT CK_TRATAMIENTOS_DOSIS CHECK (DosisMinima IS NULL OR DosisMaxima IS NULL OR DosisMinima <= DosisMaxima)
);

IF OBJECT_ID(N'dbo.REGIONES', N'U') IS NULL
CREATE TABLE dbo.REGIONES (
    Id_Region VARCHAR(10)   NOT NULL CONSTRAINT PK_REGIONES PRIMARY KEY,
    Nombre   NVARCHAR(150) NOT NULL
);

/* Id_Enfermedad sin llave foránea: los CSV citan enfermedades (CARDI00010, CARDI00020,
   CARDI00023) que todavía no están en ENFERMEDADES. Agregar la FK cuando existan. */
IF OBJECT_ID(N'dbo.ENFERMEDADES_ENDEMICAS', N'U') IS NULL
CREATE TABLE dbo.ENFERMEDADES_ENDEMICAS (
    Id_Endemica   VARCHAR(20)   NOT NULL CONSTRAINT PK_ENFERMEDADES_ENDEMICAS PRIMARY KEY,
    Id_Region     VARCHAR(10)   NOT NULL CONSTRAINT FK_ENFERMEDADES_ENDEMICAS_REGIONES REFERENCES dbo.REGIONES (Id_Region),
    Id_Enfermedad VARCHAR(10)   NOT NULL,
    Descripcion  NVARCHAR(300) NOT NULL
);

/* ---------- Pacientes ---------- */

IF OBJECT_ID(N'dbo.PLANES', N'U') IS NULL
CREATE TABLE dbo.PLANES (
    Id_Plan      VARCHAR(10)    NOT NULL CONSTRAINT PK_PLANES PRIMARY KEY,
    PlanIndicado NVARCHAR(1000) NOT NULL,
    Pronostico  NVARCHAR(300)  NULL,
    Seguimiento NVARCHAR(300)  NULL
);

/* El número de expediente que muestra el buscador es Id_Paciente. */
IF OBJECT_ID(N'dbo.PACIENTES', N'U') IS NULL
CREATE TABLE dbo.PACIENTES (
    Id_Paciente                VARCHAR(10)   NOT NULL CONSTRAINT PK_PACIENTES PRIMARY KEY,
    -- Nombre completo armado con Nombres + ApellidoPaterno + ApellidoMaterno (lo usan el buscador y el PDF).
    NombreCompleto            NVARCHAR(150) NOT NULL,
    -- Datos que captura el administrador al dar de alta al paciente (P-144). La edad se calcula de la fecha.
    Nombres                   NVARCHAR(60)  NULL,
    ApellidoPaterno           NVARCHAR(40)  NULL,
    ApellidoMaterno           NVARCHAR(40)  NULL,
    FechaNacimiento           DATE          NOT NULL CONSTRAINT CK_PACIENTES_FECHA_NACIMIENTO CHECK (FechaNacimiento >= '1890-01-01'),
    -- Obligatorio: un carácter, 'F' o 'M' en mayúscula (comparación binaria: la collation de la base no
    -- distingue mayúsculas).
    Sexo                      CHAR(1)       NOT NULL CONSTRAINT CK_PACIENTES_SEXO CHECK (Sexo COLLATE Latin1_General_BIN2 IN ('F', 'M')),
    Id_EnfermedadDiagnosticada VARCHAR(10)   NULL CONSTRAINT FK_PACIENTES_ENFERMEDAD_DIAG REFERENCES dbo.ENFERMEDADES (Id_Enfermedad),
    Id_Comorbilidad            VARCHAR(20)   NULL CONSTRAINT FK_PACIENTES_COMORBILIDADES REFERENCES dbo.COMORBILIDADES (Id_Comorbilidad),
    Id_Tratamiento             VARCHAR(20)   NULL CONSTRAINT FK_PACIENTES_TRATAMIENTOS REFERENCES dbo.TRATAMIENTOS (Id_Tratamiento),
    Id_Plan                    VARCHAR(10)   NULL CONSTRAINT FK_PACIENTES_PLANES REFERENCES dbo.PLANES (Id_Plan),
    -- Validación del diagnóstico por el médico internista (P-151): 'P' pendiente, 'C' confirmado, NULL
    -- sin enviar. Los médicos van sin llave foránea para conservar el historial si se elimina uno.
    EstadoValidacion           CHAR(1)       NULL CONSTRAINT CK_PACIENTES_ESTADO_VALIDACION
                                             CHECK (EstadoValidacion IS NULL OR EstadoValidacion COLLATE Latin1_General_BIN2 IN ('P', 'C')),
    Id_MedicoSolicitante       INT           NULL,
    FechaSolicitud             DATETIME2(0)  NULL,
    Id_MedicoValidador         INT           NULL,
    FechaValidacion            DATETIME2(0)  NULL
);

/* Id_Registro apunta al catálogo que indica TipoHallazgo (SINTOMAS, SIGNOS, ...).
   Valor es 'presente' o una medición numérica en texto. */
IF OBJECT_ID(N'dbo.HALLAZGOS_PACIENTE', N'U') IS NULL
CREATE TABLE dbo.HALLAZGOS_PACIENTE (
    Id_Paciente   VARCHAR(10)  NOT NULL CONSTRAINT FK_HALLAZGOS_PACIENTE_PACIENTES REFERENCES dbo.PACIENTES (Id_Paciente),
    TipoHallazgo VARCHAR(20)  NOT NULL CONSTRAINT CK_HALLAZGOS_PACIENTE_TIPO
        CHECK (TipoHallazgo IN ('Sintoma', 'Signo', 'Complicacion', 'Estudio_lab', 'Estudio_diagdif', 'Comorbilidad')),
    Id_Registro   VARCHAR(20)  NOT NULL,
    Valor        NVARCHAR(50) NOT NULL,
    Unidades     NVARCHAR(30) NULL,
    CONSTRAINT PK_HALLAZGOS_PACIENTE PRIMARY KEY (Id_Paciente, Id_Registro)
);

/* Id_Doctor e Id_Hospital sin FK: aún no existen las tablas de doctores y hospitales. */
IF OBJECT_ID(N'dbo.ATENCIONES_PACIENTE', N'U') IS NULL
CREATE TABLE dbo.ATENCIONES_PACIENTE (
    Id_Atencion INT           NOT NULL IDENTITY(1,1) CONSTRAINT PK_ATENCIONES_PACIENTE PRIMARY KEY,
    Id_Paciente VARCHAR(10)   NOT NULL CONSTRAINT FK_ATENCIONES_PACIENTE_PACIENTES REFERENCES dbo.PACIENTES (Id_Paciente),
    Id_Doctor   VARCHAR(10)   NOT NULL,
    Id_Hospital VARCHAR(10)   NOT NULL,
    Motivo     NVARCHAR(200) NOT NULL
);

/* Complicaciones (reemplaza a COMPLICACIONES). Catálogo por enfermedad; Id_Paciente indica a qué
   paciente de prueba se le registró (la relación que usa el sistema sigue en HALLAZGOS_PACIENTE). */
IF OBJECT_ID(N'dbo.IO_Complicaciones', N'U') IS NULL
CREATE TABLE dbo.IO_Complicaciones (
    Id_Complic   VARCHAR(20)   NOT NULL CONSTRAINT PK_IO_Complicaciones PRIMARY KEY,
    Complicac    NVARCHAR(255) NOT NULL,
    Id_Enfermedad VARCHAR(10)   NOT NULL CONSTRAINT FK_IO_Complic_Enfermedades REFERENCES dbo.ENFERMEDADES (Id_Enfermedad),
    Id_Paciente   VARCHAR(10)   NULL     CONSTRAINT FK_IO_Complic_Pacientes REFERENCES dbo.PACIENTES (Id_Paciente)
);

/* Respuesta correcta de cada paciente de prueba (reemplaza a RESULTADOS_ESPERADOS). Solo para
   evaluar al sistema experto: el motor de diagnóstico no debe leer esta tabla. */
IF OBJECT_ID(N'dbo.IO_ResultadosEsperados', N'U') IS NULL
CREATE TABLE dbo.IO_ResultadosEsperados (
    Id_Paciente   VARCHAR(10)   NOT NULL CONSTRAINT PK_IO_ResultadosEsperados PRIMARY KEY
                               CONSTRAINT FK_IO_Resultados_Pacientes REFERENCES dbo.PACIENTES (Id_Paciente),
    Id_Enfermedad VARCHAR(10)   NOT NULL CONSTRAINT FK_IO_Resultados_Enfermedades REFERENCES dbo.ENFERMEDADES (Id_Enfermedad),
    Enfeespera   NVARCHAR(150) NOT NULL
);

/* ---------- Interrogatorio de antecedentes (uno por paciente) ---------- */

IF OBJECT_ID(N'dbo.IO_AntecNoPatolPacientes', N'U') IS NULL
CREATE TABLE dbo.IO_AntecNoPatolPacientes (
    Id_Paciente VARCHAR(10)   NOT NULL CONSTRAINT PK_IO_AntecNoPatol PRIMARY KEY
                             CONSTRAINT FK_IO_AntecNoPatol_Pacientes REFERENCES dbo.PACIENTES (Id_Paciente),
    Tabaquismo BIT           NOT NULL,
    Alcoholism BIT           NULL,
    Toxicomans BIT           NULL,
    Biomasa    BIT           NULL,
    TatuajPerf BIT           NULL,
    Herbolaria BIT           NULL,
    Transfusio BIT           NULL
);

IF OBJECT_ID(N'dbo.IO_AntecPatolPacientes', N'U') IS NULL
CREATE TABLE dbo.IO_AntecPatolPacientes (
    Id_Paciente  VARCHAR(10)   NOT NULL CONSTRAINT PK_IO_AntecPatol PRIMARY KEY
                              CONSTRAINT FK_IO_AntecPatol_Pacientes REFERENCES dbo.PACIENTES (Id_Paciente),
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
    Id_Paciente VARCHAR(10)   NOT NULL CONSTRAINT PK_IO_AntecPerinat PRIMARY KEY
                             CONSTRAINT FK_IO_AntecPerinat_Pacientes REFERENCES dbo.PACIENTES (Id_Paciente),
    ProductEmb NVARCHAR(255) NOT NULL,
    PartCesare NVARCHAR(255) NOT NULL,
    PesoNacer  INT           NOT NULL,
    TallaNacer DECIMAL(5,2)  NOT NULL,
    CrecYDesar NVARCHAR(255) NOT NULL,
    Vacunacion NVARCHAR(255) NOT NULL
);

IF OBJECT_ID(N'dbo.IO_AntecQuiruAnestesPacientes', N'U') IS NULL
CREATE TABLE dbo.IO_AntecQuiruAnestesPacientes (
    Id_Paciente VARCHAR(10)   NOT NULL CONSTRAINT PK_IO_AntecQuiru PRIMARY KEY
                             CONSTRAINT FK_IO_AntecQuiru_Pacientes REFERENCES dbo.PACIENTES (Id_Paciente),
    Cirugias   NVARCHAR(255) NOT NULL,
    Hospitaliz NVARCHAR(255) NOT NULL,
    Medicament NVARCHAR(255) NOT NULL
);

IF OBJECT_ID(N'dbo.IO_AntecParaClinicPacientes', N'U') IS NULL
CREATE TABLE dbo.IO_AntecParaClinicPacientes (
    Id_Paciente VARCHAR(10)   NOT NULL CONSTRAINT PK_IO_AntecParaClinic PRIMARY KEY
                             CONSTRAINT FK_IO_AntecParaClinic_Pacientes REFERENCES dbo.PACIENTES (Id_Paciente),
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
