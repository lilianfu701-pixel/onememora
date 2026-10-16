import type { LegalSet } from "./index";

/** English — also the fallback for every locale without its own text. */
const UPDATED = "Last updated: October 15, 2026";

export const LEGAL_EN: LegalSet = {
  terms: {
    title: "Terms of Service",
    description: "Terms of Service for missingu.org: accounts, the content you post, memorial management, paid virtual offerings and donations, liability and governing law.",
    updated: UPDATED,
    body: `
### 1. Who we are
missingu.org ("the platform", "we", "us") is operated by missingu (California, United States). Contact: support@missingu.org.

By using the platform you agree to these terms. If you do not agree, please do not use it.

### 2. What we provide
The platform is an online memorial service for families and friends, including:
- creating, editing and publishing memorial pages for the deceased (life story, life chapters, photos, family relationships, obituaries);
- acts of remembrance by visitors — offering incense, lighting candles, laying wreaths, leaving messages;
- family trees and relative links, and reminder emails for anniversaries and traditional festivals;
- donating to the platform / supporting its operation.

Creating and viewing memorial pages is **free**, and the platform carries no advertising. Some virtual offerings are paid (see section 6).

### 3. Accounts
- You can sign in with an email code, a phone code (in some regions), or a Google / Apple account.
- You are responsible for everything done under your account; please do not share it.
- Users under 14 may use the platform only with a parent's or guardian's consent and supervision.

### 4. Content you post
- You (or the original rights holder) keep the copyright in the text, photos and other content you post. You grant the platform a free, non-exclusive licence to use that content as needed to run the service — storing, displaying, backing up, making thumbnails, and showing it to others within the visibility you choose.
- You confirm you have the right to post it: photos and text do not infringe anyone's copyright, image rights or privacy, and information about living relatives is shared with their consent or within reasonable bounds.
- You may not post: unlawful content; content that insults or defames the deceased or anyone else; fake or impersonating memorial pages; advertising, scams or marketing unrelated to remembrance; sexual, violent or hateful content.
- We may hide or remove content that breaks these rules and restrict or suspend accounts. Anyone can flag a problem with the "Report" link on a page or through the "Contact us" page.

### 5. Managing memorials and disputes
- The person who creates a memorial is its administrator. They can invite family and friends to co-edit, and can transfer administration to someone else.
- If an administrator is unreachable for a long time, other relatives can apply to take over through the platform's process. Where a relationship or who should administer a page is disputed, either side can ask the platform to arbitrate. We decide on the evidence provided, but we do not adjudicate family disputes as a court would.
- Memorial pages the platform creates for public figures are held by the platform until claimed by family.

### 6. Paid virtual offerings and donations
- **Virtual offerings**: a candle costs ¥9.9 (RMB) and is shown on the memorial for 15 days; a wreath costs ¥99 and is shown for 90 days; incense is free, once per person per day, shown for 1 day. Offerings are purely virtual display items — they **have no cash value and cannot be transferred, exchanged or withdrawn**.
- **Donations / supporting the platform**: donations (from ¥99) and "support the platform" gifts (from ¥9.9) **go to the platform** to pay for servers, storage and operation. They are **not passed on to the family of the deceased and are not tax-deductible charitable donations**.
- All income from offerings and donations belongs to the platform and **is not passed on to the family of the deceased**.
- Prices are shown in RMB. Payments through Stripe are charged in RMB; payments through PayPal are converted to US dollars at the current rate, and your bank or payment provider may charge a currency-conversion fee.
- Payments are processed by third-party providers (Stripe, PayPal). We never see or store your card number.
- Refunds are covered by our Refund Policy.

### 7. Availability
We work to keep the service running but cannot promise it will be uninterrupted or error-free. We may change, suspend or end some features. If we ever shut the whole service down, we will announce it in advance on the site or by email and give you a way to export your memorial pages.

### 8. Limitation of liability
To the fullest extent the law allows, we are not liable for indirect losses arising from your use of, or inability to use, the service. Our total liability to you is limited to the amount you actually paid us in the previous 12 months.

### 9. Changes to these terms
We may update these terms. Significant changes will be announced prominently on the site; continuing to use the platform after they take effect means you accept them.

### 10. Governing law
These terms are governed by the laws of the State of California, United States. Where the law of your place of residence gives consumers greater protection, that protection applies.
`,
  },
  privacy: {
    title: "Privacy Policy",
    description: "Privacy Policy for missingu.org: what we collect, how we use it, which service providers process it, how long we keep it, and your rights.",
    updated: UPDATED,
    body: `
This policy explains what personal information missingu.org (operated by missingu) collects, how we use it, who we share it with, and the rights you have.

### 1. What we collect
- **Account information**: your email address or phone number; if you sign in with Google / Apple, the name and email they provide.
- **What you enter**: your display name and profile; the names, dates, birthplace, life story, photos and family relationships you enter for the deceased; messages and obituaries. This can involve **living relatives** — please only enter what you have the right to share.
- **Offering and payment records**: offering type, amount, the name shown (you can partly mask it), time and order status. **Card numbers and payment accounts are handled by Stripe / PayPal; we do not store them**.
- **Technical information**: IP address, browser type and visit times, used for security, abuse prevention and troubleshooting.
- **Cookies**: used only to keep you signed in and remember your language — **never for ad tracking**.

### 2. How we use it
- to provide and maintain memorial pages, offerings, family trees and reminder emails;
- to process payments and reconcile orders;
- to keep accounts secure and prevent abuse and fraud;
- to answer your feedback and appeals;
- for other purposes required by law.

We **do not sell** your personal information, **do not show ads**, and do not build advertising profiles.

### 3. Who can see your content
- Memorial pages are shown according to the visibility the administrator sets: public, unlisted (anyone with the link), or invite-only.
- Public memorial pages may be indexed by search engines; the administrator can make a page non-public at any time.
- The name on your offerings and your messages on a public memorial can be seen by other visitors (you can partly mask your name).

### 4. Service providers we share with
To run the service, we pass the necessary information to these providers, who may use it only on our instructions:
- Hosting: Vercel (United States)
- Database: Supabase (Canada)
- Image storage: Cloudflare R2
- Email delivery: Resend (United States)
- DNS and network acceleration: Cloudflare
- Payments: Stripe, PayPal
- Sign-in: Google, Apple (only if you choose to sign in with them)

Beyond this, we disclose information only where the law requires it or to protect the safety of users and the public.

### 5. International storage
Our servers and database are located in **the United States and Canada**. By using the platform you acknowledge and agree that your personal information is transferred to and stored in those countries, which may be outside your own.

### 6. How long we keep it
- Account and memorial content: kept while you use the service; after deletion, removed from backups within 30 days.
- Order records: kept for 7 years for accounting and tax purposes.
- Security logs: up to 1 year.

### 7. Your rights
You can:
- view and edit your profile and the memorial pages you manage;
- export a memorial page (the "Export" option on its management page);
- unsubscribe from reminder emails (one click at the bottom of every email);
- ask us to delete your account or content you posted, through the "Contact us" page or by emailing support@missingu.org. We handle requests within 15 business days.

If you believe a memorial page infringes your or your family's rights, you can ask us to act in the same way.

### 8. Children
We do not knowingly collect personal information from children under 14. If you find that we have, please contact us and we will delete it.

### 9. Security
Sign-in credentials are stored encrypted; uploaded photos are stripped of location and other metadata; all traffic is encrypted with HTTPS. No system is perfectly secure, and if a security incident occurs we will promptly notify affected users.

### 10. Changes and contact
Significant changes to this policy will be announced on the site. Questions: support@missingu.org.
`,
  },
  refund: {
    title: "Refund Policy",
    description: "Refund Policy for missingu.org: when virtual offerings and donations can be refunded, how to request a refund, and how long it takes.",
    updated: UPDATED,
    body: `
Our paid items are **virtual offerings** (candles and wreaths) and **donations / platform support**. Because a virtual offering **appears on the memorial immediately** after payment, refunds follow the rules below.

### 1. When you get a full refund
If you ask within **7 days** of paying and one of the following applies:
- **Duplicate charge**: one action was charged twice or more;
- **The payment succeeded but the offering never appeared** on the memorial, and we cannot restore it;
- **Unauthorised payment**: your account or payment method was used by someone else (we may ask you for details);
- **Wrong amount** on a donation / support gift (for example, you meant to give ¥99 but paid ¥999).

### 2. When refunds are generally not given
- the offering was displayed normally and you have simply changed your mind;
- the request comes after the display period ended (15 days for a candle, 90 days for a wreath);
- the memorial was hidden or removed for breaking our Terms of Service.

### 3. How to ask
Within 7 days of paying, use the "Contact us" page or email support@missingu.org with:
- the payment time, amount and method (Alipay / WeChat Pay / card / PayPal);
- the memorial's 8-digit number;
- the reason for the refund.

We reply within 5 business days.

### 4. How refunds are paid
- Refunds go **back to the original payment method** — the Alipay, WeChat Pay, card or PayPal account you paid with.
- How long it takes depends on the payment provider, usually 5–10 business days.
- PayPal payments are refunded in the original US-dollar amount; exchange-rate differences and bank currency-conversion fees are not refunded.
- Once refunded, the matching virtual offering is removed from the memorial.

### 5. About donations
Donations and platform-support gifts support the running of the platform. They are **not tax-deductible charitable donations**, and we do not issue donation receipts. Apart from the cases in section 1, they are generally not refundable.
`,
  },
};
