// 用户相关类型定义

// 会员等级
export type MemberLevel = "普通会员" | "VIP会员" | "共创会员" | "超级节点"

// 用户基本信息
export interface User {
  id: string
  email: string           // 脱敏：u***@gmail.com
  username: string        // 脱敏：用户****8888
  avatar?: string
  memberLevel: MemberLevel
  inviteCode: string      // 邀请码
  invitedBy?: string      // 上级邀请码
  twoFAEnabled: boolean
  kycStatus: "none" | "pending" | "approved" | "rejected"
  createdAt: string
}

// 邀请统计
export interface InviteStats {
  totalInvited: number        // 累计邀请人数
  cardOpenedCount: number     // 直推开卡数
  totalCommission: number     // 总返佣（USDT）
  todayCommission: number     // 昨日返佣
  commissionBreakdown: {
    openCard: number          // 开卡返佣
    spending: number          // 消费返佣
    activity: number          // 活动返佣
    points: number            // 积分返佣
  }
}
