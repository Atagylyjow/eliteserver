const express = require('express');
const TelegramBot = require('node-telegram-bot-api');
const cors = require('cors');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 3000;

// Bot token'ınızı buraya yazın
const token = '7762459827:AAFFQRGpSphgUqw2MHhMngCMQeBHZLHrHCo';

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
            id: 'darktunnel',
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
            enabled: true,
            downloads: 0,
            createdAt: new Date(),
            updatedAt: new Date()
        },
        httpcustom: {
            id: 'httpcustom',
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
            enabled: true,
            downloads: 0,
            createdAt: new Date(),
            updatedAt: new Date()
        }
    }
};

// Yönetici kontrolü
function isAdmin(chatId) {
    return database.admins.includes(chatId);
}

// İstatistikleri güncelle
function updateStats(scriptId) {
    database.stats.totalDownloads++;
    if (database.vpnScripts[scriptId]) {
        database.vpnScripts[scriptId].downloads++;
    }
    database.stats.lastUpdated = new Date();
}

// Script listesini güncelle
function updateScriptStats() {
    database.stats.scriptCount = Object.keys(database.vpnScripts).length;
    database.stats.activeScripts = Object.values(database.vpnScripts).filter(s => s.enabled).length;
}

// API Routes
app.get('/api/stats', (req, res) => {
    // Aktif kullanıcı sayısını güncelle
    database.stats.activeUsers = Object.keys(database.users).length;
    updateScriptStats();
    
    res.json(database.stats);
});

app.get('/api/scripts', (req, res) => {
    // Sadece aktif scriptleri döndür
    const activeScripts = {};
    Object.entries(database.vpnScripts).forEach(([id, script]) => {
        if (script.enabled) {
            activeScripts[id] = {
                id: script.id,
                name: script.name,
                description: script.description,
                filename: script.filename,
                downloads: script.downloads || 0
            };
        }
    });
    res.json(activeScripts);
});

app.get('/api/scripts/:id', (req, res) => {
    const scriptId = req.params.id;
    const script = database.vpnScripts[scriptId];
    
    if (script && script.enabled) {
        res.json({
            success: true,
            script: {
                id: script.id,
                name: script.name,
                description: script.description,
                content: script.content,
                filename: script.filename
            }
        });
    } else {
        res.status(404).json({ success: false, error: 'Script bulunamadı veya devre dışı' });
    }
});

app.post('/api/download', (req, res) => {
    const { scriptId, userId } = req.body;
    
    if (database.vpnScripts[scriptId] && database.vpnScripts[scriptId].enabled) {
        updateStats(scriptId);
        
        // Kullanıcı istatistiklerini güncelle
        if (!database.users[userId]) {
            database.users[userId] = { downloads: 0, firstSeen: new Date() };
        }
        database.users[userId].downloads++;
        database.users[userId].lastDownload = new Date();
        
        const script = database.vpnScripts[scriptId];
        res.json({
            success: true,
            script: {
                id: script.id,
                name: script.name,
                description: script.description,
                content: script.content,
                filename: script.filename
            },
            stats: database.stats
        });
    } else {
        res.status(400).json({ success: false, error: 'Script bulunamadı veya devre dışı' });
    }
});

// Yönetici API'leri
app.get('/api/admin/scripts', (req, res) => {
    const { adminId } = req.query;
    
    if (!isAdmin(parseInt(adminId))) {
        return res.status(403).json({ success: false, error: 'Yönetici izni gerekli' });
    }
    
    res.json({ success: true, scripts: database.vpnScripts });
});

