require('dotenv').config();
const { MongoDBBackup } = require('./backup-system');

async function testBackup() {
    try {
        console.log('🧪 Test yedekleme başlatılıyor...');
        console.log('📊 Environment variables:');
        console.log('   DATABASE_URL:', process.env.DATABASE_URL ? '✅ Ayarlandı' : '❌ Ayarlandı');
        console.log('   NODE_ENV:', process.env.NODE_ENV || 'Belirtilmemiş');
        console.log('   PORT:', process.env.PORT || '3000');
        
        if (!process.env.DATABASE_URL) {
            console.error('❌ DATABASE_URL environment variable\'ı bulunamadı!');
            console.log('💡 Render\'da Environment Variables sekmesinden DATABASE_URL\'i ayarlayın.');
            process.exit(1);
        }
        
        const backup = new MongoDBBackup();
        const summary = await backup.runBackup();
        
        console.log('✅ Test yedekleme başarılı!');
        console.log('📊 Yedekleme özeti:', summary);
        
    } catch (error) {
        console.error('❌ Test yedekleme hatası:', error.message);
        console.error('🔍 Detaylı hata:', error);
        process.exit(1);
    }
}

testBackup(); 