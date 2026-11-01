
"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import {
  Bell,
  Search,
  ChevronDown,
  Menu,
  X,
  Check,
  CheckCheck,
  Clock,
  ClipboardList,
  RefreshCw,
  AlertCircle,
  Info,
} from "lucide-react";

interface MeResponse {
  user?: {
    email?: string;
  };
  organization?: {
    name?: string;
  };
  membership?: {
    role?: string;
  };
}

interface Notification {
  id: string;
  title: string;
  message: string;
  type: string;
  entity_type: string | null;
  entity_id: string | null;
  is_read: boolean;
  created_at: string;
}

interface NotificationsResponse {
  success: boolean;
  notifications: Notification[];
  unreadCount: number;
}

const pageTitles: Record<string, string> = {
  "/dashboard": "Business Overview",
  "/dashboard/agents": "AI Agents",
  "/dashboard/conversations": "Conversations",
  "/dashboard/leads": "Leads & CRM",
  "/dashboard/tasks": "Tasks & Follow-ups",
  "/dashboard/my-tasks": "My Tasks",
  "/dashboard/forms": "Forms",
  "/dashboard/knowledge-base": "Knowledge Base",
  "/dashboard/website": "Website",
  "/dashboard/content-studio": "AI Content Studio",
  "/dashboard/social-media": "Social Media",
  "/dashboard/campaigns": "Campaigns",
  "/dashboard/automations": "Automations",
  "/dashboard/integrations": "Integrations",
  "/dashboard/analytics": "Analytics",
  "/dashboard/billing": "Billing & Plans",
  "/dashboard/settings": "Settings",
};

