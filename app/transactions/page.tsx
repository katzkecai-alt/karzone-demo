"use client"

import { useEffect, useMemo, useState } from "react"
import {
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  CircleDollarSign,
  Clock3,
  CreditCard,
  Download,
  Eye,
  ReceiptText,
  RotateCcw,
  Search,
  ShieldAlert,
  XCircle,
} from "lucide-react"
import { Skeleton } from "@/components/ui/skeleton"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { getAllTransactions, getCards } from "@/lib/api"
import { formatDateTime } from "@/lib/format"
import type {
  CardLifecycleEvent,
  CardLifecycleStatus,
  CardTransaction,
  VirtualCard,
} from "@/types/card"

type TimeFilter = "all" | "today" | "7d" | "30d"
type StatusFilter = "all" | CardLifecycleStatus
type TypeFilter = "all" | CardTransaction["type"]

const PAGE_SIZE = 8

const STATUS_CONFIG: Record<CardLifecycleStatus, { label: string; className: string }> = {
  verification_failed: { label: "验证失败", className: "bg-red-50 text-red-600" },
  authorization_declined: { label: "授权拒绝", className: "bg-red-50 text-red-600" },
  authorized: { label: "待结算", className: "bg-amber-50 text-amber-700" },
  reversed: { label: "已撤销", className: "bg-slate-100 text-slate-600" },
  expired: { label: "授权已过期", className: "bg-slate-100 text-slate-500" },
  partially_settled: { label: "部分结算", className: "bg-sky-50 text-sky-700" },
  settled: { label: "已结算", className: "bg-emerald-50 text-emerald-700" },
  partially_refunded: { label: "部分退款", className: "bg-violet-50 text-violet-700" },
  refunded: { label: "已退款", className: "bg-indigo-50 text-indigo-700" },
  disputed: { label: "争议中", className: "bg-orange-50 text-orange-700" },
}

const CURRENCY_SYMBOL: Record<string, string> = {
  USD: "$", EUR: "€", GBP: "£", JPY: "¥", HKD: "HK$",
}

function getLifecycleStatus(transaction: CardTransaction): CardLifecycleStatus {
  if (transaction.lifecycleStatus) return transaction.lifecycleStatus
  if (transaction.status === "pending") return "authorized"
  if (transaction.status === "declined") return "authorization_declined"
  if (transaction.status === "refunded") return "refunded"
  return "settled"
}

