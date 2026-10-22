"use client"

import { useState, useEffect } from "react"
import {
  Activity,
  DollarSign,
  TrendingUp,
  XCircle,
  RotateCcw,
  MinusCircle,
  ChevronDown,
} from "lucide-react"
import { Skeleton } from "@/components/ui/skeleton"
import { getCardStats, getCards } from "@/lib/api"
import type { CardStats } from "@/types/stats"
import type { VirtualCard } from "@/types/card"

// ─────────────────────────────────────────────
// 风控指标配置
// 把每个指标的"外观属性"集中在这里，避免写重复代码
// ─────────────────────────────────────────────
const RISK_METRICS = [
  {
    key: "failureRate" as keyof CardStats,
    label: "失败率",
    icon: XCircle,
    // 参考阈值：失败率超过 25% 算严重
    // 进度条宽度 = (实际值 / 25) × 100%，超过 25% 则显示满格
    refMax: 25,
    colors: {
      iconBg:   "bg-red-50",
      icon:     "text-red-500",
      bar:      "bg-red-400",
      barBg:    "bg-red-100",
      value:    "text-red-600",
    },
  },
  {
    key: "refundRate" as keyof CardStats,
    label: "退款率",
    icon: RotateCcw,
    refMax: 15,
    colors: {
      iconBg:   "bg-amber-50",
      icon:     "text-amber-500",
      bar:      "bg-amber-400",
      barBg:    "bg-amber-100",
      value:    "text-amber-600",
    },
  },
  {
    key: "cancellationRate" as keyof CardStats,
    label: "撤销率",
    icon: MinusCircle,
    refMax: 10,
    colors: {
      iconBg:   "bg-slate-100",
      icon:     "text-slate-400",
      bar:      "bg-slate-400",
      barBg:    "bg-slate-100",
      value:    "text-slate-500",
    },
  },
]

// ─────────────────────────────────────────────
// 成功率的颜色：根据数值判断健康程度
// > 90% → 绿色（优秀）| 75-90% → 橙色（注意）| < 75% → 红色（危险）
// ─────────────────────────────────────────────
function getSuccessRateColor(rate: number) {
  if (rate >= 90) return { text: "text-emerald-600", bg: "bg-emerald-50", icon: "text-emerald-500" }
  if (rate >= 75) return { text: "text-amber-600",   bg: "bg-amber-50",   icon: "text-amber-500"   }
  return               { text: "text-red-600",       bg: "bg-red-50",     icon: "text-red-500"     }
}

