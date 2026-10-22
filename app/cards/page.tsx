"use client"

// 卡片列表页（/cards）——表格形式
// 表格比卡片网格更适合多卡管理：信息对齐、密度高、数字对比方便

import { useState, useEffect, useMemo } from "react"
import Link from "next/link"
import {
  Plus,
  Search,
  CreditCard,
  Snowflake,
  XCircle,
  Eye,
  ArrowDownToLine,
  Lock,
  LockOpen,
  RefreshCw,
  X,
} from "lucide-react"
import { Skeleton } from "@/components/ui/skeleton"
import { toast } from "sonner"
import { getCards, getAllTransactions, toggleCardFreeze } from "@/lib/api"
import type { VirtualCard, CardStatus, CardTransaction } from "@/types/card"

// ─────────────────────────────────────────────
// 每张卡的迷你视觉渐变色（循环取用）
// 在表格行里的迷你卡图标上显示
// ─────────────────────────────────────────────
const CARD_GRADIENTS = [
  "from-indigo-500 to-violet-600",
  "from-violet-500 to-purple-600",
  "from-blue-500 to-indigo-600",
  "from-purple-500 to-fuchsia-600",
  "from-cyan-500 to-indigo-600",
  "from-indigo-400 to-blue-600",
  "from-teal-500 to-cyan-600",
  "from-rose-400 to-pink-600",
]

// 货币 → 符号映射
const CURRENCY_SYMBOL: Record<string, string> = {
  USD: "$", EUR: "€", GBP: "£", JPY: "¥", HKD: "HK$",
}

// ─────────────────────────────────────────────
// 子组件：状态徽章
// 正常=绿 | 冻结=蓝 | 已注销=灰
// ─────────────────────────────────────────────
function StatusBadge({ status }: { status: CardStatus }) {
  const cfg: Record<CardStatus, { label: string; cls: string }> = {
    normal:    { label: "正常",   cls: "bg-emerald-50 text-emerald-700 border border-emerald-200" },
    frozen:    { label: "已冻结", cls: "bg-sky-50     text-sky-700     border border-sky-200"     },
    cancelled: { label: "已注销", cls: "bg-slate-100  text-slate-500   border border-slate-200"   },
  }
  const { label, cls } = cfg[status] ?? cfg.cancelled
  return (
    <span className={`inline-flex text-[11px] font-medium px-2.5 py-1 rounded-full whitespace-nowrap ${cls}`}>
      {label}
    </span>
  )
}

// ─────────────────────────────────────────────
// 子组件：表格行骨架屏（加载时显示）
// ─────────────────────────────────────────────
function TableRowSkeleton() {
  return (
    <tr className="border-b border-slate-100">
      {/* 卡片信息 */}
      <td className="px-5 py-4">
        <div className="flex items-center gap-3">
          <Skeleton className="w-11 h-8 rounded-lg bg-slate-100 flex-shrink-0" />
          <div className="space-y-1.5">
            <Skeleton className="h-3.5 w-24 bg-slate-100" />
            <Skeleton className="h-3 w-32 bg-slate-100" />
          </div>
        </div>
      </td>
      {/* 状态 */}
      <td className="px-5 py-4">
        <Skeleton className="h-6 w-16 rounded-full bg-slate-100" />
      </td>
      {/* 余额 */}
      <td className="px-5 py-4 text-right">
        <Skeleton className="h-4 w-20 bg-slate-100 ml-auto" />
      </td>
      {/* 今日消费 */}
      <td className="px-5 py-4 text-right">
        <Skeleton className="h-4 w-16 bg-slate-100 ml-auto" />
      </td>
      {/* 本月消费 */}
      <td className="px-5 py-4 text-right">
        <Skeleton className="h-4 w-18 bg-slate-100 ml-auto" />
      </td>
      {/* 操作 */}
      <td className="px-5 py-4">
        <div className="flex items-center gap-1.5">
          <Skeleton className="h-7 w-14 rounded-lg bg-slate-100" />
          <Skeleton className="h-7 w-14 rounded-lg bg-slate-100" />
          <Skeleton className="h-7 w-12 rounded-lg bg-slate-100" />
        </div>
      </td>
    </tr>
  )
}

