// Backend API URL'si
const API_BASE_URL = 'http://localhost:3000/api';

// Telegram Web App Integration
let tg = null;

// Wait for Telegram WebApp to load
function initializeTelegramWebApp() {
    console.log('🚀 initializeTelegramWebApp başlatılıyor...');
    console.log('🔍 window.Telegram:', typeof window.Telegram);
    console.log('🔍 window.Telegram.WebApp:', typeof window.Telegram?.WebApp);
    
    // Check if Telegram WebApp is available
    if (typeof window.Telegram !== 'undefined' && window.Telegram.WebApp) {
        console.log('✅ Telegram WebApp bulundu, başlatılıyor...');
        
        try {
            tg = window.Telegram.WebApp;
            console.log('📱 Telegram WebApp objesi:', tg);
            
            tg.ready();
            console.log('✅ tg.ready() çağrıldı');
            
            tg.expand();
            console.log('✅ tg.expand() çağrıldı');
            
            // Set theme
            const theme = tg.colorScheme;
            console.log('🎨 Tema:', theme);
            document.documentElement.setAttribute('data-theme', theme);
            
            // Update theme toggle icon
            const themeToggle = document.getElementById('theme-toggle');
            if (themeToggle) {
                const icon = themeToggle.querySelector('i');
                icon.className = theme === 'dark' ? 'fas fa-sun' : 'fas fa-moon';
                console.log('✅ Tema toggle güncellendi');
            }
            
            console.log('✅ Telegram WebApp başarıyla başlatıldı');
        } catch (error) {
            console.error('❌ Telegram WebApp başlatılırken hata:', error);
        }
    } else {
        console.log('ℹ️ Telegram WebApp bulunamadı, normal web modunda çalışıyor');
        // Normal web modu için varsayılan tema
        document.documentElement.setAttribute('data-theme', 'light');
    }
    
    console.log('🔧 Monetag başlatılıyor...');
    // Initialize Monetag SDK
    initializeMonetag();
    
    console.log('📊 İstatistikler yükleniyor...');
    // Load initial stats
    loadStats();
    
    console.log('👁️ App container kontrol ediliyor...');
    // Show main content
    const appContainer = document.querySelector('.app-container');
    console.log('🔍 App container bulundu:', !!appContainer);
    
    if (appContainer) {
        // Zorla görünür hale getir
        appContainer.style.display = 'flex';
        appContainer.style.visibility = 'visible';
        appContainer.style.opacity = '1';
        appContainer.style.position = 'relative';
        appContainer.style.zIndex = '1';
        
        console.log('✅ App container görünür hale getirildi');
        
        // Ek kontrol
        console.log('🔍 App container display style:', appContainer.style.display);
        console.log('🔍 App container visibility:', appContainer.style.visibility);
        console.log('🔍 App container opacity:', appContainer.style.opacity);
        
        // Body'yi de kontrol et
        document.body.style.background = 'var(--bg-primary)';
        document.body.style.color = 'var(--text-primary)';
        console.log('✅ Body stilleri güncellendi');
        
    } else {
        console.error('❌ App container bulunamadı');
        
        // Alternatif olarak body'ye içerik ekle
        document.body.innerHTML = `
            <div class="app-container" style="display: flex; flex-direction: column; min-height: 100vh; background: var(--bg-primary); color: var(--text-primary);">
                <h1>VPN Script Hub</h1>
                <p>Uygulama yükleniyor...</p>
            </div>
        `;
        console.log('⚠️ Alternatif app container oluşturuldu');
    }
    
    console.log('🎉 initializeTelegramWebApp tamamlandı');
}

// Load real-time stats from backend
async function loadStats() {
    try {
        console.log('📊 Backend\'den istatistikler yükleniyor...');
        
        const response = await fetch(`${API_BASE_URL}/stats`);
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        
        const stats = await response.json();
        console.log('📈 Backend istatistikleri:', stats);
        
        // Gerçek verileri kullan
        downloadCount = stats.totalDownloads || 0;
        activeUsers = stats.activeUsers || 0;
        const totalUsers = stats.totalUsers || 0;
        
        // UI'yi güncelle
        if (totalDownloadsElement) {
            totalDownloadsElement.textContent = downloadCount.toLocaleString();
        }
        if (activeUsersElement) {
            activeUsersElement.textContent = activeUsers.toLocaleString();
        }
        
        // Toplam kullanıcı sayısını da göster (yeni element ekleyelim)
        const totalUsersElement = document.getElementById('total-users');
        if (totalUsersElement) {
            totalUsersElement.textContent = totalUsers.toLocaleString();
        }
        
        console.log('✅ İstatistikler backend\'den yüklendi:', {
            downloads: downloadCount,
            activeUsers: activeUsers,
            totalUsers: totalUsers
        });
        
    } catch (error) {
        console.error('❌ Backend\'den istatistikler yüklenirken hata:', error);
        
        // Fallback: varsayılan değerler
        console.log('🔄 Fallback değerleri kullanılıyor...');
        downloadCount = Math.floor(Math.random() * 1000) + 500;
        activeUsers = Math.floor(Math.random() * 100) + 50;
        
        if (totalDownloadsElement) {
            totalDownloadsElement.textContent = downloadCount.toLocaleString();
        }
        if (activeUsersElement) {
            activeUsersElement.textContent = activeUsers.toLocaleString();
        }
    }
}

