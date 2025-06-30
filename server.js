require('dotenv').config();
const express = require('express');
const { MongoClient, ObjectId } = require('mongodb');
const TelegramBot = require('node-telegram-bot-api');
const cors = require('cors');
const path = require('path');
const fs = require('fs');
const multer = require('multer');

// --- CONFIGURATION ---
const PORT = process.env.PORT || 3000;
const BOT_TOKEN = process.env.BOT_TOKEN || '7762459827:AAFFQRGpSphgUqw2MHhMngCMQeBHZLHrHCo'; 
const WEB_APP_URL = process.env.WEB_APP_URL || 'https://tg-web-app-1.onrender.com';
const ADMIN_TELEGRAM_ID = parseInt(process.env.ADMIN_TELEGRAM_ID || '7749779502', 10);
const DEBUG_MODE = process.env.NODE_ENV !== 'production';
const LOG_FILE = path.join(__dirname, 'app.log');

// --- DATABASE CONNECTION ---
const dbUrl = process.env.DATABASE_URL;
if (!dbUrl) {
    console.error("HATA: DATABASE_URL ortam değişkeni ayarlanmamış. Lütfen .env dosyanızı kontrol edin.");
    process.exit(1);
}
let db;

// --- UTILITIES ---
const log = (level, message, data = null) => {
    const timestamp = new Date().toISOString();
    const logString = `[${timestamp}] ${level.toUpperCase()}: ${message}${data ? ` | Data: ${JSON.stringify(data)}` : ''}`;
    console.log(logString);
    fs.appendFileSync(LOG_FILE, logString + '\n');
};

// --- INITIALIZATION ---
const app = express();
const bot = new TelegramBot(BOT_TOKEN, { polling: true });
const upload = multer({ dest: 'uploads/' });

async function connectToDb() {
    try {
        const client = new MongoClient(dbUrl);
        await client.connect();
        db = client.db();
        log('info', 'MongoDB veritabanına başarıyla bağlanıldı.');
        await setupDatabase();
    } catch (error) {
        log('error', 'MongoDB bağlantı hatası', { error: error.message });
        process.exit(1);
    }
}

async function setupDatabase() {
    const collections = await db.listCollections().toArray();
    const collectionNames = collections.map(c => c.name);

    const requiredCollections = ['users', 'vpnScripts', 'settings', 'admins'];
    for (const coll of requiredCollections) {
        if (!collectionNames.includes(coll)) {
            await db.createCollection(coll);
            log('info', `Koleksiyon oluşturuldu: ${coll}`);
        }
    }

    const adminCount = await db.collection('admins').countDocuments({ chatId: ADMIN_TELEGRAM_ID });
    if (adminCount === 0) {
        await db.collection('admins').insertOne({ chatId: ADMIN_TELEGRAM_ID, addedAt: new Date(), role: 'superadmin' });
        log('info', `Varsayılan süper yönetici eklendi: ${ADMIN_TELEGRAM_ID}`);
    }

    const adSettingsCount = await db.collection('settings').countDocuments({ type: 'ad_settings' });
    if (adSettingsCount === 0) {
        await db.collection('settings').insertOne({
            type: 'ad_settings',
            showAds: true,
            adFrequency: 3,
            lastUpdated: new Date()
        });
        log('info', 'Varsayılan reklam ayarları oluşturuldu.');
    }

    const scriptCount = await db.collection('vpnScripts').countDocuments();
    if (scriptCount === 0) {
        log('info', 'Veritabanında script bulunamadı, varsayılanlar ekleniyor...');
        const defaultScripts = [
            { name: "DarkTunnel", type: "darktunnel", content: "Bu scriptin içeriğini yönetici panelinden düzenleyebilirsiniz.", filename: "dark.conf", enabled: true, downloads: 0, createdAt: new Date() },
            { name: "HTTP Custom", type: "httpcustom", content: "Bu scriptin içeriğini yönetici panelinden düzenleyebilirsiniz.", filename: "http.hc", enabled: true, downloads: 0, createdAt: new Date() },
            { name: "NPV Tunnel", type: "npvtunnel", content: "Bu scriptin içeriğini yönetici panelinden düzenleyebilirsiniz.", filename: "npv.npv4", enabled: true, downloads: 0, createdAt: new Date() },
            { name: "ShadowSocks", type: "shadowsocks", content: "Bu scriptin içeriğini yönetici panelinden düzenleyebilirsiniz.", filename: "ss.json", enabled: true, downloads: 0, createdAt: new Date() }
        ];
        await db.collection('vpnScripts').insertMany(defaultScripts);
        log('info', '4 adet varsayılan script eklendi.');
    }
}

