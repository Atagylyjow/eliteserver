const { MongoClient } = require('mongodb');
const fs = require('fs');
const path = require('path');

// Yedekleme klasörü
const BACKUP_DIR = './mongodb-backups';
const BACKUP_DATE = new Date().toISOString().replace(/[:.]/g, '-');

// MongoDB bağlantı bilgileri
const CURRENT_DB_URL = process.env.DATABASE_URL;

// Yedekleme sistemi
class MongoDBBackup {
    constructor() {
        this.client = null;
        this.db = null;
        this.backupPath = path.join(BACKUP_DIR, BACKUP_DATE);
    }

    // MongoDB'ye bağlan
    async connect() {
        try {
            console.log('🔗 MongoDB\'ye bağlanılıyor...');
            this.client = new MongoClient(CURRENT_DB_URL);
            await this.client.connect();
            this.db = this.client.db();
            console.log('✅ MongoDB bağlantısı başarılı');
        } catch (error) {
            console.error('❌ MongoDB bağlantı hatası:', error);
            throw error;
        }
    }

    // Yedekleme klasörünü oluştur
    createBackupDirectory() {
        if (!fs.existsSync(BACKUP_DIR)) {
            fs.mkdirSync(BACKUP_DIR, { recursive: true });
            console.log('📁 Yedekleme klasörü oluşturuldu:', BACKUP_DIR);
        }
        if (!fs.existsSync(this.backupPath)) {
            fs.mkdirSync(this.backupPath, { recursive: true });
            console.log('📁 Tarihli yedekleme klasörü oluşturuldu:', this.backupPath);
        }
    }

    // Koleksiyonları listele
    async listCollections() {
        try {
            const collections = await this.db.listCollections().toArray();
            console.log('📋 Mevcut koleksiyonlar:', collections.map(c => c.name));
            return collections;
        } catch (error) {
            console.error('❌ Koleksiyon listesi alınamadı:', error);
            throw error;
        }
    }

    // Koleksiyonu yedekle
    async backupCollection(collectionName) {
        try {
            console.log(`📦 ${collectionName} koleksiyonu yedekleniyor...`);
            
            const collection = this.db.collection(collectionName);
            const documents = await collection.find({}).toArray();
            
            // JSON dosyasına kaydet
            const filePath = path.join(this.backupPath, `${collectionName}.json`);
            fs.writeFileSync(filePath, JSON.stringify(documents, null, 2));
            
            console.log(`✅ ${collectionName}: ${documents.length} döküman yedeklendi`);
            return documents.length;
        } catch (error) {
            console.error(`❌ ${collectionName} yedekleme hatası:`, error);
            throw error;
        }
    }

    // Tüm koleksiyonları yedekle
    async backupAllCollections() {
        try {
            const collections = await this.listCollections();
            const backupSummary = {};

            for (const collection of collections) {
                const count = await this.backupCollection(collection.name);
                backupSummary[collection.name] = count;
            }

            // Yedekleme özeti oluştur
            const summaryPath = path.join(this.backupPath, 'backup-summary.json');
            const summary = {
                backupDate: new Date().toISOString(),
                databaseUrl: CURRENT_DB_URL,
                collections: backupSummary,
                totalDocuments: Object.values(backupSummary).reduce((a, b) => a + b, 0)
            };
            
            fs.writeFileSync(summaryPath, JSON.stringify(summary, null, 2));
            console.log('📊 Yedekleme özeti oluşturuldu:', summaryPath);
            
            return summary;
        } catch (error) {
            console.error('❌ Genel yedekleme hatası:', error);
            throw error;
        }
    }