// Send data to Telegram bot
function sendDataToBot(data) {
    if (tg && tg.sendData) {
        try {
            tg.sendData(JSON.stringify(data));
            console.log('✅ Veri Telegram bot\'a gönderildi:', data);
        } catch (error) {
            console.error('❌ Telegram bot\'a veri gönderilemedi:', error);
        }
    } else {
        console.log('ℹ️ Telegram bot bağlantısı yok, veri gönderilmedi');
    }
}

// Initialize when DOM is loaded
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initializeTelegramWebApp);
} else {
    initializeTelegramWebApp();
}

// Also try to initialize after a short delay (in case Telegram WebApp loads later)
setTimeout(initializeTelegramWebApp, 1000);

// Periyodik istatistik güncellemesi
setInterval(updateStats, 30000); // Her 30 saniyede bir güncelle

// Monetag Controller
let monetagReady = false;
let monetagPreloaded = false;

// Initialize Monetag SDK
function initializeMonetag() {
    try {
        console.log('🔧 Monetag SDK başlatılıyor...');
        console.log('📋 Zone ID:', '9499819');
        
        // Telegram WebApp SDK'yı hazırla
        if (window.Telegram && window.Telegram.WebApp) {
            window.Telegram.WebApp.ready();
            console.log('✅ Telegram WebApp SDK hazır');
        }
        
        // Monetag SDK'nın yüklenmesini bekle
        const checkMonetag = setInterval(() => {
            if (window.show_9499819) {
                clearInterval(checkMonetag);
                monetagReady = true;
                console.log('✅ Monetag SDK başarıyla yüklendi');
                preloadMonetagAd();
            }
        }, 100);
        
        // 10 saniye sonra timeout
        setTimeout(() => {
            if (!monetagReady) {
                clearInterval(checkMonetag);
                console.error('❌ Monetag SDK yüklenemedi');
            }
        }, 10000);
        
    } catch (error) {
        console.error('❌ Monetag SDK başlatılamadı:', error);
    }
}

// Monetag reklamını preload et
async function preloadMonetagAd() {
    if (!monetagReady) {
        console.error('❌ Monetag SDK henüz hazır değil');
        return;
    }
    
    try {
        console.log('📦 Monetag reklamı preload ediliyor...');
        await window.show_9499819({ 
            type: 'preload', 
            ymid: generateUserId() 
        });
        monetagPreloaded = true;
        console.log('✅ Monetag reklamı preload edildi');
    } catch (error) {
        console.error('❌ Monetag reklamı preload edilemedi:', error);
    }
}

// Kullanıcı ID'si oluştur
function generateUserId() {
    // Telegram user ID varsa onu kullan
    if (window.Telegram && window.Telegram.WebApp && window.Telegram.WebApp.initDataUnsafe && window.Telegram.WebApp.initDataUnsafe.user) {
        return `tg_${window.Telegram.WebApp.initDataUnsafe.user.id}`;
    }
    
    // Session ID kullan
    if (!window.sessionUserId) {
        window.sessionUserId = 'user_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
    }
    return window.sessionUserId;
}

// Monetag reklamını göster
async function showMonetagAd() {
    if (!monetagReady) {
        console.error('❌ Monetag SDK henüz hazır değil');
        return false;
    }
    
    try {
        console.log('📺 Monetag reklamı gösteriliyor...');
        const userId = generateUserId();
        
        const result = await window.show_9499819({ 
            ymid: userId 
        });
        
        console.log('✅ Monetag reklamı başarıyla tamamlandı');
        console.log('👤 User ID:', userId);
        
        return true;
    } catch (error) {
        console.error('❌ Monetag reklamı gösterilemedi:', error);
        return false;
    }
}

