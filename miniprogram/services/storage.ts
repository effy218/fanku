import {
  AppData,
  DimensionDef,
  MealCard,
  DimValue,
} from '../types/models'

const STORAGE_KEY = 'fanku:v1'

function uid(prefix = 'id'): string {
  return `${prefix}_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 8)}`
}

export function createId(prefix = 'id'): string {
  return uid(prefix)
}

export function defaultDimensionDefs(): DimensionDef[] {
  return [
    {
      id: 'dim_service',
      name: '服务',
      type: 'stars',
      enabled: true,
      order: 0,
    },
    {
      id: 'dim_queue',
      name: '排队',
      type: 'ternary',
      options: ['很快', '一般', '很长'],
      enabled: true,
      order: 1,
    },
    {
      id: 'dim_calorie',
      name: '热量',
      type: 'text',
      enabled: true,
      order: 2,
    },
    {
      id: 'dim_health',
      name: '健康度',
      type: 'stars',
      enabled: true,
      order: 3,
    },
    {
      id: 'dim_photo_worthy',
      name: '是否出片',
      type: 'binary',
      options: ['出片', '不出片'],
      enabled: true,
      order: 4,
    },
  ]
}

function seedCards(): MealCard[] {
  const now = Date.now()
  return [
    {
      id: 'card_seed_1',
      name: '小津拉面',
      location: '朝阳区·三里屯',
      date: '2026-07-06',
      cuisines: ['日料', '面食'],
      taste: 5,
      level: 'strong',
      photos: [],
      reeat: 'yes',
      dims: {
        dim_service: 4.5,
        dim_queue: 1,
        dim_calorie: '约 850 kcal',
        dim_health: 3,
        dim_photo_worthy: true,
      },
      note: '汤头浓白挂勺，面条偏细硬挺。叉烧入口即化，味玉流心惊喜。下雨天来一碗，治愈。',
      dishes: [
        { name: '豚骨拉面（替玉）', mark: 'must' },
        { name: '味玉叉烧饭', mark: 'ok' },
        { name: '炸鸡块', mark: 'no' },
      ],
      showNote: true,
      showDishes: true,
      createdAt: now - 86400000 * 3,
      updatedAt: now - 86400000 * 3,
    },
    {
      id: 'card_seed_2',
      name: '巷子口咖啡',
      location: '东城区·南锣鼓巷',
      date: '2026-07-04',
      cuisines: ['咖啡', '轻食'],
      taste: 4,
      level: 'rec',
      photos: [],
      reeat: 'maybe',
      dims: {
        dim_service: 4,
        dim_photo_worthy: true,
      },
      note: '澳白细腻，可颂外酥里软。适合一个人坐一下午。',
      showNote: true,
      showDishes: false,
      createdAt: now - 86400000 * 5,
      updatedAt: now - 86400000 * 5,
    },
    {
      id: 'card_seed_3',
      name: '老王麻辣烫',
      location: '海淀区·五道口',
      date: '2026-06-28',
      cuisines: ['川菜', '小吃'],
      taste: 3.5,
      level: 'normal',
      photos: [],
      reeat: 'maybe',
      dims: {
        dim_queue: 2,
        dim_calorie: '偏高',
        dim_health: 2,
      },
      createdAt: now - 86400000 * 12,
      updatedAt: now - 86400000 * 12,
    },
    {
      id: 'card_seed_4',
      name: '某网红火锅',
      location: '朝阳区·国贸',
      date: '2026-06-20',
      cuisines: ['火锅'],
      taste: 2,
      level: 'avoid',
      photos: [],
      reeat: 'no',
      dims: {
        dim_service: 1.5,
        dim_queue: 2,
        dim_photo_worthy: false,
      },
      note: '汤底寡淡，服务慢，性价比不行。',
      showNote: true,
      createdAt: now - 86400000 * 20,
      updatedAt: now - 86400000 * 20,
    },
    {
      id: 'card_seed_5',
      name: '和食厨房',
      location: '西城区·西单',
      date: '2026-07-01',
      cuisines: ['日料'],
      taste: 4.5,
      level: 'strong',
      photos: [],
      reeat: 'yes',
      dims: {
        dim_service: 5,
        dim_health: 4,
      },
      dishes: [
        { name: '味噌拉面', mark: 'must' },
        { name: '叉烧饭', mark: 'ok' },
      ],
      showDishes: true,
      createdAt: now - 86400000 * 8,
      updatedAt: now - 86400000 * 8,
    },
    {
      id: 'card_seed_6',
      name: '楼下包子铺',
      location: '朝阳区·望京',
      date: '2026-07-05',
      cuisines: ['小吃'],
      taste: 4,
      level: 'rec',
      photos: [],
      reeat: 'yes',
      dims: {},
      createdAt: now - 86400000 * 2,
      updatedAt: now - 86400000 * 2,
    },
  ]
}

