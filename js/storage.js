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

  /** 默认卡片自带（非「添加组件」预设库） */
  const SYSTEM_CARD_DIM_DEFS = () => [
    { id: 'dim_service', name: '服务', type: 'stars', attach: 'card', enabled: true, order: 0 },
    { id: 'dim_environment', name: '环境', type: 'stars', attach: 'card', enabled: true, order: 1 },
  ]
  const SYSTEM_CARD_DIM_IDS = ['dim_service', 'dim_environment']
  const CORE_FIELD_IDS = ['name', 'location', 'date', 'cuisine', 'taste', 'level', 'reeat', 'photos', 'note', 'dishes']
  const LOCKED_FIELDS = ['name', 'taste', 'level', 'reeat']

  function builtInFieldOrder() {
    // 填写页：店名→位置→日期→标签→口味→服务→环境→推荐度→复吃→照片→菜品→手账
    return [
      'name',
      'location',
      'date',
      'cuisine',
      'taste',
      ...SYSTEM_CARD_DIM_IDS,
      'level',
      'reeat',
      'photos',
      'dishes',
      'note',
    ]
  }

  function injectSystemDimsIntoOrder(order) {
    if (!Array.isArray(order) || !order.length) return builtInFieldOrder()
    const next = [...order]
    SYSTEM_CARD_DIM_IDS.forEach((id) => {
      if (next.includes(id)) return
      const tasteAt = next.indexOf('taste')
      if (tasteAt >= 0) next.splice(tasteAt + 1, 0, id)
      else next.push(id)
    })
    return next
  }

  /** 组件库预设（可选添加） */
  const defaultDefs = () => [
    { id: 'dim_value', name: '性价比', type: 'stars', attach: 'card', enabled: true, order: 0 },
    { id: 'dim_queue', name: '排队', type: 'choice', options: ['很快', '一般', '很长'], attach: 'card', enabled: true, order: 1 },
    { id: 'dim_wait_min', name: '等待时间', type: 'number', unit: '分钟', attach: 'card', enabled: true, order: 2 },
    { id: 'dim_avg_price', name: '人均', type: 'number', unit: '元', attach: 'card', enabled: true, order: 3 },
    { id: 'dim_photo_worthy', name: '是否出片', type: 'binary', options: ['出片', '不出片'], attach: 'card', enabled: true, order: 4 },
  ]

  const PRESET_DIM_IDS = [
    'dim_value',
    'dim_queue',
    'dim_wait_min',
    'dim_avg_price',
    'dim_photo_worthy',
  ]
  const REMOVED_PRESET_DIM_IDS = ['dim_calorie', 'dim_health']

  function isSystemCardDim(id) {
    return SYSTEM_CARD_DIM_IDS.includes(id)
  }

  function ensureSystemCardDims(data) {
    if (!data) return false
    let changed = false
    const byId = Object.fromEntries((data.dimensionDefs || []).map((d) => [d.id, d]))
    SYSTEM_CARD_DIM_DEFS().forEach((def) => {
      if (!byId[def.id]) {
        byId[def.id] = { ...def }
        changed = true
      } else {
        const cur = byId[def.id]
        byId[def.id] = {
          ...cur,
          name: cur.name || def.name,
          type: 'stars',
          attach: 'card',
          enabled: cur.enabled !== false,
        }
      }
    })
    if (changed) {
      data.dimensionDefs = Object.values(byId)
        .sort((a, b) => {
          const ai = SYSTEM_CARD_DIM_IDS.indexOf(a.id)
          const bi = SYSTEM_CARD_DIM_IDS.indexOf(b.id)
          const ao =
            ai >= 0
              ? ai
              : 10 +
                (PRESET_DIM_IDS.indexOf(a.id) >= 0
                  ? PRESET_DIM_IDS.indexOf(a.id)
                  : 100 + (a.order || 0))
          const bo =
            bi >= 0
              ? bi
              : 10 +
                (PRESET_DIM_IDS.indexOf(b.id) >= 0
                  ? PRESET_DIM_IDS.indexOf(b.id)
                  : 100 + (b.order || 0))
          return ao - bo
        })
        .map((d, i) => ({ ...d, order: i }))
    }
    return changed
  }

  const seedCards = () => {
    const now = Date.now()
    return [
      {
        id: 'card_seed_1', name: '小津拉面', location: '朝阳区·三里屯', date: '2026-07-06',
        cuisines: ['日料', '面食'], taste: 5, level: 'strong', photos: [], reeat: 'yes',
        dims: {
          dim_service: 4.5,
          dim_environment: 4,
          dim_value: 4,
          dim_queue: 1,
          dim_wait_min: 15,
          dim_avg_price: 78,
          dim_photo_worthy: true,
        },
        note: '汤头浓白挂勺，面条偏细硬挺。叉烧入口即化，味玉流心惊喜。下雨天来一碗，治愈。',
        dishes: [
          { name: '豚骨拉面（替玉）', rating: 5, extras: {} },
          { name: '味玉叉烧饭', rating: 4, extras: {} },
          { name: '炸鸡块', rating: 1.5, extras: {} },
        ],
        createdAt: now - 86400000 * 3, updatedAt: now - 86400000 * 3,
      },
      {
        id: 'card_seed_2', name: '巷子口咖啡', location: '东城区·南锣鼓巷', date: '2026-07-04',
        cuisines: ['咖啡', '轻食'], taste: 4, level: 'rec', photos: [], reeat: 'maybe',
        dims: { dim_service: 4, dim_environment: 4.5, dim_avg_price: 42, dim_photo_worthy: true },
        note: '澳白细腻，可颂外酥里软。适合一个人坐一下午。',
        createdAt: now - 86400000 * 5, updatedAt: now - 86400000 * 5,
      },
      {
        id: 'card_seed_3', name: '老王麻辣烫', location: '海淀区·五道口', date: '2026-06-28',
        cuisines: ['川菜', '小吃'], taste: 3.5, level: 'normal', photos: [], reeat: 'maybe',
        dims: { dim_queue: 2, dim_wait_min: 25, dim_value: 4, dim_avg_price: 28 },
        createdAt: now - 86400000 * 12, updatedAt: now - 86400000 * 12,
      },
      {
        id: 'card_seed_4', name: '某网红火锅', location: '朝阳区·国贸', date: '2026-06-20',
        cuisines: ['火锅'], taste: 2, level: 'avoid', photos: [], reeat: 'no',
        dims: { dim_service: 1.5, dim_queue: 2, dim_value: 1.5, dim_avg_price: 168, dim_photo_worthy: false },
        note: '汤底寡淡，服务慢，性价比不行。',
        createdAt: now - 86400000 * 20, updatedAt: now - 86400000 * 20,
      },
      {
        id: 'card_seed_5', name: '和食厨房', location: '西城区·西单', date: '2026-07-01',
        cuisines: ['日料'], taste: 4.5, level: 'strong', photos: [], reeat: 'yes',
        dims: { dim_service: 5, dim_environment: 4.5, dim_value: 4 },
        dishes: [
          { name: '味噌拉面', rating: 5, extras: {} },
          { name: '叉烧饭', rating: 4, extras: {} },
        ],
        createdAt: now - 86400000 * 8, updatedAt: now - 86400000 * 8,
      },
      {
        id: 'card_seed_6', name: '楼下包子铺', location: '朝阳区·望京', date: '2026-07-05',
        cuisines: ['小吃'], taste: 4, level: 'rec', photos: [], reeat: 'yes',
        dims: { dim_avg_price: 12, dim_wait_min: 5 },
        createdAt: now - 86400000 * 2, updatedAt: now - 86400000 * 2,
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

  function stripDimFromCard(card, id) {
    if (!card) return card
    const next = { ...card }
    if (next.dims && id in next.dims) {
      const dims = { ...next.dims }
      delete dims[id]
      next.dims = dims
    }
    if (Array.isArray(next.dimOrder)) next.dimOrder = next.dimOrder.filter((x) => x !== id)
    if (Array.isArray(next.fieldOrder)) next.fieldOrder = next.fieldOrder.filter((x) => x !== id)
    if (next.dimAliases && id in next.dimAliases) {
      const dimAliases = { ...next.dimAliases }
      delete dimAliases[id]
      next.dimAliases = dimAliases
    }
    return next
  }

  /** 常用评价预设 v2：补性价比/等待/人均，撤热量/健康度 */
  function migratePresetDims(data) {
    if ((data.presetDimsVersion || 0) >= 2) return false
    const fresh = [...SYSTEM_CARD_DIM_DEFS(), ...defaultDefs()]
    const byId = Object.fromEntries((data.dimensionDefs || []).map((d) => [d.id, d]))
    fresh.forEach((def) => {
      if (!byId[def.id]) {
        byId[def.id] = { ...def }
      } else if (def.id === 'dim_queue') {
        // 排队升级为 choice，保留原有选项文案
        byId[def.id] = {
          ...byId[def.id],
          type: 'choice',
          options: byId[def.id].options?.length ? byId[def.id].options : def.options,
          attach: byId[def.id].attach || 'card',
        }
      } else if (PRESET_DIM_IDS.includes(def.id) || SYSTEM_CARD_DIM_IDS.includes(def.id)) {
        byId[def.id] = {
          ...byId[def.id],
          name: byId[def.id].name || def.name,
          type: def.type,
          options: def.options || byId[def.id].options,
          unit: def.unit || byId[def.id].unit,
          attach: byId[def.id].attach || 'card',
          enabled: byId[def.id].enabled !== false,
        }
      }
    })
    REMOVED_PRESET_DIM_IDS.forEach((id) => {
      delete byId[id]
    })
    const orderIds = [...SYSTEM_CARD_DIM_IDS, ...PRESET_DIM_IDS]
    data.dimensionDefs = Object.values(byId)
      .sort((a, b) => {
        const ai = orderIds.indexOf(a.id)
        const bi = orderIds.indexOf(b.id)
        const ao = ai >= 0 ? ai : 100 + (a.order || 0)
        const bo = bi >= 0 ? bi : 100 + (b.order || 0)
        return ao - bo
      })
      .map((d, i) => ({ ...d, order: i }))
    data.cards = (data.cards || []).map((c) => {
      let next = c
      REMOVED_PRESET_DIM_IDS.forEach((id) => {
        next = stripDimFromCard(next, id)
      })
      return next
    })
    if (Array.isArray(data.defaultDimOrder)) {
      data.defaultDimOrder = data.defaultDimOrder.filter((id) => !REMOVED_PRESET_DIM_IDS.includes(id))
    }
    if (Array.isArray(data.defaultFieldOrder)) {
      data.defaultFieldOrder = data.defaultFieldOrder.filter((id) => !REMOVED_PRESET_DIM_IDS.includes(id))
    }
    data.presetDimsVersion = 2
    return true
  }

  /** v3：服务/环境从预设库挪到默认卡片字段 */
  function migrateDefaultCardDims(data) {
    if ((data.presetDimsVersion || 0) >= 3) return false
    ensureSystemCardDims(data)
    if (!Array.isArray(data.defaultFieldOrder) || !data.defaultFieldOrder.length) {
      data.defaultFieldOrder = builtInFieldOrder()
    } else {
      data.defaultFieldOrder = injectSystemDimsIntoOrder(data.defaultFieldOrder)
    }
    data.presetDimsVersion = 3
    return true
  }

  const seed = () => ({
    cards: seedCards(),
    dimensionDefs: [...SYSTEM_CARD_DIM_DEFS(), ...defaultDefs()],
    recentSearches: ['火锅', '日料', '面食'],
    cuisineTags: [...DEFAULT_CUISINE_TAGS],
    cuisineTagsVersion: 2,
    presetDimsVersion: 3,
  })

  /* —— IndexedDB 持久化（容量远大于 localStorage）—— */
  const LS_KEY = KEY
  const IDB_NAME = 'fanku-db'
  const IDB_VERSION = 1
  const IDB_STORE = 'kv'
  const IDB_DATA_KEY = 'state'

  let cache = null
  let dbPromise = null
  let persistChain = Promise.resolve()
  let readyPromise = null

  function openDb() {
    if (dbPromise) return dbPromise
    dbPromise = new Promise((resolve, reject) => {
      const req = indexedDB.open(IDB_NAME, IDB_VERSION)
      req.onerror = () => reject(req.error || new Error('IndexedDB open failed'))
      req.onupgradeneeded = () => {
        const db = req.result
        if (!db.objectStoreNames.contains(IDB_STORE)) db.createObjectStore(IDB_STORE)
      }
      req.onsuccess = () => resolve(req.result)
    })
    return dbPromise
  }

  function idbGet() {
    return openDb().then(
      (db) =>
        new Promise((resolve, reject) => {
          const tx = db.transaction(IDB_STORE, 'readonly')
          const req = tx.objectStore(IDB_STORE).get(IDB_DATA_KEY)
          req.onsuccess = () => resolve(req.result ?? null)
          req.onerror = () => reject(req.error)
        })
    )
  }

  function idbSet(data) {
    return openDb().then(
      (db) =>
        new Promise((resolve, reject) => {
          const tx = db.transaction(IDB_STORE, 'readwrite')
          tx.oncomplete = () => resolve()
          tx.onerror = () => reject(tx.error || new Error('IndexedDB write failed'))
          tx.objectStore(IDB_STORE).put(data, IDB_DATA_KEY)
        })
    )
  }

  function readLegacyLocalStorage() {
    try {
      const raw = localStorage.getItem(LS_KEY)
      if (!raw) return null
      const data = JSON.parse(raw)
      if (data && Array.isArray(data.cards)) return data
    } catch (e) {
      console.warn(e)
    }
    return null
  }

  function clearLegacyLocalStorage() {
    try {
      localStorage.removeItem(LS_KEY)
    } catch (e) {
      /* ignore */
    }
  }

  function normalizeLoaded(data) {
    let changed = false
    if (!data || !Array.isArray(data.cards)) {
      return { data: seed(), changed: true }
    }
    if (data.cuisineTagsVersion !== 2) {
      data.cuisineTags = migrateCuisineTags(data.cuisineTags)
      data.cards = (data.cards || []).map((c) => migrateCardCuisines({ ...c }))
      data.cuisineTagsVersion = 2
      changed = true
    }
    if (migratePresetDims(data)) changed = true
    if (migrateDefaultCardDims(data)) changed = true
    if (ensureSystemCardDims(data)) changed = true
    const out = {
      cards: data.cards || [],
      dimensionDefs: data.dimensionDefs?.length
        ? data.dimensionDefs
        : [...SYSTEM_CARD_DIM_DEFS(), ...defaultDefs()],
      recentSearches: data.recentSearches || [],
      cuisineTags: data.cuisineTags?.length ? data.cuisineTags : [...DEFAULT_CUISINE_TAGS],
      cuisineTagsVersion: data.cuisineTagsVersion || 2,
      presetDimsVersion: data.presetDimsVersion || 3,
      defaultFieldOrder: Array.isArray(data.defaultFieldOrder) ? data.defaultFieldOrder : null,
      defaultDimOrder: Array.isArray(data.defaultDimOrder) ? data.defaultDimOrder : null,
      defaultDishColOrder: Array.isArray(data.defaultDishColOrder) ? data.defaultDishColOrder : null,
      defaultListColOrders:
        data.defaultListColOrders && typeof data.defaultListColOrders === 'object'
          ? data.defaultListColOrders
          : null,
    }
    return { data: out, changed }
  }

  function cloneState(data) {
    if (typeof structuredClone === 'function') {
      try {
        return structuredClone(data)
      } catch (e) {
        /* fall through */
      }
    }
    return JSON.parse(JSON.stringify(data))
  }

  function isQuotaError(e) {
    return !!(e && (e.name === 'QuotaExceededError' || e.code === 22 || e.code === 0x16))
  }

  function saveErrorMessage(e) {
    if (isQuotaError(e)) return '本机空间不够，删几张照片或导出备份后再试'
    return '保存失败，请再试一次'
  }

  /** 启动时调用：从 IndexedDB（或旧 localStorage）装入内存 */
  function ready() {
    if (readyPromise) return readyPromise
    readyPromise = (async () => {
      let raw = null
      try {
        raw = await idbGet()
      } catch (e) {
        console.warn('IndexedDB read failed, trying localStorage', e)
      }
      let fromLegacy = false
      if (!raw || !Array.isArray(raw.cards)) {
        const legacy = readLegacyLocalStorage()
        if (legacy) {
          raw = legacy
          fromLegacy = true
        }
      }
      const { data, changed } = normalizeLoaded(raw)
      cache = data
      if (changed || fromLegacy || !raw) {
        try {
          await idbSet(cloneState(cache))
          if (fromLegacy) clearLegacyLocalStorage()
        } catch (e) {
          console.warn('IndexedDB initial write failed', e)
          // 若 IDB 不可用，退回 localStorage 以尽量不丢数据
          try {
            localStorage.setItem(LS_KEY, JSON.stringify(cache))
          } catch (e2) {
            console.warn(e2)
          }
        }
      } else if (fromLegacy) {
        clearLegacyLocalStorage()
      }
      return cache
    })()
    return readyPromise
  }

  function load() {
    if (!cache) {
      // ready() 前的兜底，避免空引用；正常路径会先 await ready()
      const legacy = readLegacyLocalStorage()
      cache = normalizeLoaded(legacy).data
    }
    return cache
  }

  function save(data) {
    cache = data
    const snapshot = cloneState(data)
    persistChain = persistChain
      .catch(() => {})
      .then(async () => {
        try {
          await idbSet(snapshot)
          clearLegacyLocalStorage()
        } catch (e) {
          // IDB 失败时尝试写入 LS（小数据还能救）
          try {
            localStorage.setItem(LS_KEY, JSON.stringify(snapshot))
          } catch (e2) {
            const err = isQuotaError(e) || isQuotaError(e2) ? e || e2 : e
            throw err
          }
        }
      })
    return persistChain
  }

  /** 等待队列中的写入全部完成 */
  function flush() {
    return persistChain
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
    let attach = 'card'
    if (def.type === 'list') attach = 'card'
    else if (def.attach === 'dishes') attach = 'dishes'
    else if (def.attach === 'list') attach = 'list'
    const next = {
      ...def,
      attach,
      listId: attach === 'list' ? def.listId || '' : undefined,
    }
    if (next.type === 'list') delete next.listId
    const i = data.dimensionDefs.findIndex((d) => d.id === next.id)
    if (i >= 0) data.dimensionDefs[i] = next
    else data.dimensionDefs.push({ ...next, order: data.dimensionDefs.length })
    data.dimensionDefs = data.dimensionDefs.sort((a, b) => a.order - b.order).map((d, i) => ({ ...d, order: i }))
    save(data)
  }

  function deleteDef(id) {
    if (isSystemCardDim(id)) return
    const data = load()
    data.dimensionDefs = data.dimensionDefs
      .filter((d) => d.id !== id && !(d.attach === 'list' && d.listId === id))
      .map((d, i) => ({ ...d, order: i }))
    data.cards = data.cards.map((c) => {
      const dims = { ...(c.dims || {}) }
      delete dims[id]
      const dishColOrder = (c.dishColOrder || []).filter((x) => x !== id)
      const dishes = (c.dishes || []).map((d) => {
        if (!d?.extras || !(id in d.extras)) return d
        const extras = { ...d.extras }
        delete extras[id]
        return { ...d, extras }
      })
      const fieldOrder = (c.fieldOrder || []).filter((x) => x !== id)
      const dimOrder = (c.dimOrder || []).filter((x) => x !== id)
      const listData = { ...(c.listData || {}) }
      delete listData[id]
      Object.keys(listData).forEach((lid) => {
        const block = listData[lid]
        if (!block) return
        listData[lid] = {
          ...block,
          colOrder: (block.colOrder || []).filter((x) => x !== id),
          rows: (block.rows || []).map((r) => {
            if (!r?.extras || !(id in r.extras)) return r
            const extras = { ...r.extras }
            delete extras[id]
            return { ...r, extras }
          }),
        }
      })
      return { ...c, dims, dishColOrder, dishes, fieldOrder, dimOrder, listData }
    })
    if (Array.isArray(data.defaultDishColOrder)) {
      data.defaultDishColOrder = data.defaultDishColOrder.filter((x) => x !== id)
    }
    if (Array.isArray(data.defaultDimOrder)) {
      data.defaultDimOrder = data.defaultDimOrder.filter((x) => x !== id)
    }
    if (Array.isArray(data.defaultFieldOrder)) {
      data.defaultFieldOrder = data.defaultFieldOrder.filter((x) => x !== id)
    }
    if (data.defaultListColOrders && typeof data.defaultListColOrders === 'object') {
      delete data.defaultListColOrders[id]
      Object.keys(data.defaultListColOrders).forEach((lid) => {
        data.defaultListColOrders[lid] = (data.defaultListColOrders[lid] || []).filter((x) => x !== id)
      })
    }
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
      const lists = c.listData || {}
      if (
        Object.values(lists).some((block) =>
          (block.rows || []).some((r) => (r.name || '').toLowerCase().includes(key))
        )
      ) {
        return true
      }
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
      fieldOrder: null, dishColOrder: null, listData: {}, note: '',
      dishes: [{ name: '', rating: 5, extras: {} }],
      pixelIcon: '',
      createdAt: Date.now(), updatedAt: Date.now(),
    }
    if (Array.isArray(data.defaultDimOrder)) {
      card.dimOrder = [...data.defaultDimOrder]
    }
    if (Array.isArray(data.defaultFieldOrder) && data.defaultFieldOrder.length) {
      card.fieldOrder = [...data.defaultFieldOrder]
    } else {
      card.fieldOrder = builtInFieldOrder()
    }
    SYSTEM_CARD_DIM_IDS.forEach((id) => {
      if (!card.dimOrder.includes(id) && card.fieldOrder.includes(id)) {
        card.dimOrder.push(id)
      }
    })
    if (Array.isArray(data.defaultDishColOrder)) {
      card.dishColOrder = [...data.defaultDishColOrder]
    }
    return card
  }

  function saveDefaultLayout(fieldOrder, dimOrder, dishColOrder, listColOrders) {
    const data = load()
    data.defaultFieldOrder = Array.isArray(fieldOrder) ? [...fieldOrder] : null
    data.defaultDimOrder = Array.isArray(dimOrder) ? [...dimOrder] : null
    data.defaultDishColOrder = Array.isArray(dishColOrder) ? [...dishColOrder] : null
    data.defaultListColOrders =
      listColOrders && typeof listColOrders === 'object' ? { ...listColOrders } : null
    save(data)
  }

  function isListBlock(def) {
    return def && def.type === 'list'
  }

  function isListCol(def) {
    return def && (def.attach === 'dishes' || def.attach === 'list')
  }

  function isDishAttach(def) {
    return def && def.attach === 'dishes'
  }

  function isCardAttach(def) {
    return def && !isListCol(def) && !isListBlock(def)
  }

  function emptyListRow() {
    return { name: '', extras: {} }
  }

  function ensureListBlock(card, listId) {
    card.listData = card.listData || {}
    if (!card.listData[listId]) {
      const data = load()
      const cols =
        data.defaultListColOrders && Array.isArray(data.defaultListColOrders[listId])
          ? [...data.defaultListColOrders[listId]]
          : []
      card.listData[listId] = { rows: [emptyListRow()], colOrder: cols }
    } else {
      const block = card.listData[listId]
      if (!Array.isArray(block.colOrder)) block.colOrder = []
      if (!Array.isArray(block.rows) || block.rows.length === 0) {
        block.rows = [emptyListRow()]
      } else {
        block.rows = block.rows.map((r) => ({
          ...r,
          extras: r.extras && typeof r.extras === 'object' ? r.extras : {},
        }))
      }
    }
    return card.listData[listId]
  }

  /** 规范化本卡维度顺序、字段顺序与别名（兼容旧数据） */
  function ensureCardDims(card) {
    if (!card) return card
    card.dims = card.dims || {}
    card.dimAliases = card.dimAliases || {}
    card.listData = card.listData || {}
    const defs = getDefs()
    const defMap = Object.fromEntries(defs.map((d) => [d.id, d]))
    if (!Array.isArray(card.dimOrder)) {
      const enabled = defs.filter((d) => d.enabled && isCardAttach(d))
      const fromShown = card._shownDims || []
      const fromVals = Object.keys(card.dims).filter((id) => hasVal(card.dims[id]))
      const ids = new Set([...fromShown, ...fromVals])
      const order = []
      enabled.forEach((d) => {
        if (ids.has(d.id)) order.push(d.id)
      })
      ids.forEach((id) => {
        if (!order.includes(id) && isCardAttach(defMap[id])) order.push(id)
      })
      card.dimOrder = order
    } else {
      card.dimOrder = card.dimOrder.filter((id) => isCardAttach(defMap[id]) || !defMap[id])
    }
    if (!Array.isArray(card.fieldOrder)) {
      card.fieldOrder = builtInFieldOrder()
      SYSTEM_CARD_DIM_IDS.forEach((id) => {
        if (!card.dimOrder.includes(id)) card.dimOrder.push(id)
      })
      card.dimOrder.forEach((id) => {
        if (!card.fieldOrder.includes(id) && isCardAttach(defMap[id])) card.fieldOrder.push(id)
      })
    } else {
      LOCKED_FIELDS.forEach((id) => {
        if (!card.fieldOrder.includes(id)) card.fieldOrder.unshift(id)
      })
      card.dimOrder.forEach((id) => {
        if (!card.fieldOrder.includes(id)) card.fieldOrder.push(id)
      })
      card.fieldOrder = card.fieldOrder.filter((id) => {
        if (isCoreField(id)) return true
        const d = defMap[id]
        if (!d) return true
        if (isListBlock(d)) return true
        return isCardAttach(d)
      })
    }
    // ensure list blocks present in fieldOrder have data
    card.fieldOrder.forEach((id) => {
      if (isListBlock(defMap[id])) ensureListBlock(card, id)
    })
    Object.keys(card.listData).forEach((lid) => {
      if (!isListBlock(defMap[lid])) {
        // keep orphan data but trim invalid cols
        const block = card.listData[lid]
        if (block) {
          block.colOrder = (block.colOrder || []).filter((cid) => {
            const d = defMap[cid]
            return d && d.attach === 'list' && d.listId === lid
          })
        }
        return
      }
      ensureListBlock(card, lid)
      const block = card.listData[lid]
      block.colOrder = (block.colOrder || []).filter((cid) => {
        const d = defMap[cid]
        return d && d.attach === 'list' && d.listId === lid
      })
    })
    if (!Array.isArray(card.dishColOrder)) {
      card.dishColOrder = []
    } else {
      card.dishColOrder = card.dishColOrder.filter((id) => {
        const d = defMap[id]
        return d && isDishAttach(d)
      })
    }
    if (!Array.isArray(card.dishes) || card.dishes.length === 0) {
      card.dishes = [{ name: '', rating: 5, extras: {} }]
    } else {
      card.dishes = card.dishes.map((d) => ({
        ...d,
        extras: d.extras && typeof d.extras === 'object' ? d.extras : {},
      }))
    }
    return card
  }

  function getDishColDefs(card) {
    const defMap = Object.fromEntries(getDefs().map((d) => [d.id, d]))
    return (card?.dishColOrder || [])
      .map((id) => defMap[id])
      .filter((d) => d && d.enabled && isDishAttach(d))
  }

  function getListColDefs(card, listId) {
    if (listId === 'dishes') return getDishColDefs(card)
    const defMap = Object.fromEntries(getDefs().map((d) => [d.id, d]))
    const block = card?.listData?.[listId]
    return (block?.colOrder || [])
      .map((id) => defMap[id])
      .filter((d) => d && d.enabled && d.attach === 'list' && d.listId === listId)
  }

  function collectListColOrders(card) {
    const out = {}
    Object.keys(card?.listData || {}).forEach((lid) => {
      out[lid] = [...(card.listData[lid].colOrder || [])]
    })
    return out
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
    if (def.type === 'ternary' || def.type === 'choice') {
      const opts = def.options || (def.type === 'choice' ? [] : ['好', '中', '差'])
      return opts[Number(value)] ?? String(value)
    }
    if (def.type === 'number') {
      const n = Number(value)
      if (Number.isNaN(n)) return String(value)
      const unit = (def.unit || '').trim()
      return unit ? `${n}${unit}` : String(n)
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
        presetDimsVersion: data.presetDimsVersion || 3,
        defaultFieldOrder: data.defaultFieldOrder || null,
        defaultDimOrder: data.defaultDimOrder || null,
        defaultDishColOrder: data.defaultDishColOrder || null,
        defaultListColOrders: data.defaultListColOrders || null,
      },
    }
  }

  /** 用备份整份替换本机数据。成功返回 { ok: true }，失败返回 { ok: false, error } */
  async function importBackup(raw) {
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
        dimensionDefs: payload.dimensionDefs?.length
          ? payload.dimensionDefs
          : [...SYSTEM_CARD_DIM_DEFS(), ...defaultDefs()],
        recentSearches: payload.recentSearches || [],
        cuisineTags: payload.cuisineTags?.length ? payload.cuisineTags : [...DEFAULT_CUISINE_TAGS],
        cuisineTagsVersion: payload.cuisineTagsVersion || 2,
        presetDimsVersion: payload.presetDimsVersion || 0,
        defaultFieldOrder: Array.isArray(payload.defaultFieldOrder) ? payload.defaultFieldOrder : null,
        defaultDimOrder: Array.isArray(payload.defaultDimOrder) ? payload.defaultDimOrder : null,
        defaultDishColOrder: Array.isArray(payload.defaultDishColOrder) ? payload.defaultDishColOrder : null,
        defaultListColOrders:
          payload.defaultListColOrders && typeof payload.defaultListColOrders === 'object'
            ? payload.defaultListColOrders
            : null,
      }
      if (next.cuisineTagsVersion !== 2) {
        next.cuisineTags = migrateCuisineTags(next.cuisineTags)
        next.cards = next.cards.map((c) => migrateCardCuisines({ ...c }))
        next.cuisineTagsVersion = 2
      }
      migratePresetDims(next)
      migrateDefaultCardDims(next)
      ensureSystemCardDims(next)
      cache = next
      try {
        await idbSet(cloneState(next))
        clearLegacyLocalStorage()
      } catch (e) {
        console.warn(e)
        if (isQuotaError(e)) {
          return { ok: false, error: '本机空间不够，备份可能太大' }
        }
        return { ok: false, error: '写入本机失败，请再试一次' }
      }
      return { ok: true, cardCount: next.cards.length }
    } catch (e) {
      console.warn(e)
      if (isQuotaError(e)) {
        return { ok: false, error: '本机空间不够，备份可能太大' }
      }
      return { ok: false, error: '无法读取这份备份' }
    }
  }

  return {
    uid, LEVEL_META, PHOTO_BG, load, save, ready, flush, saveErrorMessage,
    getCards, getCard, upsertCard, deleteCard,
    getDefs, saveDefs, upsertDef, deleteDef, addRecent, search, emptyCard,
    formatDim, hasVal, fmtDate, fmtShort, getRecent: () => load().recentSearches,
    getCuisineTags: () => load().cuisineTags, removeCuisineTag, defaultDefs,
    ensureCardDims, dimLabel, renameDim, isLockedField, isCoreField, isSystemCardDim,
    CORE_FIELD_IDS, LOCKED_FIELDS, SYSTEM_CARD_DIM_IDS,
    isDishAttach, isCardAttach, isListBlock, isListCol, getDishColDefs, getListColDefs,
    ensureListBlock, emptyListRow, collectListColOrders,
    saveDefaultLayout, exportBackup, importBackup,
  }
})()
