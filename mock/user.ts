// 模拟用户数据
// 注意：这些是假数据，用于开发阶段展示，不涉及任何真实信息

import type { User, InviteStats } from "@/types/user"

export const mockUser: User = {
  id: "user_001",
  email: "u***@gmail.com",
  username: "用户****8888",
  memberLevel: "普通会员",
  inviteCode: "7qydgm",
  twoFAEnabled: false,
  kycStatus: "none",
  createdAt: "2024-01-15T08:00:00Z",
}

export const mockInviteStats: InviteStats = {
  totalInvited: 0,
  cardOpenedCount: 0,
  totalCommission: 0,
  todayCommission: 0,
  commissionBreakdown: {
    openCard: 0,
    spending: 0,
    activity: 0,
    points: 0,
  },
}
