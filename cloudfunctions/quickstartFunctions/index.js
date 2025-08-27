const cloud = require("wx-server-sdk");
cloud.init({
  env: cloud.DYNAMIC_CURRENT_ENV,
});

const db = cloud.database();

// 获取openid
const getOpenId = async () => {
  // 获取基础信息
  const wxContext = cloud.getWXContext();
  return {
    openid: wxContext.OPENID,
    appid: wxContext.APPID,
    unionid: wxContext.UNIONID,
  };
};

// 获取小程序二维码
const getMiniProgramCode = async () => {
  // 获取小程序二维码的buffer
  const resp = await cloud.openapi.wxacode.get({
    path: "pages/index/index",
  });
  const { buffer } = resp;
  // 将图片上传云存储空间
  const upload = await cloud.uploadFile({
    cloudPath: "code.png",
    fileContent: buffer,
  });
  return upload.fileID;
};

// 创建集合
const createCollection = async () => {
  try {
    // 创建集合
    await db.createCollection("sales");
    await db.collection("sales").add({
      // data 字段表示需新增的 JSON 数据
      data: {
        region: "华东",
        city: "上海",
        sales: 11,
      },
    });
    await db.collection("sales").add({
      // data 字段表示需新增的 JSON 数据
      data: {
        region: "华东",
        city: "南京",
        sales: 11,
      },
    });
    await db.collection("sales").add({
      // data 字段表示需新增的 JSON 数据
      data: {
        region: "华南",
        city: "广州",
        sales: 22,
      },
    });
    await db.collection("sales").add({
      // data 字段表示需新增的 JSON 数据
      data: {
        region: "华南",
        city: "深圳",
        sales: 22,
      },
    });
    return {
      success: true,
    };
  } catch (e) {
    // 这里catch到的是该collection已经存在，从业务逻辑上来说是运行成功的，所以catch返回success给前端，避免工具在前端抛出异常
    return {
      success: true,
      data: "create collection success",
    };
  }
};

// 查询数据
const selectRecord = async () => {
  // 返回数据库查询结果
  return await db.collection("sales").get();
};

// 更新数据
const updateRecord = async (event) => {
  try {
    // 遍历修改数据库信息
    for (let i = 0; i < event.data.length; i++) {
      await db
        .collection("sales")
        .where({
          _id: event.data[i]._id,
        })
        .update({
          data: {
            sales: event.data[i].sales,
          },
        });
    }
    return {
      success: true,
      data: event.data,
    };
  } catch (e) {
    return {
      success: false,
      errMsg: e,
    };
  }
};

// 新增数据
const insertRecord = async (event) => {
  try {
    const insertRecord = event.data;
    // 插入数据
    await db.collection("sales").add({
      data: {
        region: insertRecord.region,
        city: insertRecord.city,
        sales: Number(insertRecord.sales),
      },
    });
    return {
      success: true,
      data: event.data,
    };
  } catch (e) {
    return {
      success: false,
      errMsg: e,
    };
  }
};

// 删除数据
const deleteRecord = async (event) => {
  try {
    await db
      .collection("sales")
      .where({
        _id: event.data._id,
      })
      .remove();
    return {
      success: true,
    };
  } catch (e) {
    return {
      success: false,
      errMsg: e,
    };
  }
};

// ========== 社团管理功能 ==========

// 创建社团管理相关集合
const createClubCollections = async () => {
  try {
    // 创建活动集合
    await db.createCollection("activities");
    // 创建成员集合
    await db.createCollection("members");
    // 创建报名记录集合
    await db.createCollection("registrations");
    // 创建消息通知集合
    await db.createCollection("notifications");
    
    return {
      success: true,
      message: "社团管理集合创建成功"
    };
  } catch (e) {
    return {
      success: true,
      message: "集合已存在"
    };
  }
};

// 活动管理
const getActivities = async (event) => {
  try {
    const { status, page = 1, pageSize = 10, search = "" } = event.data || {};
    let query = db.collection("activities");
    
    // 状态筛选
    if (status && status !== "全部") {
      query = query.where({
        status: status
      });
    }
    
    // 搜索功能
    if (search) {
      query = query.where({
        title: db.RegExp({
          regexp: search,
          options: 'i'
        })
      });
    }
    
    // 分页
    const skip = (page - 1) * pageSize;
    const result = await query.skip(skip).limit(pageSize).orderBy('createTime', 'desc').get();
    
    return {
      success: true,
      data: result.data,
      total: result.data.length
    };
  } catch (e) {
    return {
      success: false,
      errMsg: e.message
    };
  }
};