const DEFAULT_CUISINE_TAGS = [
  '火锅',
  '烧烤',
  '川菜',
  '粤菜',
  '日料',
  '韩餐',
  '西餐',
  '面食',
  '小吃',
  '咖啡',
  '甜品',
  '轻食',
]
const LEGACY_CUISINE_TAGS = [
  '日料',
  '拉面',
  '咖啡',
  '轻食',
  '川味',
  '麻辣烫',
  '火锅',
  '早餐',
  '面点',
]
const CUISINE_REMAP: Record<string, string> = {
  拉面: '面食',
  川味: '川菜',
  麻辣烫: '小吃',
  早餐: '小吃',
  面点: '小吃',
}

function migrateCardCuisines(card: MealCard): MealCard {
  if (!Array.isArray(card.cuisines)) return card
  const next: string[] = []
  card.cuisines.forEach((t) => {
    const mapped = CUISINE_REMAP[t] || t
    if (mapped && !next.includes(mapped)) next.push(mapped)
  })
  return { ...card, cuisines: next }
}

function migrateCuisineTags(tags: string[]): string[] {
  const custom = (tags || []).filter(
    (t) => !LEGACY_CUISINE_TAGS.includes(t) && !DEFAULT_CUISINE_TAGS.includes(t)
  )
  return [...DEFAULT_CUISINE_TAGS, ...custom]
}

function createSeedData(): AppData {
  return {
    cards: seedCards(),
    dimensionDefs: defaultDimensionDefs(),
    recentSearches: ['火锅', '日料', '面食'],
    cuisineTags: [...DEFAULT_CUISINE_TAGS],
    cuisineTagsVersion: 2,
  }
}

export function loadAppData(): AppData {
  try {
    const raw = wx.getStorageSync(STORAGE_KEY)
    if (raw && typeof raw === 'object' && Array.isArray(raw.cards)) {
      const version = raw.cuisineTagsVersion
      let cards = raw.cards || []
      let cuisineTags = raw.cuisineTags || []
      if (version !== 2) {
        cuisineTags = migrateCuisineTags(cuisineTags)
        cards = cards.map((c) => migrateCardCuisines(c))
        const migrated: AppData = {
          cards,
          dimensionDefs: raw.dimensionDefs?.length
            ? raw.dimensionDefs
            : defaultDimensionDefs(),
          recentSearches: raw.recentSearches || [],
          cuisineTags,
          cuisineTagsVersion: 2,
        }
        saveAppData(migrated)
        return migrated
      }
      return {
        cards,
        dimensionDefs: raw.dimensionDefs?.length
          ? raw.dimensionDefs
          : defaultDimensionDefs(),
        recentSearches: raw.recentSearches || [],
        cuisineTags: cuisineTags.length ? cuisineTags : [...DEFAULT_CUISINE_TAGS],
        cuisineTagsVersion: 2,
      }
    }
  } catch (e) {
    console.warn('loadAppData failed', e)
  }
  const seed = createSeedData()
  saveAppData(seed)
  return seed
}

export function saveAppData(data: AppData): void {
  wx.setStorageSync(STORAGE_KEY, data)
}

export function getCards(): MealCard[] {
  return loadAppData().cards
}

export function getCardById(id: string): MealCard | undefined {
  return loadAppData().cards.find((c) => c.id === id)
}

export function upsertCard(card: MealCard): MealCard {
  const data = loadAppData()
  const idx = data.cards.findIndex((c) => c.id === card.id)
  const next = { ...card, updatedAt: Date.now() }
  if (idx >= 0) {
    data.cards[idx] = next
  } else {
    data.cards.unshift(next)
  }
  // merge cuisine tags
  next.cuisines.forEach((t) => {
    if (t && !data.cuisineTags.includes(t)) {
      data.cuisineTags.unshift(t)
    }
  })
  saveAppData(data)
  return next
}

