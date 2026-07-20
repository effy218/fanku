import {
  getDimensionDefs,
  saveDimensionDefs,
  upsertDimensionDef,
  deleteDimensionDef,
  createId,
} from '../../services/storage'
import { DimensionDef, DimType, DIM_TYPE_LABELS } from '../../types/models'

const TYPE_OPTS: DimType[] = ['text', 'binary', 'ternary', 'stars']

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
    defs: [] as DimensionDef[],
    typeLabels: DIM_TYPE_LABELS,
    editing: false,
    draft: {
      id: '',
      name: '',
      type: 'text' as DimType,
      options: [] as string[],
      enabled: true,
      order: 0,
    },
    typeIndex: 0,
    typeOpts: TYPE_OPTS,
    typeOptLabels: TYPE_OPTS.map((t) => DIM_TYPE_LABELS[t]),
    opt0: '',
    opt1: '',
    opt2: '',
  },

  onLoad() {
    this.setData({ statusPad: safeTop() })
  },

  onShow() {
    this.reload()
  },

  onBack() {
    wx.navigateBack()
  },

  reload() {
    this.setData({ defs: getDimensionDefs() })
  },

  onAdd() {
    this.setData({
      editing: true,
      draft: {
        id: createId('dim'),
        name: '',
        type: 'text',
        options: [],
        enabled: true,
        order: this.data.defs.length,
      },
      typeIndex: 0,
      opt0: '是',
      opt1: '否',
      opt2: '',
    })
  },

  onEdit(e: WechatMiniprogram.TouchEvent) {
    const id = e.currentTarget.dataset.id as string
    const def = this.data.defs.find((d) => d.id === id)
    if (!def) return
    const typeIndex = TYPE_OPTS.indexOf(def.type)
    const opts = def.options || []
    this.setData({
      editing: true,
      draft: { ...def, options: [...(def.options || [])] },
      typeIndex: typeIndex >= 0 ? typeIndex : 0,
      opt0: opts[0] || (def.type === 'binary' ? '是' : '好'),
      opt1: opts[1] || (def.type === 'binary' ? '否' : '中'),
      opt2: opts[2] || '差',
    })
  },

  onCloseEditor() {
    this.setData({ editing: false })
  },

  onName(e: WechatMiniprogram.Input) {
    this.setData({ 'draft.name': e.detail.value })
  },

  onTypeChange(e: WechatMiniprogram.PickerChange) {
    const typeIndex = Number(e.detail.value)
    const type = TYPE_OPTS[typeIndex]
    const patch: WechatMiniprogram.IAnyObject = {
      typeIndex,
      'draft.type': type,
    }
    if (type === 'binary') {
      patch.opt0 = this.data.opt0 || '是'
      patch.opt1 = this.data.opt1 || '否'
    } else if (type === 'ternary') {
      patch.opt0 = this.data.opt0 || '好'
      patch.opt1 = this.data.opt1 || '中'
      patch.opt2 = this.data.opt2 || '差'
    }
    this.setData(patch)
  },

  onOpt0(e: WechatMiniprogram.Input) {
    this.setData({ opt0: e.detail.value })
  },
  onOpt1(e: WechatMiniprogram.Input) {
    this.setData({ opt1: e.detail.value })
  },
  onOpt2(e: WechatMiniprogram.Input) {
    this.setData({ opt2: e.detail.value })
  },

  onToggleEnabled() {
    this.setData({ 'draft.enabled': !this.data.draft.enabled })
  },

  onSaveDraft() {
    const name = (this.data.draft.name || '').trim()
    if (!name) {
      wx.showToast({ title: '请填写维度名', icon: 'none' })
      return
    }
    const type = this.data.draft.type
    let options: string[] | undefined
    if (type === 'binary') {
      options = [this.data.opt0 || '是', this.data.opt1 || '否']
    } else if (type === 'ternary') {
      options = [
        this.data.opt0 || '好',
        this.data.opt1 || '中',
        this.data.opt2 || '差',
      ]
    }
    const def: DimensionDef = {
      ...this.data.draft,
      name,
      options,
    }
    upsertDimensionDef(def)
    this.setData({ editing: false })
    this.reload()
    wx.showToast({ title: '已保存', icon: 'success' })
  },

  onDeleteDraft() {
    const id = this.data.draft.id
    const exists = this.data.defs.some((d) => d.id === id)
    if (!exists) {
      this.setData({ editing: false })
      return
    }
    wx.showModal({
      title: '删除维度',
      content: '将从所有饭卡中清除该维度的数据',
      confirmColor: '#C25B4E',
      success: (res) => {
        if (!res.confirm) return
        deleteDimensionDef(id)
        this.setData({ editing: false })
        this.reload()
      },
    })
  },

  onToggleItem(e: WechatMiniprogram.TouchEvent) {
    const id = e.currentTarget.dataset.id as string
    const defs = this.data.defs.map((d) =>
      d.id === id ? { ...d, enabled: !d.enabled } : d
    )
    saveDimensionDefs(defs)
    this.reload()
  },

  onMoveUp(e: WechatMiniprogram.TouchEvent) {
    const index = Number(e.currentTarget.dataset.index)
    if (index <= 0) return
    const defs = [...this.data.defs]
    const tmp = defs[index - 1]
    defs[index - 1] = defs[index]
    defs[index] = tmp
    saveDimensionDefs(defs)
    this.reload()
  },

  onMoveDown(e: WechatMiniprogram.TouchEvent) {
    const index = Number(e.currentTarget.dataset.index)
    const defs = [...this.data.defs]
    if (index >= defs.length - 1) return
    const tmp = defs[index + 1]
    defs[index + 1] = defs[index]
    defs[index] = tmp
    saveDimensionDefs(defs)
    this.reload()
  },

  onDeleteItem(e: WechatMiniprogram.TouchEvent) {
    const id = e.currentTarget.dataset.id as string
    wx.showModal({
      title: '删除维度',
      content: '将从所有饭卡中清除该维度的数据',
      confirmColor: '#C25B4E',
      success: (res) => {
        if (!res.confirm) return
        deleteDimensionDef(id)
        this.reload()
      },
    })
  },
})