const createActivity = async (event) => {
  try {
    const activityData = event.data;
    const wxContext = cloud.getWXContext();
    
    const result = await db.collection("activities").add({
      data: {
        ...activityData,
        createTime: new Date(),
        updateTime: new Date(),
        creatorId: wxContext.OPENID,
        status: "未开始"
      }
    });
    
    return {
      success: true,
      data: result
    };
  } catch (e) {
    return {
      success: false,
      errMsg: e.message
    };
  }
};

const updateActivity = async (event) => {
  try {
    const { _id, ...updateData } = event.data;
    
    await db.collection("activities").doc(_id).update({
      data: {
        ...updateData,
        updateTime: new Date()
      }
    });
    
    return {
      success: true
    };
  } catch (e) {
    return {
      success: false,
      errMsg: e.message
    };
  }
};

const deleteActivity = async (event) => {
  try {
    await db.collection("activities").doc(event.data._id).remove();
    
    // 同时删除相关的报名记录
    await db.collection("registrations").where({
      activityId: event.data._id
    }).remove();
    
    return {
      success: true
    };
  } catch (e) {
    return {
      success: false,
      errMsg: e.message
    };
  }
};

// 成员管理
const getMembers = async (event) => {
  try {
    const { page = 1, pageSize = 10, search = "", group = "" } = event.data || {};
    let query = db.collection("members");
    
    // 搜索功能
    if (search) {
      query = query.where({
        name: db.RegExp({
          regexp: search,
          options: 'i'
        })
      });
    }
    
    // 分组筛选
    if (group) {
      query = query.where({
        group: group
      });
    }
    
    const skip = (page - 1) * pageSize;
    const result = await query.skip(skip).limit(pageSize).orderBy('joinTime', 'desc').get();
    
    return {
      success: true,
      data: result.data,
      total: result.data.length
    };
  } catch (e) {
    return {
      success: false,
      errMsg: e.message
    };
  }
};

const addMember = async (event) => {
  try {
    const memberData = event.data;
    const wxContext = cloud.getWXContext();
    
    // 检查是否已经是成员
    const existingMember = await db.collection("members").where({
      openId: wxContext.OPENID
    }).get();
    
    if (existingMember.data.length > 0) {
      return {
        success: false,
        errMsg: "您已经是社团成员了"
      };
    }
    
    const result = await db.collection("members").add({
      data: {
        ...memberData,
        openId: wxContext.OPENID,
        joinTime: new Date(),
        status: "待审核"
      }
    });
    
    return {
      success: true,
      data: result
    };
  } catch (e) {
    return {
      success: false,
      errMsg: e.message
    };
  }
};

const updateMember = async (event) => {
  try {
    const { _id, ...updateData } = event.data;
    
    await db.collection("members").doc(_id).update({
      data: {
        ...updateData,
        updateTime: new Date()
      }
    });
    
    return {
      success: true
    };
  } catch (e) {
    return {
      success: false,
      errMsg: e.message
    };
  }
};

// 删除成员
const deleteMember = async (event) => {
  try {
    await db.collection("members").doc(event.data._id).remove();
    
    return {
      success: true
    };
  } catch (e) {
    return {
      success: false,
      errMsg: e.message
    };
  }
};

// 报名管理
const registerActivity = async (event) => {
  try {
    const { activityId } = event.data;
    const wxContext = cloud.getWXContext();
    
    // 检查是否已经报名
    const existingRegistration = await db.collection("registrations").where({
      activityId: activityId,
      openId: wxContext.OPENID
    }).get();
    
    if (existingRegistration.data.length > 0) {
      return {
        success: false,
        errMsg: "您已经报名过这个活动了"
      };
    }
    
    const result = await db.collection("registrations").add({
      data: {
        activityId: activityId,
        openId: wxContext.OPENID,
        registerTime: new Date(),
        status: "已报名"
      }
    });
    
    return {
      success: true,
      data: result
    };
  } catch (e) {
    return {
      success: false,
      errMsg: e.message
    };
  }
};

const getMyRegistrations = async (event) => {
  try {
    const wxContext = cloud.getWXContext();
    
    const result = await db.collection("registrations")
      .aggregate()
      .lookup({
        from: 'activities',
        localField: 'activityId',
        foreignField: '_id',
        as: 'activity'
      })
      .match({
        openId: wxContext.OPENID
      })
      .end();
    
    return {
      success: true,
      data: result.list
    };
  } catch (e) {
    return {
      success: false,
      errMsg: e.message
    };
  }
};

