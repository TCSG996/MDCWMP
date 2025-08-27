// pages/members/index.js
Page({
  data: {
    // 成员列表
    members: [],
    
    // 筛选状态
    groupFilter: "全部成员",
    groupOptions: ["全部成员", "2025级", "2024级", "2023级"],
    
    // 搜索
    searchKeyword: "",
    
    // 分页
    page: 1,
    pageSize: 10,
    hasMore: true,
    loading: false,
    
    // 加载状态
    initialLoading: true,
    
    // 用户权限
    isAdmin: false
  },

  onLoad(options) {
    this.loadMembers(true);
    this.checkUserPermission();
  },

  onShow() {
    // 每次显示页面时刷新数据
    this.loadMembers(true);
  },

  // 检查用户权限
  async checkUserPermission() {
    try {
      // 这里可以根据实际需求检查用户是否为管理员
      // 暂时设置为普通用户
      this.setData({
        isAdmin: false
      });
    } catch (error) {
      console.error('检查用户权限失败:', error);
    }
  },

  // 加载成员列表
  async loadMembers(refresh = false) {
    if (this.data.loading) return;
    
    if (refresh) {
      this.setData({
        page: 1,
        hasMore: true,
        members: []
      });
    }
    
    if (!this.data.hasMore) return;
    
    this.setData({ loading: true });
    
    try {
      const gradeFilter = this.data.groupFilter === "全部成员" ? "" : String(this.data.groupFilter).replace(/[^0-9]/g, '');
      const result = await wx.cloud.callFunction({
        name: 'quickstartFunctions',
        data: {
          type: 'getMembers',
          data: {
            grade: gradeFilter,
            search: this.data.searchKeyword,
            page: this.data.page,
            pageSize: this.data.pageSize
          }
        }
      });
      
      if (result.result.success) {
        const newMembers = result.result.data;
        const hasMore = newMembers.length === this.data.pageSize;
        
        this.setData({
          members: refresh ? newMembers : [...this.data.members, ...newMembers],
          hasMore: hasMore,
          page: this.data.page + 1
        });
      }
    } catch (error) {
      console.error('加载成员列表失败:', error);
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

  // 年级筛选
  onGroupFilterChange(e) {
    const group = e.currentTarget.dataset.group;
    this.setData({
      groupFilter: group
    });
    this.loadMembers(true);
  },

  // 搜索输入
  onSearchInput(e) {
    this.setData({
      searchKeyword: e.detail.value
    });
  },

  // 搜索确认
  onSearchConfirm() {
    this.loadMembers(true);
  },

  // 清空搜索
  onSearchClear() {
    this.setData({
      searchKeyword: ""
    });
    this.loadMembers(true);
  },

  // 成员点击
  onMemberTap(e) {
    const { id } = e.currentTarget.dataset;
    // 可以跳转到成员详情页面
    wx.showToast({
      title: '功能开发中',
      icon: 'none'
    });
  },

  // 成员操作菜单
  onMemberAction(e) {
    const { id, name } = e.currentTarget.dataset;
    
    if (!this.data.isAdmin) {
      wx.showToast({
        title: '权限不足',
        icon: 'none'
      });
      return;
    }
    
    wx.showActionSheet({
      itemList: ['查看详情', '编辑信息', '删除成员'],
      success: (res) => {
        switch (res.tapIndex) {
          case 0:
            this.viewMemberDetail(id);
            break;
          case 1:
            this.editMember(id);
            break;
          case 2:
            this.deleteMember(id, name);
            break;
        }
      }
    });
  },

  // 查看成员详情
  viewMemberDetail(memberId) {
    wx.showToast({
      title: '功能开发中',
      icon: 'none'
    });
  },

  // 编辑成员信息
  editMember(memberId) {
    wx.showToast({
      title: '功能开发中',
      icon: 'none'
    });
  },

  // 删除成员
  deleteMember(memberId, memberName) {
    wx.showModal({
      title: '确认删除',
      content: `确定要删除成员"${memberName}"吗？`,
      success: async (res) => {
        if (res.confirm) {
          try {
            wx.showLoading({
              title: '删除中...'
            });
            
            const result = await wx.cloud.callFunction({
              name: 'quickstartFunctions',
              data: {
                type: 'deleteMember',
                data: {
                  _id: memberId
                }
              }
            });
            
            if (result.result.success) {
              wx.showToast({
                title: '删除成功',
                icon: 'success'
              });
              this.loadMembers(true);
            } else {
              wx.showToast({
                title: result.result.errMsg || '删除失败',
                icon: 'none'
              });
            }
          } catch (error) {
            console.error('删除成员失败:', error);
            wx.showToast({
              title: '删除失败',
              icon: 'none'
            });
          } finally {
            wx.hideLoading();
          }
        }
      }
    });
  },

  // 添加新成员
  addMember() {
    if (!this.data.isAdmin) {
      wx.showToast({
        title: '权限不足',
        icon: 'none'
      });
      return;
    }
    
    wx.showToast({
      title: '功能开发中',
      icon: 'none'
    });
  },

  // 下拉刷新
  onPullDownRefresh() {
    this.loadMembers(true).then(() => {
      wx.stopPullDownRefresh();
    });
  },

  // 上拉加载更多
  onReachBottom() {
    if (this.data.hasMore && !this.data.loading) {
      this.loadMembers(false);
    }
  }
});