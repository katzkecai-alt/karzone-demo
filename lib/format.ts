// 格式化工具函数
// 专门处理金额、卡号、日期的显示格式

// 格式化金额（保留两位小数，加千分位）
export function formatAmount(amount: number, currency = "USDT"): string {
  return `${amount.toFixed(2)} ${currency}`
}

// 格式化金额变化（加 + 或 - 号）
export function formatAmountChange(amount: number): string {
  const sign = amount >= 0 ? "+" : ""
  return `${sign}${amount.toFixed(2)}`
}

// 卡号脱敏（输入完整卡号，返回脱敏格式）
export function maskCardNumber(cardNumber: string): string {
  if (cardNumber.length < 4) return "****"
  const last4 = cardNumber.slice(-4)
  return `**** **** **** ${last4}`
}

// 格式化日期（ISO 字符串 → 可读格式）
export function formatDate(isoString: string): string {
  const date = new Date(isoString)
  return date.toLocaleDateString("zh-CN", {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  })
}

// 格式化日期时间
export function formatDateTime(isoString: string): string {
  const date = new Date(isoString)
  return date.toLocaleString("zh-CN", {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  })
}

// 卡片状态的中文显示
export function getCardStatusLabel(status: string): string {
  const map: Record<string, string> = {
    normal: "正常",
    frozen: "已冻结",
    cancelled: "已注销",
  }
  return map[status] ?? status
}

// 交易类型的中文显示
export function getTransactionTypeLabel(type: string): string {
  const map: Record<string, string> = {
    deposit: "充值入账",
    withdraw: "提现",
    card_recharge: "卡片充值",
    card_refund: "卡片退款",
    open_card_fee: "开卡手续费",
    commission: "返佣收入",
  }
  return map[type] ?? type
}
