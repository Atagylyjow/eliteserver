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
});

// Buraya sadece tarayıcıda çalışacak kodlar ekleyin.