app.post('/api/admin/add-script', (req, res) => {
    const { adminId, scriptData } = req.body;
    
    if (!isAdmin(adminId)) {
        return res.status(403).json({ success: false, error: 'Yönetici izni gerekli' });
    }
    
    const { id, name, description, content, filename } = scriptData;
    
    if (database.vpnScripts[id]) {
        return res.status(400).json({ success: false, error: 'Bu ID zaten kullanılıyor' });
    }
    
    database.vpnScripts[id] = {
        id,
        name,
        description,
        content,
        filename,
        enabled: true,
        downloads: 0,
        createdAt: new Date(),
        updatedAt: new Date()
    };
    
    updateScriptStats();
    
    res.json({ success: true, message: 'Script başarıyla eklendi', script: database.vpnScripts[id] });
});

app.put('/api/admin/update-script/:id', (req, res) => {
    const { adminId } = req.body;
    const scriptId = req.params.id;
    const updates = req.body;
    
    if (!isAdmin(adminId)) {
        return res.status(403).json({ success: false, error: 'Yönetici izni gerekli' });
    }
    
    if (!database.vpnScripts[scriptId]) {
        return res.status(404).json({ success: false, error: 'Script bulunamadı' });
    }
    
    // Güncellenebilir alanlar
    const allowedFields = ['name', 'description', 'content', 'filename'];
    allowedFields.forEach(field => {
        if (updates[field] !== undefined) {
            database.vpnScripts[scriptId][field] = updates[field];
        }
    });
    
    database.vpnScripts[scriptId].updatedAt = new Date();
    
    res.json({ success: true, message: 'Script başarıyla güncellendi', script: database.vpnScripts[scriptId] });
});

app.delete('/api/admin/delete-script/:id', (req, res) => {
    const { adminId } = req.body;
    const scriptId = req.params.id;
    
    if (!isAdmin(adminId)) {
        return res.status(403).json({ success: false, error: 'Yönetici izni gerekli' });
    }
    
    if (!database.vpnScripts[scriptId]) {
        return res.status(404).json({ success: false, error: 'Script bulunamadı' });
    }
    
    const scriptName = database.vpnScripts[scriptId].name;
    delete database.vpnScripts[scriptId];
    
    updateScriptStats();
    
    res.json({ success: true, message: `Script "${scriptName}" başarıyla silindi` });
});

app.post('/api/admin/toggle-script/:id', (req, res) => {
    const { adminId } = req.body;
    const scriptId = req.params.id;
    
    if (!isAdmin(adminId)) {
        return res.status(403).json({ success: false, error: 'Yönetici izni gerekli' });
    }
    
    if (!database.vpnScripts[scriptId]) {
        return res.status(404).json({ success: false, error: 'Script bulunamadı' });
    }
    
    database.vpnScripts[scriptId].enabled = !database.vpnScripts[scriptId].enabled;
    database.vpnScripts[scriptId].updatedAt = new Date();
    
    updateScriptStats();
    
    const status = database.vpnScripts[scriptId].enabled ? 'etkinleştirildi' : 'devre dışı bırakıldı';
    res.json({ 
        success: true, 
        message: `Script ${status}`,
        script: database.vpnScripts[scriptId]
    });
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
${Object.values(database.vpnScripts)
    .filter(script => script.enabled)
    .map(script => `• ${script.name} - ${script.description}`)
    .join('\n')}

**İstatistikler:**
📥 Toplam İndirme: ${database.stats.totalDownloads}
👥 Toplam Kullanıcı: ${Object.keys(database.users).length}
📊 Aktif Script: ${Object.values(database.vpnScripts).filter(s => s.enabled).length}

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
    
    if (!isAdmin(chatId)) {
        return bot.sendMessage(chatId, '❌ Bu komutu kullanma yetkiniz yok.');
    }
    
    const activeScripts = Object.values(database.vpnScripts).filter(s => s.enabled);
    const inactiveScripts = Object.values(database.vpnScripts).filter(s => !s.enabled);
    
    const adminMessage = `
🔧 **Yönetici Paneli**

**Script Yönetimi:**
• /listscripts - Tüm scriptleri listele
• /addscript - Yeni script ekle
• /editscript <id> - Script düzenle
• /deletescript <id> - Script sil
• /togglescript <id> - Script aç/kapat

**İstatistikler:**
• /stats - Detaylı istatistikler

**Kullanıcı Yönetimi:**
• /addadmin <chat_id> - Yönetici ekle
• /removeadmin <chat_id> - Yönetici çıkar
• /broadcast <mesaj> - Toplu mesaj gönder

**Hızlı İstatistikler:**
📥 Toplam İndirme: ${database.stats.totalDownloads}
👥 Toplam Kullanıcı: ${Object.keys(database.users).length}
📊 Toplam Script: ${Object.keys(database.vpnScripts).length}
✅ Aktif Script: ${activeScripts.length}
❌ Pasif Script: ${inactiveScripts.length}
    `;
    
    bot.sendMessage(chatId, adminMessage, { parse_mode: 'Markdown' });
});

