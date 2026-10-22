"use client"

import { useState, useEffect, useMemo } from "react"
import Link from "next/link"
import { ArrowRight, SlidersHorizontal, X, Receipt, Inbox } from "lucide-react"
import { Skeleton } from "@/components/ui/skeleton"
import { getAllTransactions } from "@/lib/api"
import { formatDateTime } from "@/lib/format"
import type { CardTransaction } from "@/types/card"

// ─────────────────────────────────────────────
// 筛选条件类型
// ─────────────────────────────────────────────
type TimeFilter   = "all" | "today" | "7days" | "30days"
type StatusFilter = "all" | "settled" | "pending" | "declined" | "refunded"
type TypeFilter   = "all" | "purchase" | "refund" | "recharge" | "withdrawal"

// ─────────────────────────────────────────────
// 状态徽章配置：文字 + 颜色类
// 集中在这里，修改一处全局生效
// ─────────────────────────────────────────────
const STATUS_CONFIG: Record<string, { label: string; className: string }> = {
  settled:  { label: "成功",  className: "bg-emerald-50 text-emerald-700 border border-emerald-200" },
  pending:  { label: "处理中", className: "bg-amber-50   text-amber-700   border border-amber-200"   },
  declined: { label: "失败",  className: "bg-red-50     text-red-700     border border-red-200"     },
  refunded: { label: "退款",  className: "bg-indigo-50  text-indigo-700  border border-indigo-200"  },
}

const TYPE_LABEL: Record<string, string> = {
  purchase: "消费", refund: "退款", recharge: "充值", withdrawal: "提现",
}

const TIME_OPTIONS: { value: TimeFilter; label: string }[] = [
  { value: "all",    label: "全部"   },
  { value: "today",  label: "今天"   },
  { value: "7days",  label: "近7天"  },
  { value: "30days", label: "近30天" },
]

// ─────────────────────────────────────────────
// 商户头像颜色池（按首字母哈希取色）
// ─────────────────────────────────────────────
const AVATAR_COLORS = [
  "bg-indigo-50 text-indigo-600",
  "bg-violet-50 text-violet-600",
  "bg-purple-50 text-purple-600",
  "bg-sky-50    text-sky-600",
  "bg-emerald-50 text-emerald-600",
  "bg-amber-50  text-amber-600",
]
function getAvatarColor(name: string): string {
  return AVATAR_COLORS[name.charCodeAt(0) % AVATAR_COLORS.length]
}

