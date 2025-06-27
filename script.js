// Backend API URL'si
const API_BASE_URL = 'http://localhost:3000/api';

// Telegram Web App Integration
let tg = null;

// Wait for Telegram WebApp to load
function initializeTelegramWebApp() {
    // Check if Telegram WebApp is available
    if (typeof window.Telegram !== 'undefined' && window.Telegram.WebApp) {
        tg = window.Telegram.WebApp;
        tg.ready();
        tg.expand();
        
        // Set theme
        const theme = tg.colorScheme;
        document.documentElement.setAttribute('data-theme', theme);
        
        // Update theme toggle icon
        const themeToggle = document.getElementById('theme-toggle');
        if (themeToggle) {
            const icon = themeToggle.querySelector('i');
            icon.className = theme === 'dark' ? 'fas fa-sun' : 'fas fa-moon';
        }
        
        console.log('✅ Telegram WebApp başlatıldı');
    } else {
        console.log('ℹ️ Telegram WebApp bulunamadı, normal web modunda çalışıyor');
        // Normal web modu için varsayılan tema
        document.documentElement.setAttribute('data-theme', 'light');
    }
    
    // Initialize AdsGram SDK
    initializeAdsGram();
    
    // Load initial stats
    loadStats();
    
    // Show main content
    document.querySelector('.app-container').style.display = 'block';
}

// Load real-time stats from backend
async function loadStats() {
    try {
        const response = await fetch(`${API_BASE_URL}/stats`);
        const stats = await response.json();
        
        // Update UI with real stats
        document.getElementById('total-downloads').textContent = stats.totalDownloads.toLocaleString();
        document.getElementById('active-users').textContent = stats.activeUsers.toLocaleString();
        
        // Update download counts
        downloadCount = stats.totalDownloads;
        activeUsers = stats.activeUsers;
        
    } catch (error) {
        console.error('Stats yüklenirken hata:', error);
        // Fallback to local stats
    }
}

// Send data to backend
async function sendDataToBackend(data) {
    try {
        const userId = tg.initDataUnsafe?.user?.id || 'unknown';
        
        const response = await fetch(`${API_BASE_URL}/download`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                scriptType: data.script,
                userId: userId,
                timestamp: Date.now()
            })
        });
        
        const result = await response.json();
        
        if (result.success) {
            // Update local stats
            downloadCount = result.stats.totalDownloads;
            document.getElementById('total-downloads').textContent = downloadCount.toLocaleString();
            
            // Send data to Telegram bot
            sendDataToBot(data);
        }
        
    } catch (error) {
        console.error('Backend\'e veri gönderirken hata:', error);
        // Fallback to Telegram only
        sendDataToBot(data);
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
let downloadCount = 1234;
let activeUsers = 0; // API'den gelecek

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
    btn.addEventListener('click', (e) => {
        const scriptType = e.target.closest('.script-card').dataset.script;
        currentScript = scriptType;
        showAdModal();
    });
});

// Show Ad Modal
function showAdModal() {
    adModal.classList.add('show');
    startAdTimer();
}

// Start Ad Timer
function startAdTimer() {
    let timeLeft = 30;
    const progressStep = 100 / 30;
    let progress = 0;
    
    timer.textContent = timeLeft;
    progressFill.style.width = '0%';
    
    adTimer = setInterval(() => {
        timeLeft--;
        progress += progressStep;
        
        timer.textContent = timeLeft;
        progressFill.style.width = progress + '%';
        
        if (timeLeft <= 0) {
            clearInterval(adTimer);
            hideAdModal();
            showAdsGramAd();
        }
    }, 1000);
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
    
    // Update download count
    downloadCount++;
    totalDownloadsElement.textContent = downloadCount.toLocaleString();
    
    // Show success message
    showNotification('Script başarıyla indirildi!', 'success');
    
    // Hide modal
    hideDownloadModal();
    
    // Send data to backend
    sendDataToBackend({
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
    // API'den güncel istatistikleri al
    fetch('/api/stats')
        .then(response => response.json())
        .then(stats => {
            downloadCount = stats.totalDownloads;
            activeUsers = stats.activeUsers;
            
            totalDownloadsElement.textContent = downloadCount.toLocaleString();
            activeUsersElement.textContent = activeUsers.toLocaleString();
        })
        .catch(error => {
            console.error('İstatistikler yüklenirken hata:', error);
        });
}

// Update stats every 30 seconds
setInterval(updateStats, 30000);

// Initialize stats
totalDownloadsElement.textContent = downloadCount.toLocaleString();
activeUsersElement.textContent = activeUsers.toLocaleString();

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

// Send data to Telegram bot
function sendDataToBot(data) {
    if (tg && tg.initData) {
        // Add initData for authentication
        data.initData = tg.initData;
        data.timestamp = Date.now();
        
        console.log('Sending data to bot:', data);
        tg.sendData(JSON.stringify(data));
    } else {
        console.error('Telegram WebApp not available or no initData');
        showNotification('Telegram WebApp bağlantısı bulunamadı', 'error');
    }
}

console.log('VPN Script Hub loaded successfully!'); 