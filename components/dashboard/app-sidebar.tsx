
"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  Bot,
  BookOpen,
  MessageSquare,
  Users,
  BarChart3,
  Plug,
  CreditCard,
  Settings,
  FileText,
  Sparkles,
  ChevronDown,
  Globe,
  Workflow,
  Image,
  Share2,
  Megaphone,
  Building2,
  Zap,
  X,
  CheckSquare,
  ListTodo,
} from "lucide-react";

const menu = [
  {
    section: "WORKSPACE",
    items: [
      { name: "Dashboard", href: "/dashboard", icon: LayoutDashboard },
      { name: "AI Agents", href: "/dashboard/agents", icon: Bot },
      {
        name: "Conversations",
        href: "/dashboard/conversations",
        icon: MessageSquare,
      },
      { name: "Leads & CRM", href: "/dashboard/leads", icon: Users },
      { name: "Tasks", href: "/dashboard/tasks", icon: CheckSquare },
      { name: "My Tasks", href: "/dashboard/my-tasks", icon: ListTodo },
      { name: "Forms", href: "/dashboard/forms", icon: FileText },
      {
        name: "Knowledge Base",
        href: "/dashboard/knowledge-base",
        icon: BookOpen,
      },
    ],
  },
  {
    section: "GROWTH & AUTOMATION",
    items: [
      { name: "Website", href: "/dashboard/website", icon: Globe },
      {
        name: "AI Content Studio",
        href: "/dashboard/content-studio",
        icon: Image,
      },
      {
        name: "Social Media",
        href: "/dashboard/social-media",
        icon: Share2,
      },
      { name: "Campaigns", href: "/dashboard/campaigns", icon: Megaphone },
      { name: "Automations", href: "/dashboard/automations", icon: Workflow },
      { name: "Integrations", href: "/dashboard/integrations", icon: Plug },
    ],
  },
  {
    section: "INSIGHTS",
    items: [
      { name: "Analytics", href: "/dashboard/analytics", icon: BarChart3 },
    ],
  },
];

interface MeResponse {
  organization?: {
    name: string;
    plan?: string;
  } | null;
}

