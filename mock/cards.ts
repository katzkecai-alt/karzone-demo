// 模拟卡片数据（8 张，覆盖 正常 / 冻结 / 已注销 三种状态）

import type { CardLifecycleEvent, CardLifecycleStatus, VirtualCard, CardTransaction } from "@/types/card"

// 工具：生成 N 天前的日期字符串（动态日期，筛选功能永远有效）
function daysAgo(n: number, hour = 10, minute = 0): string {
  const d = new Date()
  d.setDate(d.getDate() - n)
  d.setHours(hour, minute, 0, 0)
  return d.toISOString()
}

// ═════════════════════════════════════════════
// 6 张虚拟卡
// ═════════════════════════════════════════════
export const mockCards: VirtualCard[] = [
  // ── 卡1：Visa 主力卡，正常使用 ──
  {
    id: "card_001",
    displayNumber: "**** **** **** 4242",
    cardBin: "411111",
    scheme: "Visa",
    currency: "USD",
    balance: 128.50,
    status: "normal",
    alias: "主力消费卡",
    expiryDate: "09/28",
    formFactor: "virtual_card",
    provider: "photonpay",
    createdAt: daysAgo(180),
  },
  // ── 卡2：Mastercard 已冻结 ──
  {
    id: "card_002",
    displayNumber: "**** **** **** 5100",
    cardBin: "531111",
    scheme: "Mastercard",
    currency: "USD",
    balance: 0,
    status: "frozen",
    alias: "备用卡",
    expiryDate: "12/27",
    formFactor: "virtual_card",
    provider: "photonpay",
    createdAt: daysAgo(120),
  },
  // ── 卡3：Visa 欧元卡，正常 ──
  {
    id: "card_003",
    displayNumber: "**** **** **** 8888",
    cardBin: "411111",
    scheme: "Visa",
    currency: "EUR",
    balance: 45.80,
    status: "normal",
    alias: "欧元购物卡",
    expiryDate: "06/27",
    formFactor: "virtual_card",
    provider: "photonpay",
    createdAt: daysAgo(90),
  },
  // ── 卡4：Mastercard 广告投放，余额充足 ──
  {
    id: "card_004",
    displayNumber: "**** **** **** 3344",
    cardBin: "531111",
    scheme: "Mastercard",
    currency: "USD",
    balance: 210.00,
    status: "normal",
    alias: "广告投放卡",
    expiryDate: "03/29",
    formFactor: "virtual_card",
    provider: "marswallex",
    createdAt: daysAgo(60),
  },
  // ── 卡5：Visa 已注销，余额清零 ──
  {
    id: "card_005",
    displayNumber: "**** **** **** 7766",
    cardBin: "411111",
    scheme: "Visa",
    currency: "USD",
    balance: 0,
    status: "cancelled",
    alias: "旧测试卡",
    expiryDate: "11/24",
    formFactor: "virtual_card",
    provider: "photonpay",
    createdAt: daysAgo(365),
  },
  // ── 卡6：Mastercard 临时冻结，仍有余额 ──
  {
    id: "card_006",
    displayNumber: "**** **** **** 9900",
    cardBin: "531111",
    scheme: "Mastercard",
    currency: "USD",
    balance: 67.20,
    status: "frozen",
    alias: "临时冻结卡",
    expiryDate: "08/28",
    formFactor: "virtual_card",
    provider: "photonpay",
    createdAt: daysAgo(150),
  },
  // ── 卡7：Visa 跨境电商专用卡，余额充足 ──
  {
    id: "card_007",
    displayNumber: "**** **** **** 2233",
    cardBin: "411111",
    scheme: "Visa",
    currency: "USD",
    balance: 320.00,
    status: "normal",
    alias: "跨境电商卡",
    expiryDate: "05/29",
    formFactor: "virtual_card",
    provider: "photonpay",
    createdAt: daysAgo(45),
  },
  // ── 卡8：Mastercard 媒体买量卡，高消费卡 ──
  {
    id: "card_008",
    displayNumber: "**** **** **** 6677",
    cardBin: "531111",
    scheme: "Mastercard",
    currency: "USD",
    balance: 89.50,
    status: "normal",
    alias: "媒体买量卡",
    expiryDate: "11/28",
    formFactor: "virtual_card",
    provider: "marswallex",
    createdAt: daysAgo(30),
  },
]

