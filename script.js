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

        // Gerekli koleksiyonların varlığını kontrol et ve oluştur
        const collections = await db.listCollections().toArray();
        const collectionNames = collections.map(c => c.name);

        const requiredCollections = ['users', 'vpnScripts', 'stats', 'admins', 'settings'];
        for (const coll of requiredCollections) {
            if (!collectionNames.includes(coll)) {
                await db.createCollection(coll);
                log('info', `'${coll}' koleksiyonu oluşturuldu.`);
            }
        }
        
        // Varsayılan admini ekle
        const admin = await db.collection('admins').findOne({ chatId: 7749779502 });
        if (!admin) {
            await db.collection('admins').insertOne({ chatId: 7749779502, addedAt: new Date() });
            log('info', 'Varsayılan yönetici eklendi.');
        }

        // Varsayılan istatistikleri ekle
        const stats = await db.collection('stats').findOne();
        if (!stats) {
            await db.collection('stats').insertOne({ totalDownloads: 0, lastUpdated: new Date() });
            log('info', 'Başlangıç istatistikleri oluşturuldu.');
        }
        
        // Varsayılan reklam ayarlarını ekle
        const adSettings = await db.collection('settings').findOne({ type: 'ads' });
        if (!adSettings) {
            await db.collection('settings').insertOne({
                type: 'ads',
                frequency: 10,
                capping: '30 dakika',
                interval: '3 dakika',
                timeout: '10 saniye',
                updatedAt: new Date()
            });
            log('info', 'Varsayılan reklam ayarları oluşturuldu.');
        }

    } catch (error) {
        log('error', 'MongoDB bağlantı hatası', { error: error.message });
        process.exit(1);
    }
}
// ----------------------------

const upload = multer({ dest: 'uploads/', limits: { fileSize: 5 * 1024 * 1024 } });

function log(level, message, data = null) {
    const timestamp = new Date().toISOString();
    const logString = `[${timestamp}] ${level.toUpperCase()}: ${message}${data ? ` | Data: ${JSON.stringify(data)}` : ''}\n`;
    if (DEBUG_MODE || level === 'error') {
        console.log(logString.trim());
    }
    try {
        fs.appendFileSync(LOG_FILE, logString);
    } catch (error) {
        console.error('Log dosyasına yazma hatası:', error);
    }
}

const app = express();
const PORT = process.env.PORT || 3000;
const token = process.env.TELEGRAM_BOT_TOKEN || '7762459827:AAFdwhXyMA34GEB-khfqJb_3OJCvaQwYUdM';
const bot = new TelegramBot(token, { polling: true });

app.use(cors({
    origin: '*',
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'X-User-ID']
}));
app.use(express.json());
app.use(express.static('.'));
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

async function isAdmin(chatId) {
    if (!chatId) return false;
    const admin = await db.collection('admins').findOne({ chatId: parseInt(chatId, 10) });
    return !!admin;
}

const adminAuth = async (req, res, next) => {
    const adminId = req.body.adminId || req.query.adminId || req.headers['x-user-id'];
    if (!adminId || !(await isAdmin(adminId))) {
        log('warn', 'Yetkisiz erişim denemesi', { adminId, ip: req.ip });
        return res.status(403).json({ success: false, error: 'Yetkisiz erişim' });
    }
    req.adminId = adminId;
    next();
};

// --- GENEL API ROTALARI ---

app.get('/api/settings/ads', async (req, res) => {
    try {
        const adSettings = await db.collection('settings').findOne({ type: 'ads' });
        res.json(adSettings || {});
    } catch (error) {
         log('error', 'Reklam ayarları API hatası', { error: error.message });
         res.status(500).json({ success: false, error: 'Reklam ayarları alınamadı.' });
    }
});

app.get('/api/stats', async (req, res) => {
    try {
        const totalUsers = await db.collection('users').countDocuments();
        const totalScripts = await db.collection('vpnScripts').countDocuments();
        const stats = await db.collection('stats').findOne() || { totalDownloads: 0 };
        res.json({ ...stats, totalUsers, totalScripts });
    } catch (error) {
         log('error', 'İstatistik API hatası', { error: error.message });
         res.status(500).json({ success: false, error: 'İstatistikler alınamadı.' });
    }
});

