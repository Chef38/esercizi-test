# fix-exports.ps1 — Riformatta module.exports su più righe
#
# Trasforma:
#   module.exports = { listFaqs, getFaqById, createFaq };
#
# In:
#   module.exports = {
#     listFaqs,
#     getFaqById,
#     createFaq,
#   };
#
# Eseguire dalla ROOT del progetto:
#   .\fix-exports.ps1

$root = Get-Location
$cartelle = @('controllers', 'service', 'repository', 'validator', 'routes', 'models')

Write-Host ""
Write-Host "🔄 Cerco module.exports su una riga..." -ForegroundColor Yellow
Write-Host ""

$modificati = 0

foreach ($cartella in $cartelle) {
  $percorso = Join-Path $root $cartella
  if (!(Test-Path $percorso)) { continue }

  $files = Get-ChildItem -Path $percorso -Filter "*.js" -Recurse
  foreach ($file in $files) {

    $contenuto = Get-Content $file.FullName -Raw
    
    # Cerca il pattern: module.exports = { ... }; tutto su una riga
    if ($contenuto -match 'module\.exports\s*=\s*\{([^}]+)\};') {
      
      $match   = $Matches[0]   # intera stringa trovata
      $interno = $Matches[1]   # contenuto dentro le {}

      # Divide le funzioni, rimuove spazi extra
      $funzioni = $interno -split ',' | ForEach-Object { $_.Trim() } | Where-Object { $_ -ne '' }

      # Costruisce il nuovo formato multiriga
      $nuovo = "module.exports = {`r`n"
      foreach ($fn in $funzioni) {
        $nuovo += "  $fn,`r`n"
      }
      $nuovo += "};"

      # Sostituisce nel contenuto
      $nuovoContenuto = $contenuto -replace [regex]::Escape($match), $nuovo

      if ($nuovoContenuto -ne $contenuto) {
        Set-Content -Path $file.FullName -Value $nuovoContenuto -NoNewline
        Write-Host "  ✅ $($file.FullName.Replace($root.Path + '\', ''))" -ForegroundColor Green
        $modificati++
      }
    }
  }
}

Write-Host ""
if ($modificati -eq 0) {
  Write-Host "ℹ️  Nessun file da modificare — tutti i module.exports sono già su più righe." -ForegroundColor Cyan
} else {
  Write-Host "✅ Modificati $modificati file." -ForegroundColor Green
}
Write-Host ""
