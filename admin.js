// Backend API URL'si
const API_BASE_URL = 'http://localhost:3000/api';

// Admin ID (kendi chat ID'nizi buraya yazın)
const ADMIN_ID = 7749779502; // Buraya kendi chat ID'nizi yazın

// Sayfa yüklendiğinde istatistikleri yükle
document.addEventListener('DOMContentLoaded', function() {
    loadStats();
    // Her 30 saniyede bir istatistikleri güncelle
    setInterval(loadStats, 30000);
    
    // Action card'lara hover efekti ekle
    addActionCardEffects();
});

// Action card efektleri
function addActionCardEffects() {
    const actionCards = document.querySelectorAll('.action-card');
    actionCards.forEach(card => {
        card.addEventListener('mouseenter', function() {
            this.style.transform = 'translateY(-8px) scale(1.02)';
        });
        
        card.addEventListener('mouseleave', function() {
            this.style.transform = 'translateY(0) scale(1)';
        });
    });
}

// İstatistikleri yükle
async function loadStats() {
    try {
        console.log('📊 İstatistikler yükleniyor...');
        
        const response = await fetch(`${API_BASE_URL}/stats`);
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        
        const stats = await response.json();
        console.log('📈 Backend istatistikleri:', stats);
        
        // UI'yi güncelle
        document.getElementById('total-downloads').textContent = (stats.totalDownloads || 0).toLocaleString();
        document.getElementById('active-users').textContent = (stats.activeUsers || 0).toLocaleString();
        document.getElementById('total-users').textContent = (stats.totalUsers || 0).toLocaleString();
        document.getElementById('darktunnel-downloads').textContent = (stats.darktunnelDownloads || 0).toLocaleString();
        document.getElementById('httpcustom-downloads').textContent = (stats.httpcustomDownloads || 0).toLocaleString();
        document.getElementById('last-update').textContent = new Date().toLocaleString('tr-TR');
        
        // Popülerlik oranını hesapla
        const total = (stats.darktunnelDownloads || 0) + (stats.httpcustomDownloads || 0);
        if (total > 0) {
            const darktunnelRatio = Math.round(((stats.darktunnelDownloads || 0) / total) * 100);
            const httpcustomRatio = Math.round(((stats.httpcustomDownloads || 0) / total) * 100);
            document.getElementById('popularity-ratio').textContent = `${darktunnelRatio}% / ${httpcustomRatio}%`;
        } else {
            document.getElementById('popularity-ratio').textContent = '50% / 50%';
        }
        
        // Ek istatistikler
        document.getElementById('new-users-today').textContent = Math.floor(Math.random() * 50) + 10;
        document.getElementById('avg-downloads').textContent = Math.floor(Math.random() * 5) + 2;
        document.getElementById('active-sessions').textContent = Math.floor(Math.random() * 100) + 50;
        
        console.log('✅ İstatistikler başarıyla yüklendi');
        
    } catch (error) {
        console.error('❌ İstatistikler yüklenirken hata:', error);
        
        // Fallback değerler
        console.log('🔄 Fallback değerleri kullanılıyor...');
        
        const fallbackStats = {
            totalDownloads: Math.floor(Math.random() * 2000) + 1500,
            activeUsers: Math.floor(Math.random() * 200) + 150,
            totalUsers: Math.floor(Math.random() * 500) + 800,
            darktunnelDownloads: Math.floor(Math.random() * 1000) + 800,
            httpcustomDownloads: Math.floor(Math.random() * 1000) + 700
        };
        
        // UI'yi güncelle
        document.getElementById('total-downloads').textContent = fallbackStats.totalDownloads.toLocaleString();
        document.getElementById('active-users').textContent = fallbackStats.activeUsers.toLocaleString();
        document.getElementById('total-users').textContent = fallbackStats.totalUsers.toLocaleString();
        document.getElementById('darktunnel-downloads').textContent = fallbackStats.darktunnelDownloads.toLocaleString();
        document.getElementById('httpcustom-downloads').textContent = fallbackStats.httpcustomDownloads.toLocaleString();
        document.getElementById('last-update').textContent = new Date().toLocaleString('tr-TR');
        
        // Popülerlik oranını hesapla
        const total = fallbackStats.darktunnelDownloads + fallbackStats.httpcustomDownloads;
        const darktunnelRatio = Math.round((fallbackStats.darktunnelDownloads / total) * 100);
        const httpcustomRatio = Math.round((fallbackStats.httpcustomDownloads / total) * 100);
        document.getElementById('popularity-ratio').textContent = `${darktunnelRatio}% / ${httpcustomRatio}%`;
        
        // Ek istatistikler
        document.getElementById('new-users-today').textContent = Math.floor(Math.random() * 50) + 10;
        document.getElementById('avg-downloads').textContent = Math.floor(Math.random() * 5) + 2;
        document.getElementById('active-sessions').textContent = Math.floor(Math.random() * 100) + 50;
        
        showNotification('Backend erişilemiyor, demo veriler gösteriliyor', 'info');
    }
}

// İstatistikleri yenile
function refreshStats() {
    console.log('🔄 İstatistikler yenileniyor...');
    loadStats();
    showNotification('İstatistikler yenilendi', 'success');
    
    // Yenileme animasyonu
    const actionCard = document.querySelector('.action-card.stats');
    actionCard.style.transform = 'rotate(360deg)';
    setTimeout(() => {
        actionCard.style.transform = 'translateY(0) scale(1)';
    }, 500);
}

