"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { useEffect, useState } from "react"
import {
  Home,
  CreditCard,
  Wallet,
  Receipt,
  HelpCircle,
  Globe,
  ChevronDown,
  Menu,
  X,
} from "lucide-react"
import { cn } from "@/lib/utils"

// ─────────────────────────────────────────────
// 导航菜单配置
// ─────────────────────────────────────────────
const NAV_ITEMS = [
  { href: "/",             label: "首页",     icon: Home       },
  { href: "/cards",        label: "卡片",     icon: CreditCard },
  { href: "/wallet",       label: "钱包",     icon: Wallet     },
  { href: "/transactions", label: "卡交易明细", icon: Receipt    },
]

// ─────────────────────────────────────────────
// 浅色主题色值说明（与仪表盘白色系保持统一）
//
// 背景:       白色 #FFFFFF
// 分隔线:     slate-100 ← 极浅灰，有结构感但不突兀
// 激活菜单:   indigo-50 背景 + indigo-700 文字 + indigo-600 图标
// 普通菜单:   slate-600 文字 + slate-400 图标
// 悬停:       slate-50 背景 + slate-900 文字
// ─────────────────────────────────────────────

export function Sidebar() {
  const pathname = usePathname()
  const [mobileOpen, setMobileOpen] = useState(false)

  // 主内容区自己负责滚动，因此切换页面时要主动回到顶部
  useEffect(() => {
    document.querySelector("main")?.scrollTo({ top: 0 })
  }, [pathname])

  return (
    <>
      {/* 手机顶部栏：像抽屉把手，点击后从左侧展开导航 */}
      <header className="fixed inset-x-0 top-0 z-30 h-14 border-b border-slate-200 bg-white/95 px-4 backdrop-blur md:hidden">
        <div className="flex h-full items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-br from-indigo-500 to-violet-500 shadow-md shadow-indigo-500/25">
              <CreditCard className="h-4 w-4 text-white" />
            </div>
            <span className="text-[15px] font-bold tracking-tight text-slate-900">Karzone</span>
          </div>
          <button
            type="button"
            onClick={() => setMobileOpen((open) => !open)}
            className="flex h-9 w-9 items-center justify-center rounded-xl text-slate-600 transition-colors hover:bg-indigo-50 hover:text-indigo-700"
            aria-label={mobileOpen ? "关闭导航菜单" : "打开导航菜单"}
            aria-expanded={mobileOpen}
          >
            {mobileOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </button>
        </div>
      </header>

      {/* 手机遮罩：点击空白区域即可关闭抽屉 */}
      {mobileOpen && (
        <button
          type="button"
          aria-label="关闭导航菜单"
          onClick={() => setMobileOpen(false)}
          className="fixed inset-0 z-40 bg-slate-950/25 backdrop-blur-[1px] md:hidden"
        />
      )}

      {/* 桌面端固定显示；手机端从左侧滑出 */}
      <aside className={`fixed inset-y-0 left-0 z-50 flex h-screen w-[220px] flex-shrink-0 flex-col border-r border-slate-200 bg-white transition-transform duration-200 md:sticky md:top-0 md:z-auto md:translate-x-0 ${
        mobileOpen ? "translate-x-0" : "-translate-x-full"
      }`}>

      {/* ── Logo 区域 ── */}
      <div className="px-5 h-16 flex items-center border-b border-slate-100">
        <div className="flex items-center gap-2.5">
          {/* 品牌图标：改为紫色渐变，与主题强调色一致 */}
          <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-indigo-500 to-violet-500 flex items-center justify-center shadow-md shadow-indigo-500/25">
            <CreditCard className="w-4 h-4 text-white" />
          </div>
          {/* 品牌名：深色文字，在白色背景上清晰可读 */}
          <span className="font-bold text-slate-900 text-[15px] tracking-tight">
            Karzone
          </span>
        </div>
      </div>

      {/* ── 主导航菜单 ── */}
      <nav className="flex-1 px-3 py-3 space-y-0.5 overflow-y-auto">
        {NAV_ITEMS.map((item) => {
          const isActive = item.href === "/"
            ? pathname === "/"
            : pathname === item.href || pathname.startsWith(`${item.href}/`)

          return (
            <Link
              key={item.href}
              href={item.href}
              onClick={() => setMobileOpen(false)}
              className={cn(
                "flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm transition-all duration-150 group",
                isActive
                  // 激活状态：淡紫色背景 + 深紫色文字，专业且突出
                  ? "bg-indigo-50 text-indigo-700 font-medium"
                  // 普通状态：深灰文字，悬停时浅灰背景
                  : "text-slate-600 hover:bg-slate-50 hover:text-slate-900"
              )}
            >
              {/* 菜单图标：激活时紫色，普通时灰色 */}
              <item.icon
                className={cn(
                  "w-[18px] h-[18px] flex-shrink-0 transition-colors",
                  isActive
                    ? "text-indigo-600"
                    : "text-slate-400 group-hover:text-slate-600"
                )}
              />

              {/* 菜单文字 */}
              <span className="flex-1">{item.label}</span>

              {/* 激活状态右侧小圆点，与强调色一致 */}
              {isActive && (
                <span className="w-1.5 h-1.5 rounded-full bg-indigo-500" />
              )}
            </Link>
          )
        })}
      </nav>

      {/* ── 底部工具区 ── */}
      <div className="px-3 pt-3 pb-4 border-t border-slate-100 space-y-0.5">

        {/* 帮助中心 */}
        <Link
          href="/help"
          onClick={() => setMobileOpen(false)}
          className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm text-slate-500 hover:bg-slate-50 hover:text-slate-700 transition-colors group"
        >
          <HelpCircle className="w-[18px] h-[18px] text-slate-400 group-hover:text-slate-600" />
          帮助中心
        </Link>

        {/* 语言切换 */}
        <button className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm text-slate-500 hover:bg-slate-50 hover:text-slate-700 transition-colors group">
          <Globe className="w-[18px] h-[18px] text-slate-400 group-hover:text-slate-600" />
          <span className="flex-1 text-left">CN - 简体中文</span>
          <ChevronDown className="w-3.5 h-3.5 text-slate-400" />
        </button>

        {/* 版权信息：浅灰，低调处理 */}
        <p className="px-3 pt-1 text-[11px] text-slate-400">
          © 2026 Karzone
        </p>
      </div>
      </aside>
    </>
  )
}
