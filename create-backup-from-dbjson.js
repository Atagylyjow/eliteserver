const fs = require('fs');
const path = require('path');

// Yedekleme klasörü
const BACKUP_DIR = './mongodb-backups';
const BACKUP_DATE = new Date().toISOString().replace(/[:.]/g, '-');

// db.json dosyasını oku
function readDbJson() {
    try {
        const dbData = JSON.parse(fs.readFileSync('db.json', 'utf8'));
        console.log('✅ db.json dosyası okundu');
        return dbData;
    } catch (error) {
        console.error('❌ db.json okuma hatası:', error);
        throw error;
    }
}

// MongoDB formatına çevir
function convertToMongoDBFormat(dbData) {
    const mongoData = {};
    
    // Users koleksiyonu
    mongoData.users = [];
    for (const [userId, userData] of Object.entries(dbData.users)) {
        mongoData.users.push({
            _id: userId,
            ...userData
        });
    }
    
    // VPN Scripts koleksiyonu
    mongoData.vpnScripts = [];
    for (const [scriptId, scriptData] of Object.entries(dbData.vpnScripts)) {
        mongoData.vpnScripts.push({
            _id: scriptId,
            ...scriptData,
            createdAt: new Date().toISOString()
        });
    }
    
    // Stats koleksiyonu
    mongoData.stats = [{
        _id: 'main',
        ...dbData.stats
    }];
    
    // Admins koleksiyonu
    mongoData.admins = dbData.admins.map(chatId => ({
        _id: chatId.toString(),
        chatId: chatId,
        addedAt: new Date().toISOString()
    }));
    
    return mongoData;
}

// Yedekleme klasörünü oluştur
function createBackupDirectory() {
    const backupPath = path.join(BACKUP_DIR, BACKUP_DATE);
    
    if (!fs.existsSync(BACKUP_DIR)) {
        fs.mkdirSync(BACKUP_DIR, { recursive: true });
        console.log('📁 Yedekleme klasörü oluşturuldu:', BACKUP_DIR);
    }
    
    if (!fs.existsSync(backupPath)) {
        fs.mkdirSync(backupPath, { recursive: true });
        console.log('📁 Tarihli yedekleme klasörü oluşturuldu:', backupPath);
    }
    
    return backupPath;
}

// Koleksiyonları JSON dosyalarına kaydet
function saveCollections(backupPath, mongoData) {
    const summary = {};
    
    for (const [collectionName, documents] of Object.entries(mongoData)) {
        const filePath = path.join(backupPath, `${collectionName}.json`);
        fs.writeFileSync(filePath, JSON.stringify(documents, null, 2));
        summary[collectionName] = documents.length;
        console.log(`✅ ${collectionName}: ${documents.length} döküman kaydedildi`);
    }
    
    return summary;
}

// Yedekleme özeti oluştur
function createBackupSummary(backupPath, summary) {
    const summaryData = {
        backupDate: new Date().toISOString(),
        source: 'db.json',
        collections: summary,
        totalDocuments: Object.values(summary).reduce((a, b) => a + b, 0)
    };
    
    const summaryPath = path.join(backupPath, 'backup-summary.json');
    fs.writeFileSync(summaryPath, JSON.stringify(summaryData, null, 2));
    console.log('📊 Yedekleme özeti oluşturuldu:', summaryPath);
    
    return summaryData;
}

// Yedekleme raporu oluştur
function createBackupReport(backupPath, summary) {
    const reportPath = path.join(backupPath, 'BACKUP-REPORT.md');
    const report = `# MongoDB Yedekleme Raporu (db.json'den)

## 📅 Yedekleme Tarihi
${new Date().toLocaleString('tr-TR')}

## 📊 Veritabanı Bilgileri
- **Kaynak:** db.json dosyası
- **Toplam Döküman:** ${summary.totalDocuments}
- **Koleksiyon Sayısı:** ${Object.keys(summary.collections).length}

## 📋 Koleksiyon Detayları
${Object.entries(summary.collections).map(([name, count]) => `- **${name}:** ${count} döküman`).join('\n')}

## 🔧 Yeni Hesaba Geçiş Talimatları

### 1. Yeni MongoDB Atlas Hesabı Oluştur
1. [MongoDB Atlas](https://cloud.mongodb.com) sitesine git
2. Yeni hesap oluştur
3. Yeni cluster oluştur (M0 ücretsiz plan)
4. Database Access'te yeni kullanıcı oluştur
5. Network Access'te IP whitelist ekle (0.0.0.0/0)

### 2. Yeni Connection String Al
1. Cluster'a tıkla
2. "Connect" butonuna bas
3. "Connect your application" seç
4. Connection string'i kopyala

### 3. Verileri Geri Yükle
\`\`\`bash
# Yeni connection string ile geri yükleme
node restore-data.js
\`\`\`

### 4. Environment Variable Güncelle
Render'da DATABASE_URL'i yeni connection string ile güncelle

## 📁 Yedeklenen Dosyalar
- \`users.json\` - Kullanıcı verileri
- \`vpnScripts.json\` - VPN script verileri
- \`stats.json\` - İstatistik verileri
- \`admins.json\` - Admin verileri
- \`backup-summary.json\` - Yedekleme özeti

## ⚠️ Önemli Notlar
- Bu yedekleme ${new Date().toLocaleString('tr-TR')} tarihinde oluşturuldu
- Tüm veriler JSON formatında saklandı
- Yeni hesaba geçerken connection string'i güncellemeyi unutma
- Render'da environment variable'ları güncelle

---
*Bu rapor otomatik olarak oluşturuldu*
`;

    fs.writeFileSync(reportPath, report);
    console.log('📄 Yedekleme raporu oluşturuldu:', reportPath);
}

// Ana fonksiyon
function createBackupFromDbJson() {
    try {
        console.log('🚀 db.json\'den yedekleme oluşturuluyor...');
        
        // db.json'i oku
        const dbData = readDbJson();
        
        // MongoDB formatına çevir
        const mongoData = convertToMongoDBFormat(dbData);
        
        // Yedekleme klasörünü oluştur
        const backupPath = createBackupDirectory();
        
        // Koleksiyonları kaydet
        const summary = saveCollections(backupPath, mongoData);
        
        // Yedekleme özeti oluştur
        const summaryData = createBackupSummary(backupPath, summary);
        
        // Rapor oluştur
        createBackupReport(backupPath, summaryData);
        
        console.log('✅ Yedekleme işlemi tamamlandı!');
        console.log('📁 Yedekleme konumu:', backupPath);
        console.log('📊 Toplam döküman:', summaryData.totalDocuments);
        
    } catch (error) {
        console.error('❌ Yedekleme hatası:', error);
        process.exit(1);
    }
}

// Scripti çalıştır
createBackupFromDbJson(); 