export function AppSidebar() {
  const pathname = usePathname();

  const [organization, setOrganization] =
    useState<MeResponse["organization"]>(null);

  const [mobileOpen, setMobileOpen] = useState(false);

  useEffect(() => {
    let active = true;

    fetch("/api/me")
      .then((res) => {
        if (!res.ok) throw new Error("Unable to load workspace");
        return res.json();
      })
      .then((data: MeResponse) => {
        if (active) {
          setOrganization(data.organization ?? null);
        }
      })
      .catch((error) => console.error(error));

    const openMenu = () => setMobileOpen(true);

    window.addEventListener("inngentiq:open-sidebar", openMenu);

    return () => {
      active = false;
      window.removeEventListener("inngentiq:open-sidebar", openMenu);
    };
  }, []);

  useEffect(() => {
    setMobileOpen(false);
  }, [pathname]);

  useEffect(() => {
    if (!mobileOpen) return;

    const closeOnEscape = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setMobileOpen(false);
      }
    };

    document.addEventListener("keydown", closeOnEscape);

    return () => {
      document.removeEventListener("keydown", closeOnEscape);
    };
  }, [mobileOpen]);

  const SidebarContent = ({ mobile = false }: { mobile?: boolean }) => (
    <div className="flex h-full min-h-0 flex-col bg-white text-[#20234A]">
      {/* Brand */}
      <div className="flex items-center justify-between px-5 pb-6 pt-7">
        <Link
          href="/dashboard"
          onClick={() => setMobileOpen(false)}
          className="flex items-center gap-3"
        >
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-[#5149E8] to-[#7565F5] shadow-md shadow-[#5149E8]/20">
            <Sparkles className="h-5 w-5 text-white" />
          </div>

          <div>
            <h1 className="text-xl font-bold tracking-tight text-[#20234A]">
              Inngentiq
            </h1>

            <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-[#7565F5]">
              AI Business Platform
            </p>
          </div>
        </Link>

        {mobile && (
          <button
            type="button"
            aria-label="Close navigation"
            onClick={() => setMobileOpen(false)}
            className="rounded-lg p-2 text-[#20234A] transition hover:bg-[#F0EEFF]"
          >
            <X size={20} />
          </button>
        )}
      </div>

      {/* Workspace */}
      <div className="mx-4 mb-6 rounded-2xl border border-[#F0EEFF] bg-[#F4F3FF] p-3">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-[#5149E8] to-[#7565F5]">
            <Building2 size={18} className="text-white" />
          </div>

          <div className="min-w-0 flex-1">
            <p className="truncate text-sm font-semibold text-[#20234A]">
              {organization?.name || "Loading workspace..."}
            </p>

            <p className="text-xs capitalize text-[#7565F5]">
              {organization?.plan || "Workspace"}
            </p>
          </div>

          <ChevronDown size={16} className="shrink-0 text-[#7565F5]" />
        </div>
      </div>

      {/* Navigation */}
      <nav className="min-h-0 flex-1 space-y-7 overflow-y-auto px-4 pb-6">
        {menu.map((group) => (
          <div key={group.section}>
            <p className="mb-3 px-3 text-[10px] font-bold tracking-[0.17em] text-[#9293B2]">
              {group.section}
            </p>

            <div className="space-y-1">
              {group.items.map((item) => {
                const active =
                  item.href === "/dashboard"
                    ? pathname === item.href
                    : pathname === item.href ||
                      pathname.startsWith(`${item.href}/`);

                const Icon = item.icon;

                return (
                  <Link
                    key={item.name}
                    href={item.href}
                    onClick={() => setMobileOpen(false)}
                    className={`group flex items-center gap-3 rounded-xl px-3 py-2.5 text-[13px] font-medium transition-all duration-200 ${
                      active
                        ? "bg-[#F0EEFF] text-[#5149E8] shadow-sm"
                        : "text-[#666987] hover:bg-[#F8F7FF] hover:text-[#5149E8]"
                    }`}
                  >
                    <Icon
                      size={18}
                      className={
                        active
                          ? "text-[#5149E8]"
                          : "text-[#9293B2] transition-colors group-hover:text-[#5149E8]"
                      }
                    />

                    <span>{item.name}</span>

                    {active && (
                      <span className="ml-auto h-1.5 w-1.5 rounded-full bg-[#5149E8]" />
                    )}
                  </Link>
                );
              })}
            </div>
          </div>
        ))}
      </nav>

      {/* Bottom links */}
      <div className="border-t border-[#F0EEFF] p-4">
        <Link
          href="/dashboard/billing"
          onClick={() => setMobileOpen(false)}
          className="mb-2 flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm text-[#666987] transition hover:bg-[#F8F7FF] hover:text-[#5149E8]"
        >
          <CreditCard size={18} />
          Billing & Plans
        </Link>

        <Link
          href="/dashboard/settings"
          onClick={() => setMobileOpen(false)}
          className="flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm text-[#666987] transition hover:bg-[#F8F7FF] hover:text-[#5149E8]"
        >
          <Settings size={18} />
          Settings
        </Link>

        <div className="mt-4 rounded-xl border border-[#E8E5FF] bg-gradient-to-r from-[#F0EEFF] to-[#EAF8F6] p-3">
          <div className="flex items-center gap-2">
            <Zap size={15} className="text-[#5149E8]" />

            <span className="text-xs font-semibold text-[#20234A]">
              Powered by AI
            </span>
          </div>

          <p className="mt-1 text-[10px] text-[#666987]">
            Grow your business intelligently.
          </p>
        </div>
      </div>
    </div>
  );

  return (
    <>
      {/* Desktop sidebar */}
      <aside className="sticky top-0 hidden h-screen w-[270px] shrink-0 flex-col border-r border-[#EAE8FA] bg-white lg:flex">
        <SidebarContent />
      </aside>

      {/* Mobile backdrop */}
      {mobileOpen && (
        <button
          type="button"
          aria-label="Close navigation menu"
          onClick={() => setMobileOpen(false)}
          className="fixed inset-0 z-40 bg-[#20234A]/35 backdrop-blur-[2px] lg:hidden"
        />
      )}

      {/* Mobile drawer */}
      <aside
        className={`fixed inset-y-0 left-0 z-50 w-[290px] max-w-[85vw] bg-white shadow-2xl transition-transform duration-300 ease-in-out lg:hidden ${
          mobileOpen ? "translate-x-0" : "-translate-x-full"
        }`}
        aria-hidden={!mobileOpen}
      >
        <SidebarContent mobile />
      </aside>
    </>
  );
}