// Script listesi komutu
bot.onText(/\/listscripts/, (msg) => {
    const chatId = msg.chat.id;
    
    if (!isAdmin(chatId)) {
        return bot.sendMessage(chatId, '❌ Bu komutu kullanma yetkiniz yok.');
    }
    
    const scripts = Object.entries(database.vpnScripts);
    if (scripts.length === 0) {
        return bot.sendMessage(chatId, '📝 Henüz hiç script eklenmemiş.');
    }
    
    let scriptList = '📝 **Mevcut Scriptler:**\n\n';
    scripts.forEach(([id, script]) => {
        const status = script.enabled ? '✅' : '❌';
        const downloads = script.downloads || 0;
        const createdAt = script.createdAt ? new Date(script.createdAt).toLocaleDateString('tr-TR') : 'Bilinmiyor';
        
        scriptList += `${status} **${id}** - ${script.name}\n`;
        scriptList += `📄 ${script.filename}\n`;
        scriptList += `📊 İndirme: ${downloads}\n`;
        scriptList += `📅 Oluşturulma: ${createdAt}\n\n`;
    });
    
    bot.sendMessage(chatId, scriptList, { parse_mode: 'Markdown' });
});

// Mesaj işleme (script ekleme/düzenleme için)
bot.on('message', (msg) => {
    const chatId = msg.chat.id;
    
    // Admin state kontrolü
    if (!database.adminStates || !database.adminStates[chatId]) {
        return;
    }
    
    const state = database.adminStates[chatId];
    
    if (state.action === 'adding_script') {
        handleScriptAdding(msg, state);
    } else if (state.action === 'editing_name') {
        handleNameEditing(msg, state);
    } else if (state.action === 'editing_file') {
        handleFileEditing(msg, state);
    } else if (state.action === 'editing_description') {
        handleDescriptionEditing(msg, state);
    } else if (state.action === 'editing_content') {
        handleContentEditing(msg, state);
    }
});

// Script ekleme işlemi
function handleScriptAdding(msg, state) {
    const chatId = msg.chat.id;
    const text = msg.text;
    
    if (state.step === 'id') {
        if (database.vpnScripts[text]) {
            bot.sendMessage(chatId, '❌ Bu ID zaten kullanılıyor. Başka bir ID deneyin:');
            return;
        }
        
        state.scriptId = text;
        state.step = 'name';
        bot.sendMessage(chatId, '📝 Script ismini gönderin:');
        
    } else if (state.step === 'name') {
        state.name = text;
        state.step = 'filename';
        bot.sendMessage(chatId, '📄 Dosya adını gönderin (herhangi bir uzantı kabul edilir, örn: script.conf, script.txt, script.json):');
        
    } else if (state.step === 'filename') {
        state.filename = text;
        state.step = 'description';
        bot.sendMessage(chatId, '📋 Script açıklamasını gönderin:');
        
    } else if (state.step === 'description') {
        state.description = text;
        state.step = 'content';
        bot.sendMessage(chatId, '📝 Script içeriğini gönderin:\n\n(İçerik çok uzunsa dosya olarak gönderebilirsiniz)');
        
    } else if (state.step === 'content') {
        // Script'i kaydet
        database.vpnScripts[state.scriptId] = {
            id: state.scriptId,
            name: state.name,
            description: state.description,
            content: text,
            filename: state.filename,
            enabled: true,
            downloads: 0,
            createdAt: new Date(),
            updatedAt: new Date()
        };
        
        updateScriptStats();
        delete database.adminStates[chatId];
        
        bot.sendMessage(chatId, `✅ Script **${state.scriptId}** başarıyla eklendi!\n\n📝 İsim: ${state.name}\n📄 Dosya: ${state.filename}\n📋 Açıklama: ${state.description}`, { parse_mode: 'Markdown' });
    }
}

