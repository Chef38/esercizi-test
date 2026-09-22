<#
    Install-ClaudeCode.ps1
    ----------------------
    Installa Claude Code e (opzionalmente) i suoi contorni, in modo speculare a
    Uninstall_ClaudeCode.ps1. Fa da coppia con quello: cio' che questo installa,
    quello sa rimuovere.

      1. Controlla i prerequisiti (OS, winget, e per la via npm: Node.js).
      2. Rileva installazioni gia' presenti (native / npm / winget / PATH).
      3. Chiede conferma (elenco di cosa verra' installato).
      4. Installa Claude Code col metodo scelto:
           - native  (CONSIGLIATO): irm https://claude.ai/install.ps1 | iex
                      zero dipendenze, si auto-aggiorna in background.
           - npm    : npm install -g @anthropic-ai/claude-code  (richiede Node 22+)
           - winget : winget install Anthropic.ClaudeCode        (no auto-update)
      5. Extra opzionali: Git for Windows (abilita il tool Bash), Python + markitdown
         (conversione documenti), estensione VS Code.
      6. Verifica finale: claude --version + claude doctor, e promemoria login.

    Scrive un log  claude-diag_<timestamp>.log  nella cartella dello script:
    e' lo stesso file che l'uninstaller cerca ed elimina con -RemoveScripts.

    Uso:
        powershell -ExecutionPolicy Bypass -File .\Install-ClaudeCode.ps1
        ...\Install-ClaudeCode.ps1 -DryRun                 # mostra cosa farebbe, non tocca nulla
        ...\Install-ClaudeCode.ps1 -Force                  # niente richiesta di conferma
        ...\Install-ClaudeCode.ps1 -Method npm             # installa via npm (Node 22+)
        ...\Install-ClaudeCode.ps1 -Method winget          # installa via winget
        ...\Install-ClaudeCode.ps1 -Channel stable         # canale stable (solo native)
        ...\Install-ClaudeCode.ps1 -Version 2.1.89         # versione precisa (solo native)
        ...\Install-ClaudeCode.ps1 -InstallGit             # installa anche Git for Windows
        ...\Install-ClaudeCode.ps1 -InstallPython          # installa anche Python 3.12
        ...\Install-ClaudeCode.ps1 -InstallMarkitdown      # pip install markitdown (implica Python)
        ...\Install-ClaudeCode.ps1 -VSCodeExt              # installa l'estensione VS Code

    Richiede un account Claude Pro/Max/Team/Enterprise o Console: il piano
    gratuito di claude.ai NON include Claude Code. Il login si fa al primo
    avvio di 'claude'.

    NON serve eseguire come Amministratore.
    Windows PowerShell 5.1 compatibile.
#>

[CmdletBinding()]
param(
    [switch]$DryRun,
    [switch]$Force,
    [ValidateSet("native", "npm", "winget")]
    [string]$Method = "native",
    [ValidateSet("latest", "stable")]
    [string]$Channel = "latest",
    [string]$Version = "",
    [switch]$InstallGit,
    [switch]$InstallNode,
    [switch]$InstallPython,
    [switch]$InstallMarkitdown,
    [switch]$CloneMarkitdownRepo,
    [switch]$VSCodeExt,
    [switch]$SkipVerify,
    [string]$MarkitdownDir = "$env:USERPROFILE\markitdown",
    [string]$LogFile = ""
)

# Continue, non Stop: npm/pip/winget scrivono spesso su stderr e in PS 5.1 con
# EAP=Stop qualunque riga di stderr diventerebbe errore terminante.
$ErrorActionPreference = "Continue"

# ================= HELPER =================
function Write-Log($t) {
    $line = "{0} {1}" -f (Get-Date -Format "HH:mm:ss"), $t
    try { Add-Content -Path $script:LogFile -Value $line -Encoding UTF8 } catch {}
}
function Write-Head($t) { Write-Host ""; Write-Host "==== $t ====" -ForegroundColor Cyan; Write-Log "==== $t ====" }
function Write-Ok($t)   { Write-Host "  [OK]   $t" -ForegroundColor Green;  Write-Log "[OK]    $t" }
function Write-Warn($t) { Write-Host "  [!]    $t" -ForegroundColor Yellow; Write-Log "[WARN]  $t" }
function Write-Err($t)  { Write-Host "  [ERR]  $t" -ForegroundColor Red;    Write-Log "[ERR]   $t" }

function Test-Cmd([string]$Name) { return [bool](Get-Command $Name -ErrorAction SilentlyContinue) }

function Update-SessionPath {
    $m = [Environment]::GetEnvironmentVariable("Path", "Machine")
    $u = [Environment]::GetEnvironmentVariable("Path", "User")
    $env:Path = (@($m, $u) | Where-Object { $_ }) -join ";"
}

# Esegue un comando esterno rispettando -DryRun. Ritorna il codice di uscita (0 = ok).
function Invoke-Step([string]$File, [string[]]$Args, [string]$Label) {
    if ($script:DryRun) { Write-Warn "[DRY] eseguirei: $File $($Args -join ' ')"; return 0 }
    Write-Log "RUN: $File $($Args -join ' ')"
    try {
        $p = Start-Process -FilePath $File -ArgumentList $Args -Wait -PassThru -NoNewWindow -ErrorAction Stop
        if ($p.ExitCode -eq 0) { Write-Ok "$Label" }
        else { Write-Warn "$Label - exit $($p.ExitCode)" }
        return $p.ExitCode
    } catch {
        Write-Err "$Label - $($_.Exception.Message)"
        return 1
    }
}

# Installa un pacchetto winget (idempotente: winget salta se gia' presente).
function Install-Winget([string]$Id, [string]$Label) {
    if (-not (Test-Cmd "winget")) { Write-Err "winget non disponibile: impossibile installare $Label"; return $false }
    $args = @("install", "--id", $Id, "-e", "--silent",
              "--accept-source-agreements", "--accept-package-agreements")
    $code = Invoke-Step -File "winget" -Args $args -Label "winget install $Label ($Id)"
    return ($code -eq 0)
}

# ================= LOG =================
$scriptDir = if ($PSCommandPath) { Split-Path -Parent $PSCommandPath } else { (Get-Location).Path }
if (-not $LogFile) {
    $LogFile = Join-Path $scriptDir ("claude-diag_{0}.log" -f (Get-Date -Format 'yyyyMMdd_HHmmss'))
}
Write-Log "===== RUN $(Get-Date -Format 'yyyy-MM-dd HH:mm:ss') su $env:COMPUTERNAME (utente $env:USERNAME) Method=$Method DryRun=$DryRun ====="
Write-Host "Log: $LogFile" -ForegroundColor DarkGray

# ================= FASE 1: PREREQUISITI E RILEVAMENTO =================
Write-Head "FASE 1 - Prerequisiti e rilevamento"
Update-SessionPath

# OS: Claude Code richiede Windows 10 1809+ (build 17763) o Server 2019+.
try {
    $build = [int](Get-CimInstance Win32_OperatingSystem).BuildNumber
    if ($build -lt 17763) { Write-Warn "Windows build $build < 17763 (Win10 1809): potrebbe non essere supportato" }
    else { Write-Ok "Windows build $build: supportato" }
} catch { Write-Warn "impossibile determinare la build di Windows" }

$hasWinget = Test-Cmd "winget"
$hasNpm    = Test-Cmd "npm"
$hasGit    = Test-Cmd "git"
$hasCode   = Test-Cmd "code"
if ($hasWinget) { Write-Ok "winget disponibile" } else { Write-Warn "winget NON disponibile (serve per gli extra via winget)" }

# Claude Code gia' presente?
$existing = Get-Command claude -ErrorAction SilentlyContinue
if ($existing) {
    Write-Warn "claude gia' presente nel PATH: $($existing.Source)"
    if (-not $DryRun) {
        try { $v = (& claude --version 2>$null); if ($v) { Write-Warn "versione attuale: $v" } } catch {}
    }
    Write-Warn "reinstallare aggiorna/sovrascrive l'installazione esistente"
}

# Node.js (rilevante solo per la via npm)
$nodeMajor = 0
if (Test-Cmd "node") {
    try {
        $nodeVer = (& node --version) -replace '^v', ''
        $nodeMajor = [int]($nodeVer.Split('.')[0])
        Write-Ok "Node.js presente: v$nodeVer"
    } catch { Write-Warn "Node.js presente ma versione non leggibile" }
} else {
    Write-Warn "Node.js non trovato"
}

# La via npm richiede Node 22+ (v2.1.198+). Se manca o e' vecchio, decido cosa fare.
$needNode = $false
if ($Method -eq "npm") {
    if ($nodeMajor -eq 0) { Write-Warn "Method=npm ma Node.js manca -> serve installarlo"; $needNode = $true }
    elseif ($nodeMajor -lt 22) { Write-Warn "Method=npm ma Node v$nodeMajor < 22: consigliato aggiornare a Node 22 LTS"; $needNode = $true }
}

# markitdown implica Python
if ($InstallMarkitdown) { $InstallPython = $true }

# ---- Riepilogo di cosa verra' fatto ----
Write-Host ""
Write-Host "  Piano di installazione:" -ForegroundColor White
switch ($Method) {
    "native" {
        $what = if ($Version) { "versione $Version" } else { "canale $Channel" }
        Write-Host "    - Claude Code (native installer, $what)" -ForegroundColor Gray
    }
    "npm"    { Write-Host "    - Claude Code (npm globale @anthropic-ai/claude-code)" -ForegroundColor Gray }
    "winget" { Write-Host "    - Claude Code (winget Anthropic.ClaudeCode)" -ForegroundColor Gray }
}
if ($needNode -or $InstallNode) { Write-Host "    - Node.js 22 LTS (winget OpenJS.NodeJS.LTS)" -ForegroundColor Gray }
if ($InstallGit)        { Write-Host "    - Git for Windows (winget Git.Git) - abilita il tool Bash" -ForegroundColor Gray }
if ($InstallPython)     { Write-Host "    - Python 3.12 (winget Python.Python.3.12)" -ForegroundColor Gray }
if ($InstallMarkitdown) { Write-Host "    - markitdown (pip)" -ForegroundColor Gray }
if ($CloneMarkitdownRepo) { Write-Host "    - clone repo markitdown -> $MarkitdownDir" -ForegroundColor Gray }
if ($VSCodeExt)         { Write-Host "    - Estensione VS Code (anthropic.claude-code)" -ForegroundColor Gray }

# ================= CONFERMA =================
if (-not $DryRun -and -not $Force) {
    Write-Head "Conferma"
    Write-Host "  Verranno INSTALLATI gli elementi elencati sopra." -ForegroundColor Yellow
    $answer = Read-Host "  Digita SI per procedere (qualsiasi altra cosa annulla)"
    if ($answer -ne "SI") { Write-Head "Annullato"; Write-Host "  Nessuna modifica effettuata."; return }
}

# ================= FASE 2: PREREQUISITI OPZIONALI =================
Write-Head "FASE 2 - Prerequisiti (Git / Node / Python)"

if ($InstallGit) {
    if ($hasGit) { Write-Ok "Git gia' presente: salto" }
    else { [void](Install-Winget -Id "Git.Git" -Label "Git for Windows") }
}

if ($needNode -or $InstallNode) {
    if ($nodeMajor -ge 22 -and -not $InstallNode) { Write-Ok "Node $nodeMajor gia' adeguato: salto" }
    else { [void](Install-Winget -Id "OpenJS.NodeJS.LTS" -Label "Node.js LTS") }
    Update-SessionPath
}

if ($InstallPython) {
    if ((Test-Cmd "py") -or (Test-Cmd "python")) {
        Write-Ok "Python gia' presente: salto"
    } else {
        [void](Install-Winget -Id "Python.Python.3.12" -Label "Python 3.12")
        Update-SessionPath
    }
}

# ================= FASE 3: INSTALLAZIONE CLAUDE CODE =================
Write-Head "FASE 3 - Installazione Claude Code ($Method)"

$installOk = $false
switch ($Method) {

    "native" {
        # irm https://claude.ai/install.ps1 | iex  (con supporto canale/versione)
        if ($DryRun) {
            $arg = if ($Version) { $Version } elseif ($Channel -ne "latest") { $Channel } else { "(latest)" }
            Write-Warn "[DRY] scaricherei ed eseguirei l'installer native con argomento: $arg"
            $installOk = $true
        } else {
            try {
                Write-Host "  Scarico l'installer ufficiale da https://claude.ai/install.ps1 ..." -ForegroundColor Gray
                $scriptText = Invoke-RestMethod -Uri "https://claude.ai/install.ps1" -UseBasicParsing
                $sb = [scriptblock]::Create($scriptText)
                if ($Version)            { & $sb $Version }
                elseif ($Channel -ne "latest") { & $sb $Channel }
                else                     { & $sb }
                $installOk = $true
                Write-Ok "native installer eseguito"
            } catch {
                Write-Err "installer native fallito: $($_.Exception.Message)"
                Write-Warn "in alternativa prova: -Method npm  oppure  -Method winget"
            }
        }
        # il native installer mette il binario in ~\.local\bin: assicuro il PATH di sessione
        $localBin = Join-Path $env:USERPROFILE ".local\bin"
        if ((Test-Path $localBin) -and ($env:Path -notlike "*$localBin*")) { $env:Path = "$localBin;$env:Path" }
    }

    "npm" {
        if (-not (Test-Cmd "npm")) {
            Write-Err "npm non disponibile: installa Node.js (es. -Method npm -InstallNode) e riprova"
        } else {
            # NB: niente 'sudo'/admin. npm install -g nella home utente.
            $code = Invoke-Step -File "cmd.exe" `
                    -Args @("/c", "npm install -g @anthropic-ai/claude-code") `
                    -Label "npm install -g @anthropic-ai/claude-code"
            $installOk = ($code -eq 0)
            if (-not $installOk) { Write-Warn "se e' un EBADENGINE (Node < 22) l'install spesso riesce comunque: verifico dopo" }
        }
    }

    "winget" {
        $installOk = Install-Winget -Id "Anthropic.ClaudeCode" -Label "Claude Code"
        Write-Warn "installazione via winget: NON si auto-aggiorna (usa 'winget upgrade Anthropic.ClaudeCode')"
    }
}

# ================= FASE 4: COMPONENTI EXTRA =================
Write-Head "FASE 4 - Componenti extra"

# markitdown via pip (conversione Office/PDF -> Markdown, utile con Claude Code)
if ($InstallMarkitdown) {
    $py = $null
    foreach ($c in @("py", "python")) { if (Test-Cmd $c) { $py = $c; break } }
    if (-not $py) { Write-Err "Python non disponibile: impossibile installare markitdown" }
    else {
        $code = Invoke-Step -File $py -Args @("-m", "pip", "install", "--upgrade", "markitdown[all]") -Label "pip install markitdown[all]"
        if ($code -ne 0) { Write-Warn "prova senza extra: $py -m pip install markitdown" }
    }
}

# clone del repo markitdown (solo se richiesto e se git c'e')
if ($CloneMarkitdownRepo) {
    if (Test-Path $MarkitdownDir) { Write-Warn "$MarkitdownDir esiste gia': salto il clone" }
    elseif (-not (Test-Cmd "git")) { Write-Err "git non disponibile: impossibile clonare markitdown (usa -InstallGit)" }
    else { [void](Invoke-Step -File "git" -Args @("clone", "https://github.com/microsoft/markitdown", $MarkitdownDir) -Label "git clone markitdown") }
}

# Estensione VS Code
if ($VSCodeExt) {
    if (-not (Test-Cmd "code")) { Write-Err "'code' (VS Code CLI) non nel PATH: apri VS Code > Ctrl+Shift+P > 'Shell Command: Install code command in PATH'" }
    else { [void](Invoke-Step -File "code" -Args @("--install-extension", "anthropic.claude-code") -Label "estensione VS Code anthropic.claude-code") }
}

if (-not $InstallMarkitdown -and -not $CloneMarkitdownRepo -and -not $VSCodeExt) {
    Write-Ok "nessun componente extra richiesto"
}

# Suggerimento Git per il tool Bash (se non installato e non richiesto)
if (-not $hasGit -and -not $InstallGit) {
    Write-Warn "Git for Windows non presente: Claude Code usera' PowerShell come shell."
    Write-Warn "Per abilitare il tool Bash (Git Bash) rilancia con -InstallGit."
}

# ================= FASE 5: VERIFICA E LOGIN =================
Write-Head "FASE 5 - Verifica finale"
Update-SessionPath
$localBin = Join-Path $env:USERPROFILE ".local\bin"
if ((Test-Path $localBin) -and ($env:Path -notlike "*$localBin*")) { $env:Path = "$localBin;$env:Path" }

if ($DryRun) {
    Write-Warn "[DRY] verificherei con: claude --version  e  claude doctor"
} elseif ($SkipVerify) {
    Write-Warn "verifica saltata (-SkipVerify)"
} else {
    $claude = Get-Command claude -ErrorAction SilentlyContinue
    if (-not $claude) {
        Write-Err "'claude' non risolvibile in questa sessione."
        Write-Warn "CHIUDI e RIAPRI il terminale (il PATH viene aggiornato al nuovo avvio), poi esegui: claude --version"
    } else {
        Write-Ok "claude trovato: $($claude.Source)"
        try {
            $ver = (& claude --version 2>$null)
            if ($ver) { Write-Ok "versione: $ver" } else { Write-Warn "claude --version non ha restituito output" }
        } catch { Write-Warn "claude --version non eseguibile: $($_.Exception.Message)" }
        # claude doctor: diagnostica read-only, non avvia una sessione
        try {
            Write-Host "  Eseguo 'claude doctor' (diagnostica)..." -ForegroundColor Gray
            & claude doctor 2>&1 | ForEach-Object { Write-Host "    $_" -ForegroundColor DarkGray }
        } catch { Write-Warn "claude doctor non eseguibile" }
    }
}

# ================= FATTO =================
Write-Head "Fatto"
if ($DryRun) {
    Write-Host "  DryRun: nessuna modifica effettuata. Rilancia senza -DryRun per installare davvero." -ForegroundColor Green
} else {
    Write-Host "  Installazione completata. Log: $LogFile" -ForegroundColor Green
    Write-Host ""
    Write-Host "  PROSSIMI PASSI:" -ForegroundColor White
    Write-Host "    1. Chiudi e riapri il terminale (per aggiornare il PATH)." -ForegroundColor Gray
    Write-Host "    2. Vai nella cartella di un tuo progetto:  cd C:\percorso\al\progetto" -ForegroundColor Gray
    Write-Host "    3. Avvia:  claude" -ForegroundColor Gray
    Write-Host "    4. Al primo avvio fai il login nel browser (serve un account Pro/Max/Team/Enterprise/Console)." -ForegroundColor Gray
    if ($Method -eq "native") {
        Write-Host "  Le installazioni native si auto-aggiornano in background." -ForegroundColor DarkGray
    } elseif ($Method -eq "npm") {
        Write-Host "  Per aggiornare (npm):  npm install -g @anthropic-ai/claude-code@latest   (evita 'npm update -g')" -ForegroundColor DarkGray
    } elseif ($Method -eq "winget") {
        Write-Host "  Per aggiornare (winget):  winget upgrade Anthropic.ClaudeCode" -ForegroundColor DarkGray
    }
}
