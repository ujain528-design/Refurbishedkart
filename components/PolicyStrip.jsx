import Link from "next/link";
import { POLICIES } from "@/lib/data";
import { ReturnIcon, ShieldIcon, LockIcon, EraseIcon } from "@/components/Icons";

const POLICY_ICONS = {
  return: ReturnIcon,
  warranty: ShieldIcon,
  secure: LockIcon,
  wiped: EraseIcon,
};

// Each policy item links to its corresponding static page.
const POLICY_HREF = {
  return: "/return-policy",
  warranty: "/warranty",
  secure: "/privacy-policy",
  wiped: "/warranty",
};

export default function PolicyStrip() {
  return (
    <section className="border-y border-black/5 bg-brand-softer">
      <div className="mx-auto grid max-w-7xl grid-cols-2 divide-black/5 px-4 sm:px-6 md:grid-cols-4 md:divide-x lg:px-8">
        {POLICIES.map(({ label, icon }) => {
          const Icon = POLICY_ICONS[icon];
          return (
            <Link
              key={label}
              href={POLICY_HREF[icon] || "#"}
              className="flex items-center justify-center gap-3 py-6 transition-colors hover:text-brand"
            >
              <Icon style={{ width: 22, height: 22 }} className="shrink-0 text-brand" />
              <span className="text-[13px] font-semibold text-ink">{label}</span>
            </Link>
          );
        })}
      </div>
    </section>
  );
}