// İsim düzenleme işlemi
function handleNameEditing(msg, state) {
    const chatId = msg.chat.id;
    const text = msg.text;
    
    database.vpnScripts[state.scriptId].name = text;
    database.vpnScripts[state.scriptId].updatedAt = new Date();
    delete database.adminStates[chatId];
    
    bot.sendMessage(chatId, `✅ Script ismi **${text}** olarak güncellendi!`, { parse_mode: 'Markdown' });
}

// Dosya adı düzenleme işlemi
function handleFileEditing(msg, state) {
    const chatId = msg.chat.id;
    const text = msg.text;
    
    database.vpnScripts[state.scriptId].filename = text;
    database.vpnScripts[state.scriptId].updatedAt = new Date();
    delete database.adminStates[chatId];
    
    bot.sendMessage(chatId, `✅ Dosya adı **${text}** olarak güncellendi!`, { parse_mode: 'Markdown' });
}

// Açıklama düzenleme işlemi
function handleDescriptionEditing(msg, state) {
    const chatId = msg.chat.id;
    const text = msg.text;
    
    database.vpnScripts[state.scriptId].description = text;
    database.vpnScripts[state.scriptId].updatedAt = new Date();
    delete database.adminStates[chatId];
    
    bot.sendMessage(chatId, `✅ Script açıklaması **${text}** olarak güncellendi!`, { parse_mode: 'Markdown' });
}

// İçerik düzenleme işlemi
function handleContentEditing(msg, state) {
    const chatId = msg.chat.id;
    const text = msg.text;
    
    database.vpnScripts[state.scriptId].content = text;
    database.vpnScripts[state.scriptId].updatedAt = new Date();
    delete database.adminStates[chatId];
    
    bot.sendMessage(chatId, `✅ Script içeriği güncellendi!`, { parse_mode: 'Markdown' });
}

