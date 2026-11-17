(() => {
  'use strict';
  const $ = (s, c = document) => c.querySelector(s);
  const $$ = (s, c = document) => [...c.querySelectorAll(s)];
  const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
  const fine = matchMedia('(hover:hover) and (pointer:fine)').matches;
  const root = document.documentElement;

  /* theme */
  try { const t = localStorage.getItem('mf-theme'); if (t) root.dataset.theme = t; } catch (e) {}
  $('#themeBtn').addEventListener('click', () => {
    const next = root.dataset.theme === 'dark' ? 'light' : 'dark';
    root.dataset.theme = next;
    try { localStorage.setItem('mf-theme', next); } catch (e) {}
    $('meta[name="theme-color"]').content = next === 'dark' ? '#0a0a12' : '#f7f5ff';
  });

  /* split text into word/char spans */
  $$('[data-split]').forEach(el => {
    const text = el.textContent;
    el.textContent = '';
    let i = 0;
    text.split(' ').forEach((word, wi, arr) => {
      const w = document.createElement('span'); w.className = 'w';
      [...word].forEach(ch => {
        const c = document.createElement('span'); c.className = 'c';
        c.style.setProperty('--i', i++); c.textContent = ch; w.appendChild(c);
      });
      el.appendChild(w);
      if (wi < arr.length - 1) { el.appendChild(document.createTextNode(' ')); i++; }
    });
  });

  /* observers */
  const io = new IntersectionObserver((entries) => {
    entries.forEach(e => {
      if (!e.isIntersecting) return;
      e.target.classList.add('in');
      if (e.target.matches('.stat')) countUp($('b', e.target));
      io.unobserve(e.target);
    });
  }, { threshold: .18, rootMargin: '0px 0px -40px 0px' });

  // stagger siblings
  $$('.skill-grid .reveal, .stats .reveal, .proj-list .reveal, .timeline .reveal').forEach((el, i) => {
    el.style.setProperty('--d', ((i % 3) * 0.1) + 's');
  });
  $$('.hero .reveal').forEach((el, i) => el.style.setProperty('--d', (0.9 + i * 0.12) + 's'));

  function countUp(b) {
    if (!b || b.dataset.done) return; b.dataset.done = 1;
    const end = parseFloat(b.dataset.count), dec = +(b.dataset.decimals || 0), suf = b.dataset.suffix || '';
    if (reduce) { b.textContent = end.toFixed(dec) + suf; return; }
    const t0 = performance.now(), dur = 1400;
    (function tick(t) {
      const p = Math.min((t - t0) / dur, 1), e = 1 - Math.pow(1 - p, 3);
      b.textContent = (end * e).toFixed(dec) + suf;
      if (p < 1) requestAnimationFrame(tick);
    })(t0);
  }

  /* preloader -> start hero */
  const startPage = () => {
    $('#preloader').classList.add('done');
    document.body.classList.remove('loading');
    setTimeout(() => {
      $$('.hero .split').forEach(s => s.classList.add('in'));
      $$('.hero .reveal').forEach(el => io.observe(el));
      typeLoop();
    }, 450);
    $$('.reveal:not(.hero .reveal), [data-split]:not(.hero [data-split])').forEach(el => io.observe(el));
  };
  document.body.classList.add('loading');
  let started = false;
  const go = () => { if (started) return; started = true; startPage(); };
  setTimeout(go, reduce ? 50 : 1500);
  window.addEventListener('load', () => setTimeout(go, reduce ? 50 : 1500));

  /* typewriter */
  const roles = ['BSCS Graduate', 'n8n Automation Builder', 'Web Developer', 'Data Entry Specialist', 'Canva Designer'];
  function typeLoop() {
    const el = $('#typed'); if (!el) return;
    if (reduce) { el.textContent = roles[0]; return; }
    let r = 0, c = 0, del = false;
    (function step() {
      const word = roles[r];
      el.textContent = word.slice(0, c);
      let delay = del ? 35 : 80;
      if (!del && c === word.length) { del = true; delay = 1500; }
      else if (del && c === 0) { del = false; r = (r + 1) % roles.length; delay = 350; }
      c += del ? -1 : 1;
      setTimeout(step, delay);
    })();
  }

  /* nav */
  const nav = $('#nav'), progress = $('#progress');
  const onScroll = () => {
    nav.classList.toggle('scrolled', scrollY > 30);
    const h = document.documentElement.scrollHeight - innerHeight;
    progress.style.width = (h > 0 ? scrollY / h * 100 : 0) + '%';
  };
  addEventListener('scroll', onScroll, { passive: true }); onScroll();

  const burger = $('#burger'), links = $('#links');
  const closeMenu = () => { links.classList.remove('open'); burger.setAttribute('aria-expanded', 'false'); };
  burger.addEventListener('click', () => {
    const open = links.classList.toggle('open');
    burger.setAttribute('aria-expanded', open);
  });
  $$('a', links).forEach(a => a.addEventListener('click', closeMenu));

  const secs = $$('main section[id]');
  const spy = new IntersectionObserver(es => es.forEach(e => {
    if (e.isIntersecting) $$('a', links).forEach(a => a.classList.toggle('active', a.getAttribute('href') === '#' + e.target.id));
  }), { rootMargin: '-45% 0px -50% 0px' });
  secs.forEach(s => spy.observe(s));

  /* desktop-only effects */
  if (fine && !reduce) {
    const glow = $('#cursorGlow');
    addEventListener('pointermove', e => { glow.style.left = e.clientX + 'px'; glow.style.top = e.clientY + 'px'; }, { passive: true });

    $$('.tilt').forEach(el => {
      const strong = el.classList.contains('avatar');
      el.addEventListener('pointermove', e => {
        const r = el.getBoundingClientRect(), x = (e.clientX - r.left) / r.width, y = (e.clientY - r.top) / r.height;
        el.style.setProperty('--mx', x * 100 + '%'); el.style.setProperty('--my', y * 100 + '%');
        const m = strong ? 14 : 6;
        el.style.transform = `perspective(900px) rotateX(${(.5 - y) * m}deg) rotateY(${(x - .5) * m}deg)`;
      });
      el.addEventListener('pointerleave', () => { el.style.transform = ''; });
    });

    $$('.magnetic').forEach(el => {
      el.addEventListener('pointermove', e => {
        const r = el.getBoundingClientRect();
        el.style.transform = `translate(${(e.clientX - r.left - r.width / 2) * .22}px,${(e.clientY - r.top - r.height / 2) * .3}px)`;
      });
      el.addEventListener('pointerleave', () => { el.style.transform = ''; });
    });
  }

  /* contact form -> opens email client (static site, no backend) */
  const form = $('#form'), note = $('#formNote');
  form.addEventListener('submit', e => {
    e.preventDefault();
    const d = new FormData(form), name = d.get('name').trim(), email = d.get('email').trim(), msg = d.get('message').trim();
    if (!name || !/^\S+@\S+\.\S+$/.test(email) || !msg) {
      note.className = 'form-note err'; note.textContent = 'Please fill in your name, a valid email and a message.'; return;
    }
    const subject = encodeURIComponent('Portfolio enquiry from ' + name);
    const body = encodeURIComponent(msg + '\n\n— ' + name + ' (' + email + ')');
    note.className = 'form-note'; note.textContent = 'Opening your email app…';
    location.href = `mailto:mariafazal896@gmail.com?subject=${subject}&body=${body}`;
  });

  $('#year').textContent = new Date().getFullYear();
})();
