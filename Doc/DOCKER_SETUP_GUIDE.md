# 🐳 راهنمای اجرای پروژه با Docker

## پیش‌نیازها

قبل از شروع، مطمئن شوید این موارد روی سیستم شما نصب است:

### 1. نصب Docker Desktop
- **Windows/Mac**: دانلود از [docker.com/products/docker-desktop](https://www.docker.com/products/docker-desktop/)
- **Linux**: 
  ```bash
  sudo apt-get update
  sudo apt-get install docker.io docker-compose
  ```

### 2. بررسی نصب موفق
```bash
docker --version
docker-compose --version
```

---

## 🚀 راه‌اندازی سریع (Quick Start)

### گام 1: دریافت کد از GitHub
```bash
# Clone کردن پروژه
git clone https://github.com/aminchedo/BoltAiCrypto.git
cd BoltAiCrypto

# یا اگر قبلاً clone کردید، pull کنید:
git pull origin main
```

### گام 2: اجرای پروژه با Docker Compose
```bash
# ساخت و اجرای همه سرویس‌ها
docker-compose up --build
```

این دستور:
- ✅ Backend را می‌سازد (Python/FastAPI)
- ✅ Frontend را می‌سازد (React/Vite)
- ✅ Nginx را برای proxy تنظیم می‌کند
- ✅ Network مشترک ایجاد می‌کند

### گام 3: دسترسی به برنامه
بعد از 2-3 دقیقه (برای build اولیه):

- 🌐 **Frontend**: http://localhost:8080
- 🔌 **Backend API**: http://localhost:8000
- 📚 **API Docs**: http://localhost:8000/docs
- 🔍 **Health Check**: http://localhost:8000/health

---

## ⚙️ دستورات مفید Docker

### اجرا و توقف

```bash
# اجرا در پس‌زمینه (detached mode)
docker-compose up -d

# مشاهده لاگ‌ها
docker-compose logs -f

# توقف سرویس‌ها
docker-compose down

# توقف و حذف volumes
docker-compose down -v
```

### مدیریت Containers

```bash
# لیست containers در حال اجرا
docker ps

# مشاهده لاگ backend
docker logs -f boltai_backend

# مشاهده لاگ frontend
docker logs -f boltai_web

# ورود به shell backend
docker exec -it boltai_backend bash

# ورود به shell frontend  
docker exec -it boltai_web sh
```

### بازسازی (Rebuild)

```bash
# Rebuild همه سرویس‌ها
docker-compose up --build

# Rebuild فقط backend
docker-compose up --build backend

# Rebuild فقط frontend
docker-compose up --build web

# پاک‌سازی کامل و rebuild
docker-compose down
docker system prune -a
docker-compose up --build
```

---

## 🔧 تنظیمات اختیاری

### 1. تنظیم API Keys (اختیاری ولی توصیه می‌شود)

فایل `backend/.env` را ویرایش کنید:
```bash
nano backend/.env
# یا
code backend/.env
```

مقادیر مهم:
```env
# Database (پیش‌فرض SQLite - برای تست کافیه)
DATABASE_URL=sqlite:///./trading_system.db

# JWT Secret (حتماً در production تغییرش بدید!)
JWT_SECRET=your-secret-key-change-this-in-production

# API Keys (اختیاری - برای ویژگی‌های پیشرفته)
BINANCE_API_KEY=
KUCOIN_API_KEY=
COINMARKETCAP_API_KEY=
HUGGINGFACE_API_KEY=

# Telegram Bot (اختیاری)
TELEGRAM_BOT_TOKEN=
TELEGRAM_CHAT_ID=
```

### 2. تغییر پورت‌ها

اگر پورت‌های 8080 یا 8000 روی سیستم شما اشغال هستند، `docker-compose.yml` را ویرایش کنید:

```yaml
services:
  backend:
    ports:
      - "8001:8000"  # تغییر پورت backend

  web:
    ports:
      - "3000:80"    # تغییر پورت frontend
```

---

## 🐛 عیب‌یابی (Troubleshooting)

### مشکل 1: پورت اشغال است
```bash
# پیدا کردن process که پورت را اشغال کرده
# Windows
netstat -ano | findstr :8080
taskkill /PID <PID> /F

# Mac/Linux
lsof -i :8080
kill -9 <PID>
```

### مشکل 2: خطای "Cannot connect to Docker daemon"
```bash
# شروع Docker service
# Windows/Mac: Docker Desktop را باز کنید
# Linux:
sudo systemctl start docker
sudo systemctl enable docker
```

### مشکل 3: Build خیلی کند است
```bash
# استفاده از cache برای سرعت بیشتر
docker-compose build --parallel

# یا فقط یکبار build کنید و بعد up کنید:
docker-compose build
docker-compose up
```

### مشکل 4: Backend Dependencies خطا می‌دهد
اگر در build backend با خطا مواجه شدید:
```bash
# لاگ‌های دقیق build را ببینید
docker-compose build --no-cache backend
docker-compose up backend
```

مشکلات شناخته شده:
- `numba`, `quantlib` ممکن است در برخی سیستم‌ها مشکل داشته باشند
- در این صورت می‌توانید آن‌ها را از `backend/requirements.txt` موقتاً comment کنید

### مشکل 5: Frontend صفحه سفید نشان می‌دهد
```bash
# بررسی لاگ‌های nginx
docker logs boltai_web

# بررسی اینکه فایل‌های build شده‌اند
docker exec -it boltai_web ls -la /usr/share/nginx/html

# Rebuild frontend
docker-compose up --build web
```

---

## 📊 بررسی سلامت سیستم

### 1. تست Backend API
```bash
curl http://localhost:8000/health
```

پاسخ موفق:
```json
{
  "status": "healthy",
  "timestamp": "2025-10-05T..."
}
```

### 2. تست WebSocket
در browser console:
```javascript
const ws = new WebSocket('ws://localhost:8080/ws/realtime');
ws.onmessage = (e) => console.log('Message:', e.data);
ws.onopen = () => console.log('Connected!');
```

### 3. تست سیستم کامل
1. باز کردن http://localhost:8080
2. کلیک روی تب "🔍 اسکنر جامع"
3. کلیک روی "اسکن فوری" (Quick Scan)
4. مشاهده نتایج بدون خطا

---

## 🎯 حالت‌های مختلف اجرا

### حالت Development (توصیه برای توسعه)
```bash
# بدون Docker - سریع‌تر برای development
npm install
npm run dev
```
این حالت:
- ✅ Hot reload دارد
- ✅ سریع‌تر restart می‌شود
- ✅ برای توسعه بهتر است

### حالت Production (با Docker)
```bash
# با Docker - مثل production
docker-compose up --build
```
این حالت:
- ✅ مثل production server اجرا می‌شود
- ✅ Nginx proxy دارد
- ✅ برای تست نهایی بهتر است

---

## 📝 نکات مهم

### 1. مصرف منابع
Docker ممکن است منابع زیادی مصرف کند:
- **RAM**: حداقل 4GB، توصیه 8GB
- **CPU**: حداقل 2 cores
- **Disk**: حدود 5-10GB برای images

### 2. حذف Images و Volumes قدیمی
```bash
# پاکسازی کامل (احتیاط کنید!)
docker system prune -a --volumes

# فقط حذف images استفاده نشده
docker image prune -a

# حذف volumes استفاده نشده
docker volume prune
```

### 3. Performance بهتر
برای Mac/Windows، در Docker Desktop settings:
- Resources → Memory: حداقل 4GB اختصاص دهید
- Resources → CPUs: حداقل 2 CPU
- Enable VirtioFS file sharing (Mac)

---

## 🎓 دستورات یکخطی

```bash
# نصب و اجرای سریع
git clone https://github.com/aminchedo/BoltAiCrypto.git && cd BoltAiCrypto && docker-compose up --build

# توقف و حذف همه چیز
docker-compose down -v && docker system prune -a -f

# Restart سریع
docker-compose restart

# مشاهده وضعیت
docker-compose ps
```

---

## ✅ چک‌لیست موفقیت

پس از اجرا، این موارد باید کار کنند:

- [ ] http://localhost:8080 باز می‌شود
- [ ] داشبورد اصلی نمایش داده می‌شود
- [ ] تب "اسکنر جامع" کار می‌کند
- [ ] دکمه "تولید سیگنال" پاسخ می‌دهد
- [ ] WebSocket Badge در هدر سبز است
- [ ] http://localhost:8000/docs باز می‌شود
- [ ] API health check موفق است

---

## 🆘 کمک بیشتر

اگر با مشکل مواجه شدید:

1. **لاگ‌ها را چک کنید:**
   ```bash
   docker-compose logs -f
   ```

2. **Container health را بررسی کنید:**
   ```bash
   docker ps
   docker inspect boltai_backend
   ```

3. **مستندات API را ببینید:**
   http://localhost:8000/docs

4. **GitHub Issues:**
   https://github.com/aminchedo/BoltAiCrypto/issues

---

## 🎉 تمام!

حالا پروژه شما با Docker در حال اجراست!
- Frontend: http://localhost:8080
- Backend: http://localhost:8000
- Docs: http://localhost:8000/docs

موفق باشید! 🚀
