import type { Metadata } from "next"
import "./globals.css"
import { Sidebar } from "@/components/layout/Sidebar"
import { Toaster } from "@/components/ui/sonner"
// Toaster：Toast 通知的"显示容器"，放在 body 底层，全局生效
// 就像饭店里的广播系统——设备装好后，任何地方喊话都能播出来

// 网站标题和描述（会显示在浏览器标签页上）
export const metadata: Metadata = {
  title: "Karzone",
  description: "Karzone - 专业虚拟信用卡与支付管理平台",
}

// RootLayout 是最外层的"框架"
// 所有页面都会被包在这个框架里显示
export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="zh" className="h-full antialiased">
      {/* h-full 让 body 占满浏览器高度 */}
      <body className="h-full flex bg-[#F8FAFC]">

        {/* 左侧固定侧边栏 */}
        <Sidebar />

        {/* 右侧主内容区：flex-1 占满剩余宽度，overflow-y-auto 允许独立滚动 */}
        <main className="min-w-0 flex-1 overflow-y-auto pt-14 md:pt-0">
          {children}
        </main>

        {/* Toast 通知容器：固定在屏幕右下角，全局可用 */}
        {/* theme="dark" 让通知样式与我们的暗色主题匹配 */}
        <Toaster theme="dark" position="bottom-right" />

      </body>
    </html>
  )
}
