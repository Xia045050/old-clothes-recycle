const store = require('../../utils/store');

const TABS = ['全部', '待上门', '已完成', '已取消'];

Page({
  data: {
    tabs: TABS,
    active: 0,
    orders: []
  },

  onShow() {
    this.load();
  },

  onPullDownRefresh() {
    this.load();
    wx.stopPullDownRefresh();
  },

  load() {
    const status = TABS[this.data.active];
    let list = store.getOrders();
    if (status !== '全部') {
      list = list.filter(function (o) { return o.status === status; });
    }
    this.setData({ orders: list });
  },

  switchTab(e) {
    this.setData({ active: e.currentTarget.dataset.index });
    this.load();
  },

  goDetail(e) {
    wx.navigateTo({ url: '/pages/order-detail/order-detail?id=' + e.currentTarget.dataset.id });
  },

  goBooking() {
    wx.switchTab({ url: '/pages/booking/booking' });
  }
});
