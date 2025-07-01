// Backend API URL'si - Kalıcı sunucu adresi
const API_BASE_URL = 'https://tg-web-app-fg41.onrender.com/api';

console.log('🌐 API Base URL:', API_BASE_URL);
console.log('📍 Current hostname:', window.location.hostname);

// Cache busting - Force reload updated script
// Version: 1.0.1 - Fixed themeToggle errors

// Telegram Web App Integration
let tg = null;

// DOM Elements
let userCoinsElement = null;
let addCoinsBtn = null;
let coinModal = null;
let coinModalClose = null;
let watchAdBtn = null;
let themeToggle = null;

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
            
            // Update theme toggle icon - only if element exists
            const themeToggleElement = document.getElementById('theme-toggle');
            if (themeToggleElement) {
                themeToggleElement.className = theme === 'dark' ? 'fas fa-sun' : 'fas fa-moon';
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

// State
let currentScript = null;
let userCoins = 0;
let userId = null;

// Get user ID after Telegram WebApp is ready
function getUserId() {
    if (userId) return userId; // Return cached ID if available
    
    const tg = window.Telegram?.WebApp;
    if (tg && tg.initDataUnsafe?.user?.id) {
        userId = tg.initDataUnsafe.user.id.toString();
        console.log('✅ Telegram User ID alındı:', userId);
        return userId;
    }
    
    // Try alternative methods to get user ID
    if (tg && tg.initData) {
        try {
            const urlParams = new URLSearchParams(tg.initData);
            const userData = urlParams.get('user');
            if (userData) {
                const user = JSON.parse(decodeURIComponent(userData));
                if (user.id) {
                    userId = user.id.toString();
                    console.log('✅ Telegram User ID (alternative method):', userId);
                    return userId;
                }
            }
        } catch (error) {
            console.warn('⚠️ Alternative user ID method failed:', error);
        }
    }
    
    // If still no user ID, try to get from query parameters
    const urlParams = new URLSearchParams(window.location.search);
    const queryUserId = urlParams.get('user_id') || urlParams.get('user');
    if (queryUserId) {
        userId = queryUserId.toString();
        console.log('✅ User ID from query parameters:', userId);
        return userId;
    }
    
    console.warn('⚠️ Telegram User ID alınamadı, "anonymous" kullanılacak.');
    console.log('🔍 Telegram WebApp objesi:', tg);
    console.log('🔍 initDataUnsafe:', tg?.initDataUnsafe);
    console.log('🔍 initData:', tg?.initData);
    
    return 'anonymous';
}

// Load user coins
async function loadUserCoins() {
    try {
        const currentUserId = getUserId();
        if (currentUserId === 'anonymous') {
            console.log('⚠️ Anonymous kullanıcı, coin yükleme atlanıyor.');
            userCoins = 0;
            updateCoinDisplay();
            return;
        }
        
        console.log(`💰 ${currentUserId} için coinler yükleniyor...`);
        const response = await fetch(`${API_BASE_URL}/user/${currentUserId}/coins?user_id=${currentUserId}`);
        
        if (response.ok) {
            const data = await response.json();
            userCoins = data.coins;
            updateCoinDisplay();
            console.log('✅ Coinler yüklendi:', userCoins);
        } else {
            console.error(`❌ Coin yükleme hatası: ${response.status}`);
            userCoins = 0;
            updateCoinDisplay();
        }
    } catch (error) {
        console.error('❌ Coin yüklenirken bir istisna oluştu:', error);
        userCoins = 0;
        updateCoinDisplay();
    }
}

// Update coin display
function updateCoinDisplay() {
    if (userCoinsElement) {
        userCoinsElement.textContent = userCoins;
    }
    
    // Update button states based on coin balance
    updateButtonStates();
}

// Update button states based on user's coin balance
function updateButtonStates() {
    const buttons = document.querySelectorAll('.unlock-btn');
    
    buttons.forEach(button => {
        const price = parseInt(button.getAttribute('data-price')) || 5;
        
        if (userCoins >= price) {
            // User has enough coins
            button.disabled = false;
            button.classList.remove('btn-disabled');
            button.classList.add('btn-primary', 'btn-secondary');
        } else {
            // User doesn't have enough coins
            button.disabled = true;
            button.classList.add('btn-disabled');
            button.classList.remove('btn-primary', 'btn-secondary');
        }
    });
}

// Add coins to user
async function addCoins(amount) {
    try {
        const currentUserId = getUserId();
        if (currentUserId === 'anonymous') {
            showNotification('❌ Telegram WebApp üzerinden erişim gereklidir.', 'error');
            return;
        }

        const response = await fetch(`${API_BASE_URL}/user/add-coins`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'X-User-ID': currentUserId
            },
            body: JSON.stringify({ amount })
        });

        if (response.ok) {
            const data = await response.json();
            userCoins = data.coins;
            updateCoinDisplay();
            showNotification(`✅ ${amount} coin kazandınız!`, 'success');
            console.log('✅ Coin eklendi:', userCoins);
        } else {
            throw new Error(`HTTP ${response.status}: ${response.statusText}`);
        }
    } catch (error) {
        console.error('❌ Coin eklenirken hata:', error);
        showNotification('❌ Coin eklenemedi: ' + error.message, 'error');
    }
}

