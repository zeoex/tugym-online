# ============================================================
#  TuGymOnLine — Instalador automatico para Windows
#  Ejecutar con: clic derecho -> "Ejecutar con PowerShell"
#  O doble clic en INSTALAR.bat
# ============================================================

$ErrorActionPreference = "Stop"
$raiz = $PSScriptRoot

# ── Colores de consola ────────────────────────────────────
function titulo($t)  { Write-Host "`n$t" -ForegroundColor Cyan }
function ok($t)      { Write-Host "  [OK] $t" -ForegroundColor Green }
function info($t)    { Write-Host "  --> $t" -ForegroundColor White }
function warn($t)    { Write-Host "  [!]  $t" -ForegroundColor Yellow }
function fallo($t)   { Write-Host "  [X]  $t" -ForegroundColor Red; Read-Host "Presiona Enter para salir"; exit 1 }

Clear-Host
Write-Host @"

  ████████╗██╗   ██╗ ██████╗ ██╗   ██╗███╗   ███╗
     ██╔══╝██║   ██║██╔════╝ ╚██╗ ██╔╝████╗ ████║
     ██║   ██║   ██║██║  ███╗ ╚████╔╝ ██╔████╔██║
     ██║   ██║   ██║██║   ██║  ╚██╔╝  ██║╚██╔╝██║
     ██║   ╚██████╔╝╚██████╔╝   ██║   ██║ ╚═╝ ██║
     ╚═╝    ╚═════╝  ╚═════╝    ╚═╝   ╚═╝     ╚═╝

        TuGymOnLine — Instalador automatico
        =====================================
"@ -ForegroundColor Cyan


# ── PASO 1: Verificar Node.js ─────────────────────────────
titulo "PASO 1/8 — Verificando Node.js..."

$nodeOk = $false
try {
  $nodeVer = node --version 2>$null
  if ($nodeVer -match "v(\d+)") {
    $major = [int]$Matches[1]
    if ($major -ge 18) {
      ok "Node.js $nodeVer encontrado"
      $nodeOk = $true
    } else {
      warn "Node.js $nodeVer es muy antiguo (se necesita v18+)"
    }
  }
} catch { }

