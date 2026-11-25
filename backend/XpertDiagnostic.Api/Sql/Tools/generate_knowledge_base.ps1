<#
.SYNOPSIS
  Genera Sql/LoadKnowledgeBase.sql a partir de la base de conocimiento de la máquina de inferencia del
  equipo (tablas BDC_* de Visual FoxPro, P-160).

.DESCRIPTION
  Lee bdc_enfermedades, bdc_sintomas, bdc_signos y bdc_tratamientos (.DBF, página de códigos 1252) y
  escribe un script que agrega a ENFERMEDADES, SINTOMAS, SIGNOS y TRATAMIENTOS los registros que falten
  (por ID). No modifica ni borra los que ya existen.

  Reparaciones (los DBF se importaron de un CSV y una coma dentro del texto partió el campo):
  - La enfermedad de cada registro se toma de los 10 primeros caracteres de su ID (siempre correctos);
    13 signos traen otra en ID_ENFERME.
  - Texto que empieza con comillas: se une con el pedazo que quedó en la siguiente columna
    ("PELO ESCASO (PROTEÍNAS" + "biotina" → "PELO ESCASO (PROTEÍNAS, biotina…"). Si el pedazo no
    termina en comillas, el original se cortó y se agrega "…". En esas filas límites, unidades y dosis
    quedan en NULL porque traen restos del texto.
  - Límites y dosis solo se cargan si son números; si no, NULL.

.EXAMPLE
  powershell -File backend/XpertDiagnostic.Api/Sql/Tools/generate_knowledge_base.ps1 -DbfDir motor-inferencia
#>
param(
  [Parameter(Mandatory)][string]$DbfDir,
  [string]$Out = ''
)
$ErrorActionPreference = 'Stop'
# En PowerShell 5 $PSScriptRoot no existe todavía en los valores por defecto de param().
if (-not $Out) { $Out = Join-Path (Split-Path -Parent $MyInvocation.MyCommand.Path) '..\LoadKnowledgeBase.sql' }
$enc1252 = [Text.Encoding]::GetEncoding(1252)
$quote = [char]34

function Read-Dbf([string]$path) {
  $bytes = [IO.File]::ReadAllBytes($path)
  $count = [BitConverter]::ToInt32($bytes, 4)
  $headerLen = [BitConverter]::ToUInt16($bytes, 8)
  $recordLen = [BitConverter]::ToUInt16($bytes, 10)
  $fields = @(); $pos = 32
  while ($bytes[$pos] -ne 0x0D -and $pos -lt $headerLen) {
    $fields += [pscustomobject]@{ Name = $enc1252.GetString($bytes, $pos, 11).TrimEnd([char]0); Len = $bytes[$pos + 16] }
    $pos += 32
  }
  $rows = New-Object System.Collections.Generic.List[object]
  for ($r = 0; $r -lt $count; $r++) {
    $off = $headerLen + $r * $recordLen
    if ($bytes[$off] -eq 0x2A) { continue } # registro borrado
    $o = $off + 1; $rec = @{}
    foreach ($f in $fields) { $rec[$f.Name] = $enc1252.GetString($bytes, $o, $f.Len).Trim(); $o += $f.Len }
    $rows.Add($rec)
  }
  return $rows
}

# Une el texto partido por una coma. Devuelve @(texto, reparado).
function Repair-Text([string]$text, [string]$fragment) {
  if (-not $text.StartsWith($quote)) { return @($text.Trim(), $false) }
  $main = $text.TrimStart($quote).Trim()
  $piece = $fragment.Trim()
  if ($piece.EndsWith($quote)) { $piece = $piece.TrimEnd($quote).Trim() } elseif ($piece) { $piece += '…' }
  $joined = if ($piece) { "$main, $piece" } else { $main }
  return @($joined, $true)
}

function To-Number([string]$value) {
  $v = $value.Trim().Replace(',', '.')
  if ($v -match '^-?\d{1,10}(\.\d{1,2})?$') { return $v } else { return 'NULL' }
}
function To-Text([string]$value, [int]$max) {
  if ([string]::IsNullOrWhiteSpace($value)) { return 'NULL' }
  $v = $value.Trim(); if ($v.Length -gt $max) { $v = $v.Substring(0, $max) }
  return "N'" + $v.Replace("'", "''") + "'"
}

$diseases = Read-Dbf (Join-Path $DbfDir 'bdc_enfermedades.DBF')
$symptoms = Read-Dbf (Join-Path $DbfDir 'bdc_sintomas.DBF')
$signs = Read-Dbf (Join-Path $DbfDir 'bdc_signos.DBF')
$treatments = Read-Dbf (Join-Path $DbfDir 'bdc_tratamientos.DBF')