export default function TransactionsPage() {
  const [transactions, setTransactions] = useState<CardTransaction[]>([])
  const [cards, setCards] = useState<VirtualCard[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedTransaction, setSelectedTransaction] = useState<CardTransaction | null>(null)
  const [search, setSearch] = useState("")
  const [timeFilter, setTimeFilter] = useState<TimeFilter>("all")
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("all")
  const [typeFilter, setTypeFilter] = useState<TypeFilter>("all")
  const [binFilter, setBinFilter] = useState("all")
  const [page, setPage] = useState(1)

  useEffect(() => {
    let active = true
    Promise.all([getAllTransactions(), getCards()]).then(([transactionData, cardData]) => {
      if (!active) return
      setTransactions(transactionData)
      setCards(cardData)
      setLoading(false)
    })
    return () => { active = false }
  }, [])

  const cardMap = useMemo(() => new Map(cards.map((card) => [card.id, card])), [cards])
  const bins = useMemo(() => [...new Set(cards.map((card) => card.cardBin))], [cards])

  const filteredTransactions = useMemo(() => {
    const keyword = search.trim().toLowerCase().replace(/\s/g, "")
    const now = new Date()
    const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate())

    return [...transactions]
      .filter((transaction) => {
        if (statusFilter !== "all" && getLifecycleStatus(transaction) !== statusFilter) return false
        if (typeFilter !== "all" && transaction.type !== typeFilter) return false
        if (binFilter !== "all" && transaction.cardBin !== binFilter) return false

        const createdAt = new Date(transaction.createdAt)
        if (timeFilter === "today" && createdAt < todayStart) return false
        if (timeFilter === "7d" && createdAt < new Date(now.getTime() - 7 * 86400000)) return false
        if (timeFilter === "30d" && createdAt < new Date(now.getTime() - 30 * 86400000)) return false

        if (keyword) {
          const card = cardMap.get(transaction.cardId)
          const searchable = [transaction.merchant, transaction.merchantCategory, transaction.cardBin, card?.alias, card?.displayNumber]
            .join("").toLowerCase().replace(/\s/g, "")
          if (!searchable.includes(keyword)) return false
        }
        return true
      })
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
  }, [transactions, search, timeFilter, statusFilter, typeFilter, binFilter, cardMap])

  const summary = useMemo(() => ({
    total: transactions.length,
    authorized: transactions.filter((transaction) => getLifecycleStatus(transaction) === "authorized").length,
    settled: transactions.filter((transaction) => transaction.type === "purchase").reduce((total, transaction) => total + (transaction.settledAmount ?? 0), 0),
    refunded: transactions.reduce((total, transaction) => total + (transaction.refundedAmount ?? 0), 0),
  }), [transactions])

  const totalPages = Math.max(1, Math.ceil(filteredTransactions.length / PAGE_SIZE))
  const currentPage = Math.min(page, totalPages)
  const pageTransactions = filteredTransactions.slice((currentPage - 1) * PAGE_SIZE, currentPage * PAGE_SIZE)

  function updateSearch(value: string) { setSearch(value); setPage(1) }
  function updateTime(value: TimeFilter) { setTimeFilter(value); setPage(1) }
  function updateStatus(value: StatusFilter) { setStatusFilter(value); setPage(1) }
  function updateType(value: TypeFilter) { setTypeFilter(value); setPage(1) }
  function updateBin(value: string) { setBinFilter(value); setPage(1) }

  function clearFilters() {
    setSearch("")
    setTimeFilter("all")
    setStatusFilter("all")
    setTypeFilter("all")
    setBinFilter("all")
    setPage(1)
  }

  function exportCsv() {
    const header = ["交易时间", "商户", "卡片", "当前状态", "授权金额", "结算金额", "退款金额", "币种"]
    const rows = filteredTransactions.map((transaction) => {
      const card = cardMap.get(transaction.cardId)
      return [formatDateTime(transaction.createdAt), transaction.merchant, `${card?.alias ?? transaction.cardId} ${card?.displayNumber ?? ""}`, STATUS_CONFIG[getLifecycleStatus(transaction)].label, transaction.authorizedAmount ?? 0, transaction.settledAmount ?? 0, transaction.refundedAmount ?? 0, transaction.currency]
    })
    const csv = [header, ...rows].map((row) => row.map((cell) => `"${String(cell).replace(/"/g, '""')}"`).join(",")).join("\n")
    const link = document.createElement("a")
    link.href = URL.createObjectURL(new Blob(["\uFEFF", csv], { type: "text/csv;charset=utf-8" }))
    link.download = `karzone-card-lifecycle-${new Date().toISOString().slice(0, 10)}.csv`
    link.click()
    URL.revokeObjectURL(link.href)
  }

  if (loading) return <TransactionsSkeleton />

  return (
    <div className="min-h-screen bg-[#F8FAFC] p-4 sm:p-6 lg:p-8">
      <div className="mx-auto max-w-7xl space-y-6">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div><h1 className="text-xl font-semibold tracking-tight text-slate-900">卡交易明细</h1><p className="mt-0.5 text-sm text-slate-400">按主交易查看验证、授权、结算与退款完整流程</p></div>
          <button type="button" onClick={exportCsv} disabled={filteredTransactions.length === 0} className="inline-flex items-center gap-2 rounded-xl border border-indigo-200 bg-white px-3.5 py-2 text-xs font-medium text-indigo-600 shadow-sm hover:bg-indigo-50 disabled:opacity-50"><Download className="h-3.5 w-3.5" />导出 CSV</button>
        </div>

        <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
          <SummaryCard icon={ReceiptText} label="主交易" value={String(summary.total)} suffix="笔" iconClass="bg-indigo-50 text-indigo-600" />
          <SummaryCard icon={Clock3} label="待结算授权" value={String(summary.authorized)} suffix="笔" iconClass="bg-amber-50 text-amber-600" />
          <SummaryCard icon={CircleDollarSign} label="已结算金额" value={`$${summary.settled.toFixed(2)}`} suffix="按原币金额汇总" iconClass="bg-emerald-50 text-emerald-600" />
          <SummaryCard icon={RotateCcw} label="已退款金额" value={`$${summary.refunded.toFixed(2)}`} suffix="按原币金额汇总" iconClass="bg-violet-50 text-violet-600" />
        </div>

        <section className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
          <div className="space-y-4 border-b border-slate-100 p-5">
            <div className="flex flex-wrap items-center gap-3">
              <div className="relative min-w-[220px] flex-1"><Search className="absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-slate-400" /><input value={search} onChange={(event) => updateSearch(event.target.value)} placeholder="搜索商户、卡片名称、卡号或 BIN" className="w-full rounded-xl border border-slate-200 py-2.5 pl-9 pr-3 text-xs text-slate-700 outline-none focus:border-indigo-400 focus:ring-2 focus:ring-indigo-500/20" /></div>
              <FilterSelect label="生命周期状态" value={statusFilter} onChange={(value) => updateStatus(value as StatusFilter)} options={[{ value: "all", label: "全部状态" }, ...Object.entries(STATUS_CONFIG).map(([value, config]) => ({ value, label: config.label }))]} />
              <FilterSelect label="交易类型" value={typeFilter} onChange={(value) => updateType(value as TypeFilter)} options={[{ value: "all", label: "全部类型" }, { value: "purchase", label: "消费" }, { value: "refund", label: "退款" }, { value: "recharge", label: "充值" }, { value: "withdrawal", label: "提现" }]} />
              <FilterSelect label="卡 BIN" value={binFilter} onChange={updateBin} options={[{ value: "all", label: "全部 BIN" }, ...bins.map((bin) => ({ value: bin, label: `BIN ${bin}` }))]} />
            </div>
            <div className="flex gap-2 overflow-x-auto pb-1">{([{ value: "all", label: "全部时间" }, { value: "today", label: "今天" }, { value: "7d", label: "近 7 天" }, { value: "30d", label: "近 30 天" }] as Array<{ value: TimeFilter; label: string }>).map((item) => <button key={item.value} type="button" onClick={() => updateTime(item.value)} className={`whitespace-nowrap rounded-full px-3 py-1.5 text-xs font-medium ${timeFilter === item.value ? "bg-indigo-600 text-white" : "bg-slate-100 text-slate-500 hover:bg-indigo-50 hover:text-indigo-600"}`}>{item.label}</button>)}</div>
          </div>

          {pageTransactions.length === 0 ? (
            <div className="flex flex-col items-center px-5 py-20 text-center"><div className="mb-3 flex h-14 w-14 items-center justify-center rounded-2xl bg-slate-100"><Search className="h-7 w-7 text-slate-400" /></div><p className="text-sm font-medium text-slate-700">没有符合条件的交易</p><p className="mt-1 text-xs text-slate-400">尝试修改搜索词或生命周期状态。</p><button type="button" onClick={clearFilters} className="mt-4 text-xs font-medium text-indigo-600">清除全部筛选</button></div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full min-w-[1120px]">
                <thead className="bg-slate-50/70"><tr className="text-left text-[10px] uppercase tracking-widest text-slate-400"><th className="px-5 py-3 font-medium">商户 / 卡片</th><th className="px-5 py-3 font-medium">当前状态</th><th className="px-5 py-3 text-right font-medium">授权金额</th><th className="px-5 py-3 text-right font-medium">已结算</th><th className="px-5 py-3 text-right font-medium">已退款</th><th className="px-5 py-3 font-medium">最后更新</th><th className="px-5 py-3 text-right font-medium">操作</th></tr></thead>
                <tbody>{pageTransactions.map((transaction) => <TransactionRow key={transaction.id} transaction={transaction} card={cardMap.get(transaction.cardId)} onOpen={() => setSelectedTransaction(transaction)} />)}</tbody>
              </table>
            </div>
          )}

          <div className="flex flex-wrap items-center justify-between gap-3 border-t border-slate-100 bg-slate-50/60 px-5 py-3"><p className="text-[11px] text-slate-400">筛选结果 {filteredTransactions.length} 笔，共 {transactions.length} 笔主交易</p>{totalPages > 1 && <div className="flex items-center gap-2"><button type="button" onClick={() => setPage((current) => Math.max(1, current - 1))} disabled={currentPage === 1} aria-label="上一页" className="flex h-8 w-8 items-center justify-center rounded-lg border border-slate-200 bg-white text-slate-500 disabled:opacity-40"><ChevronLeft className="h-4 w-4" /></button><span className="text-xs text-slate-500">{currentPage} / {totalPages}</span><button type="button" onClick={() => setPage((current) => Math.min(totalPages, current + 1))} disabled={currentPage === totalPages} aria-label="下一页" className="flex h-8 w-8 items-center justify-center rounded-lg border border-slate-200 bg-white text-slate-500 disabled:opacity-40"><ChevronRight className="h-4 w-4" /></button></div>}</div>
        </section>
      </div>

      <LifecycleDialog transaction={selectedTransaction} card={selectedTransaction ? cardMap.get(selectedTransaction.cardId) : undefined} onClose={() => setSelectedTransaction(null)} />
    </div>
  )
}

