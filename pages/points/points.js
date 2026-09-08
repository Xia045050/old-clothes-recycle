const store = require('../../utils/store');

const GIFTS = [
  { id: 'g1', icon: '🛍️', name: '环保帆布袋', points: 200 },
  { id: 'g2', icon: '🪴', name: '多肉绿植盆栽', points: 300 },
  { id: 'g3', icon: '👕', name: '旧衣新生T恤', points: 800 },
  { id: 'g4', icon: '🥤', name: '环保保温杯', points: 1200 }
];

Page({
  data: {
    stats: {},
    pointsText: '0',
    gifts: GIFTS,
    records: []
  },

  onShow() {
    this.refresh();
  },

  refresh() {
    const s = store.getStats();
    const records = this.buildRecords();
    this.setData({
      stats: s,
      pointsText: String(s.points),
      records: records
    });
  },

  buildRecords() {
    const records = [];
    const done = store.getOrders().filter(function (o) { return o.status === store.STATUS.DONE; });
    for (let i = 0; i < done.length; i++) {
      records.push({
        title: '旧衣回收 ' + done[i].weightKg + 'kg',
        date: done[i].date,
        delta: '+' + done[i].points
      });
    }
    records.push({ title: '每日签到', date: '2026-09-05', delta: '+2' });
    records.push({ title: '新用户注册奖励', date: '2026-08-20', delta: '+260' });
    records.sort(function (a, b) { return a.date < b.date ? 1 : -1; });
    return records;
  },

  goBooking() {
    wx.switchTab({ url: '/pages/booking/booking' });
  },

  exchange(e) {
    const that = this;
    const gift = GIFTS[e.currentTarget.dataset.index];
    const s = store.getStats();
    if (s.points < gift.points) {
      wx.showToast({ title: '积分不足，快去预约回收吧', icon: 'none' });
      return;
    }
    wx.showModal({
      title: '确认兑换',
      content: '消耗 ' + gift.points + ' 积分兑换「' + gift.name + '」？',
      confirmColor: '#00b578',
      success: function (res) {
        if (!res.confirm) return;
        store.spendPoints(gift.points);
        wx.showToast({ title: '兑换成功', icon: 'success' });
        that.refresh();
      }
    });
  }
});
