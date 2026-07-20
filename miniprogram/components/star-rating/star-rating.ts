Component({
  properties: {
    value: { type: Number, value: 0 },
    readonly: { type: Boolean, value: false },
    size: { type: Number, value: 36 },
    showValue: { type: Boolean, value: false },
    brandValue: { type: Boolean, value: false },
  },
  data: {
    stars: [] as { index: number; fill: 'empty' | 'half' | 'full' }[],
    displayValue: '0.0',
  },
  observers: {
    value() {
      this.buildStars()
    },
  },
  lifetimes: {
    attached() {
      this.buildStars()
    },
  },
  methods: {
    buildStars() {
      const v = Number(this.properties.value) || 0
      const stars = [1, 2, 3, 4, 5].map((i) => {
        let fill: 'empty' | 'half' | 'full' = 'empty'
        if (v >= i) fill = 'full'
        else if (v >= i - 0.5) fill = 'half'
        return { index: i, fill }
      })
      this.setData({ stars, displayValue: v.toFixed(1) })
    },
    onTapSimple(e: WechatMiniprogram.TouchEvent) {
      if (this.properties.readonly) return
      const index = Number(e.currentTarget.dataset.index)
      const half = e.currentTarget.dataset.half === '1'
      const next = half ? index - 0.5 : index
      this.triggerEvent('change', { value: Math.max(0, next) })
    },
  },
})
