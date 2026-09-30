<script>
(function(){
  'use strict';
  document.documentElement.classList.add('has-js');
  var reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  /* ---------- REVEAL ---------- */
  var rvs = document.querySelectorAll('.rv');
  if ('IntersectionObserver' in window && !reduce) {
    var io = new IntersectionObserver(function(entries){
      entries.forEach(function(e){
        if (e.isIntersecting) { e.target.classList.add('in'); io.unobserve(e.target); }
      });
    }, { threshold: 0.08, rootMargin: '0px 0px -40px 0px' });
    rvs.forEach(function(el){ io.observe(el); });
    setTimeout(function(){ rvs.forEach(function(el){ el.classList.add('in'); }); }, 1600);
  } else {
    rvs.forEach(function(el){ el.classList.add('in'); });
  }

  /* ---------- SMOOTH ANCHOR ---------- */
  document.querySelectorAll('a[href^="#"]').forEach(function(a){
    a.addEventListener('click', function(e){
      var target = document.querySelector(a.getAttribute('href'));
      if (!target) return;
      e.preventDefault();
      target.scrollIntoView({ behavior: reduce ? 'auto' : 'smooth', block: 'start' });
    });
  });

  /* ---------- FAQ: um aberto de cada vez ---------- */
  var dets = document.querySelectorAll('.faq details');
  dets.forEach(function(d){
    d.addEventListener('toggle', function(){
      if (d.open) dets.forEach(function(o){ if (o !== d) o.open = false; });
    });
  });

  /* ---------- VIDEO SLOTS ----------
     Quando existirem vídeos reais, basta pôr o URL em data-vid:
     <button class="vslot" data-vid="https://.../video.mp4">
     Sem data-vid (ou vazio), o clique não faz nada. */
  document.querySelectorAll('.vslot').forEach(function(slot){
    slot.addEventListener('click', function(){
      var url = slot.getAttribute('data-vid');
      if (!url) return;
      var v = document.createElement('video');
      v.src = url;
      v.controls = true; v.autoplay = true; v.muted = true; v.playsInline = true;
      v.style.cssText = 'width:100%;height:100%;object-fit:cover;display:block';
      var poster = slot.querySelector('img');
      if (poster) v.setAttribute('poster', poster.getAttribute('src'));
      slot.textContent = '';
      slot.appendChild(v);
      slot.style.background = 'var(--ink)';
    });
  });
})();
</script>