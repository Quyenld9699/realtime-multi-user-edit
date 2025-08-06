#!/bin/bash

# VPS Deployment Script for Real-time Document Editor
# Usage: ./deploy-vps.sh [VPS_IP]

set -e

VPS_IP=${1:-"YOUR_VPS_IP"}
PROJECT_NAME="realtime-docs"

echo "🚀 Deploying Real-time Document Editor to VPS..."
echo "📍 VPS IP: $VPS_IP"

# Validate IP format
if [[ ! $VPS_IP =~ ^[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}$ ]]; then
    echo "❌ Invalid IP address format. Please provide a valid IP."
    echo "Usage: ./deploy-vps.sh 192.168.1.100"
    exit 1
fi

# Create VPS-specific environment file
echo "📝 Creating VPS environment configuration..."
cat > .env.vps << EOF
# VPS Production Environment
NODE_ENV=production
DATABASE_URL=mongodb://admin:password123@mongodb:27017/realtime-docs?authSource=admin
JWT_SECRET=vps-super-secret-jwt-key-$(date +%s)
JWT_EXPIRES_IN=7d
PORT=3001
FRONTEND_URL=http://frontend:3000

# Frontend URLs for VPS
NEXT_PUBLIC_API_URL=http://$VPS_IP:3001/api
NEXT_PUBLIC_SOCKET_URL=http://$VPS_IP:3001

# MongoDB Configuration
MONGO_INITDB_ROOT_USERNAME=admin
MONGO_INITDB_ROOT_PASSWORD=password123
MONGO_INITDB_DATABASE=realtime-docs
EOF

echo "✅ Created .env.vps with IP: $VPS_IP"

# Update docker-compose for VPS
echo "📝 Creating VPS docker-compose configuration..."
cp docker-compose.yml docker-compose.vps.yml

# Replace env file reference in docker-compose
sed -i 's/\.env\.docker/\.env\.vps/g' docker-compose.vps.yml

echo "🐳 Building and starting services..."

# Stop any existing containers
docker-compose -f docker-compose.vps.yml down 2>/dev/null || true

# Build and start services
docker-compose -f docker-compose.vps.yml up --build -d

echo "⏳ Waiting for services to start..."
sleep 30

# Check service status
echo "📊 Service Status:"
docker-compose -f docker-compose.vps.yml ps

echo ""
echo "🎉 Deployment completed!"
echo ""
echo "📱 Access your application:"
echo "🔹 Frontend:      http://$VPS_IP:3000"
echo "🔹 Backend API:   http://$VPS_IP:3001"
echo "🔹 Mongo Express: http://$VPS_IP:8081"
echo ""
echo "🔐 Default MongoDB credentials:"
echo "   Username: admin"
echo "   Password: password123"
echo ""
echo "📋 Useful commands:"
echo "   View logs:    docker-compose -f docker-compose.vps.yml logs -f"
echo "   Stop:         docker-compose -f docker-compose.vps.yml down"
echo "   Restart:      docker-compose -f docker-compose.vps.yml restart"
echo ""
echo "⚠️  Security reminders for production:"
echo "   1. Change default MongoDB password"
echo "   2. Update JWT_SECRET in .env.vps"
echo "   3. Configure firewall rules"
echo "   4. Enable SSL/HTTPS"
echo ""