// --- MIDDLEWARE ---
app.use(cors({ origin: '*' }));
app.use(express.json());
app.use(express.static(path.join(__dirname)));

const adminAuth = async (req, res, next) => {
    const adminIdStr = req.headers['x-admin-id'];
    if (!adminIdStr) {
        return res.status(401).send({ success: false, message: 'Admin ID gerekli.' });
    }
    const adminId = parseInt(adminIdStr, 10);
    const admin = await db.collection('admins').findOne({ chatId: adminId });
    if (!admin) {
        return res.status(403).send({ success: false, message: 'Yetkisiz erişim.' });
    }
    req.adminId = adminId;
    next();
};

// --- PUBLIC API ROUTES ---

app.get('/api/config', async (req, res) => {
    try {
        const scripts = await db.collection('vpnScripts').find({ enabled: true }).toArray();
        const adSettings = await db.collection('settings').findOne({ type: 'ad_settings' });
        res.json({ success: true, scripts, adSettings });
    } catch (error) {
        log('error', 'GET /api/config', { error: error.message });
        res.status(500).json({ success: false, message: 'Konfigürasyon alınamadı.' });
    }
});

app.post('/api/download/:scriptId', async (req, res) => {
    const { scriptId } = req.params;
    const { userId } = req.body;
    try {
        if (!ObjectId.isValid(scriptId)) return res.status(400).json({ success: false, message: 'Geçersiz ID' });

        await db.collection('vpnScripts').updateOne({ _id: new ObjectId(scriptId) }, { $inc: { downloads: 1 } });

        if (userId) {
            await db.collection('users').updateOne(
                { _id: userId },
                {
                    $inc: { downloadCount: 1 },
                    $set: { lastSeen: new Date() },
                    $setOnInsert: { firstSeen: new Date() }
                },
                { upsert: true }
            );
        }
        res.json({ success: true });
    } catch (error) {
        log('error', 'POST /api/download/:scriptId', { error: error.message });
        res.status(500).json({ success: false, message: 'İndirme izlenemedi.' });
    }
});


// --- ADMIN API ROUTES ---

app.get('/api/admin/dashboard', adminAuth, async (req, res) => {
    try {
        const users = await db.collection('users').find({}).toArray();
        const scripts = await db.collection('vpnScripts').find({}).toArray();
        const settings = await db.collection('settings').findOne({ type: 'ad_settings' });
        const totalDownloads = scripts.reduce((sum, s) => sum + (s.downloads || 0), 0);
        
        res.json({
            success: true,
            stats: {
                totalUsers: users.length,
                totalDownloads,
            },
            users,
            scripts,
            settings
        });
    } catch (error) {
        log('error', 'GET /api/admin/dashboard', { error: error.message });
        res.status(500).json({ success: false, message: 'Dashboard verileri alınamadı.' });
    }
});

app.post('/api/admin/scripts', adminAuth, upload.single('contentFile'), async (req, res) => {
    try {
        const { name, type, filename } = req.body;
        let content = req.body.content || '';
        
        if (req.file) {
            content = fs.readFileSync(req.file.path, 'utf-8');
            fs.unlinkSync(req.file.path);
        }

        const newScript = {
            name,
            type,
            content,
            filename,
            enabled: true,
            downloads: 0,
            createdAt: new Date(),
        };
        const result = await db.collection('vpnScripts').insertOne(newScript);
        res.status(201).json({ success: true, message: 'Script eklendi.', script: { ...newScript, _id: result.insertedId } });
    } catch (error) {
        log('error', 'POST /api/admin/scripts', { error: error.message });
        res.status(500).json({ success: false, message: 'Script eklenemedi.' });
    }
});

app.put('/api/admin/scripts/:id', adminAuth, upload.single('contentFile'), async (req, res) => {
    const { id } = req.params;
    try {
        if (!ObjectId.isValid(id)) return res.status(400).json({ success: false, message: 'Geçersiz ID' });
        
        const { name, type, filename } = req.body;
        let content = req.body.content;

        const updateData = { name, type, filename };

        if (req.file) {
            content = fs.readFileSync(req.file.path, 'utf-8');
            fs.unlinkSync(req.file.path);
            updateData.content = content;
        } else if (content) {
            updateData.content = content;
        }

        const result = await db.collection('vpnScripts').updateOne(
            { _id: new ObjectId(id) },
            { $set: updateData }
        );
        if (result.matchedCount === 0) return res.status(404).json({ success: false, message: 'Script bulunamadı.' });
        
        res.json({ success: true, message: 'Script güncellendi.' });
    } catch (error) {
        log('error', `PUT /api/admin/scripts/${id}`, { error: error.message });
        res.status(500).json({ success: false, message: 'Script güncellenemedi.' });
    }
});