// App State
let currentScript = null;
let adTimer = null;
let downloadCount = Math.floor(Math.random() * 1000) + 500; // 500-1500 arası rastgele
let activeUsers = Math.floor(Math.random() * 100) + 50; // 50-150 arası rastgele

// VPN Script Data
const vpnScripts = {
    darktunnel: {
        name: 'DarkTunnel',
        description: 'Gelişmiş tünel teknolojisi ile güvenli bağlantı',
        content: `# DarkTunnel VPN Configuration
# Server: premium.darktunnel.com
# Port: 443
# Protocol: TLS

[General]
loglevel = notify
interface = 127.0.0.1
port = 1080
socks-interface = 127.0.0.1
socks-port = 1081
http-interface = 127.0.0.1
http-port = 1082

[Proxy]
Type = Shadowsocks
Server = premium.darktunnel.com
Port = 443
Method = chacha20-ietf-poly1305
Password = your_password_here

[Proxy Group]
Proxy = select, auto, fallback
auto = url-test, server-tcp, url = http://www.gstatic.com/generate_204
fallback = fallback, server-tcp, url = http://www.gstatic.com/generate_204

[Rule]
DOMAIN-SUFFIX,google.com,Proxy
DOMAIN-SUFFIX,facebook.com,Proxy
DOMAIN-SUFFIX,twitter.com,Proxy
DOMAIN-SUFFIX,instagram.com,Proxy
DOMAIN-SUFFIX,youtube.com,Proxy
DOMAIN-SUFFIX,netflix.com,Proxy
GEOIP,CN,DIRECT
FINAL,DIRECT`,
        filename: 'darktunnel.conf'
    },
    httpcustom: {
        name: 'HTTP Custom',
        description: 'HTTP/HTTPS protokolü ile özelleştirilebilir bağlantı',
        content: `# HTTP Custom Configuration
# Server: http-custom.example.com
# Port: 80
# Protocol: HTTP

[General]
loglevel = notify
interface = 127.0.0.1
port = 1080
socks-interface = 127.0.0.1
socks-port = 1081
http-interface = 127.0.0.1
http-port = 1082

[Proxy]
Type = HTTP
Server = http-custom.example.com
Port = 80
Username = your_username
Password = your_password

[Proxy Group]
Proxy = select, auto, fallback
auto = url-test, server-tcp, url = http://www.gstatic.com/generate_204
fallback = fallback, server-tcp, url = http://www.gstatic.com/generate_204

[Rule]
DOMAIN-SUFFIX,google.com,Proxy
DOMAIN-SUFFIX,facebook.com,Proxy
DOMAIN-SUFFIX,twitter.com,Proxy
DOMAIN-SUFFIX,instagram.com,Proxy
DOMAIN-SUFFIX,youtube.com,Proxy
DOMAIN-SUFFIX,netflix.com,Proxy
GEOIP,CN,DIRECT
FINAL,DIRECT`,
        filename: 'httpcustom.conf'
    }
};

// DOM Elements
const themeToggle = document.getElementById('theme-toggle');
const adModal = document.getElementById('ad-modal');
const downloadModal = document.getElementById('download-modal');
const modalClose = document.getElementById('modal-close');
const downloadModalClose = document.getElementById('download-modal-close');
const progressFill = document.getElementById('progress-fill');
const timer = document.getElementById('timer');
const downloadBtn = document.getElementById('download-btn');
const downloadScriptName = document.getElementById('download-script-name');
const downloadScriptDesc = document.getElementById('download-script-desc');
const totalDownloadsElement = document.getElementById('total-downloads');
const activeUsersElement = document.getElementById('active-users');

// Debug DOM elements
console.log('🔍 DOM Elementleri kontrol ediliyor...');
console.log('🎨 Theme toggle:', !!themeToggle);
console.log('📺 Ad modal:', !!adModal);
console.log('📥 Download modal:', !!downloadModal);
console.log('❌ Modal close:', !!modalClose);
console.log('❌ Download modal close:', !!downloadModalClose);
console.log('📊 Progress fill:', !!progressFill);
console.log('⏰ Timer:', !!timer);
console.log('⬇️ Download btn:', !!downloadBtn);
console.log('📝 Download script name:', !!downloadScriptName);
console.log('📄 Download script desc:', !!downloadScriptDesc);
console.log('📈 Total downloads:', !!totalDownloadsElement);
console.log('👥 Active users:', !!activeUsersElement);

