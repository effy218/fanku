Page({
  onLoad() {
    setTimeout(() => {
      wx.reLaunch({ url: '/pages/home/home' })
    }, 1400)
  },
})
