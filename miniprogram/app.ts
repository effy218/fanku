// app.ts
import { loadAppData } from './services/storage'

App<IAppOption>({
  globalData: {},
  onLaunch() {
    loadAppData()
  },
})
