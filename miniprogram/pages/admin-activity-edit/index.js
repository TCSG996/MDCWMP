// pages/admin-activity-edit/index.js
Page({
  data: {
    id: '',
    form: {
      title: '',
      description: '',
      startTime: '',
      endTime: '',
      location: '',
      maxParticipants: 50,
      registrationDeadline: '',
      fee: '免费',
      status: '未开始',
      images: []
    },
    statusOptions: ['未开始','进行中','已结束'],
    statusIndex: 0,
    submitting: false
  },

  onLoad(options){
    if(options && options.id){
      this.setData({ id: options.id });
      this.loadDetail(options.id);
    }
  },

  async loadDetail(id){
    try{
      const res = await wx.cloud.callFunction({ name:'quickstartFunctions', data:{ type:'getActivityDetail', data:{ activityId:id } } });
      if(res && res.result && res.result.success){
        const act = res.result.data.activity || {};
        const idx = this.data.statusOptions.indexOf(act.status || '未开始');
        this.setData({
          form: {
            title: act.title || '',
            description: act.description || '',
            startTime: act.startTime || '',
            endTime: act.endTime || '',
            location: act.location || '',
            maxParticipants: act.maxParticipants || 50,
            registrationDeadline: act.registrationDeadline || '',
            fee: act.fee || '免费',
            status: act.status || '未开始',
            images: act.images || []
          },
          statusIndex: idx >=0 ? idx : 0
        });
      }
    }catch(e){
      wx.showToast({ title:'加载失败', icon:'none' });
    }
  },

  onInputTitle(e){ this.setData({ 'form.title': e.detail.value }); },
  onInputDescription(e){ this.setData({ 'form.description': e.detail.value }); },
  onInputStart(e){ this.setData({ 'form.startTime': e.detail.value }); },
  onInputEnd(e){ this.setData({ 'form.endTime': e.detail.value }); },
  onInputLocation(e){ this.setData({ 'form.location': e.detail.value }); },
  onInputMax(e){ this.setData({ 'form.maxParticipants': Number(e.detail.value || 0) }); },
  onInputDeadline(e){ this.setData({ 'form.registrationDeadline': e.detail.value }); },
  onInputFee(e){ this.setData({ 'form.fee': e.detail.value }); },
  onStatusChange(e){
    const i = Number(e.detail.value);
    this.setData({ statusIndex: i, 'form.status': this.data.statusOptions[i] });
  },

  chooseImages(){
    wx.chooseMedia({ count: 3, mediaType:['image'], success: async (res) => {
      try{
        wx.showLoading({ title:'上传中...' });
        const uploaded = [];
        for(const f of res.tempFiles){
          const cloudPath = `activity-images/${Date.now()}-${Math.floor(Math.random()*1000)}.png`;
          const r = await wx.cloud.uploadFile({ cloudPath, filePath: f.tempFilePath });
          uploaded.push(r.fileID);
        }
        this.setData({ 'form.images': [...this.data.form.images, ...uploaded] });
      }catch(err){
        wx.showToast({ title:'上传失败', icon:'none' });
      }finally{
        wx.hideLoading();
      }
    }});
  },

  validate(){
    const f = this.data.form;
    if(!f.title.trim()) return '请输入标题';
    if(!f.startTime.trim() || !f.endTime.trim()) return '请输入开始/结束时间';
    if(new Date(f.endTime) < new Date(f.startTime)) return '结束时间需大于开始时间';
    if(!f.location.trim()) return '请输入地点';
    if(!(f.maxParticipants>0)) return '人数上限需为正数';
    return '';
  },

  async onSubmit(){
    if(this.data.submitting) return;
    const msg = this.validate();
    if(msg){ wx.showToast({ title: msg, icon:'none' }); return; }
    this.setData({ submitting:true });
    try{
      const type = this.data.id ? 'updateActivity' : 'createActivity';
      const data = this.data.id ? { _id: this.data.id, ...this.data.form } : this.data.form;
      const res = await wx.cloud.callFunction({ name:'quickstartFunctions', data:{ type, data } });
      if(res && res.result && res.result.success){
        wx.showToast({ title:'保存成功', icon:'success' });
        setTimeout(()=> wx.navigateBack(), 600);
      }else{
        wx.showToast({ title: (res && res.result && res.result.errMsg) || '保存失败', icon:'none' });
      }
    }catch(e){
      wx.showToast({ title:'保存失败', icon:'none' });
    }finally{
      this.setData({ submitting:false });
    }
  }
}); 