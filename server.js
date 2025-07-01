require('dotenv').config();
const express = require('express');
const { MongoClient, ObjectId } = require('mongodb');
const TelegramBot = require('node-telegram-bot-api');
const cors = require('cors');
const path = require('path');
const fs = require('fs');
const multer = require('multer');

// Debug ve loglama sistemi
const DEBUG_MODE = process.env.DEBUG === 'true' || process.env.NODE_ENV === 'development';
const LOG_FILE = 'app.log';

// --- MongoDB Bağlantısı ---
const dbUrl = process.env.DATABASE_URL;
let db;

async function connectToDb() {
    try {
        const client = new MongoClient(dbUrl);
        await client.connect();
        db = client.db();
        log('info', 'MongoDB veritabanına başarıyla bağlanıldı.');

        // Veritabanı koleksiyonlarının var olduğundan emin ol
        const collections = await db.listCollections().toArray();
        const collectionNames = collections.map(c => c.name);

        if (!collectionNames.includes('users')) {
            await db.createCollection('users');
            log('info', '`users` koleksiyonu oluşturuldu.');
        }
        if (!collectionNames.includes('vpnScripts')) {
            await db.createCollection('vpnScripts');
            log('info', '`vpnScripts` koleksiyonu oluşturuldu.');
        }
        if (!collectionNames.includes('stats')) {
            await db.createCollection('stats');
            // Başlangıç istatistiklerini ekle
            const stats = await db.collection('stats').findOne();
            if (!stats) {
                await db.collection('stats').insertOne({
                    totalDownloads: 0,
                    activeUsers: 0,
                    darktunnelDownloads: 0,
                    httpcustomDownloads: 0,
                    npvtunnelDownloads: 0,
                    shadowsocksDownloads: 0,
                    lastUpdated: new Date()
                });
                log('info', 'Başlangıç istatistikleri oluşturuldu.');
            }
        }
        if (!collectionNames.includes('admins')) {
            await db.createCollection('admins');
            const admin = await db.collection('admins').findOne({ chatId: 7749779502 });
            if (!admin) {
                await db.collection('admins').insertOne({ chatId: 7749779502, addedAt: new Date() });
                log('info', 'Varsayılan yönetici eklendi.');
            }
        }

        // Başlangıç scriptlerini ekle (eğer hiç script yoksa)
        const scriptCount = await db.collection('vpnScripts').countDocuments();
        if (scriptCount === 0) {
            log('info', 'Veritabanında hiç script bulunamadı. Varsayılan scriptler ekleniyor...');
            const defaultScripts = [
                { 
                    name: "DarkTunnel", 
                    type: "darktunnel", 
                    content: "DarkTunnel için varsayılan script içeriği. Lütfen düzenleyin.", 
                    filename: "darktunnel_default.conf", 
                    enabled: true, 
                    downloads: 0,
                    createdAt: new Date()
                },
                { 
                    name: "HTTP Custom", 
                    type: "httpcustom",
                    content: "HTTP Custom için varsayılan script içeriği. Lütfen düzenleyin.", 
                    filename: "httpcustom_default.hc", 
                    enabled: true, 
                    downloads: 0,
                    createdAt: new Date()
                },
                { 
                    name: "NPV Tunnel", 
                    type: "npvtunnel",
                    content: "NPV Tunnel için varsayılan script içeriği. Lütfen düzenleyin.", 
                    filename: "npvtunnel_default.npv4", 
                    enabled: true, 
                    downloads: 0,
                    createdAt: new Date()
                },
                { 
                    name: "ShadowSocks", 
                    type: "shadowsocks",
                    content: "ShadowSocks için varsayılan script içeriği. Lütfen düzenleyin.", 
                    filename: "shadowsocks_default.json", 
                    enabled: true, 
                    downloads: 0,
                    createdAt: new Date()
                }
            ];
            await db.collection('vpnScripts').insertMany(defaultScripts);
            log('info', '4 adet varsayılan script başarıyla eklendi.');
        }
    } catch (error) {
        log('error', 'MongoDB bağlantı hatası', { error: error.message });
        process.exit(1); // Hata durumunda uygulamayı sonlandır
    }
}
// ----------------------------

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
const token = '7762459827:AAFdwhXyMA34GEB-khfqJb_3OJCvaQwYUdM';

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
    origin: '*',
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
    // Headers'dan al (Öncelikli)
    if (req.headers && req.headers['x-user-id']) {
        return req.headers['x-user-id'].toString();
    }

    // Telegram WebApp'den user ID'yi al
    if (req.body && req.body.user && req.body.user.id) {
        return req.body.user.id.toString();
    }
    
    // Query parameter'dan al
    if (req.query && req.query.user_id) {
        return req.query.user_id.toString();
    }
    
    // IP adresini kullan (fallback)
    const ip = req.ip || req.connection.remoteAddress || 'unknown';
    return `ip_${ip.replace(/[^a-zA-Z0-9]/g, '')}`;
}

