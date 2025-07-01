// script.js - Sadece frontend (tarayıcı) kodları için kullanılmalıdır.
// Örnek: Buton tıklama, fetch ile API çağrısı, DOM işlemleri

// Örnek: Sayfa yüklendiğinde bir butona tıklanınca API'den scriptleri çek
// HTML'de bir <button id="getScriptsBtn">Scriptleri Getir</button> varsa:
document.addEventListener('DOMContentLoaded', function() {
  const btn = document.getElementById('getScriptsBtn');
  if (btn) {
    btn.onclick = async function() {
      const response = await fetch('/api/scripts');
      const scripts = await response.json();
      console.log(scripts);
      // Burada scriptleri ekrana yazdırabilirsin
      // örn: document.getElementById('scriptsList').innerText = JSON.stringify(scripts, null, 2);
    };
  }

  // Coin ekleme butonu (modal açar)
  const addCoinsBtn = document.getElementById('add-coins-btn');
  const coinModal = document.getElementById('coin-modal');
  const coinModalClose = document.getElementById('coin-modal-close');
  const watchAdBtn = document.getElementById('watch-ad-btn');
  const userCoinsSpan = document.getElementById('user-coins');

  // Modal açma
  if (addCoinsBtn && coinModal) {
    addCoinsBtn.onclick = function() {
      coinModal.style.display = 'block';
    };
  }

  // Modal kapama
  if (coinModalClose && coinModal) {
    coinModalClose.onclick = function() {
      coinModal.style.display = 'none';
    };
  }

  // Reklam izleyerek coin kazanma (örnek: 1 coin ekle)
  if (watchAdBtn && coinModal) {
    watchAdBtn.onclick = async function() {
      // Burada reklam SDK'sı ile entegrasyon yapılabilir
      // Şimdilik örnek olarak 1 coin ekle
      let coins = parseInt(userCoinsSpan.textContent) || 0;
      coins += 1;
      userCoinsSpan.textContent = coins;
      alert('Tebrikler! 1 coin kazandınız.');
      coinModal.style.display = 'none';
    };
  }

  // Satın al butonları
  const unlockBtns = document.querySelectorAll('.unlock-btn');
  unlockBtns.forEach(function(btn) {
    btn.onclick = async function() {
      const script = btn.getAttribute('data-script');
      const price = parseInt(btn.getAttribute('data-price'));
      let coins = parseInt(userCoinsSpan.textContent) || 0;
      if (coins < price) {
        alert('Yetersiz coin! Lütfen coin kazanın.');
        return;
      }
      // Satın alma işlemi için backend'e istek at
      try {
        const response = await fetch('/api/buy', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ script })
        });
        const result = await response.json();
        if (result.success) {
          coins -= price;
          userCoinsSpan.textContent = coins;
          alert('Satın alma başarılı! Script: ' + script);
          // Script dosyasını indirme linki veya gösterimi eklenebilir
        } else {
          alert('Satın alma başarısız: ' + (result.message || 'Bilinmeyen hata'));
        }
      } catch (err) {
        alert('Sunucu hatası: ' + err.message);
      }
    };
  });

  // Tema değiştirme (isteğe bağlı)
  const themeToggle = document.getElementById('theme-toggle');
  if (themeToggle) {
    themeToggle.onclick = function() {
      document.body.classList.toggle('dark-theme');
    };
  }

  // Modal dışında bir yere tıklanınca modalı kapat
  window.onclick = function(event) {
    if (event.target === coinModal) {
      coinModal.style.display = 'none';
    }
  };
});

// Buraya sadece tarayıcıda çalışacak kodlar ekleyin.