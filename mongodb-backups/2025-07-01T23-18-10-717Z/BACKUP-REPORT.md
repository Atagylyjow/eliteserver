# MongoDB Yedekleme Raporu (db.json'den)

## 📅 Yedekleme Tarihi
02.07.2025 04:18:10

## 📊 Veritabanı Bilgileri
- **Kaynak:** db.json dosyası
- **Toplam Döküman:** 8
- **Koleksiyon Sayısı:** 4

## 📋 Koleksiyon Detayları
- **users:** 2 döküman
- **vpnScripts:** 4 döküman
- **stats:** 1 döküman
- **admins:** 1 döküman

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
```bash
# Yeni connection string ile geri yükleme
node restore-data.js
```

### 4. Environment Variable Güncelle
Render'da DATABASE_URL'i yeni connection string ile güncelle

## 📁 Yedeklenen Dosyalar
- `users.json` - Kullanıcı verileri
- `vpnScripts.json` - VPN script verileri
- `stats.json` - İstatistik verileri
- `admins.json` - Admin verileri
- `backup-summary.json` - Yedekleme özeti

## ⚠️ Önemli Notlar
- Bu yedekleme 02.07.2025 04:18:10 tarihinde oluşturuldu
- Tüm veriler JSON formatında saklandı
- Yeni hesaba geçerken connection string'i güncellemeyi unutma
- Render'da environment variable'ları güncelle

---
*Bu rapor otomatik olarak oluşturuldu*
