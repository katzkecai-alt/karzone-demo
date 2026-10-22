"use client"

import { useEffect, useMemo, useState } from "react"
import {
  ArrowDownToLine,
  ArrowUpFromLine,
  CheckCircle2,
  CircleDollarSign,
  Clock3,
  Copy,
  QrCode,
  RefreshCw,
  Search,
  ShieldCheck,
  WalletCards,
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
  getDepositAddresses,
  getWalletBalance,
  getWalletTransactions,
  submitWithdraw,
} from "@/lib/api"
import { formatDateTime, getTransactionTypeLabel } from "@/lib/format"
import type {
  DepositAddress,
  TransactionStatus,
  TransactionType,
  WalletBalance,
  WalletTransaction,
} from "@/types/wallet"

const STATUS_CONFIG: Record<TransactionStatus, { label: string; className: string; icon: typeof CheckCircle2 }> = {
  completed: { label: "已完成", className: "bg-emerald-50 text-emerald-700", icon: CheckCircle2 },
  processing: { label: "处理中", className: "bg-sky-50 text-sky-700", icon: RefreshCw },
  pending: { label: "待确认", className: "bg-amber-50 text-amber-700", icon: Clock3 },
  failed: { label: "失败", className: "bg-red-50 text-red-600", icon: XCircle },
}

const TYPE_FILTERS: Array<{ value: "all" | TransactionType; label: string }> = [
  { value: "all", label: "全部流水" },
  { value: "deposit", label: "充值" },
  { value: "withdraw", label: "提现" },
  { value: "card_recharge", label: "卡片充值" },
  { value: "card_refund", label: "卡片退款" },
  { value: "commission", label: "返佣" },
]