function SummaryCard({ icon: Icon, label, value, suffix, iconClass }: { icon: typeof ReceiptText; label: string; value: string; suffix: string; iconClass: string }) {
  return <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm sm:p-5"><div className="flex items-center gap-2"><span className={`flex h-8 w-8 items-center justify-center rounded-xl ${iconClass}`}><Icon className="h-4 w-4" /></span><span className="text-xs text-slate-500">{label}</span></div><p className="mt-4 font-mono text-xl font-bold text-slate-900 sm:text-2xl">{value}</p><p className="mt-1 text-[11px] text-slate-400">{suffix}</p></div>
}

function FilterSelect({ label, value, options, onChange }: { label: string; value: string; options: Array<{ value: string; label: string }>; onChange: (value: string) => void }) {
  return <select aria-label={label} value={value} onChange={(event) => onChange(event.target.value)} className="rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-xs text-slate-600 outline-none focus:border-indigo-400">{options.map((option) => <option key={option.value} value={option.value}>{option.label}</option>)}</select>
}

function TransactionRow({ transaction, card, onOpen }: { transaction: CardTransaction; card?: VirtualCard; onOpen: () => void }) {
  const lifecycleStatus = getLifecycleStatus(transaction)
  const status = STATUS_CONFIG[lifecycleStatus]
  const symbol = CURRENCY_SYMBOL[transaction.currency] ?? `${transaction.currency} `
  const amount = (value?: number) => value ? `${symbol}${value.toFixed(2)}` : "—"
  return <tr className="border-t border-slate-100 transition-colors hover:bg-indigo-50/30"><td className="px-5 py-4"><div className="flex items-center gap-3"><span className="flex h-9 w-11 items-center justify-center rounded-lg bg-gradient-to-br from-indigo-500 to-violet-600 text-white"><CreditCard className="h-4 w-4" /></span><div><p className="text-sm font-medium text-slate-800">{transaction.merchant}</p><p className="mt-0.5 text-[11px] text-slate-400">{card?.alias ?? "未知卡片"} · {card?.displayNumber ?? transaction.cardId} · BIN {transaction.cardBin}</p></div></div></td><td className="px-5 py-4"><span className={`rounded-full px-2.5 py-1 text-[11px] font-medium ${status.className}`}>{status.label}</span></td><td className="px-5 py-4 text-right font-mono text-sm text-slate-700">{amount(transaction.authorizedAmount)}</td><td className="px-5 py-4 text-right font-mono text-sm font-medium text-slate-800">{amount(transaction.settledAmount)}</td><td className="px-5 py-4 text-right font-mono text-sm font-medium text-violet-600">{amount(transaction.refundedAmount)}</td><td className="whitespace-nowrap px-5 py-4 text-xs text-slate-500">{formatDateTime(transaction.createdAt)}</td><td className="px-5 py-4 text-right"><button type="button" onClick={onOpen} className="inline-flex items-center gap-1.5 rounded-lg border border-indigo-200 bg-white px-2.5 py-1.5 text-xs font-medium text-indigo-600 hover:bg-indigo-50"><Eye className="h-3.5 w-3.5" />查看时间线</button></td></tr>
}

