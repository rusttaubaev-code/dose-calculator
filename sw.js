const CACHE = 'smp-ref-v7';
const ASSETS = ['./', './index.html', './calculator.html', './app.css', './calc.js', './calc-data.js', './data/chapters.js', './data/topics/hyperemesis.js', './data/topics/preeclampsia.js', './data/topics/prom.js', './data/topics/placenta_previa.js', './data/topics/abruption.js', './data/topics/amniotic_embolism.js', './data/topics/pph.js', './data/topics/dysmenorrhea.js', './data/topics/ovarian_apoplexy.js', './data/topics/bartholinitis.js', './data/topics/ectopic.js', './data/topics/miscarriage.js', './data/topics/salpingoophoritis.js', './data/topics/ovarian_torsion.js', './data/topics/pelvioperitonitis.js', './data/topics/anaphylaxis.js', './data/topics/urticaria_gen.js', './data/topics/urticaria_local.js', './data/topics/angioedema.js', './data/topics/toxicoderma.js', './data/topics/lyell_sjs.js', './data/topics/htn-crisis.js', './data/topics/aortic.js', './data/topics/acs.js', './data/topics/tachy.js', './data/topics/brady.js', './data/topics/alhf.js', './data/topics/pe.js', './data/topics/cardioshock.js', './data/topics/stroke.js', './data/topics/seizures.js', './data/topics/coma.js', './data/topics/cpr.js', './data/topics/syncope.js', './data/topics/poisoning.js', './data/topics/burns.js', './data/topics/bleeding.js', './data/topics/fracture.js', './data/drugs.js', './data/discrepancies.js', './app.js', './manifest.webmanifest', './icon-192.png', './icon-512.png', './icon-512-maskable.png', './apple-touch-icon.png'];
self.addEventListener('install', e => {
  e.waitUntil(caches.open(CACHE).then(c => c.addAll(ASSETS)).then(() => self.skipWaiting()));
});
self.addEventListener('activate', e => {
  e.waitUntil(caches.keys().then(keys => Promise.all(keys.filter(k => k !== CACHE).map(k => caches.delete(k)))).then(() => self.clients.claim()));
});
self.addEventListener('fetch', e => {
  if (e.request.method !== 'GET') return;
  e.respondWith(
    caches.match(e.request, { ignoreSearch: true }).then(hit => hit || fetch(e.request).then(res => {
      if (res.ok && new URL(e.request.url).origin === location.origin) { const copy = res.clone(); caches.open(CACHE).then(c => c.put(e.request, copy)); }
      return res;
    }).catch(() => caches.match(e.request.mode === 'navigate' ? './index.html' : e.request)))
  );
});
