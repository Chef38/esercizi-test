<#
    Uninstall_ClaudeCode.ps1
    ------------------------
    Rimuove Claude Code e ogni artefatto lasciato da Install-ClaudeCode.ps1:
      1. Rileva Claude Code ovunque (npm globale, native installer, PATH) + config/cache.
      2. Chiede conferma (elenco completo di cosa verra' rimosso).
      3. Disinstalla: npm uninstall -g, binari native, shim, config (~\.claude, .claude.json),
         cache CLI, temp, markitdown (pip uninstall + repo clonata), voci PATH utente.
      4. Verifica finale: 'claude' non piu' risolvibile + scansione per nome (claude|anthropic)
         nelle radici tipiche: i residui vengono SEGNALATI, mai cancellati alla cieca.

    Uso:
        powershell -ExecutionPolicy Bypass -File .\Uninstall_ClaudeCode.ps1
        ...\Uninstall_ClaudeCode.ps1 -DryRun          # mostra cosa farebbe, non tocca nulla
        ...\Uninstall_ClaudeCode.ps1 -Force           # niente richiesta di conferma
        ...\Uninstall_ClaudeCode.ps1 -RemoveScripts   # elimina anche Install-ClaudeCode.ps1,
                                                      # i log claude-diag_*.log e SE STESSO
        ...\Uninstall_ClaudeCode.ps1 -RemovePython    # disinstalla anche Python (winget)
        ...\Uninstall_ClaudeCode.ps1 -SkipScan        # salta la scansione finale

    NON tocca: cartelle .claude dentro i tuoi progetti (config di progetto), l'app
    desktop Claude se presente (ha il suo uninstaller: viene solo segnalata).

    Windows PowerShell 5.1 compatibile.
#>

[CmdletBinding()]
param(
    [switch]$DryRun,
    [switch]$Force,
    [switch]$RemoveScripts,
    [switch]$RemovePython,
    [switch]$SkipScan,
    [string]$MarkitdownDir = "$env:USERPROFILE\markitdown",
    [string]$LogFile = ""
)

# Continue, non Stop: molti exe nativi (npm/pip/winget) scrivono su stderr e in PS 5.1
# con EAP=Stop qualunque redirect di stderr diventa errore terminante (visto nell'install).
$ErrorActionPreference = "Continue"

function Write-Log($t) {
    $line = "{0} {1}" -f (Get-Date -Format "HH:mm:ss"), $t
    try { Add-Content -Path $script:LogFile -Value $line -Encoding UTF8 } catch {}
}
function Write-Head($t) { Write-Host ""; Write-Host "==== $t ====" -ForegroundColor Cyan; Write-Log "==== $t ====" }
function Write-Ok($t)   { Write-Host "  [OK]   $t" -ForegroundColor Green;  Write-Log "[OK]    $t" }
function Write-Warn($t) { Write-Host "  [!]    $t" -ForegroundColor Yellow; Write-Log "[WARN]  $t" }
function Write-Err($t)  { Write-Host "  [ERR]  $t" -ForegroundColor Red;    Write-Log "[ERR]   $t" }

function Update-SessionPath {
    $m = [Environment]::GetEnvironmentVariable("Path", "Machine")
    $u = [Environment]::GetEnvironmentVariable("Path", "User")
    $env:Path = (@($m, $u) | Where-Object { $_ }) -join ";"
}

# Rimozione singolo path, rispetta -DryRun. Ritorna $true se il path esisteva.
function Remove-Target([string]$Path, [string]$Label) {
    if (-not (Test-Path -LiteralPath $Path)) { return $false }
    if ($script:DryRun) { Write-Warn "[DRY] rimuoverei: $Label -> $Path"; return $true }
    try {
        Remove-Item -LiteralPath $Path -Recurse -Force -Confirm:$false -ErrorAction Stop
        Write-Ok "rimosso: $Label -> $Path"
    } catch {
        Write-Err "NON rimosso $Path : $($_.Exception.Message)"
    }
    return $true
}

# ================= LOG =================
if (-not $LogFile) {
    $LogFile = Join-Path $env:TEMP ("uninstall-claude_{0}.log" -f (Get-Date -Format 'yyyyMMdd_HHmmss'))
}
Write-Log "===== RUN $(Get-Date -Format 'yyyy-MM-dd HH:mm:ss') su $env:COMPUTERNAME (utente $env:USERNAME) DryRun=$DryRun ====="
Write-Host "Log: $LogFile" -ForegroundColor DarkGray

# ================= FASE 1: RILEVAMENTO =================
Write-Head "FASE 1 - Rilevamento artefatti Claude/Anthropic"
Update-SessionPath

$npmPkgDir = Join-Path $env:APPDATA "npm\node_modules\@anthropic-ai\claude-code"
$npmFound  = Test-Path $npmPkgDir

# Tutti i percorsi noti in cui Claude Code lascia tracce su Windows.
$targets = @(
    @{ Label = "npm: shim claude.cmd";       Path = (Join-Path $env:APPDATA "npm\claude.cmd") }
    @{ Label = "npm: shim claude (sh)";      Path = (Join-Path $env:APPDATA "npm\claude") }
    @{ Label = "npm: shim claude.ps1";       Path = (Join-Path $env:APPDATA "npm\claude.ps1") }
    @{ Label = "npm: pacchetto residuo";     Path = $npmPkgDir }
    @{ Label = "npm: scope @anthropic-ai";   Path = (Join-Path $env:APPDATA "npm\node_modules\@anthropic-ai") }
    @{ Label = "native: binario";            Path = (Join-Path $env:USERPROFILE ".local\bin\claude.exe") }
    @{ Label = "native: dati/versioni";      Path = (Join-Path $env:USERPROFILE ".local\share\claude") }
    @{ Label = "native: Programs\claude";    Path = (Join-Path $env:LOCALAPPDATA "Programs\claude") }
    @{ Label = "config/stato (~\.claude)";   Path = (Join-Path $env:USERPROFILE ".claude") }
    @{ Label = "config json";                Path = (Join-Path $env:USERPROFILE ".claude.json") }
    @{ Label = "config json backup";         Path = (Join-Path $env:USERPROFILE ".claude.json.backup") }
    @{ Label = "config (XDG)";               Path = (Join-Path $env:USERPROFILE ".config\claude") }
    @{ Label = "cache (~\.cache\claude)";    Path = (Join-Path $env:USERPROFILE ".cache\claude") }
    @{ Label = "plugin claude-mem (dati)";   Path = (Join-Path $env:USERPROFILE ".claude-mem") }
    @{ Label = "cache CLI nodejs";           Path = (Join-Path $env:LOCALAPPDATA "claude-cli-nodejs") }
    @{ Label = "temp/scratchpad sessioni";   Path = (Join-Path $env:LOCALAPPDATA "Temp\claude") }
    @{ Label = "repo markitdown clonata";    Path = $MarkitdownDir }
)

# Percorsi con versione/nome variabile: li risolvo ora e li aggiungo ai target.
$globs = @(
    @{ Label = "VS Code: estensione claude-code"; Pattern = (Join-Path $env:USERPROFILE ".vscode\extensions\anthropic.claude-code-*") }
    @{ Label = "VS Code: cache VSIX";             Pattern = (Join-Path $env:APPDATA "Code\CachedExtensionVSIXs\anthropic.claude-code-*") }
    @{ Label = "collegamento Recent";             Pattern = (Join-Path $env:APPDATA "Microsoft\Windows\Recent\*Claude*.lnk") }
)
foreach ($g in $globs) {
    foreach ($m in @(Get-Item -Path $g.Pattern -Force -ErrorAction SilentlyContinue)) {
        $targets += @{ Label = $g.Label; Path = $m.FullName }
    }
}

$found = @($targets | Where-Object { Test-Path -LiteralPath $_.Path })

$claudeCmd = Get-Command claude -ErrorAction SilentlyContinue
if ($claudeCmd) { Write-Warn "claude nel PATH: $($claudeCmd.Source)" }
if ($npmFound)  { Write-Warn "pacchetto npm globale @anthropic-ai/claude-code presente" }
foreach ($t in $found) { Write-Warn ("{0,-28} {1}" -f $t.Label, $t.Path) }

# pip: markitdown installato?
$pyCmd = $null
foreach ($c in @("py", "python")) {
    if (Get-Command $c -ErrorAction SilentlyContinue) {
        & $c --version *> $null
        if ($LASTEXITCODE -eq 0) { $pyCmd = $c; break }
    }
}
$pipHasMarkitdown = $false
if ($pyCmd) {
    & $pyCmd -m pip show markitdown *> $null
    if ($LASTEXITCODE -eq 0) { $pipHasMarkitdown = $true; Write-Warn "pip: pacchetto markitdown installato" }
}

# App desktop Claude: NON e' roba dell'install script, solo segnalazione.
if (Test-Path (Join-Path $env:LOCALAPPDATA "AnthropicClaude")) {
    Write-Warn "Trovata app DESKTOP Claude ($env:LOCALAPPDATA\AnthropicClaude): non la tocco."
    Write-Warn "Rimuovila da Impostazioni > App oppure: winget uninstall Anthropic.Claude"
}

if (-not $claudeCmd -and -not $npmFound -and $found.Count -eq 0 -and -not $pipHasMarkitdown) {
    Write-Ok "Nessun artefatto trovato: macchina gia' pulita."
    if (-not $SkipScan) { Write-Host "  (eseguo comunque la scansione di verifica...)" }
    else { return }
}

# ================= CONFERMA =================
if (-not $DryRun -and -not $Force) {
    Write-Head "Conferma"
    Write-Host "  Verranno RIMOSSI DEFINITIVAMENTE gli elementi elencati sopra," -ForegroundColor Yellow
    Write-Host "  incluse config e cronologia sessioni di Claude Code (~\.claude)." -ForegroundColor Yellow
    $answer = Read-Host "  Digita SI per procedere (qualsiasi altra cosa annulla)"
    if ($answer -ne "SI") { Write-Head "Annullato"; Write-Host "  Nessuna modifica effettuata."; return }
}

# ================= FASE 2: DISINSTALLAZIONE CLAUDE CODE =================
Write-Head "FASE 2 - Disinstallazione Claude Code"

# Processi claude in esecuzione bloccherebbero la cancellazione dei file.
$procs = Get-Process -Name "claude*" -ErrorAction SilentlyContinue
if ($procs) {
    if ($DryRun) { Write-Warn "[DRY] terminerei processi: $(($procs | Select-Object -ExpandProperty Name) -join ', ')" }
    else { $procs | Stop-Process -Force -ErrorAction SilentlyContinue; Write-Ok "processi claude terminati" }
}

# Estensione VS Code: se c'e' la CLI 'code' uso l'uninstall ufficiale (aggiorna anche
# extensions.json); la cartella residua e' comunque tra i target della Fase 3.
$vsixInstalled = @(Get-Item -Path (Join-Path $env:USERPROFILE ".vscode\extensions\anthropic.claude-code-*") -Force -ErrorAction SilentlyContinue)
if ($vsixInstalled.Count -gt 0 -and (Get-Command code -ErrorAction SilentlyContinue)) {
    if ($DryRun) { Write-Warn "[DRY] eseguirei: code --uninstall-extension anthropic.claude-code" }
    else {
        & code --uninstall-extension anthropic.claude-code *> $null
        if ($LASTEXITCODE -eq 0) { Write-Ok "estensione VS Code disinstallata" }
        else { Write-Warn "code --uninstall-extension exit ${LASTEXITCODE}: procedo con pulizia manuale" }
    }
}

# npm uninstall (rimuove pacchetto + shim in modo pulito, prima della pulizia manuale)
if ($npmFound) {
    if (Get-Command npm -ErrorAction SilentlyContinue) {
        if ($DryRun) { Write-Warn "[DRY] eseguirei: npm uninstall -g @anthropic-ai/claude-code" }
        else {
            $p = Start-Process -FilePath "cmd.exe" `
                 -ArgumentList "/c", "npm uninstall -g @anthropic-ai/claude-code" `
                 -Wait -PassThru -NoNewWindow
            if ($p.ExitCode -eq 0) { Write-Ok "npm uninstall -g completato" }
            else { Write-Warn "npm uninstall exit $($p.ExitCode): procedo con pulizia manuale" }
        }
    } else { Write-Warn "npm non trovato: pulizia manuale dei file npm" }
}

# ================= FASE 3: RIMOZIONE FILE/CARTELLE =================
Write-Head "FASE 3 - Rimozione file, config e cache"
$removedAny = $false
foreach ($t in $targets) {
    if (Remove-Target -Path $t.Path -Label $t.Label) { $removedAny = $true }
}
if (-not $removedAny) { Write-Ok "nessun file/cartella da rimuovere" }

# pip uninstall markitdown
if ($pipHasMarkitdown) {
    if ($DryRun) { Write-Warn "[DRY] eseguirei: $pyCmd -m pip uninstall -y markitdown" }
    else {
        & $pyCmd -m pip uninstall -y markitdown
        if ($LASTEXITCODE -eq 0) { Write-Ok "pip: markitdown disinstallato" }
        else { Write-Err "pip uninstall markitdown fallito (exit $LASTEXITCODE)" }
    }
}

# Python via winget: solo su richiesta esplicita (potrebbe servirti per altro)
if ($RemovePython) {
    if (Get-Command winget -ErrorAction SilentlyContinue) {
        if ($DryRun) { Write-Warn "[DRY] eseguirei: winget uninstall --id Python.Python.3.12" }
        else {
            winget uninstall --id Python.Python.3.12 --silent --accept-source-agreements
            if ($LASTEXITCODE -eq 0) { Write-Ok "Python disinstallato (winget)" }
            else { Write-Warn "winget uninstall Python exit ${LASTEXITCODE}: forse non installato via winget" }
        }
    } else { Write-Warn "-RemovePython richiesto ma winget non disponibile" }
}

# ================= FASE 4: PULIZIA PATH UTENTE =================
Write-Head "FASE 4 - Pulizia PATH utente"
$userPath = [Environment]::GetEnvironmentVariable("Path", "User")
if ($userPath) {
    $localBin = Join-Path $env:USERPROFILE ".local\bin"
    $keep = @(); $dropped = @()
    foreach ($entry in ($userPath -split ';' | Where-Object { $_ })) {
        $drop = $false
        if ($entry -match '(?i)claude') { $drop = $true }
        elseif ($entry.TrimEnd('\') -ieq $localBin) {
            # aggiunta dal native installer: la tolgo solo se ormai vuota o inesistente
            $stillUsed = (Test-Path -LiteralPath $entry) -and
                         (Get-ChildItem -LiteralPath $entry -Force -ErrorAction SilentlyContinue | Select-Object -First 1)
            if (-not $stillUsed) { $drop = $true }
        }
        if ($drop) { $dropped += $entry } else { $keep += $entry }
    }
    if ($dropped.Count -eq 0) { Write-Ok "nessuna voce PATH da rimuovere" }
    elseif ($DryRun) { $dropped | ForEach-Object { Write-Warn "[DRY] toglierei dal PATH utente: $_" } }
    else {
        [Environment]::SetEnvironmentVariable("Path", ($keep -join ';'), "User")
        $dropped | ForEach-Object { Write-Ok "tolto dal PATH utente: $_" }
    }
} else { Write-Ok "PATH utente vuoto: niente da fare" }

# ================= FASE 5: SCRIPT E LOG DELL'INSTALLAZIONE =================
Write-Head "FASE 5 - Script e log dell'installazione"
$scriptDir = if ($PSCommandPath) { Split-Path -Parent $PSCommandPath } else { (Get-Location).Path }
$diagLogs = @(Get-ChildItem -Path $scriptDir -Filter "claude-diag_*.log" -File -ErrorAction SilentlyContinue)
foreach ($l in $diagLogs) { Remove-Target -Path $l.FullName -Label "log diagnostica install" | Out-Null }

# log di esecuzioni precedenti di QUESTO uninstaller (tengo solo quello corrente)
$oldLogs = @(Get-ChildItem -Path $env:TEMP -Filter "uninstall-claude_*.log" -File -ErrorAction SilentlyContinue |
             Where-Object { $_.FullName -ne $LogFile })
foreach ($l in $oldLogs) { Remove-Target -Path $l.FullName -Label "log uninstall precedente" | Out-Null }

$installScript = Join-Path $scriptDir "Install-ClaudeCode.ps1"
if ($RemoveScripts) {
    Remove-Target -Path $installScript -Label "script di installazione" | Out-Null
} elseif (Test-Path $installScript) {
    Write-Warn "Install-ClaudeCode.ps1 ancora presente: rilancia con -RemoveScripts per eliminarlo (con questo uninstaller)."
}

# ================= FASE 6: VERIFICA FINALE =================
Write-Head "FASE 6 - Verifica finale"
Update-SessionPath
$claudeCmd = Get-Command claude -ErrorAction SilentlyContinue
if ($claudeCmd) { Write-Err "'claude' ANCORA risolvibile: $($claudeCmd.Source)" }
else { Write-Ok "'claude' non piu' risolvibile dal PATH" }

$leftover = @($targets | Where-Object { Test-Path -LiteralPath $_.Path })
if ($leftover.Count -gt 0 -and -not $DryRun) {
    foreach ($t in $leftover) { Write-Err "residuo: $($t.Path)" }
} elseif (-not $DryRun) { Write-Ok "tutti i percorsi noti risultano rimossi" }

if (-not $SkipScan) {
    Write-Host "  Scansione per nome (claude|anthropic) nelle radici tipiche..." -ForegroundColor Gray
    # Solo REPORT: i match vanno valutati a mano (possono essere config .claude dei
    # tuoi progetti o file personali che citano Claude nel nome).
    $roots = @(
        @{ Path = $env:LOCALAPPDATA; Depth = 2 }
        @{ Path = $env:APPDATA;      Depth = 3 }
        @{ Path = $env:ProgramData;  Depth = 1 }
        @{ Path = $env:ProgramFiles; Depth = 1 }
        @{ Path = $env:USERPROFILE;  Depth = 1 }   # profondita' 1: evita di frugare nei tuoi progetti
        @{ Path = (Join-Path $env:USERPROFILE ".vscode\extensions"); Depth = 1 }
    )
    $selfPaths = @($PSCommandPath, $LogFile) | Where-Object { $_ }
    $hits = @()
    foreach ($r in $roots) {
        if (-not (Test-Path $r.Path)) { continue }
        $hits += @(Get-ChildItem -Path $r.Path -Depth $r.Depth -Force -ErrorAction SilentlyContinue |
                   Where-Object { $_.Name -match '(?i)claude|anthropic' -and $selfPaths -notcontains $_.FullName })
    }
    $hits = @($hits | Sort-Object FullName -Unique)
    if ($hits.Count -eq 0) { Write-Ok "scansione pulita: nessun residuo per nome" }
    else {
        Write-Warn "$($hits.Count) elementi con 'claude/anthropic' nel nome (verifica manuale, NON li cancello):"
        foreach ($h in $hits) { Write-Host "    $($h.FullName)" -ForegroundColor Yellow }
    }
}

Write-Head "Fatto"
if ($DryRun) { Write-Host "  DryRun: nessuna modifica effettuata. Rilancia senza -DryRun per rimuovere davvero." -ForegroundColor Green }
else {
    Write-Host "  Pulizia completata. Log di questa esecuzione: $LogFile" -ForegroundColor Green
    Write-Host "  (il log e' l'ultimo residuo: cancellalo se vuoi zero tracce)" -ForegroundColor Gray
}

# Auto-eliminazione: per ultima, dopo aver stampato tutto.
if ($RemoveScripts -and -not $DryRun -and $PSCommandPath) {
    Write-Host "  Elimino questo uninstaller ($PSCommandPath)..." -ForegroundColor Gray
    Remove-Item -LiteralPath $PSCommandPath -Force -Confirm:$false
}
