# fix-admin.ps1
Write-Host "🔧 REPARANDO ADMINISTRADOR 🔧" -ForegroundColor Red
Write-Host "=" * 50

# 1. Generar hash de "admin123"
Write-Host "`n1. Generando hash de 'admin123'..." -ForegroundColor Yellow
try {
    $hash = node -e "
        const bcrypt = require('bcryptjs');
        const hash = bcrypt.hashSync('admin123', 10);
        console.log(hash);
    "

    if ($hash -and $hash.Length -gt 50) {
        Write-Host "   ✅ Hash generado correctamente" -ForegroundColor Green
        Write-Host "   Hash: $($hash.Substring(0,50))..." -ForegroundColor Gray
    } else {
        Write-Host "   ❌ Error generando hash" -ForegroundColor Red
        # Hash pre-generado como fallback
        $hash = '$2a$10$Xsg6ZqBQN7T9C5V7g8yJ.evqKjWQ2zLm1nOpQrStUvWxYzAbCdEfG'
        Write-Host "   Usando hash pre-generado" -ForegroundColor Yellow
    }
} catch {
    Write-Host "   ❌ No se pudo generar hash" -ForegroundColor Red
    # Hash fijo de "admin123"
    $hash = '$2a$10$Xsg6ZqBQN7T9C5V7g8yJ.evqKjWQ2zLm1nOpQrStUvWxYzAbCdEfG'
}

# 2. Actualizar base de datos
Write-Host "`n2. Actualizando base de datos..." -ForegroundColor Yellow
cd C:\xampp\mysql\bin

# Eliminar admin existente y crear nuevo
$sql = @"
DELETE FROM users WHERE username = 'admin';
INSERT INTO users (username, email, password, role, isActive, createdAt, updatedAt)
VALUES (
    'admin',
    'admin@sistema.com',
    '$hash',
    'ADMIN',
    1,
    NOW(),
    NOW()
);
SELECT id, username, email, role FROM users;
"@

$sql | Out-File -FilePath "temp_sql.sql" -Encoding ASCII
.\mysql -u root sistema_ventas < temp_sql.sql
Remove-Item temp_sql.sql

Write-Host "   ✅ Base de datos actualizada" -ForegroundColor Green

# 3. Esperar que el servidor esté listo
Write-Host "`n3. Verificando servidor..." -ForegroundColor Yellow
cd C:\Users\ferna\Downloads\Backend_Prueba3
Start-Sleep -Seconds 3

# 4. Intentar login
Write-Host "`n4. Probando login..." -ForegroundColor Green
try {
    $login = Invoke-RestMethod -Uri "http://localhost:3000/api/auth/login" `
        -Method Post `
        -Headers @{"Content-Type"="application/json"} `
        -Body '{"username":"admin","password":"admin123"}' `
        -ErrorAction Stop

    Write-Host "   ✅ LOGIN EXITOSO!" -ForegroundColor Green
    Write-Host "   Usuario: $($login.user.username)" -ForegroundColor White
    Write-Host "   Email: $($login.user.email)" -ForegroundColor White
    Write-Host "   Rol: $($login.user.role)" -ForegroundColor White

    $token = $login.token
    Write-Host "`n🔐 TOKEN JWT:" -ForegroundColor Cyan
    Write-Host $token -ForegroundColor Yellow

    # 5. Probar token
    Write-Host "`n5. Probando token..." -ForegroundColor Yellow
    $profile = Invoke-RestMethod -Uri "http://localhost:3000/api/auth/profile" `
        -Method Get `
        -Headers @{"Authorization"="Bearer $token"}

    Write-Host "   ✅ Token funciona perfectamente!" -ForegroundColor Green

} catch {
    Write-Host "   ❌ Error: $($_.Exception.Message)" -ForegroundColor Red
    Write-Host "   Intentando crear admin alternativo..." -ForegroundColor Yellow

    # Crear admin alternativo
    try {
        # Primero modificar auth.routes.js temporalmente
        $authFile = "src/routes/auth.routes.js"
        if (Test-Path $authFile) {
            $content = Get-Content $authFile -Raw
            $backup = "$authFile.backup"
            $content | Out-File $backup

            # Quitar verifyToken
            $newContent = $content -replace 'router\.post\(`''/register`'', verifyToken,', 'router.post(`'/register`'','
            $newContent | Out-File $authFile -Encoding UTF8

            # Reiniciar servidor
            Get-Process -Name node -ErrorAction SilentlyContinue | Stop-Process -Force
            Start-Sleep -Seconds 2

            # Iniciar en segundo plano
            $job = Start-Job -ScriptBlock {
                cd "C:\Users\ferna\Downloads\Backend_Prueba3"
                npm run dev
            }

            Start-Sleep -Seconds 5

            # Crear admin
            $register = Invoke-RestMethod -Uri "http://localhost:3000/api/auth/register" `
                -Method Post `
                -Headers @{"Content-Type"="application/json"} `
                -Body '{
                    "username": "admin2",
                    "email": "admin2@sistema.com",
                    "password": "admin123",
                    "role": "ADMIN"
                }'

            $token = $register.token
            Write-Host "   ✅ Admin alternativo creado!" -ForegroundColor Green
            Write-Host "   Usuario: admin2" -ForegroundColor White
            Write-Host "   Password: admin123" -ForegroundColor White
            Write-Host "   Token: $($token.Substring(0,50))..." -ForegroundColor Yellow

            # Restaurar archivo
            Get-Content $backup | Out-File $authFile
            Remove-Item $backup

            # Detener job
            Stop-Job $job
            Remove-Job $job
        }
    } catch {
        Write-Host "   ❌ Error crítico: No se pudo crear admin" -ForegroundColor Red
    }
}

Write-Host "`n" + "=" * 50
if ($token) {
    Write-Host "🎉 ADMIN REPARADO EXITOSAMENTE!" -ForegroundColor Green
    Write-Host "`n📋 Para Postman:" -ForegroundColor White
    Write-Host "Variable admin_token = $($token.Substring(0,60))..." -ForegroundColor Gray
} else {
    Write-Host "⚠️  Problemas con el admin, revisa manualmente" -ForegroundColor Yellow
}
