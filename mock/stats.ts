// 用卡统计 + 风控数据的模拟数据
// 真实场景中，这些数据由后端聚合计算后返回
// 接入后端时只需修改 lib/api.ts 中的 getCardStats 函数

import type { CardStats } from "@/types/stats"

// ── 全部卡汇总数据 ──
export const mockStatsOverall: CardStats = {
  bin: "all",
  totalTransactions: 32,
  totalSpending: 1847.50,
  successRate: 87.5,
  failureRate: 8.3,
  refundRate: 3.1,
  cancellationRate: 1.1,
}

// ── 按卡 BIN 分组的统计数据 ──
// Visa 卡（411111）整体表现更好，失败率低
// Mastercard（531111）失败率偏高，风险稍大，可以做对比演示
export const mockStatsByBin: Record<string, CardStats> = {
  "411111": {
    bin: "411111",
    totalTransactions: 19,
    totalSpending: 1264.70,
    successRate: 91.2,
    failureRate: 5.3,
    refundRate: 2.6,
    cancellationRate: 0.9,
  },
  "531111": {
    bin: "531111",
    totalTransactions: 13,
    totalSpending: 582.80,
    successRate: 82.1,
    failureRate: 12.5,
    refundRate: 4.1,
    cancellationRate: 1.3,
  },
}
