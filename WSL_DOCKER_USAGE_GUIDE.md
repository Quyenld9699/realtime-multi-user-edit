# Hướng dẫn sử dụng Docker với WSL trên Windows

## Cấu hình hệ thống

-   **OS:** Windows với WSL2 Ubuntu
-   **Docker:** Đã cài đặt trong WSL Ubuntu (version 27.2.1)
-   **Project path:** `/mnt/d/MyProject/test-realtime-edit`

## Lệnh truy cập WSL từ Windows

```bash
# Truy cập WSL Ubuntu từ Windows Terminal/Command Prompt
wsl -d Ubuntu

# Hoặc chạy lệnh trực tiếp trong WSL
wsl -d Ubuntu -e bash -c "cd /mnt/d/MyProject/test-realtime-edit && [command]"
```

## Cấu trúc thư mục trong WSL

```
Windows Path: D:\MyProject\test-realtime-edit
WSL Path:     /mnt/d/MyProject/test-realtime-edit
```

## Scripts quản lý Docker

### 1. Script chính: `docker.sh`

```bash
# Cấp quyền thực thi (chỉ cần làm 1 lần)
chmod +x docker.sh

# Kiểm tra Docker
./docker.sh check

# Khởi động development environment
./docker.sh start dev

# Xem logs tất cả services
./docker.sh logs dev

# Xem logs service cụ thể
./docker.sh logs dev backend
./docker.sh logs dev mongodb

# Dừng services
./docker.sh stop dev

# Khởi động lại services
./docker.sh restart dev

# Build lại images
./docker.sh build dev

# Xem trạng thái services
./docker.sh status dev

# Dọn dẹp containers và volumes
./docker.sh clean dev
```

### 2. Lệnh Docker trực tiếp

```bash
# Từ Windows Terminal/PowerShell
wsl -d Ubuntu bash -c "cd /mnt/d/MyProject/test-realtime-edit && docker compose -f docker-compose.dev.yml up -d"

# Build services
wsl -d Ubuntu bash -c "cd /mnt/d/MyProject/test-realtime-edit && docker compose -f docker-compose.dev.yml build"

# Xem containers đang chạy
wsl -d Ubuntu bash -c "cd /mnt/d/MyProject/test-realtime-edit && docker ps"

# Xem logs
wsl -d Ubuntu bash -c "cd /mnt/d/MyProject/test-realtime-edit && docker compose -f docker-compose.dev.yml logs"
```

## Services được triển khai

### Development Environment (`docker-compose.dev.yml`)

1. **MongoDB Database**

    - Container: `realtime-docs-mongodb-dev`
    - Port: `27017`
    - URL: `mongodb://localhost:27017`
    - Credentials: admin/password123

2. **Backend API**

    - Container: `realtime-docs-backend-dev`
    - Port: `3001`
    - Health Check: `http://localhost:3001/api/health`
    - Environment: Development

3. **Mongo Express (Database UI)**
    - Container: `realtime-docs-mongo-express-dev`
    - Port: `8081`
    - URL: `http://localhost:8081`
    - Credentials: admin/admin

## Workflow thông thường

### Khởi động hệ thống

```bash
# 1. Mở Windows Terminal
# 2. Chạy lệnh
wsl -d Ubuntu bash -c "cd /mnt/d/MyProject/test-realtime-edit && ./docker.sh start dev"

# 3. Kiểm tra services
wsl -d Ubuntu bash -c "cd /mnt/d/MyProject/test-realtime-edit && ./docker.sh status dev"

# 4. Test backend
curl http://localhost:3001/api/health
```

### Phát triển

```bash
# Xem logs real-time
wsl -d Ubuntu bash -c "cd /mnt/d/MyProject/test-realtime-edit && ./docker.sh logs dev"

# Build lại sau khi thay đổi code
wsl -d Ubuntu bash -c "cd /mnt/d/MyProject/test-realtime-edit && ./docker.sh build dev"
wsl -d Ubuntu bash -c "cd /mnt/d/MyProject/test-realtime-edit && ./docker.sh restart dev"
```

### Dừng hệ thống

```bash
wsl -d Ubuntu bash -c "cd /mnt/d/MyProject/test-realtime-edit && ./docker.sh stop dev"
```

