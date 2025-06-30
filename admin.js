// Backend API URL'si - Sunucunun çalıştığı Glitch adresi
const API_BASE_URL = 'https://tg-web-app-1.onrender.com/api';

// Admin ID (kendi chat ID'nizi buraya yazın)
const ADMIN_ID = 7749779502; // Buraya kendi chat ID'nizi yazın

// Global variables
let scripts = {};
let stats = {};
let users = {};

// Sayfa yüklendiğinde istatistikleri yükle
document.addEventListener('DOMContentLoaded', () => {
    console.log('🔧 Admin panel başlatılıyor...');
    loadStats();
    loadScripts();
    loadUsers();
    setupEventListeners();
});

// Setup event listeners
function setupEventListeners() {
    const addScriptForm = document.getElementById('add-script-form');
    if (addScriptForm) {
        addScriptForm.addEventListener('submit', handleAddScript);
    }
    
    const uploadForm = document.getElementById('upload-form');
    if (uploadForm) {
        uploadForm.addEventListener('submit', handleFileUpload);
    }
    
    const addCoinForm = document.getElementById('add-coin-form');
    if (addCoinForm) {
        addCoinForm.addEventListener('submit', handleAddCoin);
    }
}

// İstatistikleri yükle
async function loadStats() {
    try {
        const response = await fetch(`${API_BASE_URL}/stats`);
        if (response.ok) {
            stats = await response.json();
            updateStatsDisplay();
        }
    } catch (error) {
        console.error('❌ İstatistikler yüklenirken hata:', error);
        showNotification('❌ İstatistikler yüklenemedi', 'error');
    }
}

// Update stats display
function updateStatsDisplay() {
    document.getElementById('total-downloads').textContent = stats.totalDownloads || 0;
    document.getElementById('active-users').textContent = stats.activeUsers || 0;
    document.getElementById('total-users').textContent = stats.totalUsers || 0;
    document.getElementById('script-count').textContent = Object.keys(scripts).length;
}

// Load scripts
async function loadScripts() {
    try {
        const response = await fetch(`${API_BASE_URL}/scripts`);
        if (response.ok) {
            scripts = await response.json();
            displayScripts();
            updateStatsDisplay();
        }
    } catch (error) {
        console.error('❌ Scriptler yüklenirken hata:', error);
        showNotification('❌ Scriptler yüklenemedi', 'error');
    }
}

// Display scripts in the list
function displayScripts() {
    const scriptsList = document.getElementById('scripts-list');
    scriptsList.innerHTML = '';
    
    Object.keys(scripts).forEach(scriptId => {
        const script = scripts[scriptId];
        const scriptElement = createScriptElement(scriptId, script);
        scriptsList.appendChild(scriptElement);
    });
}

// Create script element
function createScriptElement(scriptId, script) {
    const div = document.createElement('div');
    div.className = 'script-item';
    
    div.innerHTML = `
        <div class="script-header">
            <div class="script-name">${script.name}</div>
            <div class="script-status ${script.enabled ? 'status-enabled' : 'status-disabled'}">
                ${script.enabled ? 'Aktif' : 'Devre Dışı'}
            </div>
        </div>
        <div class="script-content">${script.content.substring(0, 200)}${script.content.length > 200 ? '...' : ''}</div>
        <div class="script-actions">
            <button class="btn-admin btn-primary btn-small" onclick="editScript('${scriptId}')">
                <i class="fas fa-edit"></i> Düzenle
            </button>
            <button class="btn-admin btn-secondary btn-small" onclick="toggleScript('${scriptId}')">
                <i class="fas fa-power-off"></i> ${script.enabled ? 'Devre Dışı Bırak' : 'Etkinleştir'}
            </button>
            <button class="btn-admin btn-danger btn-small" onclick="deleteScript('${scriptId}')">
                <i class="fas fa-trash"></i> Sil
            </button>
        </div>
    `;
    
    return div;
}

// Handle add script form submission
async function handleAddScript(event) {
    event.preventDefault();
    
    const formData = new FormData(event.target);
    const scriptData = {
        id: formData.get('script-id') || document.getElementById('script-id').value,
        name: formData.get('script-name') || document.getElementById('script-name').value,
        description: formData.get('script-description') || document.getElementById('script-description').value,
        filename: formData.get('script-filename') || document.getElementById('script-filename').value
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
        
        if (response.ok) {
        const result = await response.json();
            showNotification('✅ Script başarıyla eklendi!', 'success');
            event.target.reset();
            loadScripts();
        } else {
            const error = await response.json();
            throw new Error(error.error || 'Script eklenemedi');
        }
    } catch (error) {
        console.error('❌ Script ekleme hatası:', error);
        showNotification('❌ Script eklenemedi: ' + error.message, 'error');
    }
}

// Script düzenleme fonksiyonu
function editScript(scriptId) {
    const script = scripts[scriptId];
    if (!script) {
        showNotification('Script bulunamadı!', 'error');
        return;
    }
    
    // Form alanlarını doldur
    document.getElementById('edit-script-id').value = scriptId;
    document.getElementById('edit-script-name').value = script.name;
    document.getElementById('edit-script-description').value = script.description;
    document.getElementById('edit-script-filename').value = script.filename;
    
    // Düzenleme bölümünü göster
    document.getElementById('edit-script-section').style.display = 'block';
    
    // Sayfayı düzenleme bölümüne kaydır
    document.getElementById('edit-script-section').scrollIntoView({ behavior: 'smooth' });
}

