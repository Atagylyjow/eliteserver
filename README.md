# VPN Script Hub - Telegram Web App

Güzel arayüzlü bir Telegram Web App'i ile VPN script dosyalarını reklam izleyerek dağıtın. DarkTunnel ve HTTP Custom VPN scriptleri desteklenir.

## 🌟 Özellikler

- **Modern ve Güzel Arayüz**: Dark/Light tema desteği ile modern tasarım
- **Telegram Web App Entegrasyonu**: Telegram'ın resmi Web App API'si ile tam entegrasyon
- **Reklam Sistemi**: 30 saniyelik reklam izleme ile script erişimi
- **VPN Script Desteği**: DarkTunnel ve HTTP Custom scriptleri
- **Responsive Tasarım**: Mobil ve masaüstü cihazlarda mükemmel görünüm
- **İndirme ve Kopyalama**: Script dosyalarını indirme veya panoya kopyalama
- **İstatistikler**: Toplam indirme ve aktif kullanıcı sayıları
- **Animasyonlar**: Smooth geçişler ve hover efektleri

## 📁 Dosya Yapısı

```
Telegram Web App/
├── index.html          # Ana HTML dosyası
├── styles.css          # CSS stilleri
├── script.js           # JavaScript fonksiyonları
└── README.md           # Bu dosya
```

## 🚀 Kurulum

### 1. Telegram Bot Oluşturma

1. Telegram'da [@BotFather](https://t.me/botfather) ile konuşun
2. `/newbot` komutunu gönderin
3. Bot adını ve kullanıcı adını belirleyin
4. Bot token'ınızı alın (örn: `123456789:ABCdefGHIjklMNOpqrsTUVwxyz`)

### 2. Web App URL'sini Ayarlama

1. [@BotFather](https://t.me/botfather)'a `/setmenubutton` komutunu gönderin
2. Botunuzu seçin
3. Web App URL'sini girin: `https://your-domain.com/index.html`

### 3. Proje Kurulumu

```bash
# Bağımlılıkları yükleyin
npm install

# Bot token'ını ayarlayın
# bot-example.js dosyasında YOUR_BOT_TOKEN_HERE yerine gerçek token'ınızı yazın
```

### 4. Web Sunucusu Kurulumu

Web App'inizi internette yayınlamanız gerekiyor. Seçenekler:

#### A) Vercel (Önerilen)
```bash
# Vercel CLI kurun
npm i -g vercel

# Projeyi deploy edin
vercel

# Domain'i ayarlayın
vercel --prod
```

#### B) Netlify
```bash
# Netlify CLI kurun
npm i -g netlify-cli

# Projeyi deploy edin
netlify deploy
```

#### C) GitHub Pages
1. Projeyi GitHub'a yükleyin
2. Settings > Pages > Source: Deploy from branch
3. Branch: main, folder: / (root)

### 5. Bot Token'ını Güncelleme

`bot-example.js` dosyasında:
```javascript
const token = 'YOUR_BOT_TOKEN_HERE'; // Buraya gerçek token'ınızı yazın
```

### 6. Web App URL'sini Güncelleme

`bot-example.js` dosyasında:
```javascript
web_app: { url: 'https://your-domain.com/index.html' } // Buraya gerçek URL'nizi yazın
```

## 🏃‍♂️ Çalıştırma

### Geliştirme Modu
```bash
npm run dev
```

### Prodüksiyon Modu
```bash
npm start
```

## 📱 Kullanım

1. Telegram'da botunuzu bulun
2. `/start` komutunu gönderin
3. "VPN Script Hub'ı Aç" butonuna tıklayın
4. İstediğiniz scripti seçin
5. Reklamı izleyin
6. Script dosyasını indirin

## 🔧 Yapılandırma

### Admin Ayarları
`bot-example.js` dosyasında admin chat ID'sini ayarlayın:
```javascript
if (chatId === 123456789) { // Buraya kendi chat ID'nizi yazın
```

### Script Dosyaları
Script dosyalarını `public/scripts/` klasörüne ekleyin ve `script.js` dosyasında yollarını güncelleyin.

## 📄 Lisans

MIT License

## 📞 Destek

Sorunlarınız için:
- GitHub Issues
- Telegram: @your_support_username
- Email: support@yourdomain.com

## 🙏 Teşekkürler

- Telegram Web App API
- Font Awesome ikonları
- Modern CSS teknikleri
- Web standartları

---

**Not**: Bu Web App sadece eğitim amaçlıdır. Gerçek VPN scriptleri için güvenilir kaynaklar kullanın. 