    // Yedekleme raporu oluştur
    createBackupReport(summary) {
        const reportPath = path.join(this.backupPath, 'BACKUP-REPORT.md');
        const report = `# MongoDB Yedekleme Raporu

## 📅 Yedekleme Tarihi
${new Date().toLocaleString('tr-TR')}

## 📊 Veritabanı Bilgileri
- **Veritabanı URL:** ${CURRENT_DB_URL}
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

    // Bağlantıyı kapat
    async close() {
        if (this.client) {
            await this.client.close();
            console.log('🔌 MongoDB bağlantısı kapatıldı');
        }
    }

    // Ana yedekleme fonksiyonu
    async runBackup() {
        try {
            console.log('🚀 MongoDB yedekleme işlemi başlatılıyor...');
            
            await this.connect();
            this.createBackupDirectory();
            
            const summary = await this.backupAllCollections();
            this.createBackupReport(summary);
            
            console.log('✅ Yedekleme işlemi tamamlandı!');
            console.log('📁 Yedekleme konumu:', this.backupPath);
            
            return summary;
        } catch (error) {
            console.error('❌ Yedekleme işlemi başarısız:', error);
            throw error;
        } finally {
            await this.close();
        }
    }
}

// Geri yükleme sistemi
class MongoDBRestore {
    constructor(newDbUrl) {
        this.newDbUrl = newDbUrl;
        this.client = null;
        this.db = null;
    }

    // Yeni MongoDB'ye bağlan
    async connect() {
        try {
            console.log('🔗 Yeni MongoDB\'ye bağlanılıyor...');
            this.client = new MongoClient(this.newDbUrl);
            await this.client.connect();
            this.db = this.client.db();
            console.log('✅ Yeni MongoDB bağlantısı başarılı');
        } catch (error) {
            console.error('❌ Yeni MongoDB bağlantı hatası:', error);
            throw error;
        }
    }

    // JSON dosyasından veri oku
    readBackupFile(filePath) {
        try {
            const data = fs.readFileSync(filePath, 'utf8');
            return JSON.parse(data);
        } catch (error) {
            console.error(`❌ Dosya okuma hatası (${filePath}):`, error);
            throw error;
        }
    }

    // Koleksiyonu geri yükle
    async restoreCollection(collectionName, documents) {
        try {
            console.log(`📦 ${collectionName} koleksiyonu geri yükleniyor...`);
            
            const collection = this.db.collection(collectionName);
            
            if (documents.length > 0) {
                await collection.insertMany(documents);
                console.log(`✅ ${collectionName}: ${documents.length} döküman geri yüklendi`);
            } else {
                console.log(`ℹ️ ${collectionName}: Boş koleksiyon, atlandı`);
            }
            
            return documents.length;
        } catch (error) {
            console.error(`❌ ${collectionName} geri yükleme hatası:`, error);
            throw error;
        }
    }

    // Tüm yedekleri geri yükle
    async restoreAllCollections(backupPath) {
        try {
            const files = fs.readdirSync(backupPath);
            const jsonFiles = files.filter(file => file.endsWith('.json') && file !== 'backup-summary.json');
            
            const restoreSummary = {};
            
            for (const file of jsonFiles) {
                const collectionName = file.replace('.json', '');
                const filePath = path.join(backupPath, file);
                const documents = this.readBackupFile(filePath);
                
                const count = await this.restoreCollection(collectionName, documents);
                restoreSummary[collectionName] = count;
            }
            
            console.log('📊 Geri yükleme özeti:', restoreSummary);
            return restoreSummary;
        } catch (error) {
            console.error('❌ Genel geri yükleme hatası:', error);
            throw error;
        }
    }

    // Bağlantıyı kapat
    async close() {
        if (this.client) {
            await this.client.close();
            console.log('🔌 MongoDB bağlantısı kapatıldı');
        }
    }

    // Ana geri yükleme fonksiyonu
    async runRestore(backupPath) {
        try {
            console.log('🚀 MongoDB geri yükleme işlemi başlatılıyor...');
            
            await this.connect();
            const summary = await this.restoreAllCollections(backupPath);
            
            console.log('✅ Geri yükleme işlemi tamamlandı!');
            return summary;
        } catch (error) {
            console.error('❌ Geri yükleme işlemi başarısız:', error);
            throw error;
        } finally {
            await this.close();
        }
    }
}

// Kullanım örnekleri
async function createBackup() {
    const backup = new MongoDBBackup();
    await backup.runBackup();
}

async function restoreFromBackup(backupPath, newDbUrl) {
    const restore = new MongoDBRestore(newDbUrl);
    await restore.runRestore(backupPath);
}

// Komut satırı argümanları
const args = process.argv.slice(2);
const command = args[0];

if (command === 'backup') {
    createBackup().catch(console.error);
} else if (command === 'restore') {
    const backupPath = args[1];
    const newDbUrl = args[2];
    
    if (!backupPath || !newDbUrl) {
        console.error('❌ Kullanım: node backup-system.js restore <backup-path> <new-db-url>');
        process.exit(1);
    }
    
    restoreFromBackup(backupPath, newDbUrl).catch(console.error);
} else {
    console.log(`
🔧 MongoDB Yedekleme Sistemi

Kullanım:
  node backup-system.js backup                    # Yedekleme oluştur
  node backup-system.js restore <path> <url>     # Yedekten geri yükle

Örnekler:
  node backup-system.js backup
  node backup-system.js restore ./mongodb-backups/2024-01-15T10-30-00-000Z mongodb+srv://user:pass@cluster.mongodb.net/db

Not: Geri yükleme için yeni MongoDB connection string gerekli
    `);
}

module.exports = { MongoDBBackup, MongoDBRestore }; 