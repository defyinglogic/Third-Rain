(function () {
  'use strict';

  function initDispatch() {
    const form = document.querySelector('.landfall-form');
    if (!form) return;
    const fields = form.querySelectorAll('input, textarea');
    const sync = () => {
      let lv = 0;
      fields.forEach((f) => {
        if (f.value.trim()) lv += 1;
        if (f.tagName === 'TEXTAREA' && f.value.trim().length > 24) lv += 0.4;
      });
      const chips = form.querySelectorAll('[data-chip][data-on="1"]');
      if (chips.length) lv += 0.4;
      const pct = Math.min(100, Math.round((lv / (fields.length + 0.4)) * 100));
      form.style.setProperty('--tide', Math.max(0, pct) + '%');
    };
    fields.forEach((f) => f.addEventListener('input', sync));
    form.addEventListener('click', () => setTimeout(sync, 40));
    sync();
  }

  function initStormline() {
    const track = document.querySelector('[data-stormline]');
    if (!track) {
      initStormline._tries = (initStormline._tries || 0) + 1;
      if (initStormline._tries < 40) setTimeout(initStormline, 80);
      return;
    }
    if (track.dataset.stormBound === '1') return;
    track.dataset.stormBound = '1';

    const fill = track.querySelector('[data-stormline-fill]');
    const drop = track.querySelector('[data-stormline-drop]');
    const steps = [...track.querySelectorAll('[data-stormline-step]')];
    let ticking = false;

    const vh = () =>
      (window.visualViewport && window.visualViewport.height) ||
      window.innerHeight ||
      document.documentElement.clientHeight;

    const update = () => {
      ticking = false;
      const r = track.getBoundingClientRect();
      const view = vh();
      // Start earlier / finish later so mobile short viewports still run the full beat.
      const start = view * 0.88;
      const end = view * 0.22;
      const total = r.height + (start - end);
      const done = Math.min(1, Math.max(0, (start - r.top) / Math.max(1, total)));
      const px = done * r.height;
      if (fill) fill.style.height = px.toFixed(1) + 'px';
      if (drop) {
        drop.style.transform = 'translate(-50%,' + px.toFixed(1) + 'px)';
        drop.style.opacity = done > 0.002 && done < 0.998 ? '1' : '0';
      }
      steps.forEach((st) => {
        const node = st.querySelector('.stormline__node') || st;
        const nr = node.getBoundingClientRect();
        const nodeY = nr.top + nr.height * 0.5 - r.top;
        st.classList.toggle('is-lit', nodeY <= px + 12);
      });
    };

    const onScroll = () => {
      if (!ticking) {
        ticking = true;
        requestAnimationFrame(update);
      }
    };

    addEventListener('scroll', onScroll, { passive: true, capture: true });
    addEventListener('resize', onScroll, { passive: true });
    addEventListener('orientationchange', onScroll);
    document.addEventListener('touchmove', onScroll, { passive: true });
    if (window.visualViewport) {
      visualViewport.addEventListener('scroll', onScroll, { passive: true });
      visualViewport.addEventListener('resize', onScroll, { passive: true });
    }

    // IntersectionObserver catches iOS cases where scroll events stall.
    if ('IntersectionObserver' in window) {
      const io = new IntersectionObserver(() => onScroll(), {
        threshold: [0, 0.15, 0.35, 0.55, 0.75, 1],
        rootMargin: '20% 0px 20% 0px',
      });
      io.observe(track);
      steps.forEach((st) => io.observe(st));
    }

    update();
    requestAnimationFrame(update);
    setTimeout(update, 120);
    setTimeout(update, 480);
  }

  function initGale() {
    const strip = document.querySelector('[data-gale]');
    if (!strip) return;
    const fill = document.querySelector('[data-gale-fill]');
    const meter = () => {
      if (!fill) return;
      const max = strip.scrollWidth - strip.clientWidth;
      const p = max > 0 ? strip.scrollLeft / max : 0;
      fill.style.width = (8 + p * 92).toFixed(2) + '%';
    };
    strip.addEventListener('scroll', meter, { passive: true });
    addEventListener('resize', meter);
    meter();
    // Drag-to-scroll for mouse users.
    let down = false, startX = 0, startL = 0, moved = false;
    strip.addEventListener('pointerdown', (e) => {
      if (e.pointerType !== 'mouse') return;
      down = true; moved = false;
      startX = e.clientX; startL = strip.scrollLeft;
      strip.classList.add('is-grabbing');
    });
    addEventListener('pointermove', (e) => {
      if (!down) return;
      const dx = e.clientX - startX;
      if (Math.abs(dx) > 4) moved = true;
      strip.scrollLeft = startL - dx;
    });
    addEventListener('pointerup', () => {
      down = false;
      strip.classList.remove('is-grabbing');
    });
    strip.addEventListener('click', (e) => { if (moved) e.preventDefault(); }, true);
  }

  function initBasin() {
    const section = document.querySelector('[data-basin]');
    if (!section) return;
    const quote = section.querySelector('[data-basin-quote]');
    if (!quote) return;
    if (matchMedia('(prefers-reduced-motion: reduce)').matches) {
      section.classList.add('basin--static', 'is-signed');
      return;
    }

    let words = [];
    const split = () => {
      words = [];
      const walk = (node) => {
        [...node.childNodes].forEach((n) => {
          if (n.nodeType === 3) {
            const frag = document.createDocumentFragment();
            n.nodeValue.split(/(\s+)/).forEach((part) => {
              if (!part) return;
              if (/^\s+$/.test(part)) {
                frag.appendChild(document.createTextNode(part));
                return;
              }
              const s = document.createElement('span');
              s.className = 'basin__w';
              s.textContent = part;
              frag.appendChild(s);
              words.push(s);
            });
            node.replaceChild(frag, n);
          } else if (n.nodeType === 1) {
            if (n.classList.contains('basin__w')) words.push(n);
            else walk(n);
          }
        });
      };
      walk(quote);
    };
    split();

    let lit = false;
    const ignite = () => {
      if (lit) return;
      lit = true;
      words.forEach((w, i) => {
        setTimeout(() => w.classList.add('is-lit'), i * 70);
      });
      setTimeout(() => section.classList.add('is-signed'), words.length * 70 + 120);
    };

    const mo = new MutationObserver(() => {
      mo.disconnect();
      lit = false;
      split();
      mo.observe(quote, { childList: true, subtree: true });
    });
    mo.observe(quote, { childList: true, subtree: true });

    const io = new IntersectionObserver((entries) => {
      if (entries.some((en) => en.isIntersecting)) ignite();
    }, { threshold: 0.35 });
    io.observe(section);
  }

  /* ── cascade: 3D flip-in cards + water ripples + tilt ─── */
  function initCascade() {
    const grid = document.querySelector('[data-cascade]');
    if (!grid) return;
    if (window.__cascadeGrid === grid) return;
    window.__cascadeGrid = grid;

    const cards = [...grid.querySelectorAll('[data-cascade-card]')];
    const RM = matchMedia('(prefers-reduced-motion: reduce)').matches;
    const fine = matchMedia('(hover: hover) and (pointer: fine)').matches;

    /* flip into view as they enter the viewport */
    if (RM) {
      cards.forEach((c) => c.classList.add('is-in'));
    } else {
      const io = new IntersectionObserver((entries) => {
        entries.forEach((en) => {
          if (en.isIntersecting) {
            en.target.classList.add('is-in');
            io.unobserve(en.target);
          }
        });
      }, { threshold: 0.05, rootMargin: '40px 0px' });
      cards.forEach((c) => io.observe(c));
    }

    if (!fine || RM) return;

    cards.forEach((card) => {
      const face = card.querySelector('.cascade__face');
      if (!face) return;

      /* ripple canvas */
      const cv = document.createElement('canvas');
      cv.className = 'cascade__ripple';
      cv.setAttribute('aria-hidden', 'true');
      face.appendChild(cv);
      const ctx = cv.getContext('2d');
      let ripples = [];
      let raf = 0;
      let lastDrop = 0;

      const fit = () => {
        const r = face.getBoundingClientRect();
        const dpr = Math.min(devicePixelRatio || 1, 2);
        cv.width = Math.max(1, Math.round(r.width * dpr));
        cv.height = Math.max(1, Math.round(r.height * dpr));
        ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      };

      const paint = (now) => {
        const r = face.getBoundingClientRect();
        ctx.clearRect(0, 0, r.width, r.height);
        ripples = ripples.filter((d) => {
          const age = (now - d.t) / 900;
          if (age >= 1) return false;
          const rad = 8 + age * 70;
          ctx.beginPath();
          ctx.arc(d.x, d.y, rad, 0, Math.PI * 2);
          ctx.strokeStyle = `rgba(160, 215, 255, ${0.45 * (1 - age)})`;
          ctx.lineWidth = 1.6;
          ctx.stroke();
          ctx.beginPath();
          ctx.arc(d.x, d.y, rad * 0.55, 0, Math.PI * 2);
          ctx.strokeStyle = `rgba(200, 235, 255, ${0.22 * (1 - age)})`;
          ctx.lineWidth = 1;
          ctx.stroke();
          return true;
        });
        if (ripples.length) raf = requestAnimationFrame(paint);
        else raf = 0;
      };

      /* 3D tilt — applied to the flip wrapper so entrance + tilt compose */
      let hover = false;
      let tiltRaf = 0;
      let rx = 0, ry = 0;
      const flip = card.querySelector('.cascade__flip') || card;

      const applyTilt = () => {
        tiltRaf = 0;
        if (!card.classList.contains('is-in')) return;
        flip.style.transform = hover
          ? `perspective(1100px) rotateX(${rx}deg) rotateY(${ry}deg) translateZ(18px)`
          : '';
      };

      card.addEventListener('pointerenter', () => {
        hover = true;
        card.classList.add('is-tilt');
        fit();
      });

      card.addEventListener('pointermove', (e) => {
        if (!hover) return;
        const r = card.getBoundingClientRect();
        const px = (e.clientX - r.left) / r.width - 0.5;
        const py = (e.clientY - r.top) / r.height - 0.5;
        rx = py * -9;
        ry = px * 11;
        if (!tiltRaf) tiltRaf = requestAnimationFrame(applyTilt);

        const now = performance.now();
        if (now - lastDrop > 110) {
          lastDrop = now;
          ripples.push({ x: e.clientX - r.left, y: e.clientY - r.top, t: now });
          if (!raf) raf = requestAnimationFrame(paint);
        }
      });

      card.addEventListener('pointerleave', () => {
        hover = false;
        rx = ry = 0;
        card.classList.remove('is-tilt');
        flip.style.transform = '';
        ripples = [];
        if (raf) { cancelAnimationFrame(raf); raf = 0; }
        const r = face.getBoundingClientRect();
        ctx.clearRect(0, 0, r.width, r.height);
      });
    });
  }

  window.RainFlow = {
    init: function () {
      initDispatch();
      initStormline();
      initGale();
      initBasin();
      initCascade();
    },
  };

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => window.RainFlow.init());
  }
})();
