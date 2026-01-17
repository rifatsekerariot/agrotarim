# 🚜 Akıllı Tarla (Smart Farm) UX/UI İyileştirme Önerisi

Mevcut liste görünümü işlevsel olsa da, bir çiftçi veya yönetici için en önemli şey **"Şu an her şey yolunda mı?"** sorusunun cevabıdır. Bir "Liste" yerine bir **"Komuta Merkezi (Command Center)"** yaklaşımı çok daha modern ve kullanışlı olacaktır.

İşte benim tasarım vizyonum:

## 1. Hızlı Bakış (KPI Kartları) - En Üstte
Kullanıcı sayfaya girdiği an, tek tek sensörleri okumak zorunda kalmamalı. Tarlanın **genel sağlık durumunu** özetleyen 3-4 büyük kart olmalı:
- **🌡️ Ortalama Sıcaklık & Nem:** Tüm sensörlerin ortalaması. (Yanında değişim oku ile: ⬆️ geçen saate göre artıyor)
- **💧 Toprak Nemi Durumu:** Örn: "%45 - İdeal" veya "%18 - Kritik Kuruluk".
- **🛡️ Risk Durumu:** "Stabil" veya "🚨 Don Riski Var".

## 2. AgroZeka (AI) - Odak Noktası
Yapay zeka analizini (AgroZeka) sayfanın en değerli yerine, **"Hero Section"** dediğimiz ana alana koymalıyız.
- **Mevcut Tasarım:** Kartın içinde metin olarak duruyor.
- **Öneri:** Bunu bir "Asistan Diyaloğu" veya "Günlük Rapor" gibi tasarlayalım.
    - *"Merhaba, bugün tarlada her şey yolunda. Ancak akşam yağmur beklendiği için sulama sistemlerini kapalı tutmanı öneririm."*
    - Yanında **"Hızlı Aksiyon Butonları"** olabilir (Örn: "Sulamayı İptal Et" - eğer otomasyon varsa).

## 3. Hibrit Zaman Çizelgesi (Geçmiş -> Şimdi -> Gelecek)
Veri sadece "şu an" değildir. Akıllı bir tasarım, sensör verisi ile hava durumu tahminini birleştirir.
- Bir grafik düşünün:
    - **Sol taraf (Geçmiş):** Sensörlerden gelen son 24 saatlik nem verisi.
    - **Sağ taraf (Gelecek):** MGM'den gelen yağmur tahmini.
    - Bu iki veriyi üst üste bindirerek görsel olarak **"Neden sulama yapmamalısın?"** sorusunu cevaplarız.

## 4. Sensör Kartlarında "Trend" (Sparklines)
Mevcut kartlar sadece anlık sayıları (Örn: 24°C) gösteriyor.
- Kullanıcı şunu bilmek ister: "Sıcaklık düşüyor mu, artıyor mu?"
- Kartların içine **Sparkline** (mini çizgi grafikler) ekleyerek son 6 saatlik değişimi minik bir dalgalanma olarak göstermeliyiz.

## 5. Görsel Hiyerarşi Taslağı

```text
[  KP1: Tarlanın Sağlık Puanı %90  ]  [ KPI 2: Ort. Nem %45 ]  [ KPI 3: Aktif Alarm: 0 ]
-----------------------------------------------------------------------------------------
[                                                                                       ]
[   🤖 AGROZEKA: "Bugün sulama yapmana gerek yok."                                    ]
[   NEDEN: Toprak nemi ideal seviyede (%45) ve 3 saat içinde yağmur bekleniyor.         ]
[                                                                                       ]
-----------------------------------------------------------------------------------------
[  GRAFİK ALANI: Sensör Geçmişi + Hava Tahmini Birleşimi (Hybrid Chart)                 ]
-----------------------------------------------------------------------------------------
[ SENSÖR KARTLARI (GRID) - Trend Grafikli ve Renk Kodlu (Yeşil/Sarı/Kırmızı)            ]
[ Cihaz 1 ] [ Cihaz 2 ] [ Cihaz 3 ] ...
```

Bu tasarımı hayata geçirmek, uygulamanı **"Veri Gösteren Panel"** seviyesinden **"Karar Destek Sistemi"** seviyesine taşır.
