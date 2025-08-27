// pages/activities/index.js
Page({
  data: {
    // 活动列表
    activities: [],
    
    // 筛选状态
    statusFilter: "全部",
    statusOptions: ["全部", "未开始", "进行中", "已结束"],
    
    // 搜索
    searchKeyword: "",
    
    // 分页
    page: 1,
    pageSize: 10,
    hasMore: true,
    loading: false,
    
    // 加载状态
    initialLoading: true
  },

  onLoad() {
    this.loadActivities(true);
  },

  onShow() {
    // 每次显示页面时刷新数据
    this.loadActivities(true);
  },

  // 动态计算状态
  computeStatus(start, end, original) {
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
  },

  // 加载活动列表
  async loadActivities(refresh = false) {
    if (this.data.loading) return;
    
    if (refresh) {
      this.setData({
        page: 1,
        hasMore: true,
        activities: []
      });
    }
    
    if (!this.data.hasMore) return;
    
    this.setData({ loading: true });
    
    try {
      const result = await wx.cloud.callFunction({
        name: 'quickstartFunctions',
        data: {
          type: 'getActivities',
          data: {
            status: this.data.statusFilter === "全部" ? "" : this.data.statusFilter,
            search: this.data.searchKeyword,
            page: this.data.page,
            pageSize: this.data.pageSize
          }
        }
      });
      
      if (result.result.success) {
        const newActivities = (result.result.data || []).map(a => ({
          ...a,
          image: (a.images && a.images.length > 0) ? a.images[0] : '',
          status: this.computeStatus(a.startTime, a.endTime, a.status)
        }));
        const hasMore = newActivities.length === this.data.pageSize;
        
        this.setData({
          activities: refresh ? newActivities : [...this.data.activities, ...newActivities],
          hasMore: hasMore,
          page: this.data.page + 1
        });
      }
    } catch (error) {
      console.error('加载活动列表失败:', error);
      wx.showToast({
        title: '加载失败',
        icon: 'none'
      });
    } finally {
      this.setData({ 
        loading: false,
        initialLoading: false
      });
    }
  },

  // 状态筛选
  onStatusFilterChange(e) {
    const status = e.currentTarget.dataset.status;
    this.setData({
      statusFilter: status
    });
    this.loadActivities(true);
  },

  // 搜索输入
  onSearchInput(e) {
    this.setData({
      searchKeyword: e.detail.value
    });
  },

  // 搜索确认
  onSearchConfirm() {
    this.loadActivities(true);
  },

  // 清空搜索
  onSearchClear() {
    this.setData({
      searchKeyword: ""
    });
    this.loadActivities(true);
  },

  // 活动点击
  onActivityTap(e) {
    const { id } = e.currentTarget.dataset;
    wx.navigateTo({
      url: `/pages/activity-detail/index?id=${id}`
    });
  },

  // 下拉刷新
  onPullDownRefresh() {
    this.loadActivities(true).then(() => {
      wx.stopPullDownRefresh();
    });
  },

  // 上拉加载更多
  onReachBottom() {
    if (this.data.hasMore && !this.data.loading) {
      this.loadActivities(false);
    }
  }
}); 