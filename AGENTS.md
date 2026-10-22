<!-- BEGIN:nextjs-agent-rules -->
# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` before writing any code. Heed deprecation notices.
<!-- END:nextjs-agent-rules -->

---

# VCC 发卡平台 · 项目核心规范

## 项目定位

**产品名称：Karzone**

专业虚拟信用卡与支付管理平台（类 Roogoo 形态）。

用户通过充值 USDT 加密货币，即可在线申请 Visa / Mastercard 虚拟卡，用于全球线上消费。

**负责人：** 零基础创始人，技术由 AI 辅助完成。

---

## 界面风格规范（严格遵守）

参考竞品 Roogoo 截图风格，所有页面必须符合以下规范：

### 布局结构
```
┌──────────┬─────────────────────┬──────────────┐
│  左侧    │     主内容区         │   右侧推广栏  │
│  侧边栏  │  （flex-1）          │   （w-72）    │
│  w-60    │                     │   可选显示    │
└──────────┴─────────────────────┴──────────────┘
```
- 侧边栏固定不滚动（fixed 或 sticky）
- 主内容区独立滚动
- 移动端侧边栏收起为抽屉

### 视觉规范
- 圆角：rounded-xl（卡片）、rounded-full（按钮/头像）
- 阴影：shadow-sm（默认）、shadow（悬停）
- 主色调：emerald-500 / cyan-500（渐变：from-emerald-500 to-cyan-500）
- 背景：bg-gray-50（页面底色）、bg-white（卡片）
- 危险操作：red-500
- 警告：amber-500
- 成功：emerald-500

### 强制要求
- 每个列表/表格必须有空状态 UI（图标 + 说明 + 操作引导）
- 每个异步操作必须有 loading skeleton 骨架屏
- 金额数字使用等宽字体（font-mono），右对齐
- 状态标签使用 Badge 组件，颜色语义化

---

## 教学要求（新手友好）

所有代码生成时必须遵守：

1. 先解释，再写代码
   - 用一句话说"这是什么"
   - 用生活类比解释（禁止纯技术术语）
   - 例："组件就像乐高积木，可以单独存在，也可以组合使用"

2. 代码注释用中文，简单易懂

3. 写完代码后，用一句话说"刚才做了什么"

---

## 安全规范（绝不妥协）

- 卡号显示：永远脱敏：**** **** **** 1234
- CVV：不存数据库，仅透传，展示30秒后隐藏
- 敏感操作：销卡、提现必须二次确认弹窗
- 初期数据：全部使用 mock 数据，不接真实支付通道
- 用户名：脱敏显示：用户****8888
- 密码：前端不展示，后端 bcrypt 哈希

---

## 技术栈（按优先级）

- 框架：Next.js 16（App Router）- 已安装
- 样式：Tailwind CSS v4 - 已安装
- 组件库：shadcn/ui - 已安装
- 图标：lucide-react（随 shadcn 安装）
- 通知：sonner - 已安装
- 后端（后期）：Go + PostgreSQL + Redis
- 数据库（前期）：本地 mock JSON

---

## 项目文件夹说明

```
vcc-platform/
├── app/                  # 页面文件（Next.js App Router）
│   ├── layout.tsx        # 根布局
│   ├── page.tsx          # 首页
│   ├── (auth)/           # 登录/注册页面组
│   └── (dashboard)/      # 登录后的所有页面
├── components/
│   ├── ui/               # shadcn 基础组件（不要手动修改）
│   ├── layout/           # 侧边栏、顶栏等布局组件
│   ├── cards/            # 卡片相关组件
│   ├── wallet/           # 钱包相关组件
│   └── shared/           # 通用复用组件
├── lib/
│   ├── utils.ts          # 工具函数（shadcn 自动生成）
│   ├── format.ts         # 金额/日期/卡号格式化
│   └── constants.ts      # 全局常量
├── types/
│   ├── card.ts           # 虚拟卡相关类型
│   ├── wallet.ts         # 钱包相关类型
│   └── user.ts           # 用户相关类型
├── mock/
│   ├── cards.ts          # 模拟卡片数据
│   ├── transactions.ts   # 模拟交易记录
│   └── user.ts           # 模拟用户数据
├── AGENTS.md             # 本文件：项目规范
├── CLAUDE.md             # Claude Code 入口
├── LEARNING_PLAN.md      # 学习 + 开发计划
└── LEARNING_NOTES.md     # 每阶段学习笔记
```

---

## 多 Agent 协作规则

- /teaching-mode：教学 Agent，解释概念、生活类比、零基础友好
- /fintech-ui：开发 Agent，专注写代码，严格遵守界面规范
- /safe-mock：审查 Agent，检查安全性、mock 数据规范

---

## 发卡商接口规范

### PhotonPay（已分析）
- Base URL: https://api.photonpay.com/vcc/openApi/v4/
- 认证: X-PD-TOKEN + X-PD-SIGN
- 结果通知: Webhook 异步

### MarsWallex（已分析）
- 认证: Basic Auth + RSA-SHA256 签名
- 结果通知: Webhook 异步

当前阶段：全部使用 mock 数据，不调用真实接口。
