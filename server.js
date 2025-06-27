const express = require('express');
const TelegramBot = require('node-telegram-bot-api');
const cors = require('cors');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 3000;

// Bot token'ınızı buraya yazın
const token = '7762459827:AAFI_AgWtOcsFYT4bzG-i9TIwGGb6VwZJls';

// Bot oluştur
const bot = new TelegramBot(token, { polling: true });

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.static('.'));

// Basit veritabanı (gerçek projede MongoDB veya PostgreSQL kullanın)
let database = {
    stats: {
        totalDownloads: 0,
        activeUsers: 0,
        darktunnelDownloads: 0,
        httpcustomDownloads: 0,
        lastUpdated: new Date()
    },
    users: {},
    admins: [7749779502],
    vpnScripts: {
        darktunnel: {
            name: 'DarkTunnel',
            description: 'Gelişmiş tünel teknolojisi ile güvenli bağlantı',
            content: `# DarkTunnel VPN Configuration
# Server: premium.darktunnel.com
# Port: 443
# Protocol: TLS

[General]
loglevel = notify
interface = 127.0.0.1
port = 1080
socks-interface = 127.0.0.1
socks-port = 1081
http-interface = 127.0.0.1
http-port = 1082

[Proxy]
Type = Shadowsocks
Server = premium.darktunnel.com
Port = 443
Method = chacha20-ietf-poly1305
Password = your_password_here

[Proxy Group]
Proxy = select, auto, fallback
auto = url-test, server-tcp, url = http://www.gstatic.com/generate_204
fallback = fallback, server-tcp, url = http://www.gstatic.com/generate_204

[Rule]
DOMAIN-SUFFIX,google.com,Proxy
DOMAIN-SUFFIX,facebook.com,Proxy
DOMAIN-SUFFIX,twitter.com,Proxy
DOMAIN-SUFFIX,instagram.com,Proxy
DOMAIN-SUFFIX,youtube.com,Proxy
DOMAIN-SUFFIX,netflix.com,Proxy
GEOIP,CN,DIRECT
FINAL,DIRECT`,
            filename: 'darktunnel.conf',
            enabled: true
        },
        httpcustom: {
            name: 'HTTP Custom',
            description: 'HTTP/HTTPS protokolü ile özelleştirilebilir bağlantı',
            content: `# HTTP Custom Configuration
# Server: http-custom.example.com
# Port: 80
# Protocol: HTTP

[General]
loglevel = notify
interface = 127.0.0.1
port = 1080
socks-interface = 127.0.0.1
socks-port = 1081
http-interface = 127.0.0.1
http-port = 1082

[Proxy]
Type = HTTP
Server = http-custom.example.com
Port = 80
Username = your_username
Password = your_password

[Proxy Group]
Proxy = select, auto, fallback
auto = url-test, server-tcp, url = http://www.gstatic.com/generate_204
fallback = fallback, server-tcp, url = http://www.gstatic.com/generate_204

[Rule]
DOMAIN-SUFFIX,google.com,Proxy
DOMAIN-SUFFIX,facebook.com,Proxy
DOMAIN-SUFFIX,twitter.com,Proxy
DOMAIN-SUFFIX,instagram.com,Proxy
DOMAIN-SUFFIX,youtube.com,Proxy
DOMAIN-SUFFIX,netflix.com,Proxy
GEOIP,CN,DIRECT
FINAL,DIRECT`,
            filename: 'httpcustom.conf',
            enabled: true
        }
    }
};

// Yönetici kontrolü
function isAdmin(chatId) {
    return database.admins.includes(chatId);
}

// İstatistikleri güncelle
function updateStats(scriptType) {
    database.stats.totalDownloads++;
    if (scriptType === 'darktunnel') {
        database.stats.darktunnelDownloads++;
    } else if (scriptType === 'httpcustom') {
        database.stats.httpcustomDownloads++;
    }
    database.stats.lastUpdated = new Date();
}

// API Routes
app.get('/api/stats', (req, res) => {
    // Aktif kullanıcı sayısını güncelle
    database.stats.activeUsers = Object.keys(database.users).length;
    res.json(database.stats);
});

app.get('/api/scripts', (req, res) => {
    res.json(database.vpnScripts);
});