export function deleteCard(id: string): void {
  const data = loadAppData()
  data.cards = data.cards.filter((c) => c.id !== id)
  saveAppData(data)
}

export function getDimensionDefs(): DimensionDef[] {
  return loadAppData().dimensionDefs.slice().sort((a, b) => a.order - b.order)
}

export function saveDimensionDefs(defs: DimensionDef[]): void {
  const data = loadAppData()
  data.dimensionDefs = defs.map((d, i) => ({ ...d, order: i }))
  saveAppData(data)
}

export function upsertDimensionDef(def: DimensionDef): void {
  const data = loadAppData()
  const idx = data.dimensionDefs.findIndex((d) => d.id === def.id)
  if (idx >= 0) {
    data.dimensionDefs[idx] = def
  } else {
    data.dimensionDefs.push({ ...def, order: data.dimensionDefs.length })
  }
  data.dimensionDefs = data.dimensionDefs
    .slice()
    .sort((a, b) => a.order - b.order)
    .map((d, i) => ({ ...d, order: i }))
  saveAppData(data)
}

export function deleteDimensionDef(id: string): void {
  const data = loadAppData()
  data.dimensionDefs = data.dimensionDefs
    .filter((d) => d.id !== id)
    .map((d, i) => ({ ...d, order: i }))
  data.cards = data.cards.map((card) => {
    if (!(id in card.dims)) return card
    const dims = { ...card.dims }
    delete dims[id]
    return { ...card, dims }
  })
  saveAppData(data)
}

export function reorderDimensionDefs(from: number, to: number): void {
  const defs = getDimensionDefs()
  if (from < 0 || to < 0 || from >= defs.length || to >= defs.length) return
  const [item] = defs.splice(from, 1)
  defs.splice(to, 0, item)
  saveDimensionDefs(defs)
}

export function addRecentSearch(q: string): void {
  const data = loadAppData()
  const trimmed = q.trim()
  if (!trimmed) return
  data.recentSearches = [
    trimmed,
    ...data.recentSearches.filter((s) => s !== trimmed),
  ].slice(0, 12)
  saveAppData(data)
}

export function getRecentSearches(): string[] {
  return loadAppData().recentSearches
}

export function getCuisineTags(): string[] {
  return loadAppData().cuisineTags
}

export function searchCards(query: string): MealCard[] {
  const q = query.trim().toLowerCase()
  if (!q) return []
  const cards = getCards()
  return cards.filter((c) => {
    if (c.name.toLowerCase().includes(q)) return true
    if (c.location.toLowerCase().includes(q)) return true
    if (c.note && c.note.toLowerCase().includes(q)) return true
    if (c.cuisines.some((t) => t.toLowerCase().includes(q))) return true
    if (c.dishes?.some((d) => d.name.toLowerCase().includes(q))) return true
    // search text dims
    return Object.values(c.dims).some(
      (v) => typeof v === 'string' && v.toLowerCase().includes(q)
    )
  })
}

export function createEmptyCard(): MealCard {
  const today = new Date()
  const y = today.getFullYear()
  const m = `${today.getMonth() + 1}`.padStart(2, '0')
  const d = `${today.getDate()}`.padStart(2, '0')
  return {
    id: createId('card'),
    name: '',
    location: '',
    date: `${y}-${m}-${d}`,
    cuisines: [],
    taste: 0,
    level: 'rec',
    photos: [],
    reeat: 'maybe',
    dims: {},
    showNote: false,
    showDishes: false,
    createdAt: Date.now(),
    updatedAt: Date.now(),
  }
}

export function formatDimDisplay(
  def: DimensionDef,
  value: DimValue
): string {
  if (value === null || value === undefined || value === '') return ''
  if (def.type === 'stars') {
    return Number(value).toFixed(1)
  }
  if (def.type === 'binary') {
    const opts = def.options || ['是', '否']
    return value === true || value === 1 || value === opts[0] ? opts[0] : opts[1]
  }
  if (def.type === 'ternary') {
    const opts = def.options || ['好', '中', '差']
    const idx = typeof value === 'number' ? value : Number(value)
    return opts[idx] ?? String(value)
  }
  return String(value)
}

export function hasDimValue(value: DimValue): boolean {
  if (value === null || value === undefined) return false
  if (typeof value === 'string') return value.trim().length > 0
  if (typeof value === 'number') return !Number.isNaN(value)
  return true
}
