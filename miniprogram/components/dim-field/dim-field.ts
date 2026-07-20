Component({
  properties: {
    def: { type: Object, value: {} },
    value: { type: null, value: null },
    readonly: { type: Boolean, value: false },
    displayText: { type: String, value: '' },
  },
  methods: {
    onText(e: WechatMiniprogram.Input) {
      this.triggerEvent('change', { value: e.detail.value })
    },
    onStars(e: WechatMiniprogram.CustomEvent) {
      this.triggerEvent('change', { value: e.detail.value })
    },
    onTernary(e: WechatMiniprogram.CustomEvent) {
      this.triggerEvent('change', { value: e.detail.value })
    },
    onBinary(e: WechatMiniprogram.CustomEvent) {
      this.triggerEvent('change', { value: e.detail.value })
    },
  },
})
