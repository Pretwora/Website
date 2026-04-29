/* ═══════════════════════════════════════
   ArrowShot — Main JS
   GSAP animations, interactions, form
   ═══════════════════════════════════════ */

document.addEventListener('DOMContentLoaded', () => {

  // ── GSAP ScrollTrigger ────────────────────
  if (typeof gsap !== 'undefined' && typeof ScrollTrigger !== 'undefined') {
    gsap.registerPlugin(ScrollTrigger);
  }

  // ── Header scroll behavior ────────────────
  const header = document.getElementById('header');
  let lastScroll = 0;

  window.addEventListener('scroll', () => {
    const scrollY = window.scrollY;
    header.classList.toggle('scrolled', scrollY > 40);
    lastScroll = scrollY;
  }, { passive: true });

  // ── Burger / Mobile nav ───────────────────
  const burger = document.getElementById('burger');
  const nav    = document.getElementById('nav');

  burger?.addEventListener('click', () => {
    const isOpen = burger.classList.toggle('is-open');
    nav.classList.toggle('is-open', isOpen);
    document.body.style.overflow = isOpen ? 'hidden' : '';
    burger.setAttribute('aria-label', isOpen ? 'Закрыть меню' : 'Открыть меню');
  });

  // Close mobile nav on link click
  nav?.querySelectorAll('.nav__link').forEach(link => {
    link.addEventListener('click', () => {
      burger.classList.remove('is-open');
      nav.classList.remove('is-open');
      document.body.style.overflow = '';
    });
  });

  // ── Reveal on scroll ─────────────────────
  const revealEls = document.querySelectorAll('.reveal');

  if (typeof IntersectionObserver !== 'undefined') {
    const observer = new IntersectionObserver((entries) => {
      entries.forEach((entry, idx) => {
        if (entry.isIntersecting) {
          // Stagger siblings in the same parent
          const siblings = Array.from(entry.target.parentElement.querySelectorAll('.reveal:not(.is-visible)'));
          const delay = siblings.indexOf(entry.target) * 80;
          setTimeout(() => {
            entry.target.classList.add('is-visible');
          }, Math.max(0, delay));
          observer.unobserve(entry.target);
        }
      });
    }, { threshold: 0.12, rootMargin: '0px 0px -60px 0px' });

    revealEls.forEach(el => observer.observe(el));
  } else {
    revealEls.forEach(el => el.classList.add('is-visible'));
  }

  // ── Counter animation ─────────────────────
  function animateCounter(el) {
    const target = parseInt(el.dataset.count, 10);
    const duration = 1800;
    const start = performance.now();

    function update(now) {
      const elapsed = now - start;
      const progress = Math.min(elapsed / duration, 1);
      // Ease out cubic
      const eased = 1 - Math.pow(1 - progress, 3);
      el.textContent = Math.round(eased * target);
      if (progress < 1) requestAnimationFrame(update);
    }
    requestAnimationFrame(update);
  }

  const counterObserver = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting && !entry.target.dataset.animated) {
        entry.target.dataset.animated = '1';
        animateCounter(entry.target);
        counterObserver.unobserve(entry.target);
      }
    });
  }, { threshold: 0.5 });

  document.querySelectorAll('.counter, .hero__stat-num').forEach(el => {
    counterObserver.observe(el);
  });

  // ── How-it-works progress line ────────────
  const howtoLine = document.getElementById('howtoLine');
  if (howtoLine) {
    const lineObserver = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          howtoLine.style.width = '100%';
          lineObserver.unobserve(entry.target);
        }
      });
    }, { threshold: 0.3 });
    lineObserver.observe(document.querySelector('.howto__steps') || howtoLine);
  }

  // ── Smooth scroll for anchor links ────────
  document.querySelectorAll('a[href^="#"]').forEach(anchor => {
    anchor.addEventListener('click', (e) => {
      const target = document.querySelector(anchor.getAttribute('href'));
      if (!target) return;
      e.preventDefault();
      const offset = header.offsetHeight + 16;
      const top = target.getBoundingClientRect().top + window.scrollY - offset;
      window.scrollTo({ top, behavior: 'smooth' });
    });
  });

  // ── Phone input mask ──────────────────────
  const phoneInput = document.getElementById('phone');
  if (phoneInput) {
    phoneInput.addEventListener('input', (e) => {
      let val = e.target.value.replace(/\D/g, '');
      if (val.startsWith('7') || val.startsWith('8')) val = val.slice(1);
      if (val.length === 0) { e.target.value = ''; return; }
      let result = '+7 (';
      if (val.length >= 1) result += val.slice(0, 3);
      if (val.length >= 4) result += ') ' + val.slice(3, 6);
      if (val.length >= 7) result += '-' + val.slice(6, 8);
      if (val.length >= 9) result += '-' + val.slice(8, 10);
      e.target.value = result;
    });
  }

  // ── Contact form ──────────────────────────
  const form  = document.getElementById('contactForm');
  const toast = document.getElementById('toast');

  form?.addEventListener('submit', (e) => {
    e.preventDefault();

    const name  = form.querySelector('#name').value.trim();
    const phone = form.querySelector('#phone').value.trim();

    if (!name) {
      shakeField(form.querySelector('#name'));
      return;
    }
    if (phone.length < 16) {
      shakeField(form.querySelector('#phone'));
      return;
    }

    const btn = form.querySelector('[type="submit"]');
    btn.disabled = true;
    btn.textContent = 'Отправляем…';

    // Simulate network delay
    setTimeout(() => {
      form.reset();
      btn.disabled = false;
      btn.innerHTML = 'Отправить заявку <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="18" height="18"><line x1="5" y1="12" x2="19" y2="12"/><polyline points="12 5 19 12 12 19"/></svg>';
      showToast();
    }, 900);
  });

  function shakeField(input) {
    input.style.borderColor = '#e05252';
    input.classList.add('shake');
    input.focus();
    setTimeout(() => {
      input.style.borderColor = '';
      input.classList.remove('shake');
    }, 600);
  }

  function showToast() {
    toast.classList.add('is-visible');
    setTimeout(() => toast.classList.remove('is-visible'), 4000);
  }

  // ── Gallery items lightbox (minimal) ──────
  document.querySelectorAll('.gallery__item').forEach(item => {
    item.addEventListener('click', () => {
      const img = item.querySelector('img');
      if (!img) return;
      const overlay = document.createElement('div');
      overlay.style.cssText = 'position:fixed;inset:0;background:rgba(26,26,26,0.92);z-index:500;display:flex;align-items:center;justify-content:center;cursor:zoom-out;animation:fadeIn 0.3s ease;backdrop-filter:blur(8px)';
      const clone = document.createElement('img');
      clone.src = img.src;
      clone.alt = img.alt;
      clone.style.cssText = 'max-width:90vw;max-height:90vh;border-radius:12px;object-fit:contain;box-shadow:0 32px 80px rgba(0,0,0,0.5)';
      overlay.appendChild(clone);
      overlay.addEventListener('click', () => overlay.remove());
      document.body.appendChild(overlay);
    });
  });

  // ── Cursor parallax on hero ───────────────
  const heroContent = document.querySelector('.hero__content');
  document.querySelector('.hero')?.addEventListener('mousemove', (e) => {
    if (!heroContent) return;
    const rx = (e.clientX / window.innerWidth - 0.5) * 12;
    const ry = (e.clientY / window.innerHeight - 0.5) * -8;
    heroContent.style.transform = `perspective(1000px) rotateY(${rx * 0.08}deg) rotateX(${ry * 0.08}deg)`;
  });
  document.querySelector('.hero')?.addEventListener('mouseleave', () => {
    if (heroContent) heroContent.style.transform = '';
  });

  // ── Stagger service cards ─────────────────
  const serviceCards = document.querySelectorAll('.service-card');
  const cardObserver = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        const cards = Array.from(entry.target.parentElement.querySelectorAll('.service-card'));
        const i = cards.indexOf(entry.target);
        entry.target.style.transitionDelay = `${i * 60}ms`;
        cardObserver.unobserve(entry.target);
      }
    });
  }, { threshold: 0.1 });
  serviceCards.forEach(c => cardObserver.observe(c));

});

// ── Shake animation (CSS injected) ───────────
const shakeStyle = document.createElement('style');
shakeStyle.textContent = `
  @keyframes shake {
    0%,100% { transform: translateX(0); }
    20%      { transform: translateX(-6px); }
    40%      { transform: translateX(6px); }
    60%      { transform: translateX(-4px); }
    80%      { transform: translateX(4px); }
  }
  .shake { animation: shake 0.5s var(--ease-out); }
`;
document.head.appendChild(shakeStyle);
