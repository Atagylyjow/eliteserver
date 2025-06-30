const express = require('express');
const TelegramBot = require('node-telegram-bot-api');
const cors = require('cors');
const path = require('path');
const fs = require('fs');
const multer = require('multer');

// Debug ve loglama sistemi
const DEBUG_MODE = process.env.DEBUG === 'true' || process.env.NODE_ENV === 'development';
const LOG_FILE = 'app.log';

// --- Kalıcı Veritabanı Sistemi ---
const DB_FILE = path.join(__dirname, 'db.json');

// Multer configuration for file uploads
const upload = multer({
    dest: 'uploads/',
    limits: {
        fileSize: 1024 * 1024 // 1MB limit
    }
});

// Loglama fonksiyonu
function log(level, message, data = null) {
    const timestamp = new Date().toISOString();
    const logEntry = {
        timestamp,
        level,
        message,
        data
    };
    
    const logString = `[${timestamp}] ${level.toUpperCase()}: ${message}${data ? ` | Data: ${JSON.stringify(data)}` : ''}`;
    
    // Console'a yazdır
    if (DEBUG_MODE || level === 'error') {
        console.log(logString);
    }
    
    // Dosyaya yazdır
    try {
        fs.appendFileSync(LOG_FILE, logString + '\n');
    } catch (error) {
        console.error('Log dosyasına yazma hatası:', error);
    }
}

// Debug fonksiyonu
function debug(message, data = null) {
    if (DEBUG_MODE) {
        log('debug', message, data);
    }
}

// Error handling middleware
function errorHandler(err, req, res, next) {
    log('error', 'Express error handler', {
        error: err.message,
        stack: err.stack,
        url: req.url,
        method: req.method,
        ip: req.ip
    });
    
    res.status(500).json({
        success: false,
        error: DEBUG_MODE ? err.message : 'Internal server error'
    });
}

const app = express();
const PORT = process.env.PORT || 3000;

// Bot token'ınızı buraya yazın
const token = '7762459827:AAFFQRGpSphgUqw2MHhMngCMQeBHZLHrHCo';

// Bot oluştur
const bot = new TelegramBot(token, { polling: true });

// Bot event handlers
bot.on('polling_error', (error) => {
    log('error', 'Bot polling error', { error: error.message });
});

bot.on('error', (error) => {
    log('error', 'Bot error', { error: error.message });
});

// Middleware
app.use(cors({
    origin: [
        'http://localhost:3000',
        'http://127.0.0.1:3000',
        'https://atagylyjow.github.io',
        'https://helpful-tar-lodge.glitch.me'
    ],
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'X-User-ID']
}));
app.use(express.json());
app.use(express.static('.'));
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// Request logging middleware
app.use((req, res, next) => {
    debug('Incoming request', {
        method: req.method,
        url: req.url,
        ip: req.ip,
        userAgent: req.get('User-Agent')
    });
    next();
});

