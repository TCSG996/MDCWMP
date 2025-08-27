// pages/admin/index.js
Page({
  data: {
    tab: 'activities',
    activities: [],
    members: [],
    loading: false
  },

  async onLoad() {
    // 二次校验管理员
    try {
      wx.showLoading({ title: '加载中...' });
      const res = await wx.cloud.callFunction({ name: 'quickstartFunctions', data: { type: 'checkIsAdmin' } });
      if (!(res && res.result && res.result.success && res.result.data.isAdmin)) {
        wx.hideLoading();
        wx.showToast({ title: '无管理员权限', icon: 'none' });
        setTimeout(() => wx.navigateBack(), 600);
        return;
      }
      await this.refresh();
    } catch (e) {
      wx.showToast({ title: '校验失败', icon: 'none' });
      setTimeout(() => wx.navigateBack(), 600);
    } finally {
      wx.hideLoading();
    }
  },

  async refresh() {
    if (this.data.tab === 'activities') {
      await this.loadActivities();
    } else {
      await this.loadMembers();
    }
  },

  switchTab(e) {
    const t = e.currentTarget.dataset.tab;
    if (t === this.data.tab) return;
    this.setData({ tab: t }, () => this.refresh());
  },

  async loadActivities() {
    this.setData({ loading: true });
    try {
      const res = await wx.cloud.callFunction({ name: 'quickstartFunctions', data: { type: 'getActivities', data: { page: 1, pageSize: 50 } } });
      if (res && res.result && res.result.success) {
        this.setData({ activities: res.result.data || [] });
      }
    } catch (e) {
      wx.showToast({ title: '加载活动失败', icon: 'none' });
    } finally {
      this.setData({ loading: false });
    }
  },

  async loadMembers() {
    this.setData({ loading: true });
    try {
      const res = await wx.cloud.callFunction({ name: 'quickstartFunctions', data: { type: 'getMembers', data: { page: 1, pageSize: 50 } } });
      if (res && res.result && res.result.success) {
        this.setData({ members: res.result.data || [] });
      }
    } catch (e) {
      wx.showToast({ title: '加载成员失败', icon: 'none' });
    } finally {
      this.setData({ loading: false });
    }
  },

  openCreateActivity() {
    wx.navigateTo({ url: '/pages/admin-activity-edit/index' });
  },

  toEditActivity(e){
    const id = e.currentTarget.dataset.id;
    wx.navigateTo({ url: `/pages/admin-activity-edit/index?id=${id}` });
  },

  async openEditActivity(e) {
    const id = e.currentTarget.dataset.id;
    const act = this.data.activities.find(a => a._id === id);
    if (!act) return;
    // 简化：切换状态
    const nextStatus = act.status === '未开始' ? '进行中' : (act.status === '进行中' ? '已结束' : '未开始');
    try {
      wx.showLoading({ title: '更新中...' });
      const r = await wx.cloud.callFunction({ name: 'quickstartFunctions', data: { type: 'updateActivity', data: { _id: id, status: nextStatus } } });
      if (r && r.result && r.result.success) {
        wx.showToast({ title: '已更新', icon: 'success' });
        this.loadActivities();
      } else {
        wx.showToast({ title: r.result.errMsg || '更新失败', icon: 'none' });
      }
    } catch (e2) {
      wx.showToast({ title: '更新失败', icon: 'none' });
    } finally {
      wx.hideLoading();
    }
  },

  async deleteActivity(e) {
    const id = e.currentTarget.dataset.id;
    wx.showModal({
      title: '确认删除',
      content: '删除后不可恢复，且会清理报名记录，是否继续？',
      success: async (r) => {
        if (!r.confirm) return;
        try {
          wx.showLoading({ title: '删除中...' });
          const res = await wx.cloud.callFunction({ name: 'quickstartFunctions', data: { type: 'deleteActivity', data: { _id: id } } });
          if (res && res.result && res.result.success) {
            wx.showToast({ title: '已删除', icon: 'success' });
            this.loadActivities();
          } else {
            wx.showToast({ title: res.result.errMsg || '删除失败', icon: 'none' });
          }
        } catch (e) {
          wx.showToast({ title: '删除失败', icon: 'none' });
        } finally {
          wx.hideLoading();
        }
      }
    });
  },

  async approveMember(e) {
    const id = e.currentTarget.dataset.id;
    await this.updateMemberStatus(id, '已通过');
  },

  async rejectMember(e) {
    const id = e.currentTarget.dataset.id;
    await this.updateMemberStatus(id, '已拒绝');
  },

  async updateMemberStatus(id, status) {
    try {
      wx.showLoading({ title: '提交中...' });
      const res = await wx.cloud.callFunction({ name: 'quickstartFunctions', data: { type: 'updateMember', data: { _id: id, status } } });
      if (res && res.result && res.result.success) {
        wx.showToast({ title: '已更新', icon: 'success' });
        this.loadMembers();
      } else {
        wx.showToast({ title: res.result.errMsg || '操作失败', icon: 'none' });
      }
    } catch (e) {
      wx.showToast({ title: '操作失败', icon: 'none' });
    } finally {
      wx.hideLoading();
    }
  },

  async removeMember(e) {
    const id = e.currentTarget.dataset.id;
    wx.showModal({
      title: '确认删除',
      content: '确定要删除该成员吗？',
      success: async (r) => {
        if (!r.confirm) return;
        try {
          wx.showLoading({ title: '删除中...' });
          const res = await wx.cloud.callFunction({ name: 'quickstartFunctions', data: { type: 'deleteMember', data: { _id: id } } });
          if (res && res.result && res.result.success) {
            wx.showToast({ title: '已删除', icon: 'success' });
            this.loadMembers();
          } else {
            wx.showToast({ title: res.result.errMsg || '删除失败', icon: 'none' });
          }
        } catch (e) {
          wx.showToast({ title: '删除失败', icon: 'none' });
        } finally {
          wx.hideLoading();
        }
      }
    });
  }
});