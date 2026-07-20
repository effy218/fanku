import {
  getCardById,
  createEmptyCard,
  upsertCard,
  getDimensionDefs,
  getCuisineTags,
  createId,
  hasDimValue,
  formatDimDisplay,
} from '../../services/storage'
import {
  MealCard,
  DimensionDef,
  Level,
  Reeat,
  DishMark,
  DimValue,
} from '../../types/models'

const LEVELS: { key: Level; label: string }[] = [
  { key: 'strong', label: '强推' },
  { key: 'rec', label: '推荐' },
  { key: 'normal', label: '一般' },
  { key: 'avoid', label: '避雷' },
]

const REEAT_OPTS = ['一定会', '可能会', '不会']
const REEAT_KEYS: Reeat[] = ['yes', 'maybe', 'no']

interface ActiveDim {
  def: DimensionDef
  value: DimValue
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
    isNew: true,
    card: {} as MealCard,
    levels: LEVELS,
    reeatOpts: REEAT_OPTS,
    reeatIndex: 1,
    cuisineSuggestions: [] as string[],
    allDefs: [] as DimensionDef[],
    activeDims: [] as ActiveDim[],
    hiddenDefs: [] as DimensionDef[],
    showMorePanel: false,
    dishDraft: '',
    dishMarkIndex: 1,
    photoSlots: [0, 1, 2, 3, 4, 5] as number[],
    dishMarkOpts: [
      { key: 'must' as DishMark, label: '必点' },
      { key: 'ok' as DishMark, label: '普通' },
      { key: 'no' as DishMark, label: '踩雷' },
    ],
  },

  onLoad(query: Record<string, string | undefined>) {
    const id = query.id
    let card: MealCard
    let isNew = true
    if (id) {
      const existing = getCardById(id)
      if (existing) {
        card = JSON.parse(JSON.stringify(existing)) as MealCard
        isNew = false
      } else {
        card = createEmptyCard()
      }
    } else {
      card = createEmptyCard()
    }
    // 设计稿：手账/菜品常显
    card.showNote = true
    card.showDishes = true
    if (!card.dishes) card.dishes = []

    const reeatIndex = REEAT_KEYS.indexOf(card.reeat)
    this.setData({
      statusPad: safeTop(),
      isNew,
      card,
      reeatIndex: reeatIndex >= 0 ? reeatIndex : 1,
      cuisineSuggestions: getCuisineTags().slice(0, 8),
    })
    this.refreshDims()
  },

  refreshDims() {
    const card = this.data.card
    const allDefs = getDimensionDefs().filter((d) => d.enabled)
    const activeIds = new Set(
      allDefs
        .filter((d) => hasDimValue(card.dims[d.id]))
        .map((d) => d.id)
    )
    // keep already-shown dims even if empty during edit session
    const shown = (this.data.activeDims || []).map((a) => a.def.id)
    shown.forEach((id) => activeIds.add(id))

    // for new cards with seed dims, show filled ones; for edit show filled
    if (!this.data.activeDims.length) {
      allDefs.forEach((d) => {
        if (hasDimValue(card.dims[d.id])) activeIds.add(d.id)
      })
    }

    const activeDims: ActiveDim[] = allDefs
      .filter((d) => activeIds.has(d.id))
      .map((def) => ({
        def,
        value: card.dims[def.id] ?? null,
        displayText: formatDimDisplay(def, card.dims[def.id]),
      }))

    const hiddenDefs = allDefs.filter((d) => !activeIds.has(d.id))

    this.setData({ allDefs, activeDims, hiddenDefs })
  },

  setField(field: keyof MealCard, value: unknown) {
    this.setData({ [`card.${field}`]: value } as WechatMiniprogram.IAnyObject)
  },

  onName(e: WechatMiniprogram.Input) {
    this.setField('name', e.detail.value)
  },
  onLocation(e: WechatMiniprogram.Input) {
    this.setField('location', e.detail.value)
  },
  onDateChange(e: WechatMiniprogram.PickerChange) {
    this.setField('date', e.detail.value)
  },
  onCuisines(e: WechatMiniprogram.CustomEvent) {
    this.setField('cuisines', e.detail.tags)
  },
  onTaste(e: WechatMiniprogram.CustomEvent) {
    this.setField('taste', e.detail.value)
  },
  onLevel(e: WechatMiniprogram.TouchEvent) {
    const level = e.currentTarget.dataset.level as Level
    this.setField('level', level)
  },
  onReeat(e: WechatMiniprogram.CustomEvent) {
    const idx = e.detail.value as number
    this.setData({ reeatIndex: idx })
    this.setField('reeat', REEAT_KEYS[idx])
  },
  onNote(e: WechatMiniprogram.Input) {
    this.setField('note', e.detail.value)
  },

  onChoosePhoto() {
    const card = this.data.card
    const remain = 9 - (card.photos?.length || 0)
    if (remain <= 0) {
      wx.showToast({ title: '最多 9 张', icon: 'none' })
      return
    }
    wx.chooseMedia({
      count: remain,
      mediaType: ['image'],
      success: async (res) => {
        const paths: string[] = []
        for (const f of res.tempFiles) {
          try {
            const saved = await new Promise<string>((resolve, reject) => {
              wx.saveFile({
                tempFilePath: f.tempFilePath,
                success: (r) => resolve(r.savedFilePath),
                fail: reject,
              })
            })
            paths.push(saved)
          } catch {
            paths.push(f.tempFilePath)
          }
        }
        this.setField('photos', [...(card.photos || []), ...paths])
      },
    })
  },

  onRemovePhoto(e: WechatMiniprogram.TouchEvent) {
    const index = Number(e.currentTarget.dataset.index)
    const photos = [...(this.data.card.photos || [])]
    photos.splice(index, 1)
    this.setField('photos', photos)
  },

  onDimChange(e: WechatMiniprogram.CustomEvent) {
    const id = e.currentTarget.dataset.id as string
    const value = e.detail.value as DimValue
    const dims = { ...this.data.card.dims, [id]: value }
    this.setData({ 'card.dims': dims })
    const activeDims = this.data.activeDims.map((row) =>
      row.def.id === id
        ? {
            ...row,
            value,
            displayText: formatDimDisplay(row.def, value),
          }
        : row
    )
    this.setData({ activeDims })
  },

  toggleMorePanel() {
    this.setData({ showMorePanel: !this.data.showMorePanel })
  },

  addDim(e: WechatMiniprogram.TouchEvent) {
    const id = e.currentTarget.dataset.id as string
    const def = this.data.hiddenDefs.find((d) => d.id === id)
    if (!def) return
    const activeDims = [
      ...this.data.activeDims,
      { def, value: null, displayText: '' },
    ]
    const hiddenDefs = this.data.hiddenDefs.filter((d) => d.id !== id)
    this.setData({ activeDims, hiddenDefs, showMorePanel: false })
  },

  enableNote() {
    this.setData({
      'card.showNote': true,
      showMorePanel: false,
    })
  },

  enableDishes() {
    this.setData({
      'card.showDishes': true,
      'card.dishes': this.data.card.dishes || [],
      showMorePanel: false,
    })
  },

  goTemplate() {
    wx.navigateTo({ url: '/pages/template/template' })
  },

  onDishDraft(e: WechatMiniprogram.Input) {
    this.setData({ dishDraft: e.detail.value })
  },

  onDishMark(e: WechatMiniprogram.TouchEvent) {
    this.setData({ dishMarkIndex: Number(e.currentTarget.dataset.index) })
  },

  addDish() {
    const name = (this.data.dishDraft || '').trim()
    if (!name) return
    const mark = this.data.dishMarkOpts[this.data.dishMarkIndex].key
    const dishes = [...(this.data.card.dishes || []), { name, mark }]
    this.setData({
      'card.dishes': dishes,
      'card.showDishes': true,
      dishDraft: '',
    })
  },

  removeDish(e: WechatMiniprogram.TouchEvent) {
    const index = Number(e.currentTarget.dataset.index)
    const dishes = [...(this.data.card.dishes || [])]
    dishes.splice(index, 1)
    this.setData({ 'card.dishes': dishes })
  },

  onClose() {
    wx.navigateBack()
  },

  onSave() {
    const card = this.data.card
    if (!card.name || !card.name.trim()) {
      wx.showToast({ title: '请填写店名', icon: 'none' })
      return
    }
    if (!card.date) {
      wx.showToast({ title: '请选择日期', icon: 'none' })
      return
    }
    if (!card.id) {
      card.id = createId('card')
      card.createdAt = Date.now()
    }
    upsertCard(card)
    wx.showToast({ title: '已保存', icon: 'success' })
    setTimeout(() => {
      if (this.data.isNew) {
        wx.redirectTo({ url: `/pages/detail/detail?id=${card.id}` })
      } else {
        wx.navigateBack()
      }
    }, 400)
  },

  onShow() {
    // refresh defs when returning from template
    if (this.data.card && this.data.card.id !== undefined) {
      this.refreshDims()
    }
  },
})