// Watch Ad Function
async function watchAd() {
    if (!watchAdBtn) {
        console.error('❌ Watch ad button not found');
        return;
    }

    watchAdBtn.disabled = true;
    watchAdBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Reklam Yükleniyor...';

    try {
        console.log('🎬 Reklam izleme başlatılıyor...');
        
        // Show the rewarded popup ad, but don't wait for it to finish
        showRewardedPopupAd();
        
        // Add coins after 3 seconds, regardless of ad completion
        setTimeout(async () => {
            console.log('💰 3 saniye geçti, coin ekleniyor...');
            await addCoins(1);
            
            // Re-enable the button after coin is added
            watchAdBtn.disabled = false;
            watchAdBtn.innerHTML = '<i class="fas fa-play"></i> Reklam İzle';
        }, 3000); // 3 saniye
        
        // Close the modal immediately
        if (coinModal) {
            coinModal.style.display = 'none';
        }
        
    } catch (error) {
        console.error('❌ Reklam başlatma hatası:', error);
        showNotification('❌ Reklam başlatılamadı: ' + error.message, 'error');
        // Re-enable button on error
        watchAdBtn.disabled = false;
        watchAdBtn.innerHTML = '<i class="fas fa-play"></i> Reklam İzle';
    }
}

// Show Monetag Rewarded Popup Ad
function showRewardedPopupAd() {
    return new Promise((resolve, reject) => {
        // Get user ID for tracking
        const ymid = getUserId();
        
        console.log('🎬 Monetag Rewarded Popup reklamı gösteriliyor...', { ymid });
        
        // Check if Monetag SDK is loaded
        if (typeof window.show_9499819 !== 'function') {
            console.warn('⚠️ Monetag SDK yüklenmedi, simüle ediliyor...');
            // Simulate ad view for testing
            setTimeout(() => {
                console.log('✅ Simüle edilmiş reklam tamamlandı');
                resolve();
            }, 2000); // 2 saniye bekle
            return;
        }
        
        // Add timeout for ad loading
        const timeout = setTimeout(() => {
            console.warn('⚠️ Reklam yükleme zaman aşımı, simüle ediliyor...');
            resolve();
        }, 10000); // 10 saniye timeout
        
        // Show the rewarded popup ad
        window.show_9499819({ 
            type: 'pop',
            ymid: ymid,
            requestVar: 'coin-earning'
        }).then(() => {
            clearTimeout(timeout);
            console.log('✅ Rewarded Popup reklamı başarıyla tamamlandı');
            resolve();
        }).catch((error) => {
            clearTimeout(timeout);
            console.error('❌ Rewarded Popup reklamı hatası:', error);
            console.warn('⚠️ Reklam hatası, simüle ediliyor...');
            // Simulate successful ad view on error
            setTimeout(() => {
                console.log('✅ Hata sonrası simüle edilmiş reklam tamamlandı');
                resolve();
            }, 2000);
        });
    });
}