app.delete('/api/admin/scripts/:id', adminAuth, async (req, res) => {
    const { id } = req.params;
    try {
        if (!ObjectId.isValid(id)) return res.status(400).json({ success: false, message: 'Geçersiz ID' });

        const result = await db.collection('vpnScripts').deleteOne({ _id: new ObjectId(id) });
        if (result.deletedCount === 0) return res.status(404).json({ success: false, message: 'Script bulunamadı.' });

        res.json({ success: true, message: 'Script silindi.' });
    } catch (error) {
        log('error', `DELETE /api/admin/scripts/${id}`, { error: error.message });
        res.status(500).json({ success: false, message: 'Script silinemedi.' });
    }
});

app.post('/api/admin/scripts/toggle/:id', adminAuth, async (req, res) => {
    const { id } = req.params;
    try {
        if (!ObjectId.isValid(id)) return res.status(400).json({ success: false, message: 'Geçersiz ID' });
        
        const script = await db.collection('vpnScripts').findOne({ _id: new ObjectId(id) });
        if (!script) return res.status(404).json({ success: false, message: 'Script bulunamadı.' });

        const newStatus = !script.enabled;
        await db.collection('vpnScripts').updateOne({ _id: new ObjectId(id) }, { $set: { enabled: newStatus } });
        
        res.json({ success: true, message: `Script ${newStatus ? 'etkinleştirildi' : 'devre dışı bırakıldı'}.`, newStatus });
    } catch (error) {
        log('error', `POST /api/admin/scripts/toggle/${id}`, { error: error.message });
        res.status(500).json({ success: false, message: 'Script durumu değiştirilemedi.' });
    }
});

app.post('/api/admin/users/add-coins', adminAuth, async (req, res) => {
    try {
        const { userId, amount } = req.body;
        if (!userId || !amount) return res.status(400).json({ success: false, message: 'Kullanıcı ID ve miktar gerekli.' });
        
        const result = await db.collection('users').updateOne(
            { _id: userId },
            { $inc: { coins: parseInt(amount, 10) || 0 } }
        );

        if (result.matchedCount === 0) return res.status(404).json({ success: false, message: 'Kullanıcı bulunamadı.' });

        const updatedUser = await db.collection('users').findOne({ _id: userId });
        res.json({ success: true, message: 'Coin eklendi.', newBalance: updatedUser.coins });
    } catch (error) {
        log('error', 'POST /api/admin/users/add-coins', { error: error.message });
        res.status(500).json({ success: false, message: 'Coin eklenemedi.' });
    }
});

app.post('/api/admin/settings/ads', adminAuth, async (req, res) => {
    try {
        const { showAds, adFrequency } = req.body;
        await db.collection('settings').updateOne(
            { type: 'ad_settings' },
            { $set: { showAds, adFrequency: parseInt(adFrequency, 10), lastUpdated: new Date() } },
            { upsert: true }
        );
        res.json({ success: true, message: 'Reklam ayarları güncellendi.' });
    } catch (error) {
        log('error', 'POST /api/admin/settings/ads', { error: error.message });
        res.status(500).json({ success: false, message: 'Reklam ayarları güncellenemedi.' });
    }
});

// --- TELEGRAM BOT ---
bot.onText(/\/start/, (msg) => {
    const chatId = msg.chat.id;
    db.collection('users').updateOne({ _id: chatId.toString() }, { $set: { lastSeen: new Date(), username: msg.from.username }, $setOnInsert: { firstSeen: new Date() }}, { upsert: true });
    bot.sendMessage(chatId, "VPN Script Hub'a hoş geldiniz!", {
        reply_markup: {
            inline_keyboard: [[{
                text: '🚀 Web Uygulamasını Aç',
                web_app: { url: WEB_APP_URL }
            }]]
        }
    });
});


// --- SERVER START ---
const startServer = async () => {
    await connectToDb();
    app.listen(PORT, () => {
        log('info', `Sunucu ${PORT} portunda başlatıldı.`);
    });
};

startServer();