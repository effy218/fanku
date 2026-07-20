import {
  searchCards,
  getRecentSearches,
  addRecentSearch,
} from '../../services/storage'
import { MealCard } from '../../types/models'
import { formatDateShort } from '../../utils/util'

interface ResultItem {
  id: string
  name: string
  nameHtml: string
  level: string
  photo: string
  hint: string
  hintHtml: string
  date: string
  hasPhoto: boolean
}

function safeTop(): number {
  try {
    const info = wx.getWindowInfo ? wx.getWindowInfo() : wx.getSystemInfoSync()
    return info.safeArea?.top || info.statusBarHeight || 20
  } catch {
    return 20
  }
}

function escapeHtml(s: string): string {
  return s
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
}

function highlight(text: string, q: string): string {
  if (!q) return escapeHtml(text)
  const src = escapeHtml(text)
  const key = escapeHtml(q)
  const re = new RegExp(key.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'ig')
  return src.replace(re, (m) => `<span style="background:#E8A317;color:#3D2B1F;padding:0 2px;">${m}</span>`)
}

Page({
  data: {
    statusPad: 0,
    keyword: '',
    recent: [] as string[],
    results: [] as ResultItem[],
    searched: false,
  },

  onLoad(query: Record<string, string | undefined>) {
    const q = query.q ? decodeURIComponent(query.q) : ''
    this.setData({
      statusPad: safeTop(),
      recent: getRecentSearches(),
      keyword: q,
    })
    if (q) {
      this.doSearch(q)
    }
  },

  onBack() {
    wx.navigateBack()
  },

  onInput(e: WechatMiniprogram.Input) {
    this.setData({ keyword: e.detail.value })
  },

  onConfirm() {
    this.doSearch(this.data.keyword)
  },

  onChip(e: WechatMiniprogram.TouchEvent) {
    const q = e.currentTarget.dataset.q as string
    this.setData({ keyword: q })
    this.doSearch(q)
  },

  doSearch(raw: string) {
    const q = (raw || '').trim()
    if (!q) {
      this.setData({ results: [], searched: false })
      return
    }
    addRecentSearch(q)
    const cards = searchCards(q)
    const results = cards.map((c) => this.mapResult(c, q))
    this.setData({
      results,
      searched: true,
      recent: getRecentSearches(),
    })
  },

  mapResult(c: MealCard, q: string): ResultItem {
    const lower = q.toLowerCase()
    let hint = ''
    let hintRaw = ''
    if (c.name.toLowerCase().includes(lower)) {
      hint = `${formatDateShort(c.date)} · 店名匹配`
      hintRaw = hint
    } else if (c.cuisines.some((t) => t.toLowerCase().includes(lower))) {
      hintRaw = `菜系：${c.cuisines.join('、')}`
      hint = hintRaw
    } else if (c.dishes?.some((d) => d.name.toLowerCase().includes(lower))) {
      hintRaw = `菜品：${c.dishes.map((d) => d.name).join('、')}`
      hint = hintRaw
    } else if (c.note && c.note.toLowerCase().includes(lower)) {
      const idx = c.note.toLowerCase().indexOf(lower)
      const start = Math.max(0, idx - 6)
      const slice = c.note.slice(start, start + 36)
      hintRaw = `"…${slice}${c.note.length > start + 36 ? '…' : ''}"`
      hint = hintRaw
    } else if (c.location.toLowerCase().includes(lower)) {
      hintRaw = c.location
      hint = hintRaw
    } else {
      hintRaw = '内容匹配'
      hint = hintRaw
    }

    return {
      id: c.id,
      name: c.name,
      nameHtml: highlight(c.name, q),
      level: c.level,
      photo: c.photos[0] || '',
      hasPhoto: !!(c.photos && c.photos[0]),
      hint,
      hintHtml: highlight(hintRaw, q),
      date: formatDateShort(c.date),
    }
  },

  openCard(e: WechatMiniprogram.TouchEvent) {
    const id = e.currentTarget.dataset.id as string
    wx.navigateTo({ url: `/pages/detail/detail?id=${id}` })
  },

  clear() {
    this.setData({ keyword: '', results: [], searched: false })
  },
})
