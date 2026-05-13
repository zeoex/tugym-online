# ============================================================
#  TuGymOnLine — Desinstalador
# ============================================================

$raiz = $PSScriptRoot

function titulo($t) { Write-Host "`n$t" -ForegroundColor Yellow }
function ok($t)     { Write-Host "  [OK] $t" -ForegroundColor Green }
function info($t)   { Write-Host "  --> $t" -ForegroundColor White }

Clear-Host
Write-Host "`n  TuGymOnLine — Desinstalador`n" -ForegroundColor Yellow

$resp = Read-Host "  Esto detendra el servidor y quitara el inicio automatico. Continuar? (s/N)"
if ($resp.ToLower() -ne "s") { Write-Host "  Cancelado."; exit }

titulo "Deteniendo servidor..."
try { pm2 stop tugym 2>$null | Out-Null; ok "Servidor detenido" } catch { info "No habia servidor activo" }
try { pm2 delete tugym 2>$null | Out-Null; ok "Proceso eliminado de PM2" } catch { }
try { pm2 save --force 2>$null | Out-Null } catch { }

titulo "Quitando inicio automatico con Windows..."
try { pm2-startup uninstall 2>$null | Out-Null; ok "Inicio automatico eliminado" } catch { info "No habia inicio automatico configurado" }

titulo "Eliminando accesos directos del Escritorio..."
$escritorio = [System.Environment]::GetFolderPath("Desktop")
@("TuGymOnLine.url", "TuGymOnLine - Estado.bat") | ForEach-Object {
  $f = "$escritorio\$_"
  if (Test-Path $f) { Remove-Item $f -Force; ok "Eliminado: $_" }
}

Write-Host @"

  ============================================
    Desinstalacion completada.

    NOTA: Los archivos del programa y la
    base de datos NO fueron eliminados.
    Para borrarlos, elimina la carpeta:
    $raiz
  ============================================
"@ -ForegroundColor Yellow

Read-Host "`nPresiona Enter para cerrar"
