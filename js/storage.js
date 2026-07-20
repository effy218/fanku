/* 饭库 · localStorage 数据层 */
window.FankuStore = (() => {
  const KEY = 'fanku:v1'

  const LEVEL_META = {
    strong: { label: '强推', short: '★ 强推', color: '#E8A317', cls: 'lv-strong' },
    rec: { label: '推荐', short: '✓ 推荐', color: '#7A9B5A', cls: 'lv-rec' },
    normal: { label: '一般', short: '○ 一般', color: '#9B8B7A', cls: 'lv-normal' },
    avoid: { label: '避雷', short: '✕ 避雷', color: '#C25B4E', cls: 'lv-avoid' },
  }

  const PHOTO_BG = {
    strong: ['#EDD9B8', '#E0C99A'],
    rec: ['#E8EEDC', '#DCE6D0'],
    normal: ['#EFE9DF', '#E5DFD3'],
    avoid: ['#F3DDD9', '#E8CFC9'],
  }

  const uid = (p = 'id') =>
    `${p}_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 8)}`

  const defaultDefs = () => [
    { id: 'dim_service', name: '服务', type: 'stars', enabled: true, order: 0 },
    { id: 'dim_queue', name: '排队', type: 'ternary', options: ['很快', '一般', '很长'], enabled: true, order: 1 },
    { id: 'dim_calorie', name: '热量', type: 'text', enabled: true, order: 2 },
    { id: 'dim_health', name: '健康度', type: 'stars', enabled: true, order: 3 },
    { id: 'dim_photo_worthy', name: '是否出片', type: 'binary', options: ['出片', '不出片'], enabled: true, order: 4 },
  ]

  const seedCards = () => {
    const now = Date.now()
    return [
      {
        id: 'card_seed_1', name: '小津拉面', location: '朝阳区·三里屯', date: '2026-07-06',
        cuisines: ['日料', '面食'], taste: 5, level: 'strong', photos: [], reeat: 'yes',
        dims: { dim_service: 4.5, dim_queue: 1, dim_calorie: '约 850 kcal', dim_health: 3, dim_photo_worthy: true },
        note: '汤头浓白挂勺，面条偏细硬挺。叉烧入口即化，味玉流心惊喜。下雨天来一碗，治愈。',
        dishes: [
          { name: '豚骨拉面（替玉）', rating: 5 },
          { name: '味玉叉烧饭', rating: 4 },
          { name: '炸鸡块', rating: 1.5 },
        ],
        createdAt: now - 86400000 * 3, updatedAt: now - 86400000 * 3,
      },
      {
        id: 'card_seed_2', name: '巷子口咖啡', location: '东城区·南锣鼓巷', date: '2026-07-04',
        cuisines: ['咖啡', '轻食'], taste: 4, level: 'rec', photos: [], reeat: 'maybe',
        dims: { dim_service: 4, dim_photo_worthy: true },
        note: '澳白细腻，可颂外酥里软。适合一个人坐一下午。',
        createdAt: now - 86400000 * 5, updatedAt: now - 86400000 * 5,
      },
      {
        id: 'card_seed_3', name: '老王麻辣烫', location: '海淀区·五道口', date: '2026-06-28',
        cuisines: ['川菜', '小吃'], taste: 3.5, level: 'normal', photos: [], reeat: 'maybe',
        dims: { dim_queue: 2, dim_calorie: '偏高', dim_health: 2 },
        createdAt: now - 86400000 * 12, updatedAt: now - 86400000 * 12,
      },
      {
        id: 'card_seed_4', name: '某网红火锅', location: '朝阳区·国贸', date: '2026-06-20',
        cuisines: ['火锅'], taste: 2, level: 'avoid', photos: [], reeat: 'no',
        dims: { dim_service: 1.5, dim_queue: 2, dim_photo_worthy: false },
        note: '汤底寡淡，服务慢，性价比不行。',
        createdAt: now - 86400000 * 20, updatedAt: now - 86400000 * 20,
      },
      {
        id: 'card_seed_5', name: '和食厨房', location: '西城区·西单', date: '2026-07-01',
        cuisines: ['日料'], taste: 4.5, level: 'strong', photos: [], reeat: 'yes',
        dims: { dim_service: 5, dim_health: 4 },
        dishes: [{ name: '味噌拉面', rating: 5 }, { name: '叉烧饭', rating: 4 }],
        createdAt: now - 86400000 * 8, updatedAt: now - 86400000 * 8,
      },
      {
        id: 'card_seed_6', name: '楼下包子铺', location: '朝阳区·望京', date: '2026-07-05',
        cuisines: ['小吃'], taste: 4, level: 'rec', photos: [], reeat: 'yes',
        dims: {}, createdAt: now - 86400000 * 2, updatedAt: now - 86400000 * 2,
      },
    ]
  }

  const DEFAULT_CUISINE_TAGS = [
    '火锅', '烧烤', '川菜', '粤菜', '日料', '韩餐', '西餐', '面食', '小吃', '咖啡', '甜品', '轻食',
  ]
  const LEGACY_CUISINE_TAGS = [
    '日料', '拉面', '咖啡', '轻食', '川味', '麻辣烫', '火锅', '早餐', '面点',
  ]
  const CUISINE_REMAP = {
    拉面: '面食', 川味: '川菜', 麻辣烫: '小吃', 早餐: '小吃', 面点: '小吃',
  }

  function migrateCardCuisines(card) {
    if (!card || !Array.isArray(card.cuisines)) return card
    const next = []
    card.cuisines.forEach((t) => {
      const mapped = CUISINE_REMAP[t] || t
      if (mapped && !next.includes(mapped)) next.push(mapped)
    })
    card.cuisines = next
    return card
  }

  function migrateCuisineTags(tags) {
    const custom = (tags || []).filter(
      (t) => !LEGACY_CUISINE_TAGS.includes(t) && !DEFAULT_CUISINE_TAGS.includes(t)
    )
    return [...DEFAULT_CUISINE_TAGS, ...custom]
  }

  const seed = () => ({
    cards: seedCards(),
    dimensionDefs: defaultDefs(),
    recentSearches: ['火锅', '日料', '面食'],
    cuisineTags: [...DEFAULT_CUISINE_TAGS],
    cuisineTagsVersion: 2,
  })

  function load() {
    try {
      const raw = localStorage.getItem(KEY)
      if (raw) {
        const data = JSON.parse(raw)
        if (data && Array.isArray(data.cards)) {
          let changed = false
          if (data.cuisineTagsVersion !== 2) {
            data.cuisineTags = migrateCuisineTags(data.cuisineTags)
            data.cards = (data.cards || []).map((c) => {
              changed = true
              return migrateCardCuisines({ ...c })
            })
            data.cuisineTagsVersion = 2
            changed = true
          }
          const out = {
            cards: data.cards || [],
            dimensionDefs: data.dimensionDefs?.length ? data.dimensionDefs : defaultDefs(),
            recentSearches: data.recentSearches || [],
            cuisineTags: data.cuisineTags?.length ? data.cuisineTags : [...DEFAULT_CUISINE_TAGS],
            cuisineTagsVersion: data.cuisineTagsVersion || 2,
            defaultFieldOrder: Array.isArray(data.defaultFieldOrder) ? data.defaultFieldOrder : null,
            defaultDimOrder: Array.isArray(data.defaultDimOrder) ? data.defaultDimOrder : null,
          }
          if (changed) save(out)
          return out
        }
      }
    } catch (e) { console.warn(e) }
    const s = seed()
    save(s)
    return s
  }

  function save(data) {
    localStorage.setItem(KEY, JSON.stringify(data))
  }

  function getCards() { return load().cards }
  function getCard(id) { return load().cards.find((c) => c.id === id) }

  function upsertCard(card) {
    const data = load()
    const next = { ...card, updatedAt: Date.now() }
    const i = data.cards.findIndex((c) => c.id === next.id)
    if (i >= 0) data.cards[i] = next
    else data.cards.unshift(next)
    ;(next.cuisines || []).forEach((t) => {
      if (t && !data.cuisineTags.includes(t)) data.cuisineTags.unshift(t)
    })
    save(data)
    return next
  }

  function deleteCard(id) {
    const data = load()
    data.cards = data.cards.filter((c) => c.id !== id)
    save(data)
  }

  function getDefs() {
    return load().dimensionDefs.slice().sort((a, b) => a.order - b.order)
  }

  function saveDefs(defs) {
    const data = load()
    data.dimensionDefs = defs.map((d, i) => ({ ...d, order: i }))
    save(data)
  }

  function upsertDef(def) {
    const data = load()
    const i = data.dimensionDefs.findIndex((d) => d.id === def.id)
    if (i >= 0) data.dimensionDefs[i] = def
    else data.dimensionDefs.push({ ...def, order: data.dimensionDefs.length })
    data.dimensionDefs = data.dimensionDefs.sort((a, b) => a.order - b.order).map((d, i) => ({ ...d, order: i }))
    save(data)
  }

  function deleteDef(id) {
    const data = load()
    data.dimensionDefs = data.dimensionDefs.filter((d) => d.id !== id).map((d, i) => ({ ...d, order: i }))
    data.cards = data.cards.map((c) => {
      if (!(id in (c.dims || {}))) return c
      const dims = { ...c.dims }
      delete dims[id]
      return { ...c, dims }
    })
    save(data)
  }

  function addRecent(q) {
    const data = load()
    const t = q.trim()
    if (!t) return
    data.recentSearches = [t, ...data.recentSearches.filter((s) => s !== t)].slice(0, 12)
    save(data)
  }

  function search(q) {
    const key = q.trim().toLowerCase()
    if (!key) return []
    return getCards().filter((c) => {
      if (c.name.toLowerCase().includes(key)) return true
      if ((c.location || '').toLowerCase().includes(key)) return true
      if ((c.note || '').toLowerCase().includes(key)) return true
      if ((c.cuisines || []).some((t) => t.toLowerCase().includes(key))) return true
      if ((c.dishes || []).some((d) => d.name.toLowerCase().includes(key))) return true
      return Object.values(c.dims || {}).some((v) => typeof v === 'string' && v.toLowerCase().includes(key))
    })
  }

  function emptyCard() {
    const d = new Date()
    const date = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
    const data = load()
    const card = {
      id: uid('card'), name: '', location: '', date, cuisines: [], taste: 5, level: 'rec',
      photos: [], reeat: 'maybe', dims: {}, dimOrder: [], dimAliases: {},
      fieldOrder: null, note: '', dishes: [{ name: '', rating: 5 }],
      pixelIcon: '',
      createdAt: Date.now(), updatedAt: Date.now(),
    }
    if (Array.isArray(data.defaultDimOrder)) {
      card.dimOrder = [...data.defaultDimOrder]
    }
    if (Array.isArray(data.defaultFieldOrder) && data.defaultFieldOrder.length) {
      card.fieldOrder = [...data.defaultFieldOrder]
    }
    return card
  }

  function saveDefaultLayout(fieldOrder, dimOrder) {
    const data = load()
    data.defaultFieldOrder = Array.isArray(fieldOrder) ? [...fieldOrder] : null
    data.defaultDimOrder = Array.isArray(dimOrder) ? [...dimOrder] : null
    save(data)
  }

  const CORE_FIELD_IDS = ['name', 'location', 'date', 'cuisine', 'taste', 'level', 'reeat', 'photos', 'note', 'dishes']
  const LOCKED_FIELDS = ['name', 'taste', 'level', 'reeat']

  /** 规范化本卡维度顺序、字段顺序与别名（兼容旧数据） */
  function ensureCardDims(card) {
    if (!card) return card
    card.dims = card.dims || {}
    card.dimAliases = card.dimAliases || {}
    if (!Array.isArray(card.dimOrder)) {
      const defs = getDefs().filter((d) => d.enabled)
      const fromShown = card._shownDims || []
      const fromVals = Object.keys(card.dims).filter((id) => hasVal(card.dims[id]))
      const ids = new Set([...fromShown, ...fromVals])
      const order = []
      defs.forEach((d) => {
        if (ids.has(d.id)) order.push(d.id)
      })
      ids.forEach((id) => {
        if (!order.includes(id)) order.push(id)
      })
      card.dimOrder = order
    }
    if (!Array.isArray(card.fieldOrder)) {
      card.fieldOrder = [...CORE_FIELD_IDS, ...card.dimOrder]
    } else {
      LOCKED_FIELDS.forEach((id) => {
        if (!card.fieldOrder.includes(id)) card.fieldOrder.unshift(id)
      })
      card.dimOrder.forEach((id) => {
        if (!card.fieldOrder.includes(id)) card.fieldOrder.push(id)
      })
    }
    if (!Array.isArray(card.dishes) || card.dishes.length === 0) {
      card.dishes = [{ name: '', rating: 5 }]
    }
    return card
  }

  function isLockedField(id) {
    return LOCKED_FIELDS.includes(id)
  }

  function isCoreField(id) {
    return CORE_FIELD_IDS.includes(id)
  }

  function dimLabel(card, def) {
    if (!def) return ''
    return (card?.dimAliases && card.dimAliases[def.id]) || def.name
  }

  /** 将模板改名并可选同步到所有卡片的别名 */
  function renameDim(dimId, newName, { applyAll = false, cardId = null } = {}) {
    const name = (newName || '').trim()
    if (!name || !dimId) return
    const data = load()
    if (applyAll) {
      const def = data.dimensionDefs.find((d) => d.id === dimId)
      if (def) def.name = name
      data.cards = data.cards.map((c) => {
        const next = { ...c, dimAliases: { ...(c.dimAliases || {}) } }
        if (next.dimOrder?.includes(dimId) || hasVal(next.dims?.[dimId]) || next.dimAliases[dimId]) {
          next.dimAliases[dimId] = name
        }
        return next
      })
      save(data)
    } else if (cardId) {
      const i = data.cards.findIndex((c) => c.id === cardId)
      if (i >= 0) {
        data.cards[i] = {
          ...data.cards[i],
          dimAliases: { ...(data.cards[i].dimAliases || {}), [dimId]: name },
        }
        save(data)
      }
    }
  }

  function formatDim(def, value) {
    if (value === null || value === undefined || value === '') return ''
    if (def.type === 'stars') return Number(value).toFixed(1)
    if (def.type === 'binary') {
      const opts = def.options || ['是', '否']
      return value === true || value === 1 ? opts[0] : opts[1]
    }
    if (def.type === 'ternary') {
      const opts = def.options || ['好', '中', '差']
      return opts[Number(value)] ?? String(value)
    }
    return String(value)
  }

  function hasVal(v) {
    if (v === null || v === undefined) return false
    if (typeof v === 'string') return v.trim().length > 0
    if (typeof v === 'number') return !Number.isNaN(v)
    return true
  }

  function fmtDate(s) {
    if (!s) return ''
    return s.replace(/-/g, '.')
  }

  function fmtShort(s) {
    if (!s) return ''
    const p = s.split('-')
    return p.length === 3 ? `${p[1]}.${p[2]}` : s
  }

  function removeCuisineTag(tag) {
    const t = (tag || '').trim()
    if (!t) return
    const data = load()
    data.cuisineTags = (data.cuisineTags || []).filter((x) => x !== t)
    save(data)
  }

  function exportBackup() {
    const data = load()
    return {
      app: 'fanku',
      format: 1,
      exportedAt: new Date().toISOString(),
      data: {
        cards: data.cards || [],
        dimensionDefs: data.dimensionDefs || [],
        recentSearches: data.recentSearches || [],
        cuisineTags: data.cuisineTags || [],
        cuisineTagsVersion: data.cuisineTagsVersion || 2,
        defaultFieldOrder: data.defaultFieldOrder || null,
        defaultDimOrder: data.defaultDimOrder || null,
      },
    }
  }

  /** 用备份整份替换本机数据。成功返回 { ok: true }，失败返回 { ok: false, error } */
  function importBackup(raw) {
    try {
      const obj = typeof raw === 'string' ? JSON.parse(raw) : raw
      if (!obj || obj.app !== 'fanku') {
        return { ok: false, error: '不是饭库的备份文件' }
      }
      const payload = obj.data || obj
      if (!payload || !Array.isArray(payload.cards)) {
        return { ok: false, error: '备份内容不完整' }
      }
      const next = {
        cards: payload.cards || [],
        dimensionDefs: payload.dimensionDefs?.length ? payload.dimensionDefs : defaultDefs(),
        recentSearches: payload.recentSearches || [],
        cuisineTags: payload.cuisineTags?.length ? payload.cuisineTags : [...DEFAULT_CUISINE_TAGS],
        cuisineTagsVersion: payload.cuisineTagsVersion || 2,
        defaultFieldOrder: Array.isArray(payload.defaultFieldOrder) ? payload.defaultFieldOrder : null,
        defaultDimOrder: Array.isArray(payload.defaultDimOrder) ? payload.defaultDimOrder : null,
      }
      if (next.cuisineTagsVersion !== 2) {
        next.cuisineTags = migrateCuisineTags(next.cuisineTags)
        next.cards = next.cards.map((c) => migrateCardCuisines({ ...c }))
        next.cuisineTagsVersion = 2
      }
      save(next)
      return { ok: true, cardCount: next.cards.length }
    } catch (e) {
      console.warn(e)
      if (e && (e.name === 'QuotaExceededError' || e.code === 22)) {
        return { ok: false, error: '本机空间不够，备份可能太大' }
      }
      return { ok: false, error: '无法读取这份备份' }
    }
  }

  return {
    uid, LEVEL_META, PHOTO_BG, load, save, getCards, getCard, upsertCard, deleteCard,
    getDefs, saveDefs, upsertDef, deleteDef, addRecent, search, emptyCard,
    formatDim, hasVal, fmtDate, fmtShort, getRecent: () => load().recentSearches,
    getCuisineTags: () => load().cuisineTags, removeCuisineTag, defaultDefs,
    ensureCardDims, dimLabel, renameDim, isLockedField, isCoreField, CORE_FIELD_IDS, LOCKED_FIELDS,
    saveDefaultLayout, exportBackup, importBackup,
  }
})()