// Script düzenleme formu gönderimi
document.getElementById('edit-script-form').addEventListener('submit', async function(e) {
    e.preventDefault();
    
    const scriptId = document.getElementById('edit-script-id').value;
    const name = document.getElementById('edit-script-name').value;
    const description = document.getElementById('edit-script-description').value;
    const filename = document.getElementById('edit-script-filename').value;
    const uploadFile = document.getElementById('edit-upload-file').files[0];
    
    try {
        const formData = new FormData();
        formData.append('id', scriptId);
        formData.append('name', name);
        formData.append('description', description);
        formData.append('filename', filename);
        
        // Eğer yeni dosya yüklendiyse, dosyayı da ekle
        if (uploadFile) {
            formData.append('file', uploadFile);
        }
        
        const response = await fetch(`${API_BASE_URL}/admin/scripts/update`, {
            method: 'POST',
            body: formData
        });
        
        if (response.ok) {
            showNotification('Script başarıyla güncellendi!', 'success');
            cancelEdit();
            loadScripts();
        } else {
            const error = await response.text();
            showNotification(`Güncelleme hatası: ${error}`, 'error');
        }
    } catch (error) {
        showNotification(`Güncelleme hatası: ${error.message}`, 'error');
    }
});

// Düzenleme iptal etme
function cancelEdit() {
    document.getElementById('edit-script-section').style.display = 'none';
    document.getElementById('edit-script-form').reset();
    document.getElementById('edit-upload-file').value = '';
}

// Toggle script status
async function toggleScript(scriptId) {
    try {
        const response = await fetch(`${API_BASE_URL}/admin/toggle-script`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                adminId: ADMIN_ID,
                scriptId: scriptId
            })
        });
        
        if (response.ok) {
            const result = await response.json();
            showNotification('✅ Script durumu değiştirildi!', 'success');
            loadScripts();
        } else {
            const error = await response.json();
            throw new Error(error.error || 'Script durumu değiştirilemedi');
        }
    } catch (error) {
        console.error('❌ Script toggle hatası:', error);
        showNotification('❌ Script durumu değiştirilemedi: ' + error.message, 'error');
    }
}

// Delete script
async function deleteScript(scriptId) {
    if (!confirm(`"${scripts[scriptId]?.name}" scriptini silmek istediğinizden emin misiniz?`)) {
        return;
    }
    
    try {
        const response = await fetch(`${API_BASE_URL}/admin/delete-script`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                adminId: ADMIN_ID,
                scriptId: scriptId
            })
        });
        
        if (response.ok) {
            const result = await response.json();
            showNotification('✅ Script başarıyla silindi!', 'success');
            loadScripts();
        } else {
            const error = await response.json();
            throw new Error(error.error || 'Script silinemedi');
        }
    } catch (error) {
        console.error('❌ Script silme hatası:', error);
        showNotification('❌ Script silinemedi: ' + error.message, 'error');
    }
}

// Show notification
function showNotification(message, type = 'info') {
    const notification = document.createElement('div');
    notification.className = `notification ${type}`;
    notification.textContent = message;
    
    document.body.appendChild(notification);
    
    // Show notification
    setTimeout(() => {
        notification.classList.add('show');
    }, 100);
    
    // Hide and remove notification
    setTimeout(() => {
        notification.classList.remove('show');
        setTimeout(() => {
            document.body.removeChild(notification);
        }, 300);
    }, 3000);
}

// Export functions to global scope
window.loadScripts = loadScripts;
window.editScript = editScript;
window.toggleScript = toggleScript;
window.deleteScript = deleteScript;
window.clearUploadForm = clearUploadForm;

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
    document.getElementById(modalId).style.display = 'none';
}

/*
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
*/

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

// Handle file upload
async function handleFileUpload(event) {
    event.preventDefault();
    
    const fileInput = document.getElementById('upload-file');
    const file = fileInput.files[0];
    
    if (!file) {
        showNotification('❌ Lütfen bir dosya seçin', 'error');
        return;
    }
    
    // Check file size (max 1MB)
    if (file.size > 1024 * 1024) {
        showNotification('❌ Dosya boyutu 1MB\'dan büyük olamaz', 'error');
        return;
    }
    
    const scriptData = {
        id: document.getElementById('upload-script-id').value,
        name: document.getElementById('upload-script-name').value,
        description: document.getElementById('upload-script-description').value,
        filename: file.name // Use original filename
    };
    
    try {
        // Read file content
        const content = await readFileAsText(file);
        
        // Add content to script data
        scriptData.content = content;
        
        // Upload to server
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
        
        if (response.ok) {
            const result = await response.json();
            showNotification('✅ Dosya başarıyla yüklendi!', 'success');
            clearUploadForm();
            loadScripts();
        } else {
            const error = await response.json();
            throw new Error(error.error || 'Dosya yüklenemedi');
        }
    } catch (error) {
        console.error('❌ Dosya yükleme hatası:', error);
        showNotification('❌ Dosya yüklenemedi: ' + error.message, 'error');
    }
}

