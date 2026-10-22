# 安全模拟数据规范 · Safe Mock Agent

激活后，确保所有开发阶段的数据安全和模拟数据规范。

## 核心原则

当前阶段（Phase 1）：**所有数据来自本地 mock 文件，不发任何真实网络请求。**

---

## Mock 数据规范

### 卡号格式
```typescript
// 正确：使用测试卡段，末四位真实显示
cardNumber: "4111111111111234"  // Visa 测试段
displayNumber: "**** **** **** 1234"  // 展示时永远这样

// 错误：
cardNumber: "1234567890123456"  // 随意编的，不规范
```

### CVV 规范
```typescript
// 永远不存储 CVV
// 展示时只显示：
cvvDisplay: "***"

// 点击"查看CVV"后：
// 1. 要求二次验证（PIN 或密码）
// 2. 展示真实 CVV（来自发卡商 API，mock 阶段用 "123"）
// 3. 30秒后自动隐藏
// 4. 记录查询日志
```

### 用户信息脱敏
```typescript
// 邮箱脱敏
email: "u***@gmail.com"

// 手机号脱敏
phone: "+86 138****8888"

// 姓名脱敏
name: "张**"
```

### 金额数据
```typescript
// 使用合理的测试金额（不要用 0 或极端数字）
balance: 248.50         // USDT 余额
cardBalance: 50.00      // 卡片余额
todayChange: +12.30     // 今日变化
```

---

## Mock 文件结构

### /mock/user.ts
```typescript
export const mockUser = {
  id: "user_001",
  email: "u***@gmail.com",
  username: "用户****8888",
  balance: 248.50,
  memberLevel: "普通会员",
  inviteCode: "ABC123",
  createdAt: "2024-01-15",
}
```

### /mock/cards.ts
```typescript
export const mockCards = [
  {
    id: "card_001",
    displayNumber: "**** **** **** 1234",
    cardBin: "411111",
    scheme: "Visa",
    currency: "USD",
    balance: 50.00,
    status: "normal",  // normal | frozen | cancelled
    alias: "我的主卡",
    expiryDate: "12/28",
    createdAt: "2024-02-01",
  }
]
```

### /mock/transactions.ts
```typescript
export const mockTransactions = [
  {
    id: "tx_001",
    cardId: "card_001",
    merchant: "Netflix",
    merchantCategory: "订阅服务",
    amount: -15.99,
    currency: "USD",
    status: "settled",  // settled | pending | declined | refunded
    createdAt: "2024-03-01T10:30:00Z",
  }
]
```

---

## 安全检查清单

在每次提交代码前，必须确认：

- [ ] 没有硬编码真实 API Key
- [ ] 没有硬编码真实卡号（只用 411111xxxxxx1234 格式）
- [ ] CVV 没有出现在任何 console.log 中
- [ ] 没有真实用户的个人信息出现在代码中
- [ ] 所有 API 调用都指向 mock 函数，不是真实 URL
- [ ] .env 文件已加入 .gitignore

---

## 从 Mock 切换到真实 API 的方式

当后端准备好后，只需修改一个地方：

```typescript
// lib/api.ts

// Mock 阶段（当前）：
import { mockCards } from "@/mock/cards"
export const getCards = async () => mockCards

// 真实 API 阶段（后期）：
export const getCards = async () => {
  const res = await fetch("/api/cards")
  return res.json()
}
```

这样前端组件完全不需要改动。
