# VPN Script Hub - Telegram Web App

Bu proje, Telegram Web App teknolojisi kullanarak VPN script dağıtımı yapan bir web uygulamasıdır.

## 🌟 Özellikler

- **Modern ve Güzel Arayüz**: Dark/Light tema desteği ile modern tasarım
- **Telegram Web App Entegrasyonu**: Telegram'ın resmi Web App API'si ile tam entegrasyon
- **Reklam Sistemi**: 30 saniyelik reklam izleme ile script erişimi
- **VPN Script Desteği**: DarkTunnel ve HTTP Custom scriptleri
- **Responsive Tasarım**: Mobil ve masaüstü cihazlarda mükemmel görünüm
- **İndirme ve Kopyalama**: Script dosyalarını indirme veya panoya kopyalama
- **İstatistikler**: Toplam indirme ve aktif kullanıcı sayıları
- **Animasyonlar**: Smooth geçişler ve hover efektleri

## 🌐 Canlı Demo

Web App'e erişmek için: [GitHub Pages Link](https://your-username.github.io/your-repo-name/)

## 📁 Dosya Yapısı

```
├── index.html          # Ana HTML dosyası
├── styles.css          # CSS stilleri
├── script.js           # JavaScript kodu
├── README.md           # Bu dosya
└── .github/workflows/  # GitHub Actions
    └── deploy.yml      # Otomatik deploy
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

## 🛠️ Teknolojiler

- **Frontend:** HTML5, CSS3, JavaScript (ES6+)
- **Telegram API:** Telegram Web App SDK
- **Hosting:** GitHub Pages
- **Güvenlik:** HMAC-SHA256 doğrulaması

## 🔧 Kurulum

1. Repository'yi klonlayın:
```bash
git clone https://github.com/your-username/your-repo-name.git
cd your-repo-name
```

2. GitHub Pages'da yayınlayın:
   - Repository Settings → Pages
   - Source: Deploy from branch
   - Branch: main, folder: / (root)

## 🔒 Güvenlik

- Web App sadece Telegram'dan açıldığında çalışır
- HMAC doğrulaması ile güvenlik sağlanır
- HTTPS zorunluluğu
- XSS ve CSRF koruması

## 📊 Desteklenen Scriptler

- **DarkTunnel** - Gelişmiş tünel teknolojisi
- **HTTP Custom** - Özelleştirilebilir HTTP bağlantı

## 🤝 Katkıda Bulunma

1. Fork yapın
2. Feature branch oluşturun (`git checkout -b feature/AmazingFeature`)
3. Commit yapın (`git commit -m 'Add some AmazingFeature'`)
4. Push yapın (`git push origin feature/AmazingFeature`)
5. Pull Request açın

## 📄 Lisans

Bu proje MIT lisansı altında lisanslanmıştır.

## 📞 İletişim

- **GitHub:** [@your-username](https://github.com/your-username)
- **Telegram:** @your_bot_username

## 🙏 Teşekkürler

- Telegram Web App API
- Font Awesome ikonları
- GitHub Pages hosting

---

⭐ Bu projeyi beğendiyseniz yıldız vermeyi unutmayın!

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