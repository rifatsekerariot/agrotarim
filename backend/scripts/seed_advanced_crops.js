const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

const regionalData = [
    // --- KARADENİZ BÖLGESİ ---
    {
        region: "Karadeniz",
        crops: [
            {
                name: "Buğday", category: "Tahıl", soil: "Killi-tınlı", minRain: 500,
                stages: [
                    { name: "Filizlenme", idealMin: 10, idealMax: 15, conditions: "Yağış gerekli" },
                    { name: "Olgunlaşma", idealMin: 20, idealMax: 25, conditions: "Kuru-sıcak hava gerekli" }
                ]
            },
            {
                name: "Mısır", category: "Tahıl", soil: "Alüvyonal",
                stages: [
                    { name: "Büyüme", idealMin: 25, idealMax: 30, conditions: "Sıcak-nemli iklim, Bol su (yaz sulaması)" }
                ]
            },
            {
                name: "Fındık", category: "Meyve", soil: "Asidik killi", minRain: 1500,
                stages: [
                    { name: "Kış Dinlenme", idealMin: 5, idealMax: 10, conditions: "Nemli-serin" },
                    { name: "Yaz Gelişimi", idealMin: 20, idealMax: 25, conditions: "Gölgeli eğimler sever" }
                ]
            },
            {
                name: "Kivi", category: "Meyve", soil: "Sulu ovalar",
                stages: [
                    { name: "Genel", minTemp: 0, conditions: "Ilıman iklim, Yüksek nem" }
                ]
            }
        ]
    },
    // --- MARMARA BÖLGESİ ---
    {
        region: "Marmara",
        crops: [
            {
                name: "Ayçiçeği", category: "Yağlı Tohum", soil: "Kumlu-tınlı", minRain: 600,
                stages: [
                    { name: "Büyüme", idealMin: 20, idealMax: 28, conditions: "Yağışlı dönem" },
                    { name: "Hasat", conditions: "Kuru hava gerekli" }
                ]
            },
            {
                name: "Zeytin", category: "Meyve", soil: "Drenajlı",
                stages: [
                    { name: "Kış", minTemp: -5, conditions: "Ilıman iklim" },
                    { name: "Yaz", conditions: "Güneşli yamaçlar" }
                ]
            },
            {
                name: "Sebzeler (Domates, Patates)", category: "Sebze", soil: "Nötr pH",
                stages: [
                    { name: "Büyüme", idealMin: 18, idealMax: 25, conditions: "Düzenli sulama, Organik gübre" }
                ]
            }
        ]
    },
    // --- EGE BÖLGESİ ---
    {
        region: "Ege",
        crops: [
            {
                name: "Buğday", category: "Tahıl", soil: "Taşlı", minRain: 400,
                stages: [
                    { name: "Büyüme", idealMin: 15, idealMax: 25, conditions: "Kuru iklim" }
                ]
            },
            {
                name: "Pamuk", category: "Endüstri", soil: "Alüvyonal",
                stages: [
                    { name: "Yaz", idealMin: 25, idealMax: 35, conditions: "Düzenli Yaz sulaması gerekli" }
                ]
            },
            {
                name: "Zeytin", category: "Meyve", soil: "Kireçli-drene",
                stages: [
                    { name: "Genel", idealMin: 15, idealMax: 30, conditions: "Akdeniz iklimi (Kış yağışlı, Yaz kurak)" }
                ]
            }
        ]
    },
    // --- AKDENİZ BÖLGESİ ---
    {
        region: "Akdeniz",
        crops: [
            {
                name: "Muz", category: "Meyve", soil: "Kumlu-killi",
                stages: [
                    { name: "Genel", minTemp: 7, conditions: "Tropik-ılıman, Yüksek nem, Sera koruması gerekebilir" }
                ]
            },
            {
                name: "Turunçgil", category: "Meyve", soil: "Kumlu-killi",
                stages: [
                    { name: "Genel", minTemp: 0, conditions: "Don olayına karşı hassas" }
                ]
            },
            {
                name: "Mısır", category: "Tahıl", soil: "Alüvyonal vadiler",
                stages: [
                    { name: "Büyüme", idealMin: 20, idealMax: 30, conditions: "Sulama zorunlu" }
                ]
            }
        ]
    },
    // --- İÇ ANADOLU BÖLGESİ ---
    {
        region: "İç Anadolu",
        crops: [
            {
                name: "Buğday", category: "Tahıl", soil: "Killi", minRain: 300,
                stages: [
                    { name: "Kış", minTemp: -15, conditions: "Soğuğa dayanıklı" },
                    { name: "Yaz", conditions: "Yarı kurak" }
                ]
            },
            {
                name: "Şekerpancarı", category: "Endüstri", soil: "Verimli ova",
                stages: [
                    { name: "Büyüme", idealMin: 18, idealMax: 25, conditions: "Sulama gerekli" }
                ]
            },
            {
                name: "Baklagiller (Nohut, Mercimek)", category: "Baklagil",
                stages: [
                    { name: "Ekim", conditions: "İlkbahar ekimi, Ani soğuklara hassas" },
                    { name: "Büyüme", conditions: "Kuraklığa dayanıklı" }
                ]
            }
        ]
    },
    // --- DOĞU ANADOLU BÖLGESİ ---
    {
        region: "Doğu Anadolu",
        crops: [
            {
                name: "Buğday", category: "Tahıl", minRain: 400,
                stages: [
                    { name: "Kış", conditions: "Soğuk kışlara dayanıklı" },
                    { name: "Yaz", idealMin: 20, idealMax: 25, conditions: "Kısa ve sıcak yaz" }
                ]
            },
            {
                name: "Kayısı", category: "Meyve", soil: "Organik",
                stages: [
                    { name: "Genel", minTemp: -10, conditions: "Serin iklim, Yüksek irtifa" }
                ]
            }
        ]
    },
    // --- GÜNEYDOĞU ANADOLU BÖLGESİ ---
    {
        region: "Güneydoğu Anadolu",
        crops: [
            {
                name: "Pamuk", category: "Endüstri", soil: "Kumlu",
                stages: [
                    { name: "Büyüme", idealMin: 30, conditions: "Yüksek sıcaklık, Kuraklığa dayanıklı" }
                ]
            },
            {
                name: "Kırmızı Mercimek", category: "Baklagil",
                stages: [
                    { name: "Büyüme", conditions: "Yarı kurak, Erken ilkbahar ekimi" }
                ]
            },
            {
                name: "Antep Fıstığı", category: "Meyve", soil: "Kumlu",
                stages: [
                    { name: "Genel", conditions: "Çok yüksek sıcaklık ve kuraklığa dayanıklı" }
                ]
            }
        ]
    }
];

async function main() {
    console.log('🌱 Starting Advanced Crop Seeding...');

    // 1. Clear existing data to avoid duplicates/conflicts (Optional: remove this if you want to keep data)
    console.log('Deleting old Crop Profiles...');
    await prisma.cropStage.deleteMany({});
    await prisma.cropProfile.deleteMany({});

    // 2. Insert new structure
    for (const regionData of regionalData) {
        console.log(`Processing Region: ${regionData.region}`);

        for (const crop of regionData.crops) {
            const createdCrop = await prisma.cropProfile.create({
                data: {
                    region: regionData.region,
                    name: crop.name,
                    category: crop.category,
                    soilType: crop.soil,
                    minRain: crop.minRain,
                    stages: {
                        create: crop.stages.map(stage => ({
                            name: stage.name,
                            minTemp: stage.minTemp,
                            idealMin: stage.idealMin,
                            idealMax: stage.idealMax,
                            conditions: stage.conditions
                        }))
                    }
                }
            });
            console.log(`  - Added: ${crop.name} with ${crop.stages.length} stages`);
        }
    }

    console.log('✅ Seeding Completed Successfully!');
}

main()
    .catch((e) => {
        console.error(e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
