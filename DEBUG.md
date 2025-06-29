# Debug Sistemi Dokümantasyonu

## 🚀 Genel Bakış

Bu proje gelişmiş bir debug ve loglama sistemi ile donatılmıştır. Sistem, geliştirme ve production ortamlarında hata ayıklama ve izleme için tasarlanmıştır.

## 📋 Özellikler

### 🔧 Debug Modu
- `DEBUG=true` environment variable ile aktif edilir
- Detaylı console logları
- Request/response izleme
- Bot event logları

### 📝 Loglama Sistemi
- Dosya tabanlı loglama (`app.log`)
- Farklı log seviyeleri (debug, info, warn, error)
- Timestamp ile kayıt
- JSON formatında structured logging

### 🛡️ Error Handling
- Express error middleware
- Uncaught exception yakalama
- Unhandled rejection yakalama
- Graceful shutdown

## 🚀 Kullanım

### Development Modu
```bash
# Debug modunda başlat
npm run debug

# Normal development modu
npm run dev
```

### Production Modu
```bash
# Production debug modu
npm run debug:prod

# Normal production modu
npm start
```

### Test Çalıştırma
```bash
# API testlerini çalıştır
npm test
```

## 📊 Log Seviyeleri

### Debug
- Detaylı geliştirme bilgileri
- Request/response detayları
- Bot event detayları

### Info
- Genel bilgi mesajları
- API çağrıları
- Kullanıcı aktiviteleri

### Warn
- Uyarı mesajları
- Yetkisiz erişim denemeleri
- Geçersiz istekler

### Error
- Hata mesajları
- Exception'lar
- Bot hataları

## 🔍 Debug Test Script'i

`debug-test.js` dosyası API'lerin doğru çalışıp çalışmadığını test eder:

1. **Stats API Test** - İstatistik verilerini kontrol eder
2. **Scripts API Test** - Mevcut scriptleri listeler
3. **Download API Test** - Script indirme işlemini test eder
4. **Admin API Test** - Yetki kontrolünü test eder

## 📁 Log Dosyası

Loglar `app.log` dosyasında saklanır:
- Her log entry timestamp ile kaydedilir
- JSON formatında structured data
- .gitignore'da tanımlı (version control'e dahil değil)

## 🛠️ Environment Variables

```bash
# Debug modunu aktif et
DEBUG=true

# Node environment
NODE_ENV=development

# Port (varsayılan: 3000)
PORT=3000
```

## 🔧 Bot Debug Özellikleri

### Event Logları
- Polling error'ları
- Bot error'ları
- Message handling
- Callback query'ler

### Admin Komutları
- Admin yetki kontrolü
- Script yönetimi
- Kullanıcı istatistikleri

## 📈 Monitoring

### API Endpoints
- `/api/stats` - İstatistik verileri
- `/api/scripts` - Script listesi
- `/api/download` - Script indirme
- `/api/admin/*` - Admin işlemleri

### Metrics
- Toplam indirme sayısı
- Aktif kullanıcı sayısı
- Script bazında istatistikler
- Hata oranları

## 🚨 Hata Ayıklama

### Yaygın Sorunlar

1. **Bot Token Hatası**
   - Token'ın geçerli olduğunu kontrol et
   - Bot'un aktif olduğunu doğrula

2. **Port Çakışması**
   - Port 3000'in kullanılabilir olduğunu kontrol et
   - Farklı port kullan: `PORT=3001 npm run debug`

3. **CORS Hatası**
   - Web App URL'inin doğru olduğunu kontrol et
   - CORS ayarlarını gözden geçir

### Debug Adımları

1. Debug modunda başlat: `npm run debug`
2. Test script'ini çalıştır: `npm test`
3. Log dosyasını kontrol et: `tail -f app.log`
4. Console çıktılarını izle

## 📞 Destek

Sorun yaşadığınızda:
1. Log dosyasını kontrol edin
2. Debug modunda test edin
3. Test script'ini çalıştırın
4. Console çıktılarını inceleyin

## 🔄 Güncellemeler

Debug sistemi sürekli geliştirilmektedir. Yeni özellikler:
- Real-time monitoring
- Performance metrics
- Alert sistemi
- Dashboard entegrasyonu 