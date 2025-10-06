# 🚀 شروع سریع با Docker (خیلی ساده!)

## گام 1: نصب Docker (یکبار برای همیشه)

### 🪟 Windows
1. برو به https://www.docker.com/products/docker-desktop/
2. دانلود Docker Desktop برای Windows
3. نصبش کن (مثل نصب هر برنامه دیگه‌ای)
4. کامپیوتر رو restart کن
5. Docker Desktop رو باز کن (باید همیشه در حال اجرا باشه)

### 🍎 Mac
1. برو به https://www.docker.com/products/docker-desktop/
2. دانلود Docker Desktop برای Mac
3. فایل .dmg رو باز کن و Docker رو به Applications بکش
4. Docker Desktop رو از Applications باز کن

### 🐧 Linux
```bash
sudo apt update
sudo apt install docker.io docker-compose
sudo systemctl start docker
sudo systemctl enable docker
sudo usermod -aG docker $USER
```
بعد logout و login کن.

---

## گام 2: دریافت پروژه

### اگر قبلاً پروژه رو داری:
```bash
cd BoltAiCrypto
git pull origin main
```

### اگر پروژه رو نداری:
```bash
git clone https://github.com/aminchedo/BoltAiCrypto.git
cd BoltAiCrypto
```

---

## گام 3: راه‌اندازی اولیه (یکبار برای همیشه)

### 🪟 Windows:
```bash
setup.bat
```

### 🍎 Mac/Linux:
```bash
./setup.sh
```

این اسکریپت فایل `.env` رو برات می‌سازه.

**یا دستی:**
```bash
cp backend/.env.example backend/.env
```

---

## گام 4: اجرای پروژه (فقط یک دستور! 🎉)

```bash
docker-compose up --build
```

**همین!** 🎊

حالا صبر کن 2-3 دقیقه تا:
- Backend ساخته بشه
- Frontend ساخته بشه
- همه چیز راه بیفته

وقتی این خطوط رو دیدی، یعنی آماده‌ست:
```
boltai_backend | INFO:     Uvicorn running on http://0.0.0.0:8000
boltai_web     | /docker-entrypoint.sh: Configuration complete; ready for start up
```

---

## گام 5: باز کردن برنامه

مرورگر رو باز کن و برو به:

### 🌐 http://localhost:8080

تمام! 🎉

---

## دستورات ساده دیگه

### متوقف کردن برنامه
```bash
Ctrl + C
```
یا در یک terminal جدید:
```bash
docker-compose down
```

### اجرای مجدد (اگر قبلاً build کردی)
```bash
docker-compose up
```

### اجرا در پس‌زمینه (بدون اینکه terminal رو بگیره)
```bash
docker-compose up -d
```

### دیدن لاگ‌ها (اگر در پس‌زمینه اجرا کردی)
```bash
docker-compose logs -f
```

### متوقف کردن (اگر در پس‌زمینه اجرا کردی)
```bash
docker-compose down
```

---

## ❓ مشکلات متداول

### مشکل: "Cannot connect to Docker daemon"
**حل**: Docker Desktop رو باز کن و مطمئن شو در حال اجراست

### مشکل: "Port 8080 is already in use"
**حل**: یا برنامه دیگه‌ای که پورت 8080 رو گرفته رو ببند، یا پورت رو عوض کن:

`docker-compose.yml` رو باز کن و این خط رو پیدا کن:
```yaml
ports:
  - "8080:80"
```
عوضش کن به:
```yaml
ports:
  - "3000:80"
```
حالا برو به http://localhost:3000

### مشکل: صفحه سفید یا خطا
**حل**: Rebuild کن:
```bash
docker-compose down
docker-compose up --build
```

### مشکل: خیلی کند build می‌شه
**حل**: نگران نباش! اولین بار 2-5 دقیقه طول می‌کشه. دفعات بعدی خیلی سریع‌تره.

---

## 🎯 چک کردن اینکه همه چیز کار می‌کنه

بعد از اجرا، این کارا رو انجام بده:

1. ✅ برو به http://localhost:8080 - باید داشبورد رو ببینی
2. ✅ برو به http://localhost:8000/docs - باید API docs رو ببینی
3. ✅ برو به http://localhost:8000/health - باید `{"status":"healthy"}` رو ببینی
4. ✅ تو داشبورد روی "تولید سیگنال" کلیک کن - باید کار کنه

---

## 💡 نکات مهم

1. **Docker Desktop باید در حال اجرا باشه**: همیشه قبل از اجرای دستورات، Docker Desktop رو باز کن

2. **فضای دیسک**: اولین بار حدود 5GB فضا می‌گیره

3. **RAM**: حداقل 4GB RAM برای Docker اختصاص بده (تو تنظیمات Docker Desktop)

4. **Build فقط یکبار**: بعد از اولین build، دفعات بعد خیلی سریع‌تره

---

## 🆘 کمک

اگه گیر کردی:

1. لاگ‌ها رو چک کن:
   ```bash
   docker-compose logs -f
   ```

2. همه چیز رو از نو بساز:
   ```bash
   docker-compose down
   docker system prune -a
   docker-compose up --build
   ```

3. Issue تو GitHub باز کن:
   https://github.com/aminchedo/BoltAiCrypto/issues

---

## 🎓 خلاصه دستورات

```bash
# اولین بار
docker-compose up --build

# دفعات بعد
docker-compose up

# توقف
Ctrl + C
# یا
docker-compose down

# اجرا در پس‌زمینه
docker-compose up -d

# دیدن لاگ‌ها
docker-compose logs -f
```

---

## ✨ حالا می‌تونی شروع کنی!

فقط کافیه این دستور رو بزنی:
```bash
docker-compose up --build
```

و بعد برو به http://localhost:8080

همین! 🎉
