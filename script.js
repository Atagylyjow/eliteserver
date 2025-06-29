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
                themeToggle.className = theme === 'dark' ? 'fas fa-sun' : 'fas fa-moon';
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

// UI Elements
const themeToggle = document.getElementById('theme-toggle');
const coinModal = document.getElementById('coin-modal');
const coinModalClose = document.getElementById('coin-modal-close');
const addCoinsBtn = document.getElementById('add-coins-btn');
const watchAdBtn = document.getElementById('watch-ad-btn');
const userCoinsElement = document.getElementById('user-coins');

// State
let currentScript = null;
let userCoins = 0;
let userId = null;

// Get user ID
function getUserId() {
    if (tg?.initDataUnsafe?.user?.id) {
        return tg.initDataUnsafe.user.id.toString();
    }
    return 'anonymous';
}

// Load user coins
async function loadUserCoins() {
    try {
        userId = getUserId();
        const response = await fetch(`${API_BASE_URL}/user/${userId}/coins`);
        
        if (response.ok) {
            const data = await response.json();
            userCoins = data.coins;
            updateCoinDisplay();
        }
    } catch (error) {
        console.error('❌ Coin yüklenirken hata:', error);
    }
}

// Update coin display
function updateCoinDisplay() {
    if (userCoinsElement) {
        userCoinsElement.textContent = userCoins;
    }
}

// Add coins to user
async function addCoins(amount) {
    try {
        const response = await fetch(`${API_BASE_URL}/user/${userId}/add-coins`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ amount })
        });

        if (response.ok) {
            const data = await response.json();
            userCoins = data.coins;
            updateCoinDisplay();
            showNotification(`✅ ${amount} coin kazandınız!`, 'success');
        }
    } catch (error) {
        console.error('❌ Coin eklenirken hata:', error);
        showNotification('❌ Coin eklenemedi', 'error');
    }
}

// Event Listeners
if (themeToggle) {
    themeToggle.addEventListener('click', () => {
        const currentTheme = document.documentElement.getAttribute('data-theme');
        const newTheme = currentTheme === 'dark' ? 'light' : 'dark';
        
        document.documentElement.setAttribute('data-theme', newTheme);
        
        // Update icon
        themeToggle.className = newTheme === 'dark' ? 'fas fa-sun' : 'fas fa-moon';
        
        // Save theme preference
        localStorage.setItem('theme', newTheme);
        
        // Update Telegram Web App theme
        if (tg) {
            tg.setHeaderColor(newTheme === 'dark' ? '#1a1a1a' : '#ffffff');
            tg.setBackgroundColor(newTheme === 'dark' ? '#1a1a1a' : '#ffffff');
        }
    });
}

// Coin modal event listeners
if (addCoinsBtn) {
    addCoinsBtn.addEventListener('click', () => {
        if (coinModal) {
            coinModal.style.display = 'block';
        }
    });
}

if (coinModalClose) {
    coinModalClose.addEventListener('click', () => {
        if (coinModal) {
            coinModal.style.display = 'none';
        }
    });
}

if (watchAdBtn) {
    watchAdBtn.addEventListener('click', async () => {
        watchAdBtn.disabled = true;
        watchAdBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Reklam Yükleniyor...';
        
        try {
            // Simulate ad watching (replace with actual ad integration)
            await simulateAdWatch();
            
            // Add coins after successful ad watch
            await addCoins(10);
            
            // Close modal
            if (coinModal) {
                coinModal.style.display = 'none';
            }
            
        } catch (error) {
            console.error('❌ Reklam izleme hatası:', error);
            showNotification('❌ Reklam izlenemedi', 'error');
        } finally {
            watchAdBtn.disabled = false;
            watchAdBtn.innerHTML = '<i class="fas fa-play"></i> Reklam İzle';
        }
    });
}

// Simulate ad watching
function simulateAdWatch() {
    return new Promise((resolve, reject) => {
        let progress = 0;
        const duration = 5000; // 5 seconds
        const interval = 100; // Update every 100ms
        
        watchAdBtn.innerHTML = `<i class="fas fa-play"></i> Reklam İzleniyor... (${Math.round(progress)}%)`;
        
        const timer = setInterval(() => {
            progress += (interval / duration) * 100;
            
            if (progress >= 100) {
                clearInterval(timer);
                resolve();
            } else {
                watchAdBtn.innerHTML = `<i class="fas fa-play"></i> Reklam İzleniyor... (${Math.round(progress)}%)`;
            }
        }, interval);
        
        // Allow user to cancel
        const cancelHandler = () => {
            clearInterval(timer);
            reject(new Error('Reklam iptal edildi'));
        };
        
        // Add cancel functionality (optional)
        // watchAdBtn.addEventListener('click', cancelHandler, { once: true });
    });
}

// Functions

// Toggle dark/light mode
function toggleTheme() {
    const currentTheme = document.documentElement.getAttribute('data-theme');
    const newTheme = currentTheme === 'dark' ? 'light' : 'dark';
    
    document.documentElement.setAttribute('data-theme', newTheme);
    
    // Update icon
    themeToggle.className = newTheme === 'dark' ? 'fas fa-sun' : 'fas fa-moon';
    
    // Save theme preference
    localStorage.setItem('theme', newTheme);
    
    // Update Telegram Web App theme
    if (tg) {
        tg.setHeaderColor(newTheme === 'dark' ? '#1a1a1a' : '#ffffff');
        tg.setBackgroundColor(newTheme === 'dark' ? '#1a1a1a' : '#ffffff');
    }
}

// Download Script Function
async function downloadScript(scriptName) {
    try {
        console.log(`🔽 '${scriptName}' scripti indiriliyor...`);

        // Backend'e indirme isteği gönder
        const response = await fetch(`${API_BASE_URL}/download/${scriptName}`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                userId: getUserId()
            })
        });

        if (!response.ok) {
            const errorData = await response.json().catch(() => ({
                message: 'Bilinmeyen sunucu hatası'
            }));
            throw new Error(errorData.message || `HTTP hatası! Durum: ${response.status}`);
        }

        const data = await response.json();

        if (data.url) {
            // Tarayıcıda indirme başlat
            const link = document.createElement('a');
            link.href = data.url;
            link.download = data.script.filename || `${scriptName}.conf`;
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
            
            showNotification(`✅ '${scriptName}' başarıyla indirildi!`, 'success');
        } else {
            throw new Error('İndirme URL\'si alınamadı.');
        }

    } catch (error) {
        console.error('❌ Script indirme hatası:', error);
        showNotification(`❌ Script indirilemedi: ${error.message}`, 'error');
    }
}

// Show notification
function showNotification(message, type = 'info') {
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

// Add some interactive effects
document.querySelectorAll('.script-card').forEach(card => {
    card.addEventListener('mouseenter', () => {
        card.style.transform = 'translateY(-5px) scale(1.02)';
    });
    
    card.addEventListener('mouseleave', () => {
        card.style.transform = 'translateY(0) scale(1)';
    });
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
}

// Load user coins on startup
loadUserCoins();

console.log('VPN Script Hub loaded successfully!'); 