export default function WalletPage() {
  const [balance, setBalance] = useState<WalletBalance | null>(null)
  const [transactions, setTransactions] = useState<WalletTransaction[]>([])
  const [addresses, setAddresses] = useState<DepositAddress[]>([])
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)
  const [depositOpen, setDepositOpen] = useState(false)
  const [withdrawOpen, setWithdrawOpen] = useState(false)
  const [withdrawStep, setWithdrawStep] = useState<"form" | "confirm">("form")
  const [selectedNetwork, setSelectedNetwork] = useState("TRC20")
  const [withdrawAddress, setWithdrawAddress] = useState("")
  const [withdrawAmount, setWithdrawAmount] = useState("")
  const [actionLoading, setActionLoading] = useState(false)
  const [typeFilter, setTypeFilter] = useState<"all" | TransactionType>("all")
  const [search, setSearch] = useState("")

  useEffect(() => {
    let active = true
    Promise.all([getWalletBalance(), getWalletTransactions(), getDepositAddresses()]).then(
      ([balanceData, transactionData, addressData]) => {
        if (!active) return
        setBalance(balanceData)
        setTransactions(transactionData)
        setAddresses(addressData)
        setSelectedNetwork(addressData[0]?.network ?? "TRC20")
        setLoading(false)
      }
    )
    return () => { active = false }
  }, [])

  const selectedDepositAddress = addresses.find((item) => item.network === selectedNetwork) ?? addresses[0]

  const filteredTransactions = useMemo(() => {
    const keyword = search.trim().toLowerCase()
    return transactions.filter((transaction) => {
      if (typeFilter !== "all" && transaction.type !== typeFilter) return false
      if (!keyword) return true
      return [transaction.note, transaction.txHash, getTransactionTypeLabel(transaction.type)]
        .some((value) => value?.toLowerCase().includes(keyword))
    })
  }, [transactions, typeFilter, search])

  async function refreshWallet() {
    setRefreshing(true)
    const [balanceData, transactionData] = await Promise.all([
      getWalletBalance(),
      getWalletTransactions(),
    ])
    setBalance(balanceData)
    setTransactions(transactionData)
    setRefreshing(false)
    toast.success("钱包数据已刷新")
  }

  async function copyAddress() {
    if (!selectedDepositAddress) return
    await navigator.clipboard.writeText(selectedDepositAddress.address)
    toast.success("充值地址已复制")
  }

  function openWithdraw() {
    setWithdrawAddress("")
    setWithdrawAmount("")
    setWithdrawStep("form")
    setWithdrawOpen(true)
  }

  function reviewWithdraw() {
    const amount = Number(withdrawAmount)
    if (!withdrawAddress.trim()) return toast.error("请输入提现地址")
    if (!Number.isFinite(amount) || amount <= 0) return toast.error("请输入正确的提现金额")
    if (!balance || amount > balance.available) return toast.error("提现金额超过可用余额")
    setWithdrawStep("confirm")
  }

  async function confirmWithdraw() {
    if (!balance) return
    const amount = Number(withdrawAmount)
    setActionLoading(true)
    const result = await submitWithdraw({
      address: withdrawAddress.trim(),
      amount,
      network: selectedNetwork,
    })

    const newTransaction: WalletTransaction = {
      id: `wallet_withdraw_${Date.now()}`,
      type: "withdraw",
      amount: -amount,
      currency: balance.currency,
      status: "processing",
      txHash: "审核中",
      note: `${selectedNetwork} 提现`,
      createdAt: new Date().toISOString(),
    }

    setBalance({
      ...balance,
      available: balance.available - amount,
      frozenAmount: balance.frozenAmount + amount,
    })
    setTransactions((current) => [newTransaction, ...current])
    setActionLoading(false)
    setWithdrawOpen(false)
    toast.success(result.message, { description: "资金已进入冻结余额，审核完成后上链" })
  }

  if (loading) return <WalletSkeleton />
  if (!balance) return null

  return (
    <div className="min-h-screen bg-[#F8FAFC] p-4 sm:p-6 lg:p-8">
      <div className="mx-auto max-w-6xl space-y-6">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <h1 className="text-xl font-semibold tracking-tight text-slate-900">钱包</h1>
            <p className="mt-0.5 text-sm text-slate-400">管理平台余额、链上充提和资金流水</p>
          </div>
          <button type="button" onClick={refreshWallet} disabled={refreshing} className="inline-flex items-center gap-1.5 rounded-xl px-3 py-2 text-xs font-medium text-slate-500 transition-colors hover:bg-indigo-50 hover:text-indigo-600 disabled:opacity-50">
            <RefreshCw className={`h-3.5 w-3.5 ${refreshing ? "animate-spin" : ""}`} />刷新
          </button>
        </div>

        <div className="grid gap-4 lg:grid-cols-[minmax(0,1.5fr)_minmax(300px,0.8fr)]">
          <section className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-indigo-600 via-violet-600 to-purple-600 p-6 text-white shadow-xl shadow-indigo-500/20 sm:p-7">
            <div className="absolute -right-14 -top-16 h-56 w-56 rounded-full bg-white/[0.08]" />
            <div className="absolute -bottom-20 left-20 h-52 w-52 rounded-full bg-fuchsia-300/[0.08]" />
            <div className="relative">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 text-sm font-medium text-indigo-100"><WalletCards className="h-5 w-5" />平台钱包</div>
                <span className="rounded-full bg-white/10 px-3 py-1 text-xs text-indigo-100">{balance.currency}</span>
              </div>
              <p className="mt-8 text-xs text-indigo-200">可用余额</p>
              <p className="mt-1 font-mono text-4xl font-bold tracking-tight">{balance.available.toFixed(2)}</p>
              <div className="mt-8 grid grid-cols-2 gap-4 border-t border-white/15 pt-5 text-xs">
                <div><p className="text-indigo-200">总余额</p><p className="mt-1 font-mono text-base font-semibold">{balance.amount.toFixed(2)}</p></div>
                <div><p className="text-indigo-200">冻结中</p><p className="mt-1 font-mono text-base font-semibold">{balance.frozenAmount.toFixed(2)}</p></div>
              </div>
            </div>
          </section>

          <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
            <p className="text-xs font-medium uppercase tracking-widest text-slate-400">资金操作</p>
            <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-1">
              <button type="button" onClick={() => setDepositOpen(true)} className="group flex items-center gap-3 rounded-2xl border border-indigo-100 bg-indigo-50 p-4 text-left transition-all hover:border-indigo-200 hover:bg-indigo-100">
                <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-white text-indigo-600 shadow-sm"><ArrowDownToLine className="h-5 w-5" /></span>
                <span><span className="block text-sm font-semibold text-slate-800">充值 USDT</span><span className="mt-0.5 block text-xs text-slate-400">获取链上充值地址</span></span>
              </button>
              <button type="button" onClick={openWithdraw} disabled={balance.available <= 0} className="group flex items-center gap-3 rounded-2xl border border-violet-100 bg-violet-50 p-4 text-left transition-all hover:border-violet-200 hover:bg-violet-100 disabled:opacity-50">
                <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-white text-violet-600 shadow-sm"><ArrowUpFromLine className="h-5 w-5" /></span>
                <span><span className="block text-sm font-semibold text-slate-800">提现 USDT</span><span className="mt-0.5 block text-xs text-slate-400">转出到链上钱包</span></span>
              </button>
            </div>
            <div className="mt-4 flex items-start gap-2 rounded-xl bg-slate-50 p-3 text-[11px] leading-relaxed text-slate-500"><ShieldCheck className="mt-0.5 h-3.5 w-3.5 flex-shrink-0 text-emerald-500" />提现需经过安全审核，处理中金额会暂时计入冻结余额。</div>
          </section>
        </div>

        <section className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
          <div className="border-b border-slate-100 p-5">
            <div className="flex flex-wrap items-start justify-between gap-4">
              <div><h2 className="text-sm font-semibold text-slate-900">资金流水</h2><p className="mt-0.5 text-xs text-slate-400">充值、提现、开卡和卡片资金变动记录</p></div>
              <div className="relative w-full sm:w-64"><Search className="absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-slate-400" /><input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="搜索备注或交易哈希" className="w-full rounded-xl border border-slate-200 bg-white py-2 pl-9 pr-3 text-xs text-slate-700 outline-none focus:border-indigo-400 focus:ring-2 focus:ring-indigo-500/20" /></div>
            </div>
            <div className="mt-4 flex gap-2 overflow-x-auto pb-1">
              {TYPE_FILTERS.map((item) => <button key={item.value} type="button" onClick={() => setTypeFilter(item.value)} className={`whitespace-nowrap rounded-full px-3 py-1.5 text-xs font-medium transition-colors ${typeFilter === item.value ? "bg-indigo-600 text-white" : "bg-slate-100 text-slate-500 hover:bg-indigo-50 hover:text-indigo-600"}`}>{item.label}</button>)}
            </div>
          </div>

          {filteredTransactions.length === 0 ? (
            <div className="flex flex-col items-center px-5 py-16 text-center"><div className="mb-3 flex h-12 w-12 items-center justify-center rounded-2xl bg-slate-100"><CircleDollarSign className="h-6 w-6 text-slate-400" /></div><p className="text-sm font-medium text-slate-700">没有符合条件的流水</p><p className="mt-1 text-xs text-slate-400">尝试更换筛选条件，或完成第一笔充值。</p></div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full min-w-[760px]">
                <thead className="bg-slate-50/70"><tr className="text-left text-[10px] uppercase tracking-widest text-slate-400"><th className="px-5 py-3 font-medium">类型</th><th className="px-5 py-3 font-medium">时间</th><th className="px-5 py-3 font-medium">状态</th><th className="px-5 py-3 font-medium">交易信息</th><th className="px-5 py-3 text-right font-medium">金额</th></tr></thead>
                <tbody>{filteredTransactions.map((transaction) => <WalletTransactionRow key={transaction.id} transaction={transaction} />)}</tbody>
              </table>
            </div>
          )}
          <div className="border-t border-slate-100 bg-slate-50/60 px-5 py-3 text-[11px] text-slate-400">显示 {filteredTransactions.length} 条，共 {transactions.length} 条记录</div>
        </section>
      </div>

      <DepositDialog open={depositOpen} addresses={addresses} network={selectedNetwork} selectedAddress={selectedDepositAddress} onNetworkChange={setSelectedNetwork} onCopy={copyAddress} onClose={() => setDepositOpen(false)} />
      <WithdrawDialog open={withdrawOpen} step={withdrawStep} balance={balance} network={selectedNetwork} address={withdrawAddress} amount={withdrawAmount} loading={actionLoading} onNetworkChange={setSelectedNetwork} onAddressChange={setWithdrawAddress} onAmountChange={setWithdrawAmount} onReview={reviewWithdraw} onBack={() => setWithdrawStep("form")} onConfirm={confirmWithdraw} onClose={() => { if (!actionLoading) setWithdrawOpen(false) }} />
    </div>
  )
}