const cancelRegistration = async (event) => {
  try {
    const { _id } = event.data;
    const wxContext = cloud.getWXContext();
    
    await db.collection("registrations").doc(_id).update({
      data: {
        status: "已取消",
        cancelTime: new Date()
      }
    });
    
    return {
      success: true
    };
  } catch (e) {
    return {
      success: false,
      errMsg: e.message
    };
  }
};

// 获取活动详情
const getActivityDetail = async (event) => {
  try {
    const { activityId } = event.data;
    const wxContext = cloud.getWXContext();
    
    // 获取活动信息
    const activity = await db.collection("activities").doc(activityId).get();
    
    // 获取报名状态
    const registration = await db.collection("registrations").where({
      activityId: activityId,
      openId: wxContext.OPENID
    }).get();
    
    // 获取报名人数
    const registrationCount = await db.collection("registrations").where({
      activityId: activityId,
      status: "已报名"
    }).count();
    
    return {
      success: true,
      data: {
        activity: activity.data,
        myRegistration: registration.data[0] || null,
        registrationCount: registrationCount.total
      }
    };
  } catch (e) {
    return {
      success: false,
      errMsg: e.message
    };
  }
};

// 获取统计数据
const getStatistics = async () => {
  try {
    const wxContext = cloud.getWXContext();
    
    // 获取活动总数
    const activitiesCount = await db.collection("activities").count();
    
    // 获取成员总数
    const membersCount = await db.collection("members").where({
      status: "已通过"
    }).count();
    
    // 获取我的报名数
    const myRegistrationsCount = await db.collection("registrations").where({
      openId: wxContext.OPENID
    }).count();
    
    // 获取最新活动
    const latestActivities = await db.collection("activities")
      .orderBy('createTime', 'desc')
      .limit(3)
      .get();
    
    return {
      success: true,
      data: {
        activitiesCount: activitiesCount.total,
        membersCount: membersCount.total,
        myRegistrationsCount: myRegistrationsCount.total,
        latestActivities: latestActivities.data
      }
    };
  } catch (e) {
    return {
      success: false,
      errMsg: e.message
    };
  }
};

// 初始化测试数据
const initTestData = async () => {
  try {
    // 检查是否已有数据
    const existingActivities = await db.collection("activities").count();
    
    if (existingActivities.total > 0) {
      return {
        success: true,
        message: "数据已存在"
      };
    }
    
    // 创建测试活动数据
    const testActivities = [
      {
        title: "移动开发基础训练营",
        description: "面向初学者的移动应用开发入门课程，涵盖iOS和Android开发基础知识",
        startTime: "2024-08-27 14:00",
        endTime: "2024-08-27 18:00",
        location: "科技楼407室",
        maxParticipants: 30,
        registrationDeadline: "2024-08-26 18:00",
        fee: "免费",
        status: "进行中",
        contactPhone: "13800138000",
        contactWechat: "mobile_dev_club",
        images: ["/images/activity1.jpg"],
        createTime: new Date("2024-08-20"),
        updateTime: new Date("2024-08-20"),
        creatorId: "test_creator"
      },
      {
        title: "24小时编程马拉松",
        description: "挑战24小时连续编程，团队协作完成创新项目",
        startTime: "2024-09-15 09:00",
        endTime: "2024-09-16 09:00",
        location: "创新中心",
        maxParticipants: 50,
        registrationDeadline: "2024-09-14 18:00",
        fee: "50元",
        status: "未开始",
        contactPhone: "13900139000",
        contactWechat: "hackathon_club",
        images: ["/images/activity2.jpg"],
        createTime: new Date("2024-08-25"),
        updateTime: new Date("2024-08-25"),
        creatorId: "test_creator"
      },
      {
        title: "移动应用设计大赛",
        description: "展示你的创意，设计出优秀的移动应用界面和用户体验",
        startTime: "2024-08-30 14:00",
        endTime: "2024-08-30 17:00",
        location: "设计学院报告厅",
        maxParticipants: 20,
        registrationDeadline: "2024-08-29 18:00",
        fee: "免费",
        status: "未开始",
        contactPhone: "13700137000",
        contactWechat: "design_club",
        images: ["/images/activity3.jpg"],
        createTime: new Date("2024-08-22"),
        updateTime: new Date("2024-08-22"),
        creatorId: "test_creator"
      },
      {
        title: "Flutter跨平台开发分享会",
        description: "深入探讨Flutter框架，学习如何开发跨平台移动应用",
        startTime: "2024-08-25 19:00",
        endTime: "2024-08-25 21:00",
        location: "线上会议",
        maxParticipants: 100,
        registrationDeadline: "2024-08-24 18:00",
        fee: "免费",
        status: "已结束",
        contactPhone: "13600136000",
        contactWechat: "flutter_club",
        images: ["/images/activity4.jpg"],
        createTime: new Date("2024-08-18"),
        updateTime: new Date("2024-08-18"),
        creatorId: "test_creator"
      }
    ];
    
    // 批量插入活动数据
    for (const activity of testActivities) {
      await db.collection("activities").add({
        data: activity
      });
    }
    
    return {
      success: true,
      message: "测试数据创建成功"
    };
  } catch (e) {
    return {
      success: false,
      errMsg: e.message
    };
  }
};

