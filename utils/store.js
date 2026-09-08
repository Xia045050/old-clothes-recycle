// 数据层：全部数据保存在本地缓存（wx storage），模拟后端接口
// 接入真实后端时，只需把本文件的读写字段替换为 wx.request 调用即可

var KEYS = {
  ORDERS: 'cy_orders',
  ADDRESSES: 'cy_addresses',
  EXTRA_POINTS: 'cy_points_extra',
  SELECTED_ADDRESS: 'cy_selected_address',
  USER: 'cy_user'
};

var STATUS = {
  PENDING: '待上门',
  DONE: '已完成',
  CANCEL: '已取消'
};

var CATEGORIES = [
  { id: 'clothes', name: '旧衣服', icon: '👕', desc: '夏装冬装童装均可' },
  { id: 'shoes', name: '鞋靴', icon: '👟', desc: '运动鞋皮鞋靴子' },
  { id: 'bags', name: '箱包', icon: '👜', desc: '背包手提包行李袋' },
  { id: 'bedding', name: '床品', icon: '🛏️', desc: '被套床单棉被' },
  { id: 'toys', name: '玩具', icon: '🧸', desc: '毛绒塑料电动玩具' },
  { id: 'books', name: '书籍', icon: '📚', desc: '课本课外书绘本' },
  { id: 'hats', name: '帽饰', icon: '🧢', desc: '帽子围巾手套' }
];

var WEIGHT_OPTIONS = [
  { label: '5公斤以下', kg: 3 },
  { label: '5-10公斤', kg: 8 },
  { label: '10-20公斤', kg: 15 },
  { label: '20公斤以上', kg: 25 }
];

var TIME_SLOTS = ['09:00-11:00', '11:00-13:00', '14:00-16:00', '16:00-18:00'];

// 环保换算系数（行业通用口径：每回收利用 1kg 旧衣）
var POINT_PER_KG = 5;     // 1kg = 5 积分
var CO2_PER_KG = 3.6;     // 减碳 3.6 kg
var WATER_PER_KG = 6000;  // 节水 6000 L

function pad(n) {
  return n < 10 ? '0' + n : '' + n;
}

function initSeed() {
  if (!wx.getStorageSync(KEYS.ADDRESSES)) {
    wx.setStorageSync(KEYS.ADDRESSES, [
      { id: 'A1', name: '张丽', phone: '13812345678', region: '广东省 广州市 天河区', detail: '珠江新城华夏路26号702室', isDefault: true },
      { id: 'A2', name: '李明', phone: '15988889999', region: '浙江省 杭州市 西湖区', detail: '文三路500号星光城3栋802', isDefault: false }
    ]);
  }
  if (!wx.getStorageSync(KEYS.ORDERS)) {
    wx.setStorageSync(KEYS.ORDERS, [
      {
        id: 'CY20260906192045',
        status: STATUS.PENDING,
        createdAt: '2026-09-06 19:20',
        date: '2026-09-09',
        slot: '09:00-11:00',
        cats: ['旧衣服', '床品'],
        weightKg: 8,
        points: 40,
        address: { name: '李明', phone: '15988889999', full: '浙江省杭州市西湖区文三路500号星光城3栋802' },
        remark: '旧衣服放纸箱打包好了'
      },
      {
        id: 'CY20260902143018',
        status: STATUS.DONE,
        createdAt: '2026-09-02 14:30',
        date: '2026-09-03',
        slot: '14:00-16:00',
        cats: ['旧衣服', '鞋靴'],
        weightKg: 12.6,
        points: 63,
        address: { name: '张丽', phone: '13812345678', full: '广东省广州市天河区珠江新城华夏路26号702室' },
        remark: ''
      }
    ]);
  }
  if (!wx.getStorageSync(KEYS.EXTRA_POINTS)) {
    wx.setStorageSync(KEYS.EXTRA_POINTS, 260); // 新人奖励等固定积分
  }
}

function genOrderId() {
  var d = new Date();
  var rand = Math.floor(Math.random() * 90 + 10);
  return 'CY' + d.getFullYear() + pad(d.getMonth() + 1) + pad(d.getDate()) +
    pad(d.getHours()) + pad(d.getMinutes()) + pad(d.getSeconds()) + rand;
}

/* ---------- 订单 ---------- */
function getOrders() {
  return wx.getStorageSync(KEYS.ORDERS) || [];
}
function saveOrders(list) {
  wx.setStorageSync(KEYS.ORDERS, list);
}
function addOrder(order) {
  var list = getOrders();
  list.unshift(order);
  saveOrders(list);
  return order;
}
function getOrder(id) {
  var list = getOrders();
  for (var i = 0; i < list.length; i++) {
    if (list[i].id === id) return list[i];
  }
  return null;
}
function updateOrder(id, patch) {
  var list = getOrders();
  for (var i = 0; i < list.length; i++) {
    if (list[i].id === id) {
      list[i] = Object.assign({}, list[i], patch);
      saveOrders(list);
      return list[i];
    }
  }
  return null;
}

