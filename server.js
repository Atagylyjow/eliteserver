require('dotenv').config();
const express = require('express');
const { MongoClient, ObjectId } = require('mongodb');
const TelegramBot = require('node-telegram-bot-api');
const cors = require('cors');
const path = require('path');
const fs = require('fs');
const multer = require('multer');
const os = require('os');

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

// Botu tekrar aktif hale getir
const token = '8085540897:AAGsrwwYw0Ql01qMOetB3NAZXaLm9-IZiQI';
const bot = new TelegramBot(token, { polling: true });

bot.on('polling_error', (error) => {
    log('error', 'Bot polling error', { error: error.message });
});

// Web App URL (güncel URL'nizi buraya yazın)
const WEB_APP_URL = 'https://tg-web-app-fg41.onrender.com/';

bot.onText(/\/start/, (msg) => {
    const chatId = msg.chat.id;
    const opts = {
        reply_markup: {
            inline_keyboard: [
                [
                    { text: '🌐 Web App\'a Git', web_app: { url: WEB_APP_URL } }
                ],
                [
                    { text: '🆔 ID Öğren', callback_data: 'get_id' }
                ]
            ]
        }
    };
    bot.sendMessage(chatId, 'Hoş geldin! 👋\n\nAşağıdaki butonları kullanabilirsin:', opts);
});

bot.on('callback_query', (query) => {
    const chatId = query.message.chat.id;
    if (query.data === 'get_id') {
        bot.answerCallbackQuery(query.id, { text: `ID: ${chatId}` });
        bot.sendMessage(chatId, `Telegram ID'niz: <code>${chatId}</code>`, { parse_mode: 'HTML' });
    }
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
const adminAuth = (req, res, next) => { next(); } // Admin kontrolü devre dışı

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
        const scripts = scriptsArray.reduce((acc, script) => {
            acc[script._id.toString()] = script; // ID'yi string'e çevir
            return acc;
        }, {});

        log('info', 'Scripts requested', { scriptCount: scriptsArray.length });
        res.json(scripts);
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
        log('info', 'Users returned to admin', { totalUsers: usersArray.length, adminId: req.query.adminId });
        res.json({ success: true, users });
    } catch (error) {
        log('error', 'Failed to get users for admin', { error: error.message });
        res.status(500).json({ success: false, error: 'Kullanıcılar alınamadı' });
    }
});

// Kullanıcı coin'lerini getir
app.get('/api/user/:userId/coins', async (req, res) => {
    const { userId } = req.params;
    debug('Get user coins API called', { userId, ip: req.ip });
    try {
        const user = await db.collection('users').findOne({ _id: userId });
        res.json({ success: true, coins: user?.coins || 0 });
    } catch (error) {
        res.status(500).json({ success: false, error: 'Coin sorgulanamadı' });
    }
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
        const currentCoins = user?.coins || 0;
        if (currentCoins < amount) {
            return res.status(400).json({ success: false, error: 'Yetersiz coin' });
        }
        await db.collection('users').updateOne({ _id: userId }, { $inc: { coins: -amount } });
        const updatedUser = await db.collection('users').findOne({ _id: userId });
        log('info', 'Coins deducted from user', { userId, amount, remaining: updatedUser.coins });
        res.json({ success: true, coins: updatedUser.coins });
    } catch (error) {
        res.status(500).json({ success: false, error: 'Coin düşülürken hata oluştu' });
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
        if (!user?.coins) {
            return res.status(400).json({ success: false, error: 'Coin bulunamadı' });
        }
        if (user.coins < amount) {
            return res.status(400).json({ success: false, error: 'Yetersiz coin' });
        }
        await db.collection('users').updateOne({ _id: userId }, { $inc: { coins: -amount } });
        const updatedUser = await db.collection('users').findOne({ _id: userId });
        log('info', 'Coins used by user', { userId, amount, remaining: updatedUser.coins });
        res.json({ success: true, coins: updatedUser.coins });
    } catch (error) {
        res.status(500).json({ success: false, error: 'Coin kullanılırken hata oluştu' });
    }
});

// Yönetici API'leri
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

