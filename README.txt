BETÜL TERCİH ROBOTU — kurulum ve dağıtım
=========================================

DOSYALAR
  index.html      → ana ekran (tercih robotu + karşılaştırma paneli)
  listeler.html   → liste yönetimi / karşılaştırma tablosu / A4 çıktı
  units.js        → veri (690 birim)
  common.js       → ortak mantık + sunucu-senkronlu liste deposu
  styles.css      → tasarım
  server.js       → küçük Node sunucusu (statik dosyalar + liste senkron API)
  Dockerfile      → Coolify/GitHub için hazır imaj tanımı
  .dockerignore

NEDEN SUNUCU?  (cihazlar arası listeler)
  Listeler artık sunucuda /data/store.json içinde tutulur. Böylece işteki
  bilgisayarınızda oluşturduğunuz liste, evdeki bilgisayarınızda da AYNEN
  görünür. (Sunucuya ulaşılamazsa uygulama otomatik olarak tarayıcı hafızasına
  düşer; internet dönünce sunucu tekrar esas alınır.)

YEREL DENEME
  Node kuruluysa, bu klasörde:
      node server.js
  Sonra tarayıcıda http://localhost:8080 açın. Listeler ./data/store.json
  dosyasına yazılır.

GITHUB → COOLIFY → CLOUDFLARE  (sizin akışınız)
  1) GitHub'da "vettercih" adıyla bir depo açın; bu klasördeki TÜM dosyaları
     (Dockerfile dahil) deponun köküne koyup push edin.
  2) Coolify'da "New Resource → Application → (GitHub'dan)" ile vettercih
     deposunu seçin. Build yöntemi: Dockerfile (Coolify Dockerfile'ı otomatik
     algılar). Port: 8080.
  3) ÖNEMLİ — Kalıcı depolama: Coolify'da uygulamaya bir "Persistent Storage /
     Volume" ekleyin ve konteyner yolunu  /data  yapın. (Aksi halde her yeniden
     dağıtımda listeler silinir.)
  4) Domain: uygulamaya  tercih.hakanveli.com  adresini tanımlayın. Cloudflare
     DNS'te bu alt alan adını ev sunucunuza / tünelinize yönlendirin. Coolify
     Let's Encrypt ile HTTPS'i halleder (Cloudflare Tunnel kullanıyorsanız SSL
     "Full" olsun).
  5) Otomatik güncelleme: GitHub'a her push'ta Coolify otomatik yeniden dağıtır
     (Coolify'da "Automatic Deployment / webhook" açık olsun).

GÜVENLİK NOTU
  Uygulamada parola yoktur; adresi bilen listeleri görebilir/değiştirebilir.
  Kişiye özel kalsın isterseniz Coolify/Cloudflare tarafında basit bir koruma
  (Cloudflare Access veya Basic Auth) ekleyebilirsiniz. İsterseniz bunu da
  birlikte kurabiliriz.

VERİYİ GÜNCELLEME
  Mesafe/havalimanı/nüfus değerleri düzenlenebilir yaklaşık değerlerdir.
  build_data.py (+ airports.py) düzenlenip yeniden çalıştırılarak units.js
  yeniden üretilebilir.
