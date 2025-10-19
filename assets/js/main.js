// main.js — LaScala (fixed selectors + resilient counters + featured dishes)
document.addEventListener('DOMContentLoaded', () => {
  // ===== Common =====
  const yearSpan = document.getElementById('year');
  if (yearSpan) yearSpan.textContent = new Date().getFullYear();

  const WHATSAPP_NUMBER   = '966546480098';
  const LOGO_PLACEHOLDER  = 'assets/images/logo.png';

  // ===== Category normalization =====
  const CAT_ALIASES = {
    'starters':'المقبلات','soups':'الشوربات','mains':'الأطباق الرئيسية',
    'pasta':'الباستا','pasta_risotto':'الباستا','risotto':'الباستا',
    'pizza':'البيتزا','burger':'البرجر','burgers':'البرجر',
    'sandwiches':'السندويتشات','kids_menu':'قائمة الأطفال',
    'desserts':'الحلويات','hot_drinks':'المشروبات الساخنة',
    'cold_drinks':'المشروبات الباردة','drinks':'المشروبات الباردة',
    'juices':'العصائر','lascala_offers':'عروض لاسكالا'
  };
  const ORDER_AR   = ['المقبلات','الشوربات','الأطباق الرئيسية','الباستا','البيتزا','البرجر','السندويتشات','الحلويات','المشروبات الباردة','المشروبات الساخنة','العصائر','قائمة الأطفال','عروض لاسكالا'];
  const FEATURED_AR = ['الأطباق الرئيسية','الباستا','البيتزا'];
  const normalizeCategory = (cat)=> CAT_ALIASES[String(cat||'').trim()] || String(cat||'').trim();

  // ===== Helpers =====
  function buildMenuUrl() {
    const u = new URL('assets/data/menu.json', document.baseURI);
    u.searchParams.set('v', Date.now().toString());
    return u.toString();
  }
  async function loadMenuJson() {
    const url = buildMenuUrl();
    const res = await fetch(url, { cache: 'no-store' });
    if (!res.ok) throw new Error(`HTTP ${res.status} @ ${url}`);
    const text = await res.text();
    try {
      const data = JSON.parse(text);
      return { data, url };
    } catch (parseErr) {
      const preview = text.slice(Math.max(0, (parseErr.position||0) - 10), (parseErr.position||0) + 90).replace(/\s+/g,' ');
      throw new Error(`JSON parse error @ ${url} :: ${parseErr.message} :: preview="${preview}"`);
    }
  }

  // ===== Smart selectors (to match your HTML) =====
  const SIGNATURE_CONTAINER =
      document.getElementById('signature-dishes-container') ||
      document.getElementById('signature-dishes') ||
      document.querySelector('[data-signature-dishes]');

  const STATS_SECTION =
      document.querySelector('.stats-section') ||
      document.getElementById('stats') ||
      document.querySelector('[data-stats]');

  // ===== Page routers =====
  if (document.getElementById('menu-grid')) initMenuPage();
  if (SIGNATURE_CONTAINER) initHomePage();
  else if (STATS_SECTION) initStatsCounters(null); // حتى لو مو بالهوم

  // ===== Menu Page =====
  async function initMenuPage() {
    const grid = document.getElementById('menu-grid');
    const filtersContainer = document.getElementById('menu-filters');
    const searchInput = document.getElementById('menuSearch');
    let allDishes = [];

    try {
      const { data, url } = await loadMenuJson();
      allDishes = data.map(it => ({ ...it, category: normalizeCategory(it.category) }));
      renderFilters(allDishes);
      renderMenu(allDishes);
      console.log('[menu source used]', url);
    } catch (err) {
      console.error('Menu page load error:', err);
      grid.innerHTML = `
        <div class="col-span-full text-center p-8">
          <p class="text-lg">خطأ في تحميل قائمة الطعام.</p>
          <small class="block text-muted-text mt-2" dir="ltr">${String(err.message || err)}</small>
        </div>`;
      return;
    }

    function renderFilters(dishes) {
      const present = Array.from(new Set(dishes.map(d => d.category).filter(Boolean)));
      const ordered = [
        ...ORDER_AR.filter(cat => present.includes(cat)),
        ...present.filter(cat => !ORDER_AR.includes(cat)).sort((a,b)=>a.localeCompare(b,'ar'))
      ];
      const categories = ['الكل', ...ordered];
      if (!filtersContainer) return;

      filtersContainer.innerHTML = categories.map(cat => `
        <button type="button" data-cat="${cat}" class="filter-chip ${cat==='الكل'?'active':''}">
          ${cat}
        </button>`).join('');

      filtersContainer.addEventListener('click', (e) => {
        const btn = e.target.closest('.filter-chip');
        if (!btn) return;
        filtersContainer.querySelector('.active')?.classList.remove('active');
        btn.classList.add('active');
        filterAndRender();
      });
    }

    function renderMenu(dishes) {
      if (!grid) return;
      if (!dishes.length) {
        grid.innerHTML = `<p class="col-span-full text-center text-muted-text p-8">لا توجد نتائج مطابقة لبحثك.</p>`;
        return;
      }
      grid.innerHTML = dishes.map(dish => {
        const imgSrc = dish.image || LOGO_PLACEHOLDER;
        const imgStyle = dish.image ? '' : 'object-fit:contain;padding:20px;opacity:.6;';
        return `
        <div class="menu-card-glass" data-id="${dish.id}">
          <img src="${imgSrc}" alt="${dish.title||''}" style="${imgStyle}">
          <div class="p-4">
            <h3 class="text-lg font-bold text-primary-gold">${dish.title||''}</h3>
            <p class="mt-2 line-clamp-2 text-muted-text">${dish.desc??''}</p>
            <div class="menu-card-price">${dish.price??''}</div>
          </div>
        </div>`;
      }).join('');

      grid.querySelectorAll('.menu-card-glass').forEach(card => {
        card.addEventListener('click', () => {
          const dish = allDishes.find(d => String(d.id) === String(card.dataset.id));
          openQuickView(dish);
        });
      });
    }

    function filterAndRender() {
      const active = filtersContainer?.querySelector('.active')?.dataset.cat || 'الكل';
      const term = (searchInput?.value || '').toLowerCase().trim();
      const filtered = allDishes.filter(d => {
        const catOK = active === 'الكل' || d.category === active;
        if (!term) return catOK;
        const textOK =
          (d.title||'').toLowerCase().includes(term) ||
          (d.desc||'').toLowerCase().includes(term) ||
          (d.long_desc||'').toLowerCase().includes(term);
        return catOK && textOK;
      });
      renderMenu(filtered);
    }

    searchInput?.addEventListener('input', filterAndRender);
  }

  // ===== Home Page (featured + counters) =====
  async function initHomePage() {
    let allDishes = [];
    try {
      const { data } = await loadMenuJson();
      allDishes = data.map(it => ({ ...it, category: normalizeCategory(it.category) }));

      // Featured
      renderFeatured(allDishes);

      // Counters with dishes count
      initStatsCounters(allDishes);
    } catch (err) {
      console.error('Homepage load error:', err);
      SIGNATURE_CONTAINER.innerHTML = `<p class="col-span-full text-center text-muted-text p-8">خطأ في تحميل الأطباق المميزة.</p>`;
      initStatsCounters(null);
    }
  }

  function renderFeatured(allDishes) {
    if (!SIGNATURE_CONTAINER) return;
    const featuredDishes = allDishes
      .filter(d => FEATURED_AR.includes(d.category))
      .slice(0, 4);

    if (!featuredDishes.length) {
      SIGNATURE_CONTAINER.innerHTML = `<p class="col-span-full text-center text-muted-text p-8">لا توجد أطباق مميزة حالياً.</p>`;
      return;
    }

    SIGNATURE_CONTAINER.innerHTML = featuredDishes.map(dish => {
      const imgSrc = dish.image || LOGO_PLACEHOLDER;
      const imgStyle = dish.image ? '' : 'object-fit:contain;padding:20px;opacity:.6;';
      return `
      <div class="menu-card-glass cursor-pointer" data-id="${dish.id}">
        <div class="h-48 w-full overflow-hidden">
          <img src="${imgSrc}" alt="${dish.title||''}" style="${imgStyle}" class="h-full w-full object-cover group-hover:scale-110 transition-transform duration-300">
        </div>
        <div class="p-4">
          <h3 class="text-lg font-bold text-primary-gold">${dish.title||''}</h3>
          <p class="mt-2 text-sm line-clamp-2 text-muted-text">${dish.desc??''}</p>
          <div class="mt-4 font-bold text-lg">${dish.price??''}</div>
        </div>
      </div>`;
    }).join('');

    SIGNATURE_CONTAINER.querySelectorAll('.menu-card-glass').forEach(card => {
      card.addEventListener('click', () => {
        const id = card.getAttribute('data-id');
        const dish = featuredDishes.find(d => String(d.id) === String(id));
        if (dish) openQuickView(dish);
      });
    });
  }

  // ===== Stats Counters (resilient) =====
  function initStatsCounters(dishes) {
    if (!STATS_SECTION) return;

    // 1) عالج عنصر "طبق في قائمتنا" حتى لو تغيّر النص
    if (dishes && dishes.length) {
      STATS_SECTION.querySelectorAll('.stat, [data-stat]').forEach(stat => {
        const label = stat.querySelector('small, .label, .stat-label');
        if (!label) return;
        const text = (label.textContent || '').trim();
        const isMenuCount =
          stat.hasAttribute('data-stat') && stat.getAttribute('data-stat') === 'menu-count' ||
          /طبق/.test(text) && /قائم|قائمتنا|menu/i.test(text);
        if (isMenuCount) {
          const counterSpan =
            stat.querySelector('span[data-count]') ||
            stat.querySelector('.counter, .value, span') ||
            stat.querySelector('strong, b');
          if (counterSpan) counterSpan.setAttribute('data-count', String(dishes.length));
        }
      });
    }

    // 2) التعرّف على كل العدادات حتى لو ما فيها data-count
    const candidates = Array.from(STATS_SECTION.querySelectorAll('span[data-count], .counter, .value, .stat span, .stat strong, .stat b'))
      .filter(el => !el.closest('[data-ignore-counter]')); // لو حاب تستثني شي

    // لو ما في شي نطلع
    if (!candidates.length) return;

    // أعطِ data-count إذا مفقودة وخذها من الرقم الحالي أو صفر
    candidates.forEach(el => {
      if (!el.hasAttribute('data-count')) {
        const n = parseFloat(String(el.textContent||'0').replace(/[^\d.]/g,'')) || 0;
        el.setAttribute('data-count', String(n));
      }
    });

    // 3) أنيميشن
    const animateCounter = (el, target, precision=0) => {
      let current = 0;
      const duration = 1500;
      const steps = 50;
      const increment = target / steps;
      const stepTime = duration / steps;
      const timer = setInterval(() => {
        current += increment;
        if (current >= target) {
          clearInterval(timer);
          el.textContent = target.toFixed(precision);
        } else {
          el.textContent = current.toFixed(precision);
        }
      }, stepTime);
    };

    const startFor = (el) => {
      const target = parseFloat(el.getAttribute('data-count')||'0');
      const precision = parseInt(el.getAttribute('data-precision')||'0',10) || 0;
      animateCounter(el, target, precision);
    };

    // 4) شغّل عند الظهور — ولو المتصفح قديم شغّل فوراً
    try {
      const observer = new IntersectionObserver((entries, obs) => {
        entries.forEach(entry => {
          if (entry.isIntersecting) {
            startFor(entry.target);
            obs.unobserve(entry.target);
          }
        });
      }, { threshold: 0.1 });
      candidates.forEach(el => observer.observe(el));
    } catch {
      // متصفحات قديمة
      candidates.forEach(startFor);
    }
  }

  // ===== Modal =====
  const modal = document.getElementById('quickViewModal');
  if (modal) {
    const closeModalBtn = document.getElementById('closeModalBtn');
    const modalBackdrop = modal.querySelector('.modal-backdrop');
    const closeModal = () => {
      modal.classList.remove('show');
      document.documentElement.classList.remove('overflow-hidden');
    };
    closeModalBtn?.addEventListener('click', closeModal);
    modalBackdrop?.addEventListener('click', closeModal);
  }

  function openQuickView(dish) {
    if (!dish || !modal) return;
    const imgEl     = document.getElementById('qvImg');
    const titleEl   = document.getElementById('qvTitle');
    const shortDesc = document.getElementById('qvShortDesc');
    const longDesc  = document.getElementById('qvLongDesc');
    const priceEl   = document.getElementById('qvPrice');

    const imgSrc = dish.image || LOGO_PLACEHOLDER;
    if (imgEl) {
      imgEl.src = imgSrc;
      imgEl.alt = dish.title || '';
      imgEl.style.objectFit = dish.image ? 'cover' : 'contain';
      imgEl.style.padding    = dish.image ? '0' : '2rem';
      imgEl.style.background = dish.image ? '#0d1320' : 'var(--card)';
    }
    if (titleEl)   titleEl.textContent = dish.title || '';
    if (shortDesc) shortDesc.textContent = dish.desc || '';
    if (longDesc)  longDesc.textContent = dish.long_desc || '';
    if (priceEl)   priceEl.textContent  = dish.price || '';

    const allergensContainer = document.getElementById('qvAllergensContainer');
    const allergensDiv       = document.getElementById('qvAllergens');
    if (dish.allergens && dish.allergens.length && allergensDiv && allergensContainer) {
      allergensDiv.innerHTML = dish.allergens.map(a => `<span class="badge">${a}</span>`).join('');
      allergensContainer.classList.remove('hidden');
    } else {
      allergensContainer?.classList.add('hidden');
    }

    const chefNoteContainer = document.getElementById('qvChefNoteContainer');
    const chefNoteP = document.getElementById('qvChefNote');
    if (dish.chef_note && chefNoteContainer && chefNoteP) {
      chefNoteP.textContent = dish.chef_note;
      chefNoteContainer.classList.remove('hidden');
    } else {
      chefNoteContainer?.classList.add('hidden');
    }

    modal.classList.add('show');
    document.documentElement.classList.add('overflow-hidden');
  }

  // ===== Forms -> WhatsApp =====
  const reservationForm = document.getElementById('reservationForm');
  if (reservationForm) {
    reservationForm.addEventListener('submit', function(e) {
      e.preventDefault();
      const name    = document.getElementById('full-name').value;
      const phone   = document.getElementById('phone').value;
      const date    = document.getElementById('date').value;
      const time    = document.getElementById('time').value;
      const guests  = document.getElementById('guests').value;
      const requests= document.getElementById('special-requests').value;

      let message = `*طلب حجز جديد من LaScala* 🍽️\n\n`;
      message += `*الاسم:* ${name}\n`;
      message += `*الجوال:* ${phone}\n`;
      message += `*التاريخ:* ${date}\n`;
      message += `*الوقت:* ${time}\n`;
      message += `*عدد الضيوف:* ${guests}\n`;
      if (requests) message += `*طلبات خاصة:* ${requests}\n`;
      message += `\nبرجاء تأكيد الحجز مع العميل.`;

      const whatsappUrl = `https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent(message)}`;
      window.open(whatsappUrl, '_blank');

      reservationForm.reset();
      const customModal = document.getElementById('customModal');
      if (customModal) {
        document.getElementById('modalTitle').textContent = 'تم إرسال الطلب';
        document.getElementById('modalMessage').textContent = 'تم إرسال طلب الحجز بنجاح عبر واتساب. سنتواصل معك قريباً للتأكيد.';
        customModal.classList.remove('hidden');
      }
    });
  }

  const contactForm = document.getElementById('contactForm');
  if (contactForm) {
    contactForm.addEventListener('submit', function(e) {
      e.preventDefault();
      const statusDiv = document.getElementById('formStatus');
      if (statusDiv) { statusDiv.textContent = 'جاري الإرسال...'; }

      const name = document.getElementById('name').value;
      const phone = document.getElementById('phone').value;
      const subject = document.getElementById('subject').value;
      const msg = document.getElementById('message').value;

      let message = `*رسالة جديدة من (تواصل معنا)* 📬\n\n`;
      message += `*الاسم:* ${name}\n`;
      message += `*الجوال:* ${phone}\n`;
      message += `*الموضوع:* ${subject}\n\n`;
      message += `*الرسالة:*\n${msg}`;

      const whatsappUrl = `https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent(message)}`;
      window.open(whatsappUrl, '_blank');

      if (statusDiv) {
        statusDiv.textContent = 'تم فتح واتساب لإرسال رسالتك. شكراً لك!';
        statusDiv.style.color = '#D4AF37';
        setTimeout(() => { statusDiv.textContent = ''; }, 5000);
      }
      contactForm.reset();
    });
  }

  const modalCloseBtn = document.getElementById('modalCloseBtn');
  if (modalCloseBtn) {
    modalCloseBtn.addEventListener('click', () => {
      document.getElementById('customModal')?.classList.add('hidden');
    });
  }

  const faqAccordion = document.getElementById('faq-accordion');
  if (faqAccordion) {
    faqAccordion.querySelectorAll('.acc-btn').forEach(button => {
      button.addEventListener('click', () => {
        const body = button.nextElementSibling;
        const isActive = button.classList.contains('active');
        faqAccordion.querySelectorAll('.acc-btn').forEach(btn => {
          btn.classList.remove('active');
          btn.nextElementSibling.style.maxHeight = null;
        });
        if (!isActive) {
          button.classList.add('active');
          body.style.maxHeight = body.scrollHeight + "px";
        }
      });
    });
  }

  const mobileMenuBtn = document.getElementById('mobile-menu-btn');
  const mobileMenu = document.getElementById('mobile-menu');
  if (mobileMenuBtn && mobileMenu) {
    mobileMenuBtn.addEventListener('click', () => {
      mobileMenu.classList.toggle('hidden');
    });
  }
});