$known = @{}; foreach ($d in $diseases) { $known[$d.ID_ENFERME] = $true }
$stats = [ordered]@{ Enfermedades = $diseases.Count; Sintomas = 0; Signos = 0; Tratamientos = 0; TextosReparados = 0; SinEnfermedad = 0 }

function Catalog-Rows($rows, [string]$idField, [string]$textField, [string]$fragmentField, [string]$kind) {
  $out = New-Object System.Collections.Generic.List[string]
  foreach ($r in $rows) {
    $id = $r[$idField]; $disease = $id.Substring(0, 10)
    if (-not $known.ContainsKey($disease)) { $script:stats.SinEnfermedad++; continue }
    $fixed = Repair-Text $r[$textField] $r[$fragmentField]
    if ($fixed[1]) { $script:stats.TextosReparados++ }
    if ($kind -eq 'treatment') {
      $min = if ($fixed[1]) { 'NULL' } else { To-Number $r['DOSIS_MIN'] }
      $max = if ($fixed[1]) { 'NULL' } else { To-Number $r['DOSIS_MAX'] }
      $units = if ($fixed[1]) { 'NULL' } else { To-Text $r['UNIDADES'] 30 }
      $out.Add("('$id','$disease',$(To-Text $fixed[0] 300),$min,$max,$units)")
    } else {
      $low = if ($fixed[1]) { 'NULL' } else { To-Number $r['LIMITE_INF'] }
      $high = if ($fixed[1]) { 'NULL' } else { To-Number $r['LIMITE_SUP'] }
      $units = if ($fixed[1]) { 'NULL' } else { To-Text $r['UNIDADES'] 30 }
      $out.Add("('$id','$disease',$(To-Text $fixed[0] 300),$low,$high,$units)")
    }
  }
  return $out
}

$symptomRows = Catalog-Rows $symptoms 'ID_SINTOMA' 'SINTOMAS' 'LIMITE_INF' 'finding'; $stats.Sintomas = $symptomRows.Count
$signRows = Catalog-Rows $signs 'ID_SIGNOS' 'SIGNOS' 'LIMITE_INF' 'finding'; $stats.Signos = $signRows.Count
$treatmentRows = Catalog-Rows $treatments 'ID_TRATAM' 'TRATAMIENT' 'DOSIS_MAX' 'treatment'; $stats.Tratamientos = $treatmentRows.Count
$diseaseRows = $diseases | ForEach-Object { "('$($_.ID_ENFERME)',$(To-Text $_.ENFERMEDAD 150))" }

$sb = New-Object System.Text.StringBuilder
function Emit([string]$line) { [void]$script:sb.AppendLine($line) }
function Emit-Batches([string]$table, [string]$columns, $rows) {
  for ($i = 0; $i -lt $rows.Count; $i += 900) {
    $chunk = $rows[$i..([Math]::Min($i + 899, $rows.Count - 1))]
    Emit "INSERT INTO $table ($columns) VALUES"
    Emit (($chunk -join ",`r`n") + ';')
  }
}

