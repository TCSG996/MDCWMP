// index.js
Page({
  data: {
    // 社团信息
    clubInfo: {
      name: "移动应用开发社团",
      description: "专注于移动应用开发技术的学习与实践，致力于培养优秀的移动开发人才",
      memberCount: 0,
      activityCount: 0,
      myRegistrationCount: 0
    },
    
    // 轮播图数据
    bannerList: [],
    
    // 功能快捷入口
    quickActions: [
      {
        id: 1,
        title: "最新活动",
        icon: "/images/icons/activity.png",
        color: "#4A90E2",
        page: "/pages/activities/index"
      },
      {
        id: 2,
        title: "成员管理",
        icon: "/images/icons/member.png", 
        color: "#50C878",
        page: "/pages/members/index"
      },
      {
        id: 3,
        title: "我的报名",
        icon: "/images/icons/registration.png",
        color: "#FF6B35",
        page: "/pages/profile/index"
      },
      {
        id: 4,
        title: "管理后台",
        icon: "/images/icons/admin.png",
        color: "#9B59B6",
        page: "/pages/admin/index"
      }
    ],
    
    // 最新活动
    latestActivities: [],
    
    // 加载状态
    loading: true
  },

  onLoad() {
    this.initData();
  },

  onShow() {
    // 每次显示页面时刷新数据
    this.loadStatistics();
  },

  // 初始化数据
  async initData() {
    try {
      // 创建社团管理集合
      await this.createClubCollections();
      // 初始化测试数据
      await this.initTestData();
      // 初始化成员数据
      await this.initTestMembers();
      // 加载统计数据
      await this.loadStatistics();
      // 加载轮播
      await this.loadBanners();
      // 加载最新活动
      await this.loadLatestActivities();
    } catch (error) {
      console.error('初始化数据失败:', error);
      wx.showToast({
        title: '数据加载失败',
        icon: 'none'
      });
    } finally {
      this.setData({
        loading: false
      });
    }
  },

  // 创建社团管理集合
  async createClubCollections() {
    try {
      const result = await wx.cloud.callFunction({
        name: 'quickstartFunctions',
        data: {
          type: 'createClubCollections'
        }
      });
      
      if (result.result.success) {
        console.log('社团管理集合创建成功');
      }
    } catch (error) {
      console.error('创建集合失败:', error);
    }
  },

  // 初始化测试数据
  async initTestData() {
    try {
      const result = await wx.cloud.callFunction({
        name: 'quickstartFunctions',
        data: {
          type: 'initTestData'
        }
      });
      
      if (result.result.success) {
        console.log('测试数据初始化成功');
      }
    } catch (error) {
      console.error('初始化测试数据失败:', error);
    }
  },

  // 初始化成员数据
  async initTestMembers() {
    try {
      const result = await wx.cloud.callFunction({
        name: 'quickstartFunctions',
        data: {
          type: 'initTestMembers'
        }
      });
      
      if (result && result.result && result.result.success) {
        console.log('成员数据初始化成功');
      } else {
        console.log('成员数据初始化结果:', result);
      }
    } catch (error) {
      console.error('初始化成员数据失败:', error);
    }
  },

  // 加载统计数据
  async loadStatistics() {
    try {
      const result = await wx.cloud.callFunction({
        name: 'quickstartFunctions',
        data: {
          type: 'getStatistics'
        }
      });
      
      if (result.result.success) {
        const { activitiesCount, membersCount, myRegistrationsCount } = result.result.data;
        this.setData({
          'clubInfo.memberCount': membersCount,
          'clubInfo.activityCount': activitiesCount,
          'clubInfo.myRegistrationCount': myRegistrationsCount
        });
      }
    } catch (error) {
      console.error('加载统计数据失败:', error);
    }
  },

  // 加载轮播图
  async loadBanners() {
    try {
      const res = await wx.cloud.callFunction({ name: 'quickstartFunctions', data: { type: 'getBanners' } });
      if (res && res.result && res.result.success) {
        this.setData({ bannerList: res.result.data || [] });
      }
    } catch (e) {
      console.error('加载轮播失败:', e);
    }
  },

  // 加载最新活动
  async loadLatestActivities() {
    try {
      const result = await wx.cloud.callFunction({
        name: 'quickstartFunctions',
        data: {
          type: 'getActivities',
          data: {
            page: 1,
            pageSize: 3
          }
        }
      });
      
      if (result.result.success) {
        const computeStatus = (start, end, original) => {
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
          const s = parseLocalDate(start);
          const e = parseLocalDate(end);
          if (!s) return original || '未开始';
          if (now < s) return '未开始';
          if (e && now <= e) return '进行中';
          return '已结束';
        };
        const list = (result.result.data || []).map(a => ({ ...a, status: computeStatus(a.startTime, a.endTime, a.status) }));
        this.setData({
          latestActivities: list
        });
      }
    } catch (error) {
      console.error('加载最新活动失败:', error);
    }
  },

  // 轮播图点击事件
  onBannerTap(e) {
    const { index } = e.currentTarget.dataset;
    const banner = this.data.bannerList[index];
    
    if (banner.pagePath) {
      wx.navigateTo({ url: banner.pagePath });
      return;
    }
    if (banner.activityId) {
      wx.navigateTo({ url: `/pages/activity-detail/index?id=${banner.activityId}` });
      return;
    }
  },

  // 快捷入口点击事件
  onQuickActionTap(e) {
    const { page } = e.currentTarget.dataset;
    
    if (page) {
      wx.navigateTo({
        url: page
      });
    }
  },

  // 最新活动点击事件
  onActivityTap(e) {
    const { id } = e.currentTarget.dataset;
    
    wx.navigateTo({
      url: `/pages/activity-detail/index?id=${id}`
    });
  },

  // 下拉刷新
  onPullDownRefresh() {
    this.initData().then(() => {
      wx.stopPullDownRefresh();
    });
  }
});
