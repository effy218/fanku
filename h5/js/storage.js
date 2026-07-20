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
    { id: 'dim_service', name: '服务', type: 'stars', attach: 'card', enabled: true, order: 0 },
    { id: 'dim_environment', name: '环境', type: 'stars', attach: 'card', enabled: true, order: 1 },
    { id: 'dim_value', name: '性价比', type: 'stars', attach: 'card', enabled: true, order: 2 },
    { id: 'dim_queue', name: '排队', type: 'choice', options: ['很快', '一般', '很长'], attach: 'card', enabled: true, order: 3 },
    { id: 'dim_wait_min', name: '等待时间', type: 'number', unit: '分钟', attach: 'card', enabled: true, order: 4 },
    { id: 'dim_avg_price', name: '人均', type: 'number', unit: '元', attach: 'card', enabled: true, order: 5 },
    { id: 'dim_photo_worthy', name: '是否出片', type: 'binary', options: ['出片', '不出片'], attach: 'card', enabled: true, order: 6 },
  ]

  const PRESET_DIM_IDS = [
    'dim_service',
    'dim_environment',
    'dim_value',
    'dim_queue',
    'dim_wait_min',
    'dim_avg_price',
    'dim_photo_worthy',
  ]
  const REMOVED_PRESET_DIM_IDS = ['dim_calorie', 'dim_health']

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

  /** 常用评价预设 v2：补环境/性价比/等待/人均，撤热量/健康度 */
  function migratePresetDims(data) {
    if ((data.presetDimsVersion || 0) >= 2) return false
    const fresh = defaultDefs()
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
      } else if (PRESET_DIM_IDS.includes(def.id)) {
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
    data.dimensionDefs = Object.values(byId)
      .sort((a, b) => {
        const ai = PRESET_DIM_IDS.indexOf(a.id)
        const bi = PRESET_DIM_IDS.indexOf(b.id)
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

  const seed = () => ({
    cards: seedCards(),
    dimensionDefs: defaultDefs(),
    recentSearches: ['火锅', '日料', '面食'],
    cuisineTags: [...DEFAULT_CUISINE_TAGS],
    cuisineTagsVersion: 2,
    presetDimsVersion: 2,
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
          if (migratePresetDims(data)) changed = true
          const out = {
            cards: data.cards || [],
            dimensionDefs: data.dimensionDefs?.length ? data.dimensionDefs : defaultDefs(),
            recentSearches: data.recentSearches || [],
            cuisineTags: data.cuisineTags?.length ? data.cuisineTags : [...DEFAULT_CUISINE_TAGS],
            cuisineTagsVersion: data.cuisineTagsVersion || 2,
            presetDimsVersion: data.presetDimsVersion || 2,
            defaultFieldOrder: Array.isArray(data.defaultFieldOrder) ? data.defaultFieldOrder : null,
            defaultDimOrder: Array.isArray(data.defaultDimOrder) ? data.defaultDimOrder : null,
            defaultDishColOrder: Array.isArray(data.defaultDishColOrder) ? data.defaultDishColOrder : null,
            defaultListColOrders:
              data.defaultListColOrders && typeof data.defaultListColOrders === 'object'
                ? data.defaultListColOrders
                : null,
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
    }
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

  const CORE_FIELD_IDS = ['name', 'location', 'date', 'cuisine', 'taste', 'level', 'reeat', 'photos', 'note', 'dishes']
  const LOCKED_FIELDS = ['name', 'taste', 'level', 'reeat']

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
      card.fieldOrder = [...CORE_FIELD_IDS, ...card.dimOrder]
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
        presetDimsVersion: data.presetDimsVersion || 2,
        defaultFieldOrder: data.defaultFieldOrder || null,
        defaultDimOrder: data.defaultDimOrder || null,
        defaultDishColOrder: data.defaultDishColOrder || null,
        defaultListColOrders: data.defaultListColOrders || null,
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
    isDishAttach, isCardAttach, isListBlock, isListCol, getDishColDefs, getListColDefs,
    ensureListBlock, emptyListRow, collectListColOrders,
    saveDefaultLayout, exportBackup, importBackup,
  }
})()
