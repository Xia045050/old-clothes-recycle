const store = require('./utils/store');

App({
  onLaunch() {
    store.initSeed();
  },
  globalData: {}
});
