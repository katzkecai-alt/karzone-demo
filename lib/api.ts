// lib/api.ts
// ─────────────────────────────────────────────────────────
// Karzone 统一 API 调用层
//
// 【当前阶段】所有函数返回本地 mock 数据，模拟真实接口行为
// 【接入后端时】只需修改这一个文件，将 mock 数据替换为 fetch 请求
// 页面组件完全不需要改动
// ─────────────────────────────────────────────────────────

import type { VirtualCard, CardTransaction, OpenCardRequest } from "@/types/card"
import type { WalletBalance, WalletTransaction, DepositAddress } from "@/types/wallet"
import type { User, InviteStats } from "@/types/user"
import type { CardStats } from "@/types/stats"

import { mockUser, mockInviteStats } from "@/mock/user"
import { mockCards, mockTransactions } from "@/mock/cards"
import { mockWalletBalance, mockWalletTransactions, mockDepositAddresses } from "@/mock/wallet"
import { mockStatsOverall, mockStatsByBin } from "@/mock/stats"

// 模拟网络延迟（让 mock 更真实，也方便测试 loading 状态）
const delay = (ms = 600) => new Promise((resolve) => setTimeout(resolve, ms))

// ══════════════════════════════════════════════
// 用户相关接口
// ══════════════════════════════════════════════

// 获取当前登录用户信息
// 后端：GET /api/v1/user/me
export async function getUser(): Promise<User> {
  await delay()
  return mockUser
}

// 获取邀请统计数据
// 后端：GET /api/v1/user/invite-stats
export async function getInviteStats(): Promise<InviteStats> {
  await delay()
  return mockInviteStats
}

// ══════════════════════════════════════════════
// 钱包相关接口
// ══════════════════════════════════════════════

// 获取钱包余额
// 后端：GET /api/v1/wallet/balance
export async function getWalletBalance(): Promise<WalletBalance> {
  await delay()
  return mockWalletBalance
}

// 获取钱包流水记录
// 后端：GET /api/v1/wallet/transactions?page=1&size=20
export async function getWalletTransactions(): Promise<WalletTransaction[]> {
  await delay()
  return mockWalletTransactions
}

// 获取充值地址列表
// 后端：GET /api/v1/wallet/deposit-addresses
export async function getDepositAddresses(): Promise<DepositAddress[]> {
  await delay()
  return mockDepositAddresses
}

// 发起提现申请
// 后端：POST /api/v1/wallet/withdraw
export async function submitWithdraw(params: {
  address: string
  amount: number
  network: string
}): Promise<{ success: boolean; message: string }> {
  await delay(1000)
  console.log("[Mock] 提现申请：", params)
  return { success: true, message: "提现申请已提交，等待审核" }
}

// ══════════════════════════════════════════════
// 卡片相关接口
// ══════════════════════════════════════════════

// 获取我的卡片列表
// 后端：GET /api/v1/cards
export async function getCards(): Promise<VirtualCard[]> {
  await delay()
  return mockCards
}

// 获取单张卡片详情
// 后端：GET /api/v1/cards/:cardId
export async function getCardDetail(cardId: string): Promise<VirtualCard | null> {
  await delay()
  return mockCards.find((c) => c.id === cardId) ?? null
}

// 申请开卡
// 后端：POST /api/v1/cards/open
// → 后端调用 PhotonPay: POST /vcc/openApi/v4/openCard
export async function openCard(
  params: OpenCardRequest
): Promise<{ success: boolean; message: string }> {
  await delay(1500)
  console.log("[Mock] 申请开卡：", params)
  return { success: true, message: "开卡申请已提交，预计1分钟内到账" }
}

// 获取完整卡信息（敏感操作，需二次验证）
// 后端：GET /api/v1/cards/:cardId/sensitive-info
// 真实环境中完整卡号和 CVV 不写入业务数据库，只由发卡接口临时透传
// 当前固定数据只用于前端演示，页面会在 30 秒后自动隐藏
export async function getCardSensitiveInfo(
  cardId: string
): Promise<{ cardNumber: string; expiryDate: string; cvv: string }> {
  await delay(800)
  console.log("[Mock] 查询完整卡信息，cardId：", cardId)

  const card = mockCards.find((item) => item.id === cardId)
  const last4 = card?.displayNumber.slice(-4) ?? "0000"
  const prefix = card?.cardBin ?? "411111"

  return {
    cardNumber: `${prefix}111111${last4}`.replace(/(.{4})/g, "$1 ").trim(),
    expiryDate: card?.expiryDate ?? "12/29",
    cvv: "123",
  }
}

