document.addEventListener('DOMContentLoaded', () => {
  // ===== Common =====
  const yearSpan = document.getElementById('year');
  if (yearSpan) yearSpan.textContent = new Date().getFullYear();

  // (إضافة جديدة) الرقم المستهدف للواتساب
  const WHATSAPP_NUMBER = '966546480098';
  // (إضافة جديدة) رابط الصورة البديلة
  const LOGO_PLACEHOLDER = 'assets/images/logo.png';


  // ===== Category normalization =====
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

  // ===== Robust JSON loader =====
  function buildMenuUrl() {
    const u = new URL('assets/data/menu.json', document.baseURI);
    u.searchParams.set('v', Date.now().toString());
    return u.toString();
  }

  async function loadMenuJson() {
    const url = buildMenuUrl();
    try {
      const res = await fetch(url, { cache: 'no-store' });
      if (!res.ok) throw new Error(`HTTP ${res.status} @ ${url}`);
      const text = await res.text();
      try {
        const data = JSON.parse(text);
        console.log('%c[menu.json loaded]', 'color:#0f0', url, data);
        return { data, url };
      } catch (parseErr) {
        const preview = text.slice(0, 120).replace(/\s+/g, ' ');
        throw new Error(`JSON parse error @ ${url} :: ${parseErr.message} :: preview="${preview}"`);
      }
    } catch (e) {
      console.error('[fetch menu.json failed]', e);
      throw e;
    }
  }

  // ===== Menu Page =====
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
        grid.innerHTML = `<p class="col-span-full text-center text-muted-text p-8">لا توجد نتائج مطابقة لبحثك.</p>`;
        return;
      }
      
      // (تعديل) إضافة منطق الصورة البديلة (اللوجو)
      grid.innerHTML = dishes.map(dish => {
        const imgSrc = dish.image || LOGO_PLACEHOLDER;
        // إضافة تنسيق خاص للوجو ليظهر بشكل مصغر وواضح
        const imgStyle = dish.image ? '' : 'object-fit: contain; padding: 20px; opacity: 0.6;'; 

        return `
        <div class="menu-card-glass" data-id="${dish.id}">
          <img src="${imgSrc}" alt="${dish.title || ''}" style="${imgStyle}">
          <div class="p-4">
            <h3 class="text-lg font-bold text-primary-gold">${dish.title || ''}</h3>
            <p class="mt-2 line-clamp-2 text-muted-text">${dish.desc ?? ''}</p>
            <div class="menu-card-price">${dish.price ?? ''}</div>
          </div>
        </div>
      `}).join(''); 

      grid.querySelectorAll('.menu-card-glass').forEach(card => {
        card.addEventListener('click', () => {
          const dish = allDishes.find(d => String(d.id) === String(card.dataset.id));
          openQuickView(dish);
        });
      });
    }

    function filterAndRender() {
      const active = filtersContainer.querySelector('.active')?.dataset.cat || 'الكل';
      const term = (searchInput?.value || '').toLowerCase().trim();
      const filtered = allDishes.filter(d => {
        const catOK = active === 'الكل' || d.category === active;
        if (!term) return catOK; // إذا كان البحث فارغاً، اعتمد على الفلتر فقط
        
        const textOK =
          (d.title || '').toLowerCase().includes(term) ||
          (d.desc  || '').toLowerCase().includes(term) ||
          (d.long_desc  || '').toLowerCase().includes(term); // (إضافة) البحث في الوصف الطويل
        return catOK && textOK;
      });
      renderMenu(filtered);
    }

    searchInput?.addEventListener('input', filterAndRender);
  }

  // ===== MODAL (النافذة المنبثقة) =====
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
    const imgEl   = document.getElementById('qvImg');
    const titleEl = document.getElementById('qvTitle');
    const shortDescEl = document.getElementById('qvShortDesc'); // الوصف القصير
    const descEl  = document.getElementById('qvLongDesc'); // الوصف الطويل
    const priceEl = document.getElementById('qvPrice');

    // منطق الصورة البديلة (اللوجو) داخل المودال
    const imgSrc = dish.image || LOGO_PLACEHOLDER;
    if (imgEl)   { 
      imgEl.src = imgSrc; 
      imgEl.alt = dish.title || '';
      // تنسيق اللوجو داخل المودال
      imgEl.style.objectFit = dish.image ? 'cover' : 'contain';
      imgEl.style.padding = dish.image ? '0' : '2rem';
      imgEl.style.background = dish.image ? '#0d1320' : 'var(--card)';
    }

    if (titleEl) { titleEl.textContent = dish.title || ''; }
    if (shortDescEl) { shortDescEl.textContent = dish.desc || ''; }
    if (descEl)  { descEl.textContent = dish.long_desc || ''; } 
    if (priceEl) { priceEl.textContent = dish.price || ''; }

    // إظهار وإخفاء قسم مسببات الحساسية
    const allergensContainer = document.getElementById('qvAllergensContainer');
    const allergensDiv       = document.getElementById('qvAllergens');
    if (dish.allergens && dish.allergens.length && allergensDiv && allergensContainer) {
      allergensDiv.innerHTML = dish.allergens.map(a => `<span class="badge">${a}</span>`).join('');
      allergensContainer.classList.remove('hidden');
    } else {
      allergensContainer?.classList.add('hidden');
    }

    // إظهار وإخفاء قسم ملاحظة الشيف
    const chefNoteContainer = document.getElementById('qvChefNoteContainer');
    const chefNoteP         = document.getElementById('qvChefNote');
    if (dish.chef_note && chefNoteContainer && chefNoteP) {
      chefNoteP.textContent = dish.chef_note;
      chefNoteContainer.classList.remove('hidden');
    } else {
      chefNoteContainer?.classList.add('hidden');
    }

    modal.classList.add('show');
    document.documentElement.classList.add('overflow-hidden');
  }

  // ===========================================
  // ===== ربط النماذج (Forms) بالواتساب =====
  // ===========================================

  // 1. نموذج الحجز (Booking Form)
  const reservationForm = document.getElementById('reservationForm');
  if (reservationForm) {
    reservationForm.addEventListener('submit', function(e) {
      e.preventDefault();
      
      const name = document.getElementById('full-name').value;
      const phone = document.getElementById('phone').value;
      const date = document.getElementById('date').value;
      const time = document.getElementById('time').value;
      const guests = document.getElementById('guests').value;
      const requests = document.getElementById('special-requests').value;

      let message = `*طلب حجز جديد من LaScala* 🍽️\n\n`;
      message += `*الاسم:* ${name}\n`;
      message += `*الجوال:* ${phone}\n`;
      message += `*التاريخ:* ${date}\n`;
      message += `*الوقت:* ${time}\n`;
      message += `*عدد الضيوف:* ${guests}\n`;
      if (requests) {
        message += `*طلبات خاصة:* ${requests}\n`;
      }
      message += `\nبرجاء تأكيد الحجز مع العميل.`;

      const whatsappUrl = `https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent(message)}`;
      window.open(whatsappUrl, '_blank');
      
      reservationForm.reset();
      
      // إظهار مودال النجاح الخاص بصفحة الحجز
      const customModal = document.getElementById('customModal');
      if (customModal) {
          document.getElementById('modalTitle').textContent = 'تم إرسال الطلب';
          document.getElementById('modalMessage').textContent = 'تم إرسال طلب الحجز بنجاح عبر واتساب. سنتواصل معك قريباً للتأكيد.';
          customModal.classList.remove('hidden');
      }
    });
  }

  // 2. نموذج التواصل (Contact Form)
  const contactForm = document.getElementById('contactForm');
  if (contactForm) {
    contactForm.addEventListener('submit', function(e) {
      e.preventDefault();
      
      const statusDiv = document.getElementById('formStatus');
      statusDiv.textContent = 'جاري الإرسال...';
      
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
      
      statusDiv.textContent = 'تم فتح واتساب لإرسال رسالتك. شكراً لك!';
      statusDiv.style.color = '#D4AF37'; // (primary-gold)
      contactForm.reset();
      setTimeout(() => { statusDiv.textContent = ''; }, 5000);
    });
  }
  
  // زر إغلاق مودال النجاح (صفحة الحجز)
  const modalCloseBtn = document.getElementById('modalCloseBtn');
  if(modalCloseBtn) {
    modalCloseBtn.addEventListener('click', () => {
      document.getElementById('customModal').classList.add('hidden');
    });
  }

  // الأكورديون (الأسئلة الشائعة) في صفحة الحجز
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

  // قائمة الموبايل (الهيدر)
  const mobileMenuBtn = document.getElementById('mobile-menu-btn');
  const mobileMenu = document.getElementById('mobile-menu');
  if (mobileMenuBtn && mobileMenu) {
    mobileMenuBtn.addEventListener('click', () => {
      mobileMenu.classList.toggle('hidden');
    });
  }

});