function WalletTransactionRow({ transaction }: { transaction: WalletTransaction }) {
  const status = STATUS_CONFIG[transaction.status]
  const StatusIcon = status.icon
  return <tr className="border-t border-slate-100 transition-colors hover:bg-indigo-50/30"><td className="px-5 py-4"><p className="text-sm font-medium text-slate-800">{getTransactionTypeLabel(transaction.type)}</p><p className="mt-0.5 text-[11px] text-slate-400">{transaction.note ?? "—"}</p></td><td className="whitespace-nowrap px-5 py-4 text-xs text-slate-500">{formatDateTime(transaction.createdAt)}</td><td className="px-5 py-4"><span className={`inline-flex items-center gap-1 rounded-full px-2 py-1 text-[11px] font-medium ${status.className}`}><StatusIcon className={`h-3 w-3 ${transaction.status === "processing" ? "animate-spin" : ""}`} />{status.label}</span></td><td className="px-5 py-4"><p className="max-w-[190px] truncate font-mono text-[11px] text-slate-400">{transaction.txHash ?? transaction.id}</p></td><td className={`whitespace-nowrap px-5 py-4 text-right font-mono text-sm font-semibold ${transaction.amount >= 0 ? "text-emerald-600" : "text-slate-800"}`}>{transaction.amount >= 0 ? "+" : "-"}{Math.abs(transaction.amount).toFixed(2)} {transaction.currency}</td></tr>
}

