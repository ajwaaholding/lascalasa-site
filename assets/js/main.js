document.addEventListener('DOMContentLoaded', () => {
  // ===== Common =====
  const yearSpan = document.getElementById('year');
  if (yearSpan) yearSpan.textContent = new Date().getFullYear();

  // ===== Mobile menu toggle =====
  const mobileMenuBtn = document.getElementById('mobile-menu-btn');
  const mobileMenu    = document.getElementById('mobile-menu');

  if (mobileMenuBtn && mobileMenu) {
    mobileMenuBtn.setAttribute('aria-controls', 'mobile-menu');
    mobileMenuBtn.setAttribute('aria-expanded', 'false');

    mobileMenuBtn.addEventListener('click', () => {
      const isOpen = mobileMenu.classList.toggle('hidden') === false; // مفتوح إذا أزيلنا hidden
      mobileMenuBtn.classList.toggle('is-open', isOpen);
      mobileMenuBtn.setAttribute('aria-expanded', String(isOpen));
      document.documentElement.classList.toggle('overflow-hidden', isOpen);
    });

    // اغلق القائمة عند الضغط على أي رابط داخلها
    mobileMenu.addEventListener('click', (e) => {
      if (e.target.matches('a')) {
        mobileMenu.classList.add('hidden');
        mobileMenuBtn.classList.remove('is-open');
        mobileMenuBtn.setAttribute('aria-expanded', 'false');
        document.documentElement.classList.remove('overflow-hidden');
      }
    });
  }

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

  // ===== الصفحة الرئيسية =====
  if (document.getElementById('signature-dishes-container')) {
    loadSignatureDishes();
    setupStatsCounter();
  }

  // ===== صفحة المنيو =====
  if (document.getElementById('menu-grid')) {
    initMenuPage();
  }

  // ===== صفحة الحجز =====
  if (document.getElementById('reservationForm')) {
    setupBookingPage();
  }

  // ===== صفحة التواصل =====
  if (document.getElementById('contactForm')) {
    setupContactForm();
  }

  // ========== Functions ==========
  async function loadSignatureDishes() {
    const container = document.getElementById('signature-dishes-container');
    try {
      const res = await fetch('assets/data/menu.json');
      const menu = await res.json();
      const items = menu
        .filter(i => ['mains', 'pasta', 'pizza'].includes(i.category))
        .slice(0, 4);

      container.innerHTML = items.map(item => `
        <div class="bg-dark-card rounded-lg overflow-hidden shadow-lg transform transition-transform hover:scale-105">
          <img src="${item.image}" alt="${item.title}" class="w-full h-48 object-cover">
          <div class="p-4">
            <h3 class="text-lg font-bold text-primary-gold">${item.title}</h3>
            <p class="text-sm text-muted-text mt-2 h-10 overflow-hidden">${item.desc ?? ''}</p>
          </div>
        </div>
      `).join('');
    } catch {
      container.innerHTML = `<p class="text-center col-span-full">لا يمكن تحميل الأطباق المميزة.</p>`;
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
    const step = (t) => {
      const p = Math.min((t - startTime) / duration, 1);
      el.textContent = (p * target).toFixed(precision);
      if (p < 1) requestAnimationFrame(step);
    };
    requestAnimationFrame(step);
  }

  async function initMenuPage() {
    const grid = document.getElementById('menu-grid');
    const filtersContainer = document.getElementById('menu-filters');
    const searchInput = document.getElementById('menuSearch');
    let allDishes = [];

    const categoryMap = {
      starters: 'المقبلات', mains: 'الأطباق الرئيسية', pasta: 'باستا وريزوتو',
      pizza: 'بيتزا', sandwiches: 'ساندويتشات', dessert: 'حلويات', drinks: 'مشروبات'
    };

    try {
      const res = await fetch('assets/data/menu.json');
      allDishes = await res.json();
      renderFilters(allDishes);
      renderMenu(allDishes);
    } catch {
      grid.innerHTML = `<p class="col-span-full text-center">خطأ في تحميل المنيو.</p>`;
    }

    function renderFilters(dishes) {
      const categories = ['all', ...new Set(dishes.map(d => d.category))];
      filtersContainer.innerHTML = categories.map(cat => `
        <button data-cat="${cat}" class="filter-chip ${cat === 'all' ? 'active' : ''}">
          ${cat === 'all' ? 'الكل' : (categoryMap[cat] || cat)}
        </button>
      `).join('');

      filtersContainer.addEventListener('click', (e) => {
        if (!e.target.matches('.filter-chip')) return;
        filtersContainer.querySelector('.active')?.classList.remove('active');
        e.target.classList.add('active');
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
          <img src="${dish.image}" alt="${dish.title}" class="w-full h-48 object-cover">
          <div class="p-4">
            <h3 class="text-lg font-bold text-primary-gold">${dish.title}</h3>
            <div class="mt-4 text-light-text font-medium">${dish.price ?? ''}</div>
          </div>
        </div>
      `).join('');

      grid.querySelectorAll('.menu-card-glass').forEach(card => {
        card.addEventListener('click', () => {
          const dish = allDishes.find(d => d.id == card.dataset.id);
          openQuickView(dish);
        });
      });
    }

    function filterAndRender() {
      const active = filtersContainer.querySelector('.active')?.dataset.cat || 'all';
      const term = (searchInput.value || '').toLowerCase();
      const filtered = allDishes.filter(d => {
        const inCat = active === 'all' || d.category === active;
        const inText = (d.title || '').toLowerCase().includes(term) ||
                       (d.desc || '').toLowerCase().includes(term);
        return inCat && inText;
      });
      renderMenu(filtered);
    }

    searchInput?.addEventListener('input', filterAndRender);
  }

  const modal = document.getElementById('quickViewModal');
  if (modal) {
    const closeModalBtn = document.getElementById('closeModalBtn');
    const modalBackdrop = modal.querySelector('.modal-backdrop');
    closeModalBtn.addEventListener('click', () => modal.classList.add('hidden'));
    modalBackdrop.addEventListener('click', () => modal.classList.add('hidden'));
  }

  function openQuickView(dish) {
    if (!dish || !modal) return;
    document.getElementById('qvImg').src = dish.image;
    document.getElementById('qvImg').alt = dish.title;
    document.getElementById('qvTitle').textContent = dish.title;
    document.getElementById('qvLongDesc').textContent = dish.long_desc || dish.desc || '';
    document.getElementById('qvPrice').textContent = dish.price || '';

    const allergensContainer = document.getElementById('qvAllergensContainer');
    const allergensDiv = document.getElementById('qvAllergens');
    if (dish.allergens?.length) {
      allergensDiv.innerHTML = dish.allergens.map(a => `<span class="allergen-tag">${a}</span>`).join('');
      allergensContainer.classList.remove('hidden');
    } else {
      allergensContainer.classList.add('hidden');
    }

    const chefNoteContainer = document.getElementById('qvChefNoteContainer');
    const chefNoteP = document.getElementById('qvChefNote');
    if (dish.chef_note) {
      chefNoteP.textContent = dish.chef_note;
      chefNoteContainer.classList.remove('hidden');
    } else {
      chefNoteContainer.classList.add('hidden');
    }

    modal.classList.remove('hidden');
  }

  function setupBookingPage() {
    const customModal = document.getElementById('customModal');
    const modalTitle = document.getElementById('modalTitle');
    const modalMessage = document.getElementById('modalMessage');
    const modalCloseBtn = document.getElementById('modalCloseBtn');

    const showModal = (title, message) => {
      modalTitle.textContent = title;
      modalMessage.textContent = message;
      customModal.classList.remove('hidden');
      customModal.classList.add('flex');
    };
    const closeModal = () => customModal.classList.add('hidden');
    modalCloseBtn.addEventListener('click', closeModal);
    customModal.addEventListener('click', e => { if (e.target === customModal) closeModal();
