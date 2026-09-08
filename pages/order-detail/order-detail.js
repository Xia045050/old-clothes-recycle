const store = require('../../utils/store');

const STEP_DEFS = [
  { key: 'submit', name: '提交预约', desc: '预约信息已提交' },
  { key: 'pending', name: '待上门', desc: '回收员将按时上门取件' },
  { key: 'done', name: '回收完成', desc: '衣物已打包称重，完成回收' },
  { key: 'points', name: '积分发放', desc: '环保积分发放至我的账户' }
];

function buildSteps(status) {
  let doneCount = 0;
  let current = -1;
  let canceled = false;
  if (status === store.STATUS.DONE) {
    doneCount = 4;
  } else if (status === store.STATUS.PENDING) {
    doneCount = 1;
    current = 1; // “待上门”为进行中
  } else {
    doneCount = 1;
    canceled = true;
  }
  return STEP_DEFS.map(function (d, i) {
    const step = Object.assign({}, d);
    if (canceled && i === 1) {
      step.state = 'cancel';
      step.name = '已取消';
      step.desc = '本次预约已取消';
    } else if (i < doneCount) {
      step.state = 'done';
    } else if (i === current) {
      step.state = 'current';
    } else {
      step.state = 'todo';
    }
    return step;
  });
}

Page({
  data: {
    order: null,
    steps: [],
    co2Text: ''
  },

  onLoad(options) {
    // 支持无参进入：默认取最近一单，便于演示
    this.id = options.id || ((store.getOrders()[0] || {}).id);
  },

  onShow() {
    this.load();
  },

  load() {
    const order = store.getOrder(this.id);
    if (!order) return;
    const co2 = Math.round(order.weightKg * store.CO2_PER_KG * 10) / 10;
    this.setData({
      order: order,
      steps: buildSteps(order.status),
      co2Text: String(co2)
    });
  },

  cancel() {
    const that = this;
    wx.showModal({
      title: '取消预约',
      content: '确定要取消本次上门回收预约吗？',
      confirmColor: '#f53f3f',
      success: function (res) {
        if (res.confirm) {
          store.updateOrder(that.id, { status: store.STATUS.CANCEL });
          wx.showToast({ title: '已取消预约', icon: 'success' });
          that.load();
        }
      }
    });
  },

  callService() {
    wx.makePhoneCall({ phoneNumber: '4008001234' });
  }
});
