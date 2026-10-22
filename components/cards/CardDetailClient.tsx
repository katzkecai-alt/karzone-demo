"use client"

import Link from "next/link"
import { useEffect, useState } from "react"
import {
  ArrowDownToLine,
  ArrowLeft,
  ArrowUpFromLine,
  CalendarDays,
  CheckCircle2,
  CreditCard,
  Eye,
  EyeOff,
  Lock,
  LockOpen,
  Pencil,
  ReceiptText,
  RefreshCw,
  ShieldCheck,
  Snowflake,
  Trash2,
  XCircle,
} from "lucide-react"
import { toast } from "sonner"
import { Skeleton } from "@/components/ui/skeleton"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import {
  cancelCard,
  getCardSensitiveInfo,
  getCardDetail,
  getCardTransactions,
  rechargeCard,
  toggleCardFreeze,
  withdrawCardBalance,
} from "@/lib/api"
import { formatDate, formatDateTime } from "@/lib/format"
import type { CardStatus, CardTransaction, VirtualCard } from "@/types/card"

type ConfirmAction = "cardInfo" | "freeze" | "cancel" | null
type BalanceAction = "recharge" | "withdraw" | null
type SensitiveCardInfo = { cardNumber: string; expiryDate: string; cvv: string }

const CURRENCY_SYMBOL: Record<string, string> = {
  USD: "$", EUR: "€", GBP: "£", JPY: "¥", HKD: "HK$",
}

const STATUS_STYLE: Record<CardStatus, { label: string; className: string }> = {
  normal: { label: "正常", className: "border-emerald-200 bg-emerald-50 text-emerald-700" },
  frozen: { label: "已冻结", className: "border-sky-200 bg-sky-50 text-sky-700" },
  cancelled: { label: "已注销", className: "border-slate-200 bg-slate-100 text-slate-500" },
}

const TRANSACTION_STATUS: Record<CardTransaction["status"], { label: string; className: string }> = {
  settled: { label: "已完成", className: "bg-emerald-50 text-emerald-700" },
  pending: { label: "处理中", className: "bg-amber-50 text-amber-700" },
  declined: { label: "已拒绝", className: "bg-red-50 text-red-600" },
  refunded: { label: "已退款", className: "bg-sky-50 text-sky-700" },
}