/* ---------- 地址 ---------- */
function getAddresses() {
  return wx.getStorageSync(KEYS.ADDRESSES) || [];
}
function saveAddresses(list) {
  wx.setStorageSync(KEYS.ADDRESSES, list);
}
function addAddress(addr) {
  var list = getAddresses();
  addr.id = 'A' + Date.now();
  if (addr.isDefault || list.length === 0) {
    for (var i = 0; i < list.length; i++) list[i].isDefault = false;
    addr.isDefault = true;
  }
  list.push(addr);
  saveAddresses(list);
  return addr;
}
function updateAddress(addr) {
  var list = getAddresses();
  for (var i = 0; i < list.length; i++) {
    if (list[i].id === addr.id) {
      if (addr.isDefault) {
        for (var j = 0; j < list.length; j++) list[j].isDefault = false;
      }
      list[i] = addr;
      saveAddresses(list);
      return;
    }
  }
}
function deleteAddress(id) {
  var list = getAddresses().filter(function (a) { return a.id !== id; });
  if (list.length && !list.some(function (a) { return a.isDefault; })) {
    list[0].isDefault = true;
  }
  saveAddresses(list);
}
function getDefaultAddress() {
  var list = getAddresses();
  for (var i = 0; i < list.length; i++) {
    if (list[i].isDefault) return list[i];
  }
  return list[0] || null;
}
function getAddressById(id) {
  var list = getAddresses();
  for (var i = 0; i < list.length; i++) {
    if (list[i].id === id) return list[i];
  }
  return null;
}
function addressFull(addr) {
  return (addr.region || '').replace(/\s+/g, '') + (addr.detail || '');
}

function getSelectedAddressId() {
  return wx.getStorageSync(KEYS.SELECTED_ADDRESS) || '';
}
function setSelectedAddressId(id) {
  wx.setStorageSync(KEYS.SELECTED_ADDRESS, id);
}

/* ---------- 日期 ---------- */
// 未来 7 天可选上门日期（从明天起）
function getUpcomingDates() {
  var weeks = ['周日', '周一', '周二', '周三', '周四', '周五', '周六'];
  var arr = [];
  for (var i = 1; i <= 7; i++) {
    var d = new Date(Date.now() + i * 86400000);
    arr.push({
      value: d.getFullYear() + '-' + pad(d.getMonth() + 1) + '-' + pad(d.getDate()),
      label: (d.getMonth() + 1) + '月' + d.getDate() + '日',
      week: weeks[d.getDay()]
    });
  }
  return arr;
}

function spendPoints(n) {
  var cur = Number(wx.getStorageSync(KEYS.EXTRA_POINTS)) || 0;
  wx.setStorageSync(KEYS.EXTRA_POINTS, Math.max(0, cur - n));
}

/* ---------- 统计 ---------- */
function getStats() {
  var orders = getOrders();
  var done = orders.filter(function (o) { return o.status === STATUS.DONE; });
  var recycledKg = 0;
  for (var i = 0; i < done.length; i++) recycledKg += (done[i].weightKg || 0);
  recycledKg = Math.round(recycledKg * 10) / 10;

  var extra = Number(wx.getStorageSync(KEYS.EXTRA_POINTS)) || 0;
  var earned = 0;
  for (var j = 0; j < done.length; j++) earned += (done[j].points || 0);

  var points = extra + earned;
  var co2 = Math.round(recycledKg * CO2_PER_KG * 10) / 10;
  var water = Math.round(recycledKg * WATER_PER_KG);
  var trees = Math.round(co2 / 18.3 * 10) / 10;

  return {
    recycledKg: recycledKg,
    points: points,
    co2: co2,
    water: water,
    trees: trees,
    orderCount: orders.length,
    doneCount: done.length
  };
}

module.exports = {
  KEYS: KEYS,
  STATUS: STATUS,
  CATEGORIES: CATEGORIES,
  WEIGHT_OPTIONS: WEIGHT_OPTIONS,
  TIME_SLOTS: TIME_SLOTS,
  POINT_PER_KG: POINT_PER_KG,
  CO2_PER_KG: CO2_PER_KG,
  WATER_PER_KG: WATER_PER_KG,
  initSeed: initSeed,
  genOrderId: genOrderId,
  getOrders: getOrders,
  addOrder: addOrder,
  getOrder: getOrder,
  updateOrder: updateOrder,
  getAddresses: getAddresses,
  addAddress: addAddress,
  updateAddress: updateAddress,
  deleteAddress: deleteAddress,
  getDefaultAddress: getDefaultAddress,
  getAddressById: getAddressById,
  addressFull: addressFull,
  getSelectedAddressId: getSelectedAddressId,
  setSelectedAddressId: setSelectedAddressId,
  getUpcomingDates: getUpcomingDates,
  spendPoints: spendPoints,
  getStats: getStats
};
