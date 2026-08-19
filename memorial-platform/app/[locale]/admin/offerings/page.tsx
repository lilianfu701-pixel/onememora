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
      <h1>Offering Products</h1>
      <p className="muted">
        Manage the product catalog. Products are added via the database seed or
        API. Multi-currency pricing is set per product.
      </p>

      {products.length > 0 ? (
        <table className="adminTable">
          <thead>
            <tr>
              <th>Slug</th>
              <th>Category</th>
              <th>Price</th>
              <th>Points</th>
              <th>Status</th>
              <th>Weight</th>
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
                    : "Free"}
                </td>
                <td>{p.points}</td>
                <td>
                  <span className={`adminBadge ${p.isActive ? "adminBadge--open" : ""}`}>
                    {p.isActive ? "Active" : "Inactive"}
                  </span>
                </td>
                <td>{p.sortWeight}</td>
              </tr>
            ))}
          </tbody>
        </table>
      ) : (
        <p className="muted">No products configured. Run the seed script to add default offerings.</p>
      )}
    </div>
  );
}
