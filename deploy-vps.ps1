# VPS Deployment Script for Real-time Document Editor (Windows PowerShell)
# Usage: .\deploy-vps.ps1 -VpsIP "192.168.1.100"

param(
    [Parameter(Mandatory=$true)]
    [string]$VpsIP
)

$ProjectName = "realtime-docs"

Write-Host "🚀 Deploying Real-time Document Editor to VPS..." -ForegroundColor Green
Write-Host "📍 VPS IP: $VpsIP" -ForegroundColor Cyan

# Validate IP format
if ($VpsIP -notmatch '^\d{1,3}\.\d{1,3}\.\d{1,3}\.\d{1,3}$') {
    Write-Host "❌ Invalid IP address format. Please provide a valid IP." -ForegroundColor Red
    Write-Host "Usage: .\deploy-vps.ps1 -VpsIP '192.168.1.100'" -ForegroundColor Yellow
    exit 1
}

# Create VPS-specific environment file
Write-Host "📝 Creating VPS environment configuration..." -ForegroundColor Yellow

$envContent = @"
# VPS Production Environment
NODE_ENV=production
DATABASE_URL=mongodb://admin:password123@mongodb:27017/realtime-docs?authSource=admin
JWT_SECRET=vps-super-secret-jwt-key-$(Get-Date -UFormat %s)
JWT_EXPIRES_IN=7d
PORT=3001
FRONTEND_URL=http://frontend:3000

# Frontend URLs for VPS
NEXT_PUBLIC_API_URL=http://$VpsIP`:3001/api
NEXT_PUBLIC_SOCKET_URL=http://$VpsIP`:3001

# MongoDB Configuration
MONGO_INITDB_ROOT_USERNAME=admin
MONGO_INITDB_ROOT_PASSWORD=password123
MONGO_INITDB_DATABASE=realtime-docs
"@

$envContent | Out-File -FilePath ".env.vps" -Encoding UTF8
Write-Host "✅ Created .env.vps with IP: $VpsIP" -ForegroundColor Green

# Update docker-compose for VPS
Write-Host "📝 Creating VPS docker-compose configuration..." -ForegroundColor Yellow
Copy-Item "docker-compose.yml" "docker-compose.vps.yml"

# Replace env file reference in docker-compose
(Get-Content "docker-compose.vps.yml") -replace '\.env\.docker', '.env.vps' | Set-Content "docker-compose.vps.yml"

Write-Host "🐳 Building and starting services..." -ForegroundColor Blue

# Stop any existing containers
docker-compose -f docker-compose.vps.yml down 2>$null

# Build and start services
docker-compose -f docker-compose.vps.yml up --build -d

Write-Host "⏳ Waiting for services to start..." -ForegroundColor Yellow
Start-Sleep -Seconds 30

# Check service status
Write-Host "📊 Service Status:" -ForegroundColor Cyan
docker-compose -f docker-compose.vps.yml ps

Write-Host ""
Write-Host "🎉 Deployment completed!" -ForegroundColor Green
Write-Host ""
Write-Host "📱 Access your application:" -ForegroundColor Cyan
Write-Host "🔹 Frontend:      http://$VpsIP`:3000" -ForegroundColor White
Write-Host "🔹 Backend API:   http://$VpsIP`:3001" -ForegroundColor White
Write-Host "🔹 Mongo Express: http://$VpsIP`:8081" -ForegroundColor White
Write-Host ""
Write-Host "🔐 Default MongoDB credentials:" -ForegroundColor Yellow
Write-Host "   Username: admin" -ForegroundColor White
Write-Host "   Password: password123" -ForegroundColor White
Write-Host ""
Write-Host "📋 Useful commands:" -ForegroundColor Cyan
Write-Host "   View logs:    docker-compose -f docker-compose.vps.yml logs -f" -ForegroundColor White
Write-Host "   Stop:         docker-compose -f docker-compose.vps.yml down" -ForegroundColor White
Write-Host "   Restart:      docker-compose -f docker-compose.vps.yml restart" -ForegroundColor White
Write-Host ""
Write-Host "⚠️  Security reminders for production:" -ForegroundColor Red
Write-Host "   1. Change default MongoDB password" -ForegroundColor White
Write-Host "   2. Update JWT_SECRET in .env.vps" -ForegroundColor White
Write-Host "   3. Configure firewall rules" -ForegroundColor White
Write-Host "   4. Enable SSL/HTTPS" -ForegroundColor White
Write-Host ""