## Endpoints có sẵn

### Backend APIs

-   **Health Check:** `GET http://localhost:3001/api/health`
-   **Authentication:**
    -   Login: `POST http://localhost:3001/api/auth/login`
    -   Register: `POST http://localhost:3001/api/auth/register`
-   **Users:**
    -   Profile: `GET http://localhost:3001/api/users/profile`
-   **Documents:**
    -   List: `GET http://localhost:3001/api/documents`
    -   Create: `POST http://localhost:3001/api/documents`
    -   Get: `GET http://localhost:3001/api/documents/:id`
    -   Update: `PUT http://localhost:3001/api/documents/:id`
    -   Delete: `DELETE http://localhost:3001/api/documents/:id`
-   **WebSocket:** `ws://localhost:3001` (real-time collaboration)

### Database Management

-   **Mongo Express:** `http://localhost:8081`
-   **MongoDB Direct:** `mongodb://admin:password123@localhost:27017/realtime-docs?authSource=admin`

## Troubleshooting

### Docker không khởi động

```bash
# Kiểm tra Docker service trong WSL
wsl -d Ubuntu bash -c "sudo service docker status"

# Khởi động Docker service
wsl -d Ubuntu bash -c "sudo service docker start"
```

### Container bị lỗi

```bash
# Xem logs chi tiết
wsl -d Ubuntu bash -c "cd /mnt/d/MyProject/test-realtime-edit && docker logs realtime-docs-backend-dev"

# Rebuild image
wsl -d Ubuntu bash -c "cd /mnt/d/MyProject/test-realtime-edit && docker compose -f docker-compose.dev.yml build backend --no-cache"
```

### Port bị chiếm

```bash
# Kiểm tra port đang sử dụng
netstat -ano | findstr :3001
netstat -ano | findstr :27017
netstat -ano | findstr :8081

# Dừng tất cả containers
wsl -d Ubuntu bash -c "cd /mnt/d/MyProject/test-realtime-edit && docker compose -f docker-compose.dev.yml down"
```

## Performance Tips

1. **Đặt code trong WSL filesystem để performance tốt hơn:**

    ```bash
    # Thay vì /mnt/d/MyProject/test-realtime-edit
    # Nên copy vào ~/projects/test-realtime-edit
    ```

2. **Sử dụng WSL2 thay vì WSL1**

3. **Cấu hình `.wslconfig` cho performance tối ưu** (đã có trong project)

## Backup và Restore

### Backup Database

```bash
wsl -d Ubuntu bash -c "cd /mnt/d/MyProject/test-realtime-edit && docker exec realtime-docs-mongodb-dev mongodump --authenticationDatabase admin -u admin -p password123 --out /data/backup"
```

### Export Database

```bash
wsl -d Ubuntu bash -c "cd /mnt/d/MyProject/test-realtime-edit && docker exec realtime-docs-mongodb-dev mongoexport --authenticationDatabase admin -u admin -p password123 --db realtime-docs --collection documents --out /data/documents.json"
```

## Lệnh nhanh (Quick Commands)

```bash
# All-in-one development start
alias docker-dev-start="wsl -d Ubuntu bash -c 'cd /mnt/d/MyProject/test-realtime-edit && ./docker.sh start dev'"

# All-in-one development stop
alias docker-dev-stop="wsl -d Ubuntu bash -c 'cd /mnt/d/MyProject/test-realtime-edit && ./docker.sh stop dev'"

# Quick logs
alias docker-dev-logs="wsl -d Ubuntu bash -c 'cd /mnt/d/MyProject/test-realtime-edit && ./docker.sh logs dev'"

# Quick status
alias docker-dev-status="wsl -d Ubuntu bash -c 'cd /mnt/d/MyProject/test-realtime-edit && ./docker.sh status dev'"
```

## Production Deployment

Khi sẵn sàng deploy production:

```bash
# Sử dụng production config
wsl -d Ubuntu bash -c "cd /mnt/d/MyProject/test-realtime-edit && ./docker.sh start prod"
```

---

**Lưu ý:** File này được tạo ngày 05/08/2025 cho dự án Real-time Document Editor với Docker trên WSL Ubuntu Windows.
