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
    
    console.log('🔧 AdsGram başlatılıyor...');
    // Initialize AdsGram SDK
    initializeAdsGram();
    
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
        // Backend yoksa varsayılan değerleri kullan
        console.log('📊 İstatistikler yükleniyor...');
        
        // Varsayılan değerleri ayarla
        document.getElementById('total-downloads').textContent = downloadCount.toLocaleString();
        document.getElementById('active-users').textContent = activeUsers.toLocaleString();
        
        console.log('✅ İstatistikler yüklendi');
        
    } catch (error) {
        console.error('Stats yüklenirken hata:', error);
        // Fallback to local stats
        document.getElementById('total-downloads').textContent = downloadCount.toLocaleString();
        document.getElementById('active-users').textContent = activeUsers.toLocaleString();
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

// AdsGram Controller
let AdController = null;

// Initialize AdsGram SDK
function initializeAdsGram() {
    try {
        console.log('🔧 AdsGram SDK başlatılıyor...');
        console.log('📋 Block ID:', 'int-12280');
        
        // 🔥 BURAYA KENDİ BLOCK ID'NİZİ YAZIN 🔥
        // Örnek: "abc123def456" (tırnak işaretleri olmadan)
        AdController = window.Adsgram.init({ 
            blockId: "int-12280" 
        });
        
        console.log('✅ AdsGram SDK başarıyla başlatıldı');
        console.log('🎮 AdController:', AdController);
        
    } catch (error) {
        console.error('❌ AdsGram SDK başlatılamadı:', error);
        console.error('🔍 Hata detayları:', {
            message: error.message,
            stack: error.stack,
            windowAdsgram: !!window.Adsgram
        });
    }
}

// Reklam gösterme fonksiyonu
async function showAd() {
    console.log('🎬 Reklam gösterme başlatılıyor...');
    
    if (!AdController) {
        console.error('❌ AdsGram Controller bulunamadı');
        console.error('🔍 AdController durumu:', AdController);
        return false;
    }
    
    console.log('✅ AdController bulundu, reklam gösteriliyor...');
    
    try {
        console.log('📺 Reklam yükleniyor...');
        const result = await AdController.show();
        
        console.log('📊 Reklam sonucu:', result);
        console.log('📈 Reklam durumu:', {
            done: result.done,
            description: result.description,
            state: result.state,
            error: result.error
        });
        
        if (result.done) {
            console.log('✅ Kullanıcı reklamı tamamladı');
            return true;
        } else {
            console.log('❌ Kullanıcı reklamı tamamlamadı');
            return false;
        }
    } catch (error) {
        console.error('❌ Reklam gösterme hatası:', error);
        console.error('🔍 Hata detayları:', {
            message: error.message,
            stack: error.stack,
            type: error.constructor.name
        });
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
        description: 'Gelişmiş tünel teknolojisi ile güvenli bağlantı sağlar. Yüksek hız ve kararlılık sunar.',
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
        description: 'HTTP/HTTPS protokolü ile özelleştirilebilir bağlantı. Çoklu protokol desteği.',
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
const copyBtn = document.getElementById('copy-btn');
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
console.log('📋 Copy btn:', !!copyBtn);
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
    console.log('📺 Ad modal elementi:', adModal);
    
    if (adModal) {
        adModal.classList.add('show');
        console.log('✅ Ad modal show class eklendi');
        
        // 30 saniye timer yerine direkt AdsGram reklamını göster
        setTimeout(() => {
            hideAdModal();
            showAdsGramAd();
        }, 1000); // 1 saniye sonra direkt reklam göster
        
    } else {
        console.error('❌ Ad modal elementi bulunamadı!');
        // Fallback: direkt AdsGram reklamını göster
        console.log('🔄 Fallback: Direkt AdsGram reklamı gösteriliyor...');
        showAdsGramAd();
    }
}

// Hide Ad Modal
function hideAdModal() {
    adModal.classList.remove('show');
    if (adTimer) {
        clearInterval(adTimer);
    }
}

// Show AdsGram Ad
async function showAdsGramAd() {
    try {
        // Reklam gösterme butonunu devre dışı bırak
        const downloadBtn = document.getElementById('download-btn');
        if (downloadBtn) {
            downloadBtn.disabled = true;
            downloadBtn.textContent = 'Reklam Yükleniyor...';
        }
        
        // AdsGram reklamını göster
        const adWatched = await showAd();
        
        if (adWatched) {
            // Kullanıcı reklamı tamamladı
            showNotification('✅ Reklam tamamlandı! Script indiriliyor...', 'success');
            showDownloadModal();
        } else {
            // Kullanıcı reklamı tamamlamadı
            showNotification('❌ Reklam tamamlanmadı. Lütfen tekrar deneyin.', 'error');
            
            // Butonu tekrar aktif et
            if (downloadBtn) {
                downloadBtn.disabled = false;
                downloadBtn.textContent = 'İndir';
            }
        }
    } catch (error) {
        console.error('Reklam gösterme hatası:', error);
        showNotification('❌ Reklam yüklenirken hata oluştu.', 'error');
        
        // Butonu tekrar aktif et
        const downloadBtn = document.getElementById('download-btn');
        if (downloadBtn) {
            downloadBtn.disabled = false;
            downloadBtn.textContent = 'İndir';
        }
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

// Copy Button
copyBtn.addEventListener('click', () => {
    const script = vpnScripts[currentScript];
    copyToClipboard(script.content);
    
    // Show success message
    showNotification('Script panoya kopyalandı!', 'success');
});

// Download Script Function
function downloadScript(script) {
    const blob = new Blob([script.content], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = script.filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    
    // Update download count - daha gerçekçi artış
    const increase = Math.floor(Math.random() * 5) + 1; // 1-5 arası artış
    downloadCount += increase;
    
    if (totalDownloadsElement) {
        totalDownloadsElement.textContent = downloadCount.toLocaleString();
    }
    
    console.log('📈 İndirme sayısı artırıldı:', {
        artış: increase,
        yeniToplam: downloadCount
    });
    
    // Show success message
    showNotification(`Script başarıyla indirildi! (+${increase} indirme)`, 'success');
    
    // Hide modal
    hideDownloadModal();
    
    // Send data to backend
    sendDataToBot({
        script: currentScript,
        timestamp: Date.now()
    });
}

// Copy to Clipboard Function
function copyToClipboard(text) {
    if (navigator.clipboard) {
        navigator.clipboard.writeText(text);
    } else {
        // Fallback for older browsers
        const textArea = document.createElement('textarea');
        textArea.value = text;
        document.body.appendChild(textArea);
        textArea.select();
        document.execCommand('copy');
        document.body.removeChild(textArea);
    }
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
function updateStats() {
    // Rastgele artış/azalış
    const downloadChange = Math.floor(Math.random() * 10) - 2; // -2 ile +7 arası
    const userChange = Math.floor(Math.random() * 5) - 1; // -1 ile +3 arası
    
    downloadCount = Math.max(500, downloadCount + downloadChange);
    activeUsers = Math.max(50, activeUsers + userChange);
    
    // UI'yi güncelle
    if (totalDownloadsElement) {
        totalDownloadsElement.textContent = downloadCount.toLocaleString();
    }
    if (activeUsersElement) {
        activeUsersElement.textContent = activeUsers.toLocaleString();
    }
    
    console.log('📊 İstatistikler güncellendi:', {
        downloads: downloadCount,
        users: activeUsers,
        downloadChange: downloadChange,
        userChange: userChange
    });
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