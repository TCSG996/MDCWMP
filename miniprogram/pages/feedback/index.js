// pages/feedback/index.js
Page({
	data: {
		content: '',
		contact: '',
		submitting: false
	},

	onInputContent(e){ this.setData({ content: e.detail.value }); },
	onInputContact(e){ this.setData({ contact: e.detail.value }); },

	async onSubmit(){
		if(this.data.submitting) return;
		const content = (this.data.content || '').trim();
		if(!content){
			wx.showToast({ title:'请输入反馈内容', icon:'none' });
			return;
		}
		this.setData({ submitting:true });
		try{
			const res = await wx.cloud.callFunction({
				name:'quickstartFunctions',
				data:{ type:'submitFeedback', data:{ content, contact:this.data.contact } }
			});
			if(res && res.result && res.result.success){
				wx.showToast({ title:'提交成功', icon:'success' });
				setTimeout(()=> wx.navigateBack(), 500);
			}else{
				wx.showToast({ title: res.result.errMsg || '提交失败', icon:'none' });
			}
		}catch(e){
			wx.showToast({ title:'提交失败', icon:'none' });
		}finally{
			this.setData({ submitting:false });
		}
	}
}); 