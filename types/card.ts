// 虚拟卡相关类型定义
// 类型就像表格的"字段说明"，告诉代码每个数据是什么格式

// 卡片状态
export type CardStatus = "normal" | "frozen" | "cancelled"

// 卡组织（发卡组织）
export type CardScheme = "Visa" | "Mastercard" | "Discover"

// 卡片类型
export type CardFormFactor = "virtual_card" | "physical_card"

// 一笔卡消费在授权、结算和售后阶段的当前状态
export type CardLifecycleStatus =
  | "verification_failed"
  | "authorization_declined"
  | "authorized"
  | "reversed"
  | "expired"
  | "partially_settled"
  | "settled"
  | "partially_refunded"
  | "refunded"
  | "disputed"

// 详情时间线中的单个生命周期事件
export interface CardLifecycleEvent {
  id: string
  stage: "verification" | "authorization" | "reversal" | "settlement" | "refund" | "dispute"
  status: "success" | "pending" | "failed" | "info"
  title: string
  description: string
  amount?: number
  createdAt: string
}

// 卡片基本信息
export interface VirtualCard {
  id: string
  displayNumber: string   // 脱敏卡号：**** **** **** 1234
  cardBin: string         // 卡段：前6位
  scheme: CardScheme
  currency: string        // USD / EUR / GBP
  balance: number
  status: CardStatus
  alias: string           // 用户自定义卡片名称
  expiryDate: string      // 有效期：MM/YY
  formFactor: CardFormFactor
  provider: string        // 发卡商：photonpay / marswallex
  createdAt: string
}

// 卡片交易记录
export interface CardTransaction {
  id: string
  cardId: string
  cardBin: string               // 卡段前6位，用于按卡筛选
  merchant: string              // 商户名
  merchantCategory: string      // 商户类别
  amount: number                // 负数为消费，正数为退款/充值
  currency: string
  status: "settled" | "pending" | "declined" | "refunded"
  type: "purchase" | "refund" | "recharge" | "withdrawal"  // 交易类型
  createdAt: string
  lifecycleStatus?: CardLifecycleStatus
  authorizedAmount?: number  // 授权冻结金额
  settledAmount?: number     // 已正式结算金额
  refundedAmount?: number    // 已退回金额
  lifecycleEvents?: CardLifecycleEvent[]
}

// 开卡请求参数
export interface OpenCardRequest {
  cardBin: string
  currency: string
  alias?: string
  rechargeAmount: number        // 初始充值金额
}
