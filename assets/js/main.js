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

    mobileMenu.addEventListener('click', (e) => {
      if (e.target.matches('a')) {
        mobileMenu.classList.add('hidden');
        mobileMenuBtn.classList.remove('is-open');
        document.documentElement.classList.remove('overflow-hidden');
      }
    });
  }

  // ===== Newsletter (Optional) =====
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
      const res = await fetch('assets/data/menu.json');
      const menu = await res.json();
      const items = menu
        .filter(i => ['mains', 'pasta_risotto', 'pizza'].includes(i.category))
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

    // UPDATE: New category map
    const categoryMap = {
      starters: 'المقبلات',
      soups: 'الشوربات',
      mains: 'الأطباق الرئيسية',
      pasta_risotto: 'باستا وروزيتو',
      pizza: 'البيتزا',
      sandwiches: 'السندويتشات',
      kids_menu: 'مينيو الأطفال',
      desserts: 'الحلويات',
      hot_drinks: 'المشروبات الساخنة',
      cold_drinks: 'المشروبات الباردة',
      lascala_offers: 'عروض لاسكالا'
    };
    
    // UPDATE: Define the exact order for filters
    const categoryOrder = [ 'الكل', 'المقبلات', 'الشوربات', 'الأطباق الرئيسية', 'pasta_risotto', 'البيتزا', 'السندويتشات', 'kids_menu', 'desserts', 'hot_drinks', 'cold_drinks', 'lascala_offers'];


    try {
      const res = await fetch('assets/data/menu.json');
      allDishes = await res.json();
      renderFilters(allDishes);
      renderMenu(allDishes);
    } catch {
      grid.innerHTML = `<p class="col-span-full text-center">خطأ في تحميل المنيو.</p>`;
    }

    function renderFilters(dishes) {
        // UPDATE: Use the predefined order and filter out empty categories
        const availableCats = new Set(dishes.map(d => d.category));
        const categories = categoryOrder.filter(cat => cat === 'all' || availableCats.has(cat));

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
  
  // MODAL LOGIC (Applies to menu page)
  const modal = document.getElementById('quickViewModal');
  if (modal) {
    const closeModalBtn = document.getElementById('closeModalBtn');
    const modalBackdrop = modal.querySelector('.modal-backdrop');

    const closeModal = () => {
        modal.classList.add('hidden');
        // FIX: Re-enable scrolling on the body
        document.documentElement.classList.remove('overflow-hidden');
    };

    closeModalBtn.addEventListener('click', closeModal);
    modalBackdrop.addEventListener('click', closeModal);
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
    // FIX: Disable scrolling on the body
    document.documentElement.classList.add('overflow-hidden');
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
    customModal.addEventListener('click', e => { if (e.target === customModal) closeModal(); });

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
        if (!wasActive) {
          btn.classList.add('active');
          body.style.maxHeight = body.scrollHeight + 'px';
        }
      });
    }

    const form = document.getElementById('reservationForm');
    form.addEventListener('submit', (e) => {
      e.preventDefault();
      const date = document.getElementById('date').value;
      const today = new Date().toISOString().split('T')[0];
      if (date < today) {
        showModal('خطأ في التاريخ', 'لا يمكن الحجز في تاريخ ماضٍ.');
        return;
      }
      showModal('تم إرسال طلب الحجز ✅', 'شكرًا لك! تم استلام طلبك بنجاح وسيتواصل فريقنا معك قريبًا.');
      form.reset();
    });
  }

  function setupContactForm() {
    const form = document.getElementById('contactForm');
    const submitBtn = document.getElementById('submitBtn');
    const formStatus = document.getElementById('formStatus');
    form.addEventListener('submit', (e) => {
      e.preventDefault();
      submitBtn.disabled = true;
      submitBtn.textContent = 'جارٍ الإرسال...';
      setTimeout(() => {
        formStatus.textContent = '✅ شكرًا لك! تم استلام رسالتك بنجاح.';
        formStatus.className = 'text-green-400 text-center pt-2';
        form.reset();
        submitBtn.disabled = false;
        submitBtn.textContent = 'إرسال الرسالة';
        setTimeout(() => { formStatus.textContent = ''; }, 5000);
      }, 1000);
    });
  }
});
