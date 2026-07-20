export type Level = 'strong' | 'rec' | 'normal' | 'avoid'
export type DimType = 'text' | 'binary' | 'ternary' | 'stars'
export type Reeat = 'yes' | 'maybe' | 'no'
export type DishMark = 'must' | 'ok' | 'no'

export type DimValue = string | number | boolean | null

export interface DimensionDef {
  id: string
  name: string
  type: DimType
  options?: string[]
  enabled: boolean
  order: number
}

export interface DishItem {
  name: string
  mark: DishMark
}

export interface MealCard {
  id: string
  name: string
  location: string
  date: string
  cuisines: string[]
  taste: number
  level: Level
  photos: string[]
  reeat: Reeat
  dims: Record<string, DimValue>
  note?: string
  dishes?: DishItem[]
  showNote?: boolean
  showDishes?: boolean
  createdAt: number
  updatedAt: number
}

export interface AppData {
  cards: MealCard[]
  dimensionDefs: DimensionDef[]
  recentSearches: string[]
  cuisineTags: string[]
  cuisineTagsVersion?: number
}

export const LEVEL_META: Record<
  Level,
  { label: string; short: string; color: string }
> = {
  strong: { label: '强推', short: '★ 强推', color: '#E8A317' },
  rec: { label: '推荐', short: '✓ 推荐', color: '#7A9B5A' },
  normal: { label: '一般', short: '○ 一般', color: '#9B8B7A' },
  avoid: { label: '避雷', short: '✕ 避雷', color: '#C25B4E' },
}

export const REEAT_META: Record<Reeat, { label: string; className: string }> = {
  yes: { label: '一定会', className: 'reeat-yes' },
  maybe: { label: '可能会', className: 'reeat-maybe' },
  no: { label: '不会', className: 'reeat-no' },
}

export const DIM_TYPE_LABELS: Record<DimType, string> = {
  text: '文本',
  binary: '二态',
  ternary: '三态',
  stars: '星级',
}
