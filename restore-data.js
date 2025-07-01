const { MongoDBRestore } = require('./backup-system');
const fs = require('fs');
const path = require('path');

// Yeni MongoDB connection string (buraya yeni connection string'i yazın)
const NEW_DATABASE_URL = process.env.NEW_DATABASE_URL || 'mongodb+srv://username:password@cluster.mongodb.net/database';

// Yedekleme klasörü (en son yedekleme)
const BACKUP_DIR = './mongodb-backups';

async function findLatestBackup() {
    try {
        if (!fs.existsSync(BACKUP_DIR)) {
            throw new Error('Yedekleme klasörü bulunamadı!');
        }

        const folders = fs.readdirSync(BACKUP_DIR)
            .filter(item => fs.statSync(path.join(BACKUP_DIR, item)).isDirectory())
            .sort()
            .reverse();

        if (folders.length === 0) {
            throw new Error('Yedekleme klasöründe hiç yedek bulunamadı!');
        }

        const latestBackup = path.join(BACKUP_DIR, folders[0]);
        console.log('📁 En son yedekleme bulundu:', latestBackup);
        
        return latestBackup;
    } catch (error) {
        console.error('❌ Yedekleme bulunamadı:', error.message);
        process.exit(1);
    }
}

async function restoreData() {
    try {
        console.log('🚀 Veri geri yükleme işlemi başlatılıyor...');
        
        // En son yedeklemeyi bul
        const backupPath = await findLatestBackup();
        
        // Yedekleme özetini kontrol et
        const summaryPath = path.join(backupPath, 'backup-summary.json');
        if (fs.existsSync(summaryPath)) {
            const summary = JSON.parse(fs.readFileSync(summaryPath, 'utf8'));
            console.log('📊 Yedekleme özeti:');
            console.log(`   - Tarih: ${new Date(summary.backupDate).toLocaleString('tr-TR')}`);
            console.log(`   - Toplam döküman: ${summary.totalDocuments}`);
            console.log(`   - Koleksiyonlar: ${Object.keys(summary.collections).join(', ')}`);
        }
        
        // Geri yükleme işlemini başlat
        const restore = new MongoDBRestore(NEW_DATABASE_URL);
        const result = await restore.runRestore(backupPath);
        
        console.log('✅ Veri geri yükleme tamamlandı!');
        console.log('📊 Geri yüklenen veriler:', result);
        
    } catch (error) {
        console.error('❌ Geri yükleme hatası:', error);
        process.exit(1);
    }
}

// Environment variable kontrolü
if (!process.env.NEW_DATABASE_URL) {
    console.log(`
⚠️  UYARI: NEW_DATABASE_URL environment variable'ı ayarlanmamış!

Yeni MongoDB connection string'i ayarlamak için:

1. Yeni MongoDB Atlas hesabı oluşturun
2. Yeni cluster oluşturun (M0 ücretsiz plan)
3. Database Access'te kullanıcı oluşturun
4. Network Access'te IP whitelist ekleyin (0.0.0.0/0)
5. Connection string'i alın

Sonra şu komutlardan birini kullanın:

# Windows PowerShell:
$env:NEW_DATABASE_URL="mongodb+srv://username:password@cluster.mongodb.net/database"
node restore-data.js

# Windows Command Prompt:
set NEW_DATABASE_URL=mongodb+srv://username:password@cluster.mongodb.net/database
node restore-data.js

# Linux/Mac:
export NEW_DATABASE_URL="mongodb+srv://username:password@cluster.mongodb.net/database"
node restore-data.js

# Veya doğrudan script içinde NEW_DATABASE_URL'i güncelleyin
    `);
    process.exit(1);
}

// Geri yükleme işlemini başlat
restoreData(); 