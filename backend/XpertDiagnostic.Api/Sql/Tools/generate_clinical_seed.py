"""Genera Sql/SeedClinicalData.sql a partir de los CSV de Sql/ClinicalData.

Uso (desde cualquier carpeta):
    python backend/XpertDiagnostic.Api/Sql/Tools/generate_clinical_seed.py

Qué hace:
  1. Lee los CSV en Windows-1252 (así los exporta la base original).
  2. Repara los caracteres que se perdieron como '?' cuando la corrección es inequívoca
     (µ, β y los ≤ de la clasificación TNM). Los ambiguos se dejan y se reportan.
  3. Valida llaves y referencias; si algo no cuadra, se detiene sin escribir nada.
  4. Escribe un script INSERT idempotente (borra y recarga las tablas clínicas en una transacción).
"""

from __future__ import annotations

import csv
import sys
from datetime import date, timedelta
from decimal import Decimal, InvalidOperation
from pathlib import Path

SQL_DIR = Path(__file__).resolve().parent.parent
DATA_DIR = SQL_DIR / "ClinicalData"
OUTPUT = SQL_DIR / "SeedClinicalData.sql"
SOURCE_ENCODING = "cp1252"

# Correcciones de caracteres perdidos. Solo las que no admiten otra lectura.
CHARACTER_FIXES = [
    ("?g/ml", "µg/ml"),
    ("?g/h", "µg/h"),
    ("/?l", "/µl"),
    ("Agonistas ?2", "Agonistas β2"),
    ("adrenérgicos ?", "adrenérgicos β"),
    ("tumor ?2 cm", "tumor ≤2 cm"),
    ("y ?3 cm", "y ≤3 cm"),
    ("y ?5 cm", "y ≤5 cm"),
    ("y ?7 cm", "y ≤7 cm"),
]

# IO_Pacientes.csv trae Edad pero no fecha de nacimiento ni sexo, y PACIENTES ya no guarda la edad
# (es una columna calculada de FechaNacimiento). Para los pacientes de prueba se inventan: la fecha
# cae entre 1 y 300 días antes del cumpleaños número Edad contado desde SEED_REFERENCE_DATE, así que
# da exactamente esa Edad ese día (y la edad sigue avanzando con el tiempo). Fija para que el script
# no cambie cada vez que se genera.
SEED_REFERENCE_DATE = date(2026, 11, 24)
# Sexo inventado según el nombre (ficticio) de cada paciente de prueba.
SEED_PATIENT_SEX = {
    "PACIE00001": "M", "PACIE00002": "F", "PACIE00003": "M", "PACIE00004": "F", "PACIE00005": "M",
    "PACIE00006": "F", "PACIE00007": "M", "PACIE00008": "F", "PACIE00009": "M", "PACIE00010": "F",
}


def invented_birth_date(patient_id: str, age: int) -> date:
    """Fecha de nacimiento con la que el paciente tiene `age` años en SEED_REFERENCE_DATE."""
    birthday = SEED_REFERENCE_DATE.replace(year=SEED_REFERENCE_DATE.year - age)
    days_before = int(patient_id[-5:]) * 37 % 300 + 1
    born = birthday - timedelta(days=days_before)
    assert age_on(born, SEED_REFERENCE_DATE) == age
    return born


def age_on(born: date, today: date) -> int:
    return today.year - born.year - ((today.month, today.day) < (born.month, born.day))


# Tipo de hallazgo -> (tabla, columna id) del catálogo al que apunta.
FINDING_CATALOGS = {
    "Sintoma": "SINTOMAS",
    "Signo": "SIGNOS",
    "Complicacion": "IO_Complicaciones",
    "Estudio_lab": "ESTUDIOS_LABORATORIO",
    "Estudio_diagdif": "ESTUDIOS_DIAGNOSTICO_DIFERENCIAL",
    "Comorbilidad": "COMORBILIDADES",
}

# Tablas que se vacían pero aún no tienen CSV (el interrogatorio de antecedentes se captura en la app).
DELETE_ONLY = {
    "IO_AntecNoPatolPacientes",
    "IO_AntecPatolPacientes",
    "IO_AntecPerinatPacientes",
    "IO_AntecQuiruAnestesPacientes",
    "IO_AntecParaClinicPacientes",
}

