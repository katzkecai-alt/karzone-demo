// 钱包相关类型定义

// 钱包余额
export interface WalletBalance {
  currency: string      // USDT
  amount: number
  frozenAmount: number  // 冻结中的金额（如：提现审核中）
  available: number     // 可用余额 = amount - frozenAmount
}

// 充提币流水类型
export type TransactionType =
  | "deposit"         // 充值
  | "withdraw"        // 提现
  | "card_recharge"   // 向卡充值
  | "card_refund"     // 卡退款回钱包
  | "open_card_fee"   // 开卡手续费
  | "commission"      // 返佣收入

// 流水状态
export type TransactionStatus = "pending" | "processing" | "completed" | "failed"

// 钱包流水记录
export interface WalletTransaction {
  id: string
  type: TransactionType
  amount: number        // 正数为入账，负数为出账
  currency: string      // USDT
  status: TransactionStatus
  txHash?: string       // 区块链交易哈希（充提币时有）
  note?: string         // 备注
  createdAt: string
}

// 充值地址
export interface DepositAddress {
  currency: string      // USDT
  network: string       // TRC20 / ERC20
  address: string       // 钱包地址
  minAmount: number     // 最低充值金额
  confirmations: number // 所需确认数
}