// --- Kalıcı Veritabanı Sistemi ---
let database = {
    stats: {
        totalDownloads: 0,
        activeUsers: 0,
        darktunnelDownloads: 0,
        httpcustomDownloads: 0,
        npvtunnelDownloads: 0,
        shadowsocksDownloads: 0,
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
        },
        npvtunnel: {
            name: 'NPV Tunnel',
            description: 'Gelişmiş tünel teknolojisi ile hızlı ve güvenli bağlantı',
            content: `# NPV Tunnel Configuration
# Server: npv-tunnel.example.com
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
Server = npv-tunnel.example.com
Port = 443
Method = aes-256-gcm
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
            filename: 'npvtunnel.conf',
            enabled: true
        },
        shadowsocks: {
            name: 'Shadowsocks',
            description: 'Güvenli proxy protokolü ile şifreli bağlantı',
            content: `# Shadowsocks Configuration
# Server: ss-server.example.com
# Port: 8388
# Method: aes-256-gcm
# Password: your_password_here

{
  "server": "ss-server.example.com",
  "server_port": 8388,
  "password": "your_password_here",
  "method": "aes-256-gcm",
  "timeout": 300,
  "fast_open": false,
  "reuse_port": true,
  "local_address": "127.0.0.1",
  "local_port": 1080,
  "mode": "tcp_and_udp"
}`,
            filename: 'shadowsocks.json',
            enabled: true,
            showConfig: true
        }
    }
};

function readDatabase() {
    try {
        if (fs.existsSync(DB_FILE)) {
            const data = fs.readFileSync(DB_FILE, 'utf-8');
            database = JSON.parse(data);
            log('info', 'Veritabanı dosyadan başarıyla okundu.');
        } else {
            fs.writeFileSync(DB_FILE, JSON.stringify(database, null, 2));
            log('info', 'Yeni veritabanı dosyası oluşturuldu.');
        }
    } catch (error) {
        log('error', 'Veritabanı okunurken hata oluştu.', { error: error.message });
    }
}

function writeDatabase() {
    try {
        fs.writeFileSync(DB_FILE, JSON.stringify(database, null, 2));
        debug('Veritabanı dosyaya başarıyla yazıldı.');
    } catch (error) {
        log('error', 'Veritabanı yazılırken hata oluştu.', { error: error.message });
    }
}
// --- Veritabanı Sistemi Sonu ---

// Kullanıcı ID'lerini normalize et
function normalizeUserId(userId) {
    if (!userId) {
        return 'anonymous';
    }
    // String'e çevir ve temizle, başka bir işlem yapma
    return userId.toString().trim();
}

// Request'ten user ID'yi al
function getUserId(req) {
    // Telegram WebApp'den user ID'yi al
    if (req.body && req.body.user && req.body.user.id) {
        return req.body.user.id.toString();
    }
    
    // Query parameter'dan al
    if (req.query && req.query.user_id) {
        return req.query.user_id.toString();
    }
    
    // Headers'dan al
    if (req.headers && req.headers['x-user-id']) {
        return req.headers['x-user-id'].toString();
    }
    
    // IP adresini kullan (fallback)
    const ip = req.ip || req.connection.remoteAddress || 'unknown';
    return `ip_${ip.replace(/[^a-zA-Z0-9]/g, '')}`;
}

// Kullanıcı verilerini al veya oluştur
function getUserData(userId) {
    const normalizedId = normalizeUserId(userId);
    
    if (!database.users[normalizedId]) {
        database.users[normalizedId] = {
            downloads: 0,
            firstSeen: new Date().toISOString(),
            coins: 0,
            originalId: userId,
            normalizedId: normalizedId
        };
    }
    
    return database.users[normalizedId];
}

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
    } else if (scriptType === 'npvtunnel') {
        database.stats.npvtunnelDownloads++;
    } else if (scriptType === 'shadowsocks') {
        database.stats.shadowsocksDownloads++;
    }
    database.stats.lastUpdated = new Date();
}

// API Routes
app.get('/api/stats', (req, res) => {
    debug('Stats API called', { ip: req.ip });
    
    // Aktif kullanıcı sayısını güncelle
    database.stats.activeUsers = Object.keys(database.users).length;
    
    // Toplam kullanıcı sayısı - unique user ID sayısı
    database.stats.totalUsers = Object.keys(database.users).length;
    
    log('info', 'Stats requested', { 
        totalDownloads: database.stats.totalDownloads,
        activeUsers: database.stats.activeUsers,
        totalUsers: database.stats.totalUsers
    });
    
    res.json(database.stats);
});

app.get('/api/scripts', (req, res) => {
    debug('Scripts API called', { ip: req.ip });
    
    const scripts = Object.keys(database.vpnScripts);
    log('info', 'Scripts requested', { 
        scriptCount: scripts.length,
        scripts: scripts
    });
    
    res.json(database.vpnScripts);
});

app.get('/api/download/:scriptId', (req, res) => {
    const { scriptId } = req.params;
    const userId = getUserId(req);
    
    debug('Download API called', { scriptId, userId, ip: req.ip });
    
    if (!database.vpnScripts[scriptId] || !database.vpnScripts[scriptId].enabled) {
        log('warn', 'Script download failed - not found or disabled', { scriptId, userId });
        return res.status(404).json({ success: false, error: 'Script bulunamadı veya devre dışı' });
    }
    
    const script = database.vpnScripts[scriptId];
    const userData = getUserData(userId);
    
    // Kullanıcı istatistiklerini güncelle
    userData.downloads++;
    userData.lastDownload = new Date().toISOString();
    
    // Genel istatistikleri güncelle
    updateStats(scriptId);
    
    // Veritabanını kaydet
    writeDatabase();
    
    log('info', 'Script downloaded', { scriptId, userId, scriptName: script.name });
    
    // Script içeriğini döndür
    res.setHeader('Content-Type', 'text/plain');
    res.setHeader('Content-Disposition', `attachment; filename="${script.filename}"`);
    res.setHeader('X-Filename', script.filename);
    res.send(script.content);
});

// Kullanıcı coin'lerini getir
app.get('/api/user/:userId/coins', (req, res) => {
    const { userId } = req.params;
    
    debug('Get user coins API called', { userId, ip: req.ip });
    
    const userData = getUserData(userId);
    
    res.json({ success: true, coins: userData.coins || 0 });
});

// Kullanıcıya coin ekle
app.post('/api/user/:userId/add-coins', (req, res) => {
    const { userId } = req.params;
    const { amount } = req.body;
    
    debug('Add coins API called', { userId, amount, ip: req.ip });
    
    if (!amount || amount <= 0) {
        return res.status(400).json({ success: false, error: 'Geçerli coin miktarı gerekli' });
    }
    
    const userData = getUserData(userId);
    userData.coins = (userData.coins || 0) + amount;
    
    // Veritabanını kaydet
    writeDatabase();
    
    log('info', 'Coins added to user', { userId, amount, newTotal: userData.coins });
    res.json({ success: true, coins: userData.coins });
});

// Kullanıcıdan coin çıkar
app.post('/api/user/:userId/deduct-coins', (req, res) => {
    const { userId } = req.params;
    const { amount } = req.body;
    
    debug('Deduct coins API called', { userId, amount, ip: req.ip });
    
    if (!amount || amount <= 0) {
        return res.status(400).json({ success: false, error: 'Geçerli coin miktarı gerekli' });
    }
    
    const userData = getUserData(userId);
    const currentCoins = userData.coins || 0;
    
    if (currentCoins < amount) {
        return res.status(400).json({ success: false, error: 'Yetersiz coin' });
    }
    
    userData.coins = currentCoins - amount;
    
    // Veritabanını kaydet
    writeDatabase();
    
    log('info', 'Coins deducted from user', { userId, amount, remaining: userData.coins });
    res.json({ success: true, coins: userData.coins });
});

// Kullanıcı coin kullan (satın alma için)
app.post('/api/user/:userId/use-coins', (req, res) => {
    const { userId } = req.params;
    const { amount } = req.body;
    
    debug('Use coins API called', { userId, amount, ip: req.ip });
    
    if (!amount || amount <= 0) {
        return res.status(400).json({ success: false, error: 'Geçerli coin miktarı gerekli' });
    }
    
    const userData = getUserData(userId);
    
    if (!userData.coins) {
        return res.status(400).json({ success: false, error: 'Coin bulunamadı' });
    }
    
    if (userData.coins < amount) {
        return res.status(400).json({ success: false, error: 'Yetersiz coin' });
    }
    
    userData.coins -= amount;
    
    // Veritabanını kaydet
    writeDatabase();
    
    log('info', 'Coins used by user', { userId, amount, remaining: userData.coins });
    
    res.json({
        success: true,
        coins: userData.coins
    });
});

// Yönetici API'leri
app.post('/api/admin/add-script', (req, res) => {
    const { adminId, scriptData } = req.body;
    
    debug('Admin add script API called', { adminId, scriptData, ip: req.ip });
    
    if (!isAdmin(adminId)) {
        log('warn', 'Unauthorized admin access attempt', { adminId, ip: req.ip });
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
    
    writeDatabase(); // Değişiklikleri kaydet
    
    log('info', 'Script added by admin', { adminId, scriptId: id, scriptName: name });
    
    res.json({ success: true, message: 'Script başarıyla eklendi' });
});

// File upload API endpoint
app.post('/api/admin/upload-script', upload.single('scriptFile'), (req, res) => {
    const { adminId, scriptId, scriptName, scriptDescription } = req.body;
    
    debug('Admin upload script API called', { adminId, scriptId, scriptName, ip: req.ip });
    
    if (!isAdmin(parseInt(adminId))) {
        log('warn', 'Unauthorized admin access attempt', { adminId, ip: req.ip });
        return res.status(403).json({ success: false, error: 'Yönetici izni gerekli' });
    }
    
    if (!req.file) {
        return res.status(400).json({ success: false, error: 'Dosya yüklenmedi' });
    }
    
    try {
        // Read the uploaded file content
        const fileContent = fs.readFileSync(req.file.path, 'utf8');
        
        // Add script to database
        database.vpnScripts[scriptId] = {
            name: scriptName,
            description: scriptDescription,
            content: fileContent,
            filename: req.file.originalname,
            enabled: true
        };
        
        writeDatabase(); // Değişiklikleri kaydet
        
        log('info', 'Script file uploaded by admin', { 
            adminId, 
            scriptId, 
            scriptName, 
            filename: req.file.originalname,
            fileSize: req.file.size 
        });
        
        res.json({ 
            success: true, 
            message: 'Script dosyası başarıyla yüklendi',
            filename: req.file.originalname
        });
        
    } catch (error) {
        log('error', 'File upload processing error', { error: error.message, adminId, scriptId });
        res.status(500).json({ success: false, error: 'Dosya işlenirken hata oluştu' });
    }
});

app.post('/api/admin/scripts/update', upload.single('file'), (req, res) => {
    try {
        const { id, name, description, filename } = req.body;
        
        if (!id || !name || !description || !filename) {
            return res.status(400).json({ error: 'Tüm alanlar gerekli' });
        }
        
        // Script'i bul
        if (!database.vpnScripts[id]) {
            return res.status(404).json({ error: 'Script bulunamadı' });
        }
        
        const script = database.vpnScripts[id];
        
        // Eğer yeni dosya yüklendiyse
        if (req.file) {
            // Eski dosyayı sil (eğer varsa)
            if (script.filename && script.filename !== req.file.originalname) {
                const oldFilePath = path.join(__dirname, 'uploads', script.filename);
                if (fs.existsSync(oldFilePath)) {
                    fs.unlinkSync(oldFilePath);
                }
            }
            
            // Yeni dosya içeriğini oku
            const newContent = fs.readFileSync(req.file.path, 'utf8');
            
            // Script'i güncelle
            database.vpnScripts[id] = {
                ...script,
                name,
                description,
                filename: req.file.originalname,
                content: newContent
            };
        } else {
            // Sadece metin alanlarını güncelle
            database.vpnScripts[id] = {
                ...script,
                name,
                description,
                filename
            };
        }
        
        // Veritabanını kaydet
        writeDatabase();
        
        res.json({ success: true, message: 'Script başarıyla güncellendi' });
    } catch (error) {
        console.error('Script güncelleme hatası:', error);
        res.status(500).json({ error: 'Script güncellenemedi' });
    }
});

app.post('/api/admin/toggle-script', (req, res) => {
    const { adminId, scriptId } = req.body;
    
    debug('Admin toggle script API called', { adminId, scriptId, ip: req.ip });
    
    if (!isAdmin(adminId)) {
        log('warn', 'Unauthorized admin access attempt', { adminId, ip: req.ip });
        return res.status(403).json({ success: false, error: 'Yönetici izni gerekli' });
    }
    
    if (database.vpnScripts[scriptId]) {
        const oldStatus = database.vpnScripts[scriptId].enabled;
        database.vpnScripts[scriptId].enabled = !database.vpnScripts[scriptId].enabled;
        const newStatus = database.vpnScripts[scriptId].enabled;
        
        writeDatabase(); // Değişiklikleri kaydet
        
        log('info', 'Script toggled by admin', { 
            adminId, 
            scriptId, 
            oldStatus, 
            newStatus 
        });
        
        res.json({ 
            success: true, 
            message: `Script ${newStatus ? 'etkinleştirildi' : 'devre dışı bırakıldı'}` 
        });
    } else {
        log('warn', 'Script toggle failed - not found', { adminId, scriptId });
        res.status(404).json({ success: false, error: 'Script bulunamadı' });
    }
});

app.post('/api/admin/delete-script', (req, res) => {
    const { adminId, scriptId } = req.body;
    
    debug('Admin delete script API called', { adminId, scriptId, ip: req.ip });
    
    if (!isAdmin(adminId)) {
        log('warn', 'Unauthorized admin access attempt', { adminId, ip: req.ip });
        return res.status(403).json({ success: false, error: 'Yönetici izni gerekli' });
    }
    
    if (database.vpnScripts[scriptId]) {
        const scriptName = database.vpnScripts[scriptId].name;
        delete database.vpnScripts[scriptId];
        
        writeDatabase(); // Değişiklikleri kaydet
        
        log('info', 'Script deleted by admin', { adminId, scriptId, scriptName });
        
        res.json({ 
            success: true, 
            message: `Script "${scriptName}" başarıyla silindi` 
        });
    } else {
        log('warn', 'Script delete failed - not found', { adminId, scriptId });
        res.status(404).json({ success: false, error: 'Script bulunamadı' });
    }
});

app.get('/api/admin/users', (req, res) => {
    const { adminId } = req.query;
    
    debug('Admin users API called', { adminId, ip: req.ip });
    
    if (!isAdmin(parseInt(adminId))) {
        log('warn', 'Unauthorized admin access attempt', { adminId, ip: req.ip });
        return res.status(403).json({ success: false, error: 'Yönetici izni gerekli' });
    }
    
    log('info', 'Users data requested by admin', { 
        adminId, 
        userCount: Object.keys(database.users).length 
    });
    
    res.json({ success: true, users: database.users });
});

// Admin coin ekleme API
app.post('/api/admin/add-coins', (req, res) => {
    const { adminId, userId, amount, reason } = req.body;
    
    debug('Admin add coins API called', { adminId, userId, amount, reason, ip: req.ip });
    
    if (!isAdmin(parseInt(adminId))) {
        log('warn', 'Unauthorized admin access attempt', { adminId, ip: req.ip });
        return res.status(403).json({ success: false, error: 'Yönetici izni gerekli' });
    }
    
    if (!userId || !amount || amount <= 0) {
        return res.status(400).json({ success: false, error: 'Geçerli kullanıcı ID ve coin miktarı gerekli' });
    }
    
    let userData = null;
    let targetUserId = null;

    // Find user by various methods to ensure backward compatibility
    // Method 1: Direct ID match (for new, non-hashed IDs)
    if (database.users[userId]) {
        userData = database.users[userId];
        targetUserId = userId;
    } 
    // Method 2: Normalized ID match (for old, hashed IDs)
    else {
        const normalizedId = normalizeUserId(userId);
        if (database.users[normalizedId]) {
            userData = database.users[normalizedId];
            targetUserId = normalizedId;
        }
        // Method 3: Search by originalId (catch-all)
        else {
            const foundUserEntry = Object.entries(database.users).find(
                ([key, user]) => user.originalId === userId
            );
            if (foundUserEntry) {
                targetUserId = foundUserEntry[0];
                userData = foundUserEntry[1];
            }
        }
    }
    
    if (!userData) {
        log('warn', 'Admin add coins failed - user not found', { adminId, userId });
        return res.status(404).json({ success: false, error: `Kullanıcı bulunamadı: ${userId}` });
    }
    
    // Coin ekle
    const oldCoins = userData.coins || 0;
    userData.coins = oldCoins + amount;
    
    // Veritabanını kaydet
    writeDatabase();
    
    log('info', 'Coins added by admin', { 
        adminId, 
        targetUserId: targetUserId,
        originalIdAttempt: userId,
        amount, 
        reason,
        oldCoins,
        newCoins: userData.coins
    });
    
    res.json({ 
        success: true, 
        message: `${amount} coin başarıyla eklendi`,
        username: userData.originalId || targetUserId, // Display a useful identifier
        userCoins: userData.coins
    });
});

// Broadcast message API
app.post('/api/admin/broadcast', (req, res) => {
    // ... existing code ...
});

// Bot komutları
bot.onText(/\/start/, (msg) => {
    const chatId = msg.chat.id;
    const welcomeMessage = `
👋 *VPN Script Hub Bot'a Hoş Geldiniz!*

Bu bot ile güvenli VPN script dosyalarını elde edebilirsiniz.

*Kullanılabilir Komutlar:*
/help - Yardım menüsünü gösterir
/list - Mevcut tüm VPN scriptlerini listeler

*Web Uygulaması:*
Aşağıdaki butona tıklayarak web uygulamasına erişebilirsiniz.
`;

    const keyboard = {
        inline_keyboard: [
            [{
                text: '🚀 Web Uygulamasını Aç',
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
📊 Script Sayısı: ${Object.keys(database.vpnScripts).length}
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
        scriptList += `${status} **${id}** - ${script.name}\n`;
        scriptList += `📄 ${script.filename}\n`;
        scriptList += `📊 İndirme: ${script.downloads || 0}\n\n`;
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
            name: state.name,
            description: state.description,
            content: text,
            filename: state.filename,
            enabled: true,
            downloads: 0,
            createdAt: new Date()
        };
        
        delete database.adminStates[chatId];
        
        bot.sendMessage(chatId, `✅ Script **${state.scriptId}** başarıyla eklendi!`, { parse_mode: 'Markdown' });
    }
}

// İsim düzenleme işlemi
function handleNameEditing(msg, state) {
    const chatId = msg.chat.id;
    const text = msg.text;
    
    database.vpnScripts[state.scriptId].name = text;
    delete database.adminStates[chatId];
    
    bot.sendMessage(chatId, `✅ Script ismi **${text}** olarak güncellendi!`, { parse_mode: 'Markdown' });
}

// Dosya adı düzenleme işlemi
function handleFileEditing(msg, state) {
    const chatId = msg.chat.id;
    const text = msg.text;
    
    database.vpnScripts[state.scriptId].filename = text;
    delete database.adminStates[chatId];
    
    bot.sendMessage(chatId, `✅ Dosya adı **${text}** olarak güncellendi!`, { parse_mode: 'Markdown' });
}

// İçerik düzenleme işlemi
function handleContentEditing(msg, state) {
    const chatId = msg.chat.id;
    const text = msg.text;
    
    database.vpnScripts[state.scriptId].content = text;
    delete database.adminStates[chatId];
    
    bot.sendMessage(chatId, `✅ Script içeriği güncellendi!`, { parse_mode: 'Markdown' });
}

// Callback query'leri işle
bot.on('callback_query', (query) => {
    const chatId = query.message.chat.id;
    const data = query.data;
    
    if (data === 'stats') {
        const statsMessage = `
📊 **VPN Script Hub İstatistikleri**

📥 **Toplam İndirmeler:**
• Genel: ${database.stats.totalDownloads}
• Script Sayısı: ${Object.keys(database.vpnScripts).length}

👥 **Kullanıcılar:**
• Toplam: ${Object.keys(database.users).length}
• Aktif: ${Object.keys(database.users).length}

📈 **Script Bazında:**
${Object.entries(database.vpnScripts).map(([id, script]) => 
    `• ${script.name}: ${script.downloads || 0} indirme`
).join('\n')}
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
3. İndirin ve kurun

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
            delete database.vpnScripts[scriptId];
            
            bot.editMessageText(`✅ Script **${scriptName}** (${scriptId}) silindi.`, {
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
        updateStats(data.script);
        
        // Kullanıcı istatistiklerini güncelle
        if (!database.users[chatId]) {
            database.users[chatId] = { downloads: 0, firstSeen: new Date() };
        }
        database.users[chatId].downloads++;
        database.users[chatId].lastDownload = new Date();
        
        const thankYouMessage = `
✅ **Script başarıyla indirildi!**

📁 Script: ${data.script === 'darktunnel' ? 'DarkTunnel' : data.script === 'npvtunnel' ? 'NPV Tunnel' : 'Shadowsocks'}
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

Lütfen script ID'sini gönderin (örn: wireguard, openvpn):
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

**Düzenleme Seçenekleri:**
• /editname ${scriptId} - İsim değiştir
• /editfile ${scriptId} - Dosya adı değiştir
• /editcontent ${scriptId} - İçerik değiştir
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
    
    const statsMessage = `
📊 **Detaylı İstatistikler**

**Genel:**
• Toplam İndirme: ${database.stats.totalDownloads}
• Aktif Kullanıcı: ${Object.keys(database.users).length}
• Script Sayısı: ${Object.keys(database.vpnScripts).length}
• Son Güncelleme: ${database.stats.lastUpdated.toLocaleString('tr-TR')}

**Script Bazında:**
${Object.entries(database.vpnScripts).map(([id, script]) => 
    `• ${script.name} (${id}): ${script.downloads || 0} indirme - ${script.enabled ? '✅' : '❌'}`
).join('\n')}

**Son 10 Kullanıcı:**
${Object.entries(database.users)
    .sort((a, b) => new Date(b[1].lastDownload) - new Date(a[1].lastDownload))
    .slice(0, 10)
    .map(([userId, user]) => `• ID: ${userId} - ${user.downloads} indirme`)
    .join('\n')}
    `;
    
    bot.sendMessage(chatId, statsMessage, { parse_mode: 'Markdown' });
});

// Sunucuyu başlat
app.listen(PORT, () => {
    readDatabase(); // Sunucu başlarken veritabanını oku
    log('info', `🚀 VPN Script Hub Server başlatıldı!`, {
        port: PORT,
        botToken: `***${token.slice(-6)}`,
        webAppUrl: `https://atagylyjow.github.io/TG-Web-App/`,
        debugMode: DEBUG_MODE,
        logFile: LOG_FILE
    });
    console.log(`📡 Port: ${PORT}`);
    console.log(`🤖 Bot Token: ${token}`);
    console.log(`🌐 Web App URL: https://atagylyjow.github.io/TG-Web-App/`);
    console.log(`🔧 Debug Mode: ${DEBUG_MODE}`);
    console.log(`📝 Log File: ${LOG_FILE}`);
});

// Error handling middleware'i ekle
app.use(errorHandler);

// Hata yakalama
process.on('uncaughtException', (error) => {
    log('error', 'Uncaught Exception', {
        error: error.message,
        stack: error.stack
    });
    console.error('Uncaught Exception:', error);
});

process.on('unhandledRejection', (reason, promise) => {
    log('error', 'Unhandled Rejection', {
        reason: reason,
        promise: promise
    });
    console.error('Unhandled Rejection at:', promise, 'reason:', reason);
});

// Graceful shutdown
process.on('SIGTERM', () => {
    log('info', 'SIGTERM received, shutting down gracefully');
    process.exit(0);
});

process.on('SIGINT', () => {
    log('info', 'SIGINT received, shutting down gracefully');
    process.exit(0);
}); 