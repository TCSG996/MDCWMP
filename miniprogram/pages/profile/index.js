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
        const hasUserInfo = !!(loginResult.result.data && loginResult.result.data.hasUserInfo);
        return {
          isLoggedIn: hasUserInfo,
          hasUserInfo: hasUserInfo
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
      // 获取 code
      const codeRes = await new Promise((resolve, reject) => {
        wx.login({ success: resolve, fail: reject });
      });
      const code = codeRes.code;
      // 获取用户信息（优先 getUserProfile），失败则忽略，后续可在编辑资料中完善
      let userBase = null;
      try {
        if (this.data.canIUseGetUserProfile) {
          userBase = await this.getUserProfile();
        } else {
          userBase = await this.getUserInfo();
        }
      } catch (e) {
        // 非手势触发会报错：getUserProfile:fail can only be invoked by user TAP gesture.
        // 忽略该错误，仅使用 code 完成登录，头像昵称可后续再补。
        console.warn('get user profile skipped:', e && e.errMsg);
      }
      if (!code) throw new Error('获取code失败');
      // 云函数 code2Session + 入库（userInfo 可为空）
      const loginResult = await wx.cloud.callFunction({
        name: 'quickstartFunctions',
        data: { type: 'code2SessionLogin', code, userInfo: userBase }
      });
      if (loginResult && loginResult.result && loginResult.result.success) {
        wx.hideLoading();
        wx.showToast({ title: '登录成功', icon: 'success' });
        this.setData({ isLoggedIn: true, hasUserInfo: true });
        await this.loadUserInfo();
        await this.loadMyActivities();
      } else {
        throw new Error((loginResult && loginResult.result && loginResult.result.errMsg) || '登录失败');
      }
    } catch (error) {
      wx.hideLoading();
      console.error('微信登录失败:', error);
      wx.showToast({ title: '登录失败', icon: 'error' });
    }
  },

  // 获取用户信息（新版本API）
  getUserProfile() {
    return new Promise((resolve) => {
      wx.getUserProfile({
        desc: '用于完善用户资料',
        success: (res) => {
          resolve(res.userInfo);
        },
        fail: () => {
          // 非手势触发/用户拒绝：返回 null，后续登录流程可仅用 code 完成
          resolve(null);
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
        return {
          name: "",
          major: "",
          avatar: "/images/avatar.png"
        };
      }
    } catch (error) {
      console.error('获取用户信息失败:', error);
      return {
        name: "",
        major: "",
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
        // 处理活动数据，添加状态显示（动态计算）
        const activities = result.result.data.map(item => {
          const activity = item.activity[0] || {};
          return {
            _id: item._id,
            title: activity.title || "未知活动",
            startTime: activity.startTime || "",
            status: this.getActivityStatus(activity.status, item.status, activity.startTime, activity.endTime)
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

  // 获取活动状态（基于时间动态计算）
  getActivityStatus(activityStatus, registrationStatus, startTime, endTime) {
    const parseLocalDate = (str) => {
      if (!str || typeof str !== 'string') return null;
      const m = str.match(/^(\d{4})-(\d{2})-(\d{2})\s+(\d{2}):(\d{2})/);
      if (m) {
        const y = Number(m[1]);
        const mo = Number(m[2]) - 1;
        const d = Number(m[3]);
        const hh = Number(m[4]);
        const mm = Number(m[5]);
        return new Date(y, mo, d, hh, mm, 0, 0);
      }
      const dt = new Date(str);
      return isNaN(dt.getTime()) ? null : dt;
    };
    const now = new Date();
    const s = parseLocalDate(startTime);
    const e = parseLocalDate(endTime);
    if (s && now < s) return '未开始';
    if (e && now <= e) return '进行中';
    if (s || e) return '已结束';
    // 回退：没有时间信息时根据原始字段判断
    if (activityStatus === "已结束") return "已结束";
    if (activityStatus === "进行中") return "进行中";
    if (registrationStatus === "待审核") return "审核中";
    return "未开始";
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
      itemList: ['管理后台'],
      success: (res) => {
        switch (res.tapIndex) {
          case 0:
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

  openMessages() {
    if (!this.data.isLoggedIn) {
      this.wxLogin();
      return;
    }
    wx.navigateTo({ url: '/pages/messages/index' });
  },

  // 清理缓存
  clearCache() {
    wx.showModal({
      title: '清理缓存',
      content: '确定要清理本地缓存吗？',
      success: (res) => {
        if (res.confirm) {
          try {
            wx.clearStorageSync();
            wx.showToast({ title: '已清理', icon: 'success' });
          } catch (e) {
            wx.showToast({ title: '清理失败', icon: 'none' });
          }
        }
      }
    });
  },

  // 退出登录（仅影响本机UI，不删除云端账号）
  logout() {
    wx.showModal({
      title: '退出登录',
      content: '仅退出当前设备，保留云端账号，确定退出？',
      success: (res) => {
        if (res.confirm) {
          this.setData({
            isLoggedIn: false,
            hasUserInfo: false,
            userInfo: { name: '', major: '', avatar: '/images/avatar.png' },
            myActivities: []
          });
          wx.showToast({ title: '已退出', icon: 'success' });
        }
      }
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