// pages/profile-edit/index.js
Page({
	data: {
		form: {
			name: '',
			realName: '',
			studentId: '',
			major: '',
			phone: '',
			email: '',
			avatar: '/images/avatar.png',
			grade: ''
		},
		saving: false,
		gradeOptions: ['2025','2024','2023','2022','2021'],
		gradeIndex: 0
	},

	onLoad() {
		this.loadMyInfo();
	},

	async loadMyInfo() {
		try {
			const res = await wx.cloud.callFunction({
				name: 'quickstartFunctions',
				data: { type: 'getUserInfo' }
			});
			if (res && res.result && res.result.success) {
				const u = res.result.data || {};
				const options = this.data.gradeOptions;
				const idx = Math.max(0, options.indexOf(String(u.grade || '')));
				this.setData({
					form: {
						name: u.name || '',
						realName: u.realName || '',
						studentId: u.studentId || '',
						major: u.major || '',
						phone: u.phone || '',
						email: u.email || '',
						avatar: u.avatar || '/images/avatar.png',
						grade: String(u.grade || options[idx])
					},
					gradeIndex: idx
				});
			}
		} catch (e) {
			console.error('加载用户信息失败', e);
		}
	},

	onInputName(e){ this.setData({ 'form.name': e.detail.value }); },
	onInputRealName(e){ this.setData({ 'form.realName': e.detail.value }); },
	onInputStudentId(e){ this.setData({ 'form.studentId': e.detail.value }); },
	onInputMajor(e){ this.setData({ 'form.major': e.detail.value }); },
	onInputPhone(e){ this.setData({ 'form.phone': e.detail.value }); },
	onInputEmail(e){ this.setData({ 'form.email': e.detail.value }); },
	onGradeChange(e){
		const i = Number(e.detail.value);
		const val = this.data.gradeOptions[i];
		this.setData({ gradeIndex: i, 'form.grade': val });
	},

	chooseAvatar() {
		wx.chooseMedia({
			count: 1,
			mediaType: ['image'],
			sourceType: ['album','camera'],
			success: async (res) => {
				const filePath = res.tempFiles[0].tempFilePath;
				try {
					wx.showLoading({ title: '上传中...' });
					const cloudPath = `avatars/${Date.now()}-${Math.floor(Math.random()*1000)}.png`;
					const upload = await wx.cloud.uploadFile({ cloudPath, filePath });
					const fileID = upload.fileID;
					this.setData({ 'form.avatar': fileID });
				} catch (err) {
					wx.showToast({ title: '上传失败', icon: 'none' });
				} finally {
					wx.hideLoading();
				}
			}
		});
	},

	async onSave() {
		if (this.data.saving) return;
		this.setData({ saving: true });
		try {
			const { name, realName, studentId, major, phone, email, avatar, grade } = this.data.form;
			const res = await wx.cloud.callFunction({
				name: 'quickstartFunctions',
				data: {
					type: 'updateMyProfile',
					data: { name, realName, studentId, major, phone, email, avatar, grade }
				}
			});
			if (res && res.result && res.result.success) {
				wx.showToast({ title: '保存成功', icon: 'success' });
				setTimeout(() => wx.navigateBack(), 500);
			} else {
				wx.showToast({ title: res.result.errMsg || '保存失败', icon: 'none' });
			}
		} catch (e) {
			console.error('保存失败', e);
			wx.showToast({ title: '保存失败', icon: 'none' });
		} finally {
			this.setData({ saving: false });
		}
	}
}); 