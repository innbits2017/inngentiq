
import { Badge } from "@/components/ui/badge";
import { Bot } from "lucide-react";

interface Props {
  agent: any;
}

export default function AgentHeader({ agent }: Props) {
  const isActive =
    agent.status === "active" || agent.is_active === true;

  return (
    <div className="rounded-2xl bg-white p-5 shadow-[0_2px_12px_rgba(32,35,74,0.05)]">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">

        <div className="flex min-w-0 items-center gap-4">
          <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-[#F0EEFF] text-[#5149E8]">
            <Bot size={25} />
          </div>

          <div className="min-w-0">
            <h1 className="truncate text-xl font-bold text-[#20234A]">
              {agent.name}
            </h1>

            <p className="mt-0.5 text-sm text-slate-500">
              {agent.description || "No description available."}
            </p>

            <div className="mt-2 flex flex-wrap items-center gap-2">
              <Badge
                variant="outline"
                className={`border-0 ${
                  isActive
                    ? "bg-[#EAF8F6] text-[#16877F]"
                    : "bg-slate-100 text-slate-500"
                }`}
              >
                <span
                  className={`mr-1.5 h-1.5 w-1.5 rounded-full ${
                    isActive ? "bg-[#20AAA6]" : "bg-slate-400"
                  }`}
                />
                {isActive ? "Active" : "Inactive"}
              </Badge>

              <span className="rounded-lg bg-[#F4F3FF] px-2.5 py-1 text-xs font-medium text-[#5149E8]">
                {agent.model || "gpt-4.1-mini"}
              </span>
            </div>
          </div>
        </div>

      </div>
    </div>
  );
}
