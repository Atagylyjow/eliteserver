document.addEventListener('DOMContentLoaded', () => {
    // ---- CONFIGURATION ----
    const API_BASE_URL = '/api'; // Using relative path
    const ADMIN_ID = 7749779502; // IMPORTANT: Replace with your actual Telegram Admin ID

    // ---- STATE ----
    let scripts = [];
    let users = [];
    let adSettings = {};

    // ---- SELECTORS ----
    const statsElements = {
        totalDownloads: document.getElementById('total-downloads'),
        totalUsers: document.getElementById('total-users'),
        totalScripts: document.getElementById('total-scripts'),
    };
    const adSettingsForm = document.getElementById('ad-settings-form');
    const scriptsListContainer = document.getElementById('scripts-list');
    const usersListContainer = document.getElementById('users-list');
    const scriptModal = document.getElementById('script-modal');
    const scriptForm = document.getElementById('script-form');
    const modalTitle = document.getElementById('modal-title');
    
    // ---- API HELPERS ----
    const apiRequest = async (endpoint, method = 'GET', body = null) => {
        const url = `${API_BASE_URL}${endpoint}`;
        const headers = { 'Content-Type': 'application/json', 'X-User-ID': ADMIN_ID.toString() };
        const options = {
            method,
            headers,
        };
        if (body) {
            options.body = JSON.stringify(body);
        }
        try {
            const response = await fetch(url, options);
            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.error || `HTTP error! Status: ${response.status}`);
            }
            return await response.json();
        } catch (error) {
            console.error(`API Error on ${method} ${endpoint}:`, error);
            alert(`Hata: ${error.message}`);
            throw error;
        }
    };

    // ---- DATA LOADING & RENDERING ----
    const loadAllData = async () => {
        try {
            const [stats, ads, loadedScripts, loadedUsers] = await Promise.all([
                apiRequest('/stats'),
                apiRequest('/settings/ads'),
                apiRequest('/scripts'),
                apiRequest('/admin/users'),
            ]);

            // Render Stats
            statsElements.totalDownloads.textContent = stats.totalDownloads || 0;
            statsElements.totalUsers.textContent = stats.totalUsers || 0;
            statsElements.totalScripts.textContent = stats.totalScripts || 0;
            
            // Render Ad Settings
            adSettings = ads;
            if (adSettingsForm) {
                adSettingsForm.frequency.value = adSettings.frequency || '';
                adSettingsForm.capping.value = adSettings.capping || '';
                adSettingsForm.interval.value = adSettings.interval || '';
                adSettingsForm.timeout.value = adSettings.timeout || '';
            }

            // Render Scripts
            scripts = loadedScripts;
            scriptsListContainer.innerHTML = '';
            scripts.forEach(script => scriptsListContainer.appendChild(createScriptElement(script)));
            
            // Render Users
            users = loadedUsers;
            usersListContainer.innerHTML = '';
            users.forEach(user => usersListContainer.appendChild(createUserElement(user)));

        } catch (error) {
            console.error("Veri yüklenirken hata oluştu:", error);
        }
    };

    const createScriptElement = (script) => {
    const div = document.createElement('div');
    div.className = 'script-item';
    div.innerHTML = `
        <div class="script-header">
                <strong class="script-name">${script.name}</strong>
            <div class="script-status ${script.enabled ? 'status-enabled' : 'status-disabled'}">
                    ${script.enabled ? 'Aktif' : 'Pasif'}
                </div>
            </div>
            <p class="script-description">${script.description || 'Açıklama yok.'}</p>
            <small class="script-filename">Dosya: ${script.filename}</small>
        <div class="script-actions">
                <button class="btn-admin btn-primary" onclick="window.openScriptModal('${script._id}')"><i class="fas fa-edit"></i> Düzenle</button>
                <button class="btn-admin btn-secondary" onclick="window.toggleScript('${script._id}')"><i class="fas fa-power-off"></i> Durum Değiştir</button>
                <button class="btn-admin btn-danger" onclick="window.deleteScript('${script._id}')"><i class="fas fa-trash"></i> Sil</button>
        </div>
    `;
        return div;
    };
    
    const createUserElement = (user) => {
        const div = document.createElement('div');
        div.className = 'user-item';
        const joinDate = new Date(user.joinDate).toLocaleDateString('tr-TR');
        div.innerHTML = `
            <p><strong>Kullanıcı:</strong> ${user.firstName || 'Bilinmiyor'} (@${user.username || 'yok'})</p>
            <p><strong>ID:</strong> ${user.userId}</p>
            <p><strong>Jeton:</strong> ${user.coins || 0}</p>
            <p><strong>Katılım:</strong> ${joinDate}</p>
            <button class="btn-admin btn-primary btn-small" onclick="window.addCoinsToUser('${user.userId}')">
                <i class="fas fa-coins"></i> Jeton Ekle
            </button>
        `;
    return div;
    };


    // ---- EVENT HANDLERS & MODAL LOGIC ----
    
    // Ad Ayarlarını Kaydet
    adSettingsForm.addEventListener('submit', async (e) => {
    e.preventDefault();
        const settings = {
            frequency: parseInt(adSettingsForm.frequency.value, 10),
            capping: adSettingsForm.capping.value,
            interval: adSettingsForm.interval.value,
            timeout: adSettingsForm.timeout.value,
        };
        try {
            await apiRequest('/admin/settings/ads', 'POST', { settings });
            alert('Reklam ayarları başarıyla güncellendi!');
            loadAllData();
        } catch (error) {
            // Error is already alerted by apiRequest
        }
    });

    // Script Formunu Kaydet (Ekleme/Düzenleme)
    scriptForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        const scriptId = scriptForm.id.value;
        const body = {
            name: scriptForm.name.value,
            filename: scriptForm.filename.value,
            description: scriptForm.description.value,
            content: scriptForm.content.value,
        };

        try {
            if (scriptId) {
                await apiRequest(`/admin/scripts/${scriptId}`, 'PUT', body);
                alert('Script başarıyla güncellendi!');
        } else {
                await apiRequest('/admin/scripts', 'POST', body);
                alert('Script başarıyla eklendi!');
            }
            closeScriptModal();
            loadAllData();
        } catch (error) {
           // Error is already alerted by apiRequest
        }
    });

    // ---- GLOBAL FUNCTIONS (for inline onlick handlers) ----
    window.openScriptModal = (scriptId = null) => {
        scriptForm.reset();
        if (scriptId) {
            modalTitle.textContent = 'Script Düzenle';
            const script = scripts.find(s => s._id === scriptId);
            if (script) {
                scriptForm.id.value = script._id;
                scriptForm.name.value = script.name;
                scriptForm.filename.value = script.filename;
                scriptForm.description.value = script.description;
                scriptForm.content.value = script.content;
            }
        } else {
            modalTitle.textContent = 'Yeni Script Ekle';
            scriptForm.id.value = '';
        }
        scriptModal.style.display = 'flex';
    };

    window.closeScriptModal = () => {
        scriptModal.style.display = 'none';
    };

    window.deleteScript = async (scriptId) => {
        if (confirm('Bu scripti silmek istediğinizden emin misiniz? Bu işlem geri alınamaz.')) {
            try {
                await apiRequest(`/admin/scripts/${scriptId}`, 'DELETE');
                alert('Script başarıyla silindi.');
                loadAllData();
    } catch (error) {
                // Error is already alerted by apiRequest
            }
        }
    };
    
    window.toggleScript = async (scriptId) => {
         if (confirm('Scriptin durumunu değiştirmek istediğinizden emin misiniz?')) {
            try {
                await apiRequest(`/admin/scripts/toggle/${scriptId}`, 'POST');
                alert('Script durumu başarıyla değiştirildi.');
                loadAllData();
            } catch (error) {
                 // Error is already alerted by apiRequest
            }
        }
    };
    
    window.addCoinsToUser = async (userId) => {
        const amount = prompt(`Kullanıcı ${userId} için eklenecek jeton miktarını girin:`);
        if (amount && !isNaN(amount) && parseInt(amount, 10) > 0) {
            try {
                await apiRequest('/admin/add-coins', 'POST', { userId, amount: parseInt(amount, 10) });
                alert('Jetonlar başarıyla eklendi.');
                loadAllData();
    } catch (error) {
                 // Error is already alerted by apiRequest
            }
        } else if(amount) {
            alert('Lütfen geçerli bir sayı girin.');
        }
    };

    // Close modal if clicked outside
    window.onclick = (event) => {
        if (event.target === scriptModal) {
            closeScriptModal();
        }
    };

    // ---- INITIALIZATION ----
    loadAllData();
});