if (-not $nodeOk) {
  info "Instalando Node.js LTS..."
  $instalado = $false

  # Intentar con winget (Windows 10/11 moderno)
  try {
    winget install --id OpenJS.NodeJS.LTS --silent --accept-package-agreements --accept-source-agreements 2>$null
    $instalado = $true
    ok "Node.js instalado via winget"
  } catch {
    warn "winget no disponible, descargando MSI..."
  }

  if (-not $instalado) {
    $msiUrl  = "https://nodejs.org/dist/v20.14.0/node-v20.14.0-x64.msi"
    $msiPath = "$env:TEMP\nodejs-installer.msi"
    info "Descargando Node.js desde nodejs.org..."
    try {
      Invoke-WebRequest -Uri $msiUrl -OutFile $msiPath -UseBasicParsing
      Start-Process msiexec -ArgumentList "/i `"$msiPath`" /quiet /norestart ADDLOCAL=ALL" -Wait -NoNewWindow
      ok "Node.js instalado correctamente"
    } catch {
      fallo "No se pudo instalar Node.js automaticamente. Instalalo manualmente desde https://nodejs.org y vuelve a ejecutar este instalador."
    }
  }

  # Refrescar PATH para que node sea visible en esta sesion
  $env:Path = [System.Environment]::GetEnvironmentVariable("Path","Machine") + ";" +
              [System.Environment]::GetEnvironmentVariable("Path","User")

  try {
    $nodeVer = node --version
    ok "Node.js $nodeVer listo"
  } catch {
    fallo "Node.js no se reconoce. Cierra esta ventana, reinicia y vuelve a ejecutar INSTALAR.bat"
  }
}


# ── PASO 2: Instalar dependencias ────────────────────────
titulo "PASO 2/8 — Instalando dependencias..."

info "Backend..."
Set-Location "$raiz\backend"
npm install --prefer-offline --no-audit --no-fund 2>&1 | Out-Null
if ($LASTEXITCODE -ne 0) { fallo "Error instalando dependencias del backend" }
ok "Backend listo"

info "Frontend..."
Set-Location "$raiz\frontend"
npm install --prefer-offline --no-audit --no-fund 2>&1 | Out-Null
if ($LASTEXITCODE -ne 0) { fallo "Error instalando dependencias del frontend" }
ok "Frontend listo"

Set-Location $raiz


# ── PASO 3: Configurar .env ───────────────────────────────
titulo "PASO 3/8 — Configurando entorno..."

$envPath = "$raiz\backend\.env"
if (-not (Test-Path $envPath)) {
  info "Creando archivo .env de produccion..."
  $secret = [System.Convert]::ToBase64String(
    [System.Security.Cryptography.RandomNumberGenerator]::GetBytes(48)
  )
  $envContenido = @"
DATABASE_URL="file:./gymapp.db"
JWT_SECRET="$secret"
JWT_EXPIRES_IN="8h"
PORT=4000
NODE_ENV=production
FRONTEND_URL=http://localhost:4000
"@
  Set-Content -Path $envPath -Value $envContenido -Encoding utf8
  ok ".env creado con JWT secreto generado automaticamente"
} else {
  # Asegurar que FRONTEND_URL apunte al puerto 4000 en produccion
  $envContenido = Get-Content $envPath -Raw
  if ($envContenido -notmatch "FRONTEND_URL=http://localhost:4000") {
    $envContenido = $envContenido -replace "FRONTEND_URL=.*", "FRONTEND_URL=http://localhost:4000"
    Set-Content -Path $envPath -Value $envContenido -Encoding utf8
  }
  ok ".env existente conservado"
}


# ── PASO 4: Base de datos ─────────────────────────────────
titulo "PASO 4/8 — Preparando base de datos..."

Set-Location "$raiz\backend"
info "Aplicando esquema de base de datos..."
npx prisma db push --skip-generate 2>&1 | Out-Null
if ($LASTEXITCODE -ne 0) { fallo "Error aplicando esquema de la base de datos" }
ok "Base de datos lista"

# Seed solo si no hay datos previos
$dbPath = "$raiz\backend\prisma\gymapp.db"
$hacerSeed = $false
if (-not (Test-Path $dbPath)) {
  $hacerSeed = $true
} else {
  $tamano = (Get-Item $dbPath).Length
  if ($tamano -lt 50000) { $hacerSeed = $true }
}

if ($hacerSeed) {
  info "Cargando datos iniciales (usuario admin)..."
  npx prisma db seed 2>&1 | Out-Null
  if ($LASTEXITCODE -eq 0) { ok "Datos iniciales cargados" }
  else { warn "No se pudieron cargar datos iniciales (puede que ya existan)" }
}

Set-Location $raiz


# ── PASO 5: Compilar frontend ─────────────────────────────
titulo "PASO 5/8 — Compilando frontend (puede tardar 1-2 min)..."

Set-Location "$raiz\frontend"
npm run build 2>&1 | Out-Null
if ($LASTEXITCODE -ne 0) { fallo "Error compilando el frontend" }
ok "Frontend compilado correctamente"

Set-Location $raiz


# ── PASO 6: Instalar PM2 ──────────────────────────────────
titulo "PASO 6/8 — Instalando gestor de procesos (PM2)..."

$pm2Ok = $false
try { pm2 --version 2>$null | Out-Null; $pm2Ok = $true } catch { }

if (-not $pm2Ok) {
  info "Instalando PM2..."
  npm install -g pm2 2>&1 | Out-Null
  if ($LASTEXITCODE -ne 0) { fallo "Error instalando PM2" }
}
ok "PM2 listo"

info "Instalando PM2 Windows Startup..."
npm install -g pm2-windows-startup 2>&1 | Out-Null
ok "PM2 Windows Startup listo"


# ── PASO 7: Iniciar la aplicacion ────────────────────────
titulo "PASO 7/8 — Iniciando TuGymOnLine..."

# Detener instancias previas si existen
pm2 delete tugym 2>$null | Out-Null

# Iniciar con el ecosistema
pm2 start "$raiz\ecosystem.config.js" 2>&1 | Out-Null
if ($LASTEXITCODE -ne 0) { fallo "Error iniciando la aplicacion con PM2" }

pm2 save --force 2>&1 | Out-Null
ok "Aplicacion iniciada en PM2"

# Configurar inicio automatico con Windows
info "Configurando inicio automatico con Windows..."
pm2-startup install 2>&1 | Out-Null
ok "La app arrancara automaticamente al encender la PC"


# ── PASO 8: Accesos directos ──────────────────────────────
titulo "PASO 8/8 — Creando accesos directos..."

# Acceso directo en el escritorio (abre el navegador)
$escritorio = [System.Environment]::GetFolderPath("Desktop")
$urlFile = "$escritorio\TuGymOnLine.url"
$urlContent = @"
[InternetShortcut]
URL=http://localhost:4000
IconIndex=0
"@
Set-Content -Path $urlFile -Value $urlContent -Encoding ascii
ok "Acceso directo creado en el Escritorio"

# Acceso directo de estado/control PM2
$batControl = "$escritorio\TuGymOnLine - Estado.bat"
$batContent = @"
@echo off
title TuGymOnLine - Estado del servidor
echo.
echo  ========================================
echo   TuGymOnLine - Estado del servidor
echo  ========================================
echo.
pm2 list
echo.
echo  Comandos utiles:
echo    pm2 restart tugym   (reiniciar)
echo    pm2 stop tugym      (detener)
echo    pm2 logs tugym      (ver logs)
echo.
pause
"@
Set-Content -Path $batControl -Value $batContent -Encoding ascii
ok "Acceso de estado creado en el Escritorio"


# ── FINALIZADO ─────────────────────────────────────────────
Write-Host @"

  ============================================
    INSTALACION COMPLETADA EXITOSAMENTE
  ============================================

    La aplicacion esta corriendo en:
    --> http://localhost:4000

    * Hace doble clic en "TuGymOnLine" del
      Escritorio para abrir el sistema.

    * El servidor arranca AUTOMATICAMENTE
      cada vez que enciendas la PC.

    * Usuario por defecto:
      Email:    admin@gymapp.com
      Password: admin123

    IMPORTANTE: Cambia la contrasenia del
    administrador al primer inicio de sesion.

  ============================================
"@ -ForegroundColor Green

# Esperar 3 segundos para que el servidor arranque y abrir el navegador
info "Abriendo el navegador en 3 segundos..."
Start-Sleep -Seconds 3
Start-Process "http://localhost:4000"

Read-Host "`nPresiona Enter para cerrar esta ventana"
