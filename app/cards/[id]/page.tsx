import { CardDetailClient } from "@/components/cards/CardDetailClient"
import { mockCards } from "@/mock/cards"

// 静态打包时提前生成所有模拟卡片的详情页
export function generateStaticParams() {
  return mockCards.map((card) => ({ id: card.id }))
}

// 演示包中只开放上方已经生成的卡片页面
export const dynamicParams = false

// Next.js 16 会把动态路由参数作为 Promise 传入，必须先等待它完成
export default async function CardDetailPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params
  return <CardDetailClient cardId={id} />
}
