document.addEventListener('DOMContentLoaded', () => {
  const WHATSAPP_NUMBER = '966546480098';

  // ===== (FIX) Mobile Menu Toggle =====
  const mobileMenuBtn = document.getElementById('mobile-menu-btn');
  const mobileMenu = document.getElementById('mobile-menu');
  if (mobileMenuBtn && mobileMenu) {
    mobileMenuBtn.addEventListener('click', () => {
      mobileMenu.classList.toggle('hidden');
      const icon = mobileMenuBtn.querySelector('i');
      if (icon) {
        icon.classList.toggle('fa-bars');
        icon.classList.toggle('fa-xmark');
      }
    });
  }

  // ===== (FIX) Stats Counter Animation =====
  const statsSection = document.querySelector('.stats-section');
  
  function animateCounters() {
    const counters = document.querySelectorAll('.stat span[data-count]');
    if (!counters.length) return;

    counters.forEach(counter => {
      const target = +counter.getAttribute('data-count');
      const precision = +counter.getAttribute('data-precision') || 0;
      const duration = 1500; // 1.5 seconds
      const stepTime = 50; // 50ms interval
      const totalSteps = duration / stepTime;
      const increment = target / totalSteps;
      let current = 0;

      const updateCounter = () => {
        current += increment;
        if (current >= target) {
          counter.textContent = target.toFixed(precision);
        } else {
          counter.textContent = current.toFixed(precision);
          setTimeout(updateCounter, stepTime);
        }
      };
      updateCounter();
    });
  }

  if (statsSection) {
    const observer = new IntersectionObserver((entries) => {
      if (entries[0].isIntersecting) {
        animateCounters();
        observer.unobserve(statsSection); // Animate only once
      }
    }, { threshold: 0.5 }); // Start when 50% visible

    observer.observe(statsSection);
  }
  
  // ===== (NEW) Contact Form to WhatsApp =====
  const contactForm = document.getElementById('contactForm');
  if (contactForm) {
    contactForm.addEventListener('submit', (e) => {
      e.preventDefault();
      const name = document.getElementById('name').value;
      const phone = document.getElementById('phone').value;
      const subject = document.getElementById('subject').value;
      const message = document.getElementById('message').value;

      // Basic validation
      if (!name || !phone || !message) {
        alert('يرجى ملء الحقول المطلوبة (الاسم، الجوال، الرسالة).');
        return;
      }

      let text = `*رسالة جديدة من نموذج التواصل:*\n\n`;
      text += `*الاسم:* ${name}\n`;
      text += `*الجوال:* ${phone}\n`;
      text += `*الموضوع:* ${subject}\n`;
      text += `*الرسالة:*\n${message}`;

      const url = `https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent(text)}`;
      window.open(url, '_blank');
      contactForm.reset();
    });
  }

  // ===== (NEW) Reservation Form to WhatsApp =====
  const reservationForm = document.getElementById('reservationForm');
  if (reservationForm) {
    reservationForm.addEventListener('submit', (e) => {
      e.preventDefault();
      const name = document.getElementById('full-name').value;
      const phone = document.getElementById('phone').value;
      const date = document.getElementById('date').value;
      const time = document.getElementById('time').value;
      const guests = document.getElementById('guests').value;
      const email = document.getElementById('email').value;
      const requests = document.getElementById('special-requests').value;

      // Basic validation
      if (!name || !phone || !date || !time) {
        alert('يرجى ملء حقول الحجز المطلوبة (الاسم، الجوال، التاريخ، الوقت).');
        return;
      }

      let text = `*طلب حجز جديد:*\n\n`;
      text += `*الاسم:* ${name}\n`;
      text += `*الجوال:* ${phone}\n`;
      text += `*التاريخ:* ${date}\n`;
      text += `*الوقت:* ${time}\n`;
      text += `*عدد الضيوف:* ${guests}\n`;
      if (email) text += `*الإيميل:* ${email}\n`;
      if (requests) text += `*طلبات خاصة:*\n${requests}`;

      const url = `https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent(text)}`;
      window.open(url, '_blank');
      
      // Show success modal from booking.html [cite: 105]
      const modal = document.getElementById('customModal');
      const modalTitle = document.getElementById('modalTitle');
      const modalMsg = document.getElementById('modalMessage');
      if (modal && modalTitle && modalMsg) {
        modalTitle.textContent = 'تم تجهيز طلب الحجز';
        modalMsg.textContent = 'سيتم الآن فتح واتساب لإرسال تفاصيل حجزك. سنقوم بالتواصل معك للتأكيد.';
        modal.classList.remove('hidden');
        modal.classList.add('flex'); // Assuming it uses flex to show
        
        // Add close logic
        const modalCloseBtn = document.getElementById('modalCloseBtn');
        if (modalCloseBtn) {
          modalCloseBtn.onclick = () => {
              modal.classList.add('hidden');
              modal.classList.remove('flex');
          };
        }
      }
      reservationForm.reset();
    });
  }

  // ===== (NEW) FAQ Accordion (for booking.html) =====
  const accordion = document.getElementById('faq-accordion');
  if (accordion) {
    const buttons = accordion.querySelectorAll('.acc-btn');
    buttons.forEach(btn => {
      btn.addEventListener('click', () => {
        const body = btn.nextElementSibling;
        const isActive = btn.classList.contains('active');

        // Close all others (optional)
        // buttons.forEach(b => {
        //     b.classList.remove('active');
        //     b.nextElementSibling.style.maxHeight = null;
        // });

        if (isActive) {
          btn.classList.remove('active');
          body.style.maxHeight = null;
        } else {
          btn.classList.add('active');
          body.style.maxHeight = body.scrollHeight + 'px';
        }
      });
    });
  }

  // ===== Common (Footer Year) =====
  const yearSpan = document.getElementById('year');
  if (yearSpan) yearSpan.textContent = new Date().getFullYear();

  // ===== Category normalization (Original Code) =====
  const CAT_ALIASES = {
    'starters': 'المقبلات',
    'soups': 'الشوربات',
    'mains': 'الأطباق الرئيسية',
    'pasta': 'الباستا',
    'pasta_risotto': 'الباستا',
    'risotto': 'الباستا',
    'pizza': 'البيتزا',
    'burger': 'البرجر',
    'burgers': 'البرجر',
    'sandwiches': 'السندويتشات',
    'kids_menu': 'قائمة الأطفال',
    'desserts': 'الحلويات',
    'hot_drinks': 'المشروبات الساخنة',
    'cold_drinks': 'المشروبات الباردة',
    'drinks': 'المشروبات الباردة',
    'juices': 'العصائر',
    'lascala_offers': 'عروض لاسكالا'
  };
  const ORDER_AR = [
    'المقبلات','الشوربات','الأطباق الرئيسية','الباستا',
    'البيتزا','البرجر','السندويتشات','الحلويات',
    'المشروبات الباردة','المشروبات الساخنة','العصائر','قائمة الأطفال','عروض لاسكالا'
  ];
  const FEATURED_AR = ['الأطباق الرئيسية', 'الباستا', 'البيتزا'];

  const normalizeCategory = (cat) => {
    if (!cat) return '';
    const key = String(cat).trim();
    return CAT_ALIASES[key] || key;
  };

  // ===== Robust JSON loader (Original Code) =====
  function buildMenuUrl() {
    const u = new URL('assets/data/menu.json', document.baseURI);
    u.searchParams.set('v', Date.now().toString());
    return u.toString();
  }

async function loadMenu() {
  const cleanupOverlays = () => {
    document.body.classList.remove('overlay-open','search-open','modal-open','loading');
    document.querySelectorAll('.overlay, .search-overlay, .modal-backdrop, .backdrop')
      .forEach(el => el.remove());
    document.querySelectorAll('.is-blurred, .blurred')
      .forEach(el => el.classList.remove('is-blurred','blurred'));
  };

  try {
    const res = await fetch('/data/menu.json', { cache: 'no-store' });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const data = await res.json();
    renderMenu(data);
    cleanupOverlays();
  } catch (err) {
    console.error('Menu load failed:', err);
    cleanupOverlays();
    // showToast('تعذّر تحميل القائمة. حدّث الصفحة.');
  }
}


  // ===== Menu Page (Original Code) =====
  if (document.getElementById('menu-grid')) {
    initMenuPage();
  }

  async function initMenuPage() {
    const grid = document.getElementById('menu-grid');
    const filtersContainer = document.getElementById('menu-filters');
    const searchInput = document.getElementById('menuSearch');
    let allDishes = [];

    try {
      const { data, url } = await loadMenuJson();
      allDishes = data.map(it => ({ ...it, category: normalizeCategory(it.category) }));
      console.log('[menu source used]', url);

      renderFilters(allDishes);
      renderMenu(allDishes);
    } catch (err) {
      console.error('Menu page load error:', err);
      grid.innerHTML = `
        <div class="col-span-full text-center">
          <p>خطأ في تحميل المنيو.</p>
          <small class="block opacity-70 mt-2" dir="ltr">${String(err.message || err)}</small>
        </div>`;
      return;
    }

    function renderFilters(dishes) {
      const present = Array.from(new Set(dishes.map(d => d.category).filter(Boolean)));
      const ordered = [
        ...ORDER_AR.filter(cat => present.includes(cat)),
        ...present.filter(cat => !ORDER_AR.includes(cat)).sort((a, b) => a.localeCompare(b, 'ar'))
      ];
      const categories = ['الكل', ...ordered];

      filtersContainer.innerHTML = categories.map(cat => `
        <button type="button" data-cat="${cat}" class="filter-chip ${cat === 'الكل' ? 'active' : ''}">
          ${cat}
        </button>
      `).join('');
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
          <img src="${dish.image || 'assets/images/logo.png'}" alt="${dish.title || ''}" class="w-full h-48 object-cover">
          <div class="p-4 flex flex-col h-full">
            <h3 class="text-lg font-bold text-primary-gold">${dish.title || ''}</h3>
            <p class="mt-2 line-clamp-2 text-muted-text flex-grow">${dish.desc ?? ''}</p>
            <div class="mt-3 text-light-text font-bold">${dish.price ?? ''}</div>
          </div>
        </div>
      `).join('');
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
          (d.desc  || '').toLowerCase().push(term);
        return catOK && textOK;
      });
      renderMenu(filtered);
    }

    searchInput?.addEventListener('input', filterAndRender);
  }

  // ===== MODAL (Original Code - Modified for 'show' class) =====
  const modal = document.getElementById('quickViewModal');
  if (modal) {
    const closeModalBtn = document.getElementById('closeModalBtn');
    const modalBackdrop = modal.querySelector('.modal-backdrop');
    const closeModal = () => {
      modal.classList.remove('show'); // Use 'show' class to toggle
      document.documentElement.classList.remove('overflow-hidden');
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
    if (imgEl)   { imgEl.src = dish.image || 'assets/images/logo.png'; imgEl.alt = dish.title || '';
    }
    if (titleEl) { titleEl.textContent = dish.title || '';
    }
    if (descEl)  { descEl.textContent = dish.long_desc || dish.desc || '';
    }
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

    modal.classList.add('show'); // Use 'show' class to toggle
    document.documentElement.classList.add('overflow-hidden');
  }
});
