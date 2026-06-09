/* === Go Advice AS — Shared JS v3.0 === */

/* ─── Scroll Animations (IntersectionObserver) ─────────────────────── */
(function initScrollAnimations() {
  const animatedEls = document.querySelectorAll(
    '.animate, .animate-left, .animate-right, .animate-scale'
  );

  if (!animatedEls.length) return;

  const observer = new IntersectionObserver(
    (entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          entry.target.classList.add('visible');
          observer.unobserve(entry.target);
        }
      });
    },
    { threshold: 0.12, rootMargin: '0px 0px -40px 0px' }
  );

  animatedEls.forEach(el => observer.observe(el));
})();

/* ─── Nav Scroll Behavior ──────────────────────────────────────────── */
(function initNav() {
  const nav = document.getElementById('site-nav');
  if (!nav) return;

  const heroSection = document.getElementById('hero');
  const isTransparentHero = heroSection && (
    heroSection.classList.contains('hero--gradient') ||
    heroSection.classList.contains('hero--photo')
  );

  function updateNav() {
    const scrolled = window.scrollY > 40;
    if (isTransparentHero) {
      nav.classList.toggle('nav--transparent', !scrolled);
      nav.classList.toggle('nav--scrolled', scrolled);
    } else {
      nav.classList.add('nav--scrolled');
    }
  }

  updateNav();
  window.addEventListener('scroll', updateNav, { passive: true });
})();

/* ─── Hero Parallax ────────────────────────────────────────────────── */
(function initHeroParallax() {
  const hero = document.querySelector('.hero--photo, .hero--gradient');
  if (!hero) return;

  /* Skip on touch devices — parallax causes judder */
  if ('ontouchstart' in window) return;

  let ticking = false;

  function onScroll() {
    if (!ticking) {
      requestAnimationFrame(() => {
        const scrolled = window.scrollY;
        const rate = scrolled * 0.3;
        if (hero.classList.contains('hero--photo')) {
          hero.style.backgroundPositionY = `calc(50% + ${rate}px)`;
        }
        /* Watermark float on gradient hero */
        const watermark = hero.querySelector('.hero__watermark');
        if (watermark) {
          watermark.style.transform = `translateY(calc(-50% + ${scrolled * 0.12}px))`;
        }
        ticking = false;
      });
      ticking = true;
    }
  }

  window.addEventListener('scroll', onScroll, { passive: true });
})();

/* ─── FAQ Accordion ────────────────────────────────────────────────── */
(function initFAQ() {
  const faqItems = document.querySelectorAll('.faq-item');
  if (!faqItems.length) return;

  faqItems.forEach(item => {
    const trigger = item.querySelector('.faq-item__trigger');
    if (!trigger) return;

    trigger.addEventListener('click', () => {
      const isOpen = item.classList.contains('open');

      /* Close all */
      faqItems.forEach(i => {
        i.classList.remove('open');
        const t = i.querySelector('.faq-item__trigger');
        if (t) t.setAttribute('aria-expanded', 'false');
      });

      /* Open this one if it was closed */
      if (!isOpen) {
        item.classList.add('open');
        trigger.setAttribute('aria-expanded', 'true');
      }
    });

    trigger.setAttribute('aria-expanded', 'false');
    trigger.setAttribute('role', 'button');
    const body = item.querySelector('.faq-item__body');
    if (body) {
      const id = 'faq-body-' + Math.random().toString(36).slice(2, 7);
      body.id = id;
      trigger.setAttribute('aria-controls', id);
    }
  });
})();

/* ─── Cookie Banner ─────────────────────────────────────────────────── */
(function initCookieBanner() {
  const banner = document.getElementById('cookie-banner');
  if (!banner) return;

  const STORAGE_KEY = 'ga_cookie_consent';
  const stored = localStorage.getItem(STORAGE_KEY);

  if (!stored) {
    setTimeout(() => banner.classList.add('visible'), 1200);
  }

  const acceptBtn = banner.querySelector('[data-cookie-accept]');
  const declineBtn = banner.querySelector('[data-cookie-decline]');

  function dismiss(choice) {
    banner.classList.remove('visible');
    localStorage.setItem(STORAGE_KEY, choice);
    setTimeout(() => banner.remove(), 600);

    if (choice === 'accepted') {
      /* Load analytics here if/when implemented */
      document.dispatchEvent(new CustomEvent('ga:consent', { detail: { analytics: true } }));
    }
  }

  if (acceptBtn)  acceptBtn.addEventListener('click',  () => dismiss('accepted'));
  if (declineBtn) declineBtn.addEventListener('click', () => dismiss('declined'));
})();

/* ─── Smooth Hover: lift cards on focus (keyboard nav) ─────────────── */
(function initCardFocus() {
  const cards = document.querySelectorAll('.path-card, .step-card, .review-card, .problem-item');
  cards.forEach(card => {
    card.addEventListener('focusin',  () => card.style.transform = 'translateY(-6px)');
    card.addEventListener('focusout', () => card.style.transform = '');
  });
})();

/* ─── Cursor Glow ────────────────────────────────────────────────────── */
(function initCursorGlow() {
  /* Fine pointer only — skip touch/stylus devices */
  if (!window.matchMedia('(pointer: fine)').matches) return;

  const canvas = document.createElement('canvas');
  canvas.setAttribute('aria-hidden', 'true');
  canvas.style.cssText = [
    'position:fixed',
    'inset:0',
    'width:100%',
    'height:100%',
    'pointer-events:none',
    'z-index:1',
  ].join(';');
  document.body.appendChild(canvas);
  const ctx = canvas.getContext('2d');

  let W = 0, H = 0;
  let mx = -9999, my = -9999;  /* true cursor position          */
  let gx = -9999, gy = -9999;  /* lerped glow position          */
  let alpha = 0, targetAlpha = 0;

  function resize() {
    W = canvas.width  = window.innerWidth;
    H = canvas.height = window.innerHeight;
  }
  resize();
  window.addEventListener('resize', resize, { passive: true });

  document.addEventListener('mousemove', (e) => {
    mx = e.clientX;
    my = e.clientY;
    targetAlpha = 1;
  }, { passive: true });

  document.addEventListener('mouseleave', () => { targetAlpha = 0; });

  (function tick() {
    /* Drift toward the cursor — slow enough to feel like warm air,
       not a UI element snapping to position.                        */
    gx += (mx - gx) * 0.05;
    gy += (my - gy) * 0.05;

    /* Asymmetric fade: comes up gently (0.055), dissolves very slowly
       (0.016) — the glow lingers after the cursor has moved on, the
       way candlelight warms a wall after the flame has passed.       */
    alpha += (targetAlpha - alpha) * (targetAlpha > alpha ? 0.055 : 0.016);

    ctx.clearRect(0, 0, W, H);

    if (alpha > 0.002) {
      const r = 420;
      const g = ctx.createRadialGradient(gx, gy, 0, gx, gy, r);
      g.addColorStop(0,   `rgba(244,124,32,${0.08  * alpha})`);
      g.addColorStop(0.45,`rgba(249,168,75,${0.035 * alpha})`);
      g.addColorStop(1,   `rgba(244,124,32,0)`);
      ctx.fillStyle = g;
      ctx.fillRect(0, 0, W, H);
    }

    requestAnimationFrame(tick);
  })();
})();
