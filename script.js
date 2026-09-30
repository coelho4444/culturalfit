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
    // seguranca: nada fica escondido para sempre, mesmo se o observer falhar
    setTimeout(function(){ rvs.forEach(function(el){ el.classList.add('in'); }); }, 1600);
  } else {
    rvs.forEach(function(el){ el.classList.add('in'); });
  }

  /* ---------- ECG CANVAS (live trace) ---------- */
  var cv = document.getElementById('ecg');
  var hrEl = document.getElementById('pulseNum');
  var hrvEl = document.getElementById('hrvLine');
  var bpm = 62, targetBpm = 62, y0 = 56;
  var pts = [], W = 0, H = 112, tPrev = null, phase = 0, raf = null, running = true;
  var lastVitals = 0;

  function sizeCanvas(){
    if (!cv) return;
    var dpr = Math.min(window.devicePixelRatio || 1, 2);
    var rect = cv.getBoundingClientRect();
    if (!rect.width) return;
    W = rect.width;
    cv.width = Math.round(W * dpr);
    cv.height = Math.round(H * dpr);
    var ctx = cv.getContext('2d');
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    // seed the trace so the line is already drawn across the width
    pts.length = 0;
    for (var x = 0; x <= W; x += 2) pts.push({ x: x, y: y0 });
  }

  // ECG waveform: p, qrs complex, t  (phase 0..1 within one beat)
  function wave(p){
    if (p < 0.10) return -0.14 * Math.sin(p / 0.10 * Math.PI);            // P
    if (p < 0.16) return 0.06;                                            // PR
    if (p < 0.20) return 0.22 * Math.sin((p - 0.16) / 0.04 * Math.PI);    // Q
    if (p < 0.24) return -1.0 * Math.sin((p - 0.20) / 0.04 * Math.PI);    // R spike
    if (p < 0.29) return 0.42 * Math.sin((p - 0.24) / 0.05 * Math.PI);    // S
    if (p < 0.36) return 0;                                               // ST
    if (p < 0.56) return -0.19 * Math.sin((p - 0.36) / 0.20 * Math.PI);   // T
    return 0;
  }

  function draw(ctx){
    ctx.clearRect(0, 0, W, H);
    // rails
    ctx.strokeStyle = 'rgba(255,255,255,.045)';
    ctx.lineWidth = 1;
    for (var gy = 12; gy < H; gy += 26) {
      ctx.beginPath(); ctx.moveTo(0, gy + 0.5); ctx.lineTo(W, gy + 0.5); ctx.stroke();
    }
    // baseline
    ctx.strokeStyle = 'rgba(255,255,255,.08)';
    ctx.beginPath(); ctx.moveTo(0, y0 + 0.5); ctx.lineTo(W, y0 + 0.5); ctx.stroke();

    // glow pass + solid pass
    ctx.lineJoin = 'round'; ctx.lineCap = 'round';
    var passes = [
      { w: 5, a: 0.16, c: '255,74,45' },
      { w: 2, a: 0.95, c: '255,74,45' }
    ];
    for (var i = 0; i < passes.length; i++) {
      ctx.strokeStyle = 'rgba(' + passes[i].c + ',' + passes[i].a + ')';
      ctx.lineWidth = passes[i].w;
      ctx.beginPath();
      for (var k = 0; k < pts.length; k++) {
        if (k === 0) ctx.moveTo(pts[k].x, pts[k].y); else ctx.lineTo(pts[k].x, pts[k].y);
      }
      ctx.stroke();
    }
    // leading dot with surface ring
    if (pts.length) {
      var last = pts[pts.length - 1];
      ctx.beginPath(); ctx.arc(last.x, last.y, 4.5, 0, Math.PI * 2);
      ctx.fillStyle = 'rgba(255,74,45,.22)'; ctx.fill();
      ctx.beginPath(); ctx.arc(last.x, last.y, 2.2, 0, Math.PI * 2);
      ctx.fillStyle = '#ffb9aa'; ctx.fill();
    }
  }

  function frame(ts){
    if (!running || !cv || !W) { raf = requestAnimationFrame(frame); return; }
    if (tPrev === null) tPrev = ts;
    var dt = Math.min((ts - tPrev) / 1000, 0.1);
    tPrev = ts;

    // ease toward target rate + jitter
    bpm += (targetBpm - bpm) * 0.02;
    var jitter = reduce ? 0 : (Math.random() - 0.5) * 0.9;
    var hz = (bpm + jitter) / 60;
    phase += dt * hz;
    if (phase >= 1) {
      phase -= Math.floor(phase);
      if (!reduce && Math.random() < 0.28) targetBpm = 58 + Math.round(Math.random() * 26);
    }

    var span = reduce ? 2.6 : 2.6;
    var speed = W / span;             // px per second
    var amp = H * 0.40;
    var newX = pts.length ? pts[pts.length - 1].x : 0;
    var advance = speed * dt;
    var steps = Math.max(1, Math.round(advance / 2));
    for (var s = 0; s < steps; s++) {
      var nx = newX + advance / steps;
      var p = (phase + (advance / steps) / speed * hz) % 1;
      var y = y0 - wave(p) * amp;
      pts.push({ x: sx(nx), y: y });
      newX = nx;
    }
    // trim off-screen
    while (pts.length && pts[0].x < -4) pts.shift();
    // scroll: shift every point left by advance
    for (var k = 0; k < pts.length; k++) pts[k].x -= advance;
    // reset x bookkeeping after shift
    draw(cv.getContext('2d'));

    // vitals text, ~3x per second
    if (ts - lastVitals > 340) {
      lastVitals = ts;
      if (hrEl) hrEl.innerHTML = Math.round(bpm) + '<span>BPM agora</span>';
      if (hrvEl) {
        var hrv = 72 + Math.round(Math.random() * 12);
        var state = hrv > 80 ? 'RECUPERAÇÃO ALTA' : (hrv > 74 ? 'RECUPERAÇÃO MÉDIA' : 'RECUPERAÇÃO BAIXA');
        hrvEl.textContent = 'HRV ' + hrv + ' ms · ' + state;
      }
    }
    raf = requestAnimationFrame(frame);
  }
  function sx(v){ return Math.max(-4, Math.min(W + 4, v)); }

  if (cv) {
    sizeCanvas();
    window.addEventListener('resize', function(){ sizeCanvas(); });
    if (reduce) {
      // static, readable trace for reduced motion
      var ctx = cv.getContext('2d');
      for (var x = 0; x <= W; x += 2) {
        var p = (x / W * 6.4) % 1;
        pts.push({ x: x, y: y0 - wave(p) * H * 0.40 });
      }
      draw(ctx);
    } else {
      raf = requestAnimationFrame(frame);
      document.addEventListener('visibilitychange', function(){
        running = !document.hidden;
        if (running) { tPrev = null; if (!raf) raf = requestAnimationFrame(frame); }
      });
    }
  }

  /* ---------- LIVE "PEOPLE VIEWING" ---------- */
  var stockEl = document.getElementById('stockN');
  if (stockEl && !reduce) {
    var n = 41;
    setInterval(function(){
      n += Math.random() < 0.45 ? -1 : 1;
      if (n < 33) n = 33;
      if (n > 52) n = 52;
      stockEl.textContent = n;
    }, 4200);
  }

  /* ---------- RECOVERY RING (cycling readings) ---------- */
  var R = 56, CIRC = 2 * Math.PI * R;
  var ringFg = document.getElementById('ringFg');
  var ringVal = document.getElementById('ringVal');
  var ringVerdict = document.getElementById('ringVerdict');
  var ringNote = document.getElementById('ringNote');
  var READINGS = [
    { v: 94, c: '#39a857', t: 'Verde. Ataca.',
      n: 'O teu corpo absorveu a carga de ontem. Dia ideal para treino intenso.' },
    { v: 67, c: '#3987e5', t: 'Amarelo. Modera.',
      n: 'Recuperaste em parte. Treino moderado hoje, sem procurar recordes.' },
    { v: 38, c: '#FF4A2D', t: 'Vermelho. Descansa.',
      n: 'O corpo está em dívida. Um dia de descanso hoje poupa-te duas semanas parado.' }
  ];
  if (ringFg) {
    ringFg.style.strokeDasharray = CIRC;
    var idx = 0;
    function renderRing(r){
      ringFg.style.transition = 'stroke-dashoffset .8s cubic-bezier(.2,.7,.3,1), stroke .4s ease';
      ringFg.setAttribute('stroke-dashoffset', String(CIRC * (1 - r.v / 100)));
      ringFg.setAttribute('stroke', r.c);
      if (ringVal) ringVal.textContent = r.v + '%';
      if (ringVerdict) { ringVerdict.textContent = r.t; ringVerdict.style.color = r.c; }
      if (ringNote) ringNote.textContent = r.n;
    }
    renderRing(READINGS[0]);
    if (!reduce) {
      setInterval(function(){
        idx = (idx + 1) % READINGS.length;
        renderRing(READINGS[idx]);
      }, 5200);
    }
  }

  /* ---------- BIOLOGICAL AGE SIMULATOR ---------- */
  var el = function(id){ return document.getElementById(id); };
  var sAge = el('sAge'), sSleep = el('sSleep'), sStress = el('sStress'), sTrain = el('sTrain');
  if (sAge && sSleep && sStress && sTrain) {
    var ageOut = el('ageOut'), ageDelta = el('ageDelta'), ageCap = el('ageCap'), ageNote = el('ageNote');
    var bSleep = el('bSleep'), bStress = el('bStress'), bTrain = el('bTrain');

    function scoreSleep(h){                       // 0..1
      if (h <= 4) return 0.05;
      if (h <= 8) return (h - 4) / 4 * 0.95 + 0.05;
      return Math.max(0.55, 1 - (h - 8) * 0.22);
    }
    function scoreStress(level){ return Math.max(0, 1 - level / 100); }   // 0..1
    function scoreTrain(n){                        // 0..1, peaks at 4-5 sessions
      if (n <= 5) return n / 5;
      return Math.max(0.5, 1 - (n - 5) * 0.18);
    }
    function labelStress(v){
      if (v < 20) return 'Baixo';
      if (v < 45) return 'Controlado';
      if (v < 70) return 'Médio';
      if (v < 88) return 'Alto';
      return 'Queimado';
    }
    function fmtSleep(h){
      var hh = Math.floor(h), mm = Math.round((h - hh) * 60);
      return mm === 0 ? hh + 'h' : hh + 'h' + (mm < 10 ? '0' + mm : mm);
    }

    function compute(){
      var age = +sAge.value, sleep = +sSleep.value, stress = +sStress.value, train = +sTrain.value;
      var ss = scoreSleep(sleep), st = scoreStress(stress), tr = scoreTrain(train);

      var delta = 0;
      delta += (1 - ss) * 9.0;                 // sono: alavanca maior
      delta += (1 - st) * 6.0;                 // stress
      delta += (1 - tr) * 5.0;                 // treino
      delta += train >= 7 ? 2.4 : 0;           // excesso de treino paga-se
      delta -= 3.2;                            // quem está a medir já está a cuidar

      var bio = Math.round(age + delta);
      bio = Math.max(16, Math.min(88, bio));
      var real = bio - age;

      ageOut.textContent = bio;
      ageOut.className = 'age-out ' + (real > 0 ? 'worse' : 'better');
      ageCap.textContent = real > 0
        ? 'O teu corpo está a envelhecer mais rápido do que tu'
        : (real < 0 ? 'O teu corpo está mais novo do que a tua idade' : 'O teu corpo acompanha exactamente a tua idade');

      if (real > 0) {
        ageDelta.className = 'age-delta pos';
        ageDelta.textContent = '+' + real + (real === 1 ? ' ano' : ' anos') + ' face à tua idade real';
      } else if (real < 0) {
        ageDelta.className = 'age-delta neg';
        ageDelta.textContent = real + (real === -1 ? ' ano' : ' anos') + ' face à tua idade real';
      } else {
        ageDelta.className = 'age-delta';
        ageDelta.textContent = 'Alinhado com a tua idade real';
      }

      // control labels
      el('sAgeV').textContent = age + (age === 1 ? ' ano' : ' anos');
      el('sSleepV').textContent = fmtSleep(sleep);
      el('sStressV').textContent = labelStress(stress);
      el('sTrainV').textContent = train === 0 ? 'Nenhum' : (train === 1 ? '1 vez' : train + ' vezes');

      // mini bars: green when healthy, accents on the weak lever
      function paint(node, valNode, v){
        node.style.width = Math.round(v * 100) + '%';
        node.style.background = v >= 0.72 ? 'var(--rec)' : (v >= 0.45 ? 'var(--sleep)' : 'var(--acc)');
        if (valNode) valNode.textContent = Math.round(v * 100);
      }
      paint(bSleep, el('vSleep'), ss);
      paint(bStress, el('vStress'), st);
      paint(bTrain, el('vTrain'), tr);

      // contextual note names the weakest lever
      var lowest = Math.min(ss, st, tr);
      var msg;
      if (lowest > 0.74) {
        msg = 'As três alavancas estão bem. Nesta configuração o que ganhas é manutenção — o WHOOP serve-te para não perderes o que já tens, detectando cedo qualquer desvio.';
      } else if (lowest === ss) {
        msg = 'O sono é a tua alavanca mais fraca e é a que mais pesa na idade biológica. O WHOOP mede-te as fases por noite, e é por aí que começas a baixar este número.';
      } else if (lowest === st) {
        msg = 'O stress é a tua alavanca mais fraca. Não o sentes porque já te habituaste — o WHOOP mostra-te os picos em tempo real e ensina-te a travar antes de chegarem ao corpo.';
      } else {
        msg = 'O treino é a tua alavanca mais fraca. Sem carga não há adaptação, mas carga a mais também cobra juros. O WHOOP dá-te o número com que decides cada dia.';
      }
      ageNote.textContent = msg;
    }

    [sAge, sSleep, sStress, sTrain].forEach(function(s){
      s.addEventListener('input', compute);
    });
    compute();
  }

  /* ---------- SMOOTH ANCHOR SCROLL ---------- */
  document.querySelectorAll('a[href^="#"]').forEach(function(a){
    a.addEventListener('click', function(e){
      var target = document.querySelector(a.getAttribute('href'));
      if (!target) return;
      e.preventDefault();
      target.scrollIntoView({ behavior: reduce ? 'auto' : 'smooth', block: 'start' });
    });
  });

  /* ---------- FAQ: one open at a time ---------- */
  var dets = document.querySelectorAll('.faq details');
  dets.forEach(function(d){
    d.addEventListener('toggle', function(){
      if (d.open) dets.forEach(function(o){ if (o !== d) o.open = false; });
    });
  });
})();
</script>