// Yönetici kontrolü
async function isAdmin(chatId) {
    const admin = await db.collection('admins').findOne({ chatId: parseInt(chatId, 10) });
    return !!admin;
}

// Admin kimlik doğrulama middleware'i
const adminAuth = async (req, res, next) => {
    const adminId = req.query.adminId || req.body.adminId;
    if (!adminId) {
        return res.status(401).json({ success: false, error: 'Admin ID gerekli' });
    }
    if (!(await isAdmin(adminId))) {
        return res.status(403).json({ success: false, error: 'Yetkisiz erişim' });
    }
    next();
};

// İstatistikleri güncelle
async function updateStats(scriptType) {
    const update = {
        $inc: { totalDownloads: 1 },
        $set: { lastUpdated: new Date() }
    };

    if (scriptType) {
        update.$inc[`${scriptType}Downloads`] = 1;
    }

    await db.collection('stats').updateOne({}, update, { upsert: true });
}

// API Routes
app.get('/api/stats', async (req, res) => {
    debug('Stats API called', { ip: req.ip });
    try {
        const totalUsers = await db.collection('users').countDocuments();
        const stats = await db.collection('stats').findOne();
        
        const finalStats = {
            ...stats,
            activeUsers: totalUsers, // Basitlik için toplam kullanıcıyı aktif sayıyoruz
            totalUsers: totalUsers,
        };

        log('info', 'Stats requested', finalStats);
        res.json(finalStats);
    } catch (error) {
         log('error', 'Stats API error', { error: error.message });
         res.status(500).json({ success: false, error: 'İstatistikler alınamadı.' });
    }
});

app.get('/api/scripts', async (req, res) => {
    debug('Scripts API called', { ip: req.ip });
    try {
        const scriptsArray = await db.collection('vpnScripts').find({}).toArray();
        res.json(scriptsArray);
    } catch (error) {
        log('error', 'Scripts API error', { error: error.message });
        res.status(500).json({ success: false, error: 'Scriptler alınamadı.' });
    }
});

app.get('/api/download/:scriptId', async (req, res) => {
    const { scriptId } = req.params;
    
    try {
        if (!ObjectId.isValid(scriptId)) {
            return res.status(400).json({ success: false, error: 'Geçersiz Script ID' });
        }

        const script = await db.collection('vpnScripts').findOne({ _id: new ObjectId(scriptId) });

        if (!script || !script.enabled) {
            log('warn', 'Script download failed - not found or disabled', { scriptId });
            return res.status(404).json({ success: false, error: 'Script bulunamadı veya devre dışı' });
        }
        
        await updateStats(script.name.toLowerCase().replace(' ', ''));
        
        log('info', 'Script downloaded', { scriptId, scriptName: script.name });
        
        res.setHeader('Content-Type', 'text/plain');
        res.setHeader('Content-Disposition', `attachment; filename="${script.filename}"`);
        res.setHeader('X-Filename', script.filename);
        res.send(script.content);
    } catch (error) {
        log('error', 'Download API error', { error: error.message, scriptId });
        res.status(500).json({ success: false, error: 'İndirme sırasında hata oluştu.' });
    }
});

// Admin Routes
app.get('/api/admin/users', adminAuth, async (req, res) => {
    try {
        log('info', 'Admin requested user list', { adminId: req.query.adminId });
        const usersArray = await db.collection('users').find({}).toArray();
        const users = usersArray.reduce((acc, user) => {
            acc[user._id.toString()] = user;
            return acc;
        }, {});
        res.json({ success: true, users });
    } catch (error) {
        log('error', 'Failed to get users for admin', { error: error.message });
        res.status(500).json({ success: false, error: 'Kullanıcılar alınamadı' });
    }
});

