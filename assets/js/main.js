document.addEventListener('DOMContentLoaded', () => {
  // ===== (NEW) Mobile Menu Toggle =====
  const mobileMenuBtn = document.getElementById('mobile-menu-btn'); [cite: 10, 40, 73, 111]
  const mobileMenu = document.getElementById('mobile-menu'); [cite: 11, 41, 74, 111]
  if (mobileMenuBtn && mobileMenu) {
    mobileMenuBtn.addEventListener('click', () => {
      mobileMenu.classList.toggle('hidden'); [cite: 11]
      const icon = mobileMenuBtn.querySelector('i');
      if (icon) {
        icon.classList.toggle('fa-bars'); [cite: 11]
        icon.classList.toggle('fa-xmark'); // (FontAwesome 6 icon)
      }
    });
  }

  // ===== Common =====
  const yearSpan = document.getElementById('year'); [cite: 34]
  if (yearSpan) yearSpan.textContent = new Date().getFullYear();

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
  }; [cite: 142]
  const ORDER_AR = [ [cite: 143]
    'المقبلات','الشوربات','الأطباق الرئيسية','الباستا',
    'البيتزا','البرجر','السندويتشات','الحلويات',
    'المشروبات الباردة','المشروبات الساخنة','العصائر','قائمة الأطفال','عروض لاسكالا'
  ]; [cite: 143]
  const FEATURED_AR = ['الأطباق الرئيسية', 'الباستا', 'البيتزا']; [cite: 144]

  const normalizeCategory = (cat) => {
    if (!cat) return ''; [cite: 144]
    const key = String(cat).trim(); [cite: 145]
    return CAT_ALIASES[key] || key; [cite: 145]
  };

  // ===== Robust JSON loader =====
function buildMenuUrl() {
  // نستخدم دومًا مسارًا نسبيًا انطلاقًا من الصفحة الحالية
  const u = new URL('assets/data/menu.json', document.baseURI); [cite: 145]
  // نضيف باراميتر لمنع الكاش
  u.searchParams.set('v', Date.now().toString()); [cite: 146]
  return u.toString();
}


async function loadMenuJson() {
  const url = buildMenuUrl();
  try { [cite: 147]
    const res = await fetch(url, { cache: 'no-store' }); [cite: 147]
    if (!res.ok) throw new Error(`HTTP ${res.status} @ ${url}`); [cite: 148]
    const text = await res.text(); [cite: 148]
    try { [cite: 149]
      const data = JSON.parse(text); [cite: 149]
      console.log('%c[menu.json loaded]', 'color:#0f0', url, data);
      return { data, url }; [cite: 150]
    } catch (parseErr) {
      const preview = text.slice(0, 120).replace(/\s+/g, ' '); [cite: 150]
      throw new Error(`JSON parse error @ ${url} :: ${parseErr.message} :: preview="${preview}"`); [cite: 151]
    } [cite: 152]
  } catch (e) {
    console.error('[fetch menu.json failed]', e); [cite: 152]
    throw e; [cite: 152]
  } [cite: 153]
}

  // ===== Menu Page =====
  if (document.getElementById('menu-grid')) { [cite: 153]
    initMenuPage(); [cite: 153]
  } [cite: 154]

  async function initMenuPage() {
    const grid = document.getElementById('menu-grid'); [cite: 154]
    const filtersContainer = document.getElementById('menu-filters'); [cite: 154]
    const searchInput = document.getElementById('menuSearch'); [cite: 155]
    let allDishes = [];

    try {
      const { data, url } = await loadMenuJson();
      allDishes = data.map(it => ({ ...it, category: normalizeCategory(it.category) })); [cite: 156]
      console.log('[menu source used]', url);

      renderFilters(allDishes);
      renderMenu(allDishes); [cite: 156]
    } catch (err) { [cite: 157]
      console.error('Menu page load error:', err); [cite: 157]
      grid.innerHTML = `
        <div class="col-span-full text-center">
          <p>خطأ في تحميل المنيو.</p>
          <small class="block opacity-70 mt-2" dir="ltr">${String(err.message || err)}</small>
        </div>`; [cite: 158]
      return; [cite: 159]
    }

    function renderFilters(dishes) {
      const present = Array.from(new Set(dishes.map(d => d.category).filter(Boolean))); [cite: 159]
      const ordered = [ [cite: 160]
        ...ORDER_AR.filter(cat => present.includes(cat)), [cite: 160]
        ...present.filter(cat => !ORDER_AR.includes(cat)).sort((a, b) => a.localeCompare(b, 'ar')) [cite: 160]
      ];
      const categories = ['الكل', ...ordered]; [cite: 161]

      filtersContainer.innerHTML = categories.map(cat => `
        <button type="button" data-cat="${cat}" class="filter-chip ${cat === 'الكل' ? 'active' : ''}">
          ${cat}
        </button>
      `).join(''); [cite: 161]
      filtersContainer.addEventListener('click', (e) => { [cite: 162]
        const btn = e.target.closest('.filter-chip'); [cite: 162]
        if (!btn) return; [cite: 162]
        filtersContainer.querySelector('.active')?.classList.remove('active'); [cite: 162]
        btn.classList.add('active'); [cite: 162]
        filterAndRender();
      }); [cite: 163]
    }

    function renderMenu(dishes) {
      if (!dishes.length) { [cite: 163]
        grid.innerHTML = `<p class="col-span-full text-center text-muted-text">لا توجد نتائج مطابقة.</p>`; [cite: 163]
        return; [cite: 164]
      }
      grid.innerHTML = dishes.map(dish => `
        <div class="menu-card-glass" data-id="${dish.id}">
          <img src="${dish.image || 'assets/images/logo.png'}" alt="${dish.title || ''}" class="w-full h-48 object-cover">
          <div class="p-4 flex flex-col h-full">
            <h3 class="text-lg font-bold text-primary-gold">${dish.title || ''}</h3>
            <p class="mt-2 line-clamp-2 text-muted-text flex-grow">${dish.desc ?? ''}</p>
            <div class="mt-3 text-light-text font-bold">${dish.price ?? ''}</div> [cite: 165]
          </div>
        </div>
      `).join(''); [cite: 165]
      grid.querySelectorAll('.menu-card-glass').forEach(card => { [cite: 166]
        card.addEventListener('click', () => { [cite: 166]
          const dish = allDishes.find(d => String(d.id) === String(card.dataset.id)); [cite: 166]
          openQuickView(dish);
        });
      }); [cite: 167]
    }

    function filterAndRender() {
      const active = filtersContainer.querySelector('.active')?.dataset.cat || 'الكل'; [cite: 167]
      const term = (searchInput?.value || '').toLowerCase(); [cite: 168]
      const filtered = allDishes.filter(d => { [cite: 168]
        const catOK = active === 'الكل' || d.category === active; [cite: 168]
        const textOK =
          (d.title || '').toLowerCase().includes(term) ||
          (d.desc  || '').toLowerCase().includes(term); [cite: 168]
        return catOK && textOK;
      });
      renderMenu(filtered); [cite: 169]
    }

    searchInput?.addEventListener('input', filterAndRender); [cite: 169]
  }

  // ===== MODAL =====
  const modal = document.getElementById('quickViewModal'); [cite: 169]
  if (modal) { [cite: 170]
    const closeModalBtn = document.getElementById('closeModalBtn'); [cite: 170]
    const modalBackdrop = modal.querySelector('.modal-backdrop'); [cite: 170]
    const closeModal = () => { [cite: 171]
      modal.classList.remove('show'); // Use 'show' class to toggle
      document.documentElement.classList.remove('overflow-hidden'); [cite: 171]
    };
    closeModalBtn?.addEventListener('click', closeModal); [cite: 171]
    modalBackdrop?.addEventListener('click', closeModal); [cite: 171]
  } [cite: 172]

  function openQuickView(dish) {
    if (!dish || !modal) return; [cite: 172]
    const imgEl   = document.getElementById('qvImg'); [cite: 172]
    const titleEl = document.getElementById('qvTitle'); [cite: 173]
    const descEl  = document.getElementById('qvLongDesc'); [cite: 173]
    const priceEl = document.getElementById('qvPrice'); [cite: 173]
    if (imgEl)   { imgEl.src = dish.image || 'assets/images/logo.png'; imgEl.alt = dish.title || ''; [cite: 174]
    } [cite: 175]
    if (titleEl) { titleEl.textContent = dish.title || ''; [cite: 175]
    } [cite: 176]
    if (descEl)  { descEl.textContent = dish.long_desc || dish.desc || ''; [cite: 176]
    } [cite: 177]
    if (priceEl) { priceEl.textContent = dish.price || ''; } [cite: 177]

    const allergensContainer = document.getElementById('qvAllergensContainer'); [cite: 177]
    const allergensDiv       = document.getElementById('qvAllergens'); [cite: 178]
    if (dish.allergens && dish.allergens.length && allergensDiv && allergensContainer) { [cite: 179]
      allergensDiv.innerHTML = dish.allergens.map(a => `<span class="allergen-tag">${a}</span>`).join(''); [cite: 179]
      allergensContainer.classList.remove('hidden'); [cite: 180]
    } else {
      allergensContainer?.classList.add('hidden'); [cite: 180]
    }

    const chefNoteContainer = document.getElementById('qvChefNoteContainer'); [cite: 180]
    const chefNoteP         = document.getElementById('qvChefNote'); [cite: 181]
    if (dish.chef_note && chefNoteContainer && chefNoteP) { [cite: 182]
      chefNoteP.textContent = dish.chef_note; [cite: 182]
      chefNoteContainer.classList.remove('hidden'); [cite: 182]
    } else { [cite: 183]
      chefNoteContainer?.classList.add('hidden'); [cite: 183]
    }

    modal.classList.add('show'); // Use 'show' class to toggle
    document.documentElement.classList.add('overflow-hidden'); [cite: 183]
  }
});