// ─────────────────────────────────────────────
// 主组件
// ─────────────────────────────────────────────
export function CardStats() {
  const [cards, setCards]               = useState<VirtualCard[]>([])
  const [selectedBin, setSelectedBin]   = useState("all")
  const [stats, setStats]               = useState<CardStats | null>(null)
  const [initialLoading, setInitialLoading] = useState(true)
  const [switching, setSwitching]           = useState(false)

  // ── 进度条动画控制 ──
  // mounted = false 时进度条宽度为 0，变 true 后触发 CSS transition 从 0 增长到目标值
  // 这样每次数据加载完成或切换 BIN 后，进度条都有"从零增长"的动画效果
  const [barMounted, setBarMounted] = useState(false)

  useEffect(() => {
    async function load() {
      const [cardList, statsData] = await Promise.all([
        getCards(),
        getCardStats("all"),
      ])
      setCards(cardList)
      setStats(statsData)
      setInitialLoading(false)
      // 数据渲染完毕后稍等 60ms 再触发动画，确保浏览器先以 0% 宽度绘制
      setTimeout(() => setBarMounted(true), 60)
    }
    load()
  }, [])

  async function handleBinChange(bin: string) {
    setSelectedBin(bin)
    setSwitching(true)
    setBarMounted(false)          // 重置动画，切换时再次从 0 增长
    const data = await getCardStats(bin)
    setStats(data)
    setSwitching(false)
    setTimeout(() => setBarMounted(true), 60)
  }

  // 从卡片列表中提取唯一的 BIN 值，作为下拉选项
  const uniqueBins = [...new Set(cards.map((c) => c.cardBin))]

  // ─────────────────────────────────────────────
  return (
    <section>

      {/* ── 区块标题 + BIN 下拉 ── */}
      <div className="flex items-center justify-between mb-3">
        <p className="text-slate-400 text-[11px] font-medium uppercase tracking-widest">
          用卡统计
        </p>

        {/* BIN 切换下拉：动态列出用户拥有的卡 */}
        <div className="relative">
          <select
            value={selectedBin}
            onChange={(e) => handleBinChange(e.target.value)}
            disabled={initialLoading}
            className="appearance-none text-xs border border-slate-200 rounded-lg pl-2.5 pr-7 py-1.5
              text-slate-600 bg-white cursor-pointer
              focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-400
              disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <option value="all">全部 BIN</option>
            {uniqueBins.map((bin) => {
              // 找到这张卡的方案（Visa / Mastercard）
              const card = cards.find((c) => c.cardBin === bin)
              return (
                <option key={bin} value={bin}>
                  {card?.scheme ?? ""} · {bin}
                </option>
              )
            })}
          </select>
          {/* 自定义下拉箭头 */}
          <ChevronDown className="w-3 h-3 text-slate-400 absolute right-2 top-1/2 -translate-y-1/2 pointer-events-none" />
        </div>
      </div>

      {/* ── 主白色卡片容器 ── */}
      <div className="bg-white border border-slate-200 rounded-2xl shadow-sm overflow-hidden">

        {/* ════ 顶部三个概览指标 ════ */}
        {initialLoading ? (

          // 第一次加载：显示骨架屏
          <div className="grid grid-cols-3 divide-x divide-slate-100 border-b border-slate-100">
            {[1, 2, 3].map((i) => (
              <div key={i} className="p-5 space-y-2">
                <Skeleton className="h-3 w-16 bg-slate-100" />
                <Skeleton className="h-7 w-20 bg-slate-100" />
                <Skeleton className="h-3 w-12 bg-slate-100" />
              </div>
            ))}
          </div>

        ) : (
          // 数据加载完成：显示三格统计
          // switching 时加 opacity 动画，告诉用户"数据在切换中"
          <div className={`grid grid-cols-3 divide-x divide-slate-100 border-b border-slate-100 transition-opacity duration-200 ${switching ? "opacity-50" : "opacity-100"}`}>

            {/* ── 总交易笔数 ── */}
            <div className="p-5">
              <div className="flex items-center gap-1.5 mb-2">
                <div className="w-6 h-6 rounded-md bg-indigo-50 flex items-center justify-center">
                  <Activity className="w-3.5 h-3.5 text-indigo-500" />
                </div>
                <span className="text-slate-400 text-xs">总交易数</span>
              </div>
              {/* font-mono：等宽字体，数字显示更整齐 */}
              <p className="text-2xl font-bold text-slate-900 font-mono">
                {stats?.totalTransactions ?? 0}
              </p>
              <p className="text-slate-400 text-[11px] mt-0.5">笔</p>
            </div>

            {/* ── 总消费金额 ── */}
            <div className="p-5">
              <div className="flex items-center gap-1.5 mb-2">
                <div className="w-6 h-6 rounded-md bg-violet-50 flex items-center justify-center">
                  <DollarSign className="w-3.5 h-3.5 text-violet-500" />
                </div>
                <span className="text-slate-400 text-xs">总消费</span>
              </div>
              <p className="text-2xl font-bold text-slate-900 font-mono">
                {stats ? stats.totalSpending.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 }) : "0.00"}
              </p>
              <p className="text-slate-400 text-[11px] mt-0.5">USD</p>
            </div>

            {/* ── 成功率（颜色随数值变化）── */}
            <div className="p-5">
              {(() => {
                // 这里用立即执行函数（IIFE）来在 JSX 里写逻辑
                const rate  = stats?.successRate ?? 0
                const color = getSuccessRateColor(rate)
                return (
                  <>
                    <div className="flex items-center gap-1.5 mb-2">
                      <div className={`w-6 h-6 rounded-md ${color.bg} flex items-center justify-center`}>
                        <TrendingUp className={`w-3.5 h-3.5 ${color.icon}`} />
                      </div>
                      <span className="text-slate-400 text-xs">成功率</span>
                    </div>
                    <p className={`text-2xl font-bold font-mono ${color.text}`}>
                      {rate.toFixed(1)}%
                    </p>
                    {/* 状态文字颜色与数值颜色同步，"需要关注"橙色加粗，"风险偏高"红色加粗 */}
                    <p className={`text-[11px] mt-0.5 font-medium ${
                      rate >= 90
                        ? "text-emerald-500"
                        : rate >= 75
                        ? "text-amber-500 font-semibold"
                        : "text-red-500 font-semibold"
                    }`}>
                      {rate >= 90 ? "表现优秀" : rate >= 75 ? "需要关注" : "风险偏高"}
                    </p>
                  </>
                )
              })()}
            </div>
          </div>
        )}

        {/* ════ 风控指标区域 ════ */}
        <div className="p-5">
          <p className="text-slate-400 text-[11px] font-medium mb-4">风险指标</p>

          {initialLoading ? (

            // 骨架屏：3 行进度条占位
            <div className="space-y-4">
              {[1, 2, 3].map((i) => (
                <div key={i} className="flex items-center gap-3">
                  <Skeleton className="w-7 h-7 rounded-lg bg-slate-100" />
                  <Skeleton className="h-3 w-14 bg-slate-100" />
                  <Skeleton className="flex-1 h-1.5 rounded-full bg-slate-100" />
                  <Skeleton className="h-4 w-10 bg-slate-100" />
                </div>
              ))}
            </div>

          ) : (

            // 风控指标列表
            <div className={`space-y-4 transition-opacity duration-200 ${switching ? "opacity-50" : "opacity-100"}`}>
              {RISK_METRICS.map((metric) => {
                const value = (stats?.[metric.key] as number) ?? 0

                // 进度条宽度 = 实际值 ÷ 参考最大值 × 100%
                // 例：失败率 8.3%，参考最大 25%，进度条宽 = 8.3/25×100 = 33.2%
                // 这样小的数值也能有可见的进度条长度
                const barWidth = Math.min((value / metric.refMax) * 100, 100)

                return (
                  <div key={metric.key} className="flex items-center gap-3">

                    {/* 图标 */}
                    <div className={`w-7 h-7 rounded-lg ${metric.colors.iconBg} flex items-center justify-center flex-shrink-0`}>
                      <metric.icon className={`w-3.5 h-3.5 ${metric.colors.icon}`} />
                    </div>

                    {/* 标签 */}
                    <span className="text-slate-600 text-xs w-12 flex-shrink-0">
                      {metric.label}
                    </span>

                    {/* 进度条 */}
                    {/* barMounted 为 false 时宽度为 0，为 true 时展开到目标值 */}
                    {/* duration-1000 = 1 秒过渡，让增长过程清晰可见 */}
                    <div className={`flex-1 h-1.5 rounded-full ${metric.colors.barBg}`}>
                      <div
                        className={`h-full rounded-full ${metric.colors.bar} transition-all duration-1000`}
                        style={{ width: barMounted ? `${barWidth}%` : "0%" }}
                      />
                    </div>

                    {/* 百分比数值 */}
                    <span className={`text-xs font-mono font-semibold w-10 text-right flex-shrink-0 ${metric.colors.value}`}>
                      {value.toFixed(1)}%
                    </span>
                  </div>
                )
              })}

              {/* 参考说明：解释进度条的刻度含义 */}
              <p className="text-slate-300 text-[10px] pt-1">
                * 进度条基准：失败率 25%、退款率 15%、撤销率 10%
              </p>
            </div>
          )}
        </div>

      </div>
    </section>
  )
}