function LifecycleDialog({ transaction, card, onClose }: { transaction: CardTransaction | null; card?: VirtualCard; onClose: () => void }) {
  if (!transaction) return null
  const lifecycleStatus = getLifecycleStatus(transaction)
  const status = STATUS_CONFIG[lifecycleStatus]
  const symbol = CURRENCY_SYMBOL[transaction.currency] ?? `${transaction.currency} `
  return <Dialog open onOpenChange={(next) => { if (!next) onClose() }}><DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-lg"><DialogHeader><DialogTitle className="flex flex-wrap items-center justify-between gap-2 pr-8"><span>{transaction.merchant}</span><span className={`rounded-full px-2.5 py-1 text-[11px] font-medium ${status.className}`}>{status.label}</span></DialogTitle><DialogDescription>{card?.alias ?? transaction.cardId} · {card?.displayNumber} · {transaction.merchantCategory}</DialogDescription></DialogHeader><div className="grid grid-cols-3 gap-2"><AmountBox label="授权金额" value={transaction.authorizedAmount} symbol={symbol} /><AmountBox label="结算金额" value={transaction.settledAmount} symbol={symbol} /><AmountBox label="退款金额" value={transaction.refundedAmount} symbol={symbol} highlight /></div><div><p className="mb-4 text-xs font-semibold uppercase tracking-widest text-slate-400">交易生命周期</p><div className="space-y-0">{(transaction.lifecycleEvents ?? []).map((event, index, events) => <TimelineEvent key={event.id} event={event} symbol={symbol} last={index === events.length - 1} />)}</div></div><div className="rounded-xl bg-slate-50 p-3 text-[11px] leading-relaxed text-slate-500">交易 ID：<span className="font-mono">{transaction.id}</span>。撤销表示释放未结算授权，退款表示结算后的关联入账，两者不会混为同一笔资金动作。</div></DialogContent></Dialog>
}

