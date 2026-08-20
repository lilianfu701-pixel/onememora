import Link from "next/link";
import { getTranslations } from "next-intl/server";
import { discoverMentions } from "@/modules/memorials/recognition-discovery";

/**
 * Nudges a signed-in person toward memorials that list their name, so
 * recognition is something the site offers them rather than something they have
 * to go looking for. Shown on their own account pages once their profile has a
 * name to match on. Only memorials they have not already claimed are counted.
 */
export async function MentionPrompt(props: {
  userId: string;
  fullName: string | null;
  locale: string;
}) {
  const name = props.fullName?.trim();
  if (!name) return null;

  const mentions = await discoverMentions(props.userId, name);
  const pending = mentions.filter((m) => m.claimStatus === null);
  if (pending.length === 0) return null;

  const t = await getTranslations("profile");

  return (
    <div className="mentionPrompt" role="status">
      <p className="mentionPromptLead">
        {t("mentionPromptLead", { count: pending.length })}
      </p>
      <Link
        className="button buttonPrimary buttonCompact"
        href={`/${props.locale}/memorials#mentions`}
      >
        {t("mentionPromptCta")}
      </Link>
    </div>
  );
}