# Orden de borrado (hijos primero). La carga usa el orden inverso.
DELETE_ORDER = [
    *sorted(DELETE_ONLY),
    "IO_ResultadosEsperados",
    "IO_Complicaciones",
    "ATENCIONES_PACIENTE",
    "HALLAZGOS_PACIENTE",
    "PACIENTES",
    "PLANES",
    "ENFERMEDADES_ENDEMICAS",
    "REGIONES",
    "TRATAMIENTOS",
    "DEFECTOS_CONGENITOS",
    "COMORBILIDADES",
    "ESTUDIOS_DIAGNOSTICO_DIFERENCIAL",
    "ESTUDIOS_LABORATORIO",
    "SIGNOS",
    "SINTOMAS",
    "ENFERMEDADES",
]

errors: list[str] = []
unresolved: dict[str, None] = {}  # dict = conjunto ordenado (sin repetidos)


def fix_text(value: str) -> str:
    for broken, fixed in CHARACTER_FIXES:
        value = value.replace(broken, fixed)
    return value


def read(name: str) -> list[dict[str, str]]:
    path = DATA_DIR / f"IO_{name}.csv"
    with path.open(encoding=SOURCE_ENCODING, newline="") as handle:
        rows = [{key: fix_text(val.strip()) for key, val in row.items()} for row in csv.DictReader(handle)]
    for index, row in enumerate(rows, start=2):
        for key, val in row.items():
            if "?" in val:
                unresolved[f"IO_{name}.csv línea {index} ({key}): {val}"] = None
    return rows


def disease_of(record_id: str) -> str:
    return record_id[:10]


def decimal_or_none(value: str, where: str) -> Decimal | None:
    if value == "":
        return None
    try:
        return Decimal(value)
    except InvalidOperation:
        errors.append(f"{where}: '{value}' no es un número")
        return None


def sql(value: object) -> str:
    if value is None or value == "":
        return "NULL"
    if isinstance(value, (int, Decimal)):
        return str(value)
    if isinstance(value, date):
        return "'" + value.isoformat() + "'"
    return "N'" + str(value).replace("'", "''") + "'"


def unique(rows: list[dict[str, str]], key: str, table: str) -> set[str]:
    seen: set[str] = set()
    for row in rows:
        if row[key] in seen:
            errors.append(f"{table}: id duplicado {row[key]}")
        seen.add(row[key])
    return seen