app.get('/api/scripts', async (req, res) => {
    try {
        const scripts = await db.collection('vpnScripts').find().toArray();
        res.json(scripts);
    } catch (error) {
        log('error', 'Script listeleme API hatası', { error: error.message });
        res.status(500).json({ success: false, error: 'Scriptler alınamadı.' });
    }
});

app.get('/api/download/:scriptId', async (req, res) => {
    const { scriptId } = req.params;
    try {
        if (!ObjectId.isValid(scriptId)) {
            return res.status(400).send('Geçersiz Script ID');
        }
        const script = await db.collection('vpnScripts').findOne({ _id: new ObjectId(scriptId) });
        if (!script) {
            return res.status(404).send('Script bulunamadı');
        }
        await db.collection('vpnScripts').updateOne({ _id: new ObjectId(scriptId) }, { $inc: { downloads: 1 } });
        await db.collection('stats').updateOne({}, { $inc: { totalDownloads: 1 } }, { upsert: true });
        res.setHeader('Content-Type', 'text/plain');
        res.setHeader('Content-Disposition', `attachment; filename="${script.filename || script.name + '.txt'}"`);
        res.send(script.content);
    } catch (error) {
        log('error', 'İndirme API hatası', { error: error.message, scriptId });
        res.status(500).send('İndirme sırasında bir hata oluştu.');
    }
});

// --- YÖNETİCİ API ROTALARI ---

app.get('/api/admin/users', adminAuth, async (req, res) => {
    try {
        const users = await db.collection('users').find().sort({ joinDate: -1 }).toArray();
        res.json(users);
    } catch (error) {
        log('error', 'Admin kullanıcı listeleme hatası', { error: error.message });
        res.status(500).json({ success: false, error: 'Kullanıcılar alınamadı.' });
    }
});

app.post('/api/admin/add-coins', adminAuth, async (req, res) => {
    const { userId, amount } = req.body;
    if (!userId || !amount) {
        return res.status(400).json({ success: false, error: 'Kullanıcı ID ve miktar gerekli.' });
    }
    try {
        const result = await db.collection('users').updateOne({ userId: userId.toString() }, { $inc: { coins: parseInt(amount, 10) } });
        if (result.matchedCount === 0) return res.status(404).json({ success: false, error: 'Kullanıcı bulunamadı.' });
        res.json({ success: true, message: `${amount} jeton başarıyla eklendi.` });
    } catch (error) {
        log('error', 'Admin jeton ekleme hatası', { error: error.message });
        res.status(500).json({ success: false, error: 'Jeton eklenirken bir hata oluştu.' });
    }
});

app.post('/api/admin/scripts', adminAuth, async (req, res) => {
    try {
        const { name, description, content, filename } = req.body;
        if (!name || !content || !filename) {
            return res.status(400).json({ success: false, error: 'İsim, içerik ve dosya adı zorunludur.' });
        }
        const newScript = { name, description, content, filename, enabled: true, downloads: 0, createdAt: new Date() };
        await db.collection('vpnScripts').insertOne(newScript);
        log('info', 'Yeni script eklendi', { adminId: req.adminId, name });
        res.status(201).json({ success: true, message: 'Script başarıyla eklendi.' });
    } catch (error) {
        log('error', 'Admin script ekleme hatası', { error: error.message });
        res.status(500).json({ success: false, error: 'Script eklenirken bir hata oluştu.' });
    }
});

app.put('/api/admin/scripts/:id', adminAuth, async (req, res) => {
    const { id } = req.params;
    try {
        if (!ObjectId.isValid(id)) return res.status(400).json({ success: false, error: 'Geçersiz ID formatı.' });
        const { name, description, content, filename } = req.body;
        const updateData = { name, description, content, filename };
        const result = await db.collection('vpnScripts').updateOne({ _id: new ObjectId(id) }, { $set: updateData });
        if (result.matchedCount === 0) return res.status(404).json({ success: false, error: 'Script bulunamadı.' });
        log('info', 'Script güncellendi', { adminId: req.adminId, scriptId: id });
        res.json({ success: true, message: 'Script başarıyla güncellendi.' });
    } catch (error) {
        log('error', 'Admin script güncelleme hatası', { error: error.message });
        res.status(500).json({ success: false, error: 'Script güncellenirken bir hata oluştu.' });
    }
});