Emit '/*'
Emit '    ARCHIVO GENERADO por Sql/Tools/generate_knowledge_base.ps1 a partir de las tablas BDC_* de la máquina'
Emit '    de inferencia del equipo (Visual FoxPro, P-160). No editar a mano: corregir los DBF y volver a generar.'
Emit ''
Emit '    Agrega a ENFERMEDADES, SINTOMAS, SIGNOS y TRATAMIENTOS los registros que falten (por ID), en una sola'
Emit '    transacción. No modifica ni borra los existentes, así que se puede correr varias veces.'
Emit '    Correr DESPUÉS de SeedClinicalData.sql: ese script borra y recarga las tablas clínicas.'
Emit ''
Emit "    Origen: $($stats.Enfermedades) enfermedades, $($stats.Sintomas) síntomas, $($stats.Signos) signos y $($stats.Tratamientos) tratamientos;"
Emit "    $($stats.TextosReparados) textos partidos por una coma se reunieron (ver el generador)."
Emit '*/'
Emit 'SET NOCOUNT ON;'
Emit 'SET XACT_ABORT ON;'
Emit ''
Emit "IF DB_NAME() IN (N'master', N'model', N'msdb', N'tempdb')"
Emit "    THROW 50010, 'Selecciona la base de datos XpertDiagnostic antes de ejecutar este script.', 1;"
Emit ''
Emit 'CREATE TABLE #Enfermedades (Id_Enfermedad VARCHAR(10) NOT NULL PRIMARY KEY, Nombre NVARCHAR(150) NOT NULL);'
Emit 'CREATE TABLE #Sintomas (Id VARCHAR(20) NOT NULL PRIMARY KEY, Id_Enfermedad VARCHAR(10) NOT NULL, Descripcion NVARCHAR(300) NOT NULL, LimiteInferior DECIMAL(12,2) NULL, LimiteSuperior DECIMAL(12,2) NULL, Unidades NVARCHAR(30) NULL);'
Emit 'CREATE TABLE #Signos (Id VARCHAR(20) NOT NULL PRIMARY KEY, Id_Enfermedad VARCHAR(10) NOT NULL, Descripcion NVARCHAR(300) NOT NULL, LimiteInferior DECIMAL(12,2) NULL, LimiteSuperior DECIMAL(12,2) NULL, Unidades NVARCHAR(30) NULL);'
Emit 'CREATE TABLE #Tratamientos (Id VARCHAR(20) NOT NULL PRIMARY KEY, Id_Enfermedad VARCHAR(10) NOT NULL, Descripcion NVARCHAR(300) NOT NULL, DosisMinima DECIMAL(12,2) NULL, DosisMaxima DECIMAL(12,2) NULL, Unidades NVARCHAR(30) NULL);'
Emit ''
Emit-Batches '#Enfermedades' 'Id_Enfermedad, Nombre' @($diseaseRows)
Emit-Batches '#Sintomas' 'Id, Id_Enfermedad, Descripcion, LimiteInferior, LimiteSuperior, Unidades' $symptomRows
Emit-Batches '#Signos' 'Id, Id_Enfermedad, Descripcion, LimiteInferior, LimiteSuperior, Unidades' $signRows
Emit-Batches '#Tratamientos' 'Id, Id_Enfermedad, Descripcion, DosisMinima, DosisMaxima, Unidades' $treatmentRows
Emit ''
Emit 'BEGIN TRANSACTION;'
Emit ''
Emit 'INSERT INTO dbo.ENFERMEDADES (Id_Enfermedad, Nombre)'
Emit 'SELECT t.Id_Enfermedad, t.Nombre FROM #Enfermedades AS t'
Emit 'WHERE NOT EXISTS (SELECT 1 FROM dbo.ENFERMEDADES AS e WHERE e.Id_Enfermedad = t.Id_Enfermedad);'
Emit "PRINT 'Enfermedades agregadas: ' + CAST(@@ROWCOUNT AS varchar(10));"
Emit ''
Emit 'INSERT INTO dbo.SINTOMAS (Id_Sintoma, Id_Enfermedad, Descripcion, LimiteInferior, LimiteSuperior, Unidades)'
Emit 'SELECT t.Id, t.Id_Enfermedad, t.Descripcion, t.LimiteInferior, t.LimiteSuperior, t.Unidades FROM #Sintomas AS t'
Emit 'WHERE NOT EXISTS (SELECT 1 FROM dbo.SINTOMAS AS s WHERE s.Id_Sintoma = t.Id);'
Emit "PRINT 'Síntomas agregados: ' + CAST(@@ROWCOUNT AS varchar(10));"
Emit ''
Emit 'INSERT INTO dbo.SIGNOS (Id_Signo, Id_Enfermedad, Descripcion, LimiteInferior, LimiteSuperior, Unidades)'
Emit 'SELECT t.Id, t.Id_Enfermedad, t.Descripcion, t.LimiteInferior, t.LimiteSuperior, t.Unidades FROM #Signos AS t'
Emit 'WHERE NOT EXISTS (SELECT 1 FROM dbo.SIGNOS AS s WHERE s.Id_Signo = t.Id);'
Emit "PRINT 'Signos agregados: ' + CAST(@@ROWCOUNT AS varchar(10));"
Emit ''
Emit 'INSERT INTO dbo.TRATAMIENTOS (Id_Tratamiento, Id_Enfermedad, Descripcion, DosisMinima, DosisMaxima, Unidades)'
Emit 'SELECT t.Id, t.Id_Enfermedad, t.Descripcion, t.DosisMinima, t.DosisMaxima, t.Unidades FROM #Tratamientos AS t'
Emit 'WHERE NOT EXISTS (SELECT 1 FROM dbo.TRATAMIENTOS AS s WHERE s.Id_Tratamiento = t.Id);'
Emit "PRINT 'Tratamientos agregados: ' + CAST(@@ROWCOUNT AS varchar(10));"
Emit ''
Emit 'COMMIT TRANSACTION;'
Emit ''
Emit 'DROP TABLE #Enfermedades; DROP TABLE #Sintomas; DROP TABLE #Signos; DROP TABLE #Tratamientos;'

[IO.File]::WriteAllText([IO.Path]::GetFullPath($Out), $sb.ToString(), (New-Object System.Text.UTF8Encoding($true)))
$stats.GetEnumerator() | ForEach-Object { "{0}: {1}" -f $_.Key, $_.Value }
"Escrito: $([IO.Path]::GetFullPath($Out))"
