// pages/activity-detail/index.js
Page({
  data: {
    // 活动ID
    activityId: "",
    
    // 活动详情
    activity: null,
    
    // 我的报名状态
    myRegistration: null,
    
    // 报名人数
    registrationCount: 0,
    
    // 加载状态
    loading: true
  },

  onLoad(options) {
    if (options.id) {
      this.setData({
        activityId: options.id
      });
      this.loadActivityDetail();
    }
  },

  // 分享给好友
  onShareAppMessage() {
    const { activity } = this.data;
    if (!activity) {
      return {
        title: '移动应用开发社团活动',
        path: '/pages/activities/index'
      };
    }
    
    return {
      title: activity.title,
      desc: activity.description,
      path: `/pages/activity-detail/index?id=${this.data.activityId}`,
      imageUrl: activity.images && activity.images.length > 0 ? activity.images[0] : '/images/share-default.png'
    };
  },

  // 分享到朋友圈
  onShareTimeline() {
    const { activity } = this.data;
    if (!activity) {
      return {
        title: '移动应用开发社团活动',
        query: '',
        imageUrl: '/images/share-default.png'
      };
    }
    
    return {
      title: activity.title,
      query: `id=${this.data.activityId}`,
      imageUrl: activity.images && activity.images.length > 0 ? activity.images[0] : '/images/share-default.png'
    };
  },

  // 加载活动详情
  async loadActivityDetail() {
    try {
      const result = await wx.cloud.callFunction({
        name: 'quickstartFunctions',
        data: {
          type: 'getActivityDetail',
          data: {
            activityId: this.data.activityId
          }
        }
      });
      
      if (result.result.success) {
        const { activity, myRegistration, registrationCount } = result.result.data;
        this.setData({
          activity: activity,
          myRegistration: myRegistration,
          registrationCount: registrationCount
        });
      }
    } catch (error) {
      console.error('加载活动详情失败:', error);
      wx.showToast({
        title: '加载失败',
        icon: 'none'
      });
    } finally {
      this.setData({
        loading: false
      });
    }
  },

  // 报名活动
  async registerActivity() {
    if (this.data.myRegistration) {
      wx.showToast({
        title: '您已经报名过了',
        icon: 'none'
      });
      return;
    }

    wx.showModal({
      title: '确认报名',
      content: '确定要报名参加这个活动吗？',
      success: async (res) => {
        if (res.confirm) {
          try {
            wx.showLoading({
              title: '报名中...'
            });
            
            const result = await wx.cloud.callFunction({
              name: 'quickstartFunctions',
              data: {
                type: 'registerActivity',
                data: {
                  activityId: this.data.activityId
                }
              }
            });
            
            if (result.result.success) {
              wx.showToast({
                title: '报名成功',
                icon: 'success'
              });
              // 重新加载详情
              this.loadActivityDetail();
            } else {
              wx.showToast({
                title: result.result.errMsg || '报名失败',
                icon: 'none'
              });
            }
          } catch (error) {
            console.error('报名失败:', error);
            wx.showToast({
              title: '报名失败',
              icon: 'none'
            });
          } finally {
            wx.hideLoading();
          }
        }
      }
    });
  },

  // 取消报名
  async cancelRegistration() {
    if (!this.data.myRegistration) {
      return;
    }

    wx.showModal({
      title: '确认取消',
      content: '确定要取消报名吗？',
      success: async (res) => {
        if (res.confirm) {
          try {
            wx.showLoading({
              title: '取消中...'
            });
            
            const result = await wx.cloud.callFunction({
              name: 'quickstartFunctions',
              data: {
                type: 'cancelRegistration',
                data: {
                  _id: this.data.myRegistration._id
                }
              }
            });
            
            if (result.result.success) {
              wx.showToast({
                title: '取消成功',
                icon: 'success'
              });
              // 重新加载详情
              this.loadActivityDetail();
            } else {
              wx.showToast({
                title: result.result.errMsg || '取消失败',
                icon: 'none'
              });
            }
          } catch (error) {
            console.error('取消失败:', error);
            wx.showToast({
              title: '取消失败',
              icon: 'none'
            });
          } finally {
            wx.hideLoading();
          }
        }
      }
    });
  },

  // 预览图片
  previewImage(e) {
    const { current } = e.currentTarget.dataset;
    const images = this.data.activity.images || [];
    
    wx.previewImage({
      current: current,
      urls: images
    });
  },

  // 拨打电话
  makePhoneCall() {
    if (this.data.activity.contactPhone) {
      wx.makePhoneCall({
        phoneNumber: this.data.activity.contactPhone
      });
    }
  },

  // 复制微信号
  copyWechat() {
    if (this.data.activity.contactWechat) {
      wx.setClipboardData({
        data: this.data.activity.contactWechat,
        success: () => {
          wx.showToast({
            title: '微信号已复制',
            icon: 'success'
          });
        }
      });
    }
  },

  // 分享活动
  shareActivity() {
    wx.showActionSheet({
      itemList: ['分享给好友', '分享到朋友圈', '复制链接'],
      success: (res) => {
        switch (res.tapIndex) {
          case 0:
            // 分享给好友 - 触发 onShareAppMessage
            wx.showToast({
              title: '请点击右上角分享',
              icon: 'none'
            });
            break;
          case 1:
            // 分享到朋友圈 - 触发 onShareTimeline
            wx.showToast({
              title: '请点击右上角分享到朋友圈',
              icon: 'none'
            });
            break;
          case 2:
            // 复制链接
            const shareUrl = `pages/activity-detail/index?id=${this.data.activityId}`;
            wx.setClipboardData({
              data: shareUrl,
              success: () => {
                wx.showToast({
                  title: '链接已复制',
                  icon: 'success'
                });
              }
            });
            break;
        }
      }
    });
  }
}); 