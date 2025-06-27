// Backend API URL'si
const API_BASE_URL = 'http://localhost:3000/api';

// Admin ID (kendi chat ID'nizi buraya yazın)
const ADMIN_ID = 7749779502; // Buraya kendi chat ID'nizi yazın

// Script verilerini sakla
let allScripts = {};

// Sayfa yüklendiğinde istatistikleri ve scriptleri yükle
document.addEventListener('DOMContentLoaded', function() {
    loadStats();
    loadAllScripts();
    // Her 30 saniyede bir güncelle
    setInterval(() => {
        loadStats();
        loadAllScripts();
    }, 30000);
});

// Tüm scriptleri yükle (admin için)
async function loadAllScripts() {
    try {
        const response = await fetch(`${API_BASE_URL}/admin/scripts?adminId=${ADMIN_ID}`);
        const result = await response.json();
        
        if (result.success) {
            allScripts = result.scripts;
            updateScriptsList();
        } else {
            showNotification(result.error, 'error');
        }
        
    } catch (error) {
        console.error('Scriptler yüklenirken hata:', error);
        showNotification('Scriptler yüklenemedi', 'error');
    }
}

// Script listesini güncelle
function updateScriptsList() {
    const scriptsContainer = document.getElementById('scripts-list');
    if (!scriptsContainer) return;
    
    scriptsContainer.innerHTML = '';
    
    Object.entries(allScripts).forEach(([id, script]) => {
        const scriptItem = document.createElement('div');
        scriptItem.className = 'script-item';
        scriptItem.innerHTML = `
            <div class="script-info">
                <h4>${script.name} (${id})</h4>
                <p>${script.description}</p>
                <small>📄 ${script.filename} | 📊 ${script.downloads || 0} indirme</small>
            </div>
            <div class="script-actions">
                <button onclick="editScript('${id}')" class="btn-edit">✏️ Düzenle</button>
                <button onclick="toggleScript('${id}')" class="btn-toggle ${script.enabled ? 'active' : 'inactive'}">
                    ${script.enabled ? '✅ Aktif' : '❌ Pasif'}
                </button>
                <button onclick="deleteScript('${id}')" class="btn-delete">🗑️ Sil</button>
            </div>
        `;
        scriptsContainer.appendChild(scriptItem);
    });
}

// Script düzenleme
async function editScript(scriptId) {
    const script = allScripts[scriptId];
    if (!script) return;
    
    // Form alanlarını doldur
    document.getElementById('edit-script-id').value = scriptId;
    document.getElementById('edit-script-name').value = script.name;
    document.getElementById('edit-script-description').value = script.description;
    document.getElementById('edit-script-filename').value = script.filename;
    document.getElementById('edit-script-content').value = script.content;
    
    // Modal'ı göster
    document.getElementById('edit-script-modal').classList.add('show');
}

// Script durum değiştirme
async function toggleScript(scriptId) {
    try {
        const response = await fetch(`${API_BASE_URL}/admin/toggle-script/${scriptId}`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                adminId: ADMIN_ID
            })
        });
        
        const result = await response.json();
        
        if (result.success) {
            showNotification(result.message, 'success');
            await loadAllScripts(); // Listeyi yenile
        } else {
            showNotification(result.error, 'error');
        }
        
    } catch (error) {
        console.error('Script durumu değiştirilirken hata:', error);
        showNotification('Script durumu değiştirilemedi', 'error');
    }
}

// Script silme
async function deleteScript(scriptId) {
    if (!confirm('Bu scripti silmek istediğinizden emin misiniz?')) {
        return;
    }
    
    try {
        const response = await fetch(`${API_BASE_URL}/admin/delete-script/${scriptId}`, {
            method: 'DELETE',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                adminId: ADMIN_ID
            })
        });
        
        const result = await response.json();
        
        if (result.success) {
            showNotification(result.message, 'success');
            await loadAllScripts(); // Listeyi yenile
        } else {
            showNotification(result.error, 'error');
        }
        
    } catch (error) {
        console.error('Script silinirken hata:', error);
        showNotification('Script silinemedi', 'error');
    }
}

// İstatistikleri yükle
async function loadStats() {
    try {
        const response = await fetch(`${API_BASE_URL}/stats`);
        const stats = await response.json();
        
        // UI'yi güncelle
        document.getElementById('total-downloads').textContent = stats.totalDownloads.toLocaleString();
        document.getElementById('active-users').textContent = stats.activeUsers.toLocaleString();
        document.getElementById('script-count').textContent = stats.scriptCount || 0;
        document.getElementById('active-scripts').textContent = stats.activeScripts || 0;
        document.getElementById('last-update').textContent = new Date(stats.lastUpdated).toLocaleString('tr-TR');
        
    } catch (error) {
        console.error('İstatistikler yüklenirken hata:', error);
        showNotification('İstatistikler yüklenemedi', 'error');
    }
}

// İstatistikleri yenile
function refreshStats() {
    loadStats();
    loadAllScripts();
    showNotification('Veriler yenilendi', 'success');
}

// Yeni script ekleme modalını göster
function showAddScriptModal() {
    document.getElementById('add-script-modal').classList.add('show');
}

// Script düzenleme modalını göster
function showEditScriptModal() {
    document.getElementById('edit-script-modal').classList.add('show');
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
            await loadAllScripts(); // Listeyi yenile
        } else {
            showNotification(result.error, 'error');
        }
        
    } catch (error) {
        console.error('Script eklenirken hata:', error);
        showNotification('Script eklenemedi', 'error');
    }
});

// Script düzenleme formu
document.getElementById('edit-script-form').addEventListener('submit', async function(e) {
    e.preventDefault();
    
    const scriptId = document.getElementById('edit-script-id').value;
    const updates = {
        name: document.getElementById('edit-script-name').value,
        description: document.getElementById('edit-script-description').value,
        content: document.getElementById('edit-script-content').value,
        filename: document.getElementById('edit-script-filename').value
    };
    
    try {
        const response = await fetch(`${API_BASE_URL}/admin/update-script/${scriptId}`, {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                adminId: ADMIN_ID,
                ...updates
            })
        });
        
        const result = await response.json();
        
        if (result.success) {
            showNotification('Script başarıyla güncellendi', 'success');
            hideModal('edit-script-modal');
            await loadAllScripts(); // Listeyi yenile
        } else {
            showNotification(result.error, 'error');
        }
        
    } catch (error) {
        console.error('Script güncellenirken hata:', error);
        showNotification('Script güncellenemedi', 'error');
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