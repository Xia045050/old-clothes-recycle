const store = require('../../utils/store');

Page({
  data: {
    order: null,
    points: 0
  },

  onLoad(options) {
    // 支持无参进入：默认取最近一单，便于演示
    const id = options.id || ((store.getOrders()[0] || {}).id);
    const order = store.getOrder(id);
    if (order) {
      this.setData({ order: order, points: order.points });
    }
  },

  goOrders() {
    wx.switchTab({ url: '/pages/orders/orders' });
  },

  goIndex() {
    wx.switchTab({ url: '/pages/index/index' });
  }
});