// ─────────────────────────────────────────────
// 主页面组件
// ─────────────────────────────────────────────
export default function CardsPage() {

  // ── 数据状态 ──
  const [cards, setCards]                   = useState<VirtualCard[]>([])
  const [allTransactions, setAllTransactions] = useState<CardTransaction[]>([])
  const [loading, setLoading]               = useState(true)

  // ── 搜索 & 筛选 ──
  const [search, setSearch]                 = useState("")
  const [statusFilter, setStatusFilter]     = useState<"all" | CardStatus>("all")

  // ── 前端冻结状态覆盖 ──
  // 不刷新页面就能让 UI 立即反映冻结/解冻结果
  // key = cardId，value = 操作后的新状态
  const [statusOverrides, setStatusOverrides] = useState<Record<string, CardStatus>>({})

  // ── 当前正在执行冻结操作的卡片 id（防止连点）──
  const [freezeLoading, setFreezeLoading]   = useState<string | null>(null)

  // ── 初次加载 ──
  useEffect(() => {
    async function load() {
      setLoading(true)
      const [cardsData, txData] = await Promise.all([
        getCards(),
        getAllTransactions(),
      ])
      setCards(cardsData)
      setAllTransactions(txData)
      setLoading(false)
    }
    load()
  }, [])

  // ─────────────────────────────────────────────
  // 建立卡片 id → 渐变色索引 的映射
  // 保证同一张卡不管筛选结果如何，颜色始终一致
  // ─────────────────────────────────────────────
  const gradientIndexMap = useMemo(() => {
    const map: Record<string, number> = {}
    cards.forEach((c, i) => { map[c.id] = i })
    return map
  }, [cards])

  // ─────────────────────────────────────────────
  // 计算每张卡的今日 & 本月消费
  // 只统计"已结算的支出"（settled + amount < 0）
  // useMemo：只在 allTransactions 变化时重新计算
  // ─────────────────────────────────────────────
  const spendingMap = useMemo(() => {
    const now        = new Date()
    const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate())
    const monthStart = new Date(now.getFullYear(), now.getMonth(), 1)
    const map: Record<string, { today: number; month: number }> = {}

    for (const tx of allTransactions) {
      if (tx.status !== "settled" || tx.amount >= 0) continue // 排除失败、充值、退款
      const d   = new Date(tx.createdAt)
      const amt = Math.abs(tx.amount)
      if (!map[tx.cardId]) map[tx.cardId] = { today: 0, month: 0 }
      if (d >= monthStart) map[tx.cardId].month += amt
      if (d >= todayStart) map[tx.cardId].today += amt
    }
    return map
  }, [allTransactions])

  // ─────────────────────────────────────────────
  // 获取某张卡的"有效状态"（覆盖优先）
  // ─────────────────────────────────────────────
  function effectiveStatus(card: VirtualCard): CardStatus {
    return (statusOverrides[card.id] as CardStatus) ?? card.status
  }

  // ─────────────────────────────────────────────
  // 筛选 + 搜索（useMemo，依赖变化才重算）
  // ─────────────────────────────────────────────
  const filteredCards = useMemo(() => {
    return cards.filter((c) => {
      // ① 状态筛选
      const st = (statusOverrides[c.id] as CardStatus) ?? c.status
      if (statusFilter !== "all" && st !== statusFilter) return false

      // ② 关键词搜索：匹配卡号、BIN、别名（去空格，不区分大小写）
      if (search.trim()) {
        const q   = search.toLowerCase().replace(/\s/g, "")
        const num = c.displayNumber.replace(/\s/g, "").toLowerCase()
        const bin = c.cardBin.toLowerCase()
        const ali = c.alias.toLowerCase()
        if (!num.includes(q) && !bin.includes(q) && !ali.includes(q)) return false
      }
      return true
    })
  }, [cards, statusFilter, search, statusOverrides])

  // ─────────────────────────────────────────────
  // Tab 数量统计（实时反映冻结操作）
  // ─────────────────────────────────────────────
  const counts = useMemo(() => {
    const c = { all: 0, normal: 0, frozen: 0, cancelled: 0 }
    for (const card of cards) {
      const st = (statusOverrides[card.id] as CardStatus) ?? card.status
      c.all++
      if (st === "normal")    c.normal++
      if (st === "frozen")    c.frozen++
      if (st === "cancelled") c.cancelled++
    }
    return c
  }, [cards, statusOverrides])

  // ─────────────────────────────────────────────
  // 冻结 / 解冻
  // 1. 调用 mock API（800ms 延迟）
  // 2. 更新本地 statusOverrides（UI 立即刷新）
  // 3. Toast 通知
  // ─────────────────────────────────────────────
  async function handleFreezeToggle(card: VirtualCard) {
    if (freezeLoading) return
    const current     = effectiveStatus(card)
    if (current === "cancelled") return

    setFreezeLoading(card.id)
    const shouldFreeze = current === "normal"
    const result       = await toggleCardFreeze(card.id, shouldFreeze)

    if (result.success) {
      setStatusOverrides((prev) => ({
        ...prev,
        [card.id]: shouldFreeze ? "frozen" : "normal",
      }))
      toast.success(result.message, {
        description: shouldFreeze
          ? "卡片已暂停使用，解冻后可恢复交易"
          : "卡片已恢复正常，可继续使用",
      })
    }
    setFreezeLoading(null)
  }

  function handleRecharge(card: VirtualCard) {
    toast.info(`向「${card.alias}」充值`, { description: "卡片充值功能正在开发中，敬请期待" })
  }

  function handleCreateCard() {
    toast.info("开卡功能正在开发中", { description: "即将支持 Visa、Mastercard 多卡段选择" })
  }

  // ─────────────────────────────────────────────
  // 状态筛选 Tab 配置
  // ─────────────────────────────────────────────
  const STATUS_TABS = [
    { value: "all",       label: "全部",   count: counts.all       },
    { value: "normal",    label: "正常",   count: counts.normal    },
    { value: "frozen",    label: "冻结",   count: counts.frozen    },
    { value: "cancelled", label: "已注销", count: counts.cancelled },
  ]

  // ══════════════════════════════════════════════
  // 渲染
  // ══════════════════════════════════════════════
  return (
    <div className="min-h-screen bg-[#F8FAFC]">
      <div className="p-6">

        {/* ══ 页面标题 + 创建按钮 ══ */}
        <div className="flex items-start justify-between mb-6">
          <div>
            <h1 className="text-slate-900 text-xl font-semibold tracking-tight">我的卡片</h1>
            <p className="text-slate-400 text-sm mt-0.5">管理您的所有虚拟信用卡</p>
          </div>
          <button
            onClick={handleCreateCard}
            className="inline-flex items-center gap-2 bg-indigo-600 hover:bg-indigo-700
              text-white text-sm font-medium rounded-xl px-4 py-2.5
              shadow-md shadow-indigo-500/25 transition-all active:scale-95"
          >
            <Plus className="w-4 h-4" />
            创建新卡
          </button>
        </div>

        {/* ══ 搜索框 + 状态 Tabs ══ */}
        <div className="flex flex-wrap items-center gap-3 mb-5">

          {/* 搜索框 */}
          <div className="relative flex-1 min-w-[180px] max-w-xs">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-400 pointer-events-none" />
            <input
              type="text"
              placeholder="搜索卡号或 BIN..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-9 pr-8 py-2 text-sm border border-slate-200 rounded-xl
                bg-white text-slate-900 placeholder-slate-400
                focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-400
                transition-all"
            />
            {search && (
              <button
                onClick={() => setSearch("")}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>

          {/* 状态筛选 Tabs */}
          <div className="flex items-center gap-1 bg-slate-100 rounded-xl p-1">
            {STATUS_TABS.map((tab) => (
              <button
                key={tab.value}
                onClick={() => setStatusFilter(tab.value as "all" | CardStatus)}
                className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all duration-150 ${
                  statusFilter === tab.value
                    ? "bg-white text-indigo-700 shadow-sm"
                    : "text-slate-500 hover:text-slate-700"
                }`}
              >
                {tab.label}
                {!loading && (
                  <span className={`ml-1 text-[10px] ${
                    statusFilter === tab.value ? "text-indigo-400" : "text-slate-400"
                  }`}>
                    {tab.count}
                  </span>
                )}
              </button>
            ))}
          </div>
        </div>

        {/* ══ 表格容器 ══ */}
        <div className="bg-white border border-slate-200 rounded-2xl shadow-sm overflow-hidden">

          {/* overflow-x-auto：小屏幕下表格可横向滚动，不破坏布局 */}
          <div className="overflow-x-auto">
            <table className="w-full">

              {/* ── 表头 ── */}
              <thead>
                <tr className="border-b border-slate-100 bg-slate-50/60">
                  <th className="text-left px-5 py-3 text-[10px] uppercase tracking-widest text-slate-400 font-medium whitespace-nowrap">
                    卡片信息
                  </th>
                  <th className="text-left px-5 py-3 text-[10px] uppercase tracking-widest text-slate-400 font-medium whitespace-nowrap">
                    状态
                  </th>
                  <th className="text-right px-5 py-3 text-[10px] uppercase tracking-widest text-slate-400 font-medium whitespace-nowrap">
                    余额
                  </th>
                  <th className="text-right px-5 py-3 text-[10px] uppercase tracking-widest text-slate-400 font-medium whitespace-nowrap">
                    今日消费
                  </th>
                  <th className="text-right px-5 py-3 text-[10px] uppercase tracking-widest text-slate-400 font-medium whitespace-nowrap">
                    本月消费
                  </th>
                  <th className="text-left px-5 py-3 text-[10px] uppercase tracking-widest text-slate-400 font-medium whitespace-nowrap">
                    操作
                  </th>
                </tr>
              </thead>

              {/* ── 表体 ── */}
              <tbody>
                {loading ? (
                  // ── 骨架屏：8 行 ──
                  Array.from({ length: 8 }).map((_, i) => (
                    <TableRowSkeleton key={i} />
                  ))

                ) : filteredCards.length === 0 ? (
                  // ── 空状态 ──
                  <tr>
                    <td colSpan={6}>
                      {cards.length === 0 ? (
                        // 真的没有卡：新用户引导
                        <div className="flex flex-col items-center justify-center py-20 text-center">
                          <div className="w-14 h-14 rounded-2xl bg-indigo-50 flex items-center justify-center mb-4">
                            <CreditCard className="w-7 h-7 text-indigo-400" />
                          </div>
                          <p className="text-slate-700 text-base font-semibold mb-1.5">还没有虚拟卡</p>
                          <p className="text-slate-400 text-sm mb-5">
                            创建第一张虚拟 Visa / Mastercard，即可开始全球在线消费
                          </p>
                          <button
                            onClick={handleCreateCard}
                            className="inline-flex items-center gap-2 bg-indigo-600 hover:bg-indigo-700
                              text-white text-sm font-medium rounded-xl px-5 py-2.5
                              shadow-md shadow-indigo-500/25 transition-all active:scale-95"
                          >
                            <Plus className="w-4 h-4" />
                            立即开卡
                          </button>
                        </div>
                      ) : (
                        // 有卡但筛选后为空
                        <div className="flex flex-col items-center justify-center py-16 text-center">
                          <div className="w-12 h-12 rounded-2xl bg-slate-100 flex items-center justify-center mb-3">
                            <Search className="w-6 h-6 text-slate-400" />
                          </div>
                          <p className="text-slate-600 font-medium mb-1">没有符合条件的卡片</p>
                          <p className="text-slate-400 text-sm mb-4">尝试更改搜索词或筛选条件</p>
                          <button
                            onClick={() => { setSearch(""); setStatusFilter("all") }}
                            className="flex items-center gap-1.5 text-sm text-indigo-600 hover:text-indigo-700 transition-colors"
                          >
                            <X className="w-3.5 h-3.5" /> 清除筛选
                          </button>
                        </div>
                      )}
                    </td>
                  </tr>

                ) : (
                  // ── 正常数据行 ──
                  filteredCards.map((card) => {
                    const st       = effectiveStatus(card)
                    const spending = spendingMap[card.id] ?? { today: 0, month: 0 }
                    const sym      = CURRENCY_SYMBOL[card.currency] ?? (card.currency + " ")
                    const gIdx     = gradientIndexMap[card.id] ?? 0
                    const gradient = st === "cancelled"
                      ? "from-slate-400 to-slate-500"
                      : CARD_GRADIENTS[gIdx % CARD_GRADIENTS.length]
                    const isFreezing   = freezeLoading === card.id
                    const isFreezable  = st === "normal" || st === "frozen"

                    return (
                      <tr
                        key={card.id}
                        className="border-b border-slate-100 hover:bg-[#F3E8FF] transition-colors duration-150 group"
                      >

                        {/* ── 列1：卡片信息（迷你卡图标 + 别名 + 脱敏卡号 + BIN） ── */}
                        <td className="px-5 py-4 min-w-[220px]">
                          <div className="flex items-center gap-3">

                            {/* 迷你信用卡视觉 */}
                            <div className={`relative w-12 h-8 rounded-lg bg-gradient-to-br ${gradient} flex-shrink-0 overflow-hidden`}>
                              {/* 装饰圆圈 */}
                              <div className="absolute -right-2 -top-2 w-7 h-7 rounded-full bg-white/[0.08]" />
                              {/* 卡组织标识 */}
                              {card.scheme === "Visa" ? (
                                <span className="absolute bottom-1 right-1.5 text-white text-[7px] font-bold italic leading-none select-none">
                                  VISA
                                </span>
                              ) : (
                                <div className="absolute bottom-1 right-1 flex -space-x-0.5 select-none">
                                  <div className="w-2 h-2 rounded-full bg-red-500/80" />
                                  <div className="w-2 h-2 rounded-full bg-amber-400/80" />
                                </div>
                              )}
                              {/* 冻结遮罩 */}
                              {st === "frozen" && (
                                <div className="absolute inset-0 bg-slate-900/45 flex items-center justify-center">
                                  <Snowflake className="w-3 h-3 text-white/90" />
                                </div>
                              )}
                              {/* 注销遮罩 */}
                              {st === "cancelled" && (
                                <div className="absolute inset-0 bg-slate-900/40 flex items-center justify-center">
                                  <XCircle className="w-3 h-3 text-white/80" />
                                </div>
                              )}
                            </div>

                            {/* 文字信息 */}
                            <div className="min-w-0">
                              <p className="text-slate-900 text-sm font-medium truncate">{card.alias}</p>
                              <p className="text-slate-400 text-[11px] font-mono mt-0.5 whitespace-nowrap">
                                {card.displayNumber}
                                <span className="text-slate-300 mx-1.5">·</span>
                                BIN {card.cardBin}
                              </p>
                            </div>
                          </div>
                        </td>

                        {/* ── 列2：状态 ── */}
                        <td className="px-5 py-4 whitespace-nowrap">
                          <StatusBadge status={st} />
                        </td>

                        {/* ── 列3：余额（右对齐，等宽字体）── */}
                        <td className="px-5 py-4 text-right whitespace-nowrap">
                          <span className={`text-sm font-mono font-semibold ${
                            card.balance > 0 ? "text-slate-900" : "text-slate-400"
                          }`}>
                            {sym}{card.balance.toFixed(2)}
                          </span>
                          <p className="text-slate-400 text-[10px] mt-0.5">{card.currency}</p>
                        </td>

                        {/* ── 列4：今日消费 ── */}
                        <td className="px-5 py-4 text-right whitespace-nowrap">
                          <span className={`text-sm font-mono ${
                            spending.today > 0 ? "text-slate-700 font-medium" : "text-slate-400"
                          }`}>
                            {sym}{spending.today.toFixed(2)}
                          </span>
                        </td>

                        {/* ── 列5：本月消费 ── */}
                        <td className="px-5 py-4 text-right whitespace-nowrap">
                          <span className={`text-sm font-mono ${
                            spending.month > 0 ? "text-slate-700 font-medium" : "text-slate-400"
                          }`}>
                            {sym}{spending.month.toFixed(2)}
                          </span>
                        </td>

                        {/* ── 列6：操作按钮 ── */}
                        <td className="px-5 py-4 whitespace-nowrap">
                          <div className="flex items-center gap-1.5">

                            {/* 查看详情 */}
                            <Link
                              href={`/cards/${card.id}`}
                              className="inline-flex items-center gap-1 text-xs text-slate-600
                                border border-slate-200 bg-white hover:bg-slate-50
                                rounded-lg px-2.5 py-1.5 transition-colors"
                            >
                              <Eye className="w-3 h-3" />
                              详情
                            </Link>

                            {/* 冻结 / 解冻（已注销卡不显示）*/}
                            {isFreezable && (
                              <button
                                onClick={() => handleFreezeToggle(card)}
                                disabled={!!freezeLoading}
                                className={`inline-flex items-center gap-1 text-xs border rounded-lg px-2.5 py-1.5
                                  transition-all disabled:opacity-50 disabled:cursor-not-allowed ${
                                  st === "frozen"
                                    ? "text-sky-600 border-sky-200 bg-sky-50 hover:bg-sky-100"
                                    : "text-slate-600 border-slate-200 bg-white hover:bg-slate-50"
                                }`}
                              >
                                {isFreezing ? (
                                  <RefreshCw className="w-3 h-3 animate-spin" />
                                ) : st === "frozen" ? (
                                  <><LockOpen className="w-3 h-3" />解冻</>
                                ) : (
                                  <><Lock className="w-3 h-3" />冻结</>
                                )}
                              </button>
                            )}

                            {/* 充值（已注销卡不显示）*/}
                            {st !== "cancelled" && (
                              <button
                                onClick={() => handleRecharge(card)}
                                className="inline-flex items-center gap-1 text-xs
                                  text-indigo-600 border border-indigo-200 bg-indigo-50
                                  hover:bg-indigo-100 rounded-lg px-2.5 py-1.5 transition-colors"
                              >
                                <ArrowDownToLine className="w-3 h-3" />
                                充值
                              </button>
                            )}
                          </div>
                        </td>

                      </tr>
                    )
                  })
                )}
              </tbody>
            </table>
          </div>

          {/* ── 表格底部：结果计数 ── */}
          {!loading && filteredCards.length > 0 && (
            <div className="px-5 py-2.5 border-t border-slate-100 bg-slate-50/60">
              <p className="text-[11px] text-slate-400">
                {search || statusFilter !== "all"
                  ? `筛选结果：${filteredCards.length} 张（共 ${cards.length} 张）`
                  : `共 ${cards.length} 张虚拟卡`
                }
              </p>
            </div>
          )}

        </div>
      </div>
    </div>
  )
}
