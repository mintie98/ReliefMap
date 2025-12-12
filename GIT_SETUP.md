# Hướng dẫn đẩy code lên GitHub

## Bước 1: Khởi tạo Git repository

```bash
cd /Users/mintie/Desktop/ReliefMap

# Khởi tạo Git repo
git init

# Kiểm tra security trước khi commit
./check-security.sh
```

## Bước 2: Tạo file .env từ .env.example

```bash
# Backend
cd backend
cp .env.example .env
# Sau đó chỉnh sửa .env với thông tin thật của bạn

# Frontend  
cd ../frontend
cp .env.example .env
# Sau đó chỉnh sửa .env với API key thật của bạn
```

## Bước 3: Kiểm tra lại security

```bash
cd /Users/mintie/Desktop/ReliefMap

# Chạy script kiểm tra
./check-security.sh

# Kiểm tra thủ công
git status
# Không nên thấy file .env trong danh sách
```

## Bước 4: Commit code

```bash
# Thêm tất cả files (trừ .env - đã được ignore)
git add .

# Kiểm tra lại những gì sẽ commit
git status

# Commit
git commit -m "Initial commit: ReliefMap WC finder application"
```

## Bước 5: Tạo repository trên GitHub

1. Đăng nhập GitHub
2. Click "New repository"
3. Đặt tên: `ReliefMap` (hoặc tên bạn muốn)
4. **KHÔNG** tích "Initialize with README" (vì đã có code local)
5. Click "Create repository"

## Bước 6: Push lên GitHub

```bash
# Thêm remote (thay YOUR_USERNAME bằng username GitHub của bạn)
git remote add origin https://github.com/YOUR_USERNAME/ReliefMap.git

# Hoặc dùng SSH:
# git remote add origin git@github.com:YOUR_USERNAME/ReliefMap.git

# Push code
git branch -M main
git push -u origin main
```

## Kiểm tra lại trên GitHub

1. Vào repository trên GitHub
2. Kiểm tra xem **KHÔNG** có file `.env` nào
3. Kiểm tra có file `.env.example` để người khác biết cần config gì

## Nếu vô tình commit .env file

Nếu bạn đã commit `.env` file nhầm:

```bash
# Xóa khỏi Git tracking (nhưng giữ file local)
git rm --cached backend/.env
git rm --cached frontend/.env

# Commit việc xóa
git commit -m "Remove .env files from tracking"

# Push lại
git push origin main
```

## Lưu ý quan trọng

⚠️ **TRƯỚC KHI PUSH:**
- ✅ Chạy `./check-security.sh` để kiểm tra
- ✅ Đảm bảo `.env` KHÔNG có trong `git status`
- ✅ Đảm bảo `.env.example` có đầy đủ thông tin (nhưng không có giá trị thật)
- ✅ Kiểm tra không có API key hardcode trong code

🔒 **BẢO MẬT:**
- File `.env` đã được thêm vào `.gitignore` tự động
- Không bao giờ commit file `.env`
- Sử dụng `.env.example` làm template
- Restrict API keys trong Google Cloud Console

