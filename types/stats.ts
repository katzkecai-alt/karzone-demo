// 用卡统计与风控数据的类型定义

export interface CardStats {
  bin: string              // "all" = 全部汇总，其他值 = 指定卡BIN
  totalTransactions: number // 总交易笔数
  totalSpending: number     // 总消费金额（USD）
  successRate: number       // 成功率（0–100）
  failureRate: number       // 失败率（0–100）
  refundRate: number        // 退款率（0–100）
  cancellationRate: number  // 撤销率（0–100）
}