// Theme Toggle
themeToggle.addEventListener('click', () => {
    const currentTheme = document.documentElement.getAttribute('data-theme');
    const newTheme = currentTheme === 'dark' ? 'light' : 'dark';
    
    document.documentElement.setAttribute('data-theme', newTheme);
    
    // Update icon
    const icon = themeToggle.querySelector('i');
    icon.className = newTheme === 'dark' ? 'fas fa-sun' : 'fas fa-moon';
    
    // Save theme preference
    localStorage.setItem('theme', newTheme);
    
    // Update Telegram Web App theme
    if (tg) {
        tg.setHeaderColor(newTheme === 'dark' ? '#1a1a1a' : '#ffffff');
        tg.setBackgroundColor(newTheme === 'dark' ? '#1a1a1a' : '#ffffff');
    }
});

// Load saved theme
const savedTheme = localStorage.getItem('theme');
if (savedTheme) {
    document.documentElement.setAttribute('data-theme', savedTheme);
    const icon = themeToggle.querySelector('i');
    icon.className = savedTheme === 'dark' ? 'fas fa-sun' : 'fas fa-moon';
}

// Unlock buttons
document.querySelectorAll('.unlock-btn').forEach(btn => {
    console.log('🔗 Unlock button bulundu:', btn);
    btn.addEventListener('click', (e) => {
        console.log('🎯 Unlock button tıklandı!');
        const scriptCard = e.target.closest('.script-card');
        console.log('📋 Script card:', scriptCard);
        
        if (scriptCard) {
            const scriptType = scriptCard.dataset.script;
            console.log('📝 Script type:', scriptType);
            currentScript = scriptType;
            console.log('🎬 Reklam modalı açılıyor...');
            showAdModal();
        } else {
            console.error('❌ Script card bulunamadı!');
        }
    });
});

// Show Ad Modal
function showAdModal() {
    console.log('🎬 showAdModal çağrıldı');
    
    // Direkt Monetag reklamını göster, modal gösterme
    console.log('🔄 Direkt Monetag reklamı gösteriliyor...');
    handleMonetagAd();
}

// Hide Ad Modal
function hideAdModal() {
    adModal.classList.remove('show');
    if (adTimer) {
        clearInterval(adTimer);
    }
}

// Show Monetag Ad (Modal handler)
async function handleMonetagAd() {
    try {
        // Monetag reklamını göster
        const adWatched = await showMonetagAd();
        
        if (adWatched) {
            // Kullanıcı reklamı tamamladı
            showNotification('✅ Reklam tamamlandı! Script indiriliyor...', 'success');
            showDownloadModal();
        } else {
            // Kullanıcı reklamı tamamlamadı
            showNotification('❌ Reklam tamamlanmadı. Lütfen tekrar deneyin.', 'error');
        }
    } catch (error) {
        console.error('Reklam gösterme hatası:', error);
        showNotification('❌ Reklam yüklenirken hata oluştu.', 'error');
    }
}

// Show Download Modal
function showDownloadModal() {
    const script = vpnScripts[currentScript];
    downloadScriptName.textContent = script.name;
    downloadScriptDesc.textContent = script.description;
    downloadModal.classList.add('show');
}

// Hide Download Modal
function hideDownloadModal() {
    downloadModal.classList.remove('show');
}

// Modal Close Events
modalClose.addEventListener('click', hideAdModal);
downloadModalClose.addEventListener('click', hideDownloadModal);

// Close modals when clicking outside
adModal.addEventListener('click', (e) => {
    if (e.target === adModal) {
        hideAdModal();
    }
});

downloadModal.addEventListener('click', (e) => {
    if (e.target === downloadModal) {
        hideDownloadModal();
    }
});

// Download Button
downloadBtn.addEventListener('click', () => {
    const script = vpnScripts[currentScript];
    downloadScript(script);
});

// Download Script Function
async function downloadScript(script) {
    const blob = new Blob([script.content], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = script.filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    
    // Backend'e indirme verisi gönder
    try {
        const userId = tg?.initDataUnsafe?.user?.id || 'unknown';
        
        const response = await fetch(`${API_BASE_URL}/download`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                scriptType: currentScript,
                userId: userId,
                timestamp: Date.now()
            })
        });
        
        if (response.ok) {
            const result = await response.json();
            console.log('✅ İndirme verisi backend\'e gönderildi:', result);
            
            // Backend'den güncel istatistikleri al
            await updateStats();
        }
        
    } catch (error) {
        console.error('❌ Backend\'e indirme verisi gönderilemedi:', error);
    }
    
    // Show success message
    showNotification('Script başarıyla indirildi!', 'success');
    
    // Hide modal
    hideDownloadModal();
    
    // Send data to Telegram bot
    sendDataToBot({
        script: currentScript,
        timestamp: Date.now()
    });
}