// Kullanıcı coin'lerini getir
app.get('/api/user/:userId/coins', (req, res) => {
    const { userId } = req.params;
    
    debug('Get user coins API called', { userId, ip: req.ip });
    
    const userData = getUserData(userId);
    
    res.json({ success: true, coins: userData.coins || 0 });
});

// Kullanıcıya coin ekle (genel)
app.post('/api/user/add-coins', async (req, res) => {
    const userId = getUserId(req);
    const { amount } = req.body;

    debug('Add coins API called', { userId, amount, ip: req.ip });

    if (userId === 'anonymous' || !amount || amount <= 0) {
        return res.status(400).json({ success: false, error: 'Geçerli kullanıcı ID ve miktar gerekli' });
    }

    try {
        const result = await db.collection('users').updateOne(
            { _id: userId },
            { 
                $inc: { coins: amount },
                $setOnInsert: { firstSeen: new Date() }
            },
            { upsert: true }
        );

        const updatedUser = await db.collection('users').findOne({ _id: userId });

        log('info', 'Coins added to user', { userId, amount, newTotal: updatedUser.coins });
        res.json({ success: true, coins: updatedUser.coins });
    } catch (error) {
        log('error', 'Add coins API error', { error: error.message });
        res.status(500).json({ success: false, error: 'Coin eklenirken hata oluştu' });
    }
});

// Kullanıcıdan coin çıkar
app.post('/api/user/:userId/deduct-coins', async (req, res) => {
    const { userId } = req.params;
    const { amount } = req.body;
    debug('Deduct coins API called', { userId, amount, ip: req.ip });
    if (!amount || amount <= 0) {
        return res.status(400).json({ success: false, error: 'Geçerli coin miktarı gerekli' });
    }
    try {
        const user = await db.collection('users').findOne({ _id: userId });
        if (!user || !user.coins || user.coins < amount) {
            return res.status(400).json({ success: false, error: 'Yetersiz coin' });
        }
        await db.collection('users').updateOne(
            { _id: userId },
            { $inc: { coins: -amount } }
        );
        const updatedUser = await db.collection('users').findOne({ _id: userId });
        log('info', 'Coins deducted from user', { userId, amount, remaining: updatedUser.coins });
        res.json({ success: true, coins: updatedUser.coins });
    } catch (error) {
        log('error', 'Deduct coins API error', { error: error.message });
        res.status(500).json({ success: false, error: 'Coin çıkarılırken hata oluştu' });
    }
});

// Kullanıcı coin kullan (satın alma için)
app.post('/api/user/:userId/use-coins', async (req, res) => {
    const { userId } = req.params;
    const { amount } = req.body;
    debug('Use coins API called', { userId, amount, ip: req.ip });
    if (!amount || amount <= 0) {
        return res.status(400).json({ success: false, error: 'Geçerli coin miktarı gerekli' });
    }
    try {
        const user = await db.collection('users').findOne({ _id: userId });
        if (!user || !user.coins || user.coins < amount) {
            return res.status(400).json({ success: false, error: 'Yetersiz coin' });
        }
        await db.collection('users').updateOne(
            { _id: userId },
            { $inc: { coins: -amount } }
        );
        const updatedUser = await db.collection('users').findOne({ _id: userId });
        log('info', 'Coins used by user', { userId, amount, remaining: updatedUser.coins });
        res.json({ success: true, coins: updatedUser.coins });
    } catch (error) {
        log('error', 'Use coins API error', { error: error.message });
        res.status(500).json({ success: false, error: 'Coin kullanılırken hata oluştu' });
    }
});

// Script ekleme (admin)
app.post('/api/admin/add-script', adminAuth, async (req, res) => {
    const { scriptData } = req.body;
    debug('Admin add script API called', { scriptData, ip: req.ip });
    try {
        const newScript = {
            name: scriptData.name,
            description: scriptData.description,
            content: scriptData.content,
            filename: scriptData.filename,
            enabled: true,
            createdAt: new Date()
        };
        const result = await db.collection('vpnScripts').insertOne(newScript);
        log('info', 'Script added by admin', { adminId: req.body.adminId, scriptId: result.insertedId });
        res.json({ success: true, message: 'Script başarıyla eklendi', scriptId: result.insertedId });
    } catch (error) {
        log('error', 'Admin add script API error', { error: error.message });
        res.status(500).json({ success: false, error: 'Sunucu hatası: Script eklenemedi' });
    }
});

