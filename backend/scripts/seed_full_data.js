const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

const agriculturalData = [
    // --- KARADENİZ BÖLGESİ ---
    {
        region: "Karadeniz",
        crops: [
            { name: "Buğday", minTemp: 15, maxTemp: 25, water: "400-600 mm", soil: "Killi-tınlı", conditions: "Kuru hasat dönemi" },
            { name: "Arpa", minTemp: 10, maxTemp: 25, water: "300-500 mm", soil: "Her tür", conditions: "Soğuğa dayanıklı" },
            { name: "Mısır", minTemp: 25, maxTemp: 30, water: "Bol sulama", soil: "Alüvyonlu", conditions: "Nemli yaz" },
            { name: "Fındık", minTemp: 20, maxTemp: 25, water: "1000+ mm", soil: "Asidik killi", conditions: "Gölgeli eğimler" },
            { name: "Çay", minTemp: 5, maxTemp: 25, water: "2000 mm", soil: "Asidik", conditions: "Yüksek nem" },
            { name: "Tütün", minTemp: 20, maxTemp: 28, water: "Yağışlı büyüme", soil: "Kumlu-tınlı", conditions: "Kuru hasat" },
            { name: "Kivi", minTemp: 0, maxTemp: 25, water: "Yüksek nem", soil: "Sulu", conditions: "Destek sistemi" },
            { name: "Zeytin", minTemp: 15, maxTemp: 30, water: "600-800 mm", soil: "Drene kireçli", conditions: "Ilıman kış" },
            { name: "Pirinç", minTemp: 25, maxTemp: 35, water: "Su baskını", soil: "Kilimsi", conditions: "Sıcak-nemli" },
            { name: "Elma", minTemp: -5, maxTemp: 25, water: "500-700 mm", soil: "Verimli", conditions: "Soğuk saat ihtiyacı" }
        ]
    },
    // --- MARMARA BÖLGESİ ---
    {
        region: "Marmara",
        crops: [
            { name: "Buğday", minTemp: 15, maxTemp: 25, water: "500 mm", soil: "Verimli ova", conditions: "İlkbahar ekimi" },
            { name: "Arpa", minTemp: 15, maxTemp: 30, water: "500-600 mm", soil: "Alüvyon", conditions: "-" },
            { name: "Mısır", minTemp: 15, maxTemp: 30, water: "500-600 mm", soil: "Alüvyon", conditions: "-" },
            { name: "Pirinç", minTemp: 25, maxTemp: 35, water: "Sulu", soil: "Kilimsi", conditions: "-" },
            { name: "Ayçiçeği", minTemp: 20, maxTemp: 28, water: "350-600 mm", soil: "Kumlu-tınlı", conditions: "Sulama düşük yağışta" },
            { name: "Şekerpancarı", minTemp: 18, maxTemp: 25, water: "Sulama", soil: "Killi", conditions: "Organik madde" },
            { name: "Zeytin", minTemp: 15, maxTemp: 30, water: "500-700 mm", soil: "Kireçli drene", conditions: "Yaz kurak" },
            { name: "Kiraz", minTemp: -5, maxTemp: 25, water: "600 mm", soil: "Güneşli yamaç", conditions: "Tohum stratifikasyonu" },
            { name: "Şeftali", minTemp: -5, maxTemp: 25, water: "600 mm", soil: "Güneşli yamaç", conditions: "Tohum stratifikasyonu" },
            { name: "Üzüm", minTemp: 15, maxTemp: 30, water: "Kış yağmuru", soil: "Çakıllı", conditions: "Budama" },
            { name: "İncir", minTemp: 15, maxTemp: 30, water: "500 mm", soil: "Drene", conditions: "Kuraklığa dayanıklı" },
            { name: "Domates", minTemp: 18, maxTemp: 25, water: "Sulama", soil: "Nötr pH", conditions: "Organik gübre" },
            { name: "Patates", minTemp: 18, maxTemp: 25, water: "Sulama", soil: "Nötr pH", conditions: "Organik gübre" }
        ]
    },
    // --- EGE BÖLGESİ ---
    {
        region: "Ege",
        crops: [
            { name: "Buğday", minTemp: 15, maxTemp: 25, water: "400 mm", soil: "Taşlı", conditions: "Kuru iklim" },
            { name: "Arpa", minTemp: 15, maxTemp: 25, water: "400 mm", soil: "Taşlı", conditions: "Kuru iklim" },
            { name: "Zeytin", minTemp: 15, maxTemp: 30, water: "Kış yağışlı", soil: "Kireçli drene", conditions: "400+ yıl ömür" },
            { name: "Üzüm", minTemp: 15, maxTemp: 30, water: "500-700 mm", soil: "Kumlu-çakıl", conditions: "Rakım 200-800 m" },
            { name: "İncir", minTemp: 18, maxTemp: 30, water: "500 mm", soil: "Drene eğim", conditions: "Güneşlenme 2500 saat" },
            { name: "Pamuk", minTemp: 25, maxTemp: 30, water: "Sulama", soil: "Killi", conditions: "Uzun gün" },
            { name: "Turunçgil", minTemp: 5, maxTemp: 35, water: "Yaz sulama", soil: "Kumlu", conditions: "Don koruması" },
            { name: "Ayçiçeği", minTemp: 20, maxTemp: 28, water: "350-400 mm", soil: "Kumlu", conditions: "İkinci ürün" },
            { name: "Şeftali", minTemp: 18, maxTemp: 28, water: "Sulama", soil: "Organik", conditions: "-" },
            { name: "Domates", minTemp: 18, maxTemp: 28, water: "Sulama", soil: "Organik", conditions: "-" },
            { name: "Biber", minTemp: 18, maxTemp: 28, water: "Sulama", soil: "Organik", conditions: "-" }
        ]
    },
    // --- AKDENİZ BÖLGESİ ---
    {
        region: "Akdeniz",
        crops: [
            { name: "Buğday", minTemp: 20, maxTemp: 30, water: "Sulama", soil: "Alüvyon", conditions: "-" },
            { name: "Mısır", minTemp: 20, maxTemp: 30, water: "Sulama", soil: "Alüvyon", conditions: "-" },
            { name: "Pirinç", minTemp: 25, maxTemp: 35, water: "Su baskını", soil: "Kilimsi", conditions: "-" },
            { name: "Turunçgil", minTemp: 7, maxTemp: 35, water: "800-1000 mm", soil: "Kumlu-killi", conditions: "Yüksek nem" },
            { name: "Muz", minTemp: 25, maxTemp: 30, water: "Bol sulama", soil: "Sulu", conditions: "Sera/sera dışı" },
            { name: "Yerfıstığı", minTemp: 25, maxTemp: 30, water: "500-600 mm", soil: "Kumlu", conditions: "Sıcak-kuru" },
            { name: "Pamuk", minTemp: 25, maxTemp: 30, water: "Yoğun sulama", soil: "Killi", conditions: "GAP benzeri" },
            { name: "Zeytin", minTemp: 20, maxTemp: 30, water: "600 mm", soil: "Drene", conditions: "Kurak yaz" },
            { name: "Susam", minTemp: 20, maxTemp: 30, water: "600 mm", soil: "Drene", conditions: "Kurak yaz" },
            { name: "Ayçiçeği", minTemp: 20, maxTemp: 28, water: "350-600 mm", soil: "Kumlu-tınlı", conditions: "2. ürünHasat Temmuz" },
            { name: "Üzüm", minTemp: 20, maxTemp: 30, water: "Yoğun sulama", soil: "Alüvyon", conditions: "Sera" },
            { name: "Domates", minTemp: 20, maxTemp: 30, water: "Yoğun sulama", soil: "Alüvyon", conditions: "Sera" },
            { name: "Biber", minTemp: 20, maxTemp: 30, water: "Yoğun sulama", soil: "Alüvyon", conditions: "Sera" }
        ]
    },
    // --- İÇ ANADOLU BÖLGESİ ---
    {
        region: "İç Anadolu",
        crops: [
            { name: "Buğday", minTemp: 15, maxTemp: 25, water: "300-500 mm", soil: "Killi", conditions: "Soğuğa dayanıklı" },
            { name: "Arpa", minTemp: 15, maxTemp: 25, water: "300-500 mm", soil: "Killi", conditions: "Soğuğa dayanıklı" },
            { name: "Çavdar", minTemp: 15, maxTemp: 25, water: "300-500 mm", soil: "Killi", conditions: "Soğuğa dayanıklı" },
            { name: "Şekerpancarı", minTemp: 18, maxTemp: 25, water: "Sulama", soil: "Verimli ova", conditions: "-" },
            { name: "Ayçiçeği", minTemp: 20, maxTemp: 28, water: "Sulama", soil: "Kumlu", conditions: "Çerezlik/yağlık" },
            { name: "Nohut", minTemp: 15, maxTemp: 25, water: "Kurak dayanıklı", soil: "Her tür", conditions: "İlkbahar ekim" },
            { name: "Mercimek", minTemp: 15, maxTemp: 25, water: "Kurak dayanıklı", soil: "Her tür", conditions: "İlkbahar ekim" },
            { name: "Fasulye", minTemp: 15, maxTemp: 25, water: "Kurak dayanıklı", soil: "Her tür", conditions: "İlkbahar ekim" },
            { name: "Haşhaş", minTemp: 15, maxTemp: 25, water: "400 mm", soil: "Killı", conditions: "-" },
            { name: "Elma", minTemp: -20, maxTemp: 25, water: "400 mm", soil: "Vadiler", conditions: "Soğuk saat" },
            { name: "Armut", minTemp: -20, maxTemp: 25, water: "400 mm", soil: "Vadiler", conditions: "Soğuk saat" },
            { name: "Kayısı", minTemp: -20, maxTemp: 25, water: "400 mm", soil: "Vadiler", conditions: "Soğuk saat" },
            { name: "Patates", minTemp: 15, maxTemp: 20, water: "Sulama", soil: "Organik", conditions: "Yüksek rakım" }
        ]
    },
    // --- DOĞU ANADOLU BÖLGESİ ---
    {
        region: "Doğu Anadolu",
        crops: [
            { name: "Buğday", minTemp: 10, maxTemp: 25, water: "400 mm", soil: "Killi", conditions: "Kısa yaz" },
            { name: "Arpa", minTemp: 10, maxTemp: 25, water: "400 mm", soil: "Killi", conditions: "Kısa yaz" },
            { name: "Şekerpancarı", minTemp: 18, maxTemp: 25, water: "Sulama", soil: "Killi", conditions: "-" },
            { name: "Pamuk", minTemp: 25, maxTemp: 30, water: "Sulama", soil: "-", conditions: "Düşük rakım [<1500m]" },
            { name: "Tütün", minTemp: 25, maxTemp: 30, water: "Sulama", soil: "-", conditions: "Düşük rakım [<1500m]" },
            { name: "Patates", minTemp: 15, maxTemp: 20, water: "500 mm", soil: "Organik", conditions: "Yüksek irtifa" },
            { name: "Lahana", minTemp: 15, maxTemp: 20, water: "500 mm", soil: "Organik", conditions: "Yüksek irtifa" },
            { name: "Kayısı", minTemp: 15, maxTemp: 30, water: "400-600 mm", soil: "Güneşli vadi", conditions: "Türkiye %80" },
            { name: "Dut", minTemp: -10, maxTemp: 25, water: "400 mm", soil: "Verimli", conditions: "-" },
            { name: "Elma", minTemp: -10, maxTemp: 25, water: "400 mm", soil: "Verimli", conditions: "-" },
            { name: "Ayçiçeği", minTemp: 20, maxTemp: 28, water: "Sulama", soil: "-", conditions: "Çerezlik" }
        ]
    },
    // --- GÜNEYDOĞU ANADOLU BÖLGESİ ---
    {
        region: "Güneydoğu Anadolu",
        crops: [
            { name: "Buğday", minTemp: 20, maxTemp: 35, water: "GAP sulama", soil: "Alüvyon", conditions: "-" },
            { name: "Arpa", minTemp: 20, maxTemp: 35, water: "GAP sulama", soil: "Alüvyon", conditions: "-" },
            { name: "Çeltik", minTemp: 20, maxTemp: 35, water: "GAP sulama", soil: "Alüvyon", conditions: "-" },
            { name: "Pamuk", minTemp: 25, maxTemp: 35, water: "Yoğun sulama", soil: "Killi", conditions: "-" },
            { name: "Antep Fıstığı", minTemp: 25, maxTemp: 40, water: "Kurak dayanıklı", soil: "Kireçli-kumlu", conditions: "Erkek-dişi oranı" },
            { name: "Susam", minTemp: 25, maxTemp: 35, water: "Az su", soil: "Kumlu", conditions: "Sıcak" },
            { name: "Kırmızı Mercimek", minTemp: 20, maxTemp: 30, water: "Yarı kurak", soil: "-", conditions: "Erken hasat" },
            { name: "Ayçiçeği", minTemp: 20, maxTemp: 30, water: "Sulama", soil: "Kumlu", conditions: "Az miktarda" },
            { name: "Üzüm", minTemp: 25, maxTemp: 35, water: "Sulama", soil: "Sulu ova", conditions: "Yaz kurak" },
            { name: "Zeytin", minTemp: 25, maxTemp: 35, water: "Sulama", soil: "Sulu ova", conditions: "Yaz kurak" },
            { name: "Domates", minTemp: 25, maxTemp: 35, water: "Sulama", soil: "Sulu ova", conditions: "Yaz kurak" },
            { name: "Tütün", minTemp: 25, maxTemp: 35, water: "Sulama", soil: "Sulu ova", conditions: "Yaz kurak" }
        ]
    }
];

async function main() {
    console.log("🌱 Realistic Knowledge Base Seeding Started...");

    // Clear existing profiles to avoid duplicates during dev
    await prisma.cropStage.deleteMany({});
    await prisma.cropProfile.deleteMany({});

    for (const regionData of agriculturalData) {
        console.log(`Processing region: ${regionData.region}`);

        for (const crop of regionData.crops) {
            const profile = await prisma.cropProfile.create({
                data: {
                    name: crop.name,
                    region: regionData.region,
                    stages: {
                        create: [
                            {
                                name: "Genel",
                                minTemp: crop.minTemp,
                                maxTemp: crop.maxTemp,
                                idealMin: crop.minTemp + 2,
                                idealMax: crop.maxTemp - 2,
                                conditions: `Su: ${crop.water}, Toprak: ${crop.soil}. ${crop.conditions !== '-' ? crop.conditions : ''}`
                            }
                        ]
                    }
                }
            });
            process.stdout.write(".");
        }
        console.log("");
    }

    console.log("✅ Seeding Completed Successfully.");
}

main()
    .catch((e) => {
        console.error(e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