// 初始化测试成员数据
const initTestMembers = async () => {
  try {
    // 检查是否已有数据
    const existingMembers = await db.collection("members").count();
    
    if (existingMembers.total > 0) {
      return {
        success: true,
        message: "成员数据已存在"
      };
    }
    
    // 创建测试成员数据
    const testMembers = [
      {
        name: "张明",
        major: "移动应用开发A2402班",
        grade: "2024",
        phone: "13800138001",
        email: "zhangming@example.com",
        avatar: "/images/avatar.png",
        status: "已通过",
        joinTime: new Date("2024-01-15"),
        updateTime: new Date("2024-01-15"),
        openId: "test_openid_1"
      },
      {
        name: "李华",
        major: "移动应用开发A2402班",
        grade: "2024",
        phone: "13800138002",
        email: "lihua@example.com",
        avatar: "/images/avatar.png",
        status: "已通过",
        joinTime: new Date("2024-01-20"),
        updateTime: new Date("2024-01-20"),
        openId: "test_openid_2"
      },
      {
        name: "王芳",
        major: "移动应用开发A2401班",
        grade: "2024",
        phone: "13800138003",
        email: "wangfang@example.com",
        avatar: "/images/avatar.png",
        status: "已通过",
        joinTime: new Date("2024-02-01"),
        updateTime: new Date("2024-02-01"),
        openId: "test_openid_3"
      },
      {
        name: "刘强",
        major: "移动应用开发A2403班",
        grade: "2024",
        phone: "13800138004",
        email: "liuqiang@example.com",
        avatar: "/images/avatar.png",
        status: "已通过",
        joinTime: new Date("2024-02-10"),
        updateTime: new Date("2024-02-10"),
        openId: "test_openid_4"
      },
      {
        name: "陈静",
        major: "移动应用开发A2401班",
        grade: "2024",
        phone: "13800138005",
        email: "chenjing@example.com",
        avatar: "/images/avatar.png",
        status: "已通过",
        joinTime: new Date("2024-02-15"),
        updateTime: new Date("2024-02-15"),
        openId: "test_openid_5"
      }
    ];
    
    // 批量插入成员数据
    for (const member of testMembers) {
      await db.collection("members").add({
        data: member
      });
    }
    
    return {
      success: true,
      message: "测试成员数据创建成功"
    };
  } catch (e) {
    return {
      success: false,
      errMsg: e.message
    };
  }
};

// 获取用户信息
const getUserInfo = async () => {
  try {
    const wxContext = cloud.getWXContext();
    
    // 从members集合中查找用户信息
    const userResult = await db.collection("members").where({
      openId: wxContext.OPENID
    }).get();
    
    if (userResult.data.length > 0) {
      const user = userResult.data[0];
      return {
        success: true,
        data: {
          name: user.name,
          major: user.major,
          avatar: user.avatar || "/images/avatar.png",
          grade: user.grade,
          phone: user.phone,
          email: user.email,
          status: user.status
        }
      };
    } else {
      // 如果用户不存在，返回默认信息
      return {
        success: true,
        data: {
          name: "张明",
          major: "移动应用开发A2402",
          avatar: "/images/avatar.png",
          grade: "2024",
          phone: "",
          email: "",
          status: "未注册"
        }
      };
    }
  } catch (e) {
    return {
      success: false,
      errMsg: e.message
    };
  }
};

// 获取用户统计数据
const getUserStatistics = async () => {
  try {
    const wxContext = cloud.getWXContext();
    
    // 获取参与活动数量
    const participatedCount = await db.collection("registrations").where({
      openId: wxContext.OPENID,
      status: "已报名"
    }).count();
    
    // 获取组织活动数量（作为创建者）
    const organizedCount = await db.collection("activities").where({
      creatorId: wxContext.OPENID
    }).count();
    
    // 获取未读消息数量（这里暂时返回固定值，实际应该从notifications集合获取）
    const unreadMessagesCount = 10;
    
    return {
      success: true,
      data: {
        participatedActivities: participatedCount.total,
        organizedActivities: organizedCount.total,
        unreadMessages: unreadMessagesCount
      }
    };
  } catch (e) {
    return {
      success: false,
      errMsg: e.message
    };
  }
};

