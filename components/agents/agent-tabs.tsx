
"use client";

interface Props {
  activeTab: string;
  onChange: (tab: string) => void;
}

const tabs = [
  { id: "general", label: "General" },
  { id: "knowledge", label: "Knowledge" },
  { id: "playground", label: "Playground" },
  { id: "widget", label: "Widget" },
  { id: "channels", label: "Channels" },
  { id: "analytics", label: "Analytics" },
  { id: "settings", label: "Settings" },
  { id: "deploy", label: "Deploy" },
];

export default function AgentTabs({
  activeTab,
  onChange,
}: Props) {
  return (
    <div className="rounded-2xl bg-white p-1.5 shadow-[0_2px_10px_rgba(32,35,74,0.05)]">
      <div className="flex gap-1 overflow-x-auto">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            type="button"
            onClick={() => onChange(tab.id)}
            className={`shrink-0 whitespace-nowrap rounded-xl px-4 py-2.5 text-sm font-medium transition-colors ${
              activeTab === tab.id
                ? "bg-[#F0EEFF] text-[#5149E8]"
                : "text-slate-500 hover:bg-[#F4F3FF] hover:text-[#20234A]"
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>
    </div>
  );
}
