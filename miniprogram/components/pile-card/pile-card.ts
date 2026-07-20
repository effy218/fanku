Component({
  properties: {
    cardId: { type: String, value: '' },
    name: { type: String, value: '' },
    date: { type: String, value: '' },
    level: { type: String, value: 'rec' },
    taste: { type: Number, value: 0 },
    photo: { type: String, value: '' },
    odd: { type: Boolean, value: false },
    photoBg: { type: String, value: '#EDD9B8' },
  },
  methods: {
    onTap() {
      this.triggerEvent('cardtap', { id: this.properties.cardId })
    },
  },
})
