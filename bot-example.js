const TelegramBot = require('node-telegram-bot-api');
const crypto = require('crypto');

// Bot token'ınızı buraya yazın
// @BotFather'dan aldığınız token'ı buraya yapıştırın
// Örnek: const token = '123456789:ABCdefGHIjklMNOpqrsTUVwxyz';
const token = '7762459827:AAFI_AgWtOcsFYT4bzG-i9TIwGGb6VwZJls';

// HMAC doğrulama fonksiyonu
function checkTelegramAuth(initData, botToken) {
    try {
        const urlParams = new URLSearchParams(initData);
        const hash = urlParams.get('hash');
        urlParams.delete('hash');

        const dataCheckString = [...urlParams.entries()]
            .map(([key, value]) => `${key}=${value}`)
            .sort()
            .join('\n');

        const secretKey = crypto.createHmac('sha256', 'WebAppData').update(botToken).digest();
        const hmac = crypto.createHmac('sha256', secretKey).update(dataCheckString).digest('hex');

        return hmac === hash;
    } catch (error) {
        console.error('HMAC verification error:', error);
        return false;
    }
}

// Bot oluştur
const bot = new TelegramBot(token, { polling: true });

// İstatistikler
let stats = {
    totalDownloads: 1234,
    activeUsers: 567,
    darktunnelDownloads: 0,
    httpcustomDownloads: 0
};

// Bot başlatıldığında
bot.on('polling_error', (error) => {
    console.log('Polling error:', error);
});

// /start komutu
bot.onText(/\/start/, (msg) => {
    const chatId = msg.chat.id;
    const welcomeMessage = `
🚀 **VPN Script Hub'a Hoş Geldiniz!**

Bu bot ile güvenli VPN script dosyalarını reklam izleyerek elde edebilirsiniz.

**Mevcut Scriptler:**
• DarkTunnel - Gelişmiş tünel teknolojisi
• HTTP Custom - Özelleştirilebilir HTTP bağlantı

**Nasıl Kullanılır:**
1. Aşağıdaki butona tıklayın
2. İstediğiniz scripti seçin
3. 30 saniye reklam izleyin
4. Script dosyasını indirin

**İstatistikler:**
📥 Toplam İndirme: ${stats.totalDownloads}
👥 Aktif Kullanıcı: ${stats.activeUsers}
`;

    const keyboard = {
        inline_keyboard: [
            [{
                text: '🚀 VPN Script Hub\'ı Aç',
                // Web App URL'sini buraya yazın
                // Örnek: https://your-app.vercel.app/index.html
                web_app: { url: 'https://telegram-web-j3rrny5ns-nowruzs-projects-ca4fd790.vercel.app/index.html' }
            }],
            [{
                text: '📊 İstatistikler',
                callback_data: 'stats'
            }],
            [{
                text: 'ℹ️ Yardım',
                callback_data: 'help'
            }]
        ]
    };

    bot.sendMessage(chatId, welcomeMessage, {
        parse_mode: 'Markdown',
        reply_markup: keyboard
    });
});

// Web App'ten gelen veriler
bot.on('web_app_data', (msg) => {
    const chatId = msg.chat.id;
    const data = JSON.parse(msg.web_app_data.data);
    
    console.log('Web App data received:', data);
    
    // HMAC doğrulaması yap
    if (data.initData && !checkTelegramAuth(data.initData, token)) {
        console.log('❌ HMAC verification failed');
        bot.sendMessage(chatId, '❌ Güvenlik doğrulaması başarısız. Lütfen tekrar deneyin.');
        return;
    }
    
    if (data.action === 'download') {
        // İndirme istatistiklerini güncelle
        stats.totalDownloads++;
        
        if (data.script === 'darktunnel') {
            stats.darktunnelDownloads++;
        } else if (data.script === 'httpcustom') {
            stats.httpcustomDownloads++;
        }
        
        // Kullanıcıya teşekkür mesajı
        const thankYouMessage = `
✅ **Script başarıyla indirildi!**

📁 Script: ${data.script === 'darktunnel' ? 'DarkTunnel' : 'HTTP Custom'}
⏰ Tarih: ${new Date(data.timestamp).toLocaleString('tr-TR')}

💡 **Kurulum İpuçları:**
• Script dosyasını uygun VPN uygulamasına yükleyin
• Sunucu bilgilerini güncelleyin
• Bağlantıyı test edin

🔗 **Yardım için:** @your_support_username
        `;
        
        bot.sendMessage(chatId, thankYouMessage, {
            parse_mode: 'Markdown'
        });
    }
});

