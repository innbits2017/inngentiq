
import Link from "next/link";
import {
  ArrowUpRight,
  CreditCard,
  Sparkles,
  Zap,
  CheckCircle2,
} from "lucide-react";

export default function SubscriptionCard() {
  // These are currently demonstration values.
  // We will connect them to actual subscription and token usage data later.
  const used = 24500;
  const total = 100000;
  const percentage = Math.min((used / total) * 100, 100);

  return (
    <div className="h-full rounded-xl border border-[#EAE8FA] bg-white p-4 shadow-sm sm:p-5">

      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-[#F0EEFF] text-[#5149E8]">
            <CreditCard size={17} />
          </div>

          <h2 className="text-base font-bold text-[#20234A]">
            Your Plan
          </h2>
        </div>

        <span className="inline-flex items-center gap-1 rounded-full bg-[#EAF8F6] px-2.5 py-1 text-[10px] font-semibold text-[#20AAA6]">
          <CheckCircle2 size={12} />
          Active
        </span>
      </div>

      {/* Plan Details */}
      <div className="mt-3 rounded-xl bg-gradient-to-r from-[#F0EEFF] to-[#F7F6FF] p-3">
        <p className="text-xs text-[#777A99]">
          Current subscription
        </p>

        <div className="mt-1 flex items-center justify-between">
          <h3 className="text-xl font-bold text-[#20234A]">
            Starter
          </h3>

          <span className="rounded-lg bg-white p-2 text-[#5149E8] shadow-sm">
            <Sparkles size={17} />
          </span>
        </div>

        <p className="mt-1 text-[11px] text-[#9293B2]">
          Your current workspace plan
        </p>
      </div>

      {/* Token Usage */}
      <div className="mt-3">
        <div className="mb-2 flex items-center justify-between gap-2">
          <div className="flex items-center gap-2 text-xs font-semibold text-[#20234A]">
            <Zap size={15} className="text-[#7565F5]" />
            AI Token Usage
          </div>

          <span className="text-xs font-bold text-[#5149E8]">
            {percentage.toFixed(1)}%
          </span>
        </div>

        <div className="h-2 overflow-hidden rounded-full bg-[#F0EEFF]">
          <div
            className="h-full rounded-full bg-gradient-to-r from-[#5149E8] to-[#7565F5] transition-all duration-500"
            style={{ width: `${percentage}%` }}
          />
        </div>

        <div className="mt-2 flex items-center justify-between">
          <p className="text-xs font-bold text-[#20234A]">
            {used.toLocaleString()}
          </p>

          <p className="text-[11px] text-[#9293B2]">
            {total.toLocaleString()} tokens
          </p>
        </div>
      </div>

      {/* Manage Subscription */}
      <div className="mt-3 border-t border-[#F0EEFF] pt-3">
        <Link
          href="/dashboard/billing"
          className="flex items-center justify-between rounded-lg bg-[#F0EEFF] px-3 py-2.5 text-xs font-bold text-[#5149E8] transition hover:bg-[#E8E5FF]"
        >
          <span className="flex items-center gap-2">
            <Sparkles size={14} />
            Manage Subscription
          </span>

          <ArrowUpRight size={15} />
        </Link>
      </div>
    </div>
  );
}
