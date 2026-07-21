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

  function geoErrorMessage(err) {
    if (!err) return '定位失败，请稍后再试'
    if (err.code === 1) return '没有定位权限，请在浏览器设置里允许后重试'
    if (err.code === 2) return '暂时拿不到位置，请到开阔一点的地方再试'
    if (err.code === 3) return '定位超时了，请再试一次'
    return err.message || '定位失败，请稍后再试'
  }

  function cleanPlacePart(s) {
    return String(s || '')
      .trim()
      .replace(/\s+/g, '')
      .replace(/^(中国|中华人民共和国)/, '')
  }

  function shortenAreaName(s) {
    return cleanPlacePart(s).replace(/(街道|地区|社区)$/, '')
  }

  function joinPlaceParts(parts) {
    const uniq = []
    for (const raw of parts) {
      const p = cleanPlacePart(raw)
      if (!p) continue
      if (uniq.some((u) => u === p || u.includes(p) || p.includes(u))) continue
      uniq.push(p)
    }
    return uniq.slice(0, 3).join('·')
  }

  function formatNominatimLabel(data) {
    const a = data?.address || {}
    const district =
      a.city_district || a.district || a.county || a.city || a.town || a.village || ''
    const suburb = shortenAreaName(a.suburb || a.neighbourhood || a.quarter || a.city_block || '')
    const road = cleanPlacePart(a.road || a.pedestrian || a.footway || a.path || a.cycleway || '')
    const house = cleanPlacePart(a.house_number || '')
    const roadPart = road ? (house ? `${road}${/号$/.test(house) ? house : `${house}号`}` : road) : ''
    const poiName = cleanPlacePart(data?.name || '')
    const usePoi =
      poiName &&
      poiName !== road &&
      !['road', 'suburb', 'neighbourhood', 'city', 'town', 'village', 'state', 'country'].includes(
        data?.addresstype
      )
    return joinPlaceParts([district, suburb, usePoi ? poiName : roadPart || suburb])
  }

  function formatPhotonLabel(data) {
    const p = data?.features?.[0]?.properties || {}
    const district = p.district || p.city || p.county || ''
    const suburb = shortenAreaName(p.locality || p.neighbourhood || '')
    const road = cleanPlacePart(p.street || (p.type === 'street' ? p.name : '') || '')
    const house = cleanPlacePart(p.housenumber || '')
    const roadPart = road ? (house ? `${road}${/号$/.test(house) ? house : `${house}号`}` : road) : ''
    const poi = p.type && p.type !== 'street' && p.type !== 'district' && p.type !== 'city' ? cleanPlacePart(p.name) : ''
    return joinPlaceParts([district, suburb, poi || roadPart])
  }

  function formatBigDataLabel(data, lat, lon) {
    const admins = (data?.localityInfo?.administrative || [])
      .filter((a) => a?.name && typeof a.adminLevel === 'number')
      .sort((a, b) => a.adminLevel - b.adminLevel)
      .map((a) => cleanPlacePart(a.name))
      .filter((n) => n && n !== '中国' && n !== '中华人民共和国')
    const city = cleanPlacePart(data?.city || '')
    const locality = cleanPlacePart(data?.locality || '')
    const district = admins.find((n) => /[区县市]$/.test(n) && n !== city) || admins[admins.length - 2] || ''
    const area = locality || admins[admins.length - 1] || ''
    const label = joinPlaceParts([district || city, area])
    if (label) return label
    if (Number.isFinite(lat) && Number.isFinite(lon)) return `${lat.toFixed(5)}, ${lon.toFixed(5)}`
    return ''
  }

  function getDevicePosition() {
    return new Promise((resolve, reject) => {
      if (!navigator.geolocation) {
        reject(Object.assign(new Error('这台设备不支持定位'), { code: 0 }))
        return
      }
      if (!window.isSecureContext) {
        reject(Object.assign(new Error('定位需要在网页版（https）使用，本地文件打开时不可用'), { code: 0 }))
        return
      }
      navigator.geolocation.getCurrentPosition(resolve, reject, {
        enableHighAccuracy: true,
        timeout: 15000,
        maximumAge: 0,
      })
    })
  }

  async function fetchJson(url, opts = {}, timeoutMs = 10000) {
    const ctrl = new AbortController()
    const timer = setTimeout(() => ctrl.abort(), timeoutMs)
    try {
      const res = await fetch(url, { ...opts, signal: ctrl.signal })
      if (!res.ok) throw new Error(`HTTP ${res.status}`)
      return await res.json()
    } finally {
      clearTimeout(timer)
    }
  }

  async function resolveLocationLabel(lat, lon) {
    // 优先 Nominatim：国内常能解析到路名/街道
    try {
      const data = await fetchJson(
        `https://nominatim.openstreetmap.org/reverse?lat=${encodeURIComponent(lat)}&lon=${encodeURIComponent(lon)}&format=json&addressdetails=1&accept-language=zh-CN&zoom=18`,
        {
          headers: {
            Accept: 'application/json',
          },
        },
        12000
      )
      const label = formatNominatimLabel(data)
      if (label) return label
    } catch (_) {}

    // Photon：街道级备用
    try {
      const data = await fetchJson(
        `https://photon.komoot.io/reverse?lat=${encodeURIComponent(lat)}&lon=${encodeURIComponent(lon)}`,
        {},
        10000
      )
      const label = formatPhotonLabel(data)
      if (label) return label
    } catch (_) {}

    // BigDataCloud：区级兜底
    try {
      const data = await fetchJson(
        `https://api.bigdatacloud.net/data/reverse-geocode-client?latitude=${encodeURIComponent(lat)}&longitude=${encodeURIComponent(lon)}&localityLanguage=zh`,
        {},
        10000
      )
      const label = formatBigDataLabel(data, lat, lon)
      if (label) return label
    } catch (_) {}

    return `${lat.toFixed(5)}, ${lon.toFixed(5)}`
  }

  async function fillLocationFromGps(inputEl, btnEl) {
    if (!inputEl) return
    const prev = btnEl?.textContent
    if (btnEl) {
      btnEl.disabled = true
      btnEl.textContent = '…'
    }
    try {
      const pos = await getDevicePosition()
      const lat = pos.coords.latitude
      const lon = pos.coords.longitude
      const label = await resolveLocationLabel(lat, lon)
      if (label) {
        inputEl.value = label
        inputEl.dispatchEvent(new Event('input', { bubbles: true }))
      }
    } catch (err) {
      alert(geoErrorMessage(err))
    } finally {
      if (btnEl) {
        btnEl.disabled = false
        btnEl.textContent = prev || '定位'
      }
    }
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

  /* DOTOWN 粗ドット · 标签符号（本地素材，勿直链） */
  const DOTOWN_BASE = './assets/dotown/'
  const DOTOWN_DEFAULT = 'bento.png'
  const DOTOWN_EMPTY = 'bento.png'
  const DOTOWN_GROUPS = [
    { id: 'food', title: '食物' },
    { id: 'weather', title: '天气' },
    { id: 'friends', title: '小伙伴' },
  ]
  /** 封面图标池：食物 + 天气/小动物（手选，自动匹配仍主要走食物） */
  const DOTOWN_PACK = [
    { file: 'bento.png', label: '便当', group: 'food' },
    { file: 'ramen.png', label: '拉面', group: 'food' },
    { file: 'yakisoba.png', label: '炒面', group: 'food' },
    { file: 'spaghetti.png', label: '意面', group: 'food' },
    { file: 'dumpling.png', label: '团子', group: 'food' },
    { file: 'bao.png', label: '包子', group: 'food' },
    { file: 'sushi.png', label: '寿司', group: 'food' },
    { file: 'onigiri.png', label: '饭团', group: 'food' },
    { file: 'rice.png', label: '白饭', group: 'food' },
    { file: 'stew.png', label: '锅物', group: 'food' },
    { file: 'curry.png', label: '咖喱', group: 'food' },
    { file: 'chicken.png', label: '炸鸡', group: 'food' },
    { file: 'steak.png', label: '肉排', group: 'food' },
    { file: 'shrimp.png', label: '炸虾', group: 'food' },
    { file: 'hamburger.png', label: '汉堡', group: 'food' },
    { file: 'pizza.png', label: '披萨', group: 'food' },
    { file: 'fries.png', label: '薯条', group: 'food' },
    { file: 'sandwich.png', label: '三明治', group: 'food' },
    { file: 'croissant.png', label: '可颂', group: 'food' },
    { file: 'egg.png', label: '蛋', group: 'food' },
    { file: 'coffee.png', label: '咖啡', group: 'food' },
    { file: 'beer.png', label: '啤酒', group: 'food' },
    { file: 'softserve.png', label: '软冰', group: 'food' },
    { file: 'pudding.png', label: '布丁', group: 'food' },
    { file: 'donut.png', label: '甜甜圈', group: 'food' },
    { file: 'sun.png', label: '太阳', group: 'weather' },
    { file: 'moon.png', label: '月亮', group: 'weather' },
    { file: 'cloud.png', label: '云', group: 'weather' },
    { file: 'rain.png', label: '雨', group: 'weather' },
    { file: 'snow.png', label: '雪', group: 'weather' },
    { file: 'rainbow.png', label: '彩虹', group: 'weather' },
    { file: 'thunder.png', label: '闪电', group: 'weather' },
    { file: 'cat.png', label: '猫', group: 'friends' },
    { file: 'dog.png', label: '狗', group: 'friends' },
    { file: 'chick.png', label: '小鸡', group: 'friends' },
    { file: 'rabbit.png', label: '兔子', group: 'friends' },
    { file: 'fish.png', label: '金鱼', group: 'friends' },
    { file: 'penguin.png', label: '企鹅', group: 'friends' },
    { file: 'pig.png', label: '猪', group: 'friends' },
  ]
  /** 默认标签 → 图；分越高越优先（多标签时取最高分） */
  const DOTOWN_CUISINE = {
    火锅: { file: 'stew.png', score: 90 },
    烧烤: { file: 'chicken.png', score: 85 },
    川菜: { file: 'stew.png', score: 55 },
    粤菜: { file: 'shrimp.png', score: 55 },
    日料: { file: 'sushi.png', score: 50 },
    韩餐: { file: 'steak.png', score: 55 },
    西餐: { file: 'pizza.png', score: 60 },
    面食: { file: 'ramen.png', score: 88 },
    小吃: { file: 'bao.png', score: 70 },
    咖啡: { file: 'coffee.png', score: 95 },
    甜品: { file: 'softserve.png', score: 90 },
    轻食: { file: 'sandwich.png', score: 80 },
  }
  const DOTOWN_KW = [
    { re: /拉面|ラーメン|ramen/i, file: 'ramen.png', score: 100 },
    { re: /炒面|yakisoba/i, file: 'yakisoba.png', score: 95 },
    { re: /意面|意大利面|pasta|spaghetti/i, file: 'spaghetti.png', score: 95 },
    { re: /面食|面馆|面条/, file: 'ramen.png', score: 88 },
    { re: /火锅|涮|麻辣锅/, file: 'stew.png', score: 95 },
    { re: /烧烤|烤串|烤肉/, file: 'chicken.png', score: 90 },
    { re: /炸鸡|鸡翅/, file: 'chicken.png', score: 92 },
    { re: /团子|団子|dango/i, file: 'dumpling.png', score: 95 },
    { re: /饺子|水饺|煎饺|锅贴/, file: 'bao.png', score: 95 },
    { re: /包子|馒头|bao/i, file: 'bao.png', score: 92 },
    { re: /寿司|刺身|sushi/i, file: 'sushi.png', score: 95 },
    { re: /饭团|onigiri/i, file: 'onigiri.png', score: 90 },
    { re: /咖啡|cafe|手冲|coffee/i, file: 'coffee.png', score: 100 },
    { re: /甜品|甜点|冰淇淋|软冰|蛋糕/, file: 'softserve.png', score: 90 },
    { re: /布丁|pudding/i, file: 'pudding.png', score: 92 },
    { re: /甜甜圈|donut|ドーナツ/i, file: 'donut.png', score: 92 },
    { re: /披萨|比萨|pizza/i, file: 'pizza.png', score: 95 },
    { re: /汉堡|hamburger|burger/i, file: 'hamburger.png', score: 95 },
    { re: /三明治|轻食|沙拉/, file: 'sandwich.png', score: 85 },
    { re: /可颂|牛角|croissant/i, file: 'croissant.png', score: 90 },
    { re: /咖喱|curry/i, file: 'curry.png', score: 90 },
    { re: /酒|酒吧|居酒|啤/, file: 'beer.png', score: 85 },
    { re: /早茶|粤菜|粤式|广式|海鲜/, file: 'shrimp.png', score: 70 },
    { re: /川菜|川味|湘|麻辣烫|冒菜|串串/, file: 'stew.png', score: 65 },
    { re: /韩餐|韩国|韩式/, file: 'steak.png', score: 70 },
    { re: /牛排|肉排/, file: 'steak.png', score: 88 },
    { re: /日料|和食/, file: 'sushi.png', score: 50 },
    { re: /小吃|点心|面点/, file: 'bao.png', score: 70 },
    { re: /早餐|brunch|水煮蛋/, file: 'egg.png', score: 75 },
    { re: /薯条|fries/i, file: 'fries.png', score: 85 },
    { re: /饭|盖浇/, file: 'rice.png', score: 60 },
  ]

  function resolveFromCuisines(cuisines) {
    const tags = Array.isArray(cuisines) ? cuisines : []
    let bestFile = ''
    let bestScore = -1
    const consider = (file, score) => {
      if (!file || score <= bestScore) return
      if (!DOTOWN_PACK.some((p) => p.file === file)) return
      bestScore = score
      bestFile = file
    }
    for (const t of tags) {
      const hit = DOTOWN_CUISINE[t]
      if (hit) consider(hit.file, hit.score)
    }
    for (const t of tags) {
      const s = String(t)
      for (const { re, file, score } of DOTOWN_KW) {
        if (re.test(s)) consider(file, score)
      }
    }
    return bestFile || DOTOWN_DEFAULT
  }

  function isValidPixelIcon(file) {
    return !!(file && DOTOWN_PACK.some((p) => p.file === file))
  }

  function sanitizePixelIcon(file) {
    return isValidPixelIcon(file) ? file : ''
  }

  /** 清理已下架图标引用，避免文案仍显示「自定义」 */
  function sanitizeAllPixelIcons() {
    const data = S.load()
    let changed = false
    ;(data.cards || []).forEach((c) => {
      if (c.pixelIcon && !isValidPixelIcon(c.pixelIcon)) {
        c.pixelIcon = ''
        changed = true
      }
    })
    if (changed) {
      S.save(data)
      return S.flush().catch((e) => console.warn(e))
    }
    return Promise.resolve()
  }

  function resolveDotownFile(cardOrCuisines) {
    if (cardOrCuisines && typeof cardOrCuisines === 'object' && !Array.isArray(cardOrCuisines)) {
      const icon = sanitizePixelIcon(cardOrCuisines.pixelIcon)
      if (icon) {
        if (cardOrCuisines.pixelIcon !== icon) cardOrCuisines.pixelIcon = icon
        return icon
      }
      if (cardOrCuisines.pixelIcon) cardOrCuisines.pixelIcon = ''
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
    const groupBlocks = DOTOWN_GROUPS.map((g) => {
      const items = DOTOWN_PACK.filter((p) => p.group === g.id)
      if (!items.length) return ''
      return `<div class="icon-picker-group">
        <div class="icon-picker-group-title">${escapeHtml(g.title)}</div>
        <div class="icon-picker-grid">
          ${items
            .map(
              (p) => `
            <button type="button" class="icon-pick-cell ${cur === p.file ? 'on' : ''}" data-icon="${p.file}">
              <img src="${DOTOWN_BASE}${p.file}" alt="" draggable="false">
              <span>${escapeHtml(p.label)}</span>
            </button>`
            )
            .join('')}
        </div>
      </div>`
    }).join('')
    mask.innerHTML = `
      <div class="sheet icon-picker-sheet" onclick="event.stopPropagation()">
        <div class="sheet-head"><span>选择像素图标</span><span class="sheet-close" id="iconPickerClose">✕</span></div>
        <p class="icon-picker-hint">用于无照片时的封面；也可恢复按标签自动匹配</p>
        <button type="button" class="icon-auto-row ${!cur ? 'on' : ''}" data-icon="">
          <img src="${DOTOWN_BASE}${autoFile}" alt="" class="icon-pick-cell-img" draggable="false">
          <span class="icon-auto-txt"><strong>按标签自动</strong><small>当前：${escapeHtml(
            DOTOWN_PACK.find((p) => p.file === autoFile)?.label || '便当'
          )}</small></span>
        </button>
        <div class="icon-picker-scroll">${groupBlocks}</div>
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

  /* 照片：原图 data URL 过大时手机解码会闪/空白，压缩后用 blob URL 展示 */
  const PHOTO_MAX_EDGE = 1280
  const PHOTO_TARGET_CHARS = 520000
  const photoBlobCache = new Map()

  function photoDisplaySrc(dataUrl) {
    if (!dataUrl || typeof dataUrl !== 'string') return ''
    if (!dataUrl.startsWith('data:')) return dataUrl
    const cached = photoBlobCache.get(dataUrl)
    if (cached) return cached
    try {
      const comma = dataUrl.indexOf(',')
      if (comma < 0) return dataUrl
      const header = dataUrl.slice(0, comma)
      const b64 = dataUrl.slice(comma + 1)
      const mime = (header.match(/data:([^;,]+)/) || [])[1] || 'image/jpeg'
      const bin = atob(b64)
      const bytes = new Uint8Array(bin.length)
      for (let i = 0; i < bin.length; i++) bytes[i] = bin.charCodeAt(i)
      const url = URL.createObjectURL(new Blob([bytes], { type: mime }))
      photoBlobCache.set(dataUrl, url)
      return url
    } catch (e) {
      console.warn(e)
      return dataUrl
    }
  }

  function photoImgHtml(dataUrl, cls = '') {
    const src = photoDisplaySrc(dataUrl)
    const clsAttr = cls ? ` class="${cls}"` : ''
    return `<img${clsAttr} src="${src}" alt="" loading="lazy" decoding="async" draggable="false">`
  }

  function loadImageFromSrc(src) {
    return new Promise((resolve, reject) => {
      const img = new Image()
      img.onload = () => resolve(img)
      img.onerror = () => reject(new Error('image decode failed'))
      img.src = src
    })
  }

  async function compressDataUrl(dataUrl) {
    if (!dataUrl || typeof dataUrl !== 'string' || !dataUrl.startsWith('data:')) return dataUrl
    const img = await loadImageFromSrc(dataUrl)
    const maxSide = Math.max(img.width || 1, img.height || 1)
    let scale = Math.min(1, PHOTO_MAX_EDGE / maxSide)
    let w = Math.max(1, Math.round((img.width || 1) * scale))
    let h = Math.max(1, Math.round((img.height || 1) * scale))
    const canvas = document.createElement('canvas')
    const ctx = canvas.getContext('2d')
    if (!ctx) return dataUrl

    const paint = () => {
      canvas.width = w
      canvas.height = h
      ctx.fillStyle = '#ffffff'
      ctx.fillRect(0, 0, w, h)
      ctx.drawImage(img, 0, 0, w, h)
    }

    paint()
    let quality = 0.76
    let out = canvas.toDataURL('image/jpeg', quality)
    while (out.length > PHOTO_TARGET_CHARS && quality > 0.48) {
      quality -= 0.08
      out = canvas.toDataURL('image/jpeg', quality)
    }
    while (out.length > PHOTO_TARGET_CHARS && Math.max(w, h) > 640) {
      w = Math.max(1, Math.round(w * 0.82))
      h = Math.max(1, Math.round(h * 0.82))
      paint()
      out = canvas.toDataURL('image/jpeg', Math.max(quality, 0.55))
    }
    if (dataUrl.length <= PHOTO_TARGET_CHARS && out.length >= dataUrl.length) return dataUrl
    return out
  }

  function readFileAsDataUrl(file) {
    return new Promise((resolve, reject) => {
      const reader = new FileReader()
      reader.onload = () => resolve(String(reader.result || ''))
      reader.onerror = () => reject(reader.error || new Error('read failed'))
      reader.readAsDataURL(file)
    })
  }

  async function readAndCompressImageFile(file) {
    const raw = await readFileAsDataUrl(file)
    try {
      return await compressDataUrl(raw)
    } catch (e) {
      console.warn(e)
      if (raw.length <= PHOTO_TARGET_CHARS * 1.2) return raw
      throw e
    }
  }

  async function shrinkOversizedPhotos() {
    const data = S.load()
    let changed = false
    for (const c of data.cards || []) {
      if (!Array.isArray(c.photos) || !c.photos.length) continue
      const next = []
      for (const p of c.photos) {
        if (typeof p === 'string' && p.startsWith('data:') && p.length > PHOTO_TARGET_CHARS) {
          try {
            const shrunk = await compressDataUrl(p)
            if (shrunk !== p) {
              const oldBlob = photoBlobCache.get(p)
              if (oldBlob) {
                URL.revokeObjectURL(oldBlob)
                photoBlobCache.delete(p)
              }
              changed = true
            }
            next.push(shrunk)
          } catch (e) {
            console.warn(e)
            next.push(p)
          }
        } else {
          next.push(p)
        }
      }
      c.photos = next
    }
    if (!changed) return
    S.save(data)
    await S.flush().catch((e) => console.warn(e))
    if (route.name === 'home') go('home')
    else if (route.name === 'detail' && route.params?.id) go('detail', { id: route.params.id })
  }

  const DIM_TYPE_LABEL = {
    text: '文字',
    binary: '二态',
    ternary: '三态',
    stars: '星级',
    choice: '选项',
    number: '数字',
    list: '列表',
  }

  function dimTypeTag(def) {
    if (!def) return ''
    if (S.isListBlock(def)) return '列表'
    if (S.isDishAttach(def)) return `列表列 · 菜品`
    if (def.attach === 'list') return `列表列`
    return DIM_TYPE_LABEL[def.type] || def.type
  }

  function isChoiceType(type) {
    return type === 'choice' || type === 'ternary'
  }

  function defaultChoiceOptions(type) {
    if (type === 'ternary') return ['好', '中', '差']
    return ['是', '否']
  }

  /** 维度类型配置区：choice 动态选项 / number 单位 */
  function renderDimTypeConfigHtml(type, draft = {}) {
    if (type === 'choice' || type === 'binary' || type === 'ternary') {
      const opts =
        Array.isArray(draft.options) && draft.options.length >= 2
          ? draft.options
          : defaultChoiceOptions(type === 'choice' ? 'choice' : type)
      const canRemove = opts.length > 2
      const rows = opts
        .map(
          (o, i) => `<div class="choice-opt-row">
            <input class="pinput" data-choice-opt value="${escapeHtml(o)}" placeholder="选项${i + 1}">
            <button type="button" class="btn btn-sm btn-ghost choice-opt-del" data-del-opt="${i}" ${canRemove ? '' : 'disabled'} aria-label="删除选项">×</button>
          </div>`
        )
        .join('')
      return `<label class="input-label">选项文案</label>
        <div class="choice-opt-list" id="choiceOptList">${rows}</div>
        <button type="button" class="btn btn-sm dish-add-btn" id="choiceOptAdd">＋ 添加选项</button>`
    }
    if (type === 'number') {
      return `<label class="input-label">单位</label>
        <input class="pinput" id="dimUnit" value="${escapeHtml(draft.unit || '')}" placeholder="如：分钟、元（可留空）">`
    }
    return ''
  }

  function readChoiceOptionsFromDom(rootEl) {
    const vals = [...(rootEl?.querySelectorAll('[data-choice-opt]') || [])].map((el) => el.value.trim() || '选项')
    while (vals.length < 2) vals.push(vals.length === 0 ? '是' : '否')
    return vals
  }

  function bindDimTypeConfig(box, getType, draftRef) {
    if (!box) return { refresh: () => {}, collect: () => ({}) }
    const paint = () => {
      const type = getType()
      box.innerHTML = renderDimTypeConfigHtml(type, draftRef)
      const addBtn = box.querySelector('#choiceOptAdd')
      if (addBtn) {
        addBtn.onclick = (e) => {
          e.stopPropagation()
          draftRef.options = readChoiceOptionsFromDom(box)
          draftRef.options.push(`选项${draftRef.options.length + 1}`)
          paint()
        }
      }
      box.querySelectorAll('[data-del-opt]').forEach((btn) => {
        btn.onclick = (e) => {
          e.stopPropagation()
          if (btn.disabled) return
          draftRef.options = readChoiceOptionsFromDom(box)
          if (draftRef.options.length <= 2) return
          draftRef.options.splice(Number(btn.dataset.delOpt), 1)
          paint()
        }
      })
    }
    paint()
    return {
      refresh: paint,
      collect: () => {
        const type = getType()
        if (type === 'choice' || type === 'binary' || type === 'ternary') {
          return { options: readChoiceOptionsFromDom(box), unit: undefined }
        }
        if (type === 'number') {
          const u = box.querySelector('#dimUnit')
          return { options: undefined, unit: (u?.value || '').trim() }
        }
        return { options: undefined, unit: undefined }
      },
    }
  }

  /** bind: { kind:'card' } | { kind:'extra', listKey, rowIndex } — extra key = listKey|rowIndex|dimId */
  function renderDimFieldsHtml(def, value, label, bind = { kind: 'card' }) {
    const lab = escapeHtml(label)
    const extraKey =
      bind.kind === 'extra' ? `${bind.listKey}|${bind.rowIndex}|${def.id}` : ''
    if (def.type === 'text') {
      const attr = bind.kind === 'extra' ? `data-x-text="${extraKey}"` : `data-dim="${def.id}"`
      return `<label class="input-label">${lab}</label>
        <input class="pinput" ${attr} value="${escapeHtml(value ?? '')}" placeholder="填写${lab}…">`
    }
    if (def.type === 'number') {
      const unit = (def.unit || '').trim()
      const attr = bind.kind === 'extra' ? `data-x-num="${extraKey}"` : `data-dim-num="${def.id}"`
      const shown = value !== null && value !== undefined && value !== '' ? escapeHtml(String(value)) : ''
      return `<label class="input-label">${lab}</label>
        <div class="dim-num-row">
          <input class="pinput" ${attr} type="number" inputmode="decimal" value="${shown}" placeholder="0">
          ${unit ? `<span class="dim-unit">${escapeHtml(unit)}</span>` : ''}
        </div>`
    }
    if (def.type === 'stars') {
      const attr = bind.kind === 'extra' ? `data-x-stars="${extraKey}"` : `data-dim-stars="${def.id}"`
      return `<label class="input-label">${lab}</label>
        <div ${attr}>${starsHtml(value || 0, { showValue: true, brand: true })}</div>`
    }
    if (def.type === 'binary') {
      const opts = def.options || ['是', '否']
      const on0 = value === true || value === 1
      const attr = bind.kind === 'extra' ? `data-x-bin="${extraKey}"` : `data-dim-bin="${def.id}"`
      return `<label class="input-label">${lab}</label>
        <div class="toggle-row" ${attr}>
          <div class="toggle-opt ${on0 ? 'on' : ''}" data-v="1">${escapeHtml(opts[0])}</div>
          <div class="toggle-opt ${!on0 && value !== null && value !== undefined ? 'on' : ''}" data-v="0">${escapeHtml(opts[1])}</div>
        </div>`
    }
    if (isChoiceType(def.type)) {
      const opts = def.options || defaultChoiceOptions(def.type)
      const idx = typeof value === 'number' ? value : -1
      const attr = bind.kind === 'extra' ? `data-x-choice="${extraKey}"` : `data-dim-choice="${def.id}"`
      return `<label class="input-label">${lab}</label>
        <div class="toggle-row is-choice" ${attr}>
          ${opts.map((o, i) => `<div class="toggle-opt ${idx === i ? 'on' : ''}" data-v="${i}">${escapeHtml(o)}</div>`).join('')}
        </div>`
    }
    return ''
  }

  function parseExtraKey(raw) {
    const parts = String(raw || '').split('|')
    if (parts.length >= 3) {
      return { listKey: parts[0], rowIndex: Number(parts[1]), dimId: parts.slice(2).join('|') }
    }
    // legacy dishIndex|dimId
    return { listKey: 'dishes', rowIndex: Number(parts[0]), dimId: parts[1] }
  }

  function setListRowExtra(card, listKey, rowIndex, dimId, val) {
    if (listKey === 'dishes') {
      if (!card.dishes?.[rowIndex]) return
      const dish = card.dishes[rowIndex]
      dish.extras = { ...(dish.extras || {}), [dimId]: val }
      return
    }
    const block = card.listData?.[listKey]
    if (!block?.rows?.[rowIndex]) return
    const row = block.rows[rowIndex]
    row.extras = { ...(row.extras || {}), [dimId]: val }
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
      dishColOrder: c.dishColOrder || [],
      listData: c.listData || {},
      pixelIcon: c.pixelIcon || '',
    })
  }

  function arrangeSnapshot(c) {
    return JSON.stringify({
      fieldOrder: c.fieldOrder || [],
      dimOrder: c.dimOrder || [],
      dishColOrder: c.dishColOrder || [],
      listData: Object.fromEntries(
        Object.entries(c.listData || {}).map(([id, block]) => [id, { colOrder: block?.colOrder || [] }])
      ),
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

  function pressThen(el, fn, ms = 100) {
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

  /** 全站按下态：手机上 :active 不可靠，用 class + 最短按压时长 */
  function installGlobalPress() {
    if (window.__fankuPressBound) return
    window.__fankuPressBound = true
    /* iOS 需要页面上存在 touch 监听，:active 才较稳定 */
    document.addEventListener('touchstart', () => {}, { passive: true })

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
      '.mark-pick',
    ].join(',')

    const clearAt = new WeakMap()
    const holdMs = 140

    const armPress = (el) => {
      if (!el || el.closest('.pile-card')) return
      const old = clearAt.get(el)
      if (old) clearTimeout(old)
      el.classList.add('is-pressing')
    }
    const releasePress = (el) => {
      if (!el) return
      const old = clearAt.get(el)
      if (old) clearTimeout(old)
      clearAt.set(
        el,
        setTimeout(() => el.classList.remove('is-pressing'), holdMs)
      )
    }

    const onDown = (e) => {
      const el = e.target.closest(sel)
      if (!el || el.closest('.is-readonly') || el.closest('.pile-card')) return
      armPress(el)
    }
    const onUp = () => {
      document.querySelectorAll('.is-pressing').forEach((el) => {
        if (!el.classList.contains('pile-card')) releasePress(el)
      })
    }

    document.addEventListener('pointerdown', onDown, true)
    document.addEventListener('touchstart', onDown, { capture: true, passive: true })
    document.addEventListener('pointerup', onUp, true)
    document.addEventListener('pointercancel', onUp, true)
    document.addEventListener('touchend', onUp, true)
    document.addEventListener('touchcancel', onUp, true)
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
                  ? photoImgHtml(c.photos[0])
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
      reader.onload = async () => {
        const result = await S.importBackup(String(reader.result || ''))
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

  function detailDimValueHtml(def, value) {
    if (def.type === 'stars') {
      return starsHtml(value, { size: 15, readonly: true, showValue: true })
    }
    if (def.type === 'binary') {
      const opts = def.options || ['是', '否']
      const on0 = value === true || value === 1
      return `<div class="toggle-row is-readonly" aria-readonly="true">
        <div class="toggle-opt ${on0 ? 'on' : ''}">${escapeHtml(opts[0])}</div>
        <div class="toggle-opt ${!on0 ? 'on' : ''}">${escapeHtml(opts[1])}</div>
      </div>`
    }
    if (isChoiceType(def.type)) {
      const opts = def.options || defaultChoiceOptions(def.type)
      const idx = Number(value)
      return `<div class="toggle-row is-readonly is-choice" aria-readonly="true">
        ${opts
          .map((o, i) => `<div class="toggle-opt ${idx === i ? 'on' : ''}">${escapeHtml(o)}</div>`)
          .join('')}
      </div>`
    }
    const text = S.formatDim(def, value)
    return text ? `<span class="detail-capsule">${escapeHtml(text)}</span>` : ''
  }

  function viewDetail() {
    const card = S.ensureCardDims(S.getCard(route.params.id))
    if (!card) return go('home')
    const reeatMap = { yes: ['一定会复吃', 'reeat-yes'], maybe: ['可能会', 'reeat-maybe'], no: ['不会了', 'reeat-no'] }
    const [reeatLabel, reeatCls] = reeatMap[card.reeat] || reeatMap.maybe
    const defMap = Object.fromEntries(S.getDefs().map((d) => [d.id, d]))
    const systemDimIds = S.SYSTEM_CARD_DIM_IDS || ['dim_service', 'dim_environment']
    const orderedIds = (card.dimOrder || []).length
      ? card.dimOrder
      : S.getDefs().map((d) => d.id)
    const otherDefs = orderedIds
      .map((id) => defMap[id])
      .filter(
        (d) =>
          d &&
          d.enabled &&
          S.isCardAttach(d) &&
          S.hasVal(card.dims?.[d.id]) &&
          !systemDimIds.includes(d.id)
      )
    const cuisineHtml = (card.cuisines || []).length
      ? `<div class="info-row"><span class="info-label">标签</span><span class="info-val cuisine-chips">${(card.cuisines || [])
          .map(
            (t) =>
              `<span class="cuisine-chip">${dotownImg([t], 'cuisine-ico')}<span>${escapeHtml(t)}</span></span>`
          )
          .join('')}</span></div>`
      : ''

    const photos = (card.photos || []).length
      ? `<div class="photo-row">${card.photos.map((p) => `<div class="detail-photo">${photoImgHtml(p)}</div>`).join('')}</div>`
      : `<div class="detail-photo is-dotown is-pickable lv-cover-${escapeHtml(card.level || 'normal')}" id="iconCover" title="点击更换图标">${dotownImg(card, 'dotown-hero')}<span class="photo-ph">暂无实拍 · 点图标可更换</span></div>`

    const dishCols = S.getDishColDefs(card)
    const dishes = (card.dishes || []).filter((d) => (d.name || '').trim()).length
      ? `<div class="detail-section"><div class="ds-title">菜品</div>${card.dishes
          .filter((d) => (d.name || '').trim())
          .map((d) => {
            const extras = dishCols
              .filter((col) => S.hasVal(d.extras?.[col.id]))
              .map(
                (col) => `<div class="dish-detail-extra">
                  <span class="info-label">${escapeHtml(S.dimLabel(card, col))}</span>
                  <div class="dim-read-val">${detailDimValueHtml(col, d.extras[col.id])}</div>
                </div>`
              )
              .join('')
            return `<div class="dish-line">
              <div class="dish-line-main">
                <span class="dish-name">${escapeHtml(d.name)}</span>
                ${starsHtml(dishRating(d), { size: 13, readonly: true })}
              </div>
              ${extras ? `<div class="dish-detail-extras">${extras}</div>` : ''}
            </div>`
          })
          .join('')}</div>`
      : ''

    const listSections = (card.fieldOrder || [])
      .map((id) => {
        const d = defMap[id]
        if (!d || !S.isListBlock(d)) return ''
        const block = card.listData?.[id]
        const cols = S.getListColDefs(card, id)
        const rows = (block?.rows || []).filter((r) => (r.name || '').trim())
        if (!rows.length) return ''
        return `<div class="detail-section"><div class="ds-title">${escapeHtml(S.dimLabel(card, d))}</div>${rows
          .map((r) => {
            const extras = cols
              .filter((col) => S.hasVal(r.extras?.[col.id]))
              .map(
                (col) => `<div class="dish-detail-extra">
                  <span class="info-label">${escapeHtml(S.dimLabel(card, col))}</span>
                  <div class="dim-read-val">${detailDimValueHtml(col, r.extras[col.id])}</div>
                </div>`
              )
              .join('')
            return `<div class="dish-line">
              <div class="dish-line-main">
                <span class="dish-name">${escapeHtml(r.name)}</span>
              </div>
              ${extras ? `<div class="dish-detail-extras">${extras}</div>` : ''}
            </div>`
          })
          .join('')}</div>`
      })
      .join('')

    const ratingRows = []
    ratingRows.push(`<div class="dim-read-row">
      <span class="info-label">口味</span>
      <div class="dim-read-val">${starsHtml(card.taste, { size: 15, readonly: true, showValue: true })}</div>
    </div>`)
    systemDimIds.forEach((id) => {
      const d = defMap[id]
      if (!d || !d.enabled || !S.hasVal(card.dims?.[id])) return
      ratingRows.push(`<div class="dim-read-row">
        <span class="info-label">${escapeHtml(S.dimLabel(card, d))}</span>
        <div class="dim-read-val">${detailDimValueHtml(d, card.dims[id])}</div>
      </div>`)
    })
    otherDefs.forEach((d) => {
      ratingRows.push(`<div class="dim-read-row">
        <span class="info-label">${escapeHtml(S.dimLabel(card, d))}</span>
        <div class="dim-read-val">${detailDimValueHtml(d, card.dims[d.id])}</div>
      </div>`)
    })
    const ratingsHtml = `<div class="detail-section">
      <div class="ds-title">评价</div>
      <div class="detail-dims">${ratingRows.join('')}</div>
    </div>`

    const bgInfo =
      (card.location
        ? `<div class="info-row"><span class="info-label">位置</span><span class="info-val">${escapeHtml(card.location)}</span></div>`
        : '') +
      `<div class="info-row"><span class="info-label">日期</span><span class="info-val mono">${S.fmtDate(card.date)}</span></div>` +
      cuisineHtml

    root().innerHTML = `
      <div class="view">
        <div class="detail-topbar">
          <div class="detail-back" id="back">‹</div>
          <div class="detail-right">${badge(card.level)}<span class="detail-edit" id="edit">编辑</span></div>
        </div>
        <div class="detail-body">
          <div class="detail-hero lv-tint-${escapeHtml(card.level || 'normal')}">
            <div class="detail-name">${escapeHtml(card.name)}</div>
          </div>
          <div class="detail-info">${bgInfo}</div>
          ${ratingsHtml}
          <div class="detail-section"><div class="ds-title">照片</div>${photos}</div>
          ${dishes}
          ${listSections}
          ${card.note ? `<div class="detail-section"><div class="ds-title">手账</div><div class="note-box">${escapeHtml(card.note)}</div></div>` : ''}
          <div class="detail-section detail-reeat-end">
            <div class="ds-title">复吃</div>
            <div class="reeat-end-val"><span class="reeat ${reeatCls}">${reeatLabel}</span></div>
          </div>
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
            S.flush()
              .then(() => go('home'))
              .catch((e) => alert(S.saveErrorMessage(e)))
          },
        })
      })
    }
    const iconCover = document.getElementById('iconCover')
    if (iconCover) {
      iconCover.onclick = () => {
        openDotownPicker({
          selected: sanitizePixelIcon(card.pixelIcon),
          cuisines: card.cuisines || [],
          onSelect: (file) => {
            card.pixelIcon = sanitizePixelIcon(file)
            S.upsertCard(card)
            S.flush()
              .then(() => go('detail', { id: card.id }))
              .catch((e) => alert(S.saveErrorMessage(e)))
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
    if (isChoiceType(def.type)) {
      const opts = def.options || defaultChoiceOptions(def.type)
      return `<div class="dim-preview-ctrl toggle-row is-choice preview-off">
        ${opts.map((o, i) => `<div class="toggle-opt ${i === 0 ? 'on' : ''}">${escapeHtml(o)}</div>`).join('')}
      </div>`
    }
    if (def.type === 'number') {
      const unit = (def.unit || '').trim()
      return `<div class="dim-preview-ctrl"><div class="pinput dim-preview-input">0${unit ? ` ${escapeHtml(unit)}` : ''}</div></div>`
    }
    if (S.isListBlock(def)) {
      return `<div class="dim-preview-ctrl"><div class="pinput dim-preview-input">列表…</div></div>`
    }
    return `<div class="dim-preview-ctrl"><div class="pinput dim-preview-input">${escapeHtml(value || '填写…')}</div></div>`
  }

  const OPTIONAL_CORE = [
    { id: 'location', name: '位置' },
    { id: 'date', name: '日期' },
    { id: 'cuisine', name: '标签' },
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
          `<div class="photo-cell filled" data-rm-photo="${i}">${photoImgHtml(p)}<span class="rm">×</span></div>`
      )
      .join('')
    const photoAdd = (c.photos || []).length < 9 ? `<div class="photo-cell" data-add-photo>＋</div>` : ''

    if (!Array.isArray(c.dishes) || c.dishes.length === 0) {
      c.dishes = [{ name: '', rating: 5, extras: {} }]
    }
    const dishCols = S.getDishColDefs(c)
    const dishes = c.dishes
      .map((d, i) => {
        const extrasHtml = dishCols
          .map((col) => {
            const label = S.dimLabel(c, col)
            return `<div class="dish-extra-field">${renderDimFieldsHtml(col, d.extras?.[col.id], label, {
              kind: 'extra',
              listKey: 'dishes',
              rowIndex: i,
            })}</div>`
          })
          .join('')
        return `<div class="dish-edit-row" data-dish-row="${i}">
            <div class="dish-edit-main">
              <input class="pinput" data-dish-name="${i}" value="${escapeHtml(d.name || '')}" placeholder="菜名…">
              <span data-dish-stars="${i}">${starsHtml(dishRating(d), { size: 16 })}</span>
              <span class="dish-rm" data-rm-dish="${i}">✕</span>
            </div>
            ${extrasHtml ? `<div class="dish-extras">${extrasHtml}</div>` : ''}
          </div>`
      })
      .join('')

    const dishColsBar = arrange
      ? `<div class="dish-cols-bar">
          ${
            dishCols.length
              ? `<div class="dish-col-chips">${dishCols
                  .map(
                    (col) =>
                      `<span class="dish-col-chip">${escapeHtml(S.dimLabel(c, col))}<button type="button" class="chip-x" data-rm-dish-col="${col.id}" aria-label="删除列">×</button></span>`
                  )
                  .join('')}</div>`
              : ''
          }
          <button type="button" class="btn btn-sm dish-add-btn" id="dishColAdd">＋ 添加列</button>
        </div>`
      : ''

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

    const renderDimInner = (d) => renderDimFieldsHtml(d, c.dims?.[d.id], S.dimLabel(c, d), { kind: 'card' })

    const renderListBlockInner = (listDef) => {
      const listId = listDef.id
      const block = S.ensureListBlock(c, listId)
      const cols = S.getListColDefs(c, listId)
      const colsBar = arrange
        ? `<div class="dish-cols-bar">
            ${
              cols.length
                ? `<div class="dish-col-chips">${cols
                    .map(
                      (col) =>
                        `<span class="dish-col-chip">${escapeHtml(S.dimLabel(c, col))}<button type="button" class="chip-x" data-rm-list-col="${listId}|${col.id}" aria-label="删除列">×</button></span>`
                    )
                    .join('')}</div>`
                : ''
            }
            <button type="button" class="btn btn-sm dish-add-btn" data-list-col-add="${listId}">＋ 添加列</button>
          </div>`
        : ''
      const rows = (block.rows || [])
        .map((r, i) => {
          const extrasHtml = cols
            .map((col) => {
              const label = S.dimLabel(c, col)
              return `<div class="dish-extra-field">${renderDimFieldsHtml(col, r.extras?.[col.id], label, {
                kind: 'extra',
                listKey: listId,
                rowIndex: i,
              })}</div>`
            })
            .join('')
          return `<div class="dish-edit-row" data-list-row="${listId}|${i}">
            <div class="dish-edit-main">
              <input class="pinput" data-list-name="${listId}|${i}" value="${escapeHtml(r.name || '')}" placeholder="名称…">
              <span class="dish-rm" data-rm-list-row="${listId}|${i}">✕</span>
            </div>
            ${extrasHtml ? `<div class="dish-extras">${extrasHtml}</div>` : ''}
          </div>`
        })
        .join('')
      return `<div class="list-block" data-list-block="${listId}">
          <label class="input-label">${escapeHtml(S.dimLabel(c, listDef))}</label>
          ${colsBar}
          <div class="list-rows" data-list-rows="${listId}">${rows}</div>
          <button type="button" class="btn btn-sm dish-add-btn" data-list-row-add="${listId}">＋ 添加一行</button>
        </div>`
    }

    const renderCoreInner = (id) => {
      if (id === 'name') {
        return `<label class="input-label">店名 <span class="req">*</span></label>
          <input class="pinput" id="fName" value="${escapeHtml(c.name)}">`
      }
      if (id === 'location') {
        return `<label class="input-label">位置</label>
          <div class="loc-row">
            <input class="pinput" id="fLoc" value="${escapeHtml(c.location || '')}" placeholder="手动填写，或点定位">
            <button type="button" class="btn btn-sm" id="locBtn" title="获取当前位置">定位</button>
          </div>`
      }
      if (id === 'date') {
        return `<label class="input-label">日期 <span class="req">*</span></label>
          <input class="pinput mono" id="fDate" type="date" value="${c.date}">`
      }
      if (id === 'cuisine') {
        const iconMode = isValidPixelIcon(c.pixelIcon) ? '自定义' : '按标签自动'
        return `<label class="input-label">标签</label>
          <div id="tags">${tags}</div>
          <div class="tag-add"><input class="pinput" id="tagInput" placeholder="添加标签…"><button class="btn btn-sm" id="tagAdd">＋</button></div>
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
        return `<label class="input-label">口味 <span class="req">*</span></label>
          <div id="tasteStars">${starsHtml(c.taste, { showValue: true, brand: true })}</div>`
      }
      if (id === 'level') {
        return `<label class="input-label">推荐度 <span class="req">*</span></label>
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
          ${dishColsBar}
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
        if (S.isListBlock(d)) return wrapField(id, renderListBlockInner(d))
        if (!S.isCardAttach(d)) return ''
        return wrapField(id, renderDimInner(d))
      })
      .join('')

    root().innerHTML = `
      <div class="view ${arrange ? 'is-arrange' : ''}" id="editView">
        <div class="edit-header">
          <div class="eh-left"><span class="eh-close" id="close">✕</span><span class="eh-title">${isNew ? '新建饭卡' : '编辑饭卡'}</span></div>
          <div class="eh-right">
            <button type="button" class="btn btn-sm ${arrange ? 'btn-primary' : 'btn-ghost'}" id="arrangeBtn">${arrange ? '完成' : '自定义'}</button>
            ${arrange ? '' : '<button type="button" class="btn btn-sm btn-primary" id="save">保存</button>'}
          </div>
        </div>
        <div class="edit-body" id="editBody">
          <div id="fieldsList">${fieldsHtml}</div>
          ${arrange ? `<button type="button" class="btn btn-sm dish-add-btn" id="addDimBtn">＋ 添加组件</button>` : ''}
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
      root().querySelectorAll('[data-list-name]').forEach((el) => {
        const [listId, idx] = String(el.dataset.listName).split('|')
        const row = c.listData?.[listId]?.rows?.[Number(idx)]
        if (row) row.name = el.value
      })
      root().querySelectorAll('[data-dim]').forEach((el) => {
        c.dims = { ...c.dims, [el.dataset.dim]: el.value }
      })
      root().querySelectorAll('[data-dim-num]').forEach((el) => {
        const raw = el.value
        if (raw === '') {
          c.dims = { ...c.dims, [el.dataset.dimNum]: null }
          return
        }
        const n = Number(raw)
        c.dims = { ...c.dims, [el.dataset.dimNum]: Number.isFinite(n) ? n : null }
      })
      root().querySelectorAll('[data-x-text]').forEach((el) => {
        const { listKey, rowIndex, dimId } = parseExtraKey(el.dataset.xText)
        setListRowExtra(c, listKey, rowIndex, dimId, el.value)
      })
      root().querySelectorAll('[data-x-num]').forEach((el) => {
        const { listKey, rowIndex, dimId } = parseExtraKey(el.dataset.xNum)
        const raw = el.value
        if (raw === '') {
          setListRowExtra(c, listKey, rowIndex, dimId, null)
          return
        }
        const n = Number(raw)
        setListRowExtra(c, listKey, rowIndex, dimId, Number.isFinite(n) ? n : null)
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
            .map((d) => ({
              name: (d.name || '').trim(),
              rating: dishRating(d),
              extras: d.extras && typeof d.extras === 'object' ? d.extras : {},
            }))
            .filter((d) => d.name)
          Object.keys(c.listData || {}).forEach((lid) => {
            const block = c.listData[lid]
            if (!block) return
            block.rows = (block.rows || [])
              .map((r) => ({
                name: (r.name || '').trim(),
                extras: r.extras && typeof r.extras === 'object' ? r.extras : {},
              }))
              .filter((r) => r.name)
          })
          delete c._shownDims
          delete c._dishMark
          delete c._arrangeMode
          delete c._editSnapshot
          delete c._arrangeSnapshot
          S.upsertCard(c)
          S.flush()
            .then(() => {
              editState = null
              go('detail', { id: c.id })
            })
            .catch((e) => alert(S.saveErrorMessage(e)))
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
          if (asDefault) S.saveDefaultLayout(c.fieldOrder, c.dimOrder, c.dishColOrder, S.collectListColOrders(c))
          c._arrangeMode = false
          delete c._arrangeSnapshot
          refresh()
        }
        if (!changed) {
          finishArrange(false)
          return
        }
        openAppModal({
          title: '自定义完成',
          body: '这套字段写法可以留给以后的新饭卡。',
          checkLabel: '以后新建饭卡也用这套',
          confirmText: '收好',
          cancelText: '',
          onConfirm: (checked) => finishArrange(!!checked),
          onCancel: () => {},
        })
      })
    }

    /* 填写交互（自定义模式下也可正常填写） */
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
      const xStars = grp.closest('[data-x-stars]')?.dataset.xStars
      if (xStars != null) {
        const { listKey, rowIndex, dimId } = parseExtraKey(xStars)
        setListRowExtra(c, listKey, rowIndex, dimId, val)
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
      if (title) title.textContent = isValidPixelIcon(c.pixelIcon) ? '自定义' : '按标签自动'
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
            selected: sanitizePixelIcon(c.pixelIcon),
            cuisines: c.cuisines || [],
            onSelect: (file) => {
              c.pixelIcon = sanitizePixelIcon(file)
              paintIconPick()
            },
          })
        })
      }
    }
    const locBtn = document.getElementById('locBtn')
    if (locBtn) {
      locBtn.onclick = () => {
        pressThen(locBtn, () => fillLocationFromGps(document.getElementById('fLoc'), locBtn))
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
              `<div class="photo-cell filled" data-rm-photo="${i}">${photoImgHtml(p)}<span class="rm">×</span></div>`
          )
          .join('')
        const add = (c.photos || []).length < 9 ? `<div class="photo-cell" data-add-photo>＋</div>` : ''
        grid.innerHTML = `${filled}${add}`
        bindPhotoCells()
      }
      bindPhotoCells()
      filePick.onchange = async () => {
        const files = [...filePick.files].slice(0, 9 - (c.photos?.length || 0))
        filePick.value = ''
        if (!files.length) return
        for (const f of files) {
          try {
            const url = await readAndCompressImageFile(f)
            c.photos = c.photos || []
            if (c.photos.length < 9) c.photos.push(url)
          } catch (e) {
            console.warn(e)
            alert('这张照片读不了，试试换一张或先截图再传')
          }
        }
        paintPhotos()
      }
    }

    const dishAdd = document.getElementById('dishAdd')
    if (dishAdd) {
      dishAdd.onclick = (e) => {
        e.preventDefault()
        pressThen(dishAdd, () => {
          sync()
          c.dishes = c.dishes || []
          c.dishes.push({ name: '', rating: 5, extras: {} })
          refresh()
        })
      }
    }
    root().querySelectorAll('[data-rm-dish]').forEach((el) => {
      el.onclick = () => {
        sync()
        const idx = Number(el.dataset.rmDish)
        c.dishes.splice(idx, 1)
        if (!c.dishes.length) c.dishes = [{ name: '', rating: 5, extras: {} }]
        refresh()
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
    root().querySelectorAll('[data-dim-num]').forEach((el) => {
      el.oninput = () => {
        const raw = el.value
        if (raw === '') {
          c.dims = { ...c.dims, [el.dataset.dimNum]: null }
          return
        }
        const n = Number(raw)
        c.dims = { ...c.dims, [el.dataset.dimNum]: Number.isFinite(n) ? n : null }
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
    root().querySelectorAll('[data-dim-choice], [data-dim-ter]').forEach((row) => {
      row.querySelectorAll('.toggle-opt').forEach((el) => {
        el.onclick = () => {
          const id = row.dataset.dimChoice || row.dataset.dimTer
          c.dims = { ...c.dims, [id]: Number(el.dataset.v) }
          setToggleOn(row, el)
        }
      })
    })

    const bindExtraControls = (scope = root()) => {
      scope.querySelectorAll('[data-x-text]').forEach((el) => {
        el.oninput = () => {
          const { listKey, rowIndex, dimId } = parseExtraKey(el.dataset.xText)
          setListRowExtra(c, listKey, rowIndex, dimId, el.value)
        }
      })
      scope.querySelectorAll('[data-x-num]').forEach((el) => {
        el.oninput = () => {
          const { listKey, rowIndex, dimId } = parseExtraKey(el.dataset.xNum)
          const raw = el.value
          if (raw === '') {
            setListRowExtra(c, listKey, rowIndex, dimId, null)
            return
          }
          const n = Number(raw)
          setListRowExtra(c, listKey, rowIndex, dimId, Number.isFinite(n) ? n : null)
        }
      })
      scope.querySelectorAll('[data-x-bin]').forEach((row) => {
        row.querySelectorAll('.toggle-opt').forEach((el) => {
          el.onclick = () => {
            const { listKey, rowIndex, dimId } = parseExtraKey(row.dataset.xBin)
            setListRowExtra(c, listKey, rowIndex, dimId, el.dataset.v === '1')
            setToggleOn(row, el)
          }
        })
      })
      scope.querySelectorAll('[data-x-choice]').forEach((row) => {
        row.querySelectorAll('.toggle-opt').forEach((el) => {
          el.onclick = () => {
            const { listKey, rowIndex, dimId } = parseExtraKey(row.dataset.xChoice)
            setListRowExtra(c, listKey, rowIndex, dimId, Number(el.dataset.v))
            setToggleOn(row, el)
          }
        })
      })
    }
    bindExtraControls()

    root().querySelectorAll('[data-rm-dish-col]').forEach((btn) => {
      btn.onclick = (e) => {
        e.preventDefault()
        e.stopPropagation()
        const id = btn.dataset.rmDishCol
        c.dishColOrder = (c.dishColOrder || []).filter((x) => x !== id)
        refresh()
      }
    })
    root().querySelectorAll('[data-rm-list-col]').forEach((btn) => {
      btn.onclick = (e) => {
        e.preventDefault()
        e.stopPropagation()
        const [listId, colId] = String(btn.dataset.rmListCol).split('|')
        const block = c.listData?.[listId]
        if (block) block.colOrder = (block.colOrder || []).filter((x) => x !== colId)
        refresh()
      }
    })
    root().querySelectorAll('[data-list-name]').forEach((el) => {
      el.oninput = () => {
        const [listId, idx] = String(el.dataset.listName).split('|')
        const row = c.listData?.[listId]?.rows?.[Number(idx)]
        if (row) row.name = el.value
      }
    })
    root().querySelectorAll('[data-rm-list-row]').forEach((el) => {
      el.onclick = () => {
        sync()
        const [listId, idx] = String(el.dataset.rmListRow).split('|')
        const block = c.listData?.[listId]
        if (!block) return
        block.rows.splice(Number(idx), 1)
        if (!block.rows.length) block.rows = [S.emptyListRow()]
        refresh()
      }
    })
    root().querySelectorAll('[data-list-row-add]').forEach((btn) => {
      btn.onclick = () => {
        pressThen(btn, () => {
          sync()
          const listId = btn.dataset.listRowAdd
          const block = S.ensureListBlock(c, listId)
          block.rows.push(S.emptyListRow())
          refresh()
        })
      }
    })

    /* —— 自定义：长按排序 + 左滑删除 —— */
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

        /* 左滑删除：在内容区（不含把手）；触控 + 鼠标均可 */
        list.querySelectorAll('[data-field-row]').forEach((row) => {
          const content = row.querySelector('.field-swipe-content')
          const delBtn = row.querySelector('.field-swipe-del')
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
              content.style.transition = 'none'
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
            content.style.transition = ''
            if (mode === 'swipe') {
              const m = (content.style.transform.match(/-?\d+/) || [0])[0]
              if (Number(m) < -48) {
                content.style.transform = 'translateX(-76px)'
                row.classList.add('swiping')
              } else {
                resetSwipe(row)
              }
            }
            mode = null
          }

          const shouldIgnore = (target) =>
            target.closest('.field-drag-handle') ||
            target.closest('input, textarea, button, .star, .toggle-opt, .level-opt, .chip, .photo-cell, .chip-x')

          content.addEventListener(
            'touchstart',
            (e) => {
              if (shouldIgnore(e.target)) return
              onStart(e.touches[0].clientX, e.touches[0].clientY)
            },
            { passive: true }
          )
          content.addEventListener(
            'touchmove',
            (e) => {
              if (shouldIgnore(e.target)) return
              onMove(e.touches[0].clientX, e.touches[0].clientY, e)
            },
            { passive: false }
          )
          content.addEventListener('touchend', onEnd)
          content.addEventListener('touchcancel', onEnd)

          content.addEventListener('mousedown', (e) => {
            if (e.button !== 0) return
            if (shouldIgnore(e.target)) return
            onStart(e.clientX, e.clientY)
            const move = (ev) => onMove(ev.clientX, ev.clientY, ev)
            const up = () => {
              onEnd()
              window.removeEventListener('mousemove', move)
              window.removeEventListener('mouseup', up)
            }
            window.addEventListener('mousemove', move)
            window.addEventListener('mouseup', up)
          })

          if (delBtn && !locked) {
            delBtn.onclick = (e) => {
              e.preventDefault()
              e.stopPropagation()
              removeField(row.dataset.fieldId)
            }
          }
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
            c.dimOrder = next.filter((id) => {
              if (S.isCoreField(id)) return false
              const d = S.getDefs().find((x) => x.id === id)
              return d ? S.isCardAttach(d) : false
            })
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
          const coreRows = OPTIONAL_CORE.filter((item) => !checked.has(item.id))
            .map(
              (item) => `<div class="dim-picker-row" data-pick="${item.id}">
              <div class="dim-picker-main">
                <div class="input-label dim-picker-name">${escapeHtml(item.name)}</div>
                <div class="dim-picker-sub">基础字段</div>
              </div>
              <label class="pix-check" data-check="${item.id}">
                <span class="pix-check-box"></span>
              </label>
            </div>`
            )
            .join('')
          const defaultDimRows = (S.SYSTEM_CARD_DIM_IDS || [])
            .filter((id) => !checked.has(id))
            .map((id) => {
              const d = defs.find((x) => x.id === id)
              if (!d) return ''
              return `<div class="dim-picker-row" data-pick="${d.id}">
              <div class="dim-picker-main">
                <div class="input-label dim-picker-name">${escapeHtml(d.name)}</div>
                <div class="dim-picker-sub">默认组件</div>
              </div>
              <label class="pix-check" data-check="${d.id}">
                <span class="pix-check-box"></span>
              </label>
            </div>`
            })
            .join('')
          const dimRows = defs
            .filter((d) => {
              if (S.isSystemCardDim?.(d.id)) return false
              if (S.isListCol(d)) return false
              if (checked.has(d.id)) return false
              if (S.isListBlock(d)) return true
              return S.isCardAttach(d)
            })
            .map(
              (d) => `<div class="dim-picker-row" data-pick="${d.id}">
                <div class="dim-picker-main">
                  <div class="input-label dim-picker-name">${escapeHtml(d.name)}</div>
                  ${dimPreviewControl(d, c.dims?.[d.id])}
                </div>
                <button type="button" class="dim-picker-del" data-del-def="${d.id}" title="从组件库删除" aria-label="删除">×</button>
                <label class="pix-check" data-check="${d.id}">
                  <span class="pix-check-box"></span>
                </label>
              </div>`
            )
            .join('')

          sheet.style.display = 'flex'
          sheet.innerHTML = `
            <div class="sheet dim-picker-sheet" onclick="event.stopPropagation()">
              <div class="sheet-head">
                <span>添加组件</span>
                <span class="sheet-close" id="pickerClose">✕</span>
              </div>
              <div class="dim-picker-list">
                ${coreRows}${defaultDimRows}${dimRows}
                <div class="dim-picker-row dim-picker-custom" id="newListEntry">
                  <div class="dim-picker-main">
                    <div class="input-label dim-picker-name">新建列表</div>
                    <div class="dim-picker-sub">可重复填写的区块</div>
                  </div>
                  <span class="dim-picker-arrow">›</span>
                </div>
                <div class="dim-picker-row dim-picker-custom" id="customDimEntry">
                  <div class="dim-picker-main">
                    <div class="input-label dim-picker-name">自定义组件</div>
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
            c.dimOrder = next.filter((id) => {
              if (S.isCoreField(id)) return false
              const d = S.getDefs().find((x) => x.id === id)
              return d ? S.isCardAttach(d) : false
            })
            next.forEach((id) => {
              const d = S.getDefs().find((x) => x.id === id)
              if (d && S.isListBlock(d)) S.ensureListBlock(c, id)
            })
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
              if (e.target.closest('[data-del-def]')) return
              togglePick(row.dataset.pick)
            }
          })
          sheet.querySelectorAll('[data-del-def]').forEach((btn) => {
            btn.onclick = (e) => {
              e.preventDefault()
              e.stopPropagation()
              const id = btn.dataset.delDef
              const def = S.getDefs().find((d) => d.id === id)
              const name = def?.name || '该组件'
              openAppModal({
                title: '删除这个组件？',
                body: `「${name}」会从组件库移除，已写在饭卡上的相关内容也会清掉。`,
                confirmText: '删除',
                cancelText: '取消',
                confirmPrimary: false,
                onConfirm: () => {
                  S.deleteDef(id)
                  draft = draft.filter((x) => x !== id)
                  c.fieldOrder = (c.fieldOrder || []).filter((x) => x !== id)
                  c.dimOrder = (c.dimOrder || []).filter((x) => x !== id)
                  c.dishColOrder = (c.dishColOrder || []).filter((x) => x !== id)
                  renderPicker()
                },
              })
            }
          })
          document.getElementById('customDimEntry').onclick = (e) => {
            e.stopPropagation()
            openNewDimForm(sheet, {
              onBack: () => renderPicker(),
              onDismiss: unlockScroll,
              onCreated: (newId) => {
                if (!c.fieldOrder.includes(newId)) c.fieldOrder = [...c.fieldOrder, newId]
                if (!c.dimOrder.includes(newId)) c.dimOrder = [...c.dimOrder, newId]
                sheet.style.display = 'none'
                unlockScroll()
                refresh()
              },
            })
          }
          document.getElementById('newListEntry').onclick = (e) => {
            e.stopPropagation()
            openNewListForm(sheet, {
              onBack: () => renderPicker(),
              onDismiss: unlockScroll,
              onCreated: (newId) => {
                if (!c.fieldOrder.includes(newId)) c.fieldOrder = [...c.fieldOrder, newId]
                S.ensureListBlock(c, newId)
                sheet.style.display = 'none'
                unlockScroll()
                refresh()
              },
            })
          }
        }

        renderPicker()
      }

      const openNewListForm = (sheet, { onBack, onCreated, onDismiss } = {}) => {
        const dismissSheet = () => {
          sheet.style.display = 'none'
          if (typeof onDismiss === 'function') onDismiss()
          else document.getElementById('editView')?.classList.remove('scroll-locked')
        }
        sheet.innerHTML = `
          <div class="sheet dim-picker-sheet" onclick="event.stopPropagation()">
            <div class="sheet-head">
              <span>新建列表</span>
              <span class="sheet-close" id="newListClose">✕</span>
            </div>
            <div class="edit-section">
              <label class="input-label">名称 <span class="req">*</span></label>
              <input class="pinput" id="newListName" placeholder="如：同行人、推荐菜">
            </div>
            <div class="sheet-btns">
              <button type="button" class="btn btn-ghost" id="newListBack">返回</button>
              <button type="button" class="btn btn-primary" id="newListSave">确认</button>
            </div>
          </div>`
        document.getElementById('newListClose').onclick = (e) => {
          e.stopPropagation()
          dismissSheet()
        }
        document.getElementById('newListBack').onclick = (e) => {
          e.stopPropagation()
          if (typeof onBack === 'function') onBack()
          else openDimPicker()
        }
        document.getElementById('newListSave').onclick = (e) => {
          e.stopPropagation()
          const name = document.getElementById('newListName').value.trim()
          if (!name) return alert('请填写名称')
          const def = {
            id: S.uid('list'),
            name,
            type: 'list',
            attach: 'card',
            enabled: true,
            order: S.getDefs().length,
          }
          S.upsertDef(def)
          S.ensureListBlock(c, def.id)
          if (typeof onCreated === 'function') onCreated(def.id)
          else {
            c.fieldOrder = [...c.fieldOrder, def.id]
            dismissSheet()
            refresh()
          }
        }
      }

      const openNewDimForm = (sheet, { onBack, onCreated, onDismiss, attach = 'card', listId = null } = {}) => {
        const dismissSheet = () => {
          sheet.style.display = 'none'
          if (typeof onDismiss === 'function') onDismiss()
          else document.getElementById('editView')?.classList.remove('scroll-locked')
        }
        const draftRef = { options: ['是', '否'], unit: '' }
        const title =
          attach === 'dishes' ? '添加列表列' : attach === 'list' ? '添加列表列' : '自定义组件'
        sheet.innerHTML = `
          <div class="sheet dim-picker-sheet" onclick="event.stopPropagation()">
            <div class="sheet-head">
              <span>${title}</span>
              <span class="sheet-close" id="newDimClose">✕</span>
            </div>
            <div class="edit-section">
              <label class="input-label">名称 <span class="req">*</span></label>
              <input class="pinput" id="newDimName" placeholder="${attach === 'card' ? '如：排队、等待时间、氛围' : '如：价格、备注、份量'}">
            </div>
            <div class="edit-section">
              <label class="input-label">填写方式</label>
              <div class="type-pick-grid">
                <div class="type-pick on" data-type="stars"><span class="type-pick-ico">★</span>星级</div>
                <div class="type-pick" data-type="choice"><span class="type-pick-ico">☰</span>选项</div>
                <div class="type-pick" data-type="number"><span class="type-pick-ico">#</span>数字</div>
                <div class="type-pick" data-type="text"><span class="type-pick-ico">T</span>文字</div>
              </div>
            </div>
            <div class="edit-section" id="newDimOpts"></div>
            <div class="sheet-btns">
              <button type="button" class="btn btn-ghost" id="newDimBack">${attach === 'card' ? '返回' : '取消'}</button>
              <button type="button" class="btn btn-primary" id="newDimSave">确认</button>
            </div>
          </div>`
        let type = 'stars'
        const cfg = bindDimTypeConfig(document.getElementById('newDimOpts'), () => type, draftRef)
        sheet.querySelectorAll('.type-pick').forEach((el) => {
          el.onclick = () => {
            type = el.dataset.type
            sheet.querySelectorAll('.type-pick').forEach((x) => x.classList.toggle('on', x === el))
            if (type === 'choice' && (!draftRef.options || draftRef.options.length < 2)) {
              draftRef.options = ['是', '否']
            }
            cfg.refresh()
          }
        })
        document.getElementById('newDimClose').onclick = (e) => {
          e.stopPropagation()
          dismissSheet()
        }
        document.getElementById('newDimBack').onclick = (e) => {
          e.stopPropagation()
          if (typeof onBack === 'function') onBack()
          else if (attach === 'card') openDimPicker()
          else dismissSheet()
        }
        document.getElementById('newDimSave').onclick = (e) => {
          e.stopPropagation()
          const name = document.getElementById('newDimName').value.trim()
          if (!name) return alert('请填写名称')
          const collected = cfg.collect()
          if (type === 'choice' && (!collected.options || collected.options.length < 2)) {
            return alert('至少需要两个选项')
          }
          const def = {
            id: S.uid('dim'),
            name,
            type,
            options: type === 'choice' ? collected.options : undefined,
            unit: type === 'number' ? collected.unit || '' : undefined,
            attach: attach === 'list' ? 'list' : attach === 'dishes' ? 'dishes' : 'card',
            listId: attach === 'list' ? listId : undefined,
            enabled: true,
            order: S.getDefs().length,
          }
          S.upsertDef(def)
          if (attach === 'dishes') {
            c.dishColOrder = [...(c.dishColOrder || []), def.id]
            dismissSheet()
            refresh()
            return
          }
          if (attach === 'list' && listId) {
            const block = S.ensureListBlock(c, listId)
            block.colOrder = [...(block.colOrder || []), def.id]
            dismissSheet()
            refresh()
            return
          }
          if (typeof onCreated === 'function') onCreated(def.id)
          else {
            c.dimOrder = [...c.dimOrder, def.id]
            c.fieldOrder = [...c.fieldOrder, def.id]
            dismissSheet()
            refresh()
          }
        }
      }

      const openListColForm = (listKey) => {
        const view = document.getElementById('editView')
        c._editScroll = view?.scrollTop || 0
        if (view) {
          view.classList.add('scroll-locked')
          view.scrollTop = c._editScroll
        }
        const sheet = document.getElementById('dimSheet')
        sheet.style.display = 'flex'
        const unlockScroll = () => {
          if (view) {
            view.classList.remove('scroll-locked')
            view.scrollTop = c._editScroll || 0
          }
        }
        const attach = listKey === 'dishes' ? 'dishes' : 'list'
        openNewDimForm(sheet, {
          attach,
          listId: listKey === 'dishes' ? null : listKey,
          onDismiss: unlockScroll,
          onBack: () => {
            sheet.style.display = 'none'
            unlockScroll()
          },
        })
        const origClose = document.getElementById('newDimClose')?.onclick
        const wrapClose = (e) => {
          if (e) e.stopPropagation()
          sheet.style.display = 'none'
          unlockScroll()
        }
        if (origClose) {
          document.getElementById('newDimClose').onclick = wrapClose
        }
        sheet.onclick = wrapClose
        const back = document.getElementById('newDimBack')
        if (back) {
          back.onclick = (e) => {
            e.stopPropagation()
            wrapClose()
          }
        }
        const saveBtn = document.getElementById('newDimSave')
        if (saveBtn) {
          const prev = saveBtn.onclick
          saveBtn.onclick = (e) => {
            prev?.(e)
            unlockScroll()
          }
        }
      }

      document.getElementById('addDimBtn').onclick = () => {
        const btn = document.getElementById('addDimBtn')
        pressThen(btn, () => openDimPicker())
      }
      const dishColAdd = document.getElementById('dishColAdd')
      if (dishColAdd) {
        dishColAdd.onclick = () => pressThen(dishColAdd, () => openListColForm('dishes'))
      }
      root().querySelectorAll('[data-list-col-add]').forEach((btn) => {
        btn.onclick = () => pressThen(btn, () => openListColForm(btn.dataset.listColAdd))
      })
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
                   else if ((c.cuisines || []).some((t) => t.toLowerCase().includes(lower))) hint = `标签：${c.cuisines.join('、')}`
                   else if ((c.dishes || []).some((d) => d.name.toLowerCase().includes(lower))) hint = `菜品：${c.dishes.map((d) => d.name).join('、')}`
                   else if ((c.note || '').toLowerCase().includes(lower)) hint = `"…${c.note.slice(0, 28)}…"`
                   const showPhoto = c.photos?.[0] || i === 0
                   const thumb = c.photos?.[0]
                     ? photoImgHtml(c.photos[0])
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

    root().innerHTML = `
      <div class="view">
        <div class="tpl-header">
          <div class="detail-back" id="back">‹</div>
          <div class="tpl-title">维度模板</div>
          <div style="width:30px"></div>
        </div>
        <div class="tpl-body">
          <div class="tpl-intro">自定义评价组件：性价比、排队、出片……可增删改。服务与环境已在默认卡片中。</div>
          ${defs
            .map(
              (d, i) => `
            <div class="def-card frame">
              <div class="def-name">${escapeHtml(d.name)}${S.isSystemCardDim?.(d.id) ? ' <span class="type-tag">默认</span>' : ''}</div>
              <div class="def-meta">
                <span class="type-tag">${escapeHtml(dimTypeTag(d))}${d.type === 'number' && d.unit ? ` · ${escapeHtml(d.unit)}` : ''}</span>
                <span class="en-tag ${d.enabled ? 'on' : ''}">${d.enabled ? '启用' : '停用'}</span>
              </div>
              <div class="def-actions">
                <span class="act" data-up="${i}">↑</span>
                <span class="act" data-down="${i}">↓</span>
                <span class="act" data-tog="${d.id}">${d.enabled ? '停' : '启'}</span>
                <span class="act" data-ed="${d.id}">改</span>
                ${S.isSystemCardDim?.(d.id) ? '' : `<span class="act danger" data-del="${d.id}">删</span>`}
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
        ? { ...def, options: [...(def.options || [])], unit: def.unit || '' }
        : {
            id: S.uid('dim'),
            name: '',
            type: 'stars',
            options: ['是', '否'],
            unit: '',
            attach: 'card',
            enabled: true,
            order: defs.length,
          }
      const draftRef = {
        options: draft.options.length ? [...draft.options] : ['是', '否'],
        unit: draft.unit || '',
      }
      const typeChoices = S.isListBlock(draft)
        ? ['list']
        : ['stars', 'choice', 'number', 'text']
      if (!S.isListBlock(draft) && (draft.type === 'binary' || draft.type === 'ternary')) {
        typeChoices.push(draft.type)
      }
      const sheet = document.getElementById('sheet')
      sheet.style.display = 'flex'
      sheet.innerHTML = `
        <div class="sheet" onclick="event.stopPropagation()">
          <div class="sheet-head"><span>${def ? '编辑维度' : '新增维度'}</span><span style="cursor:pointer" id="sheetClose">✕</span></div>
          <div class="edit-section"><label class="input-label">名称 <span class="req">*</span></label>
            <input class="pinput" id="dName" value="${escapeHtml(draft.name)}"></div>
          <div class="edit-section"><label class="input-label">填写方式</label>
            <select class="pinput" id="dType" ${S.isListBlock(draft) || S.isListCol(draft) ? 'disabled' : ''}>
              ${typeChoices.map((t) => `<option value="${t}" ${draft.type === t ? 'selected' : ''}>${DIM_TYPE_LABEL[t] || t}</option>`).join('')}
            </select>
            ${S.isListCol(draft) ? `<div class="dim-picker-sub" style="margin-top:6px">列表列 · ${draft.attach === 'dishes' ? '菜品' : escapeHtml(draft.listId || '')}</div>` : ''}
            ${S.isListBlock(draft) ? `<div class="dim-picker-sub" style="margin-top:6px">列表区块</div>` : ''}
          </div>
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

      const cfg = S.isListBlock(draft)
        ? { refresh: () => {}, collect: () => ({}) }
        : bindDimTypeConfig(document.getElementById('opts'), () => document.getElementById('dType').value, draftRef)
      const typeEl = document.getElementById('dType')
      if (typeEl && !typeEl.disabled) {
        typeEl.onchange = () => {
          const t = typeEl.value
          if ((t === 'choice' || t === 'binary' || t === 'ternary') && draftRef.options.length < 2) {
            draftRef.options = defaultChoiceOptions(t)
          }
          cfg.refresh()
        }
      }
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
        if (S.isListBlock(draft)) {
          S.upsertDef({ ...draft, name, type: 'list', attach: 'card', enabled: draft.enabled })
          viewTemplate()
          return
        }
        const type = document.getElementById('dType').value
        const collected = cfg.collect()
        if ((type === 'choice' || type === 'binary' || type === 'ternary') && (!collected.options || collected.options.length < 2)) {
          return alert('至少需要两个选项')
        }
        S.upsertDef({
          ...draft,
          name,
          type,
          options: collected.options,
          unit: collected.unit,
          attach: draft.attach || 'card',
          listId: draft.listId,
          enabled: draft.enabled,
        })
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
    tick()
    setInterval(tick, 30000)
    const boot = () => {
      S.load()
      Promise.resolve(sanitizeAllPixelIcons())
        .catch((e) => console.warn(e))
        .finally(() => {
          go('splash')
          setTimeout(() => {
            shrinkOversizedPhotos().catch((e) => console.warn(e))
          }, 1800)
        })
    }
    if (S.ready) {
      S.ready()
        .then(boot)
        .catch((e) => {
          console.warn(e)
          boot()
        })
    } else {
      boot()
    }
  })
})()
