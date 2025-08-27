// pages/my-activities/index.js
Page({
	data: {
		list: [],
		page: 1,
		pageSize: 10,
		hasMore: true,
		loading: false,
		initialLoading: true
	},

	onLoad(){
		this.loadList(true);
	},

	parseLocalDate(str){
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
	},

	computeStatus(start, end, original){
		const now = new Date();
		const s = this.parseLocalDate(start);
		const e = this.parseLocalDate(end);
		if (s && now < s) return '未开始';
		if (e && now <= e) return '进行中';
		if (s || e) return '已结束';
		return original || '未开始';
	},

	formatItem(item){
		const act = (item.activity && item.activity[0]) || {};
		const statusText = this.computeStatus(act.startTime, act.endTime, act.status);
		const statusClass = statusText === '已结束' ? 'over' : (statusText === '进行中' ? 'ing' : 'notyet');
		return {
			_regId: item._id,
			activityId: item.activityId,
			title: act.title || '未知活动',
			time: act.startTime || '',
			statusText,
			statusClass
		};
	},

	async loadList(refresh=false){
		if(this.data.loading) return;
		if(refresh){
			this.setData({ page:1, hasMore:true, list:[] });
		}
		if(!this.data.hasMore) return;
		this.setData({ loading:true });
		try{
			const res = await wx.cloud.callFunction({
				name:'quickstartFunctions',
				data:{ type:'getMyRegistrations', data:{ page:this.data.page, pageSize:this.data.pageSize } }
			});
			if(res && res.result && res.result.success){
				const rows = (res.result.data || []).map(this.formatItem.bind(this));
				const hasMore = rows.length === this.data.pageSize;
				this.setData({
					list: refresh ? rows : [...this.data.list, ...rows],
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

	loadMore(){ this.loadList(false); },

	onPullDownRefresh(){ this.loadList(true).then(()=>wx.stopPullDownRefresh()); },

	toDetail(e){
		const id = e.currentTarget.dataset.id;
		wx.navigateTo({ url: `/pages/activity-detail/index?id=${id}` });
	},

	cancelReg(e){
		const regId = e.currentTarget.dataset.id;
		wx.showModal({
			title:'确认取消',
			content:'确定要取消报名吗？',
			success: async (r)=>{
				if(r.confirm){
					try{
						wx.showLoading({ title:'取消中...' });
						const res = await wx.cloud.callFunction({ name:'quickstartFunctions', data:{ type:'cancelRegistration', data:{ _id: regId } } });
						if(res && res.result && res.result.success){
							wx.showToast({ title:'已取消', icon:'success' });
							this.loadList(true);
						}else{
							wx.showToast({ title: res.result.errMsg || '取消失败', icon:'none' });
						}
					}catch(err){
						wx.showToast({ title:'取消失败', icon:'none' });
					}finally{
						wx.hideLoading();
					}
				}
			}
		});
	}
}); 