// Script güncelleme (admin)
app.put('/api/admin/scripts/:id', adminAuth, async (req, res) => {
    const { id } = req.params;
    const { name, description, content, filename } = req.body;
    try {
        const updateData = { name, description, content, filename };
        const result = await db.collection('vpnScripts').updateOne({ _id: new ObjectId(id) }, { $set: updateData });
        if (result.matchedCount === 0) return res.status(404).json({ success: false, error: 'Script bulunamadı.' });
        log('info', 'Script güncellendi', { adminId: req.body.adminId, scriptId: id });
        res.json({ success: true, message: 'Script başarıyla güncellendi.' });
    } catch (error) {
        log('error', 'Admin script güncelleme hatası', { error: error.message });
        res.status(500).json({ success: false, error: 'Script güncellenirken bir hata oluştu.' });
    }
});

// Script silme (admin)
app.delete('/api/admin/scripts/:id', adminAuth, async (req, res) => {
    const { id } = req.params;
    try {
        const result = await db.collection('vpnScripts').deleteOne({ _id: new ObjectId(id) });
        if (result.deletedCount === 0) return res.status(404).json({ success: false, error: 'Script bulunamadı.' });
        log('info', 'Script silindi', { adminId: req.body.adminId, scriptId: id });
        res.json({ success: true, message: 'Script başarıyla silindi.' });
    } catch (error) {
        log('error', 'Admin script silme hatası', { error: error.message });
        res.status(500).json({ success: false, error: 'Script silinirken bir hata oluştu.' });
    }
});

// Admin coin ekleme API
app.post('/api/admin/add-coins', adminAuth, async (req, res) => {
    const { userId, amount } = req.body;

    if (!userId || !amount || amount <= 0) {
        return res.status(400).json({ success: false, error: 'Kullanıcı ID ve miktar gerekli' });
    }

    try {
        const userToUpdate = await db.collection('users').findOne({ _id: userId });

        if (!userToUpdate) {
            return res.status(404).json({ success: false, error: 'Kullanıcı bulunamadı' });
        }

        const result = await db.collection('users').updateOne(
            { _id: userId },
            { $inc: { coins: parseInt(amount, 10) } }
        );
        
        const updatedUser = await db.collection('users').findOne({ _id: userId });

        log('info', 'Admin added coins to user', { adminId: req.body.adminId, userId, amount });
        res.json({ success: true, newBalance: updatedUser.coins });

    } catch (error) {
        log('error', 'Admin add coins API error', { error: error.message });
        res.status(500).json({ success: false, error: 'Sunucu hatası: Coin eklenemedi' });
    }
});

// Admin ekleme
app.post('/api/admin/add-admin', adminAuth, async (req, res) => {
    const { chatId } = req.body;
    if (!chatId) return res.status(400).json({ success: false, error: 'chatId gerekli' });
    try {
        const existing = await db.collection('admins').findOne({ chatId: parseInt(chatId, 10) });
        if (existing) return res.status(400).json({ success: false, error: 'Admin zaten mevcut' });
        await db.collection('admins').insertOne({ chatId: parseInt(chatId, 10), addedAt: new Date() });
        res.json({ success: true, message: 'Admin başarıyla eklendi' });
    } catch (error) {
        res.status(500).json({ success: false, error: 'Admin eklenemedi' });
    }
});

// Admin çıkarma
app.post('/api/admin/remove-admin', adminAuth, async (req, res) => {
    const { chatId } = req.body;
    if (!chatId) return res.status(400).json({ success: false, error: 'chatId gerekli' });
    try {
        const result = await db.collection('admins').deleteOne({ chatId: parseInt(chatId, 10) });
        if (result.deletedCount === 0) return res.status(404).json({ success: false, error: 'Admin bulunamadı' });
        res.json({ success: true, message: 'Admin başarıyla silindi' });
    } catch (error) {
        res.status(500).json({ success: false, error: 'Admin silinemedi' });
    }
});

