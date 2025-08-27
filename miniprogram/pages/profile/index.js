// pages/profile/index.js
Page({
  data: {
    // 用户信息
    userInfo: {
      name: "张明",
      major: "移动应用开发A2402",
      avatar: "/images/avatar.png"
    },
    
    // 统计数据
    statistics: {
      participatedActivities: 10,
      organizedActivities: 6,
      unreadMessages: 10
    },
    
    // 我的活动
    myActivities: [],
    
    // 加载状态
    loading: true,
    
    // 登录状态
    isLoggedIn: false,
    hasUserInfo: false,
    canIUseGetUserProfile: false
  },

  onLoad(options) {
    // 检查是否支持 getUserProfile
    if (wx.getUserProfile) {
      this.setData({
        canIUseGetUserProfile: true
      });
    }
    
    this.checkLoginStatus();
  },

  onShow() {
    // 每次显示页面时检查登录状态
    this.checkLoginStatus();
  },

  // 检查登录状态
  async checkLoginStatus() {
    try {
      // 检查是否已登录
      const loginResult = await this.checkUserLogin();
      
      if (loginResult.isLoggedIn) {
        this.setData({
          isLoggedIn: true,
          hasUserInfo: loginResult.hasUserInfo
        });
        
        // 如果已登录，加载用户数据
        this.loadUserInfo();
        this.loadMyActivities();
      } else {
        this.setData({
          isLoggedIn: false,
          hasUserInfo: false,
          loading: false
        });
      }
    } catch (error) {
      console.error('检查登录状态失败:', error);
      this.setData({
        isLoggedIn: false,
        hasUserInfo: false,
        loading: false
      });
    }
  },

  // 检查用户登录状态
  async checkUserLogin() {
    try {
      // 检查微信登录状态
      const loginResult = await wx.cloud.callFunction({
        name: 'quickstartFunctions',
        data: {
          type: 'checkUserLogin'
        }
      });
      
      if (loginResult && loginResult.result && loginResult.result.success) {
        return {
          isLoggedIn: true,
          hasUserInfo: loginResult.result.data.hasUserInfo
        };
      } else {
        return {
          isLoggedIn: false,
          hasUserInfo: false
        };
      }
    } catch (error) {
      console.error('检查用户登录失败:', error);
      return {
        isLoggedIn: false,
        hasUserInfo: false
      };
    }
  },

  // 微信登录
  async wxLogin() {
    try {
      wx.showLoading({
        title: '登录中...'
      });
      
      // 获取用户信息
      let userInfo = null;
      
      if (this.data.canIUseGetUserProfile) {
        // 使用新版本API
        userInfo = await this.getUserProfile();
      } else {
        // 使用旧版本API
        userInfo = await this.getUserInfo();
      }
      
      if (userInfo) {
        // 调用云函数进行登录
        const loginResult = await wx.cloud.callFunction({
          name: 'quickstartFunctions',
          data: {
            type: 'wxLogin',
            userInfo: userInfo
          }
        });
        
        if (loginResult && loginResult.result && loginResult.result.success) {
          wx.hideLoading();
          wx.showToast({
            title: '登录成功',
            icon: 'success'
          });
          
          this.setData({
            isLoggedIn: true,
            hasUserInfo: true
          });
          
          // 登录成功后加载用户数据
          this.loadUserInfo();
          this.loadMyActivities();
        } else {
          throw new Error('登录失败');
        }
      }
    } catch (error) {
      wx.hideLoading();
      console.error('微信登录失败:', error);
      wx.showToast({
        title: '登录失败',
        icon: 'error'
      });
    }
  },

  // 获取用户信息（新版本API）
  getUserProfile() {
    return new Promise((resolve, reject) => {
      wx.getUserProfile({
        desc: '用于完善用户资料',
        success: (res) => {
          resolve(res.userInfo);
        },
        fail: (err) => {
          console.error('获取用户信息失败:', err);
          reject(err);
        }
      });
    });
  },

  // 获取用户信息（旧版本API）
  getUserInfo() {
    return new Promise((resolve, reject) => {
      wx.getUserInfo({
        success: (res) => {
          resolve(res.userInfo);
        },
        fail: (err) => {
          console.error('获取用户信息失败:', err);
          reject(err);
        }
      });
    });
  },

  // 加载用户信息
  async loadUserInfo() {
    try {
      // 获取用户基本信息
      const userInfo = await this.getUserInfoFromCloud();
      this.setData({
        userInfo: userInfo
      });
      
      // 获取统计数据
      const statistics = await this.getStatistics();
      this.setData({
        statistics: statistics
      });
    } catch (error) {
      console.error('加载用户信息失败:', error);
    }
  },

  // 从云端获取用户信息
  async getUserInfoFromCloud() {
    try {
      const result = await wx.cloud.callFunction({
        name: 'quickstartFunctions',
        data: {
          type: 'getUserInfo'
        }
      });
      
      if (result && result.result && result.result.success) {
        return result.result.data;
      } else {
        // 返回默认用户信息
        return {
          name: "张明",
          major: "移动应用开发A2402",
          avatar: "/images/avatar.png"
        };
      }
    } catch (error) {
      console.error('获取用户信息失败:', error);
      return {
        name: "张明",
        major: "移动应用开发A2402",
        avatar: "/images/avatar.png"
      };
    }
  },

  // 获取统计数据
  async getStatistics() {
    try {
      const result = await wx.cloud.callFunction({
        name: 'quickstartFunctions',
        data: {
          type: 'getUserStatistics'
        }
      });
      
      if (result && result.result && result.result.success) {
        return result.result.data;
      } else {
        // 返回默认统计数据
        return {
          participatedActivities: 10,
          organizedActivities: 6,
          unreadMessages: 10
        };
      }
    } catch (error) {
      console.error('获取统计数据失败:', error);
      return {
        participatedActivities: 10,
        organizedActivities: 6,
        unreadMessages: 10
      };
    }
  },

  // 加载我的活动
  async loadMyActivities() {
    try {
      const result = await wx.cloud.callFunction({
        name: 'quickstartFunctions',
        data: {
          type: 'getMyRegistrations',
          data: {
            page: 1,
            pageSize: 3
          }
        }
      });
      
      if (result && result.result && result.result.success) {
        // 处理活动数据，添加状态显示
        const activities = result.result.data.map(item => {
          const activity = item.activity[0] || {};
          return {
            _id: item._id,
            title: activity.title || "未知活动",
            startTime: activity.startTime || "",
            status: this.getActivityStatus(activity.status, item.status)
          };
        });
        
        this.setData({
          myActivities: activities,
          loading: false
        });
      }
    } catch (error) {
      console.error('加载我的活动失败:', error);
      // 设置默认活动数据
      this.setData({
        myActivities: [
          {
            _id: "1",
            title: "移动应用设计研讨会",
            startTime: "08/29 15:00",
            status: "进行中"
          },
          {
            _id: "2", 
            title: "24小时编程马拉松",
            startTime: "08/29 15:00",
            status: "已结束"
          },
          {
            _id: "3",
            title: "移动应用设计研讨会",
            startTime: "08/29 15:00",
            status: "审核中"
          }
        ],
        loading: false
      });
    }
  },

  // 获取活动状态
  getActivityStatus(activityStatus, registrationStatus) {
    if (activityStatus === "已结束") {
      return "已结束";
    } else if (activityStatus === "进行中") {
      return "进行中";
    } else if (registrationStatus === "待审核") {
      return "审核中";
    } else {
      return "未开始";
    }
  },

  // 查看我的活动
  viewMyActivities() {
    if (!this.data.isLoggedIn) {
      this.wxLogin();
      return;
    }
    
    wx.navigateTo({
      url: '/pages/my-activities/index'
    });
  },

  // 活动点击
  onActivityTap(e) {
    if (!this.data.isLoggedIn) {
      this.wxLogin();
      return;
    }
    
    const { id } = e.currentTarget.dataset;
    wx.navigateTo({
      url: `/pages/activity-detail/index?id=${id}`
    });
  },

  // 设置
  onSettings() {
    if (!this.data.isLoggedIn) {
      this.wxLogin();
      return;
    }
    
    wx.navigateTo({
      url: '/pages/settings/index'
    });
  },

  // 更多选项
  onMoreOptions() {
    if (!this.data.isLoggedIn) {
      this.wxLogin();
      return;
    }
    
    wx.showActionSheet({
      itemList: ['编辑资料', '消息中心', '帮助反馈', '关于我们', '管理后台'],
      success: (res) => {
        switch (res.tapIndex) {
          case 0:
            this.editProfile();
            break;
          case 1:
            this.messageCenter();
            break;
          case 2:
            this.helpFeedback();
            break;
          case 3:
            this.aboutUs();
            break;
          case 4:
            this.toAdmin();
            break;
        }
      }
    });
  },

  async toAdmin() {
    try {
      wx.showLoading({ title: '校验中...' });
      const res = await wx.cloud.callFunction({ name: 'quickstartFunctions', data: { type: 'checkIsAdmin' } });
      wx.hideLoading();
      if (res && res.result && res.result.success && res.result.data.isAdmin) {
        wx.navigateTo({ url: '/pages/admin/index' });
      } else {
        wx.showToast({ title: '无管理员权限', icon: 'none' });
      }
    } catch (e) {
      wx.hideLoading();
      wx.showToast({ title: '校验失败', icon: 'none' });
    }
  },

  // 编辑资料
  editProfile() {
    wx.navigateTo({
      url: '/pages/profile-edit/index'
    });
  },

  // 消息中心
  messageCenter() {
    wx.navigateTo({
      url: '/pages/messages/index'
    });
  },

  // 帮助反馈
  helpFeedback() {
    wx.navigateTo({
      url: '/pages/feedback/index'
    });
  },

  // 关于我们
  aboutUs() {
    wx.navigateTo({
      url: '../aboutus/aboutus'
    });
  },

  // 下拉刷新
  onPullDownRefresh() {
    if (this.data.isLoggedIn) {
      Promise.all([
        this.loadUserInfo(),
        this.loadMyActivities()
      ]).then(() => {
        wx.stopPullDownRefresh();
      });
    } else {
      wx.stopPullDownRefresh();
    }
  }
});