function AmountBox({ label, value = 0, symbol, highlight = false }: { label: string; value?: number; symbol: string; highlight?: boolean }) {
  return <div className={`rounded-xl border p-3 ${highlight ? "border-violet-100 bg-violet-50/60" : "border-slate-100 bg-slate-50"}`}><p className="text-[10px] text-slate-400">{label}</p><p className={`mt-1 font-mono text-sm font-semibold ${highlight && value > 0 ? "text-violet-700" : "text-slate-800"}`}>{symbol}{value.toFixed(2)}</p></div>
}

function TimelineEvent({ event, symbol, last }: { event: CardLifecycleEvent; symbol: string; last: boolean }) {
  const iconConfig = {
    success: { icon: CheckCircle2, className: "bg-emerald-50 text-emerald-600" },
    pending: { icon: Clock3, className: "bg-amber-50 text-amber-600" },
    failed: { icon: XCircle, className: "bg-red-50 text-red-600" },
    info: { icon: ShieldAlert, className: "bg-slate-100 text-slate-500" },
  }[event.status]
  const Icon = iconConfig.icon
  return <div className="relative flex gap-3 pb-5"><div className="relative flex flex-col items-center"><span className={`z-10 flex h-8 w-8 items-center justify-center rounded-full ${iconConfig.className}`}><Icon className="h-4 w-4" /></span>{!last && <span className="absolute bottom-[-4px] top-8 w-px bg-slate-200" />}</div><div className="min-w-0 flex-1 pt-0.5"><div className="flex flex-wrap items-start justify-between gap-2"><p className="text-sm font-medium text-slate-800">{event.title}</p>{event.amount !== undefined && <span className="font-mono text-xs font-medium text-slate-600">{symbol}{event.amount.toFixed(2)}</span>}</div><p className="mt-1 text-xs leading-relaxed text-slate-500">{event.description}</p><p className="mt-1.5 text-[10px] text-slate-400">{formatDateTime(event.createdAt)}</p></div></div>
}

function TransactionsSkeleton() {
  return <div className="min-h-screen bg-[#F8FAFC] p-4 sm:p-6 lg:p-8"><div className="mx-auto max-w-7xl space-y-6"><Skeleton className="h-12 w-64 bg-slate-200" /><div className="grid grid-cols-2 gap-3 lg:grid-cols-4">{Array.from({ length: 4 }).map((_, index) => <Skeleton key={index} className="h-32 rounded-2xl bg-slate-200" />)}</div><Skeleton className="h-[520px] rounded-2xl bg-slate-200" /></div></div>
}
