// Backend API URL'si
const API_BASE_URL = 'http://localhost:3000/api';

// Admin ID (kendi chat ID'nizi buraya yazın)
const ADMIN_ID = 7749779502; // Buraya kendi chat ID'nizi yazın

// Sayfa yüklendiğinde istatistikleri yükle
document.addEventListener('DOMContentLoaded', function() {
    loadStats();
    // Her 30 saniyede bir istatistikleri güncelle
    setInterval(loadStats, 30000);
});

// İstatistikleri yükle
async function loadStats() {
    try {
        const response = await fetch(`${API_BASE_URL}/stats`);
        const stats = await response.json();
        
        // UI'yi güncelle
        document.getElementById('total-downloads').textContent = stats.totalDownloads.toLocaleString();
        document.getElementById('active-users').textContent = stats.activeUsers.toLocaleString();
        document.getElementById('darktunnel-downloads').textContent = stats.darktunnelDownloads.toLocaleString();
        document.getElementById('httpcustom-downloads').textContent = stats.httpcustomDownloads.toLocaleString();
        document.getElementById('last-update').textContent = new Date(stats.lastUpdated).toLocaleString('tr-TR');
        
        // Popülerlik oranını hesapla
        const total = stats.darktunnelDownloads + stats.httpcustomDownloads;
        if (total > 0) {
            const darktunnelRatio = Math.round((stats.darktunnelDownloads / total) * 100);
            const httpcustomRatio = Math.round((stats.httpcustomDownloads / total) * 100);
            document.getElementById('popularity-ratio').textContent = `${darktunnelRatio}% / ${httpcustomRatio}%`;
        }
        
    } catch (error) {
        console.error('İstatistikler yüklenirken hata:', error);
        showNotification('İstatistikler yüklenemedi', 'error');
    }
}

// İstatistikleri yenile
function refreshStats() {
    loadStats();
    showNotification('İstatistikler yenilendi', 'success');
}

// Yeni script ekleme modalını göster
function showAddScriptModal() {
    document.getElementById('add-script-modal').classList.add('show');
}

// Toplu mesaj modalını göster
function showBroadcastModal() {
    document.getElementById('broadcast-modal').classList.add('show');
}

// Modal'ı gizle
function hideModal(modalId) {
    document.getElementById(modalId).classList.remove('show');
}

// Yeni script ekleme formu
document.getElementById('add-script-form').addEventListener('submit', async function(e) {
    e.preventDefault();
    
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
        
        const result = await response.json();
        
        if (result.success) {
            showNotification('Script başarıyla eklendi', 'success');
            hideModal('add-script-modal');
            document.getElementById('add-script-form').reset();
        } else {
            showNotification(result.error, 'error');
        }
        
    } catch (error) {
        console.error('Script eklenirken hata:', error);
        showNotification('Script eklenemedi', 'error');
    }
});

// Toplu mesaj formu
document.getElementById('broadcast-form').addEventListener('submit', async function(e) {
    e.preventDefault();
    
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
        
        const result = await response.json();
        
        if (result.success) {
            showNotification('Toplu mesaj gönderildi', 'success');
            hideModal('broadcast-modal');
            document.getElementById('broadcast-form').reset();
        } else {
            showNotification(result.error, 'error');
        }
        
    } catch (error) {
        console.error('Toplu mesaj gönderilirken hata:', error);
        showNotification('Toplu mesaj gönderilemedi', 'error');
    }
});

// Bildirim göster
function showNotification(message, type = 'info') {
    const notification = document.createElement('div');
    notification.className = `notification notification-${type}`;
    notification.innerHTML = `
        <i class="fas fa-${type === 'success' ? 'check-circle' : type === 'error' ? 'exclamation-circle' : 'info-circle'}"></i>
        <span>${message}</span>
    `;
    
    notification.style.cssText = `
        position: fixed;
        top: 20px;
        right: 20px;
        background: ${type === 'success' ? '#27ae60' : type === 'error' ? '#e74c3c' : '#3498db'};
        color: white;
        padding: 1rem 1.5rem;
        border-radius: 12px;
        box-shadow: 0 4px 12px rgba(0,0,0,0.15);
        display: flex;
        align-items: center;
        gap: 0.75rem;
        z-index: 10000;
        transform: translateX(100%);
        transition: transform 0.3s ease;
        max-width: 300px;
    `;
    
    document.body.appendChild(notification);
    
    // Animate in
    setTimeout(() => {
        notification.style.transform = 'translateX(0)';
    }, 100);
    
    // Remove after 3 seconds
    setTimeout(() => {
        notification.style.transform = 'translateX(100%)';
        setTimeout(() => {
            document.body.removeChild(notification);
        }, 300);
    }, 3000);
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