# start-server.ps1
Write-Host "🚀 INICIADOR DE SERVIDOR SISTEMA VENTAS 🚀" -ForegroundColor Cyan
Write-Host "=" * 50

# 1. Detener cualquier servidor previo
Write-Host "`n1. Limpiando procesos anteriores..." -ForegroundColor Yellow
$oldProcess = Get-NetTCPConnection -LocalPort 3000 -ErrorAction SilentlyContinue
if ($oldProcess) {
    $pid = $oldProcess.OwningProcess
    $procName = (Get-Process -Id $pid -ErrorAction SilentlyContinue).ProcessName
    Write-Host "   Encontrado: $procName (PID: $pid) en puerto 3000" -ForegroundColor Yellow

    Stop-Process -Id $pid -Force -ErrorAction SilentlyContinue
    Write-Host "   ✅ Proceso anterior terminado" -ForegroundColor Green
    Start-Sleep -Seconds 2
}

# 2. Verificar dependencias
Write-Host "`n2. Verificando dependencias..." -ForegroundColor Yellow
if (Test-Path "node_modules") {
    Write-Host "   ✅ node_modules encontrado" -ForegroundColor Green
} else {
    Write-Host "   ⚠️  Instalando dependencias..." -ForegroundColor Yellow
    npm install
}

# 3. Verificar base de datos
Write-Host "`n3. Verificando conexión a base de datos..." -ForegroundColor Yellow
try {
    # Intento de conexión simple
    $testResult = node -e "
        const { sequelize } = require('./src/config/database.js');
        sequelize.authenticate()
            .then(() => {
                console.log('OK');
                process.exit(0);
            })
            .catch(err => {
                console.log('ERROR: ' + err.message);
                process.exit(1);
            });
    " 2>&1

    if ($testResult -like "*OK*") {
        Write-Host "   ✅ Conexión a BD establecida" -ForegroundColor Green
    } else {
        Write-Host "   ⚠️  Usando modo de desarrollo sin BD" -ForegroundColor Yellow
    }
} catch {
    Write-Host "   ⚠️  No se pudo verificar BD" -ForegroundColor Yellow
}

# 4. Iniciar servidor
Write-Host "`n4. Iniciando servidor..." -ForegroundColor Green
Write-Host "   🔗 URL: http://localhost:3000" -ForegroundColor Cyan
Write-Host "   📁 Directorio: $((Get-Location).Path)" -ForegroundColor Gray
Write-Host "`n" + "=" * 50
Write-Host "   Presiona Ctrl+C para detener el servidor" -ForegroundColor White
Write-Host "=" * 50

# 5. Ejecutar
npm run dev
