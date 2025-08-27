// pages/aboutus/aboutus.js
Page({
  data: {
    club: {
      name: '移动应用开发社团',
      slogan: '学习·实践·分享',
      intro: '我们专注于移动应用开发的学习与实践，组织技术分享、实战训练营与竞赛活动，欢迎对移动开发感兴趣的同学加入。',
      version: '1.0.0'
    },
    contacts: {
      phone: '13800138000',
      wechat: 'mobile_dev_club',
      email: 'club@example.com'
    },
    qrImage: '/images/cloud_dev.png'
  },

  onLoad() {},

  makePhoneCall() {
    const phone = this.data.contacts.phone;
    if (!phone) return;
    wx.makePhoneCall({ phoneNumber: phone });
  },

  copyWechat() {
    const wechat = this.data.contacts.wechat;
    if (!wechat) return;
    wx.setClipboardData({ data: wechat, success: () => wx.showToast({ title: '微信号已复制', icon: 'success' }) });
  },

  copyEmail() {
    const email = this.data.contacts.email;
    if (!email) return;
    wx.setClipboardData({ data: email, success: () => wx.showToast({ title: '邮箱已复制', icon: 'success' }) });
  },

  toFeedback() {
    wx.navigateTo({ url: '/pages/feedback/index' });
  },

  onShareAppMessage() {
    return {
      title: '关于我们 - 移动应用开发社团',
      path: '/pages/aboutus/aboutus',
      imageUrl: '/images/cloud_dev.png'
    };
  },

  onShareTimeline() {
    return {
      title: '关于我们 - 移动应用开发社团',
      query: '',
      imageUrl: '/images/cloud_dev.png'
    };
  }
});