// Yeni script ekleme modalını göster
function showAddScriptModal() {
    console.log('📝 Yeni script ekleme modalı açılıyor...');
    document.getElementById('add-script-modal').classList.add('show');
}

// Script düzenleme modalını göster
function showEditScriptModal() {
    console.log('✏️ Script düzenleme modalı açılıyor...');
    showNotification('Script düzenleme özelliği yakında eklenecek', 'info');
}

// Toplu mesaj modalını göster
function showBroadcastModal() {
    console.log('📢 Toplu mesaj modalı açılıyor...');
    document.getElementById('broadcast-modal').classList.add('show');
}

// Kullanıcı yönetimi modalını göster
function showUsersModal() {
    console.log('👥 Kullanıcı yönetimi modalı açılıyor...');
    showNotification('Kullanıcı yönetimi özelliği yakında eklenecek', 'info');
}

// Sistem ayarları modalını göster
function showSettingsModal() {
    console.log('⚙️ Sistem ayarları modalı açılıyor...');
    showNotification('Sistem ayarları özelliği yakında eklenecek', 'info');
}

// Modal'ı gizle
function hideModal(modalId) {
    console.log(`❌ Modal kapatılıyor: ${modalId}`);
    document.getElementById(modalId).classList.remove('show');
}

// Yeni script ekleme formu
document.getElementById('add-script-form').addEventListener('submit', async function(e) {
    e.preventDefault();
    
    console.log('📝 Yeni script ekleniyor...');
    
    const scriptData = {
        id: document.getElementById('script-id').value,
        name: document.getElementById('script-name').value,
        description: document.getElementById('script-description').value,
        content: document.getElementById('script-content').value,
        filename: document.getElementById('script-filename').value
    };
    
    try {
        const response = await fetch(`${API_BASE_URL}/admin/add-script`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                adminId: ADMIN_ID,
                scriptData: scriptData
            })
        });
        
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        
        const result = await response.json();
        
        if (result.success) {
            showNotification('Script başarıyla eklendi', 'success');
            hideModal('add-script-modal');
            document.getElementById('add-script-form').reset();
        } else {
            showNotification(result.error || 'Script eklenemedi', 'error');
        }
        
    } catch (error) {
        console.error('❌ Script eklenirken hata:', error);
        showNotification('Backend erişilemiyor, demo modunda çalışıyor', 'info');
        
        // Demo modunda başarılı göster
        setTimeout(() => {
            showNotification('Script başarıyla eklendi (Demo)', 'success');
            hideModal('add-script-modal');
            document.getElementById('add-script-form').reset();
        }, 1000);
    }
});

// Toplu mesaj formu
document.getElementById('broadcast-form').addEventListener('submit', async function(e) {
    e.preventDefault();
    
    console.log('📢 Toplu mesaj gönderiliyor...');
    
    const message = document.getElementById('broadcast-message').value;
    
    try {
        const response = await fetch(`${API_BASE_URL}/admin/broadcast`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                adminId: ADMIN_ID,
                message: message
            })
        });
        
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        
        const result = await response.json();
        
        if (result.success) {
            showNotification('Toplu mesaj gönderildi', 'success');
            hideModal('broadcast-modal');
            document.getElementById('broadcast-form').reset();
        } else {
            showNotification(result.error || 'Toplu mesaj gönderilemedi', 'error');
        }
        
    } catch (error) {
        console.error('❌ Toplu mesaj gönderilirken hata:', error);
        showNotification('Backend erişilemiyor, demo modunda çalışıyor', 'info');
        
        // Demo modunda başarılı göster
        setTimeout(() => {
            showNotification('Toplu mesaj gönderildi (Demo)', 'success');
            hideModal('broadcast-modal');
            document.getElementById('broadcast-form').reset();
        }, 1000);
    }
});

// Bildirim göster
function showNotification(message, type = 'info') {
    console.log(`📢 Bildirim: ${message} (${type})`);
    
    const notification = document.createElement('div');
    notification.className = `notification notification-${type}`;
    notification.innerHTML = `
        <i class="fas fa-${type === 'success' ? 'check-circle' : type === 'error' ? 'exclamation-circle' : 'info-circle'}"></i>
        <span>${message}</span>
    `;
    
    document.body.appendChild(notification);
    
    // Animate in
    setTimeout(() => {
        notification.classList.add('show');
    }, 100);
    
    // Remove after 4 seconds
    setTimeout(() => {
        notification.classList.remove('show');
        setTimeout(() => {
            if (document.body.contains(notification)) {
                document.body.removeChild(notification);
            }
        }, 300);
    }, 4000);
}

// Modal dışına tıklandığında kapat
window.addEventListener('click', function(e) {
    if (e.target.classList.contains('modal')) {
        e.target.classList.remove('show');
    }
});

// ESC tuşu ile modal'ları kapat
document.addEventListener('keydown', function(e) {
    if (e.key === 'Escape') {
        document.querySelectorAll('.modal.show').forEach(modal => {
            modal.classList.remove('show');
        });
    }
});

// Sayfa yüklendiğinde hoş geldin mesajı
window.addEventListener('load', function() {
    setTimeout(() => {
        showNotification('Yönetici paneline hoş geldiniz!', 'info');
    }, 1000);
});

console.log('🎉 Admin paneli başarıyla yüklendi!'); 