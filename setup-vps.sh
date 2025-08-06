#!/bin/bash

# Complete VPS Setup Script for Real-time Document Editor
# Usage: ./setup-vps.sh [DOMAIN_OR_IP]

set -e

DOMAIN=${1:-$(curl -s ifconfig.me)}
PROJECT_NAME="realtime-docs"

echo "🚀 Setting up Real-time Document Editor on VPS..."
echo "📍 Domain/IP: $DOMAIN"

# Update system
echo "📦 Updating system packages..."
sudo apt update && sudo apt upgrade -y

# Install Docker if not exists
if ! command -v docker &> /dev/null; then
    echo "🐳 Installing Docker..."
    curl -fsSL https://get.docker.com -o get-docker.sh
    sudo sh get-docker.sh
    sudo usermod -aG docker $USER
    rm get-docker.sh
fi

# Install Docker Compose if not exists
if ! command -v docker-compose &> /dev/null; then
    echo "🔧 Installing Docker Compose..."
    sudo curl -L "https://github.com/docker/compose/releases/latest/download/docker-compose-$(uname -s)-$(uname -m)" -o /usr/local/bin/docker-compose
    sudo chmod +x /usr/local/bin/docker-compose
fi

# Install Nginx if not exists
if ! command -v nginx &> /dev/null; then
    echo "🌐 Installing Nginx..."
    sudo apt install -y nginx
fi

# Create project directory
PROJECT_DIR="/opt/$PROJECT_NAME"
echo "📁 Creating project directory: $PROJECT_DIR"
sudo mkdir -p $PROJECT_DIR
sudo chown $USER:$USER $PROJECT_DIR

# Clone or copy project files (assuming project is already on server)
if [ ! -d "$PROJECT_DIR/.git" ]; then
    echo "📁 Please upload your project files to: $PROJECT_DIR"
    echo "   Or clone from git: git clone <your-repo> $PROJECT_DIR"
    exit 1
fi

cd $PROJECT_DIR

# Create VPS environment file
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
NEXT_PUBLIC_API_URL=http://$DOMAIN:3001/api
NEXT_PUBLIC_SOCKET_URL=http://$DOMAIN:3001

# MongoDB Configuration
MONGO_INITDB_ROOT_USERNAME=admin
MONGO_INITDB_ROOT_PASSWORD=password123
MONGO_INITDB_DATABASE=realtime-docs
EOF

# Setup Nginx
echo "🌐 Configuring Nginx..."
sudo tee /etc/nginx/sites-available/$PROJECT_NAME > /dev/null << EOF
server {
    listen 80;
    server_name $DOMAIN;

    # Frontend
    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade \$http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host \$host;
        proxy_set_header X-Real-IP \$remote_addr;
        proxy_set_header X-Forwarded-For \$proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto \$scheme;
        proxy_cache_bypass \$http_upgrade;
        proxy_read_timeout 86400;
    }

    # Backend API
    location /api/ {
        proxy_pass http://localhost:3001/api/;
        proxy_http_version 1.1;
        proxy_set_header Upgrade \$http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host \$host;
        proxy_set_header X-Real-IP \$remote_addr;
        proxy_set_header X-Forwarded-For \$proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto \$scheme;
        proxy_cache_bypass \$http_upgrade;
        proxy_read_timeout 86400;
    }

    # Socket.io
    location /socket.io/ {
        proxy_pass http://localhost:3001/socket.io/;
        proxy_http_version 1.1;
        proxy_set_header Upgrade \$http_upgrade;
        proxy_set_header Connection "upgrade";
        proxy_set_header Host \$host;
        proxy_set_header X-Real-IP \$remote_addr;
        proxy_set_header X-Forwarded-For \$proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto \$scheme;
        proxy_read_timeout 86400;
    }
}
EOF

# Enable Nginx site
sudo ln -sf /etc/nginx/sites-available/$PROJECT_NAME /etc/nginx/sites-enabled/
sudo nginx -t && sudo systemctl reload nginx

# Configure firewall
echo "🔥 Configuring firewall..."
sudo ufw allow ssh
sudo ufw allow 'Nginx Full'
sudo ufw allow 3000
sudo ufw allow 3001
sudo ufw allow 8081
sudo ufw --force enable

# Create docker-compose override for VPS
cp docker-compose.yml docker-compose.vps.yml
sed -i 's/\.env\.docker/\.env\.vps/g' docker-compose.vps.yml

# Deploy application
echo "🐳 Deploying application..."
docker-compose -f docker-compose.vps.yml down 2>/dev/null || true
docker-compose -f docker-compose.vps.yml up --build -d

# Wait for services
echo "⏳ Waiting for services to start..."
sleep 30

# Check status
echo "📊 Service Status:"
docker-compose -f docker-compose.vps.yml ps

echo ""
echo "🎉 VPS Setup completed!"
echo ""
echo "📱 Access your application:"
echo "🔹 Main Site:     http://$DOMAIN"
echo "🔹 Direct Frontend: http://$DOMAIN:3000"
echo "🔹 Direct API:      http://$DOMAIN:3001"
echo "🔹 Database Admin:  http://$DOMAIN:8081"
echo ""
echo "🔐 Default credentials:"
echo "   MongoDB: admin / password123"
echo ""
echo "📋 Management commands:"
echo "   View logs:    docker-compose -f $PROJECT_DIR/docker-compose.vps.yml logs -f"
echo "   Restart:      docker-compose -f $PROJECT_DIR/docker-compose.vps.yml restart"
echo "   Stop:         docker-compose -f $PROJECT_DIR/docker-compose.vps.yml down"
echo ""
echo "🔒 Security TODO:"
echo "   1. Change MongoDB password"
echo "   2. Update JWT secret"
echo "   3. Setup SSL with Let's Encrypt"
echo "   4. Restrict database admin access"
echo ""
