"use client"

import { useState, useEffect } from "react"
import {
  Eye,
  EyeOff,
  ChevronDown,
  ArrowDownToLine,
  ArrowUpFromLine,
  FileText,
  CreditCard,
  TrendingDown,
  RefreshCw,
} from "lucide-react"
import { Skeleton } from "@/components/ui/skeleton"
import { toast } from "sonner"
import { getWalletBalance, getCards, getUser } from "@/lib/api"
import { RecentTransactions } from "@/components/dashboard/RecentTransactions"
import { CardStats } from "@/components/dashboard/CardStats"
import type { WalletBalance } from "@/types/wallet"
import type { VirtualCard } from "@/types/card"
import type { User } from "@/types/user"

// ─────────────────────────────────────────────
// 快捷操作按钮配置
// 强调色统一使用紫色系（indigo / violet / purple）
// ─────────────────────────────────────────────
const QUICK_ACTIONS = [
  {
    icon: ArrowDownToLine,
    label: "充值",
    sub: "USDT 入账",
    iconColor: "text-indigo-600",
    ringColor: "ring-indigo-100",
    bgColor: "bg-indigo-50 hover:bg-indigo-100",
    onClick: () =>
      toast.info("充值功能正在开发中", { description: "敬请期待，即将上线" }),
  },
  {
    icon: ArrowUpFromLine,
    label: "提现",
    sub: "转出资金",
    iconColor: "text-violet-600",
    ringColor: "ring-violet-100",
    bgColor: "bg-violet-50 hover:bg-violet-100",
    onClick: () =>
      toast.info("提现功能正在开发中", { description: "敬请期待，即将上线" }),
  },
  {
    icon: FileText,
    label: "账单",
    sub: "查看明细",
    iconColor: "text-purple-600",
    ringColor: "ring-purple-100",
    bgColor: "bg-purple-50 hover:bg-purple-100",
    onClick: () =>
      toast.info("账单功能正在开发中", { description: "敬请期待，即将上线" }),
  },
]

