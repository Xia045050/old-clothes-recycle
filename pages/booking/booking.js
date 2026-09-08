const store = require('../../utils/store');

function pad(n) {
  return n < 10 ? '0' + n : '' + n;
}
function formatNow() {
  const d = new Date();
  return d.getFullYear() + '-' + pad(d.getMonth() + 1) + '-' + pad(d.getDate()) + ' ' + pad(d.getHours()) + ':' + pad(d.getMinutes());
}

Page({
  data: {
    address: null,
    categories: [],
    weights: [],
    weightIndex: -1,
    dates: [],
    dateIndex: 0,
    slots: store.TIME_SLOTS,
    slotIndex: -1,
    remark: '',
    estimatePoints: 0
  },

  onLoad() {
    const categories = store.CATEGORIES.map(function (c) {
      return Object.assign({}, c, { checked: false });
    });
    this.setData({
      categories: categories,
      weights: store.WEIGHT_OPTIONS.map(function (w) { return w.label; }),
      dates: store.getUpcomingDates()
    });
  },

  onShow() {
    const selId = store.getSelectedAddressId();
    let addr = selId ? store.getAddressById(selId) : null;
    if (!addr) addr = store.getDefaultAddress();
    if (addr) {
      this.setData({
        address: { id: addr.id, name: addr.name, phone: addr.phone, full: store.addressFull(addr) }
      });
    } else {
      this.setData({ address: null });
    }
  },

  pickAddress() {
    wx.navigateTo({ url: '/pages/address/address?mode=select' });
  },

  toggleCat(e) {
    const i = e.currentTarget.dataset.index;
    const key = 'categories[' + i + '].checked';
    const patch = {};
    patch[key] = !this.data.categories[i].checked;
    this.setData(patch);
  },

  pickWeight(e) {
    const i = e.currentTarget.dataset.index;
    this.setData({
      weightIndex: i,
      estimatePoints: store.WEIGHT_OPTIONS[i].kg * store.POINT_PER_KG
    });
  },

  pickDate(e) {
    this.setData({ dateIndex: e.currentTarget.dataset.index });
  },

  pickSlot(e) {
    this.setData({ slotIndex: e.currentTarget.dataset.index });
  },

  onRemark(e) {
    this.setData({ remark: e.detail.value });
  },

  submit() {
    if (!this.data.address) {
      wx.showToast({ title: '请先填写上门地址', icon: 'none' });
      return;
    }
    const picked = this.data.categories.filter(function (c) { return c.checked; }).map(function (c) { return c.name; });
    if (!picked.length) {
      wx.showToast({ title: '请选择回收物品', icon: 'none' });
      return;
    }
    if (this.data.weightIndex < 0) {
      wx.showToast({ title: '请选择预估重量', icon: 'none' });
      return;
    }
    if (this.data.slotIndex < 0) {
      wx.showToast({ title: '请选择上门时间段', icon: 'none' });
      return;
    }
    const w = store.WEIGHT_OPTIONS[this.data.weightIndex];
    const d = this.data.dates[this.data.dateIndex];
    const order = {
      id: store.genOrderId(),
      status: store.STATUS.PENDING,
      createdAt: formatNow(),
      date: d.value,
      dateLabel: d.label + ' ' + d.week,
      slot: this.data.slots[this.data.slotIndex],
      cats: picked,
      weightKg: w.kg,
      points: w.kg * store.POINT_PER_KG,
      address: {
        name: this.data.address.name,
        phone: this.data.address.phone,
        full: this.data.address.full
      },
      remark: this.data.remark.trim()
    };
    store.addOrder(order);
    wx.redirectTo({ url: '/pages/success/success?id=' + order.id });
  }
});
