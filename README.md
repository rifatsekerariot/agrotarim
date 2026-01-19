# 🚀 ARIOT IoT Platformu & Sera Otomasyon Sistemleri

**ARIOT IoT Teknolojileri** tarafından geliştirilen, açık kaynaklı, profesyonel tarımsal otomasyon ve IoT yönetim platformu.

![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)
![Node](https://img.shields.io/badge/Node-18.x-green.svg)
![Status](https://img.shields.io/badge/Status-Production%20Ready-blue.svg)

---

## 🌟 Hakkında

Bu proje, modern tarım ve endüstriyel IoT ihtiyaçları için geliştirilmiş kapsamlı bir yönetim panelidir. LoRaWAN tabanlı sensörlerden veri toplama, uzaktan cihaz kontrolü (Downlink), akıllı otomasyon kuralları ve kullanıcı yönetimi gibi kritik özellikleri tek bir çatı altında toplar.

**Açık Kaynak Kodlu & MIT Lisanslı:**
Bu proje, teknoloji dünyasına katkı sağlamak amacıyla açık kaynak kodlu olarak paylaşılmıştır. Geliştiricilerin katkılarıyla daha da büyümesi ve gelişmesi hedeflenmektedir. Kodları inceleyebilir, fork edebilir ve kendi projelerinizde özgürce kullanabilirsiniz.

---

## 🎨 Temel Özellikler

Aşağıdaki özellikler, sistemin görsel arayüzü ve yeteneklerine dayanmaktadır:

### 1. 📡 Gelişmiş LoRaWAN Yönetimi ve Loglama
Cihazlarınızla olan tüm iletişimi detaylı bir şekilde izleyin.
- **Downlink Logları:** Cihazlara gönderilen komutların (Vana Aç/Kapat vb.) durumlarını (Gönderilen, Bekleyen, Başarısız) anlık takip edin.
- **Kuyruk Yönetimi:** İletilmeyi bekleyen komutları yönetin.
- **Cihaz Bazlı Filtreleme:** Spesifik bir cihazın geçmiş tüm iletişim kayıtlarını inceleyin.

### 2. ⚡ Akıllı Otomasyon Merkezi (Rule Engine)
Karmaşık senaryoları kod yazmadan yönetin.
- **Dinamik Kural Oluşturma:** "Sıcaklık 30°C üzerindeyse" gibi koşulları kolayca tanımlayın.
- **Çoklu Aksiyon Desteği:** Bir kural tetiklendiğinde aynı anda birden fazla eylem gerçekleştirin:
    - 🚀 **LoRa Komutu Gönder:** Otomatik sulamayı başlatın.
    - 📱 **SMS Gönder:** Çiftçiye veya yöneticiye anında uyarı mesajı iletin.
    - 📧 **E-posta Bildirimi:** Detaylı rapor gönderin.
- **Esnek Komut Yapısı:** Hex formatında (örn: `01FF3A`) özel LoRaWAN komutları tanımlayın.

### 3. 👥 Gelişmiş Kullanıcı Yönetimi
Sistemi güvenli bir şekilde yönetin.
- **Rol Tabanlı Erişim:** Yönetici ve standart kullanıcı yetkilendirmeleri.
- **Koltuk Yönetimi:** Yeni kullanıcılar ekleyin, mevcut kullanıcıları listeleyin.
- **Güvenlik:** Kullanıcı şifrelerini güvenli bir şekilde sıfırlayın veya hesapları yönetin.

### 4. ⚙️ Sistem Ayarları ve Yedekleme
Sisteminizi tam kontrol altında tutun.
- **Cihaz Envanteri:** Tüm bağlı cihazlarınızı, bağlantı durumlarını (Online/Offline) ve sunucu bilgilerini tek ekranda görün.
- **Sunucu Yapılandırması:** ChirpStack veya diğer LoRaWAN sunucularını sisteme entegre edin.
- **Yedekleme & Geri Yükleme:** Kritik sistem ayarlarınızı tek tuşla yedekleyin ve ihtiyaç duyduğunuzda geri yükleyin.

---

## 🛠️ Teknolojiler

Bu proje, yüksek performans ve ölçeklenebilirlik için modern teknolojilerle geliştirilmiştir:

- **Frontend:** React.js, Vite, Bootstrap, Lucide Icons
- **Backend:** Node.js, Express.js
- **Veritabanı:** PostgreSQL, Prisma ORM
- **IoT Protokolleri:** LoRaWAN, MQTT, HTTP
- **Diğer:** Docker, Docker Compose

---

## 👨‍💻 Geliştirici & İletişim

Bu proje, **ARIOT IOT TEKNOLOJILERI** bünyesinde geliştirilmiştir.

- **Firma:** ARIOT IOT TEKNOLOJILERI
- **Geliştirici:** RİFAT ŞEKER
- **Web:** [www.ariot.com.tr](http://www.ariot.com.tr)
- **E-posta:** info@ariot.com.tr

> 🤖 **Yapay Zeka Destekli Geliştirme:**
> Bu proje, **Google DeepMind** ekibinin geliştirdiği **Yapay Zeka Gravity** teknolojisi ve asistanlığı ile hayat bulmuştur. Yapay zeka, kodlama süreçlerini hızlandırmış ve optimize etmiştir. Ancak, projenin gerçek potansiyeline ulaşması, siz değerli yazılımcıların dokunuşları ve topluluk desteği ile mümkün olacaktır.

---

## 🤝 Katkıda Bulunma (Contributing)

Bu proje topluluk desteğiyle büyümeye açıktır!
1. Bu repoyu fork edin.
2. Yeni bir özellik dalı (feature branch) oluşturun.
3. Değişikliklerinizi commit yapın.
4. Dalınıza push yapın.
5. Bir Pull Request (PR) oluşturun.

Her türlü katkı, hata bildirimi ve öneri değerlidir.

---

## 📄 Lisans

Bu proje **MIT Lisansı** ile lisanslanmıştır. Detaylar için `LICENSE.md` dosyasına bakabilirsiniz. Bu lisans, yazılımın ticari kullanımı, dağıtımı ve değiştirilmesi konusunda geniş özgürlükler tanır.

---

*© 2026 ARIOT IOT TEKNOLOJILERI - Tüm Hakları Saklıdır.*
