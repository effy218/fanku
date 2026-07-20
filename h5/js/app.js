/* 饭库 H5 SPA · 页面与交互 */
(() => {
  const S = window.FankuStore
  const root = () => document.getElementById('app')
  const LOGO = `<svg width="22" height="22" viewBox="0 0 16 16" shape-rendering="crispEdges"><rect width="16" height="16" fill="#3D2B1F"/><rect x="2" y="2" width="12" height="12" fill="#FFFBF2"/><rect x="4" y="4" width="2" height="2" fill="#C8703E"/><rect x="10" y="4" width="2" height="2" fill="#C8703E"/><rect x="4" y="6" width="8" height="2" fill="#D4A574"/><rect x="6" y="11" width="4" height="1" fill="#C25B4E"/></svg>`
  const ONIGIRI = `<svg width="56" height="56" viewBox="0 0 16 16" shape-rendering="crispEdges"><rect x="4" y="3" width="8" height="1" fill="#FFFBF2"/><rect x="3" y="4" width="10" height="1" fill="#FFFBF2"/><rect x="2" y="5" width="12" height="1" fill="#FFFBF2"/><rect x="2" y="6" width="12" height="1" fill="#F5E8D0"/><rect x="1" y="7" width="14" height="1" fill="#FFFBF2"/><rect x="1" y="8" width="14" height="1" fill="#F5E8D0"/><rect x="1" y="9" width="14" height="1" fill="#FFFBF2"/><rect x="2" y="10" width="12" height="1" fill="#F5E8D0"/><rect x="2" y="11" width="12" height="1" fill="#FFFBF2"/><rect x="3" y="12" width="10" height="1" fill="#F5E8D0"/><rect x="4" y="13" width="8" height="1" fill="#FFFBF2"/><rect x="2" y="9" width="12" height="3" fill="#2D2D2D"/><rect x="3" y="12" width="10" height="1" fill="#2D2D2D"/></svg>`
  const ICO_SEARCH = `<svg class="ico-search" xmlns="http://www.w3.org/2000/svg" width="18" height="18" fill="currentColor" viewBox="0 0 24 24"><path d="M22 22h-2v-2h2v2Zm-2-2h-2v-2h2v2Zm-6-2H6v-2h8v2Zm4 0h-2v-2h2v2ZM6 16H4v-2h2v2Zm10 0h-2v-2h2v2ZM4 14H2V6h2v8Zm14 0h-2V6h2v8ZM6 6H4V4h2v2Zm10 0h-2V4h2v2Zm-2-2H6V2h8v2Z"/></svg>`
  const ICO_CLOSE = `<svg class="ico-close" width="14" height="14" viewBox="0 0 16 16" shape-rendering="crispEdges"><rect x="3" y="3" width="2" height="2" fill="#3D2B1F"/><rect x="11" y="3" width="2" height="2" fill="#3D2B1F"/><rect x="5" y="5" width="2" height="2" fill="#3D2B1F"/><rect x="9" y="5" width="2" height="2" fill="#3D2B1F"/><rect x="7" y="7" width="2" height="2" fill="#3D2B1F"/><rect x="5" y="9" width="2" height="2" fill="#3D2B1F"/><rect x="9" y="9" width="2" height="2" fill="#3D2B1F"/><rect x="3" y="11" width="2" height="2" fill="#3D2B1F"/><rect x="11" y="11" width="2" height="2" fill="#3D2B1F"/></svg>`
  const STAR_PATH = 'M8 1l2 4.5 5 .5-3.5 3.5 1 5L8 16l-4.5-1.5 1-5L1 6l5-.5z'

  let route = { name: 'splash', params: {} }
  let editState = null
  let searchQ = ''

  function go(name, params = {}) {
    route = { name, params }
    render()
  }

  function dishRating(d) {
    if (typeof d?.rating === 'number') return d.rating
    if (d?.mark === 'must') return 5
    if (d?.mark === 'no') return 1.5
    return 3
  }

  const LEVEL_OPTS = [
    { key: 'strong', ico: '★', label: '强推' },
    { key: 'rec', ico: '✓', label: '推荐' },
    { key: 'normal', ico: '○', label: '一般' },
    { key: 'avoid', ico: '✕', label: '避雷' },
  ]

  function starsHtml(value, opts = {}) {
    const v = Number(value) || 0
    const size = opts.size || 20
    const readonly = !!opts.readonly
    let html = `<span class="stars" data-stars ${readonly ? 'data-ro="1"' : ''} data-value="${v}">`
    for (let i = 1; i <= 5; i++) {
      const cls = v >= i - 0.5 ? 'on' : ''
      html += `<svg class="star ${cls}" data-i="${i}" viewBox="0 0 16 16" style="width:${size}px;height:${size}px"><path d="${STAR_PATH}"/></svg>`
    }
    if (opts.showValue) {
      html += `<span class="rate-val ${opts.brand ? 'brand' : ''}">${v.toFixed(1)}</span>`
    }
    html += '</span>'
    return html
  }

  function paintStars(grp, val) {
    const v = Number(val) || 0
    grp.dataset.value = String(v)
    grp.querySelectorAll('.star').forEach((star) => {
      const i = Number(star.dataset.i)
      star.classList.toggle('on', v >= i - 0.5)
    })
    const rate = grp.querySelector('.rate-val')
    if (rate) rate.textContent = v.toFixed(1)
  }

  function setToggleOn(row, activeEl) {
    row.querySelectorAll('.toggle-opt').forEach((el) => el.classList.toggle('on', el === activeEl))
  }

  function bindStars(el, onChange) {
    el.querySelectorAll('[data-stars]:not([data-ro])').forEach((grp) => {
      grp.querySelectorAll('.star').forEach((star) => {
        star.addEventListener('click', (e) => {
          const i = Number(star.dataset.i)
          const rect = star.getBoundingClientRect()
          const half = e.clientX < rect.left + rect.width / 2
          const val = half ? i - 0.5 : i
          onChange(Math.max(0.5, val), grp)
        })
      })
    })
  }

  function badge(level, short = false) {
    const m = S.LEVEL_META[level] || S.LEVEL_META.rec
    return `<span class="lv-badge ${m.cls} ${short ? 'sm' : ''}">${short ? m.label : m.short}</span>`
  }

  /* DOTOWN 粗ドット · 菜系符号（本地素材，勿直链） */
  const DOTOWN_BASE = './assets/dotown/'
  const DOTOWN_DEFAULT = 'bento.png'
  const DOTOWN_EMPTY = 'hinomaru.png'
  const DOTOWN_PACK = [
    { file: 'bento.png', label: '便当' },
    { file: 'hinomaru.png', label: '日之丸' },
    { file: 'rice.png', label: '白饭' },
    { file: 'onigiri.png', label: '饭团' },
    { file: 'sushi.png', label: '寿司' },
    { file: 'norimaki.png', label: '卷寿司' },
    { file: 'ramen.png', label: '拉面' },
    { file: 'udon.png', label: '乌冬' },
    { file: 'soba.png', label: '荞麦面' },
    { file: 'somen.png', label: '素面' },
    { file: 'yakisoba.png', label: '炒面' },
    { file: 'spaghetti.png', label: '意面' },
    { file: 'dumpling.png', label: '饺子' },
    { file: 'bao.png', label: '包子' },
    { file: 'curry.png', label: '咖喱' },
    { file: 'stew.png', label: '炖菜' },
    { file: 'miso.png', label: '味增汤' },
    { file: 'omurice.png', label: '蛋包饭' },
    { file: 'okonomiyaki.png', label: '大阪烧' },
    { file: 'takoyaki.png', label: '章鱼烧' },
    { file: 'croquette.png', label: '可乐饼' },
    { file: 'shrimp.png', label: '炸虾' },
    { file: 'chicken.png', label: '炸鸡' },
    { file: 'steak.png', label: '汉堡排' },
    { file: 'hamburger.png', label: '汉堡' },
    { file: 'pizza.png', label: '披萨' },
    { file: 'fries.png', label: '薯条' },
    { file: 'sandwich.png', label: '三明治' },
    { file: 'croissant.png', label: '可颂' },
    { file: 'egg.png', label: '水煮蛋' },
    { file: 'coffee.png', label: '咖啡' },
    { file: 'greentea.png', label: '绿茶' },
    { file: 'beer.png', label: '啤酒' },
    { file: 'cola.png', label: '可乐' },
    { file: 'softserve.png', label: '软冰' },
    { file: 'shavedice.png', label: '刨冰' },
    { file: 'donut.png', label: '甜甜圈' },
    { file: 'pudding.png', label: '布丁' },
    { file: 'taiyaki.png', label: '鲷鱼烧' },
    { file: 'corn.png', label: '烤玉米' },
  ]
  const DOTOWN_CUISINE = {
    火锅: 'stew.png',
    烧烤: 'chicken.png',
    川菜: 'dumpling.png',
    粤菜: 'shrimp.png',
    日料: 'onigiri.png',
    韩餐: 'steak.png',
    西餐: 'pizza.png',
    面食: 'ramen.png',
    小吃: 'takoyaki.png',
    咖啡: 'coffee.png',
    甜品: 'softserve.png',
    轻食: 'sandwich.png',
  }
  const DOTOWN_KW = [
    { re: /饺子|水饺|煎饺|dumpling/i, file: 'dumpling.png' },
    { re: /小吃|面点|包子|糕|饼|点心|麻辣烫|冒菜|串串/, file: 'takoyaki.png' },
    { re: /面食|拉面|ラーメン|ramen|面馆/i, file: 'ramen.png' },
    { re: /火锅|涮|麻辣锅/, file: 'stew.png' },
    { re: /烧烤|烤串|烤肉|炸鸡/, file: 'chicken.png' },
    { re: /川菜|川味|川|辣|湘|麻辣/, file: 'dumpling.png' },
    { re: /粤菜|粤式|早茶|广式/, file: 'shrimp.png' },
    { re: /韩餐|韩国|韩式/, file: 'steak.png' },
    { re: /西餐|披萨|比萨|pizza|汉堡|意面|意大利|pasta/i, file: 'pizza.png' },
    { re: /咖啡|cafe|手冲|coffee/i, file: 'coffee.png' },
    { re: /甜品|甜点|冰|蛋糕|布丁|奶茶/, file: 'softserve.png' },
    { re: /茶|抹茶/, file: 'greentea.png' },
    { re: /酒|酒吧|居酒|啤/, file: 'beer.png' },
    { re: /轻食|沙拉|健康/, file: 'sandwich.png' },
    { re: /早餐|brunch|早/, file: 'egg.png' },
    { re: /寿司|刺身|和食|日料|卷/, file: 'sushi.png' },
    { re: /章鱼烧|大阪烧/, file: 'takoyaki.png' },
    { re: /面|麺|うどん|そば/, file: 'udon.png' },
  ]

  function resolveFromCuisines(cuisines) {
    const tags = Array.isArray(cuisines) ? cuisines : []
    for (const t of tags) {
      if (DOTOWN_CUISINE[t]) return DOTOWN_CUISINE[t]
    }
    for (const t of tags) {
      const s = String(t)
      for (const { re, file } of DOTOWN_KW) {
        if (re.test(s)) return file
      }
    }
    return DOTOWN_DEFAULT
  }

  function resolveDotownFile(cardOrCuisines) {
    if (cardOrCuisines && typeof cardOrCuisines === 'object' && !Array.isArray(cardOrCuisines)) {
      const icon = cardOrCuisines.pixelIcon
      if (icon && DOTOWN_PACK.some((p) => p.file === icon)) return icon
      return resolveFromCuisines(cardOrCuisines.cuisines)
    }
    return resolveFromCuisines(cardOrCuisines)
  }

  function dotownSrc(cardOrCuisines) {
    return DOTOWN_BASE + resolveDotownFile(cardOrCuisines)
  }

  function dotownImg(cardOrCuisines, cls = 'dotown-ico') {
    return `<img class="${cls}" src="${dotownSrc(cardOrCuisines)}" alt="" draggable="false">`
  }

  function openDotownPicker({ selected = '', cuisines = [], onSelect } = {}) {
    const autoFile = resolveFromCuisines(cuisines)
    let mask = document.getElementById('iconSheet')
    if (!mask) {
      mask = document.createElement('div')
      mask.id = 'iconSheet'
      mask.className = 'sheet-mask'
      document.getElementById('app').appendChild(mask)
    }
    const lockEl = document.getElementById('editView') || document.querySelector('#app .view')
    lockEl?.classList.add('scroll-locked')
    mask.style.display = 'flex'
    const cur = selected && DOTOWN_PACK.some((p) => p.file === selected) ? selected : ''
    mask.innerHTML = `
      <div class="sheet icon-picker-sheet" onclick="event.stopPropagation()">
        <div class="sheet-head"><span>选择像素图标</span><span class="sheet-close" id="iconPickerClose">✕</span></div>
        <p class="icon-picker-hint">用于无照片时的封面；也可恢复按菜系自动匹配</p>
        <button type="button" class="icon-auto-row ${!cur ? 'on' : ''}" data-icon="">
          <img src="${DOTOWN_BASE}${autoFile}" alt="" class="icon-pick-cell-img" draggable="false">
          <span class="icon-auto-txt"><strong>按菜系自动</strong><small>当前：${escapeHtml(
            DOTOWN_PACK.find((p) => p.file === autoFile)?.label || '便当'
          )}</small></span>
        </button>
        <div class="icon-picker-grid">
          ${DOTOWN_PACK.map(
            (p) => `
            <button type="button" class="icon-pick-cell ${cur === p.file ? 'on' : ''}" data-icon="${p.file}">
              <img src="${DOTOWN_BASE}${p.file}" alt="" draggable="false">
              <span>${escapeHtml(p.label)}</span>
            </button>`
          ).join('')}
        </div>
      </div>`
    const close = () => {
      mask.style.display = 'none'
      lockEl?.classList.remove('scroll-locked')
    }
    mask.onclick = close
    document.getElementById('iconPickerClose').onclick = close
    mask.querySelectorAll('[data-icon]').forEach((el) => {
      el.onclick = (e) => {
        e.stopPropagation()
        onSelect?.(el.dataset.icon || '')
        close()
      }
    })
  }

  function escapeHtml(s) {
    return String(s ?? '')
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
  }

  function editSnapshot(c) {
    return JSON.stringify({
      name: c.name || '',
      location: c.location || '',
      date: c.date || '',
      cuisines: c.cuisines || [],
      taste: c.taste,
      level: c.level,
      reeat: c.reeat,
      photos: c.photos || [],
      note: c.note || '',
      dishes: c.dishes || [],
      dims: c.dims || {},
      dimOrder: c.dimOrder || [],
      dimAliases: c.dimAliases || {},
      fieldOrder: c.fieldOrder || [],
      pixelIcon: c.pixelIcon || '',
    })
  }

  function arrangeSnapshot(c) {
    return JSON.stringify({
      fieldOrder: c.fieldOrder || [],
      dimOrder: c.dimOrder || [],
    })
  }

  /** 通用确认弹层；cancelText 为空则只显示确认按钮 */
  function openAppModal({
    title,
    body = '',
    checkLabel = '',
    confirmText = '好的',
    cancelText = '取消',
    confirmPrimary = true,
    onConfirm,
    onCancel,
  } = {}) {
    let mask = document.getElementById('appModal')
    if (!mask) {
      mask = document.createElement('div')
      mask.id = 'appModal'
      mask.className = 'modal-mask'
      document.getElementById('app').appendChild(mask)
    }
    mask.style.display = 'flex'
    mask.innerHTML = `
      <div class="modal-card" onclick="event.stopPropagation()">
        <div class="modal-title">${escapeHtml(title)}</div>
        ${body ? `<div class="modal-body">${escapeHtml(body)}</div>` : ''}
        ${
          checkLabel
            ? `<label class="modal-check"><input type="checkbox" id="appModalCheck"><span>${escapeHtml(checkLabel)}</span></label>`
            : ''
        }
        <div class="modal-btns">
          ${
            cancelText
              ? `<button type="button" class="btn ${confirmPrimary ? 'btn-ghost' : 'btn-primary'}" id="appModalCancel">${escapeHtml(cancelText)}</button>`
              : ''
          }
          <button type="button" class="btn ${confirmPrimary ? 'btn-primary' : 'btn-ghost'}" id="appModalOk">${escapeHtml(confirmText)}</button>
        </div>
      </div>`
    const close = () => {
      mask.style.display = 'none'
    }
    mask.onclick = () => {
      close()
      onCancel?.()
    }
    const cancelBtn = document.getElementById('appModalCancel')
    if (cancelBtn) {
      cancelBtn.onclick = (e) => {
        e.stopPropagation()
        close()
        onCancel?.()
      }
    }
    document.getElementById('appModalOk').onclick = (e) => {
      e.stopPropagation()
      const checked = !!document.getElementById('appModalCheck')?.checked
      close()
      onConfirm?.(checked)
    }
  }

  function pressThen(el, fn, ms = 80) {
    if (!el) {
      fn?.()
      return
    }
    el.classList.add('is-pressing')
    setTimeout(() => {
      el.classList.remove('is-pressing')
      fn?.()
    }, ms)
  }

  /** 全站按下态：避免部分控件还没绑 pressThen 时没有反馈 */
  function installGlobalPress() {
    if (window.__fankuPressBound) return
    window.__fankuPressBound = true
    const sel = [
      'button',
      '.btn',
      '.toggle-opt',
      '.chip',
      '.level-opt',
      '.home-fab',
      '.home-search-btn',
      '.detail-back',
      '.detail-edit',
      '.eh-close',
      '.sheet-close',
      '.photo-cell',
      '.dish-rm',
      '.icon-pick-btn',
      '.icon-pick-cell',
      '.icon-auto-row',
      '.backup-row',
      '.danger-row',
      '.cuisine-chip',
      '.result-card',
      '.dim-picker-row',
      '.type-pick',
      '.field-drag-handle',
      '.ht-logo',
      '.chip-x',
      '.act',
    ].join(',')
    document.addEventListener(
      'pointerdown',
      (e) => {
        const el = e.target.closest(sel)
        if (!el || el.closest('.pile-card')) return
        el.classList.add('is-pressing')
      },
      true
    )
    const clear = () => {
      document.querySelectorAll('.is-pressing').forEach((el) => {
        if (!el.classList.contains('pile-card')) el.classList.remove('is-pressing')
      })
    }
    document.addEventListener('pointerup', clear, true)
    document.addEventListener('pointercancel', clear, true)
    document.addEventListener('pointerleave', clear, true)
  }

  function highlight(text, q) {
    const src = escapeHtml(text)
    if (!q) return src
    const key = escapeHtml(q).replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
    return src.replace(new RegExp(key, 'ig'), (m) => `<mark>${m}</mark>`)
  }

  /* ===== Views ===== */
  function viewSplash() {
    root().innerHTML = `
      <div class="view">
        <div class="splash">
          <div class="splash-bounce">${ONIGIRI}</div>
          <div class="splash-logo">${LOGO} 饭库</div>
          <div class="splash-sub">LOADING YOUR MEALS...</div>
          <div class="splash-bar"></div>
        </div>
      </div>`
    setTimeout(() => go('home'), 1400)
  }

  function viewHome() {
    const cards = S.getCards()
    const levels = ['strong', 'rec', 'normal', 'avoid']
    const piles = levels.map((key) => {
      const list = cards.filter((c) => c.level === key)
      const bgs = S.PHOTO_BG[key]
      const cardsHtml = list.length
        ? list
            .map(
              (c, i) => `
          <div class="pile-card" data-id="${c.id}">
            <div class="pc-photo" style="background:${bgs[i % bgs.length]}">
              ${
                c.photos?.[0]
                  ? `<img src="${c.photos[0]}" alt="">`
                  : `<img class="pc-dotown" src="${dotownSrc(c)}" alt="">`
              }
              ${badge(c.level, true).replace('lv-badge', 'lv-badge pc-lv')}
            </div>
            <div class="pc-body">
              <div class="pc-name">${escapeHtml(c.name)}</div>
              <div class="pc-meta">
                <span class="pc-date">${S.fmtShort(c.date)}</span>
                <span class="pc-stars">${starsHtml(c.taste, { size: 11, readonly: true })}</span>
              </div>
            </div>
          </div>`
            )
            .join('')
        : ''
      return `
        <div class="pile-wrap">
          <div class="pile-head">
            <span class="pile-dot" style="background:${S.LEVEL_META[key].color}"></span>
            <span class="pile-title">${S.LEVEL_META[key].label}</span>
            <span class="pile-count">${list.length}</span>
            <span class="pile-hint">‹ 滑动 ›</span>
          </div>
          ${list.length ? `<div class="pile">${cardsHtml}</div>` : `<div class="pile-empty">暂无 · 记一顿放进这堆</div>`}
        </div>`
    }).join('')

    root().innerHTML = `
      <div class="view home-body">
        <div class="home-scroll">
          <div class="home-header" id="homeHeader">
            <div class="home-title">
              <div class="ht-logo" id="logoBtn" title="备份与恢复">${LOGO} 饭库</div>
              <div class="home-search-btn" id="searchToggle">${ICO_SEARCH}${ICO_CLOSE}</div>
            </div>
            <div class="home-search-expand">
              <div class="search-box">
                ${ICO_SEARCH}
                <input id="homeSearch" placeholder="搜索店名、菜品、笔记">
              </div>
            </div>
          </div>
          <div class="home-piles">
            ${
              cards.length
                ? piles
                : `<div class="empty-hint"><img class="empty-dotown" src="${DOTOWN_BASE}${DOTOWN_EMPTY}" alt="" draggable="false">还没有饭卡<br>点右下角「＋」记下第一顿<br><span style="font-size:11px">点左上角 Logo 可备份</span></div>`
            }
          </div>
        </div>
        <div class="home-fab" id="fab">＋</div>
        <input type="file" id="backupFile" accept="application/json,.json" hidden>
      </div>`

    document.getElementById('searchToggle').onclick = () => {
      pressThen(document.getElementById('searchToggle'), () => {
        document.getElementById('homeHeader').classList.toggle('expanded')
      }, 60)
    }
    document.getElementById('homeSearch').onkeydown = (e) => {
      if (e.key === 'Enter') {
        searchQ = e.target.value.trim()
        go('search', { q: searchQ })
      }
    }
    document.getElementById('fab').onclick = () => {
      pressThen(document.getElementById('fab'), () => {
        editState = S.emptyCard()
        go('edit')
      })
    }

    const downloadBackup = () => {
      try {
        const payload = S.exportBackup()
        const text = JSON.stringify(payload, null, 2)
        const blob = new Blob([text], { type: 'application/json' })
        const url = URL.createObjectURL(blob)
        const a = document.createElement('a')
        const day = new Date().toISOString().slice(0, 10)
        a.href = url
        a.download = `饭库备份-${day}.json`
        a.click()
        setTimeout(() => URL.revokeObjectURL(url), 2000)
      } catch (e) {
        console.warn(e)
        alert('导出失败，再试一次吧')
      }
    }

    const runImportFile = (file) => {
      if (!file) return
      const reader = new FileReader()
      reader.onload = () => {
        const result = S.importBackup(String(reader.result || ''))
        if (!result.ok) {
          openAppModal({
            title: '没能导入',
            body: result.error || '请换一份备份再试。',
            confirmText: '好的',
            cancelText: '',
          })
          return
        }
        openAppModal({
          title: '备份已恢复',
          body: `共写入 ${result.cardCount} 张饭卡。`,
          confirmText: '好的',
          cancelText: '',
          onConfirm: () => go('home'),
        })
      }
      reader.onerror = () => {
        openAppModal({
          title: '没能导入',
          body: '文件读不出来，换一份试试。',
          confirmText: '好的',
          cancelText: '',
        })
      }
      reader.readAsText(file)
    }

    const openBackupSheet = () => {
      let mask = document.getElementById('backupSheet')
      if (!mask) {
        mask = document.createElement('div')
        mask.id = 'backupSheet'
        mask.className = 'sheet-mask'
        document.getElementById('app').appendChild(mask)
      }
      mask.style.display = 'flex'
      mask.innerHTML = `
        <div class="sheet backup-sheet" onclick="event.stopPropagation()">
          <div class="sheet-head"><span>数据备份</span><span class="sheet-close" id="backupClose">✕</span></div>
          <p class="backup-hint">备份会下载到本机文件；换手机或清缓存前先导出一份更安心。</p>
          <button type="button" class="backup-row" id="backupExport">
            <span class="backup-row-title">导出备份</span>
            <span class="backup-row-sub">下载 JSON 文件</span>
          </button>
          <button type="button" class="backup-row" id="backupImport">
            <span class="backup-row-title">从备份恢复</span>
            <span class="backup-row-sub">会覆盖本机现有饭卡</span>
          </button>
        </div>`
      const close = () => {
        mask.style.display = 'none'
      }
      mask.onclick = close
      document.getElementById('backupClose').onclick = close
      document.getElementById('backupExport').onclick = (e) => {
        e.stopPropagation()
        close()
        downloadBackup()
      }
      document.getElementById('backupImport').onclick = (e) => {
        e.stopPropagation()
        close()
        openAppModal({
          title: '用备份覆盖本机？',
          body: '本机现有饭卡会被替换。若还没导出，建议先取消、导出一份。',
          confirmText: '覆盖导入',
          cancelText: '再想想',
          confirmPrimary: false,
          onConfirm: () => document.getElementById('backupFile')?.click(),
        })
      }
    }

    document.getElementById('logoBtn').onclick = () => pressThen(document.getElementById('logoBtn'), openBackupSheet)
    document.getElementById('backupFile').onchange = (e) => {
      const file = e.target.files?.[0]
      e.target.value = ''
      runImportFile(file)
    }

    const finePointer = window.matchMedia('(hover: hover) and (pointer: fine)').matches
    root().querySelectorAll('.pile').forEach((pile) => {
      const cards = () => [...pile.querySelectorAll('.pile-card')]
      const clearLift = () => cards().forEach((c) => c.classList.remove('is-lifted'))
      const liftNearest = () => {
        if (finePointer) return
        const list = cards()
        if (!list.length) return
        const mid = pile.getBoundingClientRect().left + pile.clientWidth / 2
        let best = list[0]
        let bestDist = Infinity
        list.forEach((card) => {
          const r = card.getBoundingClientRect()
          const dist = Math.abs(r.left + r.width / 2 - mid)
          if (dist < bestDist) {
            bestDist = dist
            best = card
          }
        })
        list.forEach((c) => c.classList.toggle('is-lifted', c === best))
      }
      let scrollTick = 0
      pile.addEventListener(
        'scroll',
        () => {
          if (finePointer) return
          cancelAnimationFrame(scrollTick)
          scrollTick = requestAnimationFrame(liftNearest)
        },
        { passive: true }
      )
      liftNearest()

      cards().forEach((el) => {
        el.addEventListener('pointerdown', (e) => {
          if (e.pointerType === 'mouse' && finePointer) return
          clearLift()
          el.classList.add('is-lifted')
          el.classList.add('is-pressing')
        })
        el.addEventListener('pointerup', () => el.classList.remove('is-pressing'))
        el.addEventListener('pointercancel', () => el.classList.remove('is-pressing'))
        el.onclick = () => {
          el.classList.add('is-pressing')
          pressThen(el, () => go('detail', { id: el.dataset.id }), 90)
        }
      })
    })
  }

  function viewDetail() {
    const card = S.ensureCardDims(S.getCard(route.params.id))
    if (!card) return go('home')
    const reeatMap = { yes: ['一定会复吃', 'reeat-yes'], maybe: ['可能会', 'reeat-maybe'], no: ['不会了', 'reeat-no'] }
    const [reeatLabel, reeatCls] = reeatMap[card.reeat] || reeatMap.maybe
    const defMap = Object.fromEntries(S.getDefs().map((d) => [d.id, d]))
    const orderedIds = (card.dimOrder || []).length
      ? card.dimOrder
      : S.getDefs().map((d) => d.id)
    const defs = orderedIds
      .map((id) => defMap[id])
      .filter((d) => d && d.enabled && S.hasVal(card.dims?.[d.id]))
    const cuisineHtml = (card.cuisines || []).length
      ? `<div class="info-row"><span class="info-label">菜系</span><span class="info-val cuisine-chips">${(card.cuisines || [])
          .map(
            (t) =>
              `<span class="cuisine-chip">${dotownImg([t], 'cuisine-ico')}<span>${escapeHtml(t)}</span></span>`
          )
          .join('')}</span></div>`
      : ''

    const photos = (card.photos || []).length
      ? `<div class="photo-row">${card.photos.map((p) => `<div class="detail-photo"><img src="${p}" alt=""></div>`).join('')}</div>`
      : `<div class="detail-photo is-dotown is-pickable lv-cover-${escapeHtml(card.level || 'normal')}" id="iconCover" title="点击更换图标">${dotownImg(card, 'dotown-hero')}<span class="photo-ph">暂无实拍 · 点图标可更换</span></div>`

    const dishes = (card.dishes || []).filter((d) => (d.name || '').trim()).length
      ? `<div class="detail-section"><div class="ds-title">菜品</div>${card.dishes
          .filter((d) => (d.name || '').trim())
          .map(
            (d) => `<div class="dish-line">
              <span class="dish-name">${escapeHtml(d.name)}</span>
              ${starsHtml(dishRating(d), { size: 13, readonly: true })}
            </div>`
          )
          .join('')}</div>`
      : ''

    const dimsHtml = defs
      .map(
        (d) => `<div class="detail-section"><div class="ds-title">${escapeHtml(S.dimLabel(card, d))}</div>
         <div class="info-val">${
           d.type === 'stars'
             ? starsHtml(card.dims[d.id], { size: 15, readonly: true, showValue: true })
             : escapeHtml(S.formatDim(d, card.dims[d.id]))
         }</div></div>`
      )
      .join('')

    root().innerHTML = `
      <div class="view">
        <div class="detail-topbar">
          <div class="detail-back" id="back">‹</div>
          <div class="detail-right">${badge(card.level)}<span class="detail-edit" id="edit">编辑</span></div>
        </div>
        <div class="detail-body">
          <div class="detail-name">${escapeHtml(card.name)}</div>
          <div class="detail-info">
            ${card.location ? `<div class="info-row"><span class="info-label">位置</span><span class="info-val">${escapeHtml(card.location)}</span></div>` : ''}
            <div class="info-row"><span class="info-label">日期</span><span class="info-val mono">${S.fmtDate(card.date)}</span></div>
            ${cuisineHtml}
            <div class="info-row"><span class="info-label">口味</span><span class="info-val">${starsHtml(card.taste, { size: 15, readonly: true, showValue: true })}</span></div>
            <div class="info-row"><span class="info-label">复吃</span><span class="info-val"><span class="reeat ${reeatCls}">${reeatLabel}</span></span></div>
          </div>
          <div class="detail-section"><div class="ds-title">照片</div>${photos}</div>
          ${card.note ? `<div class="detail-section"><div class="ds-title">手账</div><div class="note-box">${escapeHtml(card.note)}</div></div>` : ''}
          ${dishes}
          ${dimsHtml}
          <div class="danger-row" id="del">删除饭卡</div>
        </div>
      </div>`

    document.getElementById('back').onclick = () => pressThen(document.getElementById('back'), () => go('home'))
    document.getElementById('edit').onclick = () => {
      pressThen(document.getElementById('edit'), () => {
        editState = S.ensureCardDims(JSON.parse(JSON.stringify(card)))
        go('edit')
      })
    }
    document.getElementById('del').onclick = () => {
      pressThen(document.getElementById('del'), () => {
        openAppModal({
          title: '丢掉这张饭卡？',
          body: '丢掉后就不能再找回来了。',
          confirmText: '丢掉',
          cancelText: '再想想',
          confirmPrimary: false,
          onConfirm: () => {
            S.deleteCard(card.id)
            go('home')
          },
        })
      })
    }
    const iconCover = document.getElementById('iconCover')
    if (iconCover) {
      iconCover.onclick = () => {
        openDotownPicker({
          selected: card.pixelIcon || '',
          cuisines: card.cuisines || [],
          onSelect: (file) => {
            card.pixelIcon = file
            S.upsertCard(card)
            go('detail', { id: card.id })
          },
        })
      }
    }
  }

  function dimPreviewControl(def, value) {
    if (def.type === 'stars') {
      return `<div class="dim-preview-ctrl">${starsHtml(value || 3, { size: 14, readonly: true })}</div>`
    }
    if (def.type === 'binary') {
      const opts = def.options || ['是', '否']
      return `<div class="dim-preview-ctrl toggle-row preview-off">
        <div class="toggle-opt on">${escapeHtml(opts[0])}</div>
        <div class="toggle-opt">${escapeHtml(opts[1])}</div>
      </div>`
    }
    if (def.type === 'ternary') {
      const opts = def.options || ['好', '中', '差']
      return `<div class="dim-preview-ctrl toggle-row preview-off">
        ${opts.map((o, i) => `<div class="toggle-opt ${i === 0 ? 'on' : ''}">${escapeHtml(o)}</div>`).join('')}
      </div>`
    }
    return `<div class="dim-preview-ctrl"><div class="pinput dim-preview-input">${escapeHtml(value || '填写…')}</div></div>`
  }

  const OPTIONAL_CORE = [
    { id: 'location', name: '位置' },
    { id: 'date', name: '日期' },
    { id: 'cuisine', name: '菜系' },
    { id: 'photos', name: '照片' },
    { id: 'note', name: '手账' },
    { id: 'dishes', name: '菜品' },
  ]

  function viewEdit() {
    if (!editState) editState = S.emptyCard()
    S.ensureCardDims(editState)
    const c = editState
    const isNew = !S.getCard(c.id)
    const arrange = !!c._arrangeMode
    if (!c._editSnapshot) c._editSnapshot = editSnapshot(c)
    if (arrange && !c._arrangeSnapshot) c._arrangeSnapshot = arrangeSnapshot(c)
    const allDefs = S.getDefs().filter((d) => d.enabled)
    const defMap = Object.fromEntries(allDefs.map((d) => [d.id, d]))
    const reeatIdx = { yes: 0, maybe: 1, no: 2 }[c.reeat] ?? 1

    const tags = (c.cuisines || [])
      .map(
        (t, i) =>
          arrange
            ? `<span class="chip on chip-tag"><span class="chip-text">${escapeHtml(t)}</span><button type="button" class="chip-x" data-rm-tag="${i}" aria-label="删除">×</button></span>`
            : `<span class="chip on" data-rm-tag="${i}">${escapeHtml(t)}</span>`
      )
      .join('')

    const photos = (c.photos || [])
      .map(
        (p, i) =>
          `<div class="photo-cell filled" data-rm-photo="${i}"><img src="${p}" alt=""><span class="rm">×</span></div>`
      )
      .join('')
    const photoAdd = (c.photos || []).length < 9 ? `<div class="photo-cell" data-add-photo>＋</div>` : ''

    if (!Array.isArray(c.dishes) || c.dishes.length === 0) {
      c.dishes = [{ name: '', rating: 5 }]
    }
    const dishes = c.dishes
      .map(
        (d, i) =>
          `<div class="dish-edit-row" data-dish-row="${i}">
            <input class="pinput" data-dish-name="${i}" value="${escapeHtml(d.name || '')}" placeholder="菜名…">
            <span data-dish-stars="${i}">${starsHtml(dishRating(d), { size: 16 })}</span>
            <span class="dish-rm" data-rm-dish="${i}">✕</span>
          </div>`
      )
      .join('')

    const wrapField = (id, inner) => {
      const locked = S.isLockedField(id)
      if (!arrange) return `<div class="edit-section" data-field-id="${id}">${inner}</div>`
      return `<div class="field-swipe-wrap ${locked ? 'is-locked' : ''}" data-field-row data-field-id="${id}" data-locked="${locked ? '1' : '0'}">
        ${locked ? '' : '<div class="field-swipe-del">删除</div>'}
        <div class="field-swipe-content edit-section">
          <button type="button" class="field-drag-handle" aria-label="拖动排序" title="按住拖动">
            <i></i><i></i><i></i>
          </button>
          <div class="field-body">${inner}</div>
        </div>
      </div>`
    }

    const renderDimInner = (d) => {
      const v = c.dims?.[d.id]
      const label = S.dimLabel(c, d)
      if (d.type === 'text') {
        return `<label class="input-label">${escapeHtml(label)}</label>
          <input class="pinput" data-dim="${d.id}" value="${escapeHtml(v ?? '')}" placeholder="填写${escapeHtml(label)}…">`
      }
      if (d.type === 'stars') {
        return `<label class="input-label">${escapeHtml(label)}</label>
          <div data-dim-stars="${d.id}">${starsHtml(v || 0, { showValue: true, brand: true })}</div>`
      }
      if (d.type === 'binary') {
        const opts = d.options || ['是', '否']
        const on0 = v === true || v === 1
        return `<label class="input-label">${escapeHtml(label)}</label>
          <div class="toggle-row" data-dim-bin="${d.id}">
            <div class="toggle-opt ${on0 ? 'on' : ''}" data-v="1">${escapeHtml(opts[0])}</div>
            <div class="toggle-opt ${!on0 && v !== null && v !== undefined ? 'on' : ''}" data-v="0">${escapeHtml(opts[1])}</div>
          </div>`
      }
      const opts = d.options || ['好', '中', '差']
      const idx = typeof v === 'number' ? v : -1
      return `<label class="input-label">${escapeHtml(label)}</label>
        <div class="toggle-row" data-dim-ter="${d.id}">
          ${opts.map((o, i) => `<div class="toggle-opt ${idx === i ? 'on' : ''}" data-v="${i}">${escapeHtml(o)}</div>`).join('')}
        </div>`
    }

    const renderCoreInner = (id) => {
      if (id === 'name') {
        return `<label class="input-label">店名 <span class="req">*</span></label>
          <input class="pinput" id="fName" value="${escapeHtml(c.name)}">`
      }
      if (id === 'location') {
        return `<label class="input-label">位置</label>
          <input class="pinput" id="fLoc" value="${escapeHtml(c.location || '')}">`
      }
      if (id === 'date') {
        return `<label class="input-label">日期 <span class="req">*</span></label>
          <input class="pinput mono" id="fDate" type="date" value="${c.date}">`
      }
      if (id === 'cuisine') {
        const iconMode = c.pixelIcon ? '自定义' : '按菜系自动'
        return `<label class="input-label">菜系</label>
          <div id="tags">${tags}</div>
          <div class="tag-add"><input class="pinput" id="tagInput" placeholder="添加菜系标签…"><button class="btn btn-sm" id="tagAdd">＋</button></div>
            <div class="suggest-tags" id="suggestTags" style="margin-top:8px"></div>
          <label class="input-label" style="margin-top:12px">像素图标</label>
          <button type="button" class="icon-pick-btn" id="iconPickBtn">
            <img class="icon-pick-preview" id="iconPickPreview" src="${dotownSrc(c)}" alt="" draggable="false">
            <span class="icon-pick-meta">
              <span class="icon-pick-title" id="iconPickTitle">${iconMode}</span>
              <span class="icon-pick-sub">无照片时作封面 · 点击更换</span>
            </span>
          </button>`
      }
      if (id === 'taste') {
        return `<label class="input-label">口味评分 <span class="req">*</span></label>
          <div id="tasteStars">${starsHtml(c.taste, { showValue: true, brand: true })}</div>`
      }
      if (id === 'level') {
        return `<label class="input-label">等级 <span class="req">*</span></label>
          <div class="level-row">${LEVEL_OPTS.map(
            (lv) =>
              `<div class="level-opt lv-${lv.key} ${c.level === lv.key ? 'on' : ''}" data-level="${lv.key}"><span class="lv-ico">${lv.ico}</span>${lv.label}</div>`
          ).join('')}</div>`
      }
      if (id === 'reeat') {
        return `<label class="input-label">复吃意愿 <span class="req">*</span></label>
          <div class="toggle-row" id="reeat">
            ${['一定会', '可能会', '不会'].map((t, i) => `<div class="toggle-opt ${reeatIdx === i ? 'on' : ''}" data-v="${i}">${t}</div>`).join('')}
          </div>`
      }
      if (id === 'photos') {
        return `<label class="input-label">照片 <span class="mono" style="color:var(--ink-muted)">0-9</span></label>
          <div class="photo-grid" id="photoGrid">${photos}${photoAdd}</div>
          <input type="file" id="filePick" accept="image/*" multiple hidden>`
      }
      if (id === 'note') {
        return `<label class="input-label">手账</label>
          <textarea class="pinput" id="fNote" style="min-height:74px;resize:none" placeholder="记下这顿饭的感受…">${escapeHtml(c.note || '')}</textarea>`
      }
      if (id === 'dishes') {
        return `<label class="input-label">菜品</label>
          <div id="dishList">${dishes}</div>
          <button type="button" class="btn btn-sm dish-add-btn" id="dishAdd">＋ 添加菜品</button>`
      }
      return ''
    }

    const fieldsHtml = c.fieldOrder
      .map((id) => {
        if (S.isCoreField(id)) {
          const inner = renderCoreInner(id)
          return inner ? wrapField(id, inner) : ''
        }
        const d = defMap[id]
        if (!d) return ''
        return wrapField(id, renderDimInner(d))
      })
      .join('')

    root().innerHTML = `
      <div class="view ${arrange ? 'is-arrange' : ''}" id="editView">
        <div class="edit-header">
          <div class="eh-left"><span class="eh-close" id="close">✕</span><span class="eh-title">${isNew ? '新建饭卡' : '编辑饭卡'}</span></div>
          <div class="eh-right">
            <button type="button" class="btn btn-sm ${arrange ? 'btn-primary' : 'btn-ghost'}" id="arrangeBtn">${arrange ? '完成' : '编排'}</button>
            ${arrange ? '' : '<button type="button" class="btn btn-sm btn-primary" id="save">保存</button>'}
          </div>
        </div>
        <div class="edit-body" id="editBody">
          <div id="fieldsList">${fieldsHtml}</div>
          ${arrange ? `<button type="button" class="btn btn-sm dish-add-btn" id="addDimBtn">＋ 添加维度</button>` : ''}
        </div>
      </div>
      <div class="sheet-mask" id="dimSheet" style="display:none"></div>`

    const sync = () => {
      const nameEl = document.getElementById('fName')
      const locEl = document.getElementById('fLoc')
      const dateEl = document.getElementById('fDate')
      const noteEl = document.getElementById('fNote')
      if (nameEl) c.name = nameEl.value
      if (locEl) c.location = locEl.value
      if (dateEl) c.date = dateEl.value
      if (noteEl) c.note = noteEl.value
      root().querySelectorAll('[data-dish-name]').forEach((el) => {
        const i = Number(el.dataset.dishName)
        if (c.dishes[i]) c.dishes[i].name = el.value
      })
      root().querySelectorAll('[data-dim]').forEach((el) => {
        c.dims = { ...c.dims, [el.dataset.dim]: el.value }
      })
    }

    const getEditScroll = () => document.getElementById('editView')?.scrollTop || 0
    const setEditScroll = (top) => {
      const apply = () => {
        const v = document.getElementById('editView')
        if (v) v.scrollTop = top
      }
      requestAnimationFrame(() => requestAnimationFrame(apply))
    }

    const refresh = () => {
      sync()
      c._editScroll = getEditScroll()
      viewEdit()
    }

    if (typeof c._editScroll === 'number') {
      setEditScroll(c._editScroll)
    }

    const leaveEdit = () => {
      c._arrangeMode = false
      delete c._editSnapshot
      delete c._arrangeSnapshot
      editState = null
      go(isNew ? 'home' : 'detail', { id: c.id })
    }
    document.getElementById('close').onclick = () => {
      pressThen(document.getElementById('close'), () => {
        sync()
        if (editSnapshot(c) === c._editSnapshot) {
          leaveEdit()
          return
        }
        openAppModal({
          title: isNew ? '这顿还没记下' : '改动还没保存',
          body: isNew ? '现在离开，刚填的会丢掉。' : '现在离开，这次修改会丢掉。',
          confirmText: '离开',
          cancelText: isNew ? '继续写' : '继续改',
          confirmPrimary: false,
          onConfirm: leaveEdit,
        })
      })
    }
    const saveBtn = document.getElementById('save')
    if (saveBtn) {
      saveBtn.onclick = () => {
        pressThen(saveBtn, () => {
          sync()
          if (!c.name.trim()) return alert('先写个店名吧')
          if (!c.date) {
            const d = new Date()
            c.date = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
          }
          c.dishes = (c.dishes || [])
            .map((d) => ({ name: (d.name || '').trim(), rating: dishRating(d) }))
            .filter((d) => d.name)
          delete c._shownDims
          delete c._dishMark
          delete c._arrangeMode
          delete c._editSnapshot
          delete c._arrangeSnapshot
          S.upsertCard(c)
          editState = null
          go('detail', { id: c.id })
        })
      }
    }
    document.getElementById('arrangeBtn').onclick = () => {
      const arrangeBtn = document.getElementById('arrangeBtn')
      pressThen(arrangeBtn, () => {
        sync()
        if (!c._arrangeMode) {
          c._arrangeMode = true
          c._arrangeSnapshot = arrangeSnapshot(c)
          refresh()
          return
        }
        const changed = arrangeSnapshot(c) !== c._arrangeSnapshot
        const finishArrange = (asDefault) => {
          if (asDefault) S.saveDefaultLayout(c.fieldOrder, c.dimOrder)
          c._arrangeMode = false
          delete c._arrangeSnapshot
          refresh()
        }
        if (!changed) {
          finishArrange(false)
          return
        }
        openAppModal({
          title: '编排完成',
          body: '这套字段写法可以留给以后的新饭卡。',
          checkLabel: '以后新建饭卡也用这套',
          confirmText: '收好',
          cancelText: '',
          onConfirm: (checked) => finishArrange(!!checked),
          onCancel: () => {},
        })
      })
    }

    /* 填写交互（编排模式下也可正常填写） */
    bindStars(root(), (val, grp) => {
      const dishIdx = grp.closest('[data-dish-stars]')?.dataset.dishStars
      if (dishIdx != null) {
        const i = Number(dishIdx)
        if (c.dishes[i]) {
          c.dishes[i].rating = val
          delete c.dishes[i].mark
        }
        paintStars(grp, val)
        return
      }
      const dimId = grp.closest('[data-dim-stars]')?.dataset.dimStars
      if (dimId) c.dims = { ...c.dims, [dimId]: val }
      else c.taste = val
      paintStars(grp, val)
    })

    root().querySelectorAll('[data-level]').forEach((el) => {
      el.onclick = () => {
        c.level = el.dataset.level
        root().querySelectorAll('[data-level]').forEach((x) => x.classList.toggle('on', x === el))
      }
    })
    const reeatEl = document.getElementById('reeat')
    if (reeatEl) {
      reeatEl.querySelectorAll('.toggle-opt').forEach((el) => {
        el.onclick = () => {
          c.reeat = ['yes', 'maybe', 'no'][Number(el.dataset.v)]
          setToggleOn(reeatEl, el)
        }
      })
    }

    const paintSuggestTags = () => {
      const box = document.getElementById('suggestTags')
      if (!box) return
      const inArrange = !!c._arrangeMode
      const list = S.getCuisineTags().slice(0, 12)
      box.innerHTML = list
        .map((t) =>
          inArrange
            ? `<span class="chip chip-tag chip-sug" data-sug="${escapeHtml(t)}"><span class="chip-text">${escapeHtml(t)}</span><button type="button" class="chip-x" data-del-sug="${escapeHtml(t)}" aria-label="删除建议">×</button></span>`
            : `<span class="chip" data-sug="${escapeHtml(t)}">${escapeHtml(t)}</span>`
        )
        .join('')
      box.querySelectorAll('[data-sug]').forEach((el) => {
        el.onclick = (e) => {
          if (e.target.closest('[data-del-sug]')) return
          addTag(el.dataset.sug)
        }
      })
      box.querySelectorAll('[data-del-sug]').forEach((el) => {
        el.onclick = (e) => {
          e.preventDefault()
          e.stopPropagation()
          S.removeCuisineTag(el.dataset.delSug)
          paintSuggestTags()
        }
      })
    }

    const paintTags = () => {
      const box = document.getElementById('tags')
      if (!box) return
      const inArrange = !!c._arrangeMode
      box.innerHTML = (c.cuisines || [])
        .map((t, i) =>
          inArrange
            ? `<span class="chip on chip-tag"><span class="chip-text">${escapeHtml(t)}</span><button type="button" class="chip-x" data-rm-tag="${i}" aria-label="删除">×</button></span>`
            : `<span class="chip on" data-rm-tag="${i}">${escapeHtml(t)}</span>`
        )
        .join('')
      box.querySelectorAll('[data-rm-tag]').forEach((el) => {
        el.onclick = (e) => {
          if (inArrange && !e.target.closest('.chip-x')) return
          e.stopPropagation()
          c.cuisines.splice(Number(el.dataset.rmTag), 1)
          paintTags()
          paintIconPick()
        }
      })
    }
    const paintIconPick = () => {
      const preview = document.getElementById('iconPickPreview')
      const title = document.getElementById('iconPickTitle')
      if (preview) preview.src = dotownSrc(c)
      if (title) title.textContent = c.pixelIcon ? '自定义' : '按菜系自动'
    }
    const addTag = (t) => {
      t = (t || '').trim()
      if (!t) return
      c.cuisines = c.cuisines || []
      if (!c.cuisines.includes(t)) c.cuisines.push(t)
      const tip = document.getElementById('tagInput')
      if (tip) tip.value = ''
      paintTags()
      paintSuggestTags()
      paintIconPick()
    }
    const iconPickBtn = document.getElementById('iconPickBtn')
    if (iconPickBtn) {
      iconPickBtn.onclick = () => {
        pressThen(iconPickBtn, () => {
          openDotownPicker({
            selected: c.pixelIcon || '',
            cuisines: c.cuisines || [],
            onSelect: (file) => {
              c.pixelIcon = file
              paintIconPick()
            },
          })
        })
      }
    }
    const tagAdd = document.getElementById('tagAdd')
    if (tagAdd) tagAdd.onclick = () => pressThen(tagAdd, () => addTag(document.getElementById('tagInput').value))
    const tagInput = document.getElementById('tagInput')
    if (tagInput) {
      tagInput.onkeydown = (e) => {
        if (e.key === 'Enter') {
          e.preventDefault()
          addTag(e.target.value)
        }
      }
    }
    paintTags()
    paintSuggestTags()

    const filePick = document.getElementById('filePick')
    if (filePick) {
      const bindPhotoCells = () => {
        root().querySelectorAll('[data-add-photo]').forEach((el) => {
          el.onclick = () => filePick.click()
        })
        root().querySelectorAll('[data-rm-photo]').forEach((el) => {
          el.onclick = (e) => {
            e.stopPropagation()
            c.photos.splice(Number(el.dataset.rmPhoto), 1)
            paintPhotos()
          }
        })
      }
      const paintPhotos = () => {
        const grid = document.getElementById('photoGrid')
        if (!grid) return
        const filled = (c.photos || [])
          .map(
            (p, i) =>
              `<div class="photo-cell filled" data-rm-photo="${i}"><img src="${p}" alt=""><span class="rm">×</span></div>`
          )
          .join('')
        const add = (c.photos || []).length < 9 ? `<div class="photo-cell" data-add-photo>＋</div>` : ''
        grid.innerHTML = `${filled}${add}`
        bindPhotoCells()
      }
      bindPhotoCells()
      filePick.onchange = () => {
        const files = [...filePick.files].slice(0, 9 - (c.photos?.length || 0))
        let left = files.length
        if (!left) return
        files.forEach((f) => {
          const reader = new FileReader()
          reader.onload = () => {
            c.photos = c.photos || []
            if (c.photos.length < 9) c.photos.push(reader.result)
            left -= 1
            if (left <= 0) paintPhotos()
          }
          reader.readAsDataURL(f)
        })
        filePick.value = ''
      }
    }

    const reindexDishes = () => {
      root().querySelectorAll('[data-dish-row]').forEach((row, i) => {
        row.dataset.dishRow = String(i)
        const name = row.querySelector('[data-dish-name]')
        const stars = row.querySelector('[data-dish-stars]')
        const rm = row.querySelector('[data-rm-dish]')
        if (name) name.dataset.dishName = String(i)
        if (stars) stars.dataset.dishStars = String(i)
        if (rm) rm.dataset.rmDish = String(i)
      })
    }
    const bindDishStars = (wrap) => {
      bindStars(wrap, (val, grp) => {
        const i = Number(grp.closest('[data-dish-stars]')?.dataset.dishStars)
        if (c.dishes[i]) {
          c.dishes[i].rating = val
          delete c.dishes[i].mark
        }
        paintStars(grp, val)
      })
    }
    const dishAdd = document.getElementById('dishAdd')
    if (dishAdd) {
      dishAdd.onclick = (e) => {
        e.preventDefault()
        pressThen(dishAdd, () => {
          sync()
          c.dishes = c.dishes || []
          c.dishes.push({ name: '', rating: 5 })
          const i = c.dishes.length - 1
          const list = document.getElementById('dishList')
          const row = document.createElement('div')
          row.className = 'dish-edit-row'
          row.dataset.dishRow = String(i)
          row.innerHTML = `
          <input class="pinput" data-dish-name="${i}" value="" placeholder="菜名…">
          <span data-dish-stars="${i}">${starsHtml(5, { size: 16 })}</span>
          <span class="dish-rm" data-rm-dish="${i}">✕</span>`
          list.appendChild(row)
          row.querySelector('[data-dish-name]').oninput = (ev) => {
            const idx = Number(ev.target.dataset.dishName)
            if (c.dishes[idx]) c.dishes[idx].name = ev.target.value
          }
          row.querySelector('[data-rm-dish]').onclick = () => {
            sync()
            const idx = Number(row.dataset.dishRow)
            c.dishes.splice(idx, 1)
            row.remove()
            reindexDishes()
          }
          bindDishStars(row)
          row.querySelector('input').focus()
        })
      }
    }
    root().querySelectorAll('[data-rm-dish]').forEach((el) => {
      el.onclick = () => {
        sync()
        const idx = Number(el.dataset.rmDish)
        c.dishes.splice(idx, 1)
        el.closest('[data-dish-row]')?.remove()
        reindexDishes()
      }
    })
    root().querySelectorAll('[data-dish-name]').forEach((el) => {
      el.oninput = () => {
        const i = Number(el.dataset.dishName)
        if (c.dishes[i]) c.dishes[i].name = el.value
      }
    })
    root().querySelectorAll('[data-dim]').forEach((el) => {
      el.oninput = () => {
        c.dims = { ...c.dims, [el.dataset.dim]: el.value }
      }
    })
    root().querySelectorAll('[data-dim-bin]').forEach((row) => {
      row.querySelectorAll('.toggle-opt').forEach((el) => {
        el.onclick = () => {
          c.dims = { ...c.dims, [row.dataset.dimBin]: el.dataset.v === '1' }
          setToggleOn(row, el)
        }
      })
    })
    root().querySelectorAll('[data-dim-ter]').forEach((row) => {
      row.querySelectorAll('.toggle-opt').forEach((el) => {
        el.onclick = () => {
          c.dims = { ...c.dims, [row.dataset.dimTer]: Number(el.dataset.v) }
          setToggleOn(row, el)
        }
      })
    })

    /* —— 编排：长按排序 + 左滑删除 —— */
    if (arrange) {
      const removeField = (id) => {
        if (S.isLockedField(id)) return
        c.fieldOrder = c.fieldOrder.filter((x) => x !== id)
        if (!S.isCoreField(id)) {
          c.dimOrder = c.dimOrder.filter((x) => x !== id)
        }
        refresh()
      }

      const bindArrangeGestures = () => {
        const list = document.getElementById('fieldsList')
        const appRoot = root()
        let drag = null

        const resetSwipe = (row) => {
          const content = row.querySelector('.field-swipe-content')
          if (content) content.style.transform = ''
          row.classList.remove('swiping')
        }

        /* 左滑删除：在内容区（不含把手） */
        list.querySelectorAll('[data-field-row]').forEach((row) => {
          const content = row.querySelector('.field-swipe-content')
          const locked = row.dataset.locked === '1'
          let mode = null
          let startX = 0
          let startY = 0
          let tracking = false

          const onStart = (x, y) => {
            tracking = true
            mode = null
            startX = x
            startY = y
            list.querySelectorAll('[data-field-row]').forEach((r) => {
              if (r !== row) resetSwipe(r)
            })
          }
          const onMove = (x, y, e) => {
            if (!tracking || drag) return
            const dx = x - startX
            const dy = y - startY
            if (mode === null && (Math.abs(dx) > 8 || Math.abs(dy) > 8)) {
              if (Math.abs(dx) > Math.abs(dy) && dx < -4 && !locked) mode = 'swipe'
              else mode = 'scroll'
            }
            if (mode === 'swipe') {
              if (e) e.preventDefault()
              content.style.transform = `translateX(${Math.min(0, Math.max(dx, -88))}px)`
              row.classList.add('swiping')
            }
          }
          const onEnd = () => {
            if (!tracking || drag) {
              tracking = false
              return
            }
            tracking = false
            if (mode === 'swipe') {
              const m = (content.style.transform.match(/-?\d+/) || [0])[0]
              if (Number(m) < -56) {
                removeField(row.dataset.fieldId)
                return
              }
              resetSwipe(row)
            }
            mode = null
          }

          content.addEventListener(
            'touchstart',
            (e) => {
              if (e.target.closest('.field-drag-handle')) return
              if (e.target.closest('input, textarea, button, .star, .toggle-opt, .level-opt, .chip, .photo-cell')) return
              onStart(e.touches[0].clientX, e.touches[0].clientY)
            },
            { passive: true }
          )
          content.addEventListener(
            'touchmove',
            (e) => {
              if (e.target.closest('.field-drag-handle')) return
              onMove(e.touches[0].clientX, e.touches[0].clientY, e)
            },
            { passive: false }
          )
          content.addEventListener('touchend', onEnd)
          content.addEventListener('touchcancel', onEnd)
        })

        /* 三横线把手拖动排序 */
        list.querySelectorAll('.field-drag-handle').forEach((handle) => {
          const row = handle.closest('[data-field-row]')

          const startDrag = (clientX, clientY, e) => {
            e.preventDefault()
            e.stopPropagation()
            c._editScroll = getEditScroll()
            const rect = row.getBoundingClientRect()
            const placeholder = document.createElement('div')
            placeholder.className = 'field-drop-placeholder'
            placeholder.style.height = `${rect.height}px`
            placeholder.setAttribute('data-drop-ph', '1')

            const ghost = row.cloneNode(true)
            ghost.classList.add('field-drag-ghost')
            ghost.querySelectorAll('.field-swipe-del').forEach((el) => el.remove())
            ghost.style.width = `${rect.width}px`
            ghost.style.height = `${rect.height}px`
            ghost.style.left = `${rect.left}px`
            ghost.style.top = `${rect.top}px`
            appRoot.appendChild(ghost)

            list.insertBefore(placeholder, row)
            row.classList.add('field-drag-source')

            drag = {
              row,
              ghost,
              placeholder,
              offsetY: clientY - rect.top,
              offsetX: clientX - rect.left,
            }
            if (navigator.vibrate) navigator.vibrate(10)
          }

          const moveDrag = (clientX, clientY, e) => {
            if (!drag) return
            if (e) e.preventDefault()
            drag.ghost.style.top = `${clientY - drag.offsetY}px`
            drag.ghost.style.left = `${clientX - drag.offsetX}px`

            const siblings = [...list.children].filter((el) => el !== drag.row && el !== drag.placeholder)
            let placed = false
            for (const item of siblings) {
              const r = item.getBoundingClientRect()
              if (clientY < r.top + r.height / 2) {
                list.insertBefore(drag.placeholder, item)
                placed = true
                break
              }
            }
            if (!placed) list.appendChild(drag.placeholder)

            siblings.forEach((el) => el.classList.remove('field-drop-near'))
            const prev = drag.placeholder.previousElementSibling
            const next = drag.placeholder.nextElementSibling
            if (prev && prev !== drag.row) prev.classList.add('field-drop-near')
            if (next && next !== drag.row) next.classList.add('field-drop-near')
          }

          const endDrag = () => {
            if (!drag) return
            list.querySelectorAll('.field-drop-near').forEach((el) => el.classList.remove('field-drop-near'))
            list.insertBefore(drag.row, drag.placeholder)
            drag.placeholder.remove()
            drag.ghost.remove()
            drag.row.classList.remove('field-drag-source')
            const next = [...list.querySelectorAll('[data-field-row]')].map((r) => r.dataset.fieldId)
            c.fieldOrder = next
            c.dimOrder = next.filter((id) => !S.isCoreField(id))
            drag = null
            setEditScroll(c._editScroll || 0)
          }

          handle.addEventListener(
            'touchstart',
            (e) => {
              startDrag(e.touches[0].clientX, e.touches[0].clientY, e)
            },
            { passive: false }
          )
          handle.addEventListener(
            'touchmove',
            (e) => {
              if (!drag) return
              moveDrag(e.touches[0].clientX, e.touches[0].clientY, e)
            },
            { passive: false }
          )
          handle.addEventListener('touchend', endDrag)
          handle.addEventListener('touchcancel', endDrag)

          handle.addEventListener('mousedown', (e) => {
            startDrag(e.clientX, e.clientY, e)
            const move = (ev) => moveDrag(ev.clientX, ev.clientY, ev)
            const up = () => {
              document.removeEventListener('mousemove', move)
              document.removeEventListener('mouseup', up)
              endDrag()
            }
            document.addEventListener('mousemove', move)
            document.addEventListener('mouseup', up)
          })
        })
      }
      bindArrangeGestures()

      const openDimPicker = () => {
        const view = document.getElementById('editView')
        c._editScroll = view?.scrollTop || 0
        if (view) {
          view.classList.add('scroll-locked')
          view.scrollTop = c._editScroll
        }
        const sheet = document.getElementById('dimSheet')
        const defs = S.getDefs().filter((d) => d.enabled)
        let draft = c.fieldOrder.filter((id) => !S.isLockedField(id))

        const unlockScroll = () => {
          if (view) {
            view.classList.remove('scroll-locked')
            view.scrollTop = c._editScroll || 0
          }
        }

        const paintCheck = (id) => {
          const row = sheet.querySelector(`[data-pick="${id}"]`)
          if (!row) return
          const on = draft.includes(id)
          const check = row.querySelector('.pix-check')
          const box = row.querySelector('.pix-check-box')
          if (check) check.classList.toggle('on', on)
          if (box) box.textContent = on ? '✓' : ''
        }

        const renderPicker = () => {
          const listScroll = sheet.querySelector('.dim-picker-list')?.scrollTop || 0
          const checked = new Set(draft)
          const coreRows = OPTIONAL_CORE.map((item) => {
            const on = checked.has(item.id)
            return `<div class="dim-picker-row" data-pick="${item.id}">
              <div class="dim-picker-main">
                <div class="input-label dim-picker-name">${escapeHtml(item.name)}</div>
                <div class="dim-picker-sub">基础字段</div>
              </div>
              <label class="pix-check ${on ? 'on' : ''}" data-check="${item.id}">
                <span class="pix-check-box">${on ? '✓' : ''}</span>
              </label>
            </div>`
          }).join('')
          const dimRows = defs
            .map((d) => {
              const on = checked.has(d.id)
              return `<div class="dim-picker-row" data-pick="${d.id}">
                <div class="dim-picker-main">
                  <div class="input-label dim-picker-name">${escapeHtml(d.name)}</div>
                  ${dimPreviewControl(d, c.dims?.[d.id])}
                </div>
                <label class="pix-check ${on ? 'on' : ''}" data-check="${d.id}">
                  <span class="pix-check-box">${on ? '✓' : ''}</span>
                </label>
              </div>`
            })
            .join('')

          sheet.style.display = 'flex'
          sheet.innerHTML = `
            <div class="sheet dim-picker-sheet" onclick="event.stopPropagation()">
              <div class="sheet-head">
                <span>添加维度</span>
                <span class="sheet-close" id="pickerClose">✕</span>
              </div>
              <div class="dim-picker-list">
                ${coreRows}${dimRows}
                <div class="dim-picker-row dim-picker-custom" id="customDimEntry">
                  <div class="dim-picker-main">
                    <div class="input-label dim-picker-name">自定义维度</div>
                    <div class="dim-picker-sub">新建一种填写方式并加入本卡</div>
                  </div>
                  <span class="dim-picker-arrow">›</span>
                </div>
              </div>
              <button type="button" class="btn btn-primary dim-picker-confirm" id="pickerConfirm">确认</button>
            </div>`

          if (view) view.scrollTop = c._editScroll || 0
          const listEl = sheet.querySelector('.dim-picker-list')
          if (listEl) listEl.scrollTop = listScroll

          sheet.onclick = () => {
            sheet.style.display = 'none'
            unlockScroll()
          }
          document.getElementById('pickerClose').onclick = (e) => {
            e.stopPropagation()
            sheet.style.display = 'none'
            unlockScroll()
          }
          document.getElementById('pickerConfirm').onclick = (e) => {
            e.stopPropagation()
            const lockedPresent = ['name', 'taste', 'level', 'reeat']
            const prev = [...c.fieldOrder]
            const next = []
            lockedPresent.forEach((id) => {
              if (!next.includes(id)) next.push(id)
            })
            prev.forEach((id) => {
              if (S.isLockedField(id)) return
              if (draft.includes(id) && !next.includes(id)) next.push(id)
            })
            draft.forEach((id) => {
              if (!next.includes(id)) next.push(id)
            })
            c.fieldOrder = next
            c.dimOrder = next.filter((id) => !S.isCoreField(id))
            sheet.style.display = 'none'
            unlockScroll()
            refresh()
          }

          const togglePick = (id) => {
            if (draft.includes(id)) {
              if (!S.isCoreField(id) && S.hasVal(c.dims?.[id]) && !confirm('该项已有内容，确定从本卡移除？')) return
              draft = draft.filter((x) => x !== id)
            } else {
              draft = [...draft, id]
            }
            paintCheck(id)
          }
          sheet.querySelectorAll('[data-check]').forEach((el) => {
            el.onclick = (e) => {
              e.preventDefault()
              e.stopPropagation()
              togglePick(el.dataset.check)
            }
          })
          sheet.querySelectorAll('.dim-picker-row[data-pick]').forEach((row) => {
            row.onclick = (e) => {
              e.stopPropagation()
              if (e.target.closest('[data-check]')) return
              togglePick(row.dataset.pick)
            }
          })
          document.getElementById('customDimEntry').onclick = (e) => {
            e.stopPropagation()
            openNewDimForm(sheet, {
              onBack: () => renderPicker(),
              onCreated: (newId) => {
                if (!draft.includes(newId)) draft = [...draft, newId]
                const created = S.getDefs().find((d) => d.id === newId)
                if (created && !defs.some((d) => d.id === newId)) defs.push(created)
                renderPicker()
              },
            })
          }
        }

        renderPicker()
      }

      const openNewDimForm = (sheet, { onBack, onCreated } = {}) => {
        sheet.innerHTML = `
          <div class="sheet dim-picker-sheet" onclick="event.stopPropagation()">
            <div class="sheet-head">
              <span>自定义维度</span>
              <span class="sheet-close" id="newDimClose">✕</span>
            </div>
            <div class="edit-section">
              <label class="input-label">名称 <span class="req">*</span></label>
              <input class="pinput" id="newDimName" placeholder="如：环境、排队">
            </div>
            <div class="edit-section">
              <label class="input-label">填写方式</label>
              <div class="type-pick-grid">
                <div class="type-pick on" data-type="stars"><span class="type-pick-ico">★</span>星级</div>
                <div class="type-pick" data-type="binary"><span class="type-pick-ico">⇄</span>两种选项</div>
                <div class="type-pick" data-type="ternary"><span class="type-pick-ico">☰</span>三种选项</div>
                <div class="type-pick" data-type="text"><span class="type-pick-ico">T</span>文字</div>
              </div>
            </div>
            <div class="edit-section" id="newDimOpts"></div>
            <div class="sheet-btns">
              <button type="button" class="btn btn-ghost" id="newDimBack">返回</button>
              <button type="button" class="btn btn-primary" id="newDimSave">确认</button>
            </div>
          </div>`
        let type = 'stars'
        const renderOpts = () => {
          const box = document.getElementById('newDimOpts')
          if (type === 'binary') {
            box.innerHTML = `<label class="input-label">选项文案</label><div class="opt-row">
              <input class="pinput" id="no0" value="是"><input class="pinput" id="no1" value="否"></div>`
          } else if (type === 'ternary') {
            box.innerHTML = `<label class="input-label">选项文案</label><div class="opt-row">
              <input class="pinput" id="no0" value="好"><input class="pinput" id="no1" value="中"><input class="pinput" id="no2" value="差"></div>`
          } else box.innerHTML = ''
        }
        renderOpts()
        sheet.querySelectorAll('.type-pick').forEach((el) => {
          el.onclick = () => {
            type = el.dataset.type
            sheet.querySelectorAll('.type-pick').forEach((x) => x.classList.toggle('on', x === el))
            renderOpts()
          }
        })
        document.getElementById('newDimClose').onclick = () => {
          sheet.style.display = 'none'
        }
        document.getElementById('newDimBack').onclick = (e) => {
          e.stopPropagation()
          if (typeof onBack === 'function') onBack()
          else openDimPicker()
        }
        document.getElementById('newDimSave').onclick = (e) => {
          e.stopPropagation()
          const name = document.getElementById('newDimName').value.trim()
          if (!name) return alert('请填写名称')
          let options
          if (type === 'binary') options = [document.getElementById('no0').value || '是', document.getElementById('no1').value || '否']
          if (type === 'ternary')
            options = [
              document.getElementById('no0').value || '好',
              document.getElementById('no1').value || '中',
              document.getElementById('no2').value || '差',
            ]
          const def = {
            id: S.uid('dim'),
            name,
            type,
            options,
            enabled: true,
            order: S.getDefs().length,
          }
          S.upsertDef(def)
          if (typeof onCreated === 'function') onCreated(def.id)
          else {
            c.dimOrder = [...c.dimOrder, def.id]
            c.fieldOrder = [...c.fieldOrder, def.id]
            sheet.style.display = 'none'
            refresh()
          }
        }
      }

      document.getElementById('addDimBtn').onclick = () => {
        const btn = document.getElementById('addDimBtn')
        pressThen(btn, () => openDimPicker())
      }
    }
  }

  function viewSearch() {
    const q = route.params.q || searchQ || ''
    const recent = S.getRecent()
    let results = []
    let searched = false
    if (q) {
      S.addRecent(q)
      results = S.search(q)
      searched = true
    }

    root().innerHTML = `
      <div class="view">
        <div class="search-header">
          <div class="search-top">
            <span class="back" id="back">‹</span>
            <div class="search-input-wrap">
              ${ICO_SEARCH}
              <input id="q" value="${escapeHtml(q)}" placeholder="搜索店名、菜品、笔记">
            </div>
          </div>
        </div>
        ${
          !searched
            ? `<div class="search-suggest"><div class="suggest-title">最近搜索</div>
               <div class="suggest-tags">${recent.map((t) => `<span class="chip" data-q="${escapeHtml(t)}">${escapeHtml(t)}</span>`).join('') || '<span style="color:var(--ink-muted);font-size:12px">暂无</span>'}</div></div>`
            : `<div class="search-result"><div class="result-count">找到 ${results.length} 条结果</div>
               ${results
                 .map((c, i) => {
                   let hint = '内容匹配'
                   const lower = q.toLowerCase()
                   if (c.name.toLowerCase().includes(lower)) hint = `${S.fmtShort(c.date)} · 店名匹配`
                   else if ((c.cuisines || []).some((t) => t.toLowerCase().includes(lower))) hint = `菜系：${c.cuisines.join('、')}`
                   else if ((c.dishes || []).some((d) => d.name.toLowerCase().includes(lower))) hint = `菜品：${c.dishes.map((d) => d.name).join('、')}`
                   else if ((c.note || '').toLowerCase().includes(lower)) hint = `"…${c.note.slice(0, 28)}…"`
                   const showPhoto = c.photos?.[0] || i === 0
                   const thumb = c.photos?.[0]
                     ? `<img src="${c.photos[0]}" alt="">`
                     : `<img class="rp-dotown" src="${dotownSrc(c)}" alt="">`
                   return `<div class="result-card" data-id="${c.id}">
                     ${showPhoto ? `<div class="rp rp-lv-${escapeHtml(c.level || 'normal')}">${thumb}${badge(c.level, true)}</div>` : ''}
                     <div class="rb"><div class="rn">${highlight(c.name, q)}</div>
                     <div class="rh">${highlight(hint, q)}</div>
                     ${showPhoto ? `<div class="rd">${S.fmtShort(c.date)}</div>` : ''}</div></div>`
                 })
                 .join('') ||
                   `<div class="empty-hint"><img class="empty-dotown" src="${DOTOWN_BASE}${DOTOWN_EMPTY}" alt="" draggable="false">没有找到相关饭卡</div>`}
               </div>`
        }
      </div>`

    document.getElementById('back').onclick = () => go('home')
    const input = document.getElementById('q')
    input.focus()
    input.onkeydown = (e) => {
      if (e.key === 'Enter') {
        searchQ = input.value.trim()
        go('search', { q: searchQ })
      }
    }
    root().querySelectorAll('[data-q]').forEach((el) => {
      el.onclick = () => go('search', { q: el.dataset.q })
    })
    root().querySelectorAll('.result-card').forEach((el) => {
      el.onclick = () => go('detail', { id: el.dataset.id })
    })
  }

  function viewTemplate() {
    const defs = S.getDefs()
    const typeLabel = { text: '文本', binary: '二态', ternary: '三态', stars: '星级' }

    root().innerHTML = `
      <div class="view">
        <div class="tpl-header">
          <div class="detail-back" id="back">‹</div>
          <div class="tpl-title">维度模板</div>
          <div style="width:30px"></div>
        </div>
        <div class="tpl-body">
          <div class="tpl-intro">自定义评价维度：服务、排队、热量、出片……可增删改。</div>
          ${defs
            .map(
              (d, i) => `
            <div class="def-card frame">
              <div class="def-name">${escapeHtml(d.name)}</div>
              <div class="def-meta">
                <span class="type-tag">${typeLabel[d.type]}</span>
                <span class="en-tag ${d.enabled ? 'on' : ''}">${d.enabled ? '启用' : '停用'}</span>
              </div>
              <div class="def-actions">
                <span class="act" data-up="${i}">↑</span>
                <span class="act" data-down="${i}">↓</span>
                <span class="act" data-tog="${d.id}">${d.enabled ? '停' : '启'}</span>
                <span class="act" data-ed="${d.id}">改</span>
                <span class="act danger" data-del="${d.id}">删</span>
              </div>
            </div>`
            )
            .join('')}
          <button class="btn btn-primary" id="add" style="width:100%;justify-content:center;margin-top:8px">＋ 新增维度</button>
        </div>
        <div class="sheet-mask" id="sheet" style="display:none"></div>
      </div>`

    document.getElementById('back').onclick = () => go('home')

    const openEditor = (def) => {
      const draft = def
        ? { ...def, options: [...(def.options || [])] }
        : { id: S.uid('dim'), name: '', type: 'text', options: [], enabled: true, order: defs.length }
      const sheet = document.getElementById('sheet')
      sheet.style.display = 'flex'
      sheet.innerHTML = `
        <div class="sheet" onclick="event.stopPropagation()">
          <div class="sheet-head"><span>${def ? '编辑维度' : '新增维度'}</span><span style="cursor:pointer" id="sheetClose">✕</span></div>
          <div class="edit-section"><label class="input-label">名称 <span class="req">*</span></label>
            <input class="pinput" id="dName" value="${escapeHtml(draft.name)}"></div>
          <div class="edit-section"><label class="input-label">类型</label>
            <select class="pinput" id="dType">
              ${['text', 'binary', 'ternary', 'stars'].map((t) => `<option value="${t}" ${draft.type === t ? 'selected' : ''}>${typeLabel[t]}</option>`).join('')}
            </select></div>
          <div class="edit-section" id="opts"></div>
          <div class="edit-section" style="display:flex;justify-content:space-between;align-items:center">
            <span class="input-label" style="margin:0">启用</span>
            <span class="en-tag ${draft.enabled ? 'on' : ''}" id="dEn">${draft.enabled ? '开' : '关'}</span>
          </div>
          <div class="sheet-btns">
            <button class="btn btn-primary" id="dSave">保存</button>
            <button class="btn btn-ghost" id="dDel">删除</button>
          </div>
        </div>`

      const renderOpts = () => {
        const t = document.getElementById('dType').value
        const box = document.getElementById('opts')
        if (t === 'binary') {
          const o = draft.options.length ? draft.options : ['是', '否']
          box.innerHTML = `<label class="input-label">选项文案</label><div class="opt-row">
            <input class="pinput" id="o0" value="${escapeHtml(o[0] || '是')}"><input class="pinput" id="o1" value="${escapeHtml(o[1] || '否')}"></div>`
        } else if (t === 'ternary') {
          const o = draft.options.length ? draft.options : ['好', '中', '差']
          box.innerHTML = `<label class="input-label">选项文案</label><div class="opt-row">
            <input class="pinput" id="o0" value="${escapeHtml(o[0] || '好')}"><input class="pinput" id="o1" value="${escapeHtml(o[1] || '中')}"><input class="pinput" id="o2" value="${escapeHtml(o[2] || '差')}"></div>`
        } else box.innerHTML = ''
      }
      renderOpts()
      document.getElementById('dType').onchange = renderOpts
      document.getElementById('dEn').onclick = () => {
        draft.enabled = !draft.enabled
        const el = document.getElementById('dEn')
        el.textContent = draft.enabled ? '开' : '关'
        el.classList.toggle('on', draft.enabled)
      }
      document.getElementById('sheetClose').onclick = () => {
        sheet.style.display = 'none'
      }
      sheet.onclick = () => {
        sheet.style.display = 'none'
      }
      document.getElementById('dSave').onclick = () => {
        const name = document.getElementById('dName').value.trim()
        if (!name) return alert('请填写维度名')
        const type = document.getElementById('dType').value
        let options
        if (type === 'binary') options = [document.getElementById('o0').value || '是', document.getElementById('o1').value || '否']
        if (type === 'ternary')
          options = [
            document.getElementById('o0').value || '好',
            document.getElementById('o1').value || '中',
            document.getElementById('o2').value || '差',
          ]
        S.upsertDef({ ...draft, name, type, options, enabled: draft.enabled })
        viewTemplate()
      }
      document.getElementById('dDel').onclick = () => {
        if (def && confirm('将从所有饭卡清除该维度数据')) {
          S.deleteDef(draft.id)
          viewTemplate()
        } else sheet.style.display = 'none'
      }
    }

    document.getElementById('add').onclick = () => openEditor(null)
    root().querySelectorAll('[data-ed]').forEach((el) => {
      el.onclick = () => openEditor(defs.find((d) => d.id === el.dataset.ed))
    })
    root().querySelectorAll('[data-del]').forEach((el) => {
      el.onclick = () => {
        if (confirm('将从所有饭卡清除该维度数据')) {
          S.deleteDef(el.dataset.del)
          viewTemplate()
        }
      }
    })
    root().querySelectorAll('[data-tog]').forEach((el) => {
      el.onclick = () => {
        const list = S.getDefs()
        const d = list.find((x) => x.id === el.dataset.tog)
        d.enabled = !d.enabled
        S.saveDefs(list)
        viewTemplate()
      }
    })
    root().querySelectorAll('[data-up]').forEach((el) => {
      el.onclick = () => {
        const list = S.getDefs()
        const i = Number(el.dataset.up)
        if (i <= 0) return
        ;[list[i - 1], list[i]] = [list[i], list[i - 1]]
        S.saveDefs(list)
        viewTemplate()
      }
    })
    root().querySelectorAll('[data-down]').forEach((el) => {
      el.onclick = () => {
        const list = S.getDefs()
        const i = Number(el.dataset.down)
        if (i >= list.length - 1) return
        ;[list[i + 1], list[i]] = [list[i], list[i + 1]]
        S.saveDefs(list)
        viewTemplate()
      }
    })
  }

  function render() {
    const map = {
      splash: viewSplash,
      home: viewHome,
      detail: viewDetail,
      edit: viewEdit,
      search: viewSearch,
      template: viewTemplate,
    }
    ;(map[route.name] || viewHome)()
  }

  // clock
  function tick() {
    const el = document.getElementById('clock')
    if (!el) return
    const d = new Date()
    el.textContent = `${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`
  }

  document.addEventListener('DOMContentLoaded', () => {
    installGlobalPress()
    S.load()
    tick()
    setInterval(tick, 30000)
    go('splash')
  })
})()
