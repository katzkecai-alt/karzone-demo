// 模拟钱包数据

import type { WalletBalance, WalletTransaction, DepositAddress } from "@/types/wallet"

export const mockWalletBalance: WalletBalance = {
  currency: "USDT",
  amount: 1250.8,
  frozenAmount: 80,
  available: 1170.8,
}

// 生成相对日期，让“今天 / 近 7 天”等筛选始终有可测试的数据
function daysAgo(n: number, hour = 10, minute = 0): string {
  const date = new Date()
  date.setDate(date.getDate() - n)
  date.setHours(hour, minute, 0, 0)
  return date.toISOString()
}

export const mockWalletTransactions: WalletTransaction[] = [
  { id: "wallet_001", type: "deposit", amount: 500, currency: "USDT", status: "completed", txHash: "0x8a91...7f2c", note: "TRC20 充值", createdAt: daysAgo(0, 8, 20) },
  { id: "wallet_002", type: "card_recharge", amount: -120, currency: "USDT", status: "completed", note: "主力消费卡充值", createdAt: daysAgo(0, 9, 45) },
  { id: "wallet_003", type: "withdraw", amount: -80, currency: "USDT", status: "processing", txHash: "审核中", note: "TRC20 提现", createdAt: daysAgo(1, 16, 10) },
  { id: "wallet_004", type: "card_refund", amount: 45, currency: "USDT", status: "completed", note: "卡片余额退回", createdAt: daysAgo(2, 11, 30) },
  { id: "wallet_005", type: "commission", amount: 15.8, currency: "USDT", status: "completed", note: "邀请返佣", createdAt: daysAgo(4, 13, 5) },
  { id: "wallet_006", type: "open_card_fee", amount: -5, currency: "USDT", status: "completed", note: "虚拟卡开卡费", createdAt: daysAgo(8, 10, 0) },
  { id: "wallet_007", type: "deposit", amount: 1000, currency: "USDT", status: "completed", txHash: "0x31bd...09af", note: "ERC20 充值", createdAt: daysAgo(18, 18, 40) },
  { id: "wallet_008", type: "withdraw", amount: -200, currency: "USDT", status: "failed", txHash: "0xfailed", note: "地址风控拦截，资金已退回", createdAt: daysAgo(25, 14, 20) },
]

export const mockDepositAddresses: DepositAddress[] = [
  {
    currency: "USDT",
    network: "TRC20",
    address: "TXxx...xxxx（模拟地址，开发用）",
    minAmount: 1,
    confirmations: 1,
  },
  {
    currency: "USDT",
    network: "ERC20",
    address: "0xXX...XXXX（模拟地址，开发用）",
    minAmount: 10,
    confirmations: 12,
  },
]
