Component({
  properties: {
    level: { type: String, value: 'rec' },
    size: { type: String, value: 'md' },
    short: { type: Boolean, value: false },
  },
  data: {
    label: '推荐',
    cls: 'lv-rec',
  },
  observers: {
    'level, short'(lv: string, short: boolean) {
      const map: Record<string, { full: string; short: string; cls: string }> = {
        strong: { full: '★ 强推', short: '强推', cls: 'lv-strong' },
        rec: { full: '✓ 推荐', short: '推荐', cls: 'lv-rec' },
        normal: { full: '○ 一般', short: '一般', cls: 'lv-normal' },
        avoid: { full: '✕ 避雷', short: '避雷', cls: 'lv-avoid' },
      }
      const m = map[lv] || map.rec
      this.setData({
        label: short ? m.short : m.full,
        cls: m.cls,
      })
    },
  },
})
