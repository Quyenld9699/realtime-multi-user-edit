# Real-time Collaborative Document Editor

Hệ thống chỉnh sửa tài liệu cộng tác thời gian thực với khả năng chia sẻ và đồng bộ hóa.

## Công nghệ sử dụng

-   **Frontend**: Next.js 14 + React + TypeScript + Tailwind CSS
-   **Backend**: NestJS + TypeScript + Socket.io
-   **Database**: MongoDB + Mongoose
-   **Authentication**: JWT
-   **Real-time**: Socket.io
-   **Deployment**: Docker + Docker Compose

## Tính năng

-   ✅ Đăng ký/Đăng nhập người dùng
-   ✅ Tạo và quản lý tài liệu
-   ✅ Chỉnh sửa tài liệu thời gian thực
-   ✅ Chia sẻ tài liệu với nhiều người dùng
-   ✅ Thông báo khi có người khác chỉnh sửa
-   ✅ Hiển thị con trỏ của người dùng khác
-   ✅ Lịch sử thay đổi tài liệu
-   ✅ Docker deployment với WSL Ubuntu

## 🚀 Quick Start - Single Command Deployment

**Chỉ cần 1 lệnh để chạy toàn bộ ứng dụng:**

```bash
# Chuyển đến thư mục project
cd /path/to/test-realtime-edit

# Single command - khởi động toàn bộ stack
docker-compose up --build -d
```

**Hoặc sử dụng script:**

```bash
# WSL Ubuntu
./docker.sh start prod

# Windows PowerShell
.\docker.ps1 start prod
```

**Services sẽ chạy tại:**

-   🔹 **Frontend**: http://localhost:3000 (Next.js App)
-   🔹 **Backend API**: http://localhost:3001 (NestJS API)
-   🔹 **MongoDB**: localhost:27017 (Database)
-   🔹 **Mongo Express**: http://localhost:8081 (Admin UI)

**Kiểm tra trạng thái:**

```bash
# Xem services
docker-compose ps

# Xem logs
docker-compose logs -f

# Dừng services
docker-compose down
```

## 🌐 Deploy lên VPS Server

### Tự động deploy với script:

**Linux/WSL:**

```bash
# Cấp quyền thực thi
chmod +x deploy-vps.sh

# Deploy với IP của VPS
./deploy-vps.sh 192.168.1.100
```

**Windows PowerShell:**

```powershell
# Deploy với IP của VPS
.\deploy-vps.ps1 -VpsIP "192.168.1.100"
```

### Manual deploy:

1. **Cập nhật IP trong .env.production:**

```env
NEXT_PUBLIC_API_URL=http://YOUR_VPS_IP:3001/api
NEXT_PUBLIC_SOCKET_URL=http://YOUR_VPS_IP:3001
```

2. **Deploy với docker-compose:**

```bash
# Copy environment file
cp .env.production .env.vps

# Deploy
docker-compose --env-file .env.vps up --build -d
```

3. **Truy cập ứng dụng:**

-   Frontend: `http://YOUR_VPS_IP:3000`
-   Backend API: `http://YOUR_VPS_IP:3001`
-   Database Admin: `http://YOUR_VPS_IP:8081`

### Cấu hình bảo mật cho VPS:

1. **Cập nhật mật khẩu mặc định**
2. **Cấu hình firewall:**

```bash
# Ubuntu/Debian
sudo ufw allow 3000
sudo ufw allow 3001
sudo ufw allow 8081
```

3. **Enable SSL/HTTPS với reverse proxy (Nginx)**

## Cấu trúc dự án

```
├── frontend/              # Next.js application
├── backend/               # NestJS API server
├── shared/                # Shared types and utilities
├── docker-compose.yml     # Production Docker setup
├── docker-compose.dev.yml # Development Docker setup
├── docker.sh              # Docker management script for WSL
├── docker.ps1             # Docker management script for Windows
└── WSL_DOCKER_USAGE_GUIDE.md  # WSL Docker usage guide
```

## Yêu cầu hệ thống

### Cách 1: Docker với WSL Ubuntu (Khuyến nghị)

-   Windows với WSL2
-   Ubuntu trong WSL
-   Docker đã cài đặt trong WSL Ubuntu

### Cách 2: Cài đặt thủ công

-   Node.js >= 18.0.0
-   MongoDB >= 4.4
-   npm hoặc yarn

## Cài đặt và chạy

### 🐳 Docker với WSL Ubuntu (Khuyến nghị)

```bash
# 1. Truy cập WSL Ubuntu
wsl -d Ubuntu

# 2. Di chuyển đến thư mục project
cd /mnt/d/MyProject/test-realtime-edit

# 3. Cấp quyền thực thi cho script (chỉ cần 1 lần)
chmod +x docker.sh

# 4. Kiểm tra Docker
./docker.sh check

# 5. Khởi động development environment
./docker.sh start dev

# 6. Xem trạng thái services
./docker.sh status dev
```

**Services sẽ chạy tại:**

-   Backend API: http://localhost:3001
-   MongoDB: mongodb://localhost:27017
-   Mongo Express: http://localhost:8081

**Quản lý Docker:**

