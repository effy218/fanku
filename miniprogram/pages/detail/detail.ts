import {
  getCardById,
  getDimensionDefs,
  deleteCard,
  formatDimDisplay,
  hasDimValue,
} from '../../services/storage'
import { MealCard, DimensionDef, REEAT_META } from '../../types/models'
import { formatDate } from '../../utils/util'

interface DimRow {
  def: DimensionDef
  value: string | number | boolean | null
  displayText: string
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
    id: '',
    card: null as MealCard | null,
    dateText: '',
    reeatLabel: '',
    reeatClass: '',
    cuisineText: '',
    dimRows: [] as DimRow[],
    showMore: false,
    dishMarks: {
      must: '必点',
      ok: '',
      no: '踩雷',
    } as Record<string, string>,
  },

  onLoad(query: Record<string, string | undefined>) {
    this.setData({ id: query.id || '', statusPad: safeTop() })
  },

  onShow() {
    this.load()
  },

  load() {
    const card = getCardById(this.data.id)
    if (!card) {
      wx.showToast({ title: '饭卡不存在', icon: 'none' })
      setTimeout(() => wx.navigateBack(), 500)
      return
    }
    const defs = getDimensionDefs().filter((d) => d.enabled)
    const dimRows: DimRow[] = defs
      .filter((def) => hasDimValue(card.dims[def.id]))
      .map((def) => ({
        def,
        value: card.dims[def.id],
        displayText: formatDimDisplay(def, card.dims[def.id]),
      }))

    const reeat = REEAT_META[card.reeat]
    const reeatLabel =
      card.reeat === 'yes'
        ? '一定会复吃'
        : card.reeat === 'maybe'
          ? '可能会'
          : '不会了'

    this.setData({
      card,
      dateText: formatDate(card.date),
      reeatLabel,
      reeatClass: reeat.className,
      cuisineText: (card.cuisines || []).join(' · '),
      dimRows,
      showMore: false,
    })
  },

  onBack() {
    wx.navigateBack()
  },

  onEdit() {
    wx.navigateTo({ url: `/pages/edit/edit?id=${this.data.id}` })
  },

  toggleMore() {
    this.setData({ showMore: !this.data.showMore })
  },

  onDelete() {
    wx.showModal({
      title: '删除饭卡',
      content: '确定删除这张饭卡吗？',
      confirmColor: '#C25B4E',
      success: (res) => {
        if (!res.confirm) return
        deleteCard(this.data.id)
        wx.navigateBack()
      },
    })
  },
})
