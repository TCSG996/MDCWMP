// pages/admin/index.js
Page({
  data: {
    tab: 'activities',
    activities: [],
    members: [],
    banners: [],
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
    } else if (this.data.tab === 'members') {
      await this.loadMembers();
    } else {
      await this.loadBanners();
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

  async loadBanners() {
    this.setData({ loading: true });
    try {
      const res = await wx.cloud.callFunction({ name: 'quickstartFunctions', data: { type: 'getBanners' } });
      if (res && res.result && res.result.success) {
        this.setData({ banners: res.result.data || [] });
      }
    } catch (e) {
      wx.showToast({ title: '加载轮播失败', icon: 'none' });
    } finally {
      this.setData({ loading: false });
    }
  },

  createBanner() {
    wx.showActionSheet({
      itemList: ['关联活动', '自定义页面路径'],
      success: async (r) => {
        // 简化：只做最小可用输入
        const title = `公告-${Date.now()}`;
        const base = { title, image: '', order: 0 };
        let data = base;
        if (r.tapIndex === 0) {
          // 提示输入活动ID
          wx.showModal({
            title: '关联活动',
            content: '请输入活动ID',
            editable: true,
            success: async (m) => {
              if (!m.confirm) return;
              data = { ...base, activityId: (m.content || '').trim() };
              await this._submitBannerCreate(data);
            }
          });
        } else {
          wx.showModal({
            title: '页面路径',
            content: '请输入跳转路径（如 /pages/activity-detail/index?id=xxx）',
            editable: true,
            success: async (m) => {
              if (!m.confirm) return;
              data = { ...base, pagePath: (m.content || '').trim() };
              await this._submitBannerCreate(data);
            }
          });
        }
      }
    });
  },

  async _submitBannerCreate(data) {
    try {
      wx.showLoading({ title: '提交中...' });
      const res = await wx.cloud.callFunction({ name: 'quickstartFunctions', data: { type: 'createBanner', data } });
      if (res && res.result && res.result.success) {
        wx.showToast({ title: '已添加', icon: 'success' });
        this.loadBanners();
      } else {
        wx.showToast({ title: (res && res.result && res.result.errMsg) || '添加失败', icon: 'none' });
      }
    } catch (e) {
      wx.showToast({ title: '添加失败', icon: 'none' });
    } finally {
      wx.hideLoading();
    }
  },

  editBanner(e) {
    const id = e.currentTarget.dataset.id;
    const item = this.data.banners.find(b => b._id === id);
    if (!item) return;
    wx.showActionSheet({
      itemList: ['修改标题', '修改顺序', '修改跳转'],
      success: async (r) => {
        if (r.tapIndex === 0) {
          wx.showModal({ title: '标题', content: item.title || '', editable: true, success: async (m) => {
            if (!m.confirm) return; await this._updateBanner(id, { title: m.content }); } });
        } else if (r.tapIndex === 1) {
          wx.showModal({ title: '顺序(数字越小越靠前)', content: String(item.order || 0), editable: true, success: async (m) => {
            if (!m.confirm) return; await this._updateBanner(id, { order: Number(m.content || 0) }); } });
        } else {
          wx.showModal({ title: '跳转路径或活动ID', content: item.pagePath || item.activityId || '', editable: true, success: async (m) => {
            if (!m.confirm) return; const v=(m.content||'').trim(); const upd = v.startsWith('/')? { pagePath:v, activityId:'' } : { activityId:v, pagePath:'' }; await this._updateBanner(id, upd); } });
        }
      }
    });
  },

  async _updateBanner(id, data) {
    try {
      wx.showLoading({ title: '更新中...' });
      const res = await wx.cloud.callFunction({ name: 'quickstartFunctions', data: { type: 'updateBanner', data: { _id:id, ...data } } });
      if (res && res.result && res.result.success) {
        wx.showToast({ title: '已更新', icon: 'success' });
        this.loadBanners();
      } else {
        wx.showToast({ title: (res && res.result && res.result.errMsg) || '更新失败', icon: 'none' });
      }
    } catch (e) {
      wx.showToast({ title: '更新失败', icon: 'none' });
    } finally {
      wx.hideLoading();
    }
  },

  async deleteBanner(e) {
    const id = e.currentTarget.dataset.id;
    wx.showModal({
      title: '确认删除',
      content: '确定删除该轮播吗？',
      success: async (r) => {
        if (!r.confirm) return;
        try {
          wx.showLoading({ title: '删除中...' });
          const res = await wx.cloud.callFunction({ name:'quickstartFunctions', data:{ type:'deleteBanner', data:{ _id:id } } });
          if (res && res.result && res.result.success) {
            wx.showToast({ title: '已删除', icon: 'success' });
            this.loadBanners();
          } else {
            wx.showToast({ title: (res && res.result && res.result.errMsg) || '删除失败', icon: 'none' });
          }
        } catch (e) {
          wx.showToast({ title: '删除失败', icon: 'none' });
        } finally {
          wx.hideLoading();
        }
      }
    });
  },

  changeBannerImage(e) {
    const id = e.currentTarget.dataset.id;
    wx.chooseMedia({ count:1, mediaType:['image'], success: async (res)=>{
      try {
        wx.showLoading({ title:'上传中...' });
        const filePath = res.tempFiles[0].tempFilePath;
        const cloudPath = `banners/${Date.now()}-${Math.floor(Math.random()*1000)}.png`;
        const up = await wx.cloud.uploadFile({ cloudPath, filePath });
        const fileID = up.fileID;
        await this._updateBanner(id, { image: fileID });
      } catch (err) {
        wx.showToast({ title:'上传失败', icon:'none' });
      } finally {
        wx.hideLoading();
      }
    }});
  },

  openCreateActivity() {
    wx.navigateTo({ url: '/pages/admin-activity-edit/index' });
  },

  toEditActivity(e){
    const id = e.currentTarget.dataset.id;
    wx.navigateTo({ url: `/pages/admin-activity-edit/index?id=${id}` });
  },

  copyId(e){
    const id = e.currentTarget.dataset.id;
    if(!id) return;
    wx.setClipboardData({ data: id, success: ()=> wx.showToast({ title:'已复制', icon:'success' }) });
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