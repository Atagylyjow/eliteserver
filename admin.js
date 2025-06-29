// Backend API URL'si
const API_BASE_URL = 'http://localhost:3000/api';

// Admin ID (kendi chat ID'nizi buraya yazın)
const ADMIN_ID = 7749779502; // Buraya kendi chat ID'nizi yazın

// Global variables
let scripts = {};
let stats = {};

// Sayfa yüklendiğinde istatistikleri yükle
document.addEventListener('DOMContentLoaded', () => {
    console.log('🔧 Admin panel başlatılıyor...');
    loadStats();
    loadScripts();
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
        filename: formData.get('script-filename') || document.getElementById('script-filename').value,
        content: formData.get('script-content') || document.getElementById('script-content').value
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

// Edit script
function editScript(scriptId) {
    const script = scripts[scriptId];
    if (!script) return;
    
    // Fill the form with current script data
    document.getElementById('script-id').value = scriptId;
    document.getElementById('script-name').value = script.name;
    document.getElementById('script-description').value = script.description;
    document.getElementById('script-filename').value = script.filename;
    document.getElementById('script-content').value = script.content;
    
    // Change form submit handler to update instead of add
    const form = document.getElementById('add-script-form');
    form.onsubmit = (event) => handleUpdateScript(event, scriptId);
    
    // Change button text
    const submitBtn = form.querySelector('button[type="submit"]');
    submitBtn.innerHTML = '<i class="fas fa-save"></i> Script Güncelle';
    
    showNotification('📝 Script düzenleme modu aktif', 'info');
}

// Handle update script
async function handleUpdateScript(event, scriptId) {
    event.preventDefault();
    
    const formData = new FormData(event.target);
    const updates = {
        name: formData.get('script-name') || document.getElementById('script-name').value,
        description: formData.get('script-description') || document.getElementById('script-description').value,
        filename: formData.get('script-filename') || document.getElementById('script-filename').value,
        content: formData.get('script-content') || document.getElementById('script-content').value
    };
    
    try {
        const response = await fetch(`${API_BASE_URL}/admin/update-script`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                adminId: ADMIN_ID,
                scriptId: scriptId,
                updates: updates
            })
        });
        
        if (response.ok) {
            const result = await response.json();
            showNotification('✅ Script başarıyla güncellendi!', 'success');
            resetForm();
            loadScripts();
        } else {
            const error = await response.json();
            throw new Error(error.error || 'Script güncellenemedi');
        }
    } catch (error) {
        console.error('❌ Script güncelleme hatası:', error);
        showNotification('❌ Script güncellenemedi: ' + error.message, 'error');
    }
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

// Reset form to add mode
function resetForm() {
    const form = document.getElementById('add-script-form');
    form.reset();
    form.onsubmit = handleAddScript;
    
    const submitBtn = form.querySelector('button[type="submit"]');
    submitBtn.innerHTML = '<i class="fas fa-plus"></i> Script Ekle';
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
window.resetForm = resetForm;
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
    document.getElementById(modalId).classList.remove('show');
}

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