export function CardDetailClient({ cardId }: { cardId: string }) {
  const [card, setCard] = useState<VirtualCard | null>(null)
  const [transactions, setTransactions] = useState<CardTransaction[]>([])
  const [loading, setLoading] = useState(true)
  const [confirmAction, setConfirmAction] = useState<ConfirmAction>(null)
  const [actionLoading, setActionLoading] = useState(false)
  const [sensitiveInfo, setSensitiveInfo] = useState<SensitiveCardInfo | null>(null)
  const [infoCountdown, setInfoCountdown] = useState(0)
  const [balanceAction, setBalanceAction] = useState<BalanceAction>(null)
  const [amountInput, setAmountInput] = useState("")
  const [editingAlias, setEditingAlias] = useState(false)
  const [aliasDraft, setAliasDraft] = useState("")

  // 页面打开时同时读取卡片和交易，像一次取齐同一份档案的两页资料
  useEffect(() => {
    let active = true

    async function load() {
      const [cardData, transactionData] = await Promise.all([
        getCardDetail(cardId),
        getCardTransactions(cardId),
      ])
      if (!active) return
      setCard(cardData)
      setTransactions(transactionData)
      setAliasDraft(cardData?.alias ?? "")
      setLoading(false)
    }

    load()
    return () => { active = false }
  }, [cardId])

  // 完整卡号、有效期和 CVV 只在前端显示 30 秒
  useEffect(() => {
    if (!sensitiveInfo) return
    const timer = window.setInterval(() => {
      setInfoCountdown((seconds) => {
        if (seconds <= 1) {
          setSensitiveInfo(null)
          return 0
        }
        return seconds - 1
      })
    }, 1000)
    return () => window.clearInterval(timer)
  }, [sensitiveInfo])

  async function handleRevealCardInfo() {
    if (!card) return
    setActionLoading(true)
    const result = await getCardSensitiveInfo(card.id)
    setSensitiveInfo(result)
    setInfoCountdown(30)
    setActionLoading(false)
    setConfirmAction(null)
    toast.success("完整卡信息已临时显示", { description: "30 秒后会自动隐藏" })
  }

  function openBalanceDialog(action: Exclude<BalanceAction, null>) {
    setAmountInput("")
    setBalanceAction(action)
  }

  async function handleBalanceSubmit() {
    if (!card || !balanceAction) return
    const amount = Number(amountInput)
    if (!Number.isFinite(amount) || amount <= 0) {
      toast.error("请输入正确的金额")
      return
    }
    if (balanceAction === "withdraw" && amount > card.balance) {
      toast.error("提现金额不能超过卡片余额")
      return
    }

    setActionLoading(true)
    const result = balanceAction === "recharge"
      ? await rechargeCard(card.id, amount)
      : await withdrawCardBalance(card.id, amount)

    const balanceChange = balanceAction === "recharge" ? amount : -amount
    const newTransaction: CardTransaction = {
      id: `mock_${balanceAction}_${Date.now()}`,
      cardId: card.id,
      cardBin: card.cardBin,
      merchant: balanceAction === "recharge" ? "Karzone 充值" : "提现至平台钱包",
      merchantCategory: balanceAction === "recharge" ? "平台充值" : "余额提现",
      amount: balanceChange,
      currency: card.currency,
      status: "settled",
      type: balanceAction === "recharge" ? "recharge" : "withdrawal",
      createdAt: new Date().toISOString(),
    }

    setCard({ ...card, balance: card.balance + balanceChange })
    setTransactions((current) => [newTransaction, ...current])
    setActionLoading(false)
    setBalanceAction(null)
    setAmountInput("")
    toast.success(result.message, { description: "当前为前端模拟操作" })
  }

  async function handleFreezeToggle() {
    if (!card || card.status === "cancelled") return
    setActionLoading(true)
    const shouldFreeze = card.status === "normal"
    const result = await toggleCardFreeze(card.id, shouldFreeze)
    setCard({ ...card, status: shouldFreeze ? "frozen" : "normal" })
    setActionLoading(false)
    setConfirmAction(null)
    toast.success(result.message)
  }

  async function handleCancel() {
    if (!card || card.status === "cancelled") return
    setActionLoading(true)
    const result = await cancelCard(card.id)
    setCard({ ...card, status: "cancelled", balance: 0 })
    setSensitiveInfo(null)
    setActionLoading(false)
    setConfirmAction(null)
    toast.success(result.message)
  }

  function saveAlias() {
    const nextAlias = aliasDraft.trim()
    if (!card || !nextAlias) return
    setCard({ ...card, alias: nextAlias })
    setEditingAlias(false)
    toast.success("卡片名称已更新", { description: "当前为前端模拟保存" })
  }

  if (loading) return <DetailSkeleton />

  if (!card) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#F8FAFC] p-6">
        <div className="max-w-sm text-center">
          <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-slate-100">
            <XCircle className="h-7 w-7 text-slate-400" />
          </div>
          <h1 className="text-lg font-semibold text-slate-900">没有找到这张卡</h1>
          <p className="mt-2 text-sm text-slate-400">卡片可能已被删除，或链接不正确。</p>
          <Link href="/cards" className="mt-5 inline-flex items-center gap-2 rounded-xl bg-indigo-600 px-4 py-2.5 text-sm font-medium text-white hover:bg-indigo-700">
            <ArrowLeft className="h-4 w-4" />返回卡片列表
          </Link>
        </div>
      </div>
    )
  }

  const symbol = CURRENCY_SYMBOL[card.currency] ?? `${card.currency} `
  const status = STATUS_STYLE[card.status]

  return (
    <div className="min-h-screen bg-[#F8FAFC] p-4 sm:p-6 lg:p-8">
      <div className="mx-auto max-w-6xl">
        <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
          <div>
            <Link href="/cards" className="mb-2 inline-flex items-center gap-1.5 text-xs font-medium text-slate-400 transition-colors hover:text-indigo-600">
              <ArrowLeft className="h-3.5 w-3.5" />返回卡片列表
            </Link>
            <h1 className="text-xl font-semibold tracking-tight text-slate-900">卡片详情</h1>
            <p className="mt-0.5 text-sm text-slate-400">查看卡片资料、安全信息和最近交易</p>
          </div>
          <span className={`inline-flex rounded-full border px-3 py-1.5 text-xs font-medium ${status.className}`}>{status.label}</span>
        </div>

        <div className="grid gap-6 lg:grid-cols-[360px_minmax(0,1fr)]">
          <div className="space-y-5">
            {/* 紫色实体卡视觉：只展示脱敏卡号 */}
            <section className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-indigo-600 via-violet-600 to-purple-600 p-6 text-white shadow-xl shadow-indigo-500/20">
              <div className="absolute -right-12 -top-12 h-44 w-44 rounded-full bg-white/[0.08]" />
              <div className="absolute -bottom-16 -left-10 h-40 w-40 rounded-full bg-fuchsia-300/[0.10]" />
              <div className="relative flex min-h-[190px] flex-col justify-between">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2 text-sm font-semibold"><CreditCard className="h-5 w-5" />Karzone</div>
                  <span className="text-sm font-bold italic tracking-wide">{card.scheme.toUpperCase()}</span>
                </div>
                <div>
                  <p className="font-mono text-lg tracking-[0.13em]">{sensitiveInfo?.cardNumber ?? card.displayNumber}</p>
                  <div className="mt-5 grid grid-cols-3 gap-3 text-[10px] uppercase tracking-wider text-indigo-200">
                    <div><p>持卡名称</p><p className="mt-1 truncate text-xs font-medium normal-case tracking-normal text-white">{card.alias}</p></div>
                    <div><p>有效期</p><p className="mt-1 font-mono text-xs text-white">{sensitiveInfo?.expiryDate ?? "••/••"}</p></div>
                    <div><p>CVV</p><p className="mt-1 font-mono text-xs text-white">{sensitiveInfo?.cvv ?? "•••"}</p></div>
                  </div>
                </div>
              </div>
            </section>

            <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
              <div className="mb-4 flex items-start justify-between">
                <div><p className="text-xs text-slate-400">当前余额</p><p className="mt-1 font-mono text-2xl font-bold text-slate-900">{symbol}{card.balance.toFixed(2)}</p><p className="mt-0.5 text-[11px] text-slate-400">{card.currency}</p></div>
                <div className="flex items-center gap-2">
                  <button type="button" onClick={() => openBalanceDialog("recharge")} disabled={card.status === "cancelled"} className="inline-flex items-center gap-1.5 rounded-xl bg-indigo-50 px-3 py-2 text-xs font-medium text-indigo-700 transition-colors hover:bg-indigo-100 disabled:cursor-not-allowed disabled:opacity-50"><ArrowDownToLine className="h-3.5 w-3.5" />充值</button>
                  <button type="button" onClick={() => openBalanceDialog("withdraw")} disabled={card.status === "cancelled" || card.balance <= 0} className="inline-flex items-center gap-1.5 rounded-xl bg-violet-50 px-3 py-2 text-xs font-medium text-violet-700 transition-colors hover:bg-violet-100 disabled:cursor-not-allowed disabled:opacity-50"><ArrowUpFromLine className="h-3.5 w-3.5" />提现</button>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3 border-t border-slate-100 pt-4 text-xs">
                <div className="rounded-xl bg-slate-50 p-3"><p className="text-slate-400">结算币种</p><p className="mt-1 font-mono font-medium text-slate-700">{card.currency}</p></div>
                <div className="rounded-xl bg-slate-50 p-3"><p className="text-slate-400">BIN</p><p className="mt-1 font-mono font-medium text-slate-700">{card.cardBin}</p></div>
              </div>
            </section>

            <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
              <h2 className="mb-4 text-sm font-semibold text-slate-900">安全操作</h2>
              <div className="space-y-2">
                <button type="button" onClick={() => sensitiveInfo ? setSensitiveInfo(null) : setConfirmAction("cardInfo")} disabled={card.status === "cancelled"} className="flex w-full items-center justify-between rounded-xl border border-slate-200 px-3.5 py-3 text-left text-sm text-slate-700 transition-colors hover:border-indigo-200 hover:bg-indigo-50 disabled:cursor-not-allowed disabled:opacity-50">
                  <span className="flex items-center gap-2.5">{sensitiveInfo ? <EyeOff className="h-4 w-4 text-indigo-500" /> : <Eye className="h-4 w-4 text-indigo-500" />}{sensitiveInfo ? "立即隐藏卡信息" : "安全查看卡信息"}</span>
                  {sensitiveInfo && <span className="font-mono text-xs text-indigo-500">{infoCountdown}s</span>}
                </button>
                {card.status !== "cancelled" && <button type="button" onClick={() => setConfirmAction("freeze")} className="flex w-full items-center gap-2.5 rounded-xl border border-slate-200 px-3.5 py-3 text-left text-sm text-slate-700 transition-colors hover:border-sky-200 hover:bg-sky-50">{card.status === "frozen" ? <LockOpen className="h-4 w-4 text-sky-500" /> : <Snowflake className="h-4 w-4 text-sky-500" />}{card.status === "frozen" ? "解冻卡片" : "冻结卡片"}</button>}
                {card.status !== "cancelled" && <button type="button" onClick={() => setConfirmAction("cancel")} className="flex w-full items-center gap-2.5 rounded-xl border border-red-100 px-3.5 py-3 text-left text-sm text-red-600 transition-colors hover:bg-red-50"><Trash2 className="h-4 w-4" />注销卡片</button>}
              </div>
            </section>
          </div>

          <div className="space-y-5">
            <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
              <div className="mb-5 flex items-center justify-between gap-3">
                <div><h2 className="text-sm font-semibold text-slate-900">卡片资料</h2><p className="mt-0.5 text-xs text-slate-400">基础资料均来自当前 mock 数据</p></div>
                {!editingAlias && card.status !== "cancelled" && <button type="button" onClick={() => setEditingAlias(true)} className="inline-flex items-center gap-1.5 text-xs font-medium text-indigo-600 hover:text-indigo-700"><Pencil className="h-3.5 w-3.5" />修改名称</button>}
              </div>

              {editingAlias && (
                <div className="mb-5 rounded-xl border border-indigo-100 bg-indigo-50/60 p-4">
                  <label htmlFor="card-alias" className="mb-2 block text-xs font-medium text-slate-600">卡片名称</label>
                  <div className="flex flex-col gap-2 sm:flex-row">
                    <input id="card-alias" value={aliasDraft} onChange={(event) => setAliasDraft(event.target.value)} maxLength={24} className="min-w-0 flex-1 rounded-xl border border-indigo-200 bg-white px-3 py-2 text-sm text-slate-900 outline-none focus:ring-2 focus:ring-indigo-500/20" />
                    <button type="button" onClick={saveAlias} disabled={!aliasDraft.trim()} className="rounded-xl bg-indigo-600 px-4 py-2 text-xs font-medium text-white hover:bg-indigo-700 disabled:opacity-50">保存</button>
                    <button type="button" onClick={() => { setAliasDraft(card.alias); setEditingAlias(false) }} className="rounded-xl border border-slate-200 bg-white px-4 py-2 text-xs font-medium text-slate-600 hover:bg-slate-50">取消</button>
                  </div>
                </div>
              )}

              <dl className="grid gap-4 sm:grid-cols-2">
                <DetailItem icon={CreditCard} label="卡片名称" value={card.alias} />
                <DetailItem icon={ShieldCheck} label="卡组织 / 币种" value={`${card.scheme} · ${card.currency}`} />
                <DetailItem icon={CalendarDays} label="开卡日期" value={formatDate(card.createdAt)} />
                <DetailItem icon={CheckCircle2} label="卡片类型" value={card.formFactor === "virtual_card" ? "虚拟卡" : "实体卡"} />
              </dl>
            </section>

            <section className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
              <div className="flex items-center justify-between border-b border-slate-100 px-5 py-4">
                <div><h2 className="text-sm font-semibold text-slate-900">最近交易</h2><p className="mt-0.5 text-xs text-slate-400">这张卡的消费、退款、充值与提现记录</p></div>
                <span className="rounded-full bg-indigo-50 px-2.5 py-1 text-[11px] font-medium text-indigo-600">{transactions.length} 笔</span>
              </div>

              {transactions.length === 0 ? (
                <div className="flex flex-col items-center px-5 py-16 text-center"><div className="mb-3 flex h-12 w-12 items-center justify-center rounded-2xl bg-slate-100"><ReceiptText className="h-6 w-6 text-slate-400" /></div><p className="text-sm font-medium text-slate-700">还没有交易记录</p><p className="mt-1 text-xs text-slate-400">使用这张卡完成消费后，交易会显示在这里。</p></div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full min-w-[620px]">
                    <thead className="bg-slate-50/70"><tr className="text-left text-[10px] uppercase tracking-widest text-slate-400"><th className="px-5 py-3 font-medium">商户</th><th className="px-5 py-3 font-medium">时间</th><th className="px-5 py-3 font-medium">状态</th><th className="px-5 py-3 text-right font-medium">金额</th></tr></thead>
                    <tbody>
                      {transactions.map((transaction) => {
                        const txStatus = TRANSACTION_STATUS[transaction.status]
                        const txSymbol = CURRENCY_SYMBOL[transaction.currency] ?? `${transaction.currency} `
                        return (
                          <tr key={transaction.id} className="border-t border-slate-100 transition-colors hover:bg-indigo-50/40">
                            <td className="px-5 py-4"><p className="text-sm font-medium text-slate-800">{transaction.merchant}</p><p className="mt-0.5 text-[11px] text-slate-400">{transaction.merchantCategory}</p></td>
                            <td className="whitespace-nowrap px-5 py-4 text-xs text-slate-500">{formatDateTime(transaction.createdAt)}</td>
                            <td className="px-5 py-4"><span className={`rounded-full px-2 py-1 text-[11px] font-medium ${txStatus.className}`}>{txStatus.label}</span></td>
                            <td className={`whitespace-nowrap px-5 py-4 text-right font-mono text-sm font-semibold ${transaction.amount >= 0 ? "text-emerald-600" : "text-slate-800"}`}>{transaction.amount >= 0 ? "+" : "-"}{txSymbol}{Math.abs(transaction.amount).toFixed(2)}</td>
                          </tr>
                        )
                      })}
                    </tbody>
                  </table>
                </div>
              )}
            </section>
          </div>
        </div>
      </div>

      <CardInfoDialog open={confirmAction === "cardInfo"} loading={actionLoading} onClose={() => setConfirmAction(null)} onConfirm={handleRevealCardInfo} />
      <FreezeDialog open={confirmAction === "freeze"} loading={actionLoading} frozen={card.status === "frozen"} onClose={() => setConfirmAction(null)} onConfirm={handleFreezeToggle} />
      <CancelDialog open={confirmAction === "cancel"} loading={actionLoading} cardName={card.alias} onClose={() => setConfirmAction(null)} onConfirm={handleCancel} />
      <BalanceDialog
        action={balanceAction}
        amount={amountInput}
        balance={card.balance}
        currency={card.currency}
        loading={actionLoading}
        onAmountChange={setAmountInput}
        onClose={() => { if (!actionLoading) setBalanceAction(null) }}
        onConfirm={handleBalanceSubmit}
      />
    </div>
  )
}