export default function Dashboard() {
  const [user,    setUser]    = useState<User | null>(null)
  const [balance, setBalance] = useState<WalletBalance | null>(null)
  const [cards,   setCards]   = useState<VirtualCard[]>([])
  const [loading, setLoading] = useState(true)

  const [balanceVisible, setBalanceVisible] = useState(true)
  const [refreshing,     setRefreshing]     = useState(false)

  async function loadData() {
    setLoading(true)
    const [userData, walletData, cardsData] = await Promise.all([
      getUser(), getWalletBalance(), getCards(),
    ])
    setUser(userData)
    setBalance(walletData)
    setCards(cardsData)
    setLoading(false)
  }

  // 首次进入页面时加载数据；返回清理函数可防止离开页面后继续更新界面
  useEffect(() => {
    let active = true

    Promise.all([getUser(), getWalletBalance(), getCards()]).then(
      ([userData, walletData, cardsData]) => {
        if (!active) return
        setUser(userData)
        setBalance(walletData)
        setCards(cardsData)
        setLoading(false)
      }
    )

    return () => { active = false }
  }, [])

  async function handleRefresh() {
    setRefreshing(true)
    await loadData()
    setRefreshing(false)
    toast.success("数据已刷新")
  }

  const activeCardCount = cards.filter((c) => c.status === "normal").length
  const availableBalance = balance?.available ?? 0
  const isZeroBalance = !loading && availableBalance === 0

  const displayBalance = balanceVisible
    ? availableBalance.toFixed(2)
    : "****"

  return (
    <div className="min-h-screen bg-[#F8FAFC]">
      {/* max-w-4xl：内容区最大宽度 896px，防止在大屏幕上过度拉伸 */}
      <div className="p-6 space-y-8 max-w-4xl">

        {/* ══ 顶部问候区 ══ */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-slate-900 text-xl font-semibold tracking-tight">首页</h1>
            {loading ? (
              <Skeleton className="h-4 w-36 mt-1 bg-slate-200" />
            ) : (
              <p className="text-slate-400 text-sm mt-0.5">
                欢迎回来，<span className="text-slate-600 font-medium">{user?.username ?? "用户"}</span>
              </p>
            )}
          </div>
          <button
            onClick={handleRefresh}
            disabled={loading || refreshing}
            className="flex items-center gap-1.5 text-slate-400 hover:text-indigo-500 text-xs
              transition-colors disabled:opacity-40 px-2.5 py-1.5 rounded-lg hover:bg-indigo-50"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${refreshing ? "animate-spin" : ""}`} />
            刷新
          </button>
        </div>

        {/* ════════════════════════════════════════════ */}
        {/* 资产总览                                      */}
        {/* ════════════════════════════════════════════ */}
        <section>
          <p className="text-slate-400 text-[11px] font-medium uppercase tracking-widest mb-3">
            资产总览
          </p>

          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3">

            {/* ── 主余额卡：紫色渐变 + 装饰圆圈 ── */}
            {/* relative + overflow-hidden 让装饰元素被裁剪在卡片内 */}
            <div className="sm:col-span-2 md:col-span-2 relative overflow-hidden
              bg-gradient-to-br from-indigo-600 to-violet-600
              rounded-2xl p-5 shadow-lg shadow-indigo-500/20">

              {/* 装饰性背景圆圈：增加视觉层次，透明度极低不干扰内容 */}
              <div className="absolute -right-8 -top-8 w-36 h-36 rounded-full bg-white/[0.07] pointer-events-none" />
              <div className="absolute right-12 -top-1 w-20 h-20 rounded-full bg-white/[0.05] pointer-events-none" />
              <div className="absolute -left-6 -bottom-10 w-28 h-28 rounded-full bg-white/[0.05] pointer-events-none" />

              {/* 标题行 */}
              <div className="flex items-center justify-between mb-4 relative">
                <span className="text-indigo-100 text-sm">资产估值</span>
                <button
                  onClick={() => setBalanceVisible(!balanceVisible)}
                  className="text-indigo-200 hover:text-white transition-colors p-1 rounded-lg hover:bg-white/10"
                  aria-label={balanceVisible ? "隐藏余额" : "显示余额"}
                >
                  {balanceVisible ? <Eye className="w-4 h-4" /> : <EyeOff className="w-4 h-4" />}
                </button>
              </div>

              {/* 余额数字 */}
              {loading ? (
                <Skeleton className="h-9 w-40 bg-white/20" />
              ) : (
                <div className="flex items-baseline gap-2 relative">
                  <span className="text-3xl font-bold text-white font-mono tracking-tight">
                    {displayBalance}
                  </span>
                  <button className="flex items-center gap-0.5 text-indigo-100 text-sm hover:text-white transition-colors">
                    USDT <ChevronDown className="w-3.5 h-3.5" />
                  </button>
                </div>
              )}

              {/* 今日变化 */}
              <p className="text-indigo-200 text-xs mt-2 relative">
                今日 <span className="text-indigo-100 font-mono">0 (0%)</span>
              </p>

              {/* 零余额引导：仅在余额为 0 且非加载状态下显示 */}
              {/* 白色实底按钮在紫色渐变背景上对比度最高，最醒目 */}
              {isZeroBalance && (
                <button
                  onClick={() => toast.info("充值功能正在开发中", { description: "敬请期待，即将上线" })}
                  className="relative mt-4 inline-flex items-center gap-2
                    bg-white text-indigo-700 font-semibold text-xs
                    hover:bg-indigo-50 active:scale-95
                    rounded-xl px-4 py-2
                    shadow-lg shadow-black/15
                    transition-all duration-150"
                >
                  <ArrowDownToLine className="w-3.5 h-3.5" />
                  立即充值
                </button>
              )}
            </div>

            {/* ── 活跃卡数量 ── */}
            <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm
              hover:shadow-md hover:border-slate-300 transition-all duration-200">
              <div className="flex items-center gap-2 mb-3">
                <div className="w-7 h-7 rounded-lg bg-indigo-50 flex items-center justify-center">
                  <CreditCard className="w-3.5 h-3.5 text-indigo-600" />
                </div>
                <span className="text-slate-500 text-xs">活跃卡</span>
              </div>
              {loading ? (
                <Skeleton className="h-8 w-12 bg-slate-200" />
              ) : (
                <p className="text-2xl font-bold text-slate-900 font-mono">{activeCardCount}</p>
              )}
              <p className="text-slate-400 text-[11px] mt-1">张可用</p>
            </div>

            {/* ── 消费统计 ── */}
            <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm
              hover:shadow-md hover:border-slate-300 transition-all duration-200">
              <div className="flex items-center gap-2 mb-3">
                <div className="w-7 h-7 rounded-lg bg-purple-50 flex items-center justify-center">
                  <TrendingDown className="w-3.5 h-3.5 text-purple-600" />
                </div>
                <span className="text-slate-500 text-xs">消费统计</span>
              </div>
              {loading ? (
                <div className="space-y-2">
                  <Skeleton className="h-4 w-20 bg-slate-200" />
                  <Skeleton className="h-4 w-16 bg-slate-200" />
                </div>
              ) : (
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-slate-400 text-[11px]">今日</span>
                    <span className="text-slate-900 text-sm font-mono font-semibold">$0.00</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-slate-400 text-[11px]">本月</span>
                    <span className="text-slate-900 text-sm font-mono font-semibold">$0.00</span>
                  </div>
                </div>
              )}
            </div>
          </div>
        </section>

        {/* ════════════════════════════════════════════ */}
        {/* 快捷操作                                      */}
        {/* ════════════════════════════════════════════ */}
        <section>
          <p className="text-slate-400 text-[11px] font-medium uppercase tracking-widest mb-4">
            快捷操作
          </p>
          <div className="flex gap-5">
            {QUICK_ACTIONS.map((action) => (
              <button
                key={action.label}
                onClick={action.onClick}
                className="flex flex-col items-center gap-2.5 group"
              >
                <div className={`
                  w-14 h-14 rounded-2xl flex items-center justify-center
                  border border-slate-200
                  ring-4 ${action.ringColor}
                  ${action.bgColor}
                  transition-all duration-200
                  group-hover:scale-105 group-hover:shadow-md group-active:scale-95
                `}>
                  <action.icon className={`w-6 h-6 ${action.iconColor}`} />
                </div>
                <div className="text-center">
                  <p className="text-slate-700 text-xs font-medium group-hover:text-slate-900 transition-colors">
                    {action.label}
                  </p>
                  <p className="text-slate-400 text-[10px]">{action.sub}</p>
                </div>
              </button>
            ))}
          </div>
        </section>

        {/* ════════════════════════════════════════════ */}
        {/* 用卡统计 + 风控数据                           */}
        {/* ════════════════════════════════════════════ */}
        <CardStats />

        {/* ════════════════════════════════════════════ */}
        {/* 最近交易（含筛选）                            */}
        {/* ════════════════════════════════════════════ */}
        <RecentTransactions />

      </div>
    </div>
  )
}
