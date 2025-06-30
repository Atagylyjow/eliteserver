document.addEventListener('DOMContentLoaded', () => {
    // --- CONFIG & STATE ---
    const API_BASE_URL = '/api';
    let tg = window.Telegram.WebApp;
    tg.expand(); 

    let user = tg.initDataUnsafe?.user;
    let adSettings = {};
    let scripts = [];

    // --- DOM ELEMENTS ---
    const scriptsContainer = document.getElementById('scripts-grid-container');
    const themeToggle = document.getElementById('theme-toggle');

    // --- ICON MAPPING ---
    const ICONS = {
        darktunnel: 'fa-tunnel-vision',
        httpcustom: 'fa-globe',
        npvtunnel: 'fa-network-wired',
        shadowsocks: 'fa-user-secret',
        default: 'fa-shield-alt'
    };
    
    // --- FUNCTIONS ---

    const showLoading = () => {
        if (scriptsContainer) {
            scriptsContainer.innerHTML = '<div class="loading">Yükleniyor...</div>';
        }
    };
    
    const showError = (message) => {
        if (scriptsContainer) {
            scriptsContainer.innerHTML = `<div class="error-message">${message}</div>`;
        }
    };

    const fetchConfig = async () => {
        showLoading();
        try {
            const response = await fetch(`${API_BASE_URL}/config`);
            if (!response.ok) {
                throw new Error(`Sunucu hatası: ${response.status}`);
            }
            const data = await response.json();
            if (data.success) {
                adSettings = data.adSettings;
                scripts = data.scripts;
                renderScripts();
            } else {
                showError(data.message || 'Konfigürasyon yüklenemedi.');
            }
        } catch (error) {
            console.error('Config fetch hatası:', error);
            showError('Scriptler yüklenirken bir hata oluştu. Lütfen daha sonra tekrar deneyin.');
        }
    };

    const renderScripts = () => {
        if (!scriptsContainer) return;
        
        scriptsContainer.innerHTML = ''; // Temizle

        if (scripts.length === 0) {
            scriptsContainer.innerHTML = '<p>Şu anda indirilebilir script bulunmamaktadır.</p>';
            return;
        }

        scripts.forEach(script => {
            const iconClass = ICONS[script.type] || ICONS.default;
            const card = document.createElement('div');
            card.className = 'script-card';
            card.innerHTML = `
                <div class="script-icon">
                    <i class="fas ${iconClass}"></i>
                </div>
                <div class="script-info">
                    <h3>${script.name}</h3>
                    <p>${script.description || 'Bu script için açıklama bulunmamaktadır.'}</p>
                </div>
                <div class="script-action">
                    <button class="btn btn-primary download-btn">
                        <i class="fas fa-download"></i>
                        İndir
                    </button>
                </div>
            `;
            
            const downloadBtn = card.querySelector('.download-btn');
            downloadBtn.addEventListener('click', (e) => {
                e.stopPropagation();
                handleDownload(script);
            });

            scriptsContainer.appendChild(card);
        });
    };

    const handleDownload = async (script) => {
        try {
            // İndirme işlemini sunucuya bildir
            await fetch(`${API_BASE_URL}/download/${script._id}`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ userId: user?.id })
            });

            // Gerçek indirme işlemini tetikle
            const blob = new Blob([script.content], { type: 'text/plain;charset=utf-8' });
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = script.filename;
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
            URL.revokeObjectURL(url);
            
            tg.HapticFeedback.notificationOccurred('success');
            tg.showPopup({
                title: 'Başarılı!',
                message: `${script.name} scripti başarıyla indirildi.`,
                buttons: [{ type: 'ok' }]
            });

        } catch (error) {
            console.error('İndirme hatası:', error);
            tg.HapticFeedback.notificationOccurred('error');
             tg.showPopup({
                title: 'Hata!',
                message: `Script indirilirken bir sorun oluştu: ${error.message}`,
                buttons: [{ type: 'ok' }]
            });
        }
    };
    
    // --- THEME ---
    const applyTheme = (theme) => {
        document.body.className = theme;
        themeToggle.className = theme === 'dark-mode' ? 'fas fa-sun' : 'fas fa-moon';
        localStorage.setItem('theme', theme);
    };

    themeToggle.addEventListener('click', () => {
        const newTheme = document.body.classList.contains('dark-mode') ? 'light-mode' : 'dark-mode';
        applyTheme(newTheme);
    });


    // --- INITIALIZATION ---
    const savedTheme = localStorage.getItem('theme') || 'dark-mode';
    applyTheme(savedTheme);
    fetchConfig();
});