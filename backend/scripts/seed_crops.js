const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

const profiles = [
    // --- KARADENİZ ---
    { region: "Karadeniz", name: "Buğday", category: "Tahıl", idealMin: 10, idealMax: 25, minRain: 400, soilType: "Killi-tınlı", description: "Filizlenme 10-15°C, olgunlaşma 20-25°C kurak. Yıllık 400-600mm yağış." },
    { region: "Karadeniz", name: "Mısır", category: "Tahıl", idealMin: 25, idealMax: 30, soilType: "Alüvyonal", description: "Sıcak-nemli iklim, bol yaz sulaması." },
    { region: "Karadeniz", name: "Fındık", category: "Sanayi", idealMin: 5, idealMax: 25, minRain: 1000, soilType: "Asidik killi", description: "Kış 5-10°C, Yaz 20-25°C. Nemli, gölgeli eğimler." },
    { region: "Karadeniz", name: "Çay", category: "Sanayi", idealMin: 5, idealMax: 25, minRain: 1000, soilType: "Asidik", description: "Yüksek nem ve yağış ister." },

    // --- MARMARA ---
    { region: "Marmara", name: "Ayçiçeği", category: "Sanayi", idealMin: 20, idealMax: 28, minRain: 600, soilType: "Kumlu-tınlı", description: "Yağışlı büyüme, kuru hasat." },
    { region: "Marmara", name: "Zeytin", category: "Meyve", idealMin: 5, idealMax: 35, soilType: "Drene", description: "Kış > -5°C olmalı. Ilıman iklim." },
    { region: "Marmara", name: "Pirinç", category: "Tahıl", idealMin: 25, idealMax: 30, description: "Bol su ve sıcaklık ister. Edirne çevresi." },

    // --- EGE ---
    { region: "Ege", name: "Zeytin", category: "Sanayi", idealMin: 15, idealMax: 30, soilType: "Kireçli-drene", description: "Akdeniz iklimi, kış yağışlı yaz kurak." },
    { region: "Ege", name: "Pamuk", category: "Sanayi", idealMin: 20, idealMax: 35, description: "Bol güneş ve sulama ister. Hasat kuru geçmeli." },
    { region: "Ege", name: "Üzüm", category: "Meyve", idealMin: 15, idealMax: 30, description: "Kireçli toprakları sever, güneşli eğimler." },

    // --- AKDENİZ ---
    { region: "Akdeniz", name: "Turunçgil", category: "Meyve", idealMin: 10, idealMax: 35, soilType: "Kumlu-killi", description: "Don hassasiyeti yüksek (Kış > 7°C). Yüksek nem." },
    { region: "Akdeniz", name: "Muz", category: "Meyve", idealMin: 15, idealMax: 35, description: "Sera benzeri koruma, yüksek nem ve sıcaklık." },
    { region: "Akdeniz", name: "Mısır", category: "Tahıl", idealMin: 20, idealMax: 30, soilType: "Alüvyonal", description: "Yılda 2 ürün alınabilir, sulama şart." },

    // --- İÇ ANADOLU ---
    { region: "İç Anadolu", name: "Buğday", category: "Tahıl", idealMin: 15, idealMax: 25, soilType: "Killi", description: "Soğuğa dayanıklı, yarı kurak iklim." },
    { region: "İç Anadolu", name: "Şekerpancarı", category: "Sanayi", idealMin: 18, idealMax: 25, description: "Verimli toprak ve düzenli sulama ister." },
    { region: "İç Anadolu", name: "Elma", category: "Meyve", minTemp: -20, description: "Soğuk kışlara dayanır. Gece-gündüz sıcaklık farkı aroma yapar." },

    // --- DOĞU ANADOLU ---
    { region: "Doğu Anadolu", name: "Kayısı", category: "Meyve", idealMin: 20, idealMax: 25, minTemp: -10, description: "Serin iklim, yüksek irtifa (Malatya)." },
    { region: "Doğu Anadolu", name: "Arpa", category: "Tahıl", description: "Kısa ve serin yazlara adapte olmuştur." },

    // --- GÜNEYDOĞU ANADOLU ---
    { region: "Güneydoğu", name: "Pamuk", category: "Sanayi", idealMin: 25, idealMax: 40, soilType: "Kumlu", description: "Yüksek sıcaklık ve GAP sulaması ile yüksek verim." },
    { region: "Güneydoğu", name: "Antep Fıstığı", category: "Sanayi", soilType: "Kireçli", description: "Kuraklığa çok dayanıklı, sıcak yaz ister." }
];

async function main() {
    console.log('Seeding Crop Profiles...');

    // Clear existing to avoid dupes (Optional, usually good for repeated runs)
    // await prisma.cropProfile.deleteMany({}); 

    for (const p of profiles) {
        await prisma.cropProfile.create({
            data: p
        });
    }

    console.log(`Seeded ${profiles.length} items.`);
}

main()
    .catch(e => {
        console.error(e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
