// 全局常量
// 这里存放整个项目通用的固定值

// 平台名称（品牌已确认为 Karzone）
export const PLATFORM_NAME = "Karzone"
export const PLATFORM_TAGLINE = "欢迎使用 Karzone，您的专业虚拟信用卡与支付管理平台"

// 支持的充值网络
export const SUPPORTED_NETWORKS = [
  { name: "TRC20", currency: "USDT", confirmations: 1, minAmount: 1 },
  { name: "ERC20", currency: "USDT", confirmations: 12, minAmount: 10 },
]

// 卡片状态颜色映射（用于 Badge 组件）
export const CARD_STATUS_COLORS = {
  normal: "bg-emerald-50 text-emerald-600",
  frozen: "bg-amber-50 text-amber-600",
  cancelled: "bg-red-50 text-red-600",
} as const

// 交易状态颜色映射
export const TX_STATUS_COLORS = {
  settled: "bg-emerald-50 text-emerald-600",
  pending: "bg-amber-50 text-amber-600",
  declined: "bg-red-50 text-red-600",
  refunded: "bg-blue-50 text-blue-600",
} as const

// CVV 展示倒计时（秒）
export const CVV_DISPLAY_SECONDS = 30