app.post('/api/download', (req, res) => {
    const { scriptType, userId } = req.body;
    
    if (database.vpnScripts[scriptType] && database.vpnScripts[scriptType].enabled) {
        updateStats(scriptType);
        
        // Kullanıcı istatistiklerini güncelle
        if (!database.users[userId]) {
            database.users[userId] = { downloads: 0, firstSeen: new Date() };
        }
        database.users[userId].downloads++;
        database.users[userId].lastDownload = new Date();
        
        res.json({
            success: true,
            script: database.vpnScripts[scriptType],
            stats: database.stats
        });
    } else {
        res.status(400).json({ success: false, error: 'Script bulunamadı veya devre dışı' });
    }
});

// Yönetici API'leri
app.post('/api/admin/add-script', (req, res) => {
    const { adminId, scriptData } = req.body;
    
    if (!isAdmin(adminId)) {
        return res.status(403).json({ success: false, error: 'Yönetici izni gerekli' });
    }
    
    const { id, name, description, content, filename } = scriptData;
    database.vpnScripts[id] = {
        name,
        description,
        content,
        filename,
        enabled: true
    };
    
    res.json({ success: true, message: 'Script başarıyla eklendi' });
});

app.post('/api/admin/update-script', (req, res) => {
    const { adminId, scriptId, updates } = req.body;
    
    if (!isAdmin(adminId)) {
        return res.status(403).json({ success: false, error: 'Yönetici izni gerekli' });
    }
    
    if (database.vpnScripts[scriptId]) {
        database.vpnScripts[scriptId] = { ...database.vpnScripts[scriptId], ...updates };
        res.json({ success: true, message: 'Script başarıyla güncellendi' });
    } else {
        res.status(404).json({ success: false, error: 'Script bulunamadı' });
    }
});

app.post('/api/admin/toggle-script', (req, res) => {
    const { adminId, scriptId } = req.body;
    
    if (!isAdmin(adminId)) {
        return res.status(403).json({ success: false, error: 'Yönetici izni gerekli' });
    }
    
    if (database.vpnScripts[scriptId]) {
        database.vpnScripts[scriptId].enabled = !database.vpnScripts[scriptId].enabled;
        res.json({ 
            success: true, 
            message: `Script ${database.vpnScripts[scriptId].enabled ? 'etkinleştirildi' : 'devre dışı bırakıldı'}` 
        });
    } else {
        res.status(404).json({ success: false, error: 'Script bulunamadı' });
    }
});

app.get('/api/admin/users', (req, res) => {
    const { adminId } = req.query;
    
    if (!isAdmin(parseInt(adminId))) {
        return res.status(403).json({ success: false, error: 'Yönetici izni gerekli' });
    }
    
    res.json({ success: true, users: database.users });
});

