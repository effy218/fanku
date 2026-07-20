Component({
  properties: {
    value: { type: null, value: null },
    options: {
      type: Array,
      value: ['一定会', '可能会', '不会'],
    },
    readonly: { type: Boolean, value: false },
  },
  methods: {
    onSelect(e: WechatMiniprogram.TouchEvent) {
      if (this.properties.readonly) return
      const index = Number(e.currentTarget.dataset.index)
      this.triggerEvent('change', { value: index })
    },
  },
})
