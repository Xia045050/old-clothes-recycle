const store = require('../../utils/store');

Page({
  data: {
    user: null,
    stats: {}
  },

  onShow() {
    this.setData({
      user: wx.getStorageSync(store.KEYS.USER) || null,
      stats: store.getStats()
    });
  },

  login() {
    const user = { nickname: '微信用户', loginAt: Date.now() };
    wx.setStorageSync(store.KEYS.USER, user);
    this.setData({ user: user });
    wx.showToast({ title: '登录成功', icon: 'success' });
  },

  goOrders() { wx.switchTab({ url: '/pages/orders/orders' }); },
  goBooking() { wx.switchTab({ url: '/pages/booking/booking' }); },
  goPoints() { wx.navigateTo({ url: '/pages/points/points' }); },
  goAddress() { wx.navigateTo({ url: '/pages/address/address' }); },
  goNearby() { wx.navigateTo({ url: '/pages/nearby/nearby' }); },
  goAbout() { wx.navigateTo({ url: '/pages/about/about' }); },

  callService() {
    wx.makePhoneCall({ phoneNumber: '4008001234' });
  },

  clearCache() {
    const that = this;
    wx.showModal({
      title: '重置演示数据',
      content: '将清空本机上的预约、地址、积分等演示数据并恢复初始状态，确定吗？',
      confirmColor: '#f53f3f',
      success: function (res) {
        if (!res.confirm) return;
        wx.clearStorageSync();
        store.initSeed();
        wx.removeStorageSync(store.KEYS.USER);
        that.onShow();
        wx.showToast({ title: '已重置', icon: 'success' });
      }
    });
  }
});