app.delete('/api/admin/scripts/:id', adminAuth, async (req, res) => {
    const { id } = req.params;
    try {
        if (!ObjectId.isValid(id)) return res.status(400).json({ success: false, error: 'Geçersiz ID formatı.' });
        const result = await db.collection('vpnScripts').deleteOne({ _id: new ObjectId(id) });
        if (result.deletedCount === 0) return res.status(404).json({ success: false, error: 'Script bulunamadı.' });
        log('info', 'Script silindi', { adminId: req.adminId, scriptId: id });
        res.json({ success: true, message: 'Script başarıyla silindi.' });
    } catch (error) {
        log('error', 'Admin script silme hatası', { error: error.message });
        res.status(500).json({ success: false, error: 'Script silinirken bir hata oluştu.' });
    }
});

app.post('/api/admin/scripts/toggle/:id', adminAuth, async (req, res) => {
    const { id } = req.params;
    try {
        if (!ObjectId.isValid(id)) return res.status(400).json({ success: false, error: 'Geçersiz ID formatı.' });
        const script = await db.collection('vpnScripts').findOne({ _id: new ObjectId(id) });
        if (!script) return res.status(404).json({ success: false, error: 'Script bulunamadı.' });
        const newStatus = !script.enabled;
        await db.collection('vpnScripts').updateOne({ _id: new ObjectId(id) }, { $set: { enabled: newStatus } });
        log('info', `Script durumu değiştirildi: ${newStatus}`, { adminId: req.adminId, scriptId: id });
        res.json({ success: true, message: `Script durumu ${newStatus ? 'aktif' : 'pasif'} olarak güncellendi.` });
    } catch (error) {
        log('error', 'Admin script durum değiştirme hatası', { error: error.message });
        res.status(500).json({ success: false, error: 'Script durumu değiştirilemedi.' });
    }
});


app.post('/api/admin/settings/ads', adminAuth, async (req, res) => {
    const { settings } = req.body;
    if (!settings) {
        return res.status(400).json({ success: false, error: 'Ayarlar gerekli.' });
    }
    try {
        await db.collection('settings').updateOne(
            { type: 'ads' },
            { $set: { ...settings, updatedAt: new Date() } },
            { upsert: true }
        );
        log('info', 'Reklam ayarları güncellendi', { adminId: req.adminId });
        res.json({ success: true, message: 'Reklam ayarları başarıyla güncellendi.' });
    } catch (error) {
        log('error', 'Admin reklam ayarları güncelleme hatası', { error: error.message });
        res.status(500).json({ success: false, error: 'Reklam ayarları güncellenemedi.' });
    }
});


// --- TELEGRAM BOT MANTIĞI ---

bot.onText(/\/start/, async (msg) => {
    const chatId = msg.chat.id;
    const userId = msg.from.id.toString();
    try {
        const user = await db.collection('users').findOne({ userId });
        if (!user) {
            await db.collection('users').insertOne({
                userId,
                username: msg.from.username,
                firstName: msg.from.first_name,
                coins: 1,
                joinDate: new Date(),
            });
        }
        const webAppUrl = `https://tg-web-app-fg41.onrender.com/?user_id=${userId}`;
        bot.sendMessage(chatId, `Merhaba ${msg.from.first_name}! Hoş Geldiniz.`, {
            reply_markup: {
                inline_keyboard: [[{ text: "🚀 Uygulamayı Aç", web_app: { url: webAppUrl } }]]
            }
        });
    } catch (error) {
        log('error', 'Start komutu hatası', { error: error.message });
    }
});

// Hata yakalama
bot.on('polling_error', (error) => log('error', 'Bot polling hatası', { code: error.code }));
app.use((err, req, res, next) => {
    log('error', 'Genel Express hata yönetimi', { message: err.message, stack: err.stack });
    res.status(500).send('Sunucuda bir hata oluştu!');
});
process.on('uncaughtException', (error) => log('error', 'Uncaught Exception', { message: error.message, stack: error.stack }));
process.on('unhandledRejection', (reason, promise) => log('error', 'Unhandled Rejection', { reason }));

// Sunucuyu başlat
async function startServer() {
    await connectToDb();
    app.listen(PORT, () => {
        log('info', `🚀 Sunucu ${PORT} portunda başlatıldı.`);
    });
}

startServer();