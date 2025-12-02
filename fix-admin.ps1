Write-Host "🔧 SOLUCIÓN RÁPIDA PARA ADMIN 🔧"
Write-Host "=" * 50

Write-Host "`n1. Modificando código temporalmente..." -ForegroundColor Yellow

# Archivo a modificar
$file = "src/routes/auth.routes.js"

if (Test-Path $file) {
    # Crear backup
    Copy-Item $file "$file.backup"
    
    # Leer y modificar
    $content = Get-Content $file -Raw
    $newContent = $content -replace "router.post\('/register', verifyToken,", "router.post('/register',"
    
    if ($newContent -eq $content) {
        $newContent = $content -replace 'router\.post\(`''/register`'', verifyToken,', 'router.post(`'/register`,'
    }
    
    $newContent | Out-File $file -Encoding UTF8
    Write-Host "   ✅ Código modificado (register ahora es público)" -ForegroundColor Green
    
    # Reiniciar servidor
    Write-Host "`n2. Reiniciando servidor..." -ForegroundColor Yellow
    Get-Process -Name node -ErrorAction SilentlyContinue | Stop-Process -Force
    Start-Sleep -Seconds 2
    
    Write-Host "`n3. Por favor:" -ForegroundColor Cyan
    Write-Host "   a) Ejecuta manualmente: npm run dev" -ForegroundColor White
    Write-Host "   b) Luego en OTRA ventana de PowerShell:" -ForegroundColor White
    Write-Host "      cd C:\Users\ferna\Downloads\Backend_Prueba3" -ForegroundColor White
    Write-Host "      Invoke-RestMethod -Uri http://localhost:3000/api/auth/register -Method Post -Headers @{`"Content-Type`"=`"application/json`"} -Body '{`"username`":`"admin`",`"email`":`"admin@sistema.com`",`"password`":`"admin123`",`"role`":`"ADMIN`"}'" -ForegroundColor White
    
} else {
    Write-Host "   ❌ Archivo no encontrado" -ForegroundColor Red
}

Write-Host "`n" + "=" * 50
Write-Host "💡 Después de crear admin, restaura el archivo:" -ForegroundColor Cyan
Write-Host "   Move-Item `"$file.backup`" `"$file`" -Force" -ForegroundColor White