// 检查用户登录状态
const checkUserLogin = async () => {
  try {
    const wxContext = cloud.getWXContext();
    
    // 检查用户是否在members集合中存在
    const userResult = await db.collection("members").where({
      openId: wxContext.OPENID
    }).get();
    
    if (userResult.data.length > 0) {
      const user = userResult.data[0];
      return {
        success: true,
        data: {
          hasUserInfo: true,
          userInfo: {
            name: user.name,
            major: user.major,
            avatar: user.avatar || "/images/avatar.png",
            grade: user.grade,
            phone: user.phone,
            email: user.email,
            status: user.status
          }
        }
      };
    } else {
      return {
        success: true,
        data: {
          hasUserInfo: false
        }
      };
    }
  } catch (e) {
    return {
      success: false,
      errMsg: e.message
    };
  }
};

// 微信登录
const wxLogin = async (event) => {
  try {
    const wxContext = cloud.getWXContext();
    const { userInfo } = event;
    
    // 检查用户是否已存在
    const existingUser = await db.collection("members").where({
      openId: wxContext.OPENID
    }).get();
    
    if (existingUser.data.length > 0) {
      // 用户已存在，更新信息
      const user = existingUser.data[0];
      await db.collection("members").doc(user._id).update({
        data: {
          avatar: userInfo.avatarUrl || user.avatar,
          updateTime: new Date()
        }
      });
      
      return {
        success: true,
        data: {
          message: "登录成功",
          userInfo: {
            name: user.name,
            major: user.major,
            avatar: userInfo.avatarUrl || user.avatar,
            grade: user.grade,
            phone: user.phone,
            email: user.email,
            status: user.status
          }
        }
      };
    } else {
      // 新用户，创建记录
      const newUser = {
        openId: wxContext.OPENID,
        name: userInfo.nickName || "新用户",
        major: "移动应用开发A2402",
        grade: "2024",
        phone: "",
        email: "",
        avatar: userInfo.avatarUrl || "/images/avatar.png",
        status: "已通过",
        joinTime: new Date(),
        updateTime: new Date()
      };
      
      const result = await db.collection("members").add({
        data: newUser
      });
      
      return {
        success: true,
        data: {
          message: "注册成功",
          userInfo: {
            name: newUser.name,
            major: newUser.major,
            avatar: newUser.avatar,
            grade: newUser.grade,
            phone: newUser.phone,
            email: newUser.email,
            status: newUser.status
          }
        }
      };
    }
  } catch (e) {
    return {
      success: false,
      errMsg: e.message
    };
  }
};

// 云函数入口函数
exports.main = async (event, context) => {
  switch (event.type) {
    case "getOpenId":
      return await getOpenId();
    case "getMiniProgramCode":
      return await getMiniProgramCode();
    case "createCollection":
      return await createCollection();
    case "selectRecord":
      return await selectRecord();
    case "updateRecord":
      return await updateRecord(event);
    case "insertRecord":
      return await insertRecord(event);
    case "deleteRecord":
      return await deleteRecord(event);
    
    // 社团管理功能
    case "createClubCollections":
      return await createClubCollections();
    case "initTestData":
      return await initTestData();
    case "initTestMembers":
      return await initTestMembers();
    case "getActivities":
      return await getActivities(event);
    case "createActivity":
      return await createActivity(event);
    case "updateActivity":
      return await updateActivity(event);
    case "deleteActivity":
      return await deleteActivity(event);
    case "getMembers":
      return await getMembers(event);
    case "addMember":
      return await addMember(event);
    case "updateMember":
      return await updateMember(event);
    case "deleteMember":
      return await deleteMember(event);
    case "registerActivity":
      return await registerActivity(event);
    case "getMyRegistrations":
      return await getMyRegistrations(event);
    case "cancelRegistration":
      return await cancelRegistration(event);
    case "getActivityDetail":
      return await getActivityDetail(event);
    case "getStatistics":
      return await getStatistics();
    case "getUserInfo":
      return await getUserInfo();
    case "getUserStatistics":
      return await getUserStatistics();
    case "checkUserLogin":
      return await checkUserLogin();
    case "wxLogin":
      return await wxLogin(event);
  }
};