// Read file as text
function readFileAsText(file) {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = (e) => resolve(e.target.result);
        reader.onerror = (e) => reject(new Error('Dosya okunamadı'));
        reader.readAsText(file);
    });
}

// Clear upload form
function clearUploadForm() {
    document.getElementById('upload-form').reset();
}

// Load users
async function loadUsers() {
    try {
        const response = await fetch(`${API_BASE_URL}/admin/users?adminId=${ADMIN_ID}`);
        if (response.ok) {
            const data = await response.json();
            users = data.users || {};
            displayUsers();
            updateUserStats();
        }
    } catch (error) {
        console.error('❌ Kullanıcılar yüklenirken hata:', error);
        showNotification('❌ Kullanıcılar yüklenemedi', 'error');
    }
}

// Display users in the list
function displayUsers() {
    const usersList = document.getElementById('users-list');
    usersList.innerHTML = '';
    
    if (Object.keys(users).length === 0) {
        usersList.innerHTML = '<div class="no-data">Henüz kullanıcı bulunmuyor.</div>';
        return;
    }
    
    Object.keys(users).forEach(userId => {
        const user = users[userId];
        const userElement = createUserElement(userId, user);
        usersList.appendChild(userElement);
    });
}

// Create user element
function createUserElement(userId, user) {
    const div = document.createElement('div');
    div.className = 'user-item';
    
    const userName = user.name || user.username || `Kullanıcı ${userId}`;
    const userCoins = user.coins || 0;
    const joinDate = user.joinDate ? new Date(user.joinDate).toLocaleDateString('tr-TR') : 'Bilinmiyor';
    
    div.innerHTML = `
        <div class="user-header">
            <div class="user-info">
                <div class="user-name">${userName}</div>
                <div class="user-id">ID: ${userId}</div>
            </div>
            <div class="user-coins">🪙 ${userCoins} coins</div>
        </div>
        <div class="user-details">
            <div class="user-join">Katılım: ${joinDate}</div>
            <div class="user-downloads">İndirmeler: ${user.downloads || 0}</div>
        </div>
        <div class="user-actions">
            <button class="btn-admin btn-primary btn-small" onclick="addCoinsToUser('${userId}')">
                <i class="fas fa-plus"></i> Coin Ekle
            </button>
            <button class="btn-admin btn-secondary btn-small" onclick="viewUserDetails('${userId}')">
                <i class="fas fa-eye"></i> Detaylar
            </button>
        </div>
    `;
    
    return div;
}

// Update user statistics
function updateUserStats() {
    const totalUsers = Object.keys(users).length;
    const totalCoins = Object.values(users).reduce((sum, user) => sum + (user.coins || 0), 0);
    const avgCoins = totalUsers > 0 ? Math.round(totalCoins / totalUsers) : 0;
    
    document.getElementById('total-users-count').textContent = totalUsers;
    document.getElementById('total-coins').textContent = totalCoins;
    document.getElementById('avg-coins').textContent = avgCoins;
}

// Handle add coin form submission
async function handleAddCoin(event) {
    event.preventDefault();
    
    const userId = document.getElementById('user-id').value;
    const coinAmount = parseInt(document.getElementById('coin-amount').value);
    const reason = document.getElementById('coin-reason').value;
    
    if (!userId || !coinAmount || coinAmount <= 0) {
        showNotification('❌ Geçerli kullanıcı ID ve coin miktarı gerekli', 'error');
        return;
    }
    
    try {
        const response = await fetch(`${API_BASE_URL}/admin/add-coins`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                adminId: ADMIN_ID,
                userId: userId,
                amount: coinAmount,
                reason: reason
            })
        });
        
        if (response.ok) {
            const result = await response.json();
            showNotification(`✅ ${coinAmount} coin başarıyla eklendi!`, 'success');
            document.getElementById('add-coin-form').reset();
            loadUsers();
        } else {
            const error = await response.json();
            throw new Error(error.error || 'Coin eklenemedi');
        }
    } catch (error) {
        console.error('❌ Coin ekleme hatası:', error);
        showNotification('❌ Coin eklenemedi: ' + error.message, 'error');
    }
}

// Add coins to specific user
function addCoinsToUser(userId) {
    document.getElementById('user-id').value = userId;
    document.getElementById('coin-amount').focus();
}

// View user details
function viewUserDetails(userId) {
    const user = users[userId];
    if (!user) {
        showNotification('Kullanıcı bulunamadı!', 'error');
        return;
    }
    
    const details = `
Kullanıcı Detayları:
ID: ${userId}
Ad: ${user.name || user.username || 'Bilinmiyor'}
Coin: ${user.coins || 0}
İndirmeler: ${user.downloads || 0}
Katılım: ${user.joinDate ? new Date(user.joinDate).toLocaleDateString('tr-TR') : 'Bilinmiyor'}
    `;
    
    alert(details);
} 