// Bot komutlarında admin kontrolü ve işlemler
bot.onText(/\/admin/, async (msg) => {
    const chatId = msg.chat.id;
    const isAdminUser = await isAdmin(chatId);
    if (!isAdminUser) {
        return bot.sendMessage(chatId, '❌ Bu komutu kullanma yetkiniz yok.');
    }
    // Admin paneli mesajı
    const adminMessage = `🔧 *Yönetici Paneli*\n\nKomutlar:\n/addadmin <chat_id> - Admin ekle\n/removeadmin <chat_id> - Admin çıkar\n/listscripts - Scriptleri listele\n/stats - İstatistikler`;
    bot.sendMessage(chatId, adminMessage, { parse_mode: 'Markdown' });
});

// /addadmin komutu
bot.onText(/\/addadmin (\d+)/, async (msg, match) => {
    const chatId = msg.chat.id;
    const isAdminUser = await isAdmin(chatId);
    if (!isAdminUser) return bot.sendMessage(chatId, '❌ Yetkiniz yok.');
    const newAdminId = parseInt(match[1], 10);
    const existing = await db.collection('admins').findOne({ chatId: newAdminId });
    if (existing) return bot.sendMessage(chatId, 'Bu kişi zaten admin.');
    await db.collection('admins').insertOne({ chatId: newAdminId, addedAt: new Date() });
    bot.sendMessage(chatId, `✅ ${newAdminId} admin olarak eklendi.`);
});

// /removeadmin komutu
bot.onText(/\/removeadmin (\d+)/, async (msg, match) => {
    const chatId = msg.chat.id;
    const isAdminUser = await isAdmin(chatId);
    if (!isAdminUser) return bot.sendMessage(chatId, '❌ Yetkiniz yok.');
    const removeId = parseInt(match[1], 10);
    const result = await db.collection('admins').deleteOne({ chatId: removeId });
    if (result.deletedCount === 0) return bot.sendMessage(chatId, 'Admin bulunamadı.');
    bot.sendMessage(chatId, `✅ ${removeId} adminlikten çıkarıldı.`);
});

// /listscripts komutu (scriptleri listeler)
bot.onText(/\/listscripts/, async (msg) => {
    const chatId = msg.chat.id;
    const isAdminUser = await isAdmin(chatId);
    if (!isAdminUser) return bot.sendMessage(chatId, '❌ Yetkiniz yok.');
    const scripts = await db.collection('vpnScripts').find({}).toArray();
    if (scripts.length === 0) {
        return bot.sendMessage(chatId, '📝 Henüz hiç script eklenmemiş.');
    }
    let scriptList = '📝 **Mevcut Scriptler:**\n\n';
    scripts.forEach((script) => {
        const status = script.enabled ? '✅' : '❌';
        scriptList += `${status} ${script.name}\n📄 ${script.filename}\n📊 İndirme: ${script.downloads || 0}\n\n`;
    });
    bot.sendMessage(chatId, scriptList, { parse_mode: 'Markdown' });
});

// /stats komutu (istatistikleri listeler)
bot.onText(/\/stats/, async (msg) => {
    const chatId = msg.chat.id;
    const isAdminUser = await isAdmin(chatId);
    if (!isAdminUser) return bot.sendMessage(chatId, '❌ Yetkiniz yok.');
    const stats = await db.collection('stats').findOne({});
    const totalUsers = await db.collection('users').countDocuments();
    const totalScripts = await db.collection('vpnScripts').countDocuments();
    let statsMessage = `📊 *Detaylı İstatistikler*\n\n`;
    statsMessage += `• Toplam İndirme: ${stats?.totalDownloads || 0}\n`;
    statsMessage += `• Aktif Kullanıcı: ${totalUsers}\n`;
    statsMessage += `• Script Sayısı: ${totalScripts}\n`;
    statsMessage += `• Son Güncelleme: ${stats?.lastUpdated ? new Date(stats.lastUpdated).toLocaleString('tr-TR') : '-'}\n`;
    bot.sendMessage(chatId, statsMessage, { parse_mode: 'Markdown' });
});

web_app: { url: `https://tg-web-app-fg41.onrender.com/` }
webAppUrl: `https://tg-web-app-fg41.onrender.com/`,
console.log(`🌐 Web App URL: https://tg-web-app-fg41.onrender.com/`);