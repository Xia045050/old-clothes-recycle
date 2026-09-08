const RECYCLE_POINTS = [
  { id: 1, name: '天河环保回收站', dist: '1.2km', addr: '天河区体育东路6号首层', time: '09:00-18:00', lat: 23.1352, lng: 113.3244 },
  { id: 2, name: '珠江新城智能回收点', dist: '2.0km', addr: '天河区兴盛路12号侧面', time: '24小时开放', lat: 23.1195, lng: 113.3222 },
  { id: 3, name: '五山社区回收驿站', dist: '3.5km', addr: '天河区五山路381号', time: '08:30-19:00', lat: 23.1572, lng: 113.3618 },
  { id: 4, name: '海珠滨江回收点', dist: '4.8km', addr: '海珠区滨江东路588号', time: '09:00-18:00', lat: 23.1065, lng: 113.2955 }
];

Page({
  data: {
    latitude: 23.1291,
    longitude: 113.2644,
    markers: [],
    points: RECYCLE_POINTS
  },

  onLoad() {
    const markers = RECYCLE_POINTS.map(function (p) {
      return {
        id: p.id,
        latitude: p.lat,
        longitude: p.lng,
        title: p.name,
        iconPath: '/images/pin.png',
        width: 32,
        height: 32
      };
    });
    this.setData({ markers: markers });
  },

  navigate(e) {
    const p = RECYCLE_POINTS[e.currentTarget.dataset.index];
    wx.openLocation({
      latitude: p.lat,
      longitude: p.lng,
      name: p.name,
      address: p.addr,
      scale: 16
    });
  },

  call(e) {
    wx.makePhoneCall({ phoneNumber: '020-88881234' });
  }
});
