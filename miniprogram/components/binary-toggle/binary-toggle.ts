Component({
  properties: {
    value: { type: null, value: null },
    options: {
      type: Array,
      value: ['是', '否'],
    },
    readonly: { type: Boolean, value: false },
  },
  methods: {
    onSelect(e: WechatMiniprogram.TouchEvent) {
      if (this.properties.readonly) return
      const index = Number(e.currentTarget.dataset.index)
      const boolVal = index === 0
      this.triggerEvent('change', { value: boolVal, index })
    },
  },
})