// Functions

// Toggle dark/light mode
function toggleTheme() {
    const currentTheme = document.documentElement.getAttribute('data-theme') || 'light';
    const newTheme = currentTheme === 'dark' ? 'light' : 'dark';
    
    document.documentElement.setAttribute('data-theme', newTheme);
    
    // Update icon - only if element exists and is properly initialized
    const themeToggleElement = document.getElementById('theme-toggle');
    if (themeToggleElement) {
        themeToggleElement.className = newTheme === 'dark' ? 'fas fa-sun' : 'fas fa-moon';
    }
    
    // Save theme preference
    localStorage.setItem('theme', newTheme);
    
    // Update Telegram Web App theme
    if (tg) {
        tg.setHeaderColor(newTheme === 'dark' ? '#1a1a1a' : '#ffffff');
        tg.setBackgroundColor(newTheme === 'dark' ? '#1a1a1a' : '#ffffff');
    }
}

// Download Script Function
async function downloadScript(scriptId) {
    try {
        console.log(`🔽 '${scriptId}' scripti (ObjectId) işleniyor...`);
        // Check if user is anonymous
        const currentUserId = getUserId();
        if (currentUserId === 'anonymous') {
            showNotification('❌ Telegram WebApp üzerinden erişim gereklidir. Lütfen Telegram bot üzerinden uygulamayı açın.', 'error');
            return;
        }
        // Get the price from the button
        const button = document.querySelector(`[data-script="${scriptId}"]`);
        const price = parseInt(button.getAttribute('data-price')) || 5;
        // Check if user has enough coins
        if (userCoins < price) {
            showNotification(`❌ Yeterli coin yok! ${price} coin gerekli, ${userCoins} coin var.`, 'error');
            return;
        }
        // Script adı ve shadowsocks kontrolü için scripts listesinden bul
        const script = scripts[scriptId];
        if (script && script.name && script.name.toLowerCase().includes('shadowsocks')) {
            await showShadowsocksConfig(price, script);
            return;
        }
        // Deduct coins first
        await deductCoins(price);
        // Download the script
        const response = await fetch(`${API_BASE_URL}/download/${scriptId}?user_id=${currentUserId}`, {
            method: 'GET'
        });
        if (!response.ok) {
            throw new Error(`HTTP ${response.status}: ${response.statusText}`);
        }
        // Get the script content
        const content = await response.text();
        // Get filename from server response - try multiple methods
        let filename = script && script.filename ? script.filename : `${scriptId}.conf`;
        // Method 1: Try to get from Content-Disposition header
        const contentDisposition = response.headers.get('content-disposition');
        if (contentDisposition) {
            const filenameMatch = contentDisposition.match(/filename[^;=\n]*=((['"]).*?\2|[^;\n]*)/);
            if (filenameMatch && filenameMatch[1]) {
                filename = filenameMatch[1].replace(/['"]/g, '');
                console.log('✅ Filename from Content-Disposition:', filename);
            }
        }
        // Method 2: Try to get from response headers
        if (!filename || filename === `${scriptId}.conf`) {
            const serverFilename = response.headers.get('x-filename');
            if (serverFilename) {
                filename = serverFilename;
                console.log('✅ Filename from X-Filename header:', filename);
            }
        }
        console.log('📁 Final filename:', filename);
        // Create a Blob from the script content
        const blob = new Blob([content], { type: 'text/plain;charset=utf-8' });
        // Create an object URL from the Blob
        const url = URL.createObjectURL(blob);
        // Create a temporary link to trigger the download
        const link = document.createElement('a');
        link.href = url;
        link.download = filename;
        document.body.appendChild(link);
        link.click();
        // Clean up
        document.body.removeChild(link);
        URL.revokeObjectURL(url);
        showNotification(`✅ '${filename}' başarıyla satın alındı ve indirildi! (${price} coin düşüldü)`, 'success');
    } catch (error) {
        console.error('❌ Script satın alma hatası:', error);
        showNotification(`❌ Script satın alınamadı: ${error.message}`, 'error');
    }
}

// Deduct coins from user
async function deductCoins(amount) {
    try {
        // Check if user is anonymous
        const currentUserId = getUserId();
        if (currentUserId === 'anonymous') {
            throw new Error('Telegram WebApp üzerinden erişim gereklidir');
        }
        
        // Ensure userId is set
        if (!userId) {
            userId = currentUserId;
        }
        
        console.log('💰 Coin düşülüyor:', { userId, amount });
        
        const response = await fetch(`${API_BASE_URL}/user/${userId}/deduct-coins?user_id=${userId}`, {
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
            console.log('✅ Coin düşüldü:', userCoins);
        } else {
            throw new Error(`HTTP ${response.status}: ${response.statusText}`);
        }
    } catch (error) {
        console.error('❌ Coin düşülürken hata:', error);
        throw error;
    }
}

// Show Shadowsocks Configuration (ObjectId ile)
async function showShadowsocksConfig(price, script) {
    try {
        // Deduct coins first
        await deductCoins(price);
        if (script && script.content) {
            // Create modal to show configuration
            const configModal = document.createElement('div');
            configModal.className = 'modal';
            configModal.style.display = 'block';
            configModal.innerHTML = `
                <div class="modal-content" style="max-width: 600px;">
                    <div class="modal-header">
                        <h3>Shadowsocks Konfigürasyonu</h3>
                        <button class="modal-close" onclick="this.closest('.modal').remove()">
                            <i class="fas fa-times"></i>
                        </button>
                    </div>
                    <div class="modal-body">
                        <div class="config-display">
                            <pre style="background: var(--bg-secondary); padding: 1rem; border-radius: 8px; overflow-x: auto; white-space: pre-wrap; font-family: 'Courier New', monospace; font-size: 0.9rem;">${script.content}</pre>
                        </div>
                    </div>
                </div>
            `;
            document.body.appendChild(configModal);
        } else {
            showNotification('Shadowsocks scripti bulunamadı!', 'error');
        }
    } catch (error) {
        showNotification('Shadowsocks konfigürasyonu gösterilemedi: ' + error.message, 'error');
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

// Initialize DOM elements
function initializeDOMElements() {
    userCoinsElement = document.getElementById('user-coins');
    addCoinsBtn = document.getElementById('add-coins-btn');
    coinModal = document.getElementById('coin-modal');
    coinModalClose = document.getElementById('coin-modal-close');
    watchAdBtn = document.getElementById('watch-ad-btn');
    themeToggle = document.getElementById('theme-toggle');
    
    console.log('🔧 DOM elementleri başlatıldı:', {
        userCoinsElement: !!userCoinsElement,
        addCoinsBtn: !!addCoinsBtn,
        coinModal: !!coinModal,
        coinModalClose: !!coinModalClose,
        watchAdBtn: !!watchAdBtn,
        themeToggle: !!themeToggle
    });
}

// Setup event listeners
function setupEventListeners() {
    console.log('🔧 Event listener\'lar kuruluyor...');
    
    // Theme toggle
    if (themeToggle) {
        themeToggle.addEventListener('click', toggleTheme);
        console.log('✅ Theme toggle listener eklendi');
    }

    // Coin modal event listeners
    if (addCoinsBtn) {
        addCoinsBtn.addEventListener('click', () => {
            if (coinModal) {
                coinModal.style.display = 'block';
                console.log('✅ Coin modal açıldı');
            }
        });
        console.log('✅ Add coins button listener eklendi');
    }

    if (coinModalClose) {
        coinModalClose.addEventListener('click', () => {
            if (coinModal) {
                coinModal.style.display = 'none';
                console.log('✅ Coin modal kapatıldı');
            }
        });
        console.log('✅ Coin modal close listener eklendi');
    }

    // Watch ad button
    if (watchAdBtn) {
        watchAdBtn.addEventListener('click', watchAd);
        console.log('✅ Watch ad button listener eklendi');
    }
    
    // Download button listeners using event delegation
    document.body.addEventListener('click', function(e) {
        const button = e.target.closest('.unlock-btn');
        if (button) {
            e.preventDefault();
            const scriptId = button.getAttribute('data-script');
            if (scriptId) {
                console.log(`🔽 Script indirme isteği: ${scriptId}`);
                downloadScript(scriptId);
            }
        }
    });
    
    console.log('✅ Tüm event listener\'lar kuruldu');
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

// Initialize when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    console.log('🚀 DOM yüklendi, uygulama başlatılıyor...');
    
    // Initialize DOM elements first
    initializeDOMElements();
    
    // Wait for Telegram WebApp to be fully ready
    if (window.Telegram && window.Telegram.WebApp) {
        window.Telegram.WebApp.ready();
    }
    
    // Initialize our application
    initializeTelegramWebApp();
    
    // Set up event listeners
    setupEventListeners();
    
    // Now that the app is ready, get the user ID and load coins
    userId = getUserId();
    loadUserCoins();
    
    // Initialize In-App Interstitial ads
    initializeInAppInterstitial();
    
    console.log('✅ Uygulama başlatma tamamlandı');
});

// Initialize Telegram Web App settings - only if tg exists
if (typeof window.Telegram !== 'undefined' && window.Telegram.WebApp) {
    const tg = window.Telegram.WebApp;
    
    // Set initial colors
    const currentTheme = document.documentElement.getAttribute('data-theme') || 'light';
    tg.setHeaderColor(currentTheme === 'dark' ? '#1a1a1a' : '#ffffff');
    tg.setBackgroundColor(currentTheme === 'dark' ? '#1a1a1a' : '#ffffff');
    
    // Enable closing confirmation
    tg.enableClosingConfirmation();
}

// Initialize In-App Interstitial Ads
function initializeInAppInterstitial() {
    console.log('🎬 In-App Interstitial reklamları başlatılıyor...');
    
    // Check if Monetag SDK is loaded
    if (typeof window.show_9499819 !== 'function') {
        console.warn('⚠️ Monetag SDK henüz yüklenmedi, In-App Interstitial erteleniyor...');
        // Retry after a short delay
        setTimeout(initializeInAppInterstitial, 2000);
        return;
    }
    
    try {
        // Get user ID for tracking
        const ymid = getUserId();
        
        // Initialize In-App Interstitial with our settings
        window.show_9499819({
            type: 'inApp',
            ymid: ymid,
            inAppSettings: {
                frequency: 10,        // Maximum 10 ads per session
                capping: 0.5,         // Session duration: 30 minutes (0.5 hours)
                interval: 180,        // 3 minutes (180 seconds) between ads
                timeout: 10,          // 10 seconds delay before first ad
                everyPage: false      // Session continues across page reloads
            }
        });
        
        console.log('✅ In-App Interstitial başarıyla başlatıldı');
        console.log('📊 Reklam ayarları:', {
            frequency: 10,
            capping: '30 dakika',
            interval: '3 dakika',
            timeout: '10 saniye'
        });
        
    } catch (error) {
        console.error('❌ In-App Interstitial başlatılırken hata:', error);
    }
}

console.log('VPN Script Hub loaded successfully!'); 