document.addEventListener('DOMContentLoaded', () => {
  // ===== Common =====
  const yearSpan = document.getElementById('year');
  if (yearSpan) yearSpan.textContent = new Date().getFullYear();

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
  // نستخدم دومًا مسارًا نسبيًا انطلاقًا من الصفحة الحالية
  const u = new URL('assets/data/menu.json', document.baseURI);
  // نضيف باراميتر لمنع الكاش
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
          <img src="${dish.image || ''}" alt="${dish.title || ''}" class="w-full h-48 object-cover">
          <div class="p-4">
            <h3 class="text-lg font-bold text-primary-gold">${dish.title || ''}</h3>
            <p class="mt-2 line-clamp-2 text-muted-text">${dish.desc ?? ''}</p>
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
          (d.desc  || '').toLowerCase().includes(term);
        return catOK && textOK;
      });
      renderMenu(filtered);
    }

    searchInput?.addEventListener('input', filterAndRender);
  }

  // ===== MODAL =====
  const modal = document.getElementById('quickViewModal');
  if (modal) {
    const closeModalBtn = document.getElementById('closeModalBtn');
    const modalBackdrop = modal.querySelector('.modal-backdrop');
    const closeModal = () => {
      modal.classList.add('hidden');
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
    document.documentElement.classList.add('overflow-hidden');
  }
});