// ═════════════════════════════════════════════
// 10 条交易记录（动态日期，覆盖各时间筛选段）
// ═════════════════════════════════════════════
const baseMockTransactions: CardTransaction[] = [
  // ── 今天 ──
  {
    id: "tx_001",
    cardId: "card_001",
    cardBin: "411111",
    merchant: "Netflix",
    merchantCategory: "订阅服务",
    amount: -15.99,
    currency: "USD",
    status: "settled",
    type: "purchase",
    createdAt: daysAgo(0, 9, 30),
  },
  {
    id: "tx_009",
    cardId: "card_003",
    cardBin: "411111",
    merchant: "Apple Store",
    merchantCategory: "数字内容",
    amount: -0.99,
    currency: "EUR",
    status: "settled",
    type: "purchase",
    createdAt: daysAgo(0, 11, 0),
  },

  // ── 近 7 天 ──
  {
    id: "tx_002",
    cardId: "card_002",
    cardBin: "531111",
    merchant: "Amazon",
    merchantCategory: "电商购物",
    amount: -89.99,
    currency: "USD",
    status: "pending",
    type: "purchase",
    createdAt: daysAgo(1, 14, 20),
  },
  {
    id: "tx_003",
    cardId: "card_001",
    cardBin: "411111",
    merchant: "Spotify",
    merchantCategory: "订阅服务",
    amount: -9.99,
    currency: "USD",
    status: "settled",
    type: "purchase",
    createdAt: daysAgo(3, 11, 5),
  },
  {
    id: "tx_010",
    cardId: "card_004",
    cardBin: "531111",
    merchant: "Adobe Creative Cloud",
    merchantCategory: "订阅服务",
    amount: -54.99,
    currency: "USD",
    status: "settled",
    type: "purchase",
    createdAt: daysAgo(2, 9, 0),
  },
  {
    id: "tx_004",
    cardId: "card_002",
    cardBin: "531111",
    merchant: "Shopify Store",
    merchantCategory: "电商购物",
    amount: -35.00,
    currency: "USD",
    status: "declined",
    type: "purchase",
    createdAt: daysAgo(6, 16, 45),
  },

  // ── 近 30 天 ──
  {
    id: "tx_005",
    cardId: "card_001",
    cardBin: "411111",
    merchant: "Karzone 充值",
    merchantCategory: "平台充值",
    amount: 200.00,
    currency: "USD",
    status: "settled",
    type: "recharge",
    createdAt: daysAgo(11, 10, 0),
  },
  {
    id: "tx_006",
    cardId: "card_001",
    cardBin: "411111",
    merchant: "Airbnb",
    merchantCategory: "住宿出行",
    amount: -120.00,
    currency: "USD",
    status: "settled",
    type: "purchase",
    createdAt: daysAgo(19, 18, 30),
  },
  {
    id: "tx_007",
    cardId: "card_002",
    cardBin: "531111",
    merchant: "Shopee",
    merchantCategory: "电商购物",
    amount: 25.00,
    currency: "USD",
    status: "refunded",
    type: "refund",
    createdAt: daysAgo(24, 8, 15),
  },

  // ── 新卡交易（card_007 / card_008）──
  {
    id: "tx_011",
    cardId: "card_007",
    cardBin: "411111",
    merchant: "DigitalOcean",
    merchantCategory: "云计算",
    amount: -29.99,
    currency: "USD",
    status: "settled",
    type: "purchase",
    createdAt: daysAgo(0, 8, 0),   // 今天
  },
  {
    id: "tx_012",
    cardId: "card_008",
    cardBin: "531111",
    merchant: "Meta Ads",
    merchantCategory: "广告投放",
    amount: -150.00,
    currency: "USD",
    status: "settled",
    type: "purchase",
    createdAt: daysAgo(3, 15, 30), // 3 天前
  },
  {
    id: "tx_013",
    cardId: "card_008",
    cardBin: "531111",
    merchant: "Google Ads",
    merchantCategory: "广告投放",
    amount: -280.00,
    currency: "USD",
    status: "settled",
    type: "purchase",
    createdAt: daysAgo(10, 9, 0),  // 本月
  },

  // ── 30 天以外 ──
  {
    id: "tx_008",
    cardId: "card_001",
    cardBin: "411111",
    merchant: "ChatGPT Plus",
    merchantCategory: "AI 订阅",
    amount: -20.00,
    currency: "USD",
    status: "settled",
    type: "purchase",
    createdAt: daysAgo(35, 22, 0),
  },
]

// 为列表中的每笔主交易补充授权、结算、退款等生命周期信息
// 页面仍然“一笔消费一行”，详细变化通过事件时间线展示
const LIFECYCLE_PRESETS: Record<string, {
  lifecycleStatus: CardLifecycleStatus
  authorizedAmount: number
  settledAmount: number
  refundedAmount: number
  amount?: number
  status?: CardTransaction["status"]
  type?: CardTransaction["type"]
}> = {
  tx_001: { lifecycleStatus: "settled", authorizedAmount: 15.99, settledAmount: 15.99, refundedAmount: 0 },
  tx_009: { lifecycleStatus: "verification_failed", authorizedAmount: 0, settledAmount: 0, refundedAmount: 0, amount: 0, status: "declined" },
  tx_002: { lifecycleStatus: "authorized", authorizedAmount: 89.99, settledAmount: 0, refundedAmount: 0 },
  tx_003: { lifecycleStatus: "partially_refunded", authorizedAmount: 9.99, settledAmount: 9.99, refundedAmount: 4, status: "refunded" },
  tx_010: { lifecycleStatus: "settled", authorizedAmount: 54.99, settledAmount: 54.99, refundedAmount: 0 },
  tx_004: { lifecycleStatus: "authorization_declined", authorizedAmount: 0, settledAmount: 0, refundedAmount: 0 },
  tx_005: { lifecycleStatus: "settled", authorizedAmount: 0, settledAmount: 200, refundedAmount: 0 },
  tx_006: { lifecycleStatus: "partially_settled", authorizedAmount: 150, settledAmount: 120, refundedAmount: 0 },
  tx_007: { lifecycleStatus: "refunded", authorizedAmount: 25, settledAmount: 25, refundedAmount: 25, amount: -25, type: "purchase" },
  tx_011: { lifecycleStatus: "settled", authorizedAmount: 29.99, settledAmount: 29.99, refundedAmount: 0 },
  tx_012: { lifecycleStatus: "reversed", authorizedAmount: 150, settledAmount: 0, refundedAmount: 0, amount: 0, status: "refunded" },
  tx_013: { lifecycleStatus: "disputed", authorizedAmount: 280, settledAmount: 280, refundedAmount: 0 },
  tx_008: { lifecycleStatus: "expired", authorizedAmount: 20, settledAmount: 0, refundedAmount: 0, amount: 0, status: "pending" },
}

