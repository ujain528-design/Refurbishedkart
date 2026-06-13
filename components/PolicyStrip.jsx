import Link from "next/link";
import { POLICIES } from "@/lib/data";
import { ReturnIcon, ShieldIcon, LockIcon, TruckIcon } from "@/components/Icons";

const POLICY_ICONS = {
  return: ReturnIcon,
  warranty: ShieldIcon,
  secure: LockIcon,
  delivery: TruckIcon,
};

// Each policy item links to its corresponding static page.
const POLICY_HREF = {
  return: "/return-policy",
  warranty: "/warranty",
  secure: "/privacy-policy",
  delivery: "/about",
};

export default function PolicyStrip() {
  return (
    <section className="bg-brand">
      <div className="mx-auto grid max-w-7xl grid-cols-2 divide-white/10 px-4 sm:px-6 md:grid-cols-4 md:divide-x lg:px-8">
        {POLICIES.map(({ label, icon }) => {
          const Icon = POLICY_ICONS[icon];
          return (
            <Link
              key={label}
              href={POLICY_HREF[icon] || "#"}
              className="flex items-center justify-center gap-3 py-6 text-white/85 transition-colors hover:text-white"
            >
              <Icon style={{ width: 22, height: 22 }} className="shrink-0 text-white" />
              <span className="text-[13px] font-semibold">{label}</span>
            </Link>
          );
        })}
      </div>
    </section>
  );
}