// Bot komutları
bot.onText(/\/start/, (msg) => {
    const chatId = msg.chat.id;
    const welcomeMessage = `
🚀 **VPN Script Hub'a Hoş Geldiniz!**

Bu bot ile güvenli VPN script dosyalarını reklam izleyerek elde edebilirsiniz.

**Mevcut Scriptler:**
• DarkTunnel - Gelişmiş tünel teknolojisi
• HTTP Custom - Özelleştirilebilir HTTP bağlantı

**İstatistikler:**
📥 Toplam İndirme: ${database.stats.totalDownloads}
👥 Aktif Kullanıcı: ${Object.keys(database.users).length}

${isAdmin(chatId) ? '\n🔧 **Yönetici Komutları:**\n/admin - Yönetici paneli\n/stats - Detaylı istatistikler' : ''}
`;

    const keyboard = {
        inline_keyboard: [
            [{
                text: '🚀 VPN Script Hub\'ı Aç',
                web_app: { url: `https://atagylyjow.github.io/TG-Web-App/` }
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

// Yönetici komutları
bot.onText(/\/admin/, (msg) => {
    const chatId = msg.chat.id;
    
    console.log(`Admin komutu çağrıldı. Chat ID: ${chatId}`);
    console.log(`Admin listesi: ${database.admins}`);
    console.log(`Admin mi?: ${isAdmin(chatId)}`);
    
    if (!isAdmin(chatId)) {
        return bot.sendMessage(chatId, '❌ Bu komutu kullanma yetkiniz yok.');
    }
    
    const adminMessage = `
🔧 **Yönetici Paneli**

**Komutlar:**
• /stats - Detaylı istatistikler
• /addadmin <chat_id> - Yönetici ekle
• /removeadmin <chat_id> - Yönetici çıkar
• /addscript - Yeni script ekle
• /togglescript <script_id> - Script aç/kapat
• /broadcast <mesaj> - Toplu mesaj gönder

**Hızlı İstatistikler:**
📥 Toplam İndirme: ${database.stats.totalDownloads}
👥 Aktif Kullanıcı: ${Object.keys(database.users).length}
📊 DarkTunnel: ${database.stats.darktunnelDownloads}
🌐 HTTP Custom: ${database.stats.httpcustomDownloads}
    `;
    
    bot.sendMessage(chatId, adminMessage, { parse_mode: 'Markdown' });
});

bot.onText(/\/stats/, (msg) => {
    const chatId = msg.chat.id;
    
    if (!isAdmin(chatId)) {
        return bot.sendMessage(chatId, '❌ Bu komutu kullanma yetkiniz yok.');
    }
    
    const statsMessage = `
📊 **Detaylı İstatistikler**

**Genel:**
• Toplam İndirme: ${database.stats.totalDownloads}
• Aktif Kullanıcı: ${Object.keys(database.users).length}
• Son Güncelleme: ${database.stats.lastUpdated.toLocaleString('tr-TR')}

**Script Bazında:**
• DarkTunnel: ${database.stats.darktunnelDownloads} (${Math.round((database.stats.darktunnelDownloads / database.stats.totalDownloads) * 100)}%)
• HTTP Custom: ${database.stats.httpcustomDownloads} (${Math.round((database.stats.httpcustomDownloads / database.stats.totalDownloads) * 100)}%)

**Son 10 Kullanıcı:**
${Object.entries(database.users)
    .sort((a, b) => new Date(b[1].lastDownload) - new Date(a[1].lastDownload))
    .slice(0, 10)
    .map(([userId, user]) => `• ID: ${userId} - ${user.downloads} indirme`)
    .join('\n')}
    `;
    
    bot.sendMessage(chatId, statsMessage, { parse_mode: 'Markdown' });
});

// Callback query'leri işle
bot.on('callback_query', (query) => {
    const chatId = query.message.chat.id;
    const data = query.data;
    
    if (data === 'stats') {
        const statsMessage = `
📊 **VPN Script Hub İstatistikleri**

📥 **Toplam İndirmeler:**
• Genel: ${database.stats.totalDownloads}
• DarkTunnel: ${database.stats.darktunnelDownloads}
• HTTP Custom: ${database.stats.httpcustomDownloads}

👥 **Kullanıcılar:**
• Aktif: ${Object.keys(database.users).length}

📈 **Popülerlik:**
• DarkTunnel: ${Math.round((database.stats.darktunnelDownloads / database.stats.totalDownloads) * 100)}%
• HTTP Custom: ${Math.round((database.stats.httpcustomDownloads / database.stats.totalDownloads) * 100)}%
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

**Destek:**
🔗 Telegram: @your_support_username
        `;
        
        bot.sendMessage(chatId, helpMessage, {
            parse_mode: 'Markdown'
        });
    }
    
    bot.answerCallbackQuery(query.id);
});

// Web App'ten gelen veriler
bot.on('web_app_data', (msg) => {
    const chatId = msg.chat.id;
    const data = JSON.parse(msg.web_app_data.data);
    
    console.log('Web App data received:', data);
    
    if (data.action === 'download') {
        updateStats(data.script);
        
        // Kullanıcı istatistiklerini güncelle
        if (!database.users[chatId]) {
            database.users[chatId] = { downloads: 0, firstSeen: new Date() };
        }
        database.users[chatId].downloads++;
        database.users[chatId].lastDownload = new Date();
        
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

// Sunucuyu başlat
app.listen(PORT, () => {
    console.log(`🚀 VPN Script Hub Server başlatıldı!`);
    console.log(`📡 Port: ${PORT}`);
    console.log(`🤖 Bot Token: ${token}`);
    console.log(`🌐 Web App URL: https://atagylyjow.github.io/TG-Web-App/`);
});

// Hata yakalama
process.on('uncaughtException', (error) => {
    console.error('Uncaught Exception:', error);
});

process.on('unhandledRejection', (reason, promise) => {
    console.error('Unhandled Rejection at:', promise, 'reason:', reason);
}); 