function DepositDialog({ open, addresses, network, selectedAddress, onNetworkChange, onCopy, onClose }: { open: boolean; addresses: DepositAddress[]; network: string; selectedAddress?: DepositAddress; onNetworkChange: (value: string) => void; onCopy: () => void; onClose: () => void }) {
  return <Dialog open={open} onOpenChange={(next) => { if (!next) onClose() }}><DialogContent className="sm:max-w-md"><DialogHeader><DialogTitle className="flex items-center gap-2"><ArrowDownToLine className="h-5 w-5 text-indigo-500" />充值 USDT</DialogTitle><DialogDescription>选择正确的网络后，将 USDT 转入下方地址。转错网络可能导致资产丢失。</DialogDescription></DialogHeader><div className="flex gap-2">{addresses.map((item) => <button key={item.network} type="button" onClick={() => onNetworkChange(item.network)} className={`flex-1 rounded-xl border px-3 py-2 text-sm font-medium ${network === item.network ? "border-indigo-300 bg-indigo-50 text-indigo-700" : "border-slate-200 text-slate-500"}`}>{item.network}</button>)}</div>{selectedAddress && <div className="space-y-3"><div className="mx-auto flex h-28 w-28 items-center justify-center rounded-2xl border border-slate-200 bg-slate-50"><QrCode className="h-20 w-20 text-slate-800" /></div><div className="rounded-xl border border-slate-200 bg-slate-50 p-3"><p className="break-all font-mono text-xs leading-relaxed text-slate-700">{selectedAddress.address}</p><button type="button" onClick={onCopy} className="mt-3 inline-flex items-center gap-1.5 text-xs font-medium text-indigo-600"><Copy className="h-3.5 w-3.5" />复制地址</button></div><div className="grid grid-cols-2 gap-3 text-xs"><div className="rounded-xl bg-slate-50 p-3"><p className="text-slate-400">最低充值</p><p className="mt-1 font-mono font-medium text-slate-700">{selectedAddress.minAmount} USDT</p></div><div className="rounded-xl bg-slate-50 p-3"><p className="text-slate-400">到账确认</p><p className="mt-1 font-medium text-slate-700">{selectedAddress.confirmations} 次确认</p></div></div></div>}<DialogFooter><button type="button" onClick={onClose} className="rounded-lg bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-700">我知道了</button></DialogFooter></DialogContent></Dialog>
}

