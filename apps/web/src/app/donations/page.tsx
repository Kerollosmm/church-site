import type { Metadata } from "next";
import { getDonationAccounts } from "@/lib/queries";
import { DonationAccountsList } from "./DonationAccountsList";

export const metadata: Metadata = {
  title: "الحسابات البنكية وقنوات العطاء الرسمي",
  description:
    "الحسابات البنكية الرسمية المعتمدة لكنيسة القديسين مكسيموس ودوماديوس والأنبا موسى الأسود بالعصافرة: أرقام الحسابات والآيبان والسويفت لدعم المذبح والخدمات الخيرية.",
};

/**
 * `/donations` — the accounts come from the typed data layer (`getDonationAccounts()`), which
 * reads `donation_accounts` and falls back to the seeded list. Copy-to-clipboard is interactive,
 * so the list lives in a client child that receives the accounts as props.
 */
export default async function DonationsPage() {
  const accounts = await getDonationAccounts();

  return <DonationAccountsList accounts={accounts} />;
}
