import { getCards } from '../../services/storage'
import { MealCard, Level, LEVEL_META } from '../../types/models'
import { formatDateShort } from '../../utils/util'

const PHOTO_BG: Record<Level, string[]> = {
  strong: ['#EDD9B8', '#E0C99A'],
  rec: ['#E8EEDC', '#DCE6D0'],
  normal: ['#EFE9DF', '#E5DFD3'],
  avoid: ['#F3DDD9', '#E8CFC9'],
}

interface PileItem {
  key: Level
  title: string
  color: string
  count: number
  cards: Array<{
    id: string
    name: string
    date: string
    level: Level
    taste: number
    photo: string
    odd: boolean
    photoBg: string
  }>
}

function safeTop(): number {
  try {
    const info = wx.getWindowInfo ? wx.getWindowInfo() : wx.getSystemInfoSync()
    return info.safeArea?.top || info.statusBarHeight || 20
  } catch {
    return 20
  }
}

Page({
  data: {
    statusPad: 0,
    searchExpanded: false,
    keyword: '',
    piles: [] as PileItem[],
    empty: false,
  },

  onLoad() {
    this.setData({ statusPad: safeTop() })
  },

  onShow() {
    this.refresh()
  },

  refresh() {
    const cards = getCards()
    const levels: Level[] = ['strong', 'rec', 'normal', 'avoid']
    const piles: PileItem[] = levels.map((key) => {
      const list = cards.filter((c) => c.level === key)
      return {
        key,
        title: LEVEL_META[key].label,
        color: LEVEL_META[key].color,
        count: list.length,
        cards: list.map((c, i) => this.mapCard(c, i, key)),
      }
    })
    this.setData({
      piles,
      empty: cards.length === 0,
    })
  },

  mapCard(c: MealCard, i: number, level: Level) {
    const bgs = PHOTO_BG[level]
    return {
      id: c.id,
      name: c.name,
      date: formatDateShort(c.date),
      level: c.level,
      taste: c.taste,
      photo: c.photos[0] || '',
      odd: i % 2 === 0,
      photoBg: bgs[i % bgs.length],
    }
  },

  toggleSearch() {
    this.setData({ searchExpanded: !this.data.searchExpanded })
  },

  onSearchInput(e: WechatMiniprogram.Input) {
    this.setData({ keyword: e.detail.value })
  },

  goSearch() {
    const q = (this.data.keyword || '').trim()
    wx.navigateTo({
      url: q
        ? `/pages/search/search?q=${encodeURIComponent(q)}`
        : '/pages/search/search',
    })
  },

  onSearchConfirm() {
    this.goSearch()
  },

  onCardTap(e: WechatMiniprogram.CustomEvent) {
    const id = e.detail.id as string
    if (!id) return
    wx.navigateTo({ url: `/pages/detail/detail?id=${id}` })
  },

  onFab() {
    wx.navigateTo({ url: '/pages/edit/edit' })
  },

  onLogoLongPress() {
    wx.navigateTo({ url: '/pages/template/template' })
  },
})