app.post('/api/admin/scripts/update', adminAuth, multer().none(), async (req, res) => {
    try {
        // Multer ile dosya yüklemesi varsa req.file üzerinden alınır
        const { id, name, description, filename } = req.body;
        if (!id || !name || !description || !filename) {
            return res.status(400).json({ error: 'Tüm alanlar gerekli' });
        }
        if (!ObjectId.isValid(id)) {
            return res.status(400).json({ error: 'Geçersiz Script ID' });
        }
        // Script'i bul
        const script = await db.collection('vpnScripts').findOne({ _id: new ObjectId(id) });
        if (!script) {
            return res.status(404).json({ error: 'Script bulunamadı' });
        }
        let updateData = {
            name,
            description,
            filename
        };
        // Eğer yeni dosya yüklendiyse, içeriği güncelle
        if (req.body.content) {
            updateData.content = req.body.content;
        }
        // Script'i güncelle
        await db.collection('vpnScripts').updateOne(
            { _id: new ObjectId(id) },
            { $set: updateData }
        );
        log('info', 'Script updated by admin', { scriptId: id });
        res.json({ success: true, message: 'Script başarıyla güncellendi' });
    } catch (error) {
        log('error', 'Script update error', { error: error.message });
        res.status(500).json({ error: 'Script güncellenemedi' });
    }
});

app.post('/api/admin/toggle-script', async (req, res) => {
    const { adminId, scriptId } = req.body;
    debug('Admin toggle script API called', { adminId, scriptId, ip: req.ip });
    if (!await isAdmin(adminId)) {
        log('warn', 'Unauthorized admin access attempt', { adminId, ip: req.ip });
        return res.status(403).json({ success: false, error: 'Yönetici izni gerekli' });
    }
    try {
        const script = await db.collection('vpnScripts').findOne({ _id: new ObjectId(scriptId) });
        if (script) {
            const oldStatus = script.enabled;
            const newStatus = !oldStatus;
            await db.collection('vpnScripts').updateOne({ _id: new ObjectId(scriptId) }, { $set: { enabled: newStatus } });
            log('info', 'Script toggled by admin', { adminId, scriptId, oldStatus, newStatus });
            res.json({ success: true, message: `Script ${newStatus ? 'etkinleştirildi' : 'devre dışı bırakıldı'}` });
        } else {
            log('warn', 'Script toggle failed - not found', { adminId, scriptId });
            res.status(404).json({ success: false, error: 'Script bulunamadı' });
        }
    } catch (error) {
        log('error', 'Script toggle error', { error: error.message });
        res.status(500).json({ success: false, error: 'Sunucu hatası: Script güncellenemedi' });
    }
});

