# Fintech UI 规范 · 开发 Agent

激活后，所有界面开发严格遵守以下规范，参考竞品 Roogoo 风格。

## 布局规范

### 页面结构（必须）
```tsx
// 标准三栏布局
<div className="flex h-screen bg-gray-50">
  {/* 左侧固定侧边栏 */}
  <aside className="w-60 bg-white border-r flex-shrink-0">...</aside>

  {/* 主内容区 */}
  <main className="flex-1 overflow-y-auto p-6">...</main>

  {/* 右侧推广栏（可选） */}
  <aside className="w-72 bg-white border-l p-4 flex-shrink-0">...</aside>
</div>
```

### 侧边栏导航项
```tsx
// 激活状态：bg-gray-100 font-medium
// 普通状态：hover:bg-gray-50 text-gray-600
// 图标：lucide-react，size 18
```

## 卡片规范
```tsx
// 标准卡片
<Card className="rounded-xl shadow-sm hover:shadow transition-shadow">
  <CardHeader className="pb-2">...</CardHeader>
  <CardContent>...</CardContent>
</Card>

// 数据卡片（首页资产展示）
<div className="bg-white rounded-xl p-5 shadow-sm">
  <p className="text-sm text-gray-500">资产估值</p>
  <p className="text-2xl font-bold font-mono mt-1">0 USDT</p>
  <p className="text-xs text-gray-400 mt-1">今日 0 (0%)</p>
</div>
```

## 空状态规范（必须实现）
```tsx
// 每个列表必须有空状态
<div className="flex flex-col items-center justify-center py-16 text-center">
  <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mb-4">
    <SearchX className="w-8 h-8 text-gray-400" />
  </div>
  <p className="text-gray-500 font-medium">暂无数据</p>
  <p className="text-sm text-gray-400 mt-1">描述文字</p>
  <Button className="mt-4" size="sm">引导操作按钮</Button>
</div>
```

## 骨架屏规范（必须实现）
```tsx
// 加载中状态
<div className="space-y-3">
  <Skeleton className="h-4 w-3/4 rounded" />
  <Skeleton className="h-4 w-1/2 rounded" />
</div>
```

## 颜色语义
- 主要操作按钮：`bg-gradient-to-r from-emerald-500 to-cyan-500 text-white`
- 成功/正常状态 Badge：`bg-emerald-50 text-emerald-600`
- 冻结状态 Badge：`bg-amber-50 text-amber-600`
- 注销状态 Badge：`bg-red-50 text-red-600`
- 金额增加：`text-emerald-600`
- 金额减少：`text-red-500`

## 虚拟卡 UI 规范
```tsx
// 卡片展示组件
<div className="bg-gradient-to-br from-slate-800 to-slate-900 rounded-2xl p-5 text-white">
  <div className="flex justify-between items-start mb-8">
    <span className="text-sm opacity-70">Virtual Card</span>
    <span className="font-bold">VISA</span>
  </div>
  {/* 卡号永远脱敏 */}
  <p className="font-mono text-lg tracking-widest">**** **** **** 1234</p>
  <div className="flex gap-6 mt-4 text-sm">
    <div><p className="opacity-60 text-xs">有效期</p><p>12/28</p></div>
    <div><p className="opacity-60 text-xs">CVV</p><p>***</p></div>
  </div>
</div>
```

## 禁止行为
- 禁止使用内联 style（全用 Tailwind class）
- 禁止直接修改 components/ui/ 目录下的 shadcn 原始文件
- 禁止缺少空状态和骨架屏
- 禁止明文展示任何卡号/CVV/完整手机号
