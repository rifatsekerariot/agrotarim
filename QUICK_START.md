# 🚀 Quick Start Guide (Fresh Install)

## Tek Komut ile Başlat

```bash
git clone https://github.com/user/sera-otomasyon.git
cd sera-otomasyon
chmod +x setup.sh
./setup.sh
```

Bu komut **her şeyi** kurar:
- ✅ Dependencies (backend + frontend)
- ✅ JWT_SECRET oluşturur
- ✅ .env dosyalarını hazırlar
- ✅ Database migration çalıştırır
- ✅ Frontend build yapar
- ✅ Konfigürasyonu doğrular

---

## İlk Açılış (Landing Page)

### Development Modu

```bash
# Terminal 1 - Backend
cd backend
npm start

# Terminal 2 - Frontend (yeni terminal)
cd frontend
npm run dev
```

**Tarayıcıda açın:** `http://localhost:5173`

### İlk Karşılama:

1. **Setup Page otomatik açılır** (database boşsa)
2. Admin kullanıcı oluşturun
3. İlk farm'ı ekleyin
4. Dashboard'a yönlendiril irsiniz

### Production (Docker)

```bash
docker compose up -d --build
```

**Tarayıcıda açın:** `http://localhost:3008`

Aynı setup akışı çalışır.

---

## Troubleshooting: Landing Page Açılmıyor

### 1. Backend Bağlantı Hatası

**Belirti:** Sayfa yükleniyor ama beyaz ekran

**Çözüm:**
```bash
# Backend çalışıyor mu?
curl http://localhost:3009/api/setup/status

# Expected: {"needsSetup":true} veya {"needsSetup":false}

# Eğer connection refused:
cd backend
npm start
```

### 2. Vite Proxy Hatası (ÇÖZÜLDÜ)

**Eski sorun:** `vite.config.js` yanlış porta proxy yapıyordu

**✅ Düzeltildi:**
```javascript
proxy: {
    '/api': {
        target: 'http://localhost:3009',  // ✅ Doğru port
        changeOrigin: true
    }
}
```

### 3. Port Çakışması

```bash
# Portları kontrol et
lsof -i :3009  # Backend
lsof -i :5173  # Frontend dev
lsof -i :3008  # Frontend prod

# Process'i öldür
kill -9 <PID>
```

### 4. Database Bağlantı Hatası

```bash
# PostgreSQL çalışıyor mu?
sudo systemctl status postgresql

# Database var mı?
psql -U postgres -l | grep sera_db

# Migration çalıştır
cd backend
npx prisma migrate deploy
```

### 5. JWT_SECRET Eksik

**Belirti:** Backend başlamıyor, "FATAL: JWT_SECRET is not defined"

**Çözüm:**
```bash
./setup-env.sh
# Veya manuel:
cd backend
echo "JWT_SECRET=$(node -e "console.log(require('crypto').randomBytes(64).toString('hex'))")" >> .env
```

---

## Doğrulama Script'i

```bash
chmod +x verify-setup.sh
./verify-setup.sh
```

Bu kontrol eder:
- ✅ Dependencies kurulu mu?
- ✅ .env dosyaları mevcut mu?
- ✅ JWT_SECRET set edilmiş mi?
- ✅ Database bağlantısı çalışıyor mu?
- ✅ Vite proxy doğru mu?
- ✅ Portlar müsait mi?

---

## Normal İşleyiş

### İlk Kurulum
```
git clone → ./setup.sh → Backend + Frontend başlat
→ http://localhost:5173 aç
→ /setup sayfası otomatik açılır
→ Admin kullanıcı oluştur
→ Dashboard'a yölendir
```

### Sonraki Açılışlar
```
Backend + Frontend başlat
→ http://localhost:5173 aç
→ /login sayfası açılır (setup tamamlandığı için)
→ Login ol
→ Dashboard
```

---

## Docker İlk Açılış

```bash
docker compose up -d --build

# Logları izle
docker compose logs -f

# Backend hazır oldu mu?
curl http://localhost:3009/api/setup/status

# Frontend aç
http://localhost:3008
```

**Expected:** Setup page veya login page açılır.

---

## Hata Mesajları

### "Cannot GET /"
**Sebep:** Frontend build yoksa veya serve edilmiyor
**Çözüm:** `cd frontend && npm run dev`

### "Network Error"
**Sebep:** Backend çalışmıyor veya yanlış port
**Çözüm:** Backend'i başlat, Vite proxy'yi kontrol et

### "Setup check failed"
**Sebep:** `/api/setup/status` endpoint'ine ulaşamıyor
**Çözüm:** 
1. Backend başlat
2. Vite proxy kontrolü (port 3009)
3. CORS ayarları

### White Screen
**Sebep:** React hatası veya API bağlantı sorunu
**Çözüm:** Browser console'u aç (F12), hataları kontrol et

---

## Test Checklist

- [ ] `./setup.sh` hatasız tamamlandı
- [ ] `./verify-setup.sh` tüm kontroller geçti
- [ ] Backend başladı (`npm start` in backend/)
- [ ] Frontend başladı (`npm run dev` in frontend/)
- [ ] `http://localhost:5173` açıldı
- [ ] Setup page göründü VEYA login page göründü
- [ ] Admin kullanıcı oluşturuldu
- [ ] Dashboard açıldı

---

**Son Güncelleme:** 2026-01-18 (Vite proxy düzeltmesi)
