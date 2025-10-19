document.addEventListener('DOMContentLoaded', () => {
  // ===== Common =====
  const yearSpan = document.getElementById('year');
  if (yearSpan) yearSpan.textContent = new Date().getFullYear();

  // ===== Mobile menu toggle =====
  const mobileMenuBtn = document.getElementById('mobile-menu-btn');
  const mobileMenu    = document.getElementById('mobile-menu');

  if (mobileMenuBtn && mobileMenu) {
    mobileMenuBtn.addEventListener('click', () => {
      mobileMenu.classList.toggle('hidden');
      mobileMenuBtn.classList.toggle('is-open');
      document.documentElement.classList.toggle('overflow-hidden');
    });

    // اغلق القائمة عند الضغط على أي رابط داخلها
    mobileMenu.addEventListener('click', (e) => {
      if (e.target.matches('a')) {
        mobileMenu.classList.add('hidden');
        mobileMenuBtn.classList.remove('is-open');
        document.documentElement.classList.remove('overflow-hidden');
      }
    });
  }

  // ===== Helper: تصفية/توحيد الفئات =====
  // نحول أي مفاتيح قديمة بالإنجليزي إلى مسمياتها العربية
  const CAT_ALIASES = {
    'starters': 'المقبلات',
    'soups': 'الشوربات',
    'mains': 'الأطباق الرئيسية',
    'pasta': 'الباستا',
    'pasta_risotto': 'الباستا',   // لو كانت قديمة باسم pasta_risotto
    'risotto': 'الباستا',
    'pizza': 'البيتزا',
    'sandwiches': 'السندويتشات',
    'kids_menu': 'قائمة الأطفال',
    'desserts': 'الحلويات',
    'hot_drinks': 'المشروبات الساخنة',
    'cold_drinks': 'المشروبات الباردة',
    'drinks': 'المشروبات الباردة',
    'lascala_offers': 'عروض لاسكالا',
    'burger': 'البرجر',
    'burgers': 'البرجر'
  };

  const ORDER_AR = [
    'المقبلات',
    'الشوربات',
    'الأطباق الرئيسية',
    'الباستا',
    'البيتزا',
    'البرجر',
    'السندويتشات',
    'الحلويات',
    'المشروبات الباردة',
    'المشروبات الساخنة',
    'العصائر',
    'قائمة الأطفال',
    'عروض لاسكالا'
  ];

  const FEATURED_AR = ['الأطباق الرئيسية', 'الباستا', 'البيتزا']; // للأكثر طلباً في الهوم

  const normalizeCategory = (cat) => {
    if (!cat) return '';
    const key = String(cat).trim();
    return CAT_ALIASES[key] || key; // لو كانت بالعربي أصلاً يتركها كما هي
  };

  // ===== Newsletter (اختياري) =====
  const newsletterForm = document.getElementById('newsletter-form');
  if (newsletterForm) {
    newsletterForm.addEventListener('submit', (e) => {
      e.preventDefault();
      showSuccessMessage('تم الاشتراك بنجاح ✅');
      e.target.reset();
    });
  }

  function showSuccessMessage(message) {
    const el = document.getElementById('success-message');
    if (!el) return;
    const span = el.querySelector('span');
    if (span) span.textContent = message;
    el.classList.add('show');
    setTimeout(() => el.classList.remove('show'), 3000);
  }

  // ===== Home Page Specific =====
  if (document.getElementById('signature-dishes-container')) {
    loadSignatureDishes();
    setupStatsCounter();
  }

  // ===== Menu Page Specific =====
  if (document.getElementById('menu-grid')) {
    initMenuPage();
  }

  // ===== Booking Page Specific =====
  if (document.getElementById('reservationForm')) {
    setupBookingPage();
  }

  // ===== Contact Page Specific =====
  if (document.getElementById('contactForm')) {
    setupContactForm();
  }

  // ========== Functions ==========
  async function loadSignatureDishes() {
    const container = document.getElementById('signature-dishes-container');
    try {
      const res = await fetch('assets/data/menu.json', { cache: 'no-store' });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const raw = await res.json();

      // طبّق التطبيع على الفئات
      const menu = raw.map(item => ({
        ...item,
        category: normalizeCategory(item.category)
      }));

      const items = menu
        .filter(i => FEATURED_AR.includes(i.category))
        .slice(0, 4);

      container.innerHTML = items.map(item => `
        <div class="bg-dark-card rounded-lg overflow-hidden shadow-lg transform transition-transform hover:scale-105">
          <img src="${item.image || ''}" alt="${item.title || ''}" class="w-full h-48 object-cover">
          <div class="p-4">
            <h3 class="text-lg font-bold text-primary-gold">${item.title || ''}</h3>
            <p class="text-sm text-muted-text mt-2 h-10 overflow-hidden">${item.desc ?? ''}</p>
          </div>
        </div>
      ).join('');
    } catch (err) {
      console.error('Menu load error (home):', err);
      if (container) {
        container.innerHTML = `<p class="text-center col-span-full">لا يمكن تحميل الأطباق المميزة.</p>`;
      }
    }
  }

  function setupStatsCounter() {
    const stats = document.querySelectorAll('.stat span[data-count]');
    const io = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (!entry.isIntersecting) return;
        const el = entry.target;
        const target = parseFloat(el.getAttribute('data-count'));
        const precision = parseInt(el.getAttribute('data-precision') || '0', 10);
        countUp(el, target, 2000, precision);
        io.unobserve(el);
      });
    }, { threshold: 0.5 });
    stats.forEach(el => io.observe(el));
  }

  function countUp(el, target, duration, precision) {
    const startTime = performance.now();
    const start = 0;
    const step = (t) => {
      const p = Math.min((t - startTime) / duration, 1);
      el.textContent = (start + p * (target - start)).toFixed(precision);
      if (p < 1) requestAnimationFrame(step);
    };
    requestAnimationFrame(step);
  }

  async function initMenuPage() {
    const grid = document.getElementById('menu-grid');
    const filtersContainer = document.getElementById('menu-filters');
    const searchInput = document.getElementById('menuSearch');
    let allDishes = [];

    try {
      const res = await fetch('assets/data/menu.json', { cache: 'no-store' });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const raw = await res.json();

      // طبّق التطبيع على الفئات
      allDishes = raw.map(item => ({
        ...item,
        category: normalizeCategory(item.category)
      }));

      renderFilters(allDishes);
      renderMenu(allDishes);
    } catch (err) {
      console.error('Menu page load error:', err);
      grid.innerHTML = `<p class="col-span-full text-center">خطأ في تحميل المنيو.</p>`;
    }

    function renderFilters(dishes) {
      const present = Array.from(new Set(dishes.map(d => d.category).filter(Boolean)));

      // رتب الفئات الموجودة وفق ORDER_AR، والباقي (إن وجد) ضعها بعده أبجديًا
      const ordered = [
        ...ORDER_AR.filter(cat => present.includes(cat)),
        ...present.filter(cat => !ORDER_AR.includes(cat)).sort((a, b) => a.localeCompare(b, 'ar'))
      ];

      const categories = ['الكل', ...ordered];

      filtersContainer.innerHTML = categories.map(cat => `
        <button data-cat="${cat}" class="filter-chip ${cat === 'الكل' ? 'active' : ''}">
          ${cat}
        </button>
      ).join('');

      filtersContainer.addEventListener('click', (e) => {
        const btn = e.target.closest('.filter-chip');
        if (!btn) return;
        filtersContainer.querySelector('.active')?.classList.remove('active');
        btn.classList.add('active');
        filterAndRender();
      });
    }

    function renderMenu(dishes) {
      if (!dishes.length) {
        grid.innerHTML = `<p class="col-span-full text-center text-muted-text">لا توجد نتائج مطابقة.</p>`;
        return;
      }
      grid.innerHTML = dishes.map(dish => `
        <div class="menu-card-glass" data-id="${dish.id}">
          <img src="${dish.image || ''}" alt="${dish.title || ''}" class="w-full h-48 object-cover">
          <div class="p-4">
            <h3 class="text-lg font-bold text-primary-gold">${dish.title || ''}</h3>
            <div class="mt-4 text-light-text font-medium">${dish.price ?? ''}</div>
          </div>
        </div>
      ).join('');

      // فتح العرض السريع
      grid.querySelectorAll('.menu-card-glass').forEach(card => {
        card.addEventListener('click', () => {
          const dish = allDishes.find(d => String(d.id) === String(card.dataset.id));
          openQuickView(dish);
        });
      });
    }

    function filterAndRender() {
      const active = filtersContainer.querySelector('.active')?.dataset.cat || 'الكل';
      const term = (searchInput?.value || '').toLowerCase();

      const filtered = allDishes.filter(d => {
        const catOK = active === 'الكل' || d.category === active;
        const textOK =
          (d.title || '').toLowerCase().includes(term) ||
          (d.desc  || '').toLowerCase().includes(term);
        return catOK && textOK;
      });

      renderMenu(filtered);
    }

    searchInput?.addEventListener('input', filterAndRender);
  }

  // ===== MODAL (Menu Page) =====
  const modal = document.getElementById('quickViewModal');
  if (modal) {
    const closeModalBtn = document.getElementById('closeModalBtn');
    const modalBackdrop = modal.querySelector('.modal-backdrop');

    const closeModal = () => {
      modal.classList.add('hidden');
      document.documentElement.classList.remove('overflow-hidden'); // re-enable scroll
    };

    closeModalBtn?.addEventListener('click', closeModal);
    modalBackdrop?.addEventListener('click', closeModal);
  }

  function openQuickView(dish) {
    if (!dish || !modal) return;

    const imgEl   = document.getElementById('qvImg');
    const titleEl = document.getElementById('qvTitle');
    const descEl  = document.getElementById('qvLongDesc');
    const priceEl = document.getElementById('qvPrice');

    if (imgEl)   { imgEl.src = dish.image || ''; imgEl.alt = dish.title || ''; }
    if (titleEl) { titleEl.textContent = dish.title || ''; }
    if (descEl)  { descEl.textContent = dish.long_desc || dish.desc || ''; }
    if (priceEl) { priceEl.textContent = dish.price || ''; }

    const allergensContainer = document.getElementById('qvAllergensContainer');
    const allergensDiv       = document.getElementById('qvAllergens');
    if (dish.allergens && dish.allergens.length && allergensDiv && allergensContainer) {
      allergensDiv.innerHTML = dish.allergens.map(a => `<span class="allergen-tag">${a}</span>`).join('');
      allergensContainer.classList.remove('hidden');
    } else {
      allergensContainer?.classList.add('hidden');
    }

    const chefNoteContainer = document.getElementById('qvChefNoteContainer');
    const chefNoteP         = document.getElementById('qvChefNote');
    if (dish.chef_note && chefNoteContainer && chefNoteP) {
      chefNoteP.textContent = dish.chef_note;
      chefNoteContainer.classList.remove('hidden');
    } else {
      chefNoteContainer?.classList.add('hidden');
    }

    modal.classList.remove('hidden');
    document.documentElement.classList.add('overflow-hidden'); // prevent bg scroll
  }

  // ===== Booking Page =====
  function setupBookingPage() {
    const customModal   = document.getElementById('customModal');
    const modalTitle    = document.getElementById('modalTitle');
    const modalMessage  = document.getElementById('modalMessage');
    const modalCloseBtn = document.getElementById('modalCloseBtn');

    const showModal = (title, message) => {
      if (!customModal) return;
      if (modalTitle)   modalTitle.textContent = title;
      if (modalMessage) modalMessage.textContent = message;
      customModal.classList.remove('hidden');
      customModal.classList.add('flex');
    };
    const closeModal = () => customModal?.classList.add('hidden');
    modalCloseBtn?.addEventListener('click', closeModal);
    customModal?.addEventListener('click', e => { if (e.target === customModal) closeModal(); });

    const accContainer = document.getElementById('faq-accordion');
    if (accContainer) {
      accContainer.addEventListener('click', e => {
        const btn = e.target.closest('.acc-btn');
        if (!btn) return;
        const body = btn.nextElementSibling;
        const wasActive = btn.classList.contains('active');
        accContainer.querySelectorAll('.acc-btn').forEach(b => {
          b.classList.remove('active');
          b.nextElementSibling.style.maxHeight = null;
        });
        if (!wasActive && body) {
          btn.classList.add('active');
          body.style.maxHeight = body.scrollHeight + 'px';
        }
      });
    }

    const form = document.getElementById('reservationForm');
    form?.addEventListener('submit', (e) => {
      e.preventDefault();
      const dateEl = document.getElementById('date');
      const date   = dateEl?.value || '';
      const today  = new Date().toISOString().split('T')[0];
      if (date && date < today) {
        showModal('خطأ في التاريخ', 'لا يمكن الحجز في تاريخ ماضٍ.');
        return;
      }
      showModal('تم إرسال طلب الحجز ✅', 'شكرًا لك! تم استلام طلبك بنجاح وسيتواصل فريقنا معك قريبًا.');
      form.reset();
    });
  }

  // ===== Contact Page =====
  function setupContactForm() {
    const form       = document.getElementById('contactForm');
    const submitBtn  = document.getElementById('submitBtn');
    const formStatus = document.getElementById('formStatus');
    form?.addEventListener('submit', (e) => {
      e.preventDefault();
      if (submitBtn) {
        submitBtn.disabled = true;
        submitBtn.textContent = 'جارٍ الإرسال...';
      }
      setTimeout(() => {
        if (formStatus) {
          formStatus.textContent = '✅ شكرًا لك! تم استلام رسالتك بنجاح.';
          formStatus.className = 'text-green-400 text-center pt-2';
        }
        form?.reset();
        if (submitBtn) {
          submitBtn.disabled = false;
          submitBtn.textContent = 'إرسال الرسالة';
        }
        setTimeout(() => { if (formStatus) formStatus.textContent = ''; }, 5000);
      }, 1000);
    });
  }
});
