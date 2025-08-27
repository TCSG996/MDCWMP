// pages/messages/index.js
Page({
	data: {
		messages: [],
		page: 1,
		pageSize: 10,
		hasMore: true,
		loading: false,
		initialLoading: true
	},

	onLoad(){
		this.loadMessages(true);
	},

	async loadMessages(refresh=false){
		if(this.data.loading) return;
		if(refresh){
			this.setData({ page:1, hasMore:true, messages:[] });
		}
		if(!this.data.hasMore) return;
		this.setData({ loading:true });
		try{
			const res = await wx.cloud.callFunction({
				name:'quickstartFunctions',
				data:{ type:'getMyNotifications', data:{ page:this.data.page, pageSize:this.data.pageSize } }
			});
			if(res && res.result && res.result.success){
				const items = (res.result.data || []).map(n=>({
					...n,
					createTime: n.createTime ? new Date(n.createTime).toLocaleString() : ''
				}));
				const hasMore = items.length === this.data.pageSize;
				this.setData({
					messages: refresh ? items : [...this.data.messages, ...items],
					hasMore,
					page: this.data.page + 1
				});
			}
		}catch(e){
			wx.showToast({ title:'加载失败', icon:'none' });
		}finally{
			this.setData({ loading:false, initialLoading:false });
		}
	},

	loadMore(){
		this.loadMessages(false);
	},

	onPullDownRefresh(){
		this.loadMessages(true).then(()=>wx.stopPullDownRefresh());
	},

	onLongPress(e){
		const id = e.currentTarget.dataset.id;
		wx.showActionSheet({
			itemList:['标记为已读'],
			success: async (res)=>{
				if(res.tapIndex === 0){
					try{
						await wx.cloud.callFunction({ name:'quickstartFunctions', data:{ type:'markNotificationRead', data:{ _id:id } } });
						this.setData({ messages: this.data.messages.map(m => m._id===id ? { ...m, read:true } : m) });
					}catch(err){
						wx.showToast({ title:'操作失败', icon:'none' });
					}
				}
			}
		});
	}
}); 