// ─────────────────────────────────────────────
// 主组件
// ─────────────────────────────────────────────
export function RecentTransactions() {
  const [transactions, setTransactions] = useState<CardTransaction[]>([])
  const [loading, setLoading] = useState(true)

  const [timeFilter,   setTimeFilter]   = useState<TimeFilter>("all")
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("all")
  const [binFilter,    setBinFilter]    = useState("all")
  const [typeFilter,   setTypeFilter]   = useState<TypeFilter>("all")

  useEffect(() => {
    async function load() {
      setLoading(true)
      setTransactions(await getAllTransactions())
      setLoading(false)
    }
    load()
  }, [])

  const uniqueBins = useMemo(
    () => [...new Set(transactions.map((t) => t.cardBin))],
    [transactions]
  )

  // ─────────────────────────────────────────────
  // 筛选逻辑：四个条件同时 AND 生效
  // mock 数据使用动态日期，所以"今天/近7天"一定有结果
  // ─────────────────────────────────────────────
  const filteredTransactions = useMemo(() => {
    const today = new Date()
    today.setHours(0, 0, 0, 0)

    return transactions.filter((t) => {
      // ① 时间
      if (timeFilter !== "all") {
        const txDate = new Date(t.createdAt)
        txDate.setHours(0, 0, 0, 0)
        if (timeFilter === "today") {
          if (txDate.getTime() !== today.getTime()) return false
        } else {
          const cutoff = new Date(today)
          cutoff.setDate(today.getDate() - (timeFilter === "7days" ? 7 : 30))
          if (txDate < cutoff) return false
        }
      }
      // ② 状态
      if (statusFilter !== "all" && t.status !== statusFilter) return false
      // ③ 卡 BIN
      if (binFilter    !== "all" && t.cardBin !== binFilter)    return false
      // ④ 类型
      if (typeFilter   !== "all" && t.type    !== typeFilter)   return false
      return true
    })
  }, [transactions, timeFilter, statusFilter, binFilter, typeFilter])

  const hasActiveFilters =
    timeFilter !== "all" || statusFilter !== "all" ||
    binFilter  !== "all" || typeFilter  !== "all"

  function resetFilters() {
    setTimeFilter("all")
    setStatusFilter("all")
    setBinFilter("all")
    setTypeFilter("all")
  }

  // 筛选框样式：激活时变紫色边框，让用户知道"此条件已生效"
  function selectCls(active: boolean) {
    return (
      "text-xs rounded-lg px-2.5 py-1.5 cursor-pointer transition-all " +
      "focus:outline-none focus:ring-2 focus:ring-indigo-500/20 " +
      (active
        ? "border border-indigo-400 text-indigo-700 bg-indigo-50 font-medium"
        : "border border-slate-200 text-slate-600 bg-white")
    )
  }

  return (
    <section>

      {/* ── 标题 + 查看全部 ── */}
      <div className="flex items-center justify-between mb-3">
        <p className="text-slate-400 text-[11px] font-medium uppercase tracking-widest">
          最近交易
        </p>
        <Link
          href="/transactions"
          className="inline-flex items-center gap-1.5 text-xs font-medium text-indigo-600
            border border-indigo-200 bg-white hover:bg-indigo-50 hover:border-indigo-300
            px-3 py-1.5 rounded-lg transition-all shadow-sm"
        >
          查看全部 <ArrowRight className="w-3 h-3" />
        </Link>
      </div>

      {/* ── 主白色卡片 ── */}
      <div className="bg-white border border-slate-200 rounded-2xl shadow-sm overflow-hidden">

        {/* 筛选栏 */}
        <div className="px-5 py-3.5 border-b border-slate-100">
          <div className="flex flex-wrap items-center gap-2.5">
            <SlidersHorizontal className="w-3.5 h-3.5 text-slate-400 flex-shrink-0" />

            {/* 时间范围 Pill */}
            <div className="flex items-center gap-0.5 bg-slate-100 rounded-lg p-0.5">
              {TIME_OPTIONS.map((opt) => (
                <button
                  key={opt.value}
                  onClick={() => setTimeFilter(opt.value)}
                  className={`px-3 py-1 rounded-md text-xs font-medium transition-all duration-150 ${
                    timeFilter === opt.value
                      ? "bg-white text-indigo-700 shadow-sm"
                      : "text-slate-500 hover:text-slate-700"
                  }`}
                >
                  {opt.label}
                </button>
              ))}
            </div>

            {/* 状态筛选 */}
            <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value as StatusFilter)} className={selectCls(statusFilter !== "all")}>
              <option value="all">全部状态</option>
              <option value="settled">成功</option>
              <option value="pending">处理中</option>
              <option value="declined">失败</option>
              <option value="refunded">退款</option>
            </select>

            {/* 类型筛选 */}
            <select value={typeFilter} onChange={(e) => setTypeFilter(e.target.value as TypeFilter)} className={selectCls(typeFilter !== "all")}>
              <option value="all">全部类型</option>
              <option value="purchase">消费</option>
              <option value="refund">退款</option>
              <option value="recharge">充值</option>
              <option value="withdrawal">提现</option>
            </select>

            {/* 卡 BIN 筛选 */}
            <select value={binFilter} onChange={(e) => setBinFilter(e.target.value)} className={selectCls(binFilter !== "all")}>
              <option value="all">全部卡BIN</option>
              {uniqueBins.map((bin) => (
                <option key={bin} value={bin}>BIN {bin}</option>
              ))}
            </select>

            {/* 重置：只在有激活筛选时显示 */}
            {hasActiveFilters && (
              <button
                onClick={resetFilters}
                className="ml-auto flex items-center gap-1 text-slate-400 hover:text-red-500 text-xs transition-colors"
              >
                <X className="w-3 h-3" /> 重置
              </button>
            )}
          </div>
        </div>

        {/* ── 交易列表 / 骨架屏 / 空状态 ── */}
        {loading ? (

          // 骨架屏：5 行，与真实行等高
          <div className="divide-y divide-slate-100">
            {Array.from({ length: 5 }).map((_, i) => (
              <div key={i} className="px-5 py-4 flex items-center gap-4">
                <Skeleton className="w-9 h-9 rounded-xl bg-slate-100 flex-shrink-0" />
                <div className="flex-1 space-y-1.5">
                  <Skeleton className="h-3.5 w-28 bg-slate-100" />
                  <Skeleton className="h-3 w-40 bg-slate-100" />
                </div>
                <Skeleton className="h-5 w-10 rounded-md bg-slate-100 hidden sm:block" />
                <Skeleton className="h-4 w-20 bg-slate-100" />
                <Skeleton className="h-5 w-12 rounded-full bg-slate-100" />
              </div>
            ))}
          </div>

        ) : filteredTransactions.length === 0 ? (

          // ── 空状态：区分"真的没数据"和"筛选后没数据" ──
          <div className="py-14 flex flex-col items-center gap-3">
            <div className="w-12 h-12 rounded-2xl bg-slate-100 flex items-center justify-center">
              {transactions.length === 0
                ? <Inbox  className="w-6 h-6 text-slate-400" />
                : <Receipt className="w-6 h-6 text-slate-400" />
              }
            </div>

            {transactions.length === 0 ? (
              // 新用户、无任何交易：给出正向引导
              <>
                <div className="text-center">
                  <p className="text-slate-600 text-sm font-medium">还没有交易记录</p>
                  <p className="text-slate-400 text-xs mt-1">充值后使用虚拟卡消费，交易记录将显示在此</p>
                </div>
                <button
                  onClick={() => {}}
                  className="text-xs text-indigo-600 border border-indigo-200 bg-white
                    hover:bg-indigo-50 px-4 py-1.5 rounded-lg transition-colors shadow-sm"
                >
                  立即充值 →
                </button>
              </>
            ) : (
              // 有数据但筛选后为空：引导清除筛选
              <>
                <div className="text-center">
                  <p className="text-slate-600 text-sm font-medium">没有符合条件的记录</p>
                  <p className="text-slate-400 text-xs mt-1">尝试调整筛选条件</p>
                </div>
                <button
                  onClick={resetFilters}
                  className="text-xs text-indigo-600 hover:text-indigo-700 transition-colors"
                >
                  清除全部筛选
                </button>
              </>
            )}
          </div>

        ) : (

          // ── 交易行列表 ──
          <div className="divide-y divide-slate-100">
            {filteredTransactions.map((tx) => {
              const statusCfg  = STATUS_CONFIG[tx.status]
              const isDebit    = tx.amount < 0
              const avatarColor = getAvatarColor(tx.merchant)

              return (
                <div
                  key={tx.id}
                  className="px-5 py-4 flex items-center gap-4 cursor-pointer
                    hover:bg-[#F3E8FF] transition-colors duration-150"
                >
                  {/* 商户头像 */}
                  <div className={`w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0 ${avatarColor}`}>
                    <span className="text-sm font-semibold">
                      {tx.merchant.charAt(0).toUpperCase()}
                    </span>
                  </div>

                  {/* 商户名 + 时间/BIN */}
                  <div className="flex-1 min-w-0">
                    <p className="text-slate-900 text-sm font-medium truncate">{tx.merchant}</p>
                    <p className="text-slate-400 text-[11px] mt-0.5">
                      {formatDateTime(tx.createdAt)}
                      <span className="mx-1.5 text-slate-300">·</span>
                      BIN {tx.cardBin}
                    </p>
                  </div>

                  {/* 交易类型小标签 */}
                  <span className="text-slate-500 text-[11px] bg-slate-100 px-2 py-0.5 rounded-md hidden sm:block flex-shrink-0">
                    {TYPE_LABEL[tx.type] ?? tx.type}
                  </span>

                  {/* 金额：支出深色，收入绿色 */}
                  <span className={`text-sm font-mono font-semibold flex-shrink-0 ${
                    isDebit ? "text-slate-800" : "text-emerald-600"
                  }`}>
                    {isDebit ? "" : "+"}{tx.amount.toFixed(2)} {tx.currency}
                  </span>

                  {/* 状态徽章 */}
                  <span className={`text-[11px] font-medium px-2 py-0.5 rounded-full flex-shrink-0 ${statusCfg.className}`}>
                    {statusCfg.label}
                  </span>
                </div>
              )
            })}
          </div>
        )}

        {/* 底部结果计数（有数据时显示）*/}
        {!loading && filteredTransactions.length > 0 && (
          <div className="px-5 py-2.5 border-t border-slate-100 bg-slate-50/60">
            <p className="text-[11px] text-slate-400">
              {hasActiveFilters
                ? `筛选结果：${filteredTransactions.length} 条（共 ${transactions.length} 条）`
                : `共 ${transactions.length} 条记录`
              }
            </p>
          </div>
        )}

      </div>
    </section>
  )
}