// Show Notification Function
function showNotification(message, type = 'info') {
    // Create notification element
    const notification = document.createElement('div');
    notification.className = `notification notification-${type}`;
    notification.innerHTML = `
        <i class="fas fa-${type === 'success' ? 'check-circle' : 'info-circle'}"></i>
        <span>${message}</span>
    `;
    
    // Add styles
    notification.style.cssText = `
        position: fixed;
        top: 20px;
        right: 20px;
        background: var(--bg-card);
        color: var(--text-primary);
        padding: 1rem 1.5rem;
        border-radius: 12px;
        box-shadow: var(--shadow-hover);
        border: 1px solid var(--border-color);
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

// Update Stats Periodically
async function updateStats() {
    try {
        console.log('📊 İstatistikler güncelleniyor...');
        
        const response = await fetch(`${API_BASE_URL}/stats`);
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        
        const stats = await response.json();
        
        // Gerçek verileri kullan
        downloadCount = stats.totalDownloads || 0;
        activeUsers = stats.activeUsers || 0;
        const totalUsers = stats.totalUsers || 0;
        
        // UI'yi güncelle
        if (totalDownloadsElement) {
            totalDownloadsElement.textContent = downloadCount.toLocaleString();
        }
        if (activeUsersElement) {
            activeUsersElement.textContent = activeUsers.toLocaleString();
        }
        
        // Toplam kullanıcı sayısını da göster
        const totalUsersElement = document.getElementById('total-users');
        if (totalUsersElement) {
            totalUsersElement.textContent = totalUsers.toLocaleString();
        }
        
        console.log('✅ İstatistikler güncellendi:', {
            downloads: downloadCount,
            activeUsers: activeUsers,
            totalUsers: totalUsers
        });
        
    } catch (error) {
        console.error('❌ İstatistikler güncellenirken hata:', error);
        // Hata durumunda mevcut değerleri koru
    }
}

// Add some interactive effects
document.querySelectorAll('.script-card').forEach(card => {
    card.addEventListener('mouseenter', () => {
        card.style.transform = 'translateY(-5px) scale(1.02)';
    });
    
    card.addEventListener('mouseleave', () => {
        card.style.transform = 'translateY(0) scale(1)';
    });
});

// Add keyboard shortcuts
document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') {
        hideAdModal();
        hideDownloadModal();
    }
});

// Add loading animation for buttons
document.querySelectorAll('.btn').forEach(btn => {
    btn.addEventListener('click', function() {
        if (this.classList.contains('unlock-btn')) {
            const originalText = this.innerHTML;
            this.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Yükleniyor...';
            this.disabled = true;
            
            setTimeout(() => {
                this.innerHTML = originalText;
                this.disabled = false;
            }, 1000);
        }
    });
});

// Add smooth scrolling for better UX
document.querySelectorAll('a[href^="#"]').forEach(anchor => {
    anchor.addEventListener('click', function (e) {
        e.preventDefault();
        const target = document.querySelector(this.getAttribute('href'));
        if (target) {
            target.scrollIntoView({
                behavior: 'smooth',
                block: 'start'
            });
        }
    });
});

// Add intersection observer for animations
const observerOptions = {
    threshold: 0.1,
    rootMargin: '0px 0px -50px 0px'
};

const observer = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
        if (entry.isIntersecting) {
            entry.target.style.opacity = '1';
            entry.target.style.transform = 'translateY(0)';
        }
    });
}, observerOptions);

// Observe elements for animation
document.querySelectorAll('.script-card, .instruction-step').forEach(el => {
    el.style.opacity = '0';
    el.style.transform = 'translateY(20px)';
    el.style.transition = 'opacity 0.6s ease, transform 0.6s ease';
    observer.observe(el);
});

// Initialize Telegram Web App settings
if (tg) {
    // Set initial colors
    const currentTheme = document.documentElement.getAttribute('data-theme');
    tg.setHeaderColor(currentTheme === 'dark' ? '#1a1a1a' : '#ffffff');
    tg.setBackgroundColor(currentTheme === 'dark' ? '#1a1a1a' : '#ffffff');
    
    // Enable closing confirmation
    tg.enableClosingConfirmation();
    
    // Set main button if needed
    // tg.MainButton.setText('Ana Menü');
    // tg.MainButton.show();
}

console.log('VPN Script Hub loaded successfully!'); 
console.log('VPN Script Hub loaded successfully!'); 