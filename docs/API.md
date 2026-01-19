# 📚 ARIOT API Dokümantasyonu

Bu belge, ARIOT IoT Platformu'nun RESTful API uç noktalarını (endpoints) detaylandırır.

## 🔐 Kimlik Doğrulama (Authentication)

Tüm güvenli uç noktalar için `Authorization` başlığında Bearer Token gereklidir.

```http
Authorization: Bearer <your_jwt_token>
```

### Giriş Yap (Login)
- **Endpoint:** `POST /api/auth/login`
- **Body:** `{ "username": "admin", "password": "password" }`
- **Response:** `{ "token": "...", "user": { ... } }`

---

## 📡 Cihaz Yönetimi (Devices)

### Cihazları Listele
- **Endpoint:** `GET /api/devices`
- **Response:** `[ { "id": 1, "name": "Sera Sensörü", "devEui": "...", "status": "online", ... } ]`

### Yeni Cihaz Ekle
- **Endpoint:** `POST /api/devices`
- **Body:** `{ "name": "Yeni Sensör", "devEui": "...", "deviceModelId": 1, "loraServerId": 1 }`

### Cihaz Detayı
- **Endpoint:** `GET /api/devices/:id`

### Cihaz Sil
- **Endpoint:** `DELETE /api/devices/:id`

---

## 🌍 LoRaWAN Sunucuları

### Sunucuları Listele
- **Endpoint:** `GET /api/lora/servers`

### Sunucu Ekle
- **Endpoint:** `POST /api/lora/servers`
- **Body:** `{ "name": "ChirpStack", "host": "localhost", "port": 8080, "apiKey": "..." }`

### Bağlantı Testi
- **Endpoint:** `POST /api/lora/servers/:id/test`

---

## ⚡ Otomasyon & Kurallar

### Kuralları Listele
- **Endpoint:** `GET /api/automation/rules`

### Kural Oluştur
- **Endpoint:** `POST /api/automation/rules`
- **Body:**
  ```json
  {
    "name": "Sıcaklık Uyarısı",
    "triggerType": "telemetry",
    "deviceId": 1,
    "conditions": [ { "field": "temperature", "operator": ">", "value": 30 } ],
    "actions": [ { "type": "SEND_SMS", "target": "+90555...", "message": "Sıcak!" } ]
  }
  ```

---

## ⚙️ Sistem Ayarları

### Ayarları Getir
- **Endpoint:** `GET /api/settings`

### Ayarları Güncelle (Toplu)
- **Endpoint:** `POST /api/settings/bulk`
- **Body:** `[ { "key": "SMTP_HOST", "value": "smtp.gmail.com" } ]`

### Yedek Al (Backup)
- **Endpoint:** `GET /api/settings/backup`
- **Açıklama:** Sistem ayarlarını içeren bir ZIP dosyası indirir.

### Geri Yükle (Restore)
- **Endpoint:** `POST /api/settings/restore`
- **Body:** `multipart/form-data`, `backup` alanı ZIP dosyası olmalıdır.

---

## 📩 SMS Sağlayıcıları

### Sağlayıcıları Listele
- **Endpoint:** `GET /api/sms/providers`

### Sağlayıcı Test Et
- **Endpoint:** `POST /api/sms/providers/:id/test`
- **Body:** `{ "testPhoneNumber": "+90555..." }`