function DetailItem({ icon: Icon, label, value }: { icon: typeof CreditCard; label: string; value: string }) {
  return <div className="flex items-center gap-3 rounded-xl border border-slate-100 bg-slate-50/60 p-3.5"><div className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-xl bg-white text-indigo-500 shadow-sm"><Icon className="h-4 w-4" /></div><div className="min-w-0"><dt className="text-[11px] text-slate-400">{label}</dt><dd className="mt-0.5 truncate text-sm font-medium text-slate-700">{value}</dd></div></div>
}

function DetailSkeleton() {
  return <div className="min-h-screen bg-[#F8FAFC] p-4 sm:p-6 lg:p-8"><div className="mx-auto max-w-6xl space-y-6"><Skeleton className="h-12 w-48 bg-slate-200" /><div className="grid gap-6 lg:grid-cols-[360px_minmax(0,1fr)]"><div className="space-y-5"><Skeleton className="h-[238px] rounded-3xl bg-slate-200" /><Skeleton className="h-40 rounded-2xl bg-slate-200" /></div><div className="space-y-5"><Skeleton className="h-56 rounded-2xl bg-slate-200" /><Skeleton className="h-72 rounded-2xl bg-slate-200" /></div></div></div></div>
}

function CardInfoDialog({ open, loading, onClose, onConfirm }: { open: boolean; loading: boolean; onClose: () => void; onConfirm: () => void }) {
  return <Dialog open={open} onOpenChange={(next) => { if (!next && !loading) onClose() }}><DialogContent><DialogHeader><DialogTitle className="flex items-center gap-2"><ShieldCheck className="h-5 w-5 text-indigo-500" />确认查看完整卡信息</DialogTitle><DialogDescription>即将显示完整卡号、有效期和 CVV。这些信息可以用于消费绑卡，将在 30 秒后自动隐藏，请勿截图或分享给他人。</DialogDescription></DialogHeader><DialogFooter><button type="button" onClick={onClose} disabled={loading} className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-600 hover:bg-slate-50">取消</button><button type="button" onClick={onConfirm} disabled={loading} className="inline-flex items-center justify-center gap-2 rounded-lg bg-indigo-600 px-3 py-2 text-sm font-medium text-white hover:bg-indigo-700 disabled:opacity-60">{loading && <RefreshCw className="h-4 w-4 animate-spin" />}确认查看</button></DialogFooter></DialogContent></Dialog>
}

