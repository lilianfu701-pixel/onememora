/**
 * Schema.org JSON-LD for a memorial: a ProfilePage whose mainEntity is the
 * Person being remembered. Emitted only for pages Google may index. The JSON is
 * our own data (no visitor markup) and `<` is escaped to prevent a </script>
 * breakout.
 */
export function MemorialJsonLd(props: {
  url: string;
  name: string;
  image: string | null;
  description: string | null;
  birthDate: string | null;
  deathDate: string | null;
  birthPlace: string | null;
  deathPlace: string | null;
}) {
  const person: Record<string, unknown> = {
    "@type": "Person",
    "@id": `${props.url}#person`,
    name: props.name,
  };
  if (props.image) person.image = props.image;
  if (props.description) person.description = props.description;
  if (props.birthDate) person.birthDate = props.birthDate;
  if (props.deathDate) person.deathDate = props.deathDate;
  if (props.birthPlace) {
    person.birthPlace = { "@type": "Place", name: props.birthPlace };
  }
  if (props.deathPlace) {
    person.deathPlace = { "@type": "Place", name: props.deathPlace };
  }

  const data = {
    "@context": "https://schema.org",
    "@type": "ProfilePage",
    "@id": props.url,
    url: props.url,
    mainEntity: person,
  };

  const json = JSON.stringify(data).replace(/</g, "\\u003c");

  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: json }}
    />
  );
}

/**
 * Schema.org BreadcrumbList for a memorial: Home → Directory → this person.
 * Surfaces the trail beneath the result in Google, and, like the ProfilePage
 * markup, only for a page Google may index. `<` is escaped for the same reason.
 */
export function BreadcrumbJsonLd(props: {
  items: { name: string; url: string }[];
}) {
  const data = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: props.items.map((item, index) => ({
      "@type": "ListItem",
      position: index + 1,
      name: item.name,
      item: item.url,
    })),
  };

  const json = JSON.stringify(data).replace(/</g, "\\u003c");

  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: json }}
    />
  );
}
