const store = require('../../utils/store');

Page({
  data: {
    id: '',
    name: '',
    phone: '',
    region: ['广东省', '广州市', '天河区'],
    detail: '',
    isDefault: false,
    editing: false
  },

  onLoad(options) {
    if (options.id) {
      const addr = store.getAddressById(options.id);
      if (addr) {
        this.setData({
          id: addr.id,
          name: addr.name,
          phone: addr.phone,
          region: addr.region.split(/\s+/),
          detail: addr.detail,
          isDefault: !!addr.isDefault,
          editing: true
        });
        wx.setNavigationBarTitle({ title: '编辑地址' });
      }
    }
  },

  onName(e) { this.setData({ name: e.detail.value }); },
  onPhone(e) { this.setData({ phone: e.detail.value }); },
  onDetail(e) { this.setData({ detail: e.detail.value }); },
  onDefault(e) { this.setData({ isDefault: e.detail.value }); },
  onRegion(e) { this.setData({ region: e.detail.value }); },

  save() {
    const d = this.data;
    if (!d.name.trim()) {
      wx.showToast({ title: '请填写联系人姓名', icon: 'none' });
      return;
    }
    if (!/^1\d{10}$/.test(d.phone.trim())) {
      wx.showToast({ title: '请填写正确的手机号', icon: 'none' });
      return;
    }
    if (!d.detail.trim()) {
      wx.showToast({ title: '请填写详细地址', icon: 'none' });
      return;
    }
    const addr = {
      id: d.id,
      name: d.name.trim(),
      phone: d.phone.trim(),
      region: d.region.join(' '),
      detail: d.detail.trim(),
      isDefault: d.isDefault
    };
    if (d.editing) {
      store.updateAddress(addr);
    } else {
      store.addAddress(addr);
    }
    wx.showToast({ title: '已保存', icon: 'success' });
    setTimeout(function () { wx.navigateBack(); }, 600);
  }
});
