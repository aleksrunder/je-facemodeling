(() => {
  'use strict';

  const data = window.JE_SITE || {};
  const results = window.JE_RESULTS || [];
  const $ = (selector, root = document) => root.querySelector(selector);
  const $$ = (selector, root = document) => [...root.querySelectorAll(selector)];

  // Current year
  $$('[data-year]').forEach(el => { el.textContent = new Date().getFullYear(); });

  // Contact links from one configuration object
  const whatsappUrl = `https://wa.me/${data.phoneInternational || '37129831755'}?text=${encodeURIComponent(data.whatsappMessage || '')}`;
  $$('[data-booking-link], [data-whatsapp]').forEach(link => {
    link.href = whatsappUrl;
    link.target = '_blank';
    link.rel = 'noopener noreferrer';
  });
  $$('[data-instagram]').forEach(link => {
    if (data.instagram) link.href = data.instagram;
    link.target = '_blank';
    link.rel = 'noopener noreferrer';
  });
  const certificateUrl = `https://wa.me/${data.phoneInternational || '37129831755'}?text=${encodeURIComponent(data.certificateMessage || data.whatsappMessage || '')}`;
  $$('[data-certificate-link]').forEach(link => {
    link.href = certificateUrl;
    link.target = '_blank';
    link.rel = 'noopener noreferrer';
  });
  $$('[data-facebook]').forEach(link => {
    if (data.facebook) link.href = data.facebook;
    link.target = '_blank';
    link.rel = 'noopener noreferrer';
  });

  // Header, scroll progress and mobile CTA
  const header = $('[data-header]');
  const progress = $('.scroll-progress span');
  const mobileBooking = $('.mobile-booking');
  const onScroll = () => {
    const y = window.scrollY;
    header?.classList.toggle('is-scrolled', y > 36);
    mobileBooking?.classList.toggle('is-visible', y > 520 && y < document.documentElement.scrollHeight - window.innerHeight - 350);
    const max = document.documentElement.scrollHeight - window.innerHeight;
    if (progress) progress.style.width = `${max > 0 ? (y / max) * 100 : 0}%`;
  };
  onScroll();
  window.addEventListener('scroll', onScroll, { passive: true });

  // Mobile menu
  const menuToggle = $('[data-menu-toggle]');
  const nav = $('[data-nav]');
  const closeMenu = () => {
    menuToggle?.setAttribute('aria-expanded', 'false');
    nav?.classList.remove('is-open');
    document.body.classList.remove('menu-open');
  };
  menuToggle?.addEventListener('click', () => {
    const isOpen = menuToggle.getAttribute('aria-expanded') === 'true';
    menuToggle.setAttribute('aria-expanded', String(!isOpen));
    nav?.classList.toggle('is-open', !isOpen);
    document.body.classList.toggle('menu-open', !isOpen);
  });
  if (nav) $$('a', nav).forEach(link => link.addEventListener('click', closeMenu));
  window.addEventListener('keydown', event => { if (event.key === 'Escape') closeMenu(); });

  // Reveal animations
  const revealItems = $$('.reveal');
  if ('IntersectionObserver' in window && !window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
    const observer = new IntersectionObserver(entries => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          entry.target.classList.add('is-visible');
          observer.unobserve(entry.target);
        }
      });
    }, { threshold: 0.12, rootMargin: '0px 0px -5% 0px' });
    revealItems.forEach(item => observer.observe(item));
  } else {
    revealItems.forEach(item => item.classList.add('is-visible'));
  }

  // Result gallery / before-after sliders
  const resultsGrid = $('#results-grid');
  const lightbox = $('[data-lightbox]');
  let currentResult = 0;

  const resultTemplate = (item, index) => `
    <figure class="result-card reveal" data-result-index="${index}">
      <div class="compare" style="--position: 50%">
        <img class="before-image" src="${item.before}" alt="${item.altBefore}" loading="lazy" width="700" height="1400">
        <img class="after-image" src="${item.after}" alt="${item.altAfter}" loading="lazy" width="700" height="1400">
        <span class="compare-label compare-label-before">До</span>
        <span class="compare-label compare-label-after">После</span>
        <span class="compare-divider"></span>
        <span class="compare-handle"></span>
        <input type="range" min="0" max="100" value="50" aria-label="Сравнить фото до и после: ${item.title}">
      </div>
      <figcaption class="result-caption">
        <span>${item.title}</span>
        <button type="button" data-open-result="${index}">Открыть фото</button>
      </figcaption>
    </figure>`;

  if (resultsGrid) {
    resultsGrid.innerHTML = results.map(resultTemplate).join('');
    $$('.result-card', resultsGrid).forEach(card => card.classList.add('is-visible'));

    $$('.compare', resultsGrid).forEach(compare => {
      const range = $('input[type="range"]', compare);
      const update = value => compare.style.setProperty('--position', `${value}%`);
      range.addEventListener('input', () => update(range.value));
      compare.addEventListener('dblclick', () => {
        const index = Number(compare.closest('[data-result-index]').dataset.resultIndex);
        openLightbox(index);
      });
    });

    $$('[data-open-result]', resultsGrid).forEach(button => {
      button.addEventListener('click', () => openLightbox(Number(button.dataset.openResult)));
    });
  }

  function renderLightbox(index) {
    if (!results.length) return;
    currentResult = (index + results.length) % results.length;
    const item = results[currentResult];
    $('[data-lightbox-title]').textContent = item.title;
    const before = $('[data-lightbox-before]');
    const after = $('[data-lightbox-after]');
    before.src = item.before;
    after.src = item.after;
    before.alt = item.altBefore;
    after.alt = item.altAfter;
  }

  function openLightbox(index) {
    if (!lightbox) return;
    renderLightbox(index);
    lightbox.showModal();
    document.body.classList.add('modal-open');
  }

  function closeLightbox() {
    lightbox?.close();
    document.body.classList.remove('modal-open');
  }

  $('[data-lightbox-close]')?.addEventListener('click', closeLightbox);
  $('[data-lightbox-prev]')?.addEventListener('click', () => renderLightbox(currentResult - 1));
  $('[data-lightbox-next]')?.addEventListener('click', () => renderLightbox(currentResult + 1));
  lightbox?.addEventListener('click', event => { if (event.target === lightbox) closeLightbox(); });
  lightbox?.addEventListener('close', () => document.body.classList.remove('modal-open'));
  window.addEventListener('keydown', event => {
    if (!lightbox?.open) return;
    if (event.key === 'ArrowLeft') renderLightbox(currentResult - 1);
    if (event.key === 'ArrowRight') renderLightbox(currentResult + 1);
    if (event.key === 'Escape') closeLightbox();
  });

  // Cookie consent and privacy-friendly Google Map
  const CONSENT_KEY = 'je_cookie_consent_v1';
  const banner = $('[data-cookie-banner]');
  const dialog = $('[data-consent-dialog]');
  const externalToggle = $('[data-external-toggle]');
  const mapShell = $('[data-map-shell]');

  const readConsent = () => {
    try { return JSON.parse(localStorage.getItem(CONSENT_KEY)); }
    catch { return null; }
  };
  const writeConsent = externalMedia => {
    const consent = { necessary: true, externalMedia: Boolean(externalMedia), updated: new Date().toISOString() };
    localStorage.setItem(CONSENT_KEY, JSON.stringify(consent));
    if (banner) banner.hidden = true;
    if (consent.externalMedia) loadMap();
    return consent;
  };
  const openSettings = () => {
    const consent = readConsent();
    if (externalToggle) externalToggle.checked = Boolean(consent?.externalMedia);
    dialog?.showModal();
  };

  function loadMap() {
    if (!mapShell || $('iframe', mapShell)) return;
    const iframe = document.createElement('iframe');
    iframe.title = 'Google-карта: Rīgas iela 64, Daugavpils';
    iframe.loading = 'lazy';
    iframe.referrerPolicy = 'no-referrer-when-downgrade';
    iframe.allowFullscreen = true;
    iframe.src = data.mapUrl || 'https://www.google.com/maps?q=R%C4%ABgas%20iela%2064%2C%20Daugavpils&output=embed';
    mapShell.replaceChildren(iframe);
  }

  $$('[data-cookie-settings]').forEach(button => button.addEventListener('click', openSettings));
  $('[data-cookie-accept]')?.addEventListener('click', () => writeConsent(true));
  $('[data-cookie-necessary]')?.addEventListener('click', () => writeConsent(false));
  $('[data-save-consent]')?.addEventListener('click', event => {
    event.preventDefault();
    writeConsent(Boolean(externalToggle?.checked));
    dialog?.close();
  });
  $('[data-load-map]')?.addEventListener('click', () => {
    writeConsent(true);
    loadMap();
  });

  const consent = readConsent();
  if (!consent) {
    if (banner) banner.hidden = false;
  } else if (consent.externalMedia) {
    loadMap();
  }
})();
