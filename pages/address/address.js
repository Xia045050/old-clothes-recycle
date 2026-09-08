const store = require('../../utils/store');

Page({
  data: {
    mode: 'manage', // select=选择地址回传预约页 / manage=纯管理
    list: []
  },

  onLoad(options) {
    this.setData({ mode: options.mode === 'select' ? 'select' : 'manage' });
  },

  onShow() {
    this.load();
  },

  load() {
    const list = store.getAddresses().map(function (a) {
      return Object.assign({}, a, { full: store.addressFull(a) });
    });
    this.setData({ list: list });
  },

  pick(e) {
    if (this.data.mode !== 'select') return;
    store.setSelectedAddressId(e.currentTarget.dataset.id);
    wx.navigateBack();
  },

  add() {
    wx.navigateTo({ url: '/pages/address-edit/address-edit' });
  },

  edit(e) {
    wx.navigateTo({ url: '/pages/address-edit/address-edit?id=' + e.currentTarget.dataset.id });
  },

  remove(e) {
    const that = this;
    const id = e.currentTarget.dataset.id;
    wx.showModal({
      title: '删除地址',
      content: '确定删除该地址吗？',
      confirmColor: '#f53f3f',
      success: function (res) {
        if (res.confirm) {
          store.deleteAddress(id);
          wx.showToast({ title: '已删除', icon: 'success' });
          that.load();
        }
      }
    });
  },

  setDefault(e) {
    const id = e.currentTarget.dataset.id;
    const addr = store.getAddressById(id);
    if (!addr) return;
    store.updateAddress(Object.assign({}, addr, { isDefault: true }));
    wx.showToast({ title: '已设为默认', icon: 'success' });
    this.load();
  }
});
