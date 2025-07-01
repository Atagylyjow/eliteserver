# 🔧 MongoDB Yedekleme ve Geri Yükleme Sistemi

Bu sistem MongoDB verilerinizi yedeklemek ve yeni hesaba geçiş yapmak için tasarlanmıştır.

## 📁 Dosya Yapısı

```
mongodb-backups/
├── 2024-01-15T10-30-00-000Z/
│   ├── users.json              # Kullanıcı verileri
│   ├── vpnScripts.json         # VPN script verileri
│   ├── stats.json              # İstatistik verileri
│   ├── admins.json             # Admin verileri
│   ├── backup-summary.json     # Yedekleme özeti
│   └── BACKUP-REPORT.md        # Detaylı rapor
├── 2024-01-16T14-20-00-000Z/
│   └── ...
└── ...
```

## 🚀 Hızlı Başlangıç

### 1. Yedekleme Oluştur
```bash
node backup-system.js backup
```

### 2. Yeni Hesaba Geçiş
```bash
# Yeni connection string ile geri yükleme
node restore-data.js
```

## 📋 Detaylı Kullanım

### 🔄 Yedekleme İşlemi

#### Otomatik Yedekleme
```bash
# Tüm koleksiyonları yedekle
node backup-system.js backup
```

#### Manuel Yedekleme
```javascript
const { MongoDBBackup } = require('./backup-system');

async function manualBackup() {
    const backup = new MongoDBBackup();
    await backup.runBackup();
}

manualBackup();
```

### 🔄 Geri Yükleme İşlemi

#### Otomatik Geri Yükleme
```bash
# Environment variable ile
export NEW_DATABASE_URL="mongodb+srv://user:pass@cluster.mongodb.net/db"
node restore-data.js
```

#### Manuel Geri Yükleme
```bash
# Belirli yedekleme ile
node backup-system.js restore ./mongodb-backups/2024-01-15T10-30-00-000Z mongodb+srv://user:pass@cluster.mongodb.net/db
```

## 🔧 Yeni MongoDB Atlas Hesabı Oluşturma

### 1. Hesap Oluştur
1. [MongoDB Atlas](https://cloud.mongodb.com) sitesine git
2. "Try Free" butonuna tıkla
3. Email ve şifre ile kayıt ol

### 2. Cluster Oluştur
1. "Build a Database" butonuna tıkla
2. "FREE" planını seç (M0)
3. Cloud provider ve region seç
4. "Create" butonuna tıkla

### 3. Güvenlik Ayarları
1. **Database Access**:
   - "Add New Database User" tıkla
   - Username ve password belirle
   - "Built-in Role" → "Atlas admin" seç
   - "Add User" tıkla

2. **Network Access**:
   - "Add IP Address" tıkla
   - "Allow Access from Anywhere" seç (0.0.0.0/0)
   - "Confirm" tıkla

### 4. Connection String Al
1. Cluster'a tıkla
2. "Connect" butonuna tıkla
3. "Connect your application" seç
4. Connection string'i kopyala
5. `<password>` kısmını gerçek şifre ile değiştir

## 📊 Yedeklenen Veriler

### users.json
```json
{
  "_id": "123456789",
  "name": "Kullanıcı Adı",
  "coins": 50,
  "downloads": 5,
  "joinDate": "2024-01-15T10:30:00.000Z"
}
```

### vpnScripts.json
```json
{
  "_id": "ObjectId('...')",
  "name": "DarkTunnel",
  "description": "VPN Script Açıklaması",
  "content": "script içeriği...",
  "filename": "darktunnel.conf",
  "enabled": true,
  "createdAt": "2024-01-15T10:30:00.000Z"
}
```

### stats.json
```json
{
  "_id": "ObjectId('...')",
  "totalDownloads": 150,
  "activeUsers": 25,
  "darktunnelDownloads": 50,
  "httpcustomDownloads": 30,
  "npvtunnelDownloads": 40,
  "shadowsocksDownloads": 30,
  "lastUpdated": "2024-01-15T10:30:00.000Z"
}
```

### admins.json
```json
{
  "_id": "ObjectId('...')",
  "chatId": 7749779502,
  "addedAt": "2024-01-15T10:30:00.000Z"
}
```

## ⚠️ Önemli Notlar

### 🔒 Güvenlik
- Connection string'leri güvenli tutun
- Yedekleme dosyalarını şifreleyin
- Environment variable'ları kullanın

### 💾 Depolama
- Yedekleme dosyaları büyük olabilir
- Düzenli temizlik yapın
- Cloud storage kullanın (Google Drive, Dropbox)

### 🔄 Otomatik Yedekleme
```javascript
// server.js'e eklenebilir
const cron = require('node-cron');

// Her gün saat 02:00'de yedekleme
cron.schedule('0 2 * * *', async () => {
    console.log('🕐 Otomatik yedekleme başlatılıyor...');
    const { MongoDBBackup } = require('./backup-system');
    const backup = new MongoDBBackup();
    await backup.runBackup();
});
```

## 🛠️ Sorun Giderme

### Yedekleme Hatası
```bash
❌ MongoDB bağlantı hatası
```
**Çözüm:** DATABASE_URL environment variable'ını kontrol edin

### Geri Yükleme Hatası
```bash
❌ Yeni MongoDB bağlantı hatası
```
**Çözüm:** NEW_DATABASE_URL'i kontrol edin ve IP whitelist'i ekleyin

### Dosya Bulunamadı
```bash
❌ Yedekleme klasörü bulunamadı
```
**Çözüm:** Önce yedekleme oluşturun: `node backup-system.js backup`

## 📞 Destek

Sorun yaşarsanız:
1. Console loglarını kontrol edin
2. MongoDB Atlas dashboard'unu kontrol edin
3. Connection string'leri doğrulayın
4. Network Access ayarlarını kontrol edin

## 🔄 Render'da Güncelleme

1. Render dashboard'una git
2. Projenizi seçin
3. "Environment" sekmesine gidin
4. DATABASE_URL'i yeni connection string ile güncelleyin
5. "Save Changes" tıklayın
6. "Manual Deploy" → "Deploy latest commit" tıklayın

---

**Bu sistem sayesinde verileriniz güvende kalacak ve yeni hesaba kolayca geçiş yapabileceksiniz! 🚀** 