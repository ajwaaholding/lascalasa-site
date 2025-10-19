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
    // نستخدم مسار نسبي لضمان عمله على GitHub Pages
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
        // رسالة الخطأ التي ظهرت لك سابقاً ستظهر هنا إذا كان الملف ما زال معطوباً
        const preview = text.slice(Math.max(0, parseErr.position - 10), parseErr.position + 90).replace(/\s+/g, ' ');
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

  // ===== (إضافة جديدة) Home Page =====
  // هذا الكود سيعمل فقط إذا وجد قسم "الأكثر طلباً"
  if (document.getElementById('signature-dishes-container')) {
    initHomePage();
  }
  // هذا الكود سيشغل العدادات في أي صفحة توجد بها (حتى لو لم تكن الرئيسية)
  else if (document.querySelector('.stats-section')) {
    initStatsCounters(null); // تشغيل العدادات بدون بيانات المنيو
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


  // ===== (إضافة جديدة) Home Page Logic =====
  async function initHomePage() {
    const container = document.getElementById('signature-dishes-container');
    if (!container) return;

    let allDishes = [];
    try {
      // 1. تحميل المنيو
      const { data } = await loadMenuJson();
      allDishes = data.map(it => ({ ...it, category: normalizeCategory(it.category) }));

      // 2. فلترة الأطباق "الأكثر طلباً" (استخدمنا الثابت الموجود بالأعلى)
      const featuredDishes = allDishes
        .filter(d => FEATURED_AR.includes(d.category))
        .slice(0, 4); // عرض 4 أطباق فقط

      // 3. عرض الأطباق في الصفحة
      if (!featuredDishes.length) {
          container.innerHTML = `<p class="col-span-full text-center text-muted-text p-8">لا توجد أطباق مميزة حالياً.</p>`;
      } else {
          container.innerHTML = featuredDishes.map(dish => {
            const imgSrc = dish.image || LOGO_PLACEHOLDER;
            const imgStyle = dish.image ? '' : 'object-fit: contain; padding: 20px; opacity: 0.6;';
            // نستخدم نفس تصميم كرت المنيو لتوحيد الشكل
            return `
            <div class="menu-card-glass cursor-pointer" data-id="${dish.id}">
              <div class="h-48 w-full overflow-hidden">
                 <img src="${imgSrc}" alt="${dish.title || ''}" style="${imgStyle}" class="h-full w-full object-cover group-hover:scale-110 transition-transform duration-300">
              </div>
              <div class="p-4">
                <h3 class="text-lg font-bold text-primary-gold">${dish.title || ''}</h3>
                <p class="mt-2 text-sm line-clamp-2 text-muted-text">${dish.desc ?? ''}</p>
                <div class="mt-4 font-bold text-lg">${dish.price ?? ''}</div>
              </div>
            </div>
            `;
          }).join('');

          // إضافة إمكانية الضغط على الكرت لفتح النافذة المنبثقة
          container.querySelectorAll('.menu-card-glass').forEach(card => {
             card.addEventListener('click', () => {
                const dish = featuredDishes.find(d => String(d.id) === String(card.dataset.id));
                if (dish) openQuickView(dish);
             });
          });
      }
      
      // 4. تشغيل العدادات وتمرير بيانات المنيو لها
      initStatsCounters(allDishes);

    } catch (err) {
      // إذا فشل تحميل المنيو (بسبب خطأ JSON مثلاً)
      console.error('Homepage load error:', err);
      container.innerHTML = `<p class="col-span-full text-center text-muted-text p-8">خطأ في تحميل الأطباق المميزة.</p>`;
      // نشغل العدادات بالبيانات الافتراضية
      initStatsCounters(null);
    }
  }

  // ===== (إضافة جديدة) Stats Counter Logic =====
  function initStatsCounters(dishes) {
    const statsSection = document.querySelector('.stats-section');
    if (!statsSection) return;

    // (جديد) تحديث عدد الأطباق بناءً على ملف المنيو
    if (dishes && dishes.length > 0) {
      // نبحث عن كل العدادات
      statsSection.querySelectorAll('.stat').forEach(stat => {
          const label = stat.querySelector('small');
          // إذا كان العداد هو "طبق في قائمتنا"
          if (label && label.textContent.includes('طبق في قائمتنا')) {
              const counterSpan = stat.querySelector('span[data-count]');
              if (counterSpan) {
                  // نقوم بتحديث الرقم المستهدف إلى العدد الفعلي للأطباق
                  counterSpan.dataset.count = dishes.length; 
              }
          }
      });
    }

    const counters = statsSection.querySelectorAll('span[data-count]');
    if (!counters.length) return;

    // وظيفة الـ "أنيميشن" للعداد
    const animateCounter = (el, target, precision) => {
        let current = 0;
        const duration = 1500; // 1.5 ثانية
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

    // نستخدم IntersectionObserver لجعل العداد يبدأ فقط عندما يراه المستخدم
    const observer = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          const el = entry.target;
          const target = parseFloat(el.dataset.count); // نقرأ الرقم المستهدف
          const precision = parseInt(el.dataset.precision) || 0; // نقرأ عدد الخانات العشرية
          
          animateCounter(el, target, precision); // نبدأ الأنيميشن
          observer.unobserve(el); // نوقف المراقبة عن هذا العنصر
        }
      });
    }, { threshold: 0.1 }); // يبدأ عندما يظهر 10% من العنصر

    // نطلب من المراقب أن يراقب كل العدادات
    counters.forEach(counter => {
      observer.observe(counter);
    });
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
    const imgEl    = document.getElementById('qvImg');
    const titleEl = document.getElementById('qvTitle');
    const shortDescEl = document.getElementById('qvShortDesc'); // الوصف القصير
    const descEl  = document.getElementById('qvLongDesc'); // الوصف الطويل
    const priceEl = document.getElementById('qvPrice');

    // منطق الصورة البديلة (اللوجو) داخل المودال
    const imgSrc = dish.image || LOGO_PLACEHOLDER;
    if (imgEl)    { 
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
