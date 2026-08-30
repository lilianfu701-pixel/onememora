import { notFound } from "next/navigation";
import { setRequestLocale } from "next-intl/server";
import { currentActor } from "@/modules/auth/current-user";
import { db } from "@/db/client";
import { offeringProducts } from "@/db/schema";
import { desc } from "drizzle-orm";

export default async function OfferingsPage(props: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await props.params;
  setRequestLocale(locale);

  const actor = await currentActor();
  if (actor.platformRole !== "super_admin") {
    notFound();
  }

  const products = await db()
    .select({
      id: offeringProducts.id,
      slug: offeringProducts.slug,
      category: offeringProducts.category,
      priceMinor: offeringProducts.priceMinor,
      currency: offeringProducts.currency,
      points: offeringProducts.points,
      isActive: offeringProducts.isActive,
      sortWeight: offeringProducts.sortWeight,
    })
    .from(offeringProducts)
    .orderBy(desc(offeringProducts.sortWeight));

  return (
    <div className="stack-lg">
      <h1>供品商品</h1>
      <p className="muted">
        管理供品商品目录。商品通过数据库种子或 API 添加，多币种价格按商品设置。
      </p>

      {products.length > 0 ? (
        <table className="adminTable">
          <thead>
            <tr>
              <th>标识</th>
              <th>分类</th>
              <th>价格</th>
              <th>积分</th>
              <th>状态</th>
              <th>权重</th>
            </tr>
          </thead>
          <tbody>
            {products.map((p) => (
              <tr key={p.id}>
                <td>{p.slug}</td>
                <td>{p.category}</td>
                <td>
                  {p.priceMinor !== null
                    ? `${(p.priceMinor / 100).toFixed(2)} ${p.currency ?? ""}`
                    : "免费"}
                </td>
                <td>{p.points}</td>
                <td>
                  <span className={`adminBadge ${p.isActive ? "adminBadge--open" : ""}`}>
                    {p.isActive ? "启用" : "停用"}
                  </span>
                </td>
                <td>{p.sortWeight}</td>
              </tr>
            ))}
          </tbody>
        </table>
      ) : (
        <p className="muted">尚未配置商品。运行种子脚本添加默认供品。</p>
      )}
    </div>
  );
}