// 冻结/解冻卡片
// 后端：POST /api/v1/cards/:cardId/freeze
// → 后端调用 PhotonPay: POST /vcc/openApi/v4/freezeCard
export async function toggleCardFreeze(
  cardId: string,
  freeze: boolean
): Promise<{ success: boolean; message: string }> {
  await delay(800)
  console.log("[Mock] 冻结操作：", { cardId, freeze })
  return {
    success: true,
    message: freeze ? "卡片已冻结" : "卡片已解冻",
  }
}

// 销卡（不可逆操作）
// 后端：POST /api/v1/cards/:cardId/cancel
// → 后端调用 PhotonPay: POST /vcc/openApi/v4/cancelCard
export async function cancelCard(
  cardId: string
): Promise<{ success: boolean; message: string }> {
  await delay(1000)
  console.log("[Mock] 销卡：", cardId)
  return { success: true, message: "卡片已注销，余额将退回钱包" }
}

// 向卡片充值
// 后端：POST /api/v1/cards/:cardId/recharge
export async function rechargeCard(
  cardId: string,
  amount: number
): Promise<{ success: boolean; message: string }> {
  await delay(1000)
  console.log("[Mock] 卡片充值：", { cardId, amount })
  return { success: true, message: `已向卡片充值 $${amount}` }
}

// 从卡片余额提现回平台钱包
// 后端：POST /api/v1/cards/:cardId/withdraw
export async function withdrawCardBalance(
  cardId: string,
  amount: number
): Promise<{ success: boolean; message: string }> {
  await delay(1000)
  console.log("[Mock] 卡片提现：", { cardId, amount })
  return { success: true, message: `已从卡片提现 $${amount.toFixed(2)}` }
}

// ══════════════════════════════════════════════
// 卡片交易记录接口
// ══════════════════════════════════════════════

// 获取指定卡片的交易记录
// 后端：GET /api/v1/cards/:cardId/transactions
export async function getCardTransactions(
  cardId: string
): Promise<CardTransaction[]> {
  await delay()
  return mockTransactions.filter((t) => t.cardId === cardId)
}

// 获取全部卡片的交易汇总（用于"卡交易明细"页面）
// 后端：GET /api/v1/transactions?page=1&size=20
export async function getAllTransactions(): Promise<CardTransaction[]> {
  await delay()
  return mockTransactions
}

// ══════════════════════════════════════════════
// 用卡统计 + 风控数据
// 后端：GET /api/v1/stats/cards?bin=all
// bin 传 "all" 返回全部汇总，传具体 BIN 返回该卡段数据
// ══════════════════════════════════════════════
export async function getCardStats(bin = "all"): Promise<CardStats> {
  await delay(400)
  if (bin === "all") return mockStatsOverall
  return mockStatsByBin[bin] ?? mockStatsOverall
}

// ══════════════════════════════════════════════
// 可用卡段查询（开卡时展示选项）
// 后端：GET /api/v1/cards/bins
// → 后端调用 PhotonPay: GET /vcc/openApi/v4/getCardBin
// ══════════════════════════════════════════════
export async function getCardBins(): Promise<
  Array<{
    bin: string
    scheme: string
    currency: string
    cardType: string
    description: string
  }>
> {
  await delay()
  // mock 卡段数据，真实数据来自 PhotonPay
  return [
    { bin: "411111", scheme: "Visa", currency: "USD", cardType: "recharge", description: "Visa 美元卡（通用）" },
    { bin: "531111", scheme: "Mastercard", currency: "USD", cardType: "recharge", description: "Mastercard 美元卡" },
    { bin: "601111", scheme: "Discover", currency: "USD", cardType: "recharge", description: "Discover 美元卡" },
  ]
}
