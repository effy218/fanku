Component({
  properties: {
    tags: { type: Array, value: [] },
    suggestions: { type: Array, value: [] },
    placeholder: { type: String, value: '添加标签…' },
    readonly: { type: Boolean, value: false },
  },
  data: {
    draft: '',
  },
  methods: {
    onInput(e: WechatMiniprogram.Input) {
      this.setData({ draft: e.detail.value })
    },
    onConfirm() {
      this.addTag(this.data.draft)
    },
    onAddTap() {
      this.addTag(this.data.draft)
    },
    addTag(raw: string) {
      if (this.properties.readonly) return
      const tag = (raw || '').trim()
      if (!tag) return
      const tags = (this.properties.tags as string[]) || []
      if (tags.includes(tag)) {
        this.setData({ draft: '' })
        return
      }
      const next = [...tags, tag]
      this.setData({ draft: '' })
      this.triggerEvent('change', { tags: next })
    },
    onRemove(e: WechatMiniprogram.TouchEvent) {
      if (this.properties.readonly) return
      const index = Number(e.currentTarget.dataset.index)
      const tags = [...((this.properties.tags as string[]) || [])]
      tags.splice(index, 1)
      this.triggerEvent('change', { tags })
    },
    onSuggest(e: WechatMiniprogram.TouchEvent) {
      if (this.properties.readonly) return
      const tag = e.currentTarget.dataset.tag as string
      this.addTag(tag)
    },
  },
})