function BalanceDialog({
  action,
  amount,
  balance,
  currency,
  loading,
  onAmountChange,
  onClose,
  onConfirm,
}: {
  action: BalanceAction
  amount: string
  balance: number
  currency: string
  loading: boolean
  onAmountChange: (value: string) => void
  onClose: () => void
  onConfirm: () => void
}) {
  const isWithdraw = action === "withdraw"

  return (
    <Dialog open={action !== null} onOpenChange={(next) => { if (!next && !loading) onClose() }}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            {isWithdraw ? <ArrowUpFromLine className="h-5 w-5 text-violet-500" /> : <ArrowDownToLine className="h-5 w-5 text-indigo-500" />}
            {isWithdraw ? "从卡片提现" : "向卡片充值"}
          </DialogTitle>
          <DialogDescription>
            {isWithdraw
              ? "资金将从卡片余额转回平台钱包。当前为前端模拟流程。"
              : "资金将从平台钱包转入这张卡。当前为前端模拟流程。"}
          </DialogDescription>
        </DialogHeader>

        <div>
          <div className="mb-2 flex items-center justify-between text-xs">
            <label htmlFor="balance-amount" className="font-medium text-slate-600">金额</label>
            {isWithdraw && <span className="text-slate-400">可提现 {balance.toFixed(2)} {currency}</span>}
          </div>
          <div className="relative">
            <input
              id="balance-amount"
              type="number"
              inputMode="decimal"
              min="0"
              step="0.01"
              value={amount}
              onChange={(event) => onAmountChange(event.target.value)}
              placeholder="0.00"
              className="w-full rounded-xl border border-slate-200 bg-white px-3 py-3 pr-20 font-mono text-base text-slate-900 outline-none focus:border-indigo-400 focus:ring-2 focus:ring-indigo-500/20"
            />
            <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs font-medium text-slate-400">{currency}</span>
          </div>
          {isWithdraw && balance > 0 && (
            <button type="button" onClick={() => onAmountChange(balance.toFixed(2))} className="mt-2 text-xs font-medium text-violet-600 hover:text-violet-700">全部提现</button>
          )}
        </div>

        <DialogFooter>
          <button type="button" onClick={onClose} disabled={loading} className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-600 hover:bg-slate-50">取消</button>
          <button type="button" onClick={onConfirm} disabled={loading || !amount} className={`inline-flex items-center justify-center gap-2 rounded-lg px-3 py-2 text-sm font-medium text-white disabled:opacity-60 ${isWithdraw ? "bg-violet-600 hover:bg-violet-700" : "bg-indigo-600 hover:bg-indigo-700"}`}>
            {loading && <RefreshCw className="h-4 w-4 animate-spin" />}
            {isWithdraw ? "确认提现" : "确认充值"}
          </button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

function FreezeDialog({ open, loading, frozen, onClose, onConfirm }: { open: boolean; loading: boolean; frozen: boolean; onClose: () => void; onConfirm: () => void }) {
  return <Dialog open={open} onOpenChange={(next) => { if (!next && !loading) onClose() }}><DialogContent><DialogHeader><DialogTitle className="flex items-center gap-2">{frozen ? <LockOpen className="h-5 w-5 text-sky-500" /> : <Lock className="h-5 w-5 text-sky-500" />}{frozen ? "确认解冻卡片" : "确认冻结卡片"}</DialogTitle><DialogDescription>{frozen ? "解冻后，这张卡将恢复交易能力。" : "冻结后，这张卡会立即暂停交易，之后可以随时解冻。"}</DialogDescription></DialogHeader><DialogFooter><button type="button" onClick={onClose} disabled={loading} className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-600 hover:bg-slate-50">取消</button><button type="button" onClick={onConfirm} disabled={loading} className="inline-flex items-center justify-center gap-2 rounded-lg bg-sky-600 px-3 py-2 text-sm font-medium text-white hover:bg-sky-700 disabled:opacity-60">{loading && <RefreshCw className="h-4 w-4 animate-spin" />}{frozen ? "确认解冻" : "确认冻结"}</button></DialogFooter></DialogContent></Dialog>
}

function CancelDialog({ open, loading, cardName, onClose, onConfirm }: { open: boolean; loading: boolean; cardName: string; onClose: () => void; onConfirm: () => void }) {
  return <Dialog open={open} onOpenChange={(next) => { if (!next && !loading) onClose() }}><DialogContent><DialogHeader><DialogTitle className="flex items-center gap-2 text-red-600"><Trash2 className="h-5 w-5" />确认注销卡片</DialogTitle><DialogDescription>即将注销“{cardName}”。这是不可逆操作，卡片注销后无法恢复，剩余余额将退回钱包。</DialogDescription></DialogHeader><div className="rounded-xl border border-red-100 bg-red-50 p-3 text-xs leading-relaxed text-red-600">请再次确认：你不再需要使用这张卡，并已处理所有待完成交易。</div><DialogFooter><button type="button" onClick={onClose} disabled={loading} className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-600 hover:bg-slate-50">保留卡片</button><button type="button" onClick={onConfirm} disabled={loading} className="inline-flex items-center justify-center gap-2 rounded-lg bg-red-600 px-3 py-2 text-sm font-medium text-white hover:bg-red-700 disabled:opacity-60">{loading && <RefreshCw className="h-4 w-4 animate-spin" />}确认注销</button></DialogFooter></DialogContent></Dialog>
}