// Callback query'leri işle
bot.on('callback_query', (query) => {
    const chatId = query.message.chat.id;
    const data = query.data;
    
    if (data === 'stats') {
        const activeScripts = Object.values(database.vpnScripts).filter(s => s.enabled);
        const inactiveScripts = Object.values(database.vpnScripts).filter(s => !s.enabled);
        
        const statsMessage = `
📊 **VPN Script Hub İstatistikleri**

📥 **Genel İstatistikler:**
• Toplam İndirme: ${database.stats.totalDownloads}
• Toplam Kullanıcı: ${Object.keys(database.users).length}
• Toplam Script: ${Object.keys(database.vpnScripts).length}
• Aktif Script: ${activeScripts.length}
• Pasif Script: ${inactiveScripts.length}

📈 **Script Bazında İndirmeler:**
${Object.entries(database.vpnScripts)
    .sort((a, b) => (b[1].downloads || 0) - (a[1].downloads || 0))
    .map(([id, script]) => 
        `• ${script.name} (${id}): ${script.downloads || 0} indirme ${script.enabled ? '✅' : '❌'}`
    ).join('\n')}

👥 **Son 5 Kullanıcı:**
${Object.entries(database.users)
    .sort((a, b) => new Date(b[1].lastDownload || 0) - new Date(a[1].lastDownload || 0))
    .slice(0, 5)
    .map(([userId, user]) => `• ID: ${userId} - ${user.downloads} indirme`)
    .join('\n')}
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
    } else if (data.startsWith('delete_script_')) {
        const scriptId = data.replace('delete_script_', '');
        
        if (!isAdmin(chatId)) {
            bot.answerCallbackQuery(query.id, { text: '❌ Yetkiniz yok!' });
            return;
        }
        
        if (database.vpnScripts[scriptId]) {
            const scriptName = database.vpnScripts[scriptId].name;
            const downloads = database.vpnScripts[scriptId].downloads || 0;
            
            delete database.vpnScripts[scriptId];
            updateScriptStats();
            
            bot.editMessageText(`✅ Script **${scriptName}** (${scriptId}) silindi.\n\n📊 ${downloads} indirme kaydı da silindi.`, {
                chat_id: chatId,
                message_id: query.message.message_id,
                parse_mode: 'Markdown'
            });
        } else {
            bot.answerCallbackQuery(query.id, { text: '❌ Script bulunamadı!' });
        }
    } else if (data === 'cancel_delete') {
        bot.editMessageText('❌ Script silme işlemi iptal edildi.', {
            chat_id: chatId,
            message_id: query.message.message_id
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
        const scriptId = data.script;
        updateStats(scriptId);
        
        // Kullanıcı istatistiklerini güncelle
        if (!database.users[chatId]) {
            database.users[chatId] = { downloads: 0, firstSeen: new Date() };
        }
        database.users[chatId].downloads++;
        database.users[chatId].lastDownload = new Date();
        
        const script = database.vpnScripts[scriptId];
        const thankYouMessage = `
✅ **Script başarıyla indirildi!**

📁 Script: ${script ? script.name : scriptId}
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

// Script ekleme komutu
bot.onText(/\/addscript/, (msg) => {
    const chatId = msg.chat.id;
    
    if (!isAdmin(chatId)) {
        return bot.sendMessage(chatId, '❌ Bu komutu kullanma yetkiniz yok.');
    }
    
    // Kullanıcıdan script bilgilerini almak için state başlat
    if (!database.adminStates) database.adminStates = {};
    database.adminStates[chatId] = { action: 'adding_script', step: 'id' };
    
    const message = `
📝 **Yeni Script Ekleme**

Lütfen script ID'sini gönderin (örn: wireguard, openvpn, shadowsocks):
`;
    
    bot.sendMessage(chatId, message, { parse_mode: 'Markdown' });
});

// Script düzenleme komutu
bot.onText(/\/editscript (.+)/, (msg, match) => {
    const chatId = msg.chat.id;
    const scriptId = match[1];
    
    if (!isAdmin(chatId)) {
        return bot.sendMessage(chatId, '❌ Bu komutu kullanma yetkiniz yok.');
    }
    
    if (!database.vpnScripts[scriptId]) {
        return bot.sendMessage(chatId, '❌ Script bulunamadı.');
    }
    
    const script = database.vpnScripts[scriptId];
    const message = `
✏️ **Script Düzenleme: ${scriptId}**

**Mevcut Bilgiler:**
• İsim: ${script.name}
• Dosya: ${script.filename}
• Durum: ${script.enabled ? '✅ Aktif' : '❌ Pasif'}
• İndirme: ${script.downloads || 0}

**Düzenleme Seçenekleri:**
• /editname ${scriptId} - İsim değiştir
• /editfile ${scriptId} - Dosya adı değiştir
• /editcontent ${scriptId} - İçerik değiştir
• /editdesc ${scriptId} - Açıklama değiştir
• /togglescript ${scriptId} - Durum değiştir
`;
    
    bot.sendMessage(chatId, message, { parse_mode: 'Markdown' });
});

// Script silme komutu
bot.onText(/\/deletescript (.+)/, (msg, match) => {
    const chatId = msg.chat.id;
    const scriptId = match[1];
    
    if (!isAdmin(chatId)) {
        return bot.sendMessage(chatId, '❌ Bu komutu kullanma yetkiniz yok.');
    }
    
    if (!database.vpnScripts[scriptId]) {
        return bot.sendMessage(chatId, '❌ Script bulunamadı.');
    }
    
    const script = database.vpnScripts[scriptId];
    const keyboard = {
        inline_keyboard: [
            [{
                text: '✅ Evet, Sil',
                callback_data: `delete_script_${scriptId}`
            }],
            [{
                text: '❌ İptal',
                callback_data: 'cancel_delete'
            }]
        ]
    };
    
    const message = `
🗑️ **Script Silme Onayı**

**Script:** ${script.name} (${scriptId})
**Dosya:** ${script.filename}
**İndirme:** ${script.downloads || 0}

⚠️ Bu işlem geri alınamaz!
`;
    
    bot.sendMessage(chatId, message, {
        parse_mode: 'Markdown',
        reply_markup: keyboard
    });
});

// Script durum değiştirme komutu
bot.onText(/\/togglescript (.+)/, (msg, match) => {
    const chatId = msg.chat.id;
    const scriptId = match[1];
    
    if (!isAdmin(chatId)) {
        return bot.sendMessage(chatId, '❌ Bu komutu kullanma yetkiniz yok.');
    }
    
    if (!database.vpnScripts[scriptId]) {
        return bot.sendMessage(chatId, '❌ Script bulunamadı.');
    }
    
    database.vpnScripts[scriptId].enabled = !database.vpnScripts[scriptId].enabled;
    database.vpnScripts[scriptId].updatedAt = new Date();
    
    updateScriptStats();
    
    const status = database.vpnScripts[scriptId].enabled ? '✅ etkinleştirildi' : '❌ devre dışı bırakıldı';
    
    bot.sendMessage(chatId, `🔄 Script **${scriptId}** ${status}.`, { parse_mode: 'Markdown' });
});

// İsim düzenleme komutu
bot.onText(/\/editname (.+)/, (msg, match) => {
    const chatId = msg.chat.id;
    const scriptId = match[1];
    
    if (!isAdmin(chatId)) {
        return bot.sendMessage(chatId, '❌ Bu komutu kullanma yetkiniz yok.');
    }
    
    if (!database.vpnScripts[scriptId]) {
        return bot.sendMessage(chatId, '❌ Script bulunamadı.');
    }
    
    if (!database.adminStates) database.adminStates = {};
    database.adminStates[chatId] = { action: 'editing_name', scriptId: scriptId };
    
    bot.sendMessage(chatId, `✏️ **${scriptId}** scriptinin yeni ismini gönderin:`);
});

// Dosya adı düzenleme komutu
bot.onText(/\/editfile (.+)/, (msg, match) => {
    const chatId = msg.chat.id;
    const scriptId = match[1];
    
    if (!isAdmin(chatId)) {
        return bot.sendMessage(chatId, '❌ Bu komutu kullanma yetkiniz yok.');
    }
    
    if (!database.vpnScripts[scriptId]) {
        return bot.sendMessage(chatId, '❌ Script bulunamadı.');
    }
    
    if (!database.adminStates) database.adminStates = {};
    database.adminStates[chatId] = { action: 'editing_file', scriptId: scriptId };
    
    bot.sendMessage(chatId, `✏️ **${scriptId}** scriptinin yeni dosya adını gönderin:`);
});

// Açıklama düzenleme komutu
bot.onText(/\/editdesc (.+)/, (msg, match) => {
    const chatId = msg.chat.id;
    const scriptId = match[1];
    
    if (!isAdmin(chatId)) {
        return bot.sendMessage(chatId, '❌ Bu komutu kullanma yetkiniz yok.');
    }
    
    if (!database.vpnScripts[scriptId]) {
        return bot.sendMessage(chatId, '❌ Script bulunamadı.');
    }
    
    if (!database.adminStates) database.adminStates = {};
    database.adminStates[chatId] = { action: 'editing_description', scriptId: scriptId };
    
    bot.sendMessage(chatId, `✏️ **${scriptId}** scriptinin yeni açıklamasını gönderin:`);
});

// İçerik düzenleme komutu
bot.onText(/\/editcontent (.+)/, (msg, match) => {
    const chatId = msg.chat.id;
    const scriptId = match[1];
    
    if (!isAdmin(chatId)) {
        return bot.sendMessage(chatId, '❌ Bu komutu kullanma yetkiniz yok.');
    }
    
    if (!database.vpnScripts[scriptId]) {
        return bot.sendMessage(chatId, '❌ Script bulunamadı.');
    }
    
    if (!database.adminStates) database.adminStates = {};
    database.adminStates[chatId] = { action: 'editing_content', scriptId: scriptId };
    
    bot.sendMessage(chatId, `✏️ **${scriptId}** scriptinin yeni içeriğini gönderin:\n\n(İçerik çok uzunsa dosya olarak gönderebilirsiniz)`);
});

bot.onText(/\/stats/, (msg) => {
    const chatId = msg.chat.id;
    
    if (!isAdmin(chatId)) {
        return bot.sendMessage(chatId, '❌ Bu komutu kullanma yetkiniz yok.');
    }
    
    const activeScripts = Object.values(database.vpnScripts).filter(s => s.enabled);
    const inactiveScripts = Object.values(database.vpnScripts).filter(s => !s.enabled);
    
    const statsMessage = `
📊 **Detaylı İstatistikler**

**Genel:**
• Toplam İndirme: ${database.stats.totalDownloads}
• Aktif Kullanıcı: ${Object.keys(database.users).length}
• Toplam Script: ${Object.keys(database.vpnScripts).length}
• Aktif Script: ${activeScripts.length}
• Pasif Script: ${inactiveScripts.length}
• Son Güncelleme: ${database.stats.lastUpdated.toLocaleString('tr-TR')}

**Script Bazında (İndirme Sırasına Göre):**
${Object.entries(database.vpnScripts)
    .sort((a, b) => (b[1].downloads || 0) - (a[1].downloads || 0))
    .map(([id, script]) => {
        const status = script.enabled ? '✅' : '❌';
        const createdAt = script.createdAt ? new Date(script.createdAt).toLocaleDateString('tr-TR') : 'Bilinmiyor';
        const updatedAt = script.updatedAt ? new Date(script.updatedAt).toLocaleDateString('tr-TR') : 'Bilinmiyor';
        
        return `• ${script.name} (${id}): ${script.downloads || 0} indirme ${status}\n  📅 Oluşturulma: ${createdAt}\n  📝 Güncelleme: ${updatedAt}`;
    }).join('\n\n')}

**Son 10 Kullanıcı:**
${Object.entries(database.users)
    .sort((a, b) => new Date(b[1].lastDownload || 0) - new Date(a[1].lastDownload || 0))
    .slice(0, 10)
    .map(([userId, user]) => {
        const firstSeen = user.firstSeen ? new Date(user.firstSeen).toLocaleDateString('tr-TR') : 'Bilinmiyor';
        const lastDownload = user.lastDownload ? new Date(user.lastDownload).toLocaleDateString('tr-TR') : 'Hiç indirme yok';
        
        return `• ID: ${userId} - ${user.downloads} indirme\n  📅 İlk görülme: ${firstSeen}\n  📥 Son indirme: ${lastDownload}`;
    }).join('\n\n')}
    `;
    
    bot.sendMessage(chatId, statsMessage, { parse_mode: 'Markdown' });
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