export function DashboardHeader() {
  const pathname = usePathname();
  const router = useRouter();

  const [data, setData] = useState<MeResponse | null>(null);
  const [searchOpen, setSearchOpen] = useState(false);

  // Notification state
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [notificationOpen, setNotificationOpen] = useState(false);
  const [notificationsLoading, setNotificationsLoading] = useState(false);
  const [notificationError, setNotificationError] = useState("");
  const [notificationUpdating, setNotificationUpdating] = useState(false);

  // Load account information
  useEffect(() => {
    let active = true;

    fetch("/api/me")
      .then((res) => {
        if (!res.ok) throw new Error("Unable to load account");
        return res.json();
      })
      .then((result) => {
        if (active) setData(result);
      })
      .catch((error) => console.error(error));

    return () => {
      active = false;
    };
  }, []);

  // Load notifications
  async function loadNotifications(showLoader = false) {
    try {
      if (showLoader) {
        setNotificationsLoading(true);
      }

      setNotificationError("");

      const response = await fetch("/api/notifications", {
        cache: "no-store",
      });

      const result: NotificationsResponse = await response.json();

      if (!response.ok) {
        throw new Error(
          (result as any).error || "Unable to load notifications"
        );
      }

      setNotifications(result.notifications || []);
      setUnreadCount(result.unreadCount || 0);
    } catch (error) {
      console.error("Notification loading error:", error);

      setNotificationError(
        error instanceof Error
          ? error.message
          : "Unable to load notifications"
      );
    } finally {
      setNotificationsLoading(false);
    }
  }

  // Initial load and automatic refresh
  useEffect(() => {
    loadNotifications();

    const interval = setInterval(() => {
      loadNotifications();
    }, 60000);

    return () => clearInterval(interval);
  }, []);

  const email = data?.user?.email || "";
  const initials = email ? email.charAt(0).toUpperCase() : "U";

  const pageTitle =
    pageTitles[pathname] ||
    Object.entries(pageTitles).find(
      ([path]) =>
        path !== "/dashboard" && pathname.startsWith(`${path}/`)
    )?.[1] ||
    "Business Overview";

  const openSidebar = () => {
    window.dispatchEvent(new Event("inngentiq:open-sidebar"));
  };

  // Mark one notification as read
  async function markAsRead(notification: Notification) {
    try {
      if (!notification.is_read) {
        const response = await fetch("/api/notifications", {
          method: "PATCH",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            id: notification.id,
          }),
        });

        const result = await response.json();

        if (!response.ok) {
          throw new Error(
            result.error || "Unable to update notification"
          );
        }

        setNotifications((previous) =>
          previous.map((item) =>
            item.id === notification.id
              ? { ...item, is_read: true }
              : item
          )
        );

        setUnreadCount((previous) => Math.max(0, previous - 1));
      }

      setNotificationOpen(false);

      // Task notifications open the central Tasks dashboard.
      if (notification.entity_type === "task") {
        router.push("/dashboard/tasks");
      }
    } catch (error) {
      console.error("Mark notification read error:", error);
      setNotificationError(
        error instanceof Error
          ? error.message
          : "Unable to update notification"
      );
    }
  }

  // Mark all notifications as read
  async function markAllAsRead() {
    if (unreadCount === 0 || notificationUpdating) return;

    try {
      setNotificationUpdating(true);
      setNotificationError("");

      const response = await fetch("/api/notifications", {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          markAllRead: true,
        }),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(
          result.error || "Unable to mark notifications as read"
        );
      }

      setNotifications((previous) =>
        previous.map((item) => ({
          ...item,
          is_read: true,
        }))
      );

      setUnreadCount(0);
    } catch (error) {
      console.error("Mark all notifications error:", error);

      setNotificationError(
        error instanceof Error
          ? error.message
          : "Unable to update notifications"
      );
    } finally {
      setNotificationUpdating(false);
    }
  }

  function formatNotificationDate(value: string) {
    const date = new Date(value);
    const now = new Date();

    const diff = Math.max(
      0,
      now.getTime() - date.getTime()
    );

    const minutes = Math.floor(diff / 60000);

    if (minutes < 1) return "Just now";
    if (minutes < 60) return `${minutes} min ago`;

    const hours = Math.floor(minutes / 60);

    if (hours < 24) return `${hours} hr ago`;

    const days = Math.floor(hours / 24);

    if (days < 7) return `${days} day(s) ago`;

    return date.toLocaleDateString("en-IN", {
      day: "numeric",
      month: "short",
      year: "numeric",
    });
  }

  function getNotificationIcon(type: string) {
    switch (type) {
      case "task_assigned":
        return (
          <ClipboardList
            size={17}
            className="text-[#5149E8]"
          />
        );

      case "task_reassigned":
        return (
          <RefreshCw
            size={17}
            className="text-[#7565F5]"
          />
        );

      case "task_due":
        return (
          <Clock
            size={17}
            className="text-amber-600"
          />
        );

      case "task_overdue":
        return (
          <AlertCircle
            size={17}
            className="text-red-500"
          />
        );

      default:
        return (
          <Info
            size={17}
            className="text-[#20AAA6]"
          />
        );
    }
  }

  return (
    <header className="sticky top-0 z-30 flex min-h-[72px] items-center justify-between border-b border-[#EAE8FA] bg-white/90 px-4 backdrop-blur-xl sm:px-6 lg:px-8">

      {/* Left: menu + page heading */}
      <div className="flex min-w-0 items-center gap-3">
        <button
          type="button"
          aria-label="Open navigation menu"
          onClick={openSidebar}
          className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-[#EAE8FA] bg-white text-[#5149E8] transition hover:bg-[#F0EEFF] lg:hidden"
        >
          <Menu size={20} />
        </button>

        <div className="min-w-0">
          <p className="hidden truncate text-xs text-[#9293B2] sm:block">
            {data?.organization?.name || "Your workspace"}
          </p>

          <h2 className="truncate text-base font-bold tracking-tight text-[#20234A] sm:text-lg">
            {pageTitle}
          </h2>
        </div>
      </div>

      {/* Right: actions */}
      <div className="flex shrink-0 items-center gap-2 sm:gap-4">

        {/* Desktop search */}
        <div className="hidden items-center gap-2 rounded-xl border border-[#EAE8FA] bg-[#F8F7FF] px-3 py-2 md:flex">
          <Search size={16} className="text-[#9293B2]" />

          <input
            type="search"
            placeholder="Search anything..."
            className="w-32 bg-transparent text-sm text-[#20234A] outline-none placeholder:text-[#9293B2] lg:w-44"
          />

          <kbd className="rounded-md border border-[#EAE8FA] bg-white px-1.5 py-0.5 text-[10px] text-[#9293B2]">
            /
          </kbd>
        </div>

        {/* Mobile search toggle */}
        <button
          type="button"
          aria-label="Open search"
          onClick={() => setSearchOpen((open) => !open)}
          className="flex h-10 w-10 items-center justify-center rounded-xl text-[#666987] transition hover:bg-[#F0EEFF] hover:text-[#5149E8] md:hidden"
        >
          <Search size={19} />
        </button>

        {/* Notifications */}
        <div className="relative">
          <button
            type="button"
            aria-label="Notifications"
            aria-expanded={notificationOpen}
            onClick={() => {
              const next = !notificationOpen;
              setNotificationOpen(next);

              if (next) {
                loadNotifications(true);
              }
            }}
            className={`relative flex h-10 w-10 items-center justify-center rounded-xl transition ${
              notificationOpen
                ? "bg-[#F0EEFF] text-[#5149E8]"
                : "text-[#666987] hover:bg-[#F0EEFF] hover:text-[#5149E8]"
            }`}
          >
            <Bell size={19} />

            {unreadCount > 0 && (
              <span className="absolute -right-1 -top-1 flex h-[19px] min-w-[19px] items-center justify-center rounded-full border-2 border-white bg-red-500 px-1 text-[9px] font-bold text-white">
                {unreadCount > 99 ? "99+" : unreadCount}
              </span>
            )}
          </button>

          {/* Notification dropdown */}
          {notificationOpen && (
            <div className="absolute right-0 top-full z-[100] mt-3 w-[calc(100vw-32px)] max-w-[390px] overflow-hidden rounded-2xl border border-[#EAE8FA] bg-white shadow-[0_12px_45px_rgba(32,35,74,0.15)]">

              {/* Dropdown header */}
              <div className="flex items-center justify-between border-b border-[#F0EEFF] px-4 py-4">
                <div>
                  <h3 className="text-sm font-bold text-[#20234A]">
                    Notifications
                  </h3>

                  <p className="mt-0.5 text-xs text-slate-400">
                    {unreadCount} unread notification(s)
                  </p>
                </div>

                <div className="flex items-center gap-1">
                  <button
                    type="button"
                    title="Refresh notifications"
                    onClick={() => loadNotifications(true)}
                    disabled={notificationsLoading}
                    className="rounded-lg p-2 text-slate-400 transition hover:bg-[#F0EEFF] hover:text-[#5149E8] disabled:opacity-50"
                  >
                    <RefreshCw
                      size={16}
                      className={
                        notificationsLoading ? "animate-spin" : ""
                      }
                    />
                  </button>

                  <button
                    type="button"
                    aria-label="Close notifications"
                    onClick={() => setNotificationOpen(false)}
                    className="rounded-lg p-2 text-slate-400 transition hover:bg-[#F0EEFF] hover:text-[#5149E8]"
                  >
                    <X size={17} />
                  </button>
                </div>
              </div>

              {/* Mark all read */}
              {unreadCount > 0 && (
                <div className="flex justify-end border-b border-[#F4F3FF] px-4 py-2">
                  <button
                    type="button"
                    onClick={markAllAsRead}
                    disabled={notificationUpdating}
                    className="inline-flex items-center gap-1.5 text-xs font-semibold text-[#5149E8] transition hover:text-[#7565F5] disabled:opacity-50"
                  >
                    <CheckCheck size={14} />
                    {notificationUpdating
                      ? "Updating..."
                      : "Mark all as read"}
                  </button>
                </div>
              )}

              {/* Error */}
              {notificationError && (
                <div className="px-4 py-3 text-xs text-red-600">
                  {notificationError}
                </div>
              )}

              {/* Notification list */}
              <div className="max-h-[420px] overflow-y-auto">
                {notificationsLoading && notifications.length === 0 ? (
                  <div className="py-12 text-center">
                    <RefreshCw
                      size={22}
                      className="mx-auto animate-spin text-[#7565F5]"
                    />

                    <p className="mt-3 text-xs text-slate-400">
                      Loading notifications...
                    </p>
                  </div>
                ) : notifications.length === 0 ? (
                  <div className="px-5 py-12 text-center">
                    <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-[#F0EEFF]">
                      <Bell
                        size={22}
                        className="text-[#7565F5]"
                      />
                    </div>

                    <p className="mt-3 text-sm font-semibold text-[#20234A]">
                      You're all caught up!
                    </p>

                    <p className="mt-1 text-xs text-slate-400">
                      New notifications will appear here.
                    </p>
                  </div>
                ) : (
                  notifications.map((notification) => (
                    <button
                      key={notification.id}
                      type="button"
                      onClick={() => markAsRead(notification)}
                      className={`flex w-full items-start gap-3 border-b border-[#F4F3FF] px-4 py-4 text-left transition hover:bg-[#FAF9FF] ${
                        !notification.is_read
                          ? "bg-[#F8F7FF]/70"
                          : "bg-white"
                      }`}
                    >
                      <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-[#F0EEFF]">
                        {getNotificationIcon(notification.type)}
                      </div>

                      <div className="min-w-0 flex-1">
                        <div className="flex items-start justify-between gap-2">
                          <p
                            className={`text-xs ${
                              notification.is_read
                                ? "font-medium text-[#666987]"
                                : "font-bold text-[#20234A]"
                            }`}
                          >
                            {notification.title}
                          </p>

                          {!notification.is_read && (
                            <span className="mt-1 h-2 w-2 shrink-0 rounded-full bg-[#5149E8]" />
                          )}
                        </div>

                        <p className="mt-1 text-xs leading-relaxed text-slate-500">
                          {notification.message}
                        </p>

                        <p className="mt-2 text-[10px] text-slate-400">
                          {formatNotificationDate(notification.created_at)}
                        </p>
                      </div>

                      {!notification.is_read && (
                        <span
                          title="Unread"
                          className="mt-1 shrink-0 text-[#5149E8]"
                        >
                          <Check size={14} />
                        </span>
                      )}
                    </button>
                  ))
                )}
              </div>

              {/* Dropdown footer */}
              {notifications.length > 0 && (
                <div className="border-t border-[#F0EEFF] bg-[#FCFBFF] px-4 py-3">
                  <Link
                    href="/dashboard/tasks"
                    onClick={() => setNotificationOpen(false)}
                    className="block text-center text-xs font-semibold text-[#5149E8] transition hover:text-[#7565F5]"
                  >
                    View Tasks & Follow-ups
                  </Link>
                </div>
              )}
            </div>
          )}
        </div>

        <div className="hidden h-8 w-px bg-[#EAE8FA] sm:block" />

        {/* Account */}
        <Link
          href="/dashboard/settings"
          className="flex items-center gap-2 rounded-xl p-1 transition hover:bg-[#F8F7FF] sm:gap-3 sm:p-1.5"
        >
          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-[#5149E8] to-[#7565F5] text-sm font-bold text-white shadow-sm">
            {initials}
          </div>

          <div className="hidden min-w-0 text-left sm:block">
            <p className="max-w-36 truncate text-xs font-semibold text-[#20234A]">
              {email || "Account"}
            </p>

            <p className="text-[10px] capitalize text-[#9293B2]">
              {data?.membership?.role || "Member"}
            </p>
          </div>

          <ChevronDown
            size={15}
            className="hidden text-[#9293B2] sm:block"
          />
        </Link>
      </div>

      {/* Mobile search field */}
      {searchOpen && (
        <div className="absolute left-0 right-0 top-full border-b border-[#EAE8FA] bg-white p-3 shadow-lg md:hidden">
          <div className="flex items-center gap-2 rounded-xl border border-[#EAE8FA] bg-[#F8F7FF] px-3 py-2.5">
            <Search size={17} className="text-[#9293B2]" />

            <input
              autoFocus
              type="search"
              placeholder="Search anything..."
              className="w-full bg-transparent text-sm text-[#20234A] outline-none placeholder:text-[#9293B2]"
            />
          </div>
        </div>
      )}
    </header>
  );
}
