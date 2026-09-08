const store = require('../../utils/store');

Page({
  data: {
    banners: [
      { id: 1, cls: 'bg-green', title: '免费上门回收', sub: '满5公斤免费上门 · 足不出户轻松环保' },
      { id: 2, cls: 'bg-blue', title: '旧衣新生 · 公益捐赠', sub: '可穿衣物清洗消毒后捐赠给需要的人' },
      { id: 3, cls: 'bg-orange', title: '环保积分当钱花', sub: '1公斤=5积分，可兑换环保好礼' }
    ],
    categories: store.CATEGORIES,
    steps: [
      { name: '在线预约', desc: '选品类约时间' },
      { name: '上门回收', desc: '快递员准时上门' },
      { name: '打包称重', desc: '现场称重打包' },
      { name: '获得积分', desc: '积分兑换好礼' }
    ],
    promises: [
      { icon: '💰', txt: '完全免费' },
      { icon: '⚡', txt: '极速响应' },
      { icon: '♻️', txt: '环保处理' },
      { icon: '❤️', txt: '公益捐赠' }
    ]
  },

  goBooking() {
    wx.switchTab({ url: '/pages/booking/booking' });
  },
  goPoints() {
    wx.navigateTo({ url: '/pages/points/points' });
  },
  goNearby() {
    wx.navigateTo({ url: '/pages/nearby/nearby' });
  },
  goAbout() {
    wx.navigateTo({ url: '/pages/about/about' });
  },
  goOrders() {
    wx.switchTab({ url: '/pages/orders/orders' });
  },

  onShareAppMessage() {
    return {
      title: '旧衣回收 | 免费上门回收，足不出户做环保',
      path: '/pages/index/index'
    };
  }
});