function eventTime(base: string, hoursBefore: number): string {
  return new Date(new Date(base).getTime() - hoursBefore * 60 * 60 * 1000).toISOString()
}

function buildLifecycleEvents(transaction: CardTransaction, preset: typeof LIFECYCLE_PRESETS[string]): CardLifecycleEvent[] {
  const events: CardLifecycleEvent[] = []
  const id = transaction.id
  const amount = preset.authorizedAmount

  if (transaction.type !== "purchase") {
    return [{ id: `${id}_settlement`, stage: "settlement", status: "success", title: "资金操作已完成", description: "资金变动已经记入卡片余额。", amount: preset.settledAmount, createdAt: transaction.createdAt }]
  }

  if (preset.lifecycleStatus === "verification_failed") {
    return [{ id: `${id}_verification`, stage: "verification", status: "failed", title: "卡信息验证失败", description: "CVV、有效期或商户风控验证未通过，未发起资金授权。", createdAt: transaction.createdAt }]
  }

  events.push({ id: `${id}_verification`, stage: "verification", status: "success", title: "卡信息验证通过", description: "卡号、有效期及安全验证已通过。", createdAt: eventTime(transaction.createdAt, 3) })

  if (preset.lifecycleStatus === "authorization_declined") {
    events.push({ id: `${id}_authorization`, stage: "authorization", status: "failed", title: "授权被拒绝", description: "余额、卡片状态或风控规则未通过，未冻结资金。", createdAt: transaction.createdAt })
    return events
  }

  events.push({ id: `${id}_authorization`, stage: "authorization", status: "success", title: "授权已批准", description: "授权金额已从可用余额中冻结，等待商户提交结算。", amount, createdAt: eventTime(transaction.createdAt, 2) })

  if (preset.lifecycleStatus === "authorized") return events
  if (preset.lifecycleStatus === "reversed") {
    events.push({ id: `${id}_reversal`, stage: "reversal", status: "success", title: "授权已撤销", description: "商户撤销了未结算授权，冻结余额已经释放。", amount, createdAt: transaction.createdAt })
    return events
  }
  if (preset.lifecycleStatus === "expired") {
    events.push({ id: `${id}_expired`, stage: "reversal", status: "info", title: "授权已过期", description: "商户未在有效期内结算，冻结余额已经自动释放。", amount, createdAt: transaction.createdAt })
    return events
  }

  events.push({ id: `${id}_settlement`, stage: "settlement", status: "success", title: preset.lifecycleStatus === "partially_settled" ? "部分金额已结算" : "交易已结算", description: preset.lifecycleStatus === "partially_settled" ? "商户结算金额低于原授权金额，剩余授权将被释放。" : "商户已提交清算，金额正式记入卡片账单。", amount: preset.settledAmount, createdAt: eventTime(transaction.createdAt, 1) })

  if (preset.lifecycleStatus === "partially_settled") {
    events.push({ id: `${id}_partial_reversal`, stage: "reversal", status: "success", title: "剩余授权已释放", description: "未结算部分已经解除冻结。", amount: preset.authorizedAmount - preset.settledAmount, createdAt: transaction.createdAt })
  }
  if (preset.lifecycleStatus === "partially_refunded" || preset.lifecycleStatus === "refunded") {
    events.push({ id: `${id}_refund`, stage: "refund", status: "success", title: preset.lifecycleStatus === "refunded" ? "已全额退款" : "已部分退款", description: "退款作为关联入账记录返回卡片余额。", amount: preset.refundedAmount, createdAt: transaction.createdAt })
  }
  if (preset.lifecycleStatus === "disputed") {
    events.push({ id: `${id}_dispute`, stage: "dispute", status: "pending", title: "交易争议处理中", description: "持卡人已对结算交易发起争议，等待卡组织处理。", amount: preset.settledAmount, createdAt: transaction.createdAt })
  }
  return events
}

export const mockTransactions: CardTransaction[] = baseMockTransactions.map((transaction) => {
  const preset = LIFECYCLE_PRESETS[transaction.id]
  return {
    ...transaction,
    ...preset,
    lifecycleEvents: buildLifecycleEvents(transaction, preset),
  }
})