function WithdrawDialog({ open, step, balance, network, address, amount, loading, onNetworkChange, onAddressChange, onAmountChange, onReview, onBack, onConfirm, onClose }: { open: boolean; step: "form" | "confirm"; balance: WalletBalance; network: string; address: string; amount: string; loading: boolean; onNetworkChange: (value: string) => void; onAddressChange: (value: string) => void; onAmountChange: (value: string) => void; onReview: () => void; onBack: () => void; onConfirm: () => void; onClose: () => void }) {
  return <Dialog open={open} onOpenChange={(next) => { if (!next && !loading) onClose() }}><DialogContent className="sm:max-w-md"><DialogHeader><DialogTitle className="flex items-center gap-2"><ArrowUpFromLine className="h-5 w-5 text-violet-500" />{step === "form" ? "提现 USDT" : "确认提现信息"}</DialogTitle><DialogDescription>{step === "form" ? "填写收款地址和金额。提交前请再次核对网络与地址。" : "提现提交后将进入安全审核，请确认以下信息准确无误。"}</DialogDescription></DialogHeader>{step === "form" ? <div className="space-y-4"><div><label className="mb-2 block text-xs font-medium text-slate-600">提现网络</label><div className="grid grid-cols-2 gap-2">{["TRC20", "ERC20"].map((item) => <button key={item} type="button" onClick={() => onNetworkChange(item)} className={`rounded-xl border px-3 py-2 text-sm font-medium ${network === item ? "border-violet-300 bg-violet-50 text-violet-700" : "border-slate-200 text-slate-500"}`}>{item}</button>)}</div></div><div><label htmlFor="withdraw-address" className="mb-2 block text-xs font-medium text-slate-600">收款地址</label><input id="withdraw-address" value={address} onChange={(event) => onAddressChange(event.target.value)} placeholder={network === "TRC20" ? "请输入 T 开头的地址" : "请输入 0x 开头的地址"} className="w-full rounded-xl border border-slate-200 px-3 py-2.5 text-sm outline-none focus:border-violet-400 focus:ring-2 focus:ring-violet-500/20" /></div><div><div className="mb-2 flex items-center justify-between"><label htmlFor="withdraw-amount" className="text-xs font-medium text-slate-600">提现金额</label><span className="text-[11px] text-slate-400">可用 {balance.available.toFixed(2)} USDT</span></div><div className="relative"><input id="withdraw-amount" type="number" inputMode="decimal" min="0" step="0.01" value={amount} onChange={(event) => onAmountChange(event.target.value)} placeholder="0.00" className="w-full rounded-xl border border-slate-200 px-3 py-2.5 pr-16 font-mono text-sm outline-none focus:border-violet-400 focus:ring-2 focus:ring-violet-500/20" /><span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-slate-400">USDT</span></div><button type="button" onClick={() => onAmountChange(balance.available.toFixed(2))} className="mt-2 text-xs font-medium text-violet-600">全部提现</button></div></div> : <div className="space-y-3 rounded-2xl border border-violet-100 bg-violet-50/60 p-4 text-sm"><ConfirmRow label="提现金额" value={`${Number(amount).toFixed(2)} USDT`} /><ConfirmRow label="网络" value={network} /><ConfirmRow label="收款地址" value={address} mono /><div className="flex items-start gap-2 border-t border-violet-100 pt-3 text-xs leading-relaxed text-violet-700"><ShieldCheck className="mt-0.5 h-3.5 w-3.5 flex-shrink-0" />请确认网络与地址完全正确，链上转账完成后无法撤销。</div></div>}<DialogFooter>{step === "form" ? <><button type="button" onClick={onClose} className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-600">取消</button><button type="button" onClick={onReview} className="rounded-lg bg-violet-600 px-3 py-2 text-sm font-medium text-white hover:bg-violet-700">下一步</button></> : <><button type="button" onClick={onBack} disabled={loading} className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-600">返回修改</button><button type="button" onClick={onConfirm} disabled={loading} className="inline-flex items-center justify-center gap-2 rounded-lg bg-violet-600 px-3 py-2 text-sm font-medium text-white hover:bg-violet-700 disabled:opacity-60">{loading && <RefreshCw className="h-4 w-4 animate-spin" />}确认提现</button></>}</DialogFooter></DialogContent></Dialog>
}

function ConfirmRow({ label, value, mono = false }: { label: string; value: string; mono?: boolean }) {
  return <div className="flex items-start justify-between gap-4"><span className="text-slate-400">{label}</span><span className={`max-w-[250px] break-all text-right font-medium text-slate-700 ${mono ? "font-mono text-xs" : ""}`}>{value}</span></div>
}

function WalletSkeleton() {
  return <div className="min-h-screen bg-[#F8FAFC] p-4 sm:p-6 lg:p-8"><div className="mx-auto max-w-6xl space-y-6"><Skeleton className="h-12 w-40 bg-slate-200" /><div className="grid gap-4 lg:grid-cols-[minmax(0,1.5fr)_minmax(300px,0.8fr)]"><Skeleton className="h-72 rounded-3xl bg-slate-200" /><Skeleton className="h-72 rounded-2xl bg-slate-200" /></div><Skeleton className="h-96 rounded-2xl bg-slate-200" /></div></div>
}
