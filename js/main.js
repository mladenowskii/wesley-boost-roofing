/* ============================================================
   BOOST ROOFING — Main JavaScript  (Enhanced)
   ============================================================ */

(function () {
  'use strict';

  /* ─── Utility: throttle ─── */
  function throttle(fn, wait) {
    let last = 0;
    return function () {
      const now = Date.now();
      if (now - last >= wait) { last = now; fn.apply(this, arguments); }
    };
  }

  /* ─── Utility: check reduced motion preference ─── */
  const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  /* ─── Sticky Navbar ─── */
  const navbar = document.getElementById('navbar');
  if (navbar) {
    /* Sum the height of every in-flow bar stacked above the navbar
       (e.g. the emergency banner + the top contact bar). Hidden or
       absolutely-positioned elements (skip link, mobile-hidden top bar)
       are ignored, so this works on every page automatically. */
    function getBarsHeight() {
      let total = 0;
      let el = navbar.previousElementSibling;
      while (el) {
        const cs = getComputedStyle(el);
        if (cs.display !== 'none' && cs.position !== 'absolute' && cs.position !== 'fixed') {
          total += el.offsetHeight;
        }
        el = el.previousElementSibling;
      }
      return total;
    }
    const onScroll = throttle(function () {
      const h = getBarsHeight();
      const sy = window.scrollY;
      navbar.classList.toggle('scrolled', sy > 60);
      navbar.style.top = Math.max(0, h - sy) + 'px';
    }, 16);
    window.addEventListener('scroll', onScroll, { passive: true });
    window.addEventListener('resize', onScroll);
    onScroll();
  }

  /* ─── Mobile Menu ─── */
  const mobileBtn = document.getElementById('mobileMenuBtn');
  const mobileNav = document.getElementById('mobileNav');

  if (mobileBtn && mobileNav) {
    mobileBtn.setAttribute('aria-expanded', 'false');
    mobileBtn.setAttribute('aria-controls', 'mobileNav');

    function openMenu() {
      mobileNav.classList.add('open');
      mobileBtn.classList.add('open');
      mobileBtn.setAttribute('aria-expanded', 'true');
      document.body.style.overflow = 'hidden';
    }
    function closeMenu() {
      mobileNav.classList.remove('open');
      mobileBtn.classList.remove('open');
      mobileBtn.setAttribute('aria-expanded', 'false');
      document.body.style.overflow = '';
    }

    mobileBtn.addEventListener('click', function () {
      mobileNav.classList.contains('open') ? closeMenu() : openMenu();
    });

    mobileNav.querySelectorAll('a').forEach(function (link) {
      link.addEventListener('click', closeMenu);
    });

    document.addEventListener('keydown', function (e) {
      if (e.key === 'Escape' && mobileNav.classList.contains('open')) {
        closeMenu();
        mobileBtn.focus();
      }
    });
  }

  /* ─── Mobile Sub-menu Toggles ─── */
  document.querySelectorAll('.mobile-nav-toggle').forEach(function (btn) {
    btn.addEventListener('click', function () {
      var sub = btn.nextElementSibling;
      if (!sub) return;
      var isOpen = sub.classList.toggle('open');
      var arrow = btn.querySelector('.toggle-arrow');
      if (arrow) arrow.classList.toggle('rotated', isOpen);
      btn.setAttribute('aria-expanded', isOpen ? 'true' : 'false');
    });
  });

  /* ─── FAQ Accordion ─── */
  document.querySelectorAll('.faq-question').forEach(function (btn) {
    btn.setAttribute('aria-expanded', 'false');

    btn.addEventListener('click', function () {
      var item = btn.closest('.faq-item');
      var answer = item.querySelector('.faq-answer');
      var isOpen = item.classList.contains('open');

      /* Close all open items */
      document.querySelectorAll('.faq-item.open').forEach(function (el) {
        el.classList.remove('open');
        el.querySelector('.faq-answer').style.maxHeight = '0';
        var q = el.querySelector('.faq-question');
        if (q) q.setAttribute('aria-expanded', 'false');
      });

      /* Open clicked if it was closed */
      if (!isOpen) {
        item.classList.add('open');
        answer.style.maxHeight = answer.scrollHeight + 'px';
        btn.setAttribute('aria-expanded', 'true');
      }
    });
  });

  /* ─── Scroll Animations ─── */
  var animEls = document.querySelectorAll('.fade-up, .fade-left, .fade-right, .scale-in');
  if (animEls.length) {
    if (prefersReducedMotion) {
      animEls.forEach(function (el) { el.classList.add('visible'); });
    } else {
      var animObserver = new IntersectionObserver(function (entries) {
        entries.forEach(function (entry) {
          if (entry.isIntersecting) {
            entry.target.classList.add('visible');
            animObserver.unobserve(entry.target);
          }
        });
      }, { threshold: 0.1, rootMargin: '0px 0px -50px 0px' });
      animEls.forEach(function (el) { animObserver.observe(el); });
    }
  }

  /* ─── Animated Counters (rAF + easing) ─── */
  function easeOutCubic(t) { return 1 - Math.pow(1 - t, 3); }

  function animateCounter(el) {
    var target = parseInt(el.dataset.target, 10);
    if (isNaN(target)) return;
    var duration = prefersReducedMotion ? 0 : 2000;
    var start = performance.now();

    function tick(now) {
      var elapsed = now - start;
      var progress = Math.min(elapsed / duration, 1);
      var value = Math.floor(easeOutCubic(progress) * target);
      el.textContent = value.toLocaleString();
      if (progress < 1) requestAnimationFrame(tick);
      else el.textContent = target.toLocaleString();
    }
    if (duration === 0) { el.textContent = target.toLocaleString(); return; }
    requestAnimationFrame(tick);
  }

  var counters = document.querySelectorAll('.counter-num');
  if (counters.length) {
    var counterObserver = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (entry.isIntersecting) {
          animateCounter(entry.target);
          counterObserver.unobserve(entry.target);
        }
      });
    }, { threshold: 0.5 });
    counters.forEach(function (el) { counterObserver.observe(el); });
  }

  /* ─── Gallery Filter ─── */
  var filterTabs = document.querySelectorAll('.filter-tab');
  var galleryItems = document.querySelectorAll('.gallery-item[data-category]');

  if (filterTabs.length && galleryItems.length) {
    filterTabs.forEach(function (tab) {
      tab.addEventListener('click', function () {
        filterTabs.forEach(function (t) { t.classList.remove('active'); });
        tab.classList.add('active');

        var cat = tab.dataset.filter;
        galleryItems.forEach(function (item) {
          var matches = cat === 'all' || item.dataset.category === cat;
          item.style.transition = 'opacity 0.3s ease, transform 0.35s ease';
          item.style.opacity = matches ? '1' : '0.12';
          item.style.pointerEvents = matches ? 'auto' : 'none';
          item.style.transform = matches ? 'scale(1)' : 'scale(0.96)';
        });
      });
    });
  }

  /* ─── Gallery Lightbox ─── */
  var galleryImgEls = document.querySelectorAll('.gallery-item');
  if (galleryImgEls.length) {
    var lightbox = document.createElement('div');
    lightbox.className = 'lightbox-overlay';
    lightbox.setAttribute('role', 'dialog');
    lightbox.setAttribute('aria-modal', 'true');
    lightbox.setAttribute('aria-label', 'Image viewer');
    lightbox.innerHTML = [
      '<div class="lightbox-img-wrap">',
        '<button class="lightbox-close" aria-label="Close image viewer">',
          '<svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" fill="none" stroke="currentColor" stroke-width="2.5" viewBox="0 0 24 24"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>',
        '</button>',
        '<img class="lightbox-img" src="" alt="" />',
      '</div>',
      '<div class="lightbox-caption"></div>',
      '<button class="lightbox-nav lightbox-prev" aria-label="Previous image">',
        '<svg xmlns="http://www.w3.org/2000/svg" width="22" height="22" fill="none" stroke="currentColor" stroke-width="2.5" viewBox="0 0 24 24"><polyline points="15 18 9 12 15 6"/></svg>',
      '</button>',
      '<button class="lightbox-nav lightbox-next" aria-label="Next image">',
        '<svg xmlns="http://www.w3.org/2000/svg" width="22" height="22" fill="none" stroke="currentColor" stroke-width="2.5" viewBox="0 0 24 24"><polyline points="9 18 15 12 9 6"/></svg>',
      '</button>'
    ].join('');
    document.body.appendChild(lightbox);

    var lbImg     = lightbox.querySelector('.lightbox-img');
    var lbCaption = lightbox.querySelector('.lightbox-caption');
    var lbClose   = lightbox.querySelector('.lightbox-close');
    var lbPrev    = lightbox.querySelector('.lightbox-prev');
    var lbNext    = lightbox.querySelector('.lightbox-next');
    var lbItems   = Array.from(galleryImgEls);
    var lbCurrent = 0;

    function openLightbox(index) {
      lbCurrent = index;
      var item = lbItems[index];
      var img  = item.querySelector('.gallery-img') || item.querySelector('img');
      var cap  = item.querySelector('.gallery-overlay span');
      if (!img) return;
      lbImg.src = img.src;
      lbImg.alt = img.alt || '';
      lbCaption.textContent = cap ? cap.textContent : '';
      lightbox.classList.add('open');
      document.body.style.overflow = 'hidden';
      lbClose.focus();
    }

    function closeLightbox() {
      lightbox.classList.remove('open');
      document.body.style.overflow = '';
    }

    lbItems.forEach(function (item, i) {
      item.addEventListener('click', function () { openLightbox(i); });
    });

    lbClose.addEventListener('click', closeLightbox);
    lightbox.addEventListener('click', function (e) {
      if (e.target === lightbox) closeLightbox();
    });
    lbPrev.addEventListener('click', function () {
      openLightbox((lbCurrent - 1 + lbItems.length) % lbItems.length);
    });
    lbNext.addEventListener('click', function () {
      openLightbox((lbCurrent + 1) % lbItems.length);
    });

    document.addEventListener('keydown', function (e) {
      if (!lightbox.classList.contains('open')) return;
      if (e.key === 'Escape')     closeLightbox();
      if (e.key === 'ArrowLeft')  lbPrev.click();
      if (e.key === 'ArrowRight') lbNext.click();
    });
  }

  /* ─── Floating CTA Widget (Desktop) ─── */
  var isSubPage = window.location.pathname.indexOf('/services/') !== -1;
  var baseHref  = isSubPage ? '../' : '';

  var floatCTA = document.createElement('div');
  floatCTA.className = 'float-cta';
  floatCTA.setAttribute('aria-label', 'Quick contact');
  floatCTA.innerHTML = [
    '<a href="' + baseHref + 'contact.html" class="float-cta-btn float-cta-quote">',
      '<svg xmlns="http://www.w3.org/2000/svg" width="15" height="15" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><path d="M9 11l3 3L22 4"/><path d="M21 12v7a2 2 0 01-2 2H5a2 2 0 01-2-2V5a2 2 0 012-2h11"/></svg>',
      'Free Quote',
    '</a>',
    '<a href="tel:4806024277" class="float-cta-btn float-cta-call">',
      '<svg xmlns="http://www.w3.org/2000/svg" width="15" height="15" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><path d="M22 16.92v3a2 2 0 01-2.18 2 19.79 19.79 0 01-8.63-3.07 19.5 19.5 0 01-6-6A19.79 19.79 0 012.12 4.18 2 2 0 014.11 2h3a2 2 0 012 1.72c.127.96.361 1.903.7 2.81a2 2 0 01-.45 2.11L8.09 9.91a16 16 0 006 6l1.27-1.27a2 2 0 012.11-.45c.907.339 1.85.573 2.81.7A2 2 0 0122 16.92z"/></svg>',
      '(480) 602-4277',
    '</a>'
  ].join('');
  document.body.appendChild(floatCTA);

  var showFloat = throttle(function () {
    floatCTA.classList.toggle('visible', window.scrollY > 420);
  }, 80);
  window.addEventListener('scroll', showFloat, { passive: true });

  /* ─── Hero Parallax (background-position approach) ─── */
  var heroBg = document.querySelector('.hero-bg');
  if (heroBg && !prefersReducedMotion) {
    var parallax = throttle(function () {
      var scrollY = window.scrollY;
      if (scrollY < window.innerHeight) {
        heroBg.style.backgroundPosition = 'center calc(50% + ' + (scrollY * 0.22) + 'px)';
      }
    }, 16);
    window.addEventListener('scroll', parallax, { passive: true });
  }

  /* ─── Active Nav Link ─── */
  var currentFile = window.location.pathname.split('/').pop() || 'index.html';
  document.querySelectorAll('.nav-link:not(.active), .dropdown-item:not(.active)').forEach(function (link) {
    var href = link.getAttribute('href') || '';
    var hrefFile = href.split('/').pop();
    if (hrefFile && hrefFile === currentFile) {
      link.classList.add('active');
    }
  });

  /* ─── Form Submission (placeholder) ─── */
  document.querySelectorAll('form[data-contact-form]').forEach(function (form) {
    form.addEventListener('submit', function (e) {
      e.preventDefault();
      var btn = form.querySelector('[type="submit"]');
      var original = btn.innerHTML;
      btn.innerHTML = '<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2.5" viewBox="0 0 24 24"><polyline points="20 6 9 17 4 12"/></svg> Message Sent!';
      btn.disabled = true;
      btn.style.background = '#16a34a';
      setTimeout(function () {
        btn.innerHTML = original;
        btn.disabled = false;
        btn.style.background = '';
        form.reset();
      }, 4000);
    });
  });

  /* ─── Mobile Sticky CTA ─── */
  var stickyCta = document.getElementById('mobileStickyCtA');
  if (stickyCta) {
    var toggleSticky = throttle(function () {
      var isMobile = window.innerWidth <= 768;
      stickyCta.style.display = (isMobile && window.scrollY > 200) ? 'block' : 'none';
    }, 80);
    window.addEventListener('scroll', toggleSticky, { passive: true });
    window.addEventListener('resize', toggleSticky);
    toggleSticky();
  }

  /* ─── Smooth Service Card Image Clip ─── */
  /* image zoom is handled via CSS, this ensures overflow hidden is kept */

})();