app.post('/api/admin/delete-script', async (req, res) => {
    const { adminId, scriptId } = req.body;
    debug('Admin delete script API called', { adminId, scriptId, ip: req.ip });
    if (!await isAdmin(adminId)) {
        log('warn', 'Unauthorized admin access attempt', { adminId, ip: req.ip });
        return res.status(403).json({ success: false, error: 'Yönetici izni gerekli' });
    }
    try {
        const script = await db.collection('vpnScripts').findOne({ _id: new ObjectId(scriptId) });
        if (script) {
            await db.collection('vpnScripts').deleteOne({ _id: new ObjectId(scriptId) });
            log('info', 'Script deleted by admin', { adminId, scriptId, scriptName: script.name });
            res.json({ success: true, message: `Script "${script.name}" başarıyla silindi` });
        } else {
            log('warn', 'Script delete failed - not found', { adminId, scriptId });
            res.status(404).json({ success: false, error: 'Script bulunamadı' });
        }
    } catch (error) {
        log('error', 'Script delete error', { error: error.message });
        res.status(500).json({ success: false, error: 'Sunucu hatası: Script silinemedi' });
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

// API: Bot ile dosya gönder (MongoDB content üzerinden)
app.post('/api/send-file-to-user', async (req, res) => {
    const { userId, scriptId } = req.body;
    const COIN_PRICE = 5;
    const CHANNEL_USERNAME = '@smartvpnkeys';
    const CHANNEL_LINK = 'https://t.me/smartvpnkeys';
    try {
        // Kanal üyelik kontrolü
        try {
            const member = await bot.getChatMember(CHANNEL_USERNAME, userId);
            if (!member || ['left', 'kicked'].includes(member.status)) {
                return res.status(403).json({ error: 'Ilki kanala goşulmalysyň!', channel: CHANNEL_LINK });
            }
        } catch (err) {
            // Kullanıcı yoksa veya başka hata
            return res.status(403).json({ error: 'Ilki kanala goşulmalysyň!', channel: CHANNEL_LINK });
        }
        // Kullanıcıyı bul ve coin kontrolü yap
        const user = await db.collection('users').findOne({ _id: userId });
        if (!user || typeof user.coins !== 'number' || user.coins < COIN_PRICE) {
            const msg = 'Yetersiz coin!';
            console.error(`[send-file-to-user] ${msg} | userId: ${userId}`);
            log('error', '[send-file-to-user] ' + msg, { userId });
            return res.status(400).json({ error: msg });
        }
        // Coin düş
        await db.collection('users').updateOne({ _id: userId }, { $inc: { coins: -COIN_PRICE } });
        // Scripti bul
        const script = await db.collection('vpnScripts').findOne({ _id: new ObjectId(scriptId) });
        if (!script || !script.content) {
            const msg = 'Script veya içerik bulunamadı';
            console.error(`[send-file-to-user] ${msg} | scriptId: ${scriptId}`);
            log('error', '[send-file-to-user] ' + msg, { scriptId });
            return res.status(404).json({ error: msg });
        }
        const filename = script.filename || 'script.conf';
        const tempDir = os.tmpdir();
        const tempPath = path.join(tempDir, filename);
        try {
            fs.writeFileSync(tempPath, script.content, 'utf8');
            console.log(`[send-file-to-user] Dosya temp dizinine yazıldı: ${tempPath}`);
            log('info', '[send-file-to-user] Dosya temp dizinine yazıldı', { tempPath, userId, scriptId });
        } catch (err) {
            console.error(`[send-file-to-user] Dosya yazılamadı: ${err.message}`);
            log('error', '[send-file-to-user] Dosya yazılamadı', { error: err.message, tempPath });
            return res.status(500).json({ error: 'Dosya temp dizinine yazılamadı: ' + err.message });
        }
        try {
            await bot.sendDocument(userId, tempPath);
            console.log(`[send-file-to-user] Dosya Telegram'a gönderildi: ${filename}`);
            log('info', '[send-file-to-user] Dosya Telegram\'a gönderildi', { userId, filename });
        } catch (err) {
            console.error(`[send-file-to-user] Telegram'a gönderilemedi: ${err.message}`);
            log('error', '[send-file-to-user] Telegram\'a gönderilemedi', { error: err.message, userId, filename });
            return res.status(500).json({ error: 'Telegram\'a gönderilemedi: ' + err.message });
        }
        try {
            fs.unlinkSync(tempPath);
            console.log(`[send-file-to-user] Temp dosya silindi: ${tempPath}`);
            log('info', '[send-file-to-user] Temp dosya silindi', { tempPath });
        } catch (err) {
            console.warn(`[send-file-to-user] Temp dosya silinemedi: ${err.message}`);
            log('warn', '[send-file-to-user] Temp dosya silinemedi', { error: err.message, tempPath });
        }
        res.json({ success: true });
    } catch (error) {
        console.error(`[send-file-to-user] Genel hata: ${error.message}`);
        log('error', '[send-file-to-user] Genel hata', { error: error.message });
        res.status(500).json({ error: error.message });
    }
});

// Sunucuyu başlat
async function startServer() {
    await connectToDb();
    app.listen(PORT, () => {
        log('info', `🚀 VPN Script Hub Server başlatıldı!`, {
            port: PORT,
            botToken: `***${token.slice(-6)}`,
            webAppUrl: `https://tg-web-app-fg41.onrender.com/`,
            debugMode: DEBUG_MODE,
            logFile: LOG_FILE
        });
        console.log(`📡 Port: ${PORT}`);
        console.log(`🤖 Bot Token: ${token}`);
        console.log(`🌐 Web App URL: https://tg-web-app-fg41.onrender.com/`);
        console.log(`🔧 Debug Mode: ${DEBUG_MODE}`);
        console.log(`📝 Log File: ${LOG_FILE}`);
    });
}

startServer();

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