// Callback query'leri işle
bot.on('callback_query', (query) => {
    const chatId = query.message.chat.id;
    const data = query.data;
    
    if (data === 'stats') {
        const statsMessage = `
📊 **VPN Script Hub İstatistikleri**

📥 **Toplam İndirmeler:**
• Genel: ${stats.totalDownloads}
• DarkTunnel: ${stats.darktunnelDownloads}
• HTTP Custom: ${stats.httpcustomDownloads}

👥 **Kullanıcılar:**
• Aktif: ${stats.activeUsers}

📈 **Popülerlik:**
• DarkTunnel: ${Math.round((stats.darktunnelDownloads / stats.totalDownloads) * 100)}%
• HTTP Custom: ${Math.round((stats.httpcustomDownloads / stats.totalDownloads) * 100)}%
        `;
        
        bot.sendMessage(chatId, statsMessage, {
            parse_mode: 'Markdown'
        });
    } else if (data === 'help') {
        const helpMessage = `
ℹ️ **VPN Script Hub Yardım**

**Sık Sorulan Sorular:**

❓ **Script nasıl kullanılır?**
1. Web App'i açın
2. Script seçin
3. Reklam izleyin
4. İndirin ve kurun

❓ **Hangi VPN uygulamaları desteklenir?**
• Shadowrocket (iOS)
• V2rayNG (Android)
• Clash (Windows/Mac)
• Ve diğerleri...

❓ **Bağlantı sorunu yaşıyorum?**
• Sunucu bilgilerini kontrol edin
• İnternet bağlantınızı test edin
• Destek ekibiyle iletişime geçin

❓ **Yeni script eklenir mi?**
• Evet, düzenli olarak yeni scriptler eklenir
• Güncellemeler için botu takip edin

**Destek:**
🔗 Telegram: @your_support_username
📧 Email: support@yourdomain.com
        `;
        
        bot.sendMessage(chatId, helpMessage, {
            parse_mode: 'Markdown'
        });
    }
    
    // Callback query'yi yanıtla
    bot.answerCallbackQuery(query.id);
});

// /stats komutu (admin için)
bot.onText(/\/stats/, (msg) => {
    const chatId = msg.chat.id;
    
    // Admin kontrolü (chat ID'nizi buraya yazın)
    if (chatId === 123456789) {
        const adminStats = `
🔧 **Admin İstatistikleri**

📊 **Genel:**
• Toplam İndirme: ${stats.totalDownloads}
• Aktif Kullanıcı: ${stats.activeUsers}

📥 **Script Bazında:**
• DarkTunnel: ${stats.darktunnelDownloads}
• HTTP Custom: ${stats.httpcustomDownloads}

📈 **Oranlar:**
• DarkTunnel: ${Math.round((stats.darktunnelDownloads / stats.totalDownloads) * 100)}%
• HTTP Custom: ${Math.round((stats.httpcustomDownloads / stats.totalDownloads) * 100)}%

⏰ Son güncelleme: ${new Date().toLocaleString('tr-TR')}
        `;
        
        bot.sendMessage(chatId, adminStats, {
            parse_mode: 'Markdown'
        });
    } else {
        bot.sendMessage(chatId, '❌ Bu komutu kullanma yetkiniz yok.');
    }
});

// /broadcast komutu (admin için)
bot.onText(/\/broadcast (.+)/, (msg, match) => {
    const chatId = msg.chat.id;
    const message = match[1];
    
    // Admin kontrolü
    if (chatId === 123456789) {
        // Burada kullanıcı listesi olmalı
        // Örnek olarak sadece mesajı gösteriyoruz
        bot.sendMessage(chatId, `📢 Broadcast mesajı hazırlandı:\n\n${message}`);
    } else {
        bot.sendMessage(chatId, '❌ Bu komutu kullanma yetkiniz yok.');
    }
});

// Hata yakalama
process.on('uncaughtException', (error) => {
    console.error('Uncaught Exception:', error);
});

process.on('unhandledRejection', (reason, promise) => {
    console.error('Unhandled Rejection at:', promise, 'reason:', reason);
});

console.log('VPN Script Hub Bot başlatıldı!');
console.log('Bot token:', token);

// Bot'u başlat
bot.startPolling(); 