def main() -> int:
    tables: dict[str, tuple[list[str], list[list[object]]]] = {}

    diseases = read("Enfermedades")
    disease_ids = unique(diseases, "Id_Enferme", "ENFERMEDADES")
    tables["ENFERMEDADES"] = (["IdEnfermedad", "Nombre"], [[d["Id_Enferme"], d["Enfermedad"]] for d in diseases])

    def require_disease(disease_id: str, where: str) -> None:
        if disease_id not in disease_ids:
            errors.append(f"{where}: la enfermedad {disease_id} no existe")

    catalog_ids: dict[str, set[str]] = {}
    catalog_text: dict[str, str] = {}

    def ranged_catalog(table, csv_name, id_col, text_col, low_col, high_col, explicit_disease_col=None):
        rows = read(csv_name)
        catalog_ids[table] = unique(rows, id_col, table)
        values = []
        for r in rows:
            disease = disease_of(r[id_col])
            if explicit_disease_col and r[explicit_disease_col] != disease:
                errors.append(f"{table} {r[id_col]}: Id_Enferme {r[explicit_disease_col]} no coincide con el prefijo")
            require_disease(disease, f"{table} {r[id_col]}")
            catalog_text[r[id_col]] = r[text_col]
            values.append([
                r[id_col], disease, r[text_col],
                decimal_or_none(r[low_col], f"{table} {r[id_col]}"),
                decimal_or_none(r[high_col], f"{table} {r[id_col]}"),
                r["Unidades"],
            ])
        return values

    range_columns = ["IdEnfermedad", "Descripcion", "LimiteInferior", "LimiteSuperior", "Unidades"]
    tables["SINTOMAS"] = (["IdSintoma", *range_columns],
                          ranged_catalog("SINTOMAS", "Sintomas", "Id_Sintoma", "Sintomas", "Limite_Inf", "Limite_Sup", "Id_Enferme"))
    tables["SIGNOS"] = (["IdSigno", *range_columns],
                        ranged_catalog("SIGNOS", "Signos", "Id_Signos", "Signos", "Limite_Inf", "Limite_Sup", "Id_Enferme"))
    tables["ESTUDIOS_LABORATORIO"] = (["IdEstudio", *range_columns],
                                      ranged_catalog("ESTUDIOS_LABORATORIO", "Labs", "Id_labs", "Estudio_lab", "Lim_Inf", "Lim_Sup"))
    tables["ESTUDIOS_DIAGNOSTICO_DIFERENCIAL"] = (["IdEstudio", *range_columns],
                                                  ranged_catalog("ESTUDIOS_DIAGNOSTICO_DIFERENCIAL", "LabsDiagDif", "Id_Estudio", "Nombre", "Lim_Inf", "Lim_Sup", "Id_Enferme"))

    def simple_catalog(table, csv_name, id_col, text_col, id_name, explicit_disease_col=None):
        rows = read(csv_name)
        catalog_ids[table] = unique(rows, id_col, table)
        values = []
        for r in rows:
            disease = disease_of(r[id_col])
            if explicit_disease_col and r[explicit_disease_col] != disease:
                errors.append(f"{table} {r[id_col]}: Id_Enferme {r[explicit_disease_col]} no coincide con el prefijo")
            require_disease(disease, f"{table} {r[id_col]}")
            catalog_text[r[id_col]] = r[text_col]
            values.append([r[id_col], disease, r[text_col]])
        tables[table] = ([id_name, "IdEnfermedad", "Descripcion"], values)
        return rows

    simple_catalog("COMORBILIDADES", "Comorbilidades", "Id_comorb", "Comorbilid", "IdComorbilidad")
    simple_catalog("DEFECTOS_CONGENITOS", "DefsCongenitos", "Id_Defecto", "Defecto", "IdDefecto", "Id_Enferme")

    treatments = read("Tratamientos")
    catalog_ids["TRATAMIENTOS"] = unique(treatments, "Id_Tratam", "TRATAMIENTOS")
    treatment_values = []
    for t in treatments:
        disease = disease_of(t["Id_Tratam"])
        require_disease(disease, f"TRATAMIENTOS {t['Id_Tratam']}")
        low = decimal_or_none(t["Dosis_MIN"], f"TRATAMIENTOS {t['Id_Tratam']}")
        high = decimal_or_none(t["Dosis_Max"], f"TRATAMIENTOS {t['Id_Tratam']}")
        if low is not None and high is not None and low > high:
            errors.append(f"TRATAMIENTOS {t['Id_Tratam']}: dosis mínima mayor que la máxima")
        treatment_values.append([t["Id_Tratam"], disease, t["Tratamient"], low, high, t["Unidades"]])
    tables["TRATAMIENTOS"] = (["IdTratamiento", "IdEnfermedad", "Descripcion", "DosisMinima", "DosisMaxima", "Unidades"], treatment_values)

    endemic = read("EnfermedadesEndemicas")
    regions: dict[str, str] = {}
    for e in endemic:
        if regions.setdefault(e["Id_Region"], e["Region"]) != e["Region"]:
            errors.append(f"REGIONES {e['Id_Region']}: nombre inconsistente")
    unique(endemic, "Id_Endemic", "ENFERMEDADES_ENDEMICAS")
    tables["REGIONES"] = (["IdRegion", "Nombre"], [[k, v] for k, v in regions.items()])
    tables["ENFERMEDADES_ENDEMICAS"] = (["IdEndemica", "IdRegion", "IdEnfermedad", "Descripcion"],
                                        [[e["Id_Endemic"], e["Id_Region"], disease_of(e["Id_Endemic"]), e["Endemica"]] for e in endemic])
    orphan_endemic = sorted({disease_of(e["Id_Endemic"]) for e in endemic} - disease_ids)

    plans = read("Planes")
    plan_ids = unique(plans, "Id_Plan", "PLANES")
    tables["PLANES"] = (["IdPlan", "PlanIndicado", "Pronostico", "Seguimiento"],
                        [[p["Id_Plan"], p["Plan"], p["Pronostico"], p["Seguimiento"]] for p in plans])

    patients = read("Pacientes")
    patient_ids = unique(patients, "Id_Pacient", "PACIENTES")
    patient_values = []
    for p in patients:
        where = f"PACIENTES {p['Id_Pacient']}"
        for col in ("Id_Enferme", "Id_Enfermp"):
            if p[col]:
                require_disease(p[col], where)
        if p["Id_comorb"] and p["Id_comorb"] not in catalog_ids["COMORBILIDADES"]:
            errors.append(f"{where}: comorbilidad {p['Id_comorb']} no existe")
        if p["Id_Tratam"] and p["Id_Tratam"] not in catalog_ids["TRATAMIENTOS"]:
            errors.append(f"{where}: tratamiento {p['Id_Tratam']} no existe")
        if p["Id_Plan"] and p["Id_Plan"] not in plan_ids:
            errors.append(f"{where}: plan {p['Id_Plan']} no existe")
        age = int(p["Edad"]) if p["Edad"].isdigit() else None
        if age is None:
            errors.append(f"{where}: edad '{p['Edad']}' inválida")
        sex = SEED_PATIENT_SEX.get(p["Id_Pacient"])
        if sex is None:
            errors.append(f"{where}: falta su sexo en SEED_PATIENT_SEX")
        patient_values.append([p["Id_Pacient"], p["Nombre"],
                               invented_birth_date(p["Id_Pacient"], age) if age is not None else None, sex,
                               p["Id_Enferme"], p["Id_comorb"], p["Id_Tratam"], p["Id_Plan"]])
    tables["PACIENTES"] = (["IdPaciente", "NombreCompleto", "FechaNacimiento", "Sexo",
                            "IdEnfermedadDiagnosticada", "IdComorbilidad", "IdTratamiento", "IdPlan"], patient_values)

    # IO_Complicaciones: catálogo por enfermedad que además marca al paciente de prueba (va después de PACIENTES).
    complications = read("Complicaciones")
    catalog_ids["IO_Complicaciones"] = unique(complications, "Id_Complic", "IO_Complicaciones")
    complication_values = []
    for c in complications:
        where = f"IO_Complicaciones {c['Id_Complic']}"
        disease = disease_of(c["Id_Complic"])
        if c["Id_Enferme"] != disease:
            errors.append(f"{where}: Id_Enferme {c['Id_Enferme']} no coincide con el prefijo")
        require_disease(disease, where)
        if c["Id_Pacient"] and c["Id_Pacient"] not in patient_ids:
            errors.append(f"{where}: paciente {c['Id_Pacient']} inexistente")
        catalog_text[c["Id_Complic"]] = c["Complicac"]
        complication_values.append([c["Id_Complic"], c["Complicac"], disease, c["Id_Pacient"]])
    tables["IO_Complicaciones"] = (["Id_Complic", "Complicac", "IdEnfermedad", "IdPaciente"], complication_values)

    findings = read("HallazgosPacientes")
    finding_keys: set[tuple[str, str]] = set()
    finding_values = []
    for f in findings:
        where = f"HALLAZGOS_PACIENTE {f['Id_Pacient']}/{f['Id_Registro']}"
        key = (f["Id_Pacient"], f["Id_Registro"])
        if key in finding_keys:
            errors.append(f"{where}: duplicado")
        finding_keys.add(key)
        if f["Id_Pacient"] not in patient_ids:
            errors.append(f"{where}: paciente inexistente")
        catalog = FINDING_CATALOGS.get(f["Tipo"])
        if catalog is None:
            errors.append(f"{where}: tipo '{f['Tipo']}' desconocido")
        elif f["Id_Registro"] not in catalog_ids[catalog]:
            errors.append(f"{where}: no existe en {catalog}")
        elif catalog_text[f["Id_Registro"]] != f["Descripcion"]:
            errors.append(f"{where}: la descripción no coincide con el catálogo")
        finding_values.append([f["Id_Pacient"], f["Tipo"], f["Id_Registro"], f["Valor_Paciente"], f["Unidades"]])
    tables["HALLAZGOS_PACIENTE"] = (["IdPaciente", "TipoHallazgo", "IdRegistro", "Valor", "Unidades"], finding_values)

    # Los catálogos repiten Id_Pacient; debe coincidir con HALLAZGOS_PACIENTE (que es la fuente que se carga).
    for csv_name, id_col in (("Sintomas", "Id_Sintoma"), ("Signos", "Id_Signos"), ("Labs", "Id_labs"),
                             ("LabsDiagDif", "Id_Estudio"), ("Complicaciones", "Id_Complic")):
        for r in read(csv_name):
            if r["Id_Pacient"] and (r["Id_Pacient"], r[id_col]) not in finding_keys:
                errors.append(f"IO_{csv_name}.csv {r[id_col]}: marca a {r['Id_Pacient']} pero no está en HallazgosPacientes")

    visits = read("AtencionPacientes")
    for v in visits:
        if v["Id_Pacient"] not in patient_ids:
            errors.append(f"ATENCIONES_PACIENTE: paciente {v['Id_Pacient']} inexistente")
    tables["ATENCIONES_PACIENTE"] = (["IdPaciente", "IdDoctor", "IdHospital", "Motivo"],
                                     [[v["Id_Pacient"], v["Id_Doctor"], v["Id_Hospita"], v["Motivo"]] for v in visits])

    expected = read("ResultadosEsperados")
    for e in expected:
        if e["Id_Pacient"] not in patient_ids:
            errors.append(f"IO_ResultadosEsperados: paciente {e['Id_Pacient']} inexistente")
        require_disease(e["Id_Enferme_Esperado"], f"IO_ResultadosEsperados {e['Id_Pacient']}")
    tables["IO_ResultadosEsperados"] = (["IdPaciente", "IdEnfermedad", "Enfeespera"],
                                        [[e["Id_Pacient"], e["Id_Enferme_Esperado"], e["Enfermedad_Esperada"]] for e in expected])

    if errors:
        print("No se generó el script. Errores en los CSV:", file=sys.stderr)
        for message in errors:
            print(f"  - {message}", file=sys.stderr)
        return 1

    lines = [
        "/*",
        "    ARCHIVO GENERADO por Sql/Tools/generate_clinical_seed.py. No editar a mano:",
        "    corregir los CSV de Sql/ClinicalData y volver a generar.",
        "",
        "    Borra y recarga las tablas clínicas dentro de una transacción (no toca dbo.USUARIOS).",
        "    Requiere haber ejecutado antes CreateClinicalTables.sql en la base XpertDiagnostic.",
        "*/",
        "",
        "SET NOCOUNT ON;",
        "SET XACT_ABORT ON;",
        "",
        "IF DB_NAME() IN (N'master', N'model', N'msdb', N'tempdb')",
        "    THROW 50010, 'Selecciona la base de datos XpertDiagnostic antes de ejecutar este script.', 1;",
        "",
        "BEGIN TRANSACTION;",
        "",
    ]
    lines += [f"DELETE FROM dbo.{table};" for table in DELETE_ORDER]
    lines.append("")

    for table in reversed(DELETE_ORDER):
        if table in DELETE_ONLY:
            continue
        columns, rows = tables[table]
        lines.append(f"-- {table}: {len(rows)} filas")
        header = f"INSERT INTO dbo.{table} ({', '.join(columns)}) VALUES"
        # SQL Server admite hasta 1000 filas por INSERT ... VALUES.
        for start in range(0, len(rows), 500):
            chunk = rows[start:start + 500]
            lines.append(header)
            lines += [f"    ({', '.join(sql(v) for v in row)}){',' if i < len(chunk) - 1 else ';'}"
                      for i, row in enumerate(chunk)]
        lines.append("")

    lines += ["COMMIT TRANSACTION;", "", "PRINT 'Datos clínicos cargados.';", ""]
    # UTF-8 con BOM: SSMS y sqlcmd lo reconocen sin configurar la codificación.
    OUTPUT.write_text("\n".join(lines), encoding="utf-8-sig")

    total = sum(len(rows) for _, rows in tables.values())
    print(f"Generado {OUTPUT.name}: {len(tables)} tablas, {total} filas.")
    if orphan_endemic:
        print(f"Aviso: ENFERMEDADES_ENDEMICAS cita enfermedades sin registrar: {', '.join(orphan_endemic)}")
    if unresolved:
        print("Aviso: textos con '?' que no se corrigieron (revisar en la fuente):")
        for message in unresolved:
            print(f"  - {message}")
    return 0


if __name__ == "__main__":
    sys.exit(main())