```bash
# Xem logs
./docker.sh logs dev

# Dừng services
./docker.sh stop dev

# Build lại
./docker.sh build dev

# Xem hướng dẫn chi tiết
cat WSL_DOCKER_USAGE_GUIDE.md
```

### 📦 Cài đặt thủ công

#### 1. Cài đặt MongoDB

Đảm bảo MongoDB đang chạy trên máy tính của bạn:

-   Cài đặt MongoDB Community Server
-   Khởi động MongoDB service
-   MongoDB sẽ chạy trên `mongodb://localhost:27017`

### 2. Backend Setup

```bash
cd backend
npm install
```

Tạo file `.env` trong thư mục backend:

```env
DATABASE_URL=mongodb://localhost:27017/realtime-docs
JWT_SECRET=your-super-secret-jwt-key-change-this-in-production
JWT_EXPIRES_IN=7d
PORT=3001
NODE_ENV=development
FRONTEND_URL=http://localhost:3000
```

Chạy backend:

```bash
npm run start:dev
```

Backend sẽ chạy trên `http://localhost:3001`

### 3. Frontend Setup

```bash
cd frontend
npm install
```

Tạo file `.env.local` trong thư mục frontend:

```env
NEXT_PUBLIC_API_URL=http://localhost:3001/api
NEXT_PUBLIC_SOCKET_URL=http://localhost:3001
```

Chạy frontend:

```bash
npm run dev
```

Frontend sẽ chạy trên `http://localhost:3000`

## Sử dụng

1. Mở trình duyệt và truy cập `http://localhost:3000`
2. Đăng ký tài khoản mới hoặc đăng nhập
3. Tạo tài liệu mới từ Dashboard
4. Bắt đầu chỉnh sửa tài liệu
5. Chia sẻ tài liệu với người khác bằng email
6. Cộng tác chỉnh sửa thời gian thực!

## Tính năng chính

### Đăng ký/Đăng nhập

-   Hệ thống authentication với JWT
-   Bảo mật mật khẩu với bcrypt
-   Session management

### Quản lý tài liệu

-   Tạo, chỉnh sửa, xóa tài liệu
-   Phân quyền owner và collaborator
-   Chia sẻ tài liệu qua email

### Real-time Collaboration

-   Socket.io để đồng bộ thời gian thực
-   Hiển thị con trỏ của người dùng khác
-   Thông báo khi có người join/leave
-   Đồng bộ nội dung tức thì

## API Endpoints

### Authentication

-   `POST /api/auth/register` - Đăng ký
-   `POST /api/auth/login` - Đăng nhập

### Documents

-   `GET /api/documents` - Lấy danh sách tài liệu
-   `POST /api/documents` - Tạo tài liệu mới
-   `GET /api/documents/:id` - Lấy chi tiết tài liệu
-   `PUT /api/documents/:id` - Cập nhật tài liệu
-   `DELETE /api/documents/:id` - Xóa tài liệu
-   `POST /api/documents/:id/share` - Chia sẻ tài liệu

## Socket Events

### Client to Server

-   `join-document` - Tham gia chỉnh sửa tài liệu
-   `leave-document` - Rời khỏi tài liệu
-   `document-operation` - Gửi thao tác chỉnh sửa
-   `cursor-position` - Gửi vị trí con trỏ

### Server to Client

-   `document-loaded` - Tài liệu đã được tải
-   `document-updated` - Tài liệu được cập nhật
-   `user-joined` - Người dùng tham gia
-   `user-left` - Người dùng rời đi
-   `cursor-moved` - Con trỏ di chuyển

## Troubleshooting

### Backend không khởi động được

-   Kiểm tra MongoDB đang chạy
-   Kiểm tra port 3001 có bị chiếm không
-   Kiểm tra file .env có đúng format không

### Frontend không kết nối được backend

-   Kiểm tra backend đang chạy trên port 3001
-   Kiểm tra CORS settings
-   Kiểm tra file .env.local

### Socket.io không hoạt động

-   Kiểm tra firewall settings
-   Kiểm tra browser console có lỗi không
-   Kiểm tra network connection

## Development

### Backend Development

```bash
cd backend
npm run start:dev    # Development mode với hot reload
npm run build        # Build for production
npm run start:prod   # Production mode
```

### Frontend Development

```bash
cd frontend
npm run dev          # Development mode
npm run build        # Build for production
npm run start        # Production mode
```

## Production Deployment

### Environment Variables

Đảm bảo thiết lập các environment variables sau trong production:

Backend:

-   `DATABASE_URL` - MongoDB connection string
-   `JWT_SECRET` - Strong random secret key
-   `FRONTEND_URL` - Production frontend URL

Frontend:

-   `NEXT_PUBLIC_API_URL` - Production backend API URL
-   `NEXT_PUBLIC_SOCKET_URL` - Production Socket.io URL

### Security Considerations

-   Thay đổi JWT_SECRET trong production
-   Sử dụng HTTPS cho production
-   Cấu hình CORS properly
-   Sử dụng MongoDB Atlas hoặc managed database

## Contributing

1. Fork the project
2. Create your feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

## License

This project is licensed under the MIT License.
