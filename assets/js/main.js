document.addEventListener('DOMContentLoaded', () => {
  // ===== Common =====
  const yearSpan = document.getElementById('year');
  if (yearSpan) yearSpan.textContent = new Date().getFullYear(); [cite: 141]

  // (إضافة جديدة) الرقم المستهدف للواتساب
  const WHATSAPP_NUMBER = '966546480098'; [cite: 52, 54]
  // (إضافة جديدة) رابط الصورة البديلة
  const LOGO_PLACEHOLDER = 'assets/images/logo.png'; [cite: 9]


  // ===== Category normalization =====
  const CAT_ALIASES = { [cite: 142]
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
  const ORDER_AR = [ [cite: 143]
    'المقبلات','الشوربات','الأطباق الرئيسية','الباستا',
    'البيتزا','البرجر','السندويتشات','الحلويات',
    'المشروبات الباردة','المشروبات الساخنة','العصائر','قائمة الأطفال','عروض لاسكالا'
  ];
  const FEATURED_AR = ['الأطباق الرئيسية', 'الباستا', 'البيتزا']; [cite: 144]

  const normalizeCategory = (cat) => {
    if (!cat) return '';
    const key = String(cat).trim(); [cite: 145]
    return CAT_ALIASES[key] || key;
  };

  // ===== Robust JSON loader =====
  function buildMenuUrl() {
    const u = new URL('assets/data/menu.json', document.baseURI);
    u.searchParams.set('v', Date.now().toString()); [cite: 146]
    return u.toString();
  }

  async function loadMenuJson() {
    const url = buildMenuUrl();
    try { [cite: 147]
      const res = await fetch(url, { cache: 'no-store' });
      if (!res.ok) throw new Error(`HTTP ${res.status} @ ${url}`); [cite: 148]
      const text = await res.text();
      try {
        const data = JSON.parse(text); [cite: 149]
        console.log('%c[menu.json loaded]', 'color:#0f0', url, data);
        return { data, url }; [cite: 150]
      } catch (parseErr) {
        const preview = text.slice(0, 120).replace(/\s+/g, ' '); [cite: 151]
        throw new Error(`JSON parse error @ ${url} :: ${parseErr.message} :: preview="${preview}"`); [cite: 152]
      }
    } catch (e) {
      console.error('[fetch menu.json failed]', e);
      throw e; [cite: 153]
    }
  }

  // ===== Menu Page =====
  if (document.getElementById('menu-grid')) {
    initMenuPage(); [cite: 154]
  }

  async function initMenuPage() {
    const grid = document.getElementById('menu-grid');
    const filtersContainer = document.getElementById('menu-filters');
    const searchInput = document.getElementById('menuSearch'); [cite: 155]
    let allDishes = [];

    try {
      const { data, url } = await loadMenuJson();
      allDishes = data.map(it => ({ ...it, category: normalizeCategory(it.category) })); [cite: 156]
      console.log('[menu source used]', url);

      renderFilters(allDishes);
      renderMenu(allDishes);
    } catch (err) { [cite: 157]
      console.error('Menu page load error:', err);
      grid.innerHTML = `
        <div class="col-span-full text-center">
          <p>خطأ في تحميل المنيو.</p>
          <small class="block opacity-70 mt-2" dir="ltr">${String(err.message || err)}</small>
        </div>`; [cite: 158]
      return; [cite: 159]
    }

    function renderFilters(dishes) {
      const present = Array.from(new Set(dishes.map(d => d.category).filter(Boolean)));
      const ordered = [ [cite: 160]
        ...ORDER_AR.filter(cat => present.includes(cat)),
        ...present.filter(cat => !ORDER_AR.includes(cat)).sort((a, b) => a.localeCompare(b, 'ar'))
      ];
      const categories = ['الكل', ...ordered]; [cite: 161]

      filtersContainer.innerHTML = categories.map(cat => `
        <button type="button" data-cat="${cat}" class="filter-chip ${cat === 'الكل' ? 'active' : ''}">
          ${cat}
        </button>
      `).join('');
      filtersContainer.addEventListener('click', (e) => { [cite: 162]
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
        return; [cite: 164]
      }
      
      // (تعديل) إضافة منطق الصورة البديلة
      grid.innerHTML = dishes.map(dish => {
        const imgSrc = dish.image || LOGO_PLACEHOLDER;
        const imgStyle = dish.image ? '' : 'object-fit: contain; padding: 20px; opacity: 0.6;'; // (إضافة) تنسيق اللوجو

        return `
        <div class="menu-card-glass" data-id="${dish.id}">
          <img src="${imgSrc}" alt="${dish.title || ''}" style="${imgStyle}">
          <div class="p-4">
            <h3 class="text-lg font-bold text-primary-gold">${dish.title || ''}</h3>
            <p class="mt-2 line-clamp-2 text-muted-text">${dish.desc ?? ''}</p>
            <div class="menu-card-price">${dish.price ?? ''}</div>
          </div>
        </div>
      `}).join(''); // [cite: 165] تم تعديل السعر وإضافة تنسيق الصورة

      grid.querySelectorAll('.menu-card-glass').forEach(card => { [cite: 166]
        card.addEventListener('click', () => {
          const dish = allDishes.find(d => String(d.id) === String(card.dataset.id));
          openQuickView(dish);
        });
      });
    }

    function filterAndRender() {
      const active = filtersContainer.querySelector('.active')?.dataset.cat || 'الكل'; [cite: 167]
      const term = (searchInput?.value || '').toLowerCase(); [cite: 168]
      const filtered = allDishes.filter(d => {
        const catOK = active === 'الكل' || d.category === active;
        const textOK =
          (d.title || '').toLowerCase().includes(term) ||
          (d.desc  || '').toLowerCase().includes(term);
        return catOK && textOK;
      });
      renderMenu(filtered); [cite: 169]
    }

    searchInput?.addEventListener('input', filterAndRender);
  }

  // ===== MODAL =====
  const modal = document.getElementById('quickViewModal');
  if (modal) { [cite: 170]
    const closeModalBtn = document.getElementById('closeModalBtn');
    const modalBackdrop = modal.querySelector('.modal-backdrop');
    const closeModal = () => {
      modal.classList.remove('show'); // (تعديل) استخدام 'show' بدلاً من 'hidden'
      document.documentElement.classList.remove('overflow-hidden');
    }; [cite: 171]
    closeModalBtn?.addEventListener('click', closeModal);
    modalBackdrop?.addEventListener('click', closeModal);
  }

  function openQuickView(dish) {
    if (!dish || !modal) return;
    const imgEl   = document.getElementById('qvImg');
    const titleEl = document.getElementById('qvTitle'); [cite: 173]
    const shortDescEl = document.getElementById('qvShortDesc'); // (إضافة جديدة)
    const descEl  = document.getElementById('qvLongDesc');
    const priceEl = document.getElementById('qvPrice'); [cite: 173]

    // (تعديل) منطق الصورة البديلة للمودال
    const imgSrc = dish.image || LOGO_PLACEHOLDER;
    if (imgEl)   { 
      imgEl.src = imgSrc; 
      imgEl.alt = dish.title || '';
      imgEl.style.objectFit = dish.image ? 'cover' : 'contain';
      imgEl.style.padding = dish.image ? '0' : '2rem';
    } [cite: 174]

    if (titleEl) { titleEl.textContent = dish.title || ''; } [cite: 175]
    
    // (إضافة جديدة) إظهار الوصف القصير (للسعرات) والطويل
    if (shortDescEl) { shortDescEl.textContent = dish.desc || ''; }
    if (descEl)  { descEl.textContent = dish.long_desc || ''; } // [cite: 176] (تم التعديل لإظهار الوصف الطويل فقط هنا)

    if (priceEl) { priceEl.textContent = dish.price || ''; } [cite: 177]

    const allergensContainer = document.getElementById('qvAllergensContainer');
    const allergensDiv       = document.getElementById('qvAllergens'); [cite: 178]
    if (dish.allergens && dish.allergens.length && allergensDiv && allergensContainer) { [cite: 179]
      allergensDiv.innerHTML = dish.allergens.map(a => `<span class="badge">${a}</span>`).join(''); // (تعديل) استخدام كلاس 'badge'
      allergensContainer.classList.remove('hidden'); [cite: 180]
    } else {
      allergensContainer?.classList.add('hidden');
    }

    const chefNoteContainer = document.getElementById('qvChefNoteContainer');
    const chefNoteP         = document.getElementById('qvChefNote'); [cite: 181]
    if (dish.chef_note && chefNoteContainer && chefNoteP) { [cite: 182]
      chefNoteP.textContent = dish.chef_note;
      chefNoteContainer.classList.remove('hidden');
    } else {
      chefNoteContainer?.classList.add('hidden'); [cite: 183]
    }

    modal.classList.add('show'); // (تعديل) استخدام 'show'
    document.documentElement.classList.add('overflow-hidden');
  }

  // ===========================================
  // ===== (إضافة جديدة) ربط النماذج بالواتساب =====
  // ===========================================

  // 1. نموذج الحجز (Booking Form)
  const reservationForm = document.getElementById('reservationForm'); [cite: 76]
  if (reservationForm) {
    reservationForm.addEventListener('submit', function(e) {
      e.preventDefault();
      
      // جلب البيانات من النموذج
      const name = document.getElementById('full-name').value; [cite: 77]
      const phone = document.getElementById('phone').value; [cite: 78]
      const date = document.getElementById('date').value; [cite: 80]
      const time = document.getElementById('time').value; [cite: 81]
      const guests = document.getElementById('guests').value; [cite: 82]
      const requests = document.getElementById('special-requests').value; [cite: 84]

      // تنسيق الرسالة
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

      // إرسال للواتساب
      const whatsappUrl = `https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent(message)}`;
      window.open(whatsappUrl, '_blank');
      
      // (اختياري) إظهار رسالة نجاح أو تفريغ الحقول
      reservationForm.reset();
      // يمكن إظهار المودال المخصص
      const modal = document.getElementById('customModal');
      if (modal) {
          document.getElementById('modalTitle').textContent = 'تم إرسال الطلب'; [cite: 105]
          document.getElementById('modalMessage').textContent = 'تم إرسال طلب الحجز بنجاح عبر واتساب. سنتواصل معك قريباً للتأكيد.'; [cite: 105]
          modal.classList.remove('hidden');
          modal.querySelector('#modalCloseBtn').onclick = () => modal.classList.add('hidden');
      }
    });
  }

  // 2. نموذج التواصل (Contact Form)
  const contactForm = document.getElementById('contactForm'); [cite: 44]
  if (contactForm) {
    contactForm.addEventListener('submit', function(e) {
      e.preventDefault();
      
      const statusDiv = document.getElementById('formStatus'); [cite: 49]
      statusDiv.textContent = 'جاري الإرسال...';
      
      // جلب البيانات
      const name = document.getElementById('name').value; [cite: 45]
      const phone = document.getElementById('phone').value; [cite: 46]
      const subject = document.getElementById('subject').value; [cite: 47]
      const msg = document.getElementById('message').value; [cite: 48]

      // تنسيق الرسالة
      let message = `*رسالة جديدة من (تواصل معنا)* 📬\n\n`;
      message += `*الاسم:* ${name}\n`;
      message += `*الجوال:* ${phone}\n`;
      message += `*الموضوع:* ${subject}\n\n`;
      message += `*الرسالة:*\n${msg}`;

      // إرسال للواتساب
      const whatsappUrl = `https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent(message)}`;
      window.open(whatsappUrl, '_blank');
      
      // إظهار رسالة نجاح
      statusDiv.textContent = 'تم فتح واتساب لإرسال رسالتك. شكراً لك!';
      statusDiv.style.color = '#D4AF37'; // (primary-gold) [cite: 37]
      contactForm.reset();
      setTimeout(() => { statusDiv.textContent = ''; }, 5000);
    });
  }
  
  // (إضافة) التعامل مع مودال النجاح في صفحة الحجز
  const modalCloseBtn = document.getElementById('modalCloseBtn');
  if(modalCloseBtn) {
    modalCloseBtn.addEventListener('click', () => {
      document.getElementById('customModal').classList.add('hidden');
    });
  }

});
