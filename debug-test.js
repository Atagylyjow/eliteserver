// Debug test script
const axios = require('axios');

const BASE_URL = 'http://localhost:3000';

async function testAPI() {
    console.log('🧪 Debug test başlatılıyor...\n');
    
    try {
        // Test 1: Stats API
        console.log('1️⃣ Stats API test ediliyor...');
        const statsResponse = await axios.get(`${BASE_URL}/api/stats`);
        console.log('✅ Stats API başarılı:', statsResponse.data);
        
        // Test 2: Scripts API
        console.log('\n2️⃣ Scripts API test ediliyor...');
        const scriptsResponse = await axios.get(`${BASE_URL}/api/scripts`);
        console.log('✅ Scripts API başarılı:', {
            scriptCount: Object.keys(scriptsResponse.data).length,
            scripts: Object.keys(scriptsResponse.data)
        });
        
        // Test 3: Download API (başarısız olması beklenir - geçersiz script)
        console.log('\n3️⃣ Download API test ediliyor (geçersiz script)...');
        try {
            await axios.post(`${BASE_URL}/api/download`, {
                scriptType: 'invalid_script',
                userId: 'test_user_123'
            });
        } catch (error) {
            console.log('✅ Beklenen hata alındı:', error.response.data);
        }
        
        // Test 4: Download API (başarılı)
        console.log('\n4️⃣ Download API test ediliyor (geçerli script)...');
        const downloadResponse = await axios.post(`${BASE_URL}/api/download`, {
            scriptType: 'darktunnel',
            userId: 'test_user_123'
        });
        console.log('✅ Download API başarılı:', {
            success: downloadResponse.data.success,
            scriptName: downloadResponse.data.script.name
        });
        
        // Test 5: Admin API (yetkisiz erişim)
        console.log('\n5️⃣ Admin API test ediliyor (yetkisiz erişim)...');
        try {
            await axios.post(`${BASE_URL}/api/admin/add-script`, {
                adminId: 999999,
                scriptData: { id: 'test', name: 'Test Script' }
            });
        } catch (error) {
            console.log('✅ Beklenen yetkisiz erişim hatası:', error.response.data);
        }
        
        console.log('\n🎉 Tüm testler tamamlandı!');
        
    } catch (error) {
        console.error('❌ Test hatası:', error.message);
        if (error.response) {
            console.error('Response data:', error.response.data);
        }
    }
}

// Server'ın çalışıp çalışmadığını kontrol et
async function checkServer() {
    try {
        await axios.get(`${BASE_URL}/api/stats`);
        console.log('✅ Server çalışıyor, testler başlatılıyor...\n');
        await testAPI();
    } catch (error) {
        console.error('❌ Server çalışmıyor! Lütfen önce server\'ı başlatın:');
        console.error('   npm run debug');
        console.error('   veya');
        console.error('   npm run dev');
    }
}

checkServer(); 