
import { ReactNode } from "react";
import { ArrowUpRight } from "lucide-react";

interface StatCardProps {
  title: string;
  value: string | number;
  icon: ReactNode;
  description?: string;
  trend?: string;
  accent?: "blue" | "green" | "orange" | "violet";
}

const accents = {
  blue: "bg-[#F0EEFF] text-[#5149E8] ring-[#E8E5FF]",
  green: "bg-[#EAF8F6] text-[#20AAA6] ring-[#D7F1EC]",
  orange: "bg-[#FFF5E9] text-[#D97736] ring-[#FCE8D2]",
  violet: "bg-[#F3F0FF] text-[#7565F5] ring-[#E9E3FF]",
};

export default function StatCard({
  title,
  value,
  icon,
  description,
  trend,
  accent = "blue",
}: StatCardProps) {
  return (
    <div className="group rounded-xl border border-[#EAE8FA] bg-white p-4 shadow-sm transition-all duration-200 hover:-translate-y-0.5 hover:border-[#D8D3FF] hover:shadow-md">
      <div className="flex items-center justify-between gap-3">
        <p className="text-[13px] font-semibold text-[#777A99]">
          {title}
        </p>

        <div className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl ring-1 ${accents[accent]}`}>
          {icon}
        </div>
      </div>

      <h2 className="mt-2 text-3xl font-bold leading-tight tracking-tight text-[#20234A]">
        {value}
      </h2>

      {description && (
        <p className="mt-1.5 text-xs text-[#9293B2]">
          {description}
        </p>
      )}

      {trend && (
        <div className="mt-3 flex items-center gap-1 text-xs font-semibold text-[#20AAA6]">
          <ArrowUpRight size={14} />
          {trend}
        </div>
      )}
    </div>
  );
}
