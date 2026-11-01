
"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { supabase } from "@/lib/supabase/client";
import {
  Search,
  MessageSquare,
  MessageCircle,
  Mail,
  Globe,
  RefreshCw,
  User,
  UserRound,
  Clock3,
  CheckCheck,
  CircleDot,
  Headphones,
  PanelRightClose,
  Inbox,
  AlertCircle,
  Send,
} from "lucide-react";

interface Message {
  id: string;
  conversation_id: string;
  role: string;
  content: string;
  created_at: string;
}

interface TeamMember {
  id: string;
  email: string;
  role: string;
  status?: string;
}

interface Conversation {
  id: string;
  agent_id: string;
  visitor_id: string | null;
  visitor_name: string | null;
  visitor_email: string | null;
  visitor_phone: string | null;
  channel: string;
  status: string;
  human_handover: boolean;
  assigned_to: string | null;
  created_at: string;
  updated_at?: string;
  last_message_at: string | null;
  agent: {
    id: string;
    name: string;
  } | null;
  assignee: {
    id: string;
    email: string;
  } | null;
  latest_message: Message | null;
}

type StatusFilter = "all" | "open" | "pending" | "resolved";
type ChannelFilter = "all" | "website" | "whatsapp" | "email";

const statusOptions: {
  id: StatusFilter;
  label: string;
}[] = [
  { id: "all", label: "All" },
  { id: "open", label: "Open" },
  { id: "pending", label: "Pending" },
  { id: "resolved", label: "Resolved" },
];

const channelOptions: {
  id: ChannelFilter;
  label: string;
}[] = [
  { id: "all", label: "All channels" },
  { id: "website", label: "Website" },
  { id: "whatsapp", label: "WhatsApp" },
  { id: "email", label: "Email" },
];

function formatTime(date: string | null) {
  if (!date) return "";

  const value = new Date(date);

  if (Number.isNaN(value.getTime())) return "";

  return value.toLocaleTimeString("en-IN", {
    hour: "numeric",
    minute: "2-digit",
  });
}

function formatDate(date: string | null) {
  if (!date) return "";

  const value = new Date(date);

  if (Number.isNaN(value.getTime())) return "";

  return value.toLocaleDateString("en-IN", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

function getVisitorName(conversation: Conversation) {
  return (
    conversation.visitor_name ||
    conversation.visitor_email ||
    conversation.visitor_phone ||
    conversation.visitor_id ||
    "Website Visitor"
  );
}

function getChannelIcon(channel: string) {
  switch (channel?.toLowerCase()) {
    case "whatsapp":
      return MessageCircle;
    case "email":
      return Mail;
    default:
      return Globe;
  }
}

function getStatusStyle(status: string) {
  switch (status?.toLowerCase()) {
    case "resolved":
      return "bg-[#EAF8F6] text-[#16877F]";
    case "pending":
      return "bg-[#FCF5DF] text-[#80621D]";
    default:
      return "bg-[#F0EEFF] text-[#5149E8]";
  }
}

function getChannelLabel(channel: string) {
  switch (channel?.toLowerCase()) {
    case "whatsapp":
      return "WhatsApp";
    case "email":
      return "Email";
    default:
      return "Website";
  }
}

export default function InboxClient() {
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [selectedId, setSelectedId] = useState<string | null>(null);

  const [messages, setMessages] = useState<Message[]>([]);
  const [teamMembers, setTeamMembers] = useState<TeamMember[]>([]);

  const [reply, setReply] = useState("");

  const [statusFilter, setStatusFilter] =
    useState<StatusFilter>("all");

  const [channelFilter, setChannelFilter] =
    useState<ChannelFilter>("all");

  const [search, setSearch] = useState("");

  const [loading, setLoading] = useState(true);
  const [messagesLoading, setMessagesLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [sending, setSending] = useState(false);
  const [updatingConversation, setUpdatingConversation] = useState(false);

  const [error, setError] = useState("");
  const [messageError, setMessageError] = useState("");
  const [updateError, setUpdateError] = useState("");

  const [showDetails, setShowDetails] = useState(true);

  // Load conversations
  const loadConversations = useCallback(async (manual = false) => {
    try {
      if (manual) {
        setRefreshing(true);
      } else {
        setLoading(true);
      }

      setError("");

      const response = await fetch("/api/conversations?limit=100", {
        cache: "no-store",
      });

      const result = await response.json();

      if (!response.ok || !result.success) {
        throw new Error(
          result.error || "Unable to load conversations"
        );
      }

      const data: Conversation[] = result.conversations || [];

      setConversations(data);

      setSelectedId((current) => {
        if (current && data.some((item) => item.id === current)) {
          return current;
        }

        return data[0]?.id || null;
      });
    } catch (err) {
      console.error("Inbox loading error:", err);

      setError(
        err instanceof Error
          ? err.message
          : "Unable to load conversations"
      );
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  // Initial load and periodic refresh
  useEffect(() => {
    loadConversations();

    const interval = setInterval(() => {
      loadConversations(true);
    }, 30000);

    return () => clearInterval(interval);
  }, [loadConversations]);

  // Load team members
  useEffect(() => {
    async function loadTeamMembers() {
      try {
        const response = await fetch("/api/team-members", {
          cache: "no-store",
        });

        const result = await response.json();

        if (response.ok && result.success) {
          setTeamMembers(result.members || []);
        }
      } catch (err) {
        console.error("Unable to load team members:", err);
      }
    }

    loadTeamMembers();
  }, []);

  // Load complete message history
  
// Load and automatically refresh complete message history
useEffect(() => {
  if (!selectedId) {
    setMessages([]);
    return;
  }

  let cancelled = false;
  let isFetching = false;

  async function fetchMessages(showLoader = false) {
    if (isFetching) return;

    isFetching = true;

    try {
      if (showLoader) {
        setMessagesLoading(true);
        setMessageError("");
      }

      const response = await fetch(
        `/api/conversations/${selectedId}/messages`,
        { cache: "no-store" }
      );

      const result = await response.json();

      if (!response.ok || !result.success) {
        throw new Error(
          result.error || "Unable to load messages"
        );
      }

      if (!cancelled) {
        setMessages(result.messages || []);
        setMessageError("");
      }
    } catch (err) {
      if (!cancelled && showLoader) {
        setMessageError(
          err instanceof Error
            ? err.message
            : "Unable to load messages"
        );
      }
    } finally {
      isFetching = false;

      if (!cancelled && showLoader) {
        setMessagesLoading(false);
      }
    }
  }

  // Initial load
  void fetchMessages(true);

  // Refresh silently every 2.5 seconds
  const interval = window.setInterval(() => {
    void fetchMessages(false);
  }, 2500);

  return () => {
    cancelled = true;
    window.clearInterval(interval);
  };
}, [selectedId]);


  // Filter conversations
  const filteredConversations = useMemo(() => {
    const query = search.trim().toLowerCase();

    return conversations.filter((conversation) => {
      const matchesStatus =
        statusFilter === "all" ||
        conversation.status?.toLowerCase() === statusFilter;

      const matchesChannel =
        channelFilter === "all" ||
        conversation.channel?.toLowerCase() === channelFilter;

      const matchesSearch =
        !query ||
        [
          conversation.visitor_name,
          conversation.visitor_email,
          conversation.visitor_phone,
          conversation.visitor_id,
          conversation.latest_message?.content,
          conversation.agent?.name,
        ].some((value) => value?.toLowerCase().includes(query));

      return matchesStatus && matchesChannel && matchesSearch;
    });
  }, [conversations, statusFilter, channelFilter, search]);

  const selectedConversation = conversations.find(
    (conversation) => conversation.id === selectedId
  );

  const counts = {
    all: conversations.length,
    open: conversations.filter(
      (item) => item.status?.toLowerCase() === "open"
    ).length,
    pending: conversations.filter(
      (item) => item.status?.toLowerCase() === "pending"
    ).length,
    resolved: conversations.filter(
      (item) => item.status?.toLowerCase() === "resolved"
    ).length,
  };

  // Listen for new messages in the currently selected conversation.
  useEffect(() => {
    if (!selectedId) return;

    const channel = supabase
      .channel(`inbox-conversation-${selectedId}`)
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "conversation_messages",
          filter: `conversation_id=eq.${selectedId}`,
        },
        (payload) => {
          const incomingMessage = payload.new as Message;

          if (!incomingMessage?.id) return;

          setMessages((previous) => {
            const alreadyExists = previous.some(
              (message) => message.id === incomingMessage.id
            );

            if (alreadyExists) return previous;

            return [...previous, incomingMessage];
          });

          setConversations((previous) =>
            previous.map((conversation) =>
              conversation.id === selectedId
                ? {
                    ...conversation,
                    last_message_at: incomingMessage.created_at,
                    latest_message: incomingMessage,
                  }
                : conversation
            )
          );
        }
      )
      .subscribe((status, err) => {
        if (status === "CHANNEL_ERROR" || status === "TIMED_OUT") {
          console.error("Inbox realtime subscription error:", status, err);
        }
      });

    return () => {
      void supabase.removeChannel(channel);
    };
  }, [selectedId]);

  // Send human reply
  async function handleSendReply(
    event: React.FormEvent<HTMLFormElement>
  ) {
    event.preventDefault();

    if (!selectedId || !reply.trim() || sending) return;

    const conversationId = selectedId;
    const content = reply.trim();

    try {
      setSending(true);
      setMessageError("");

      const response = await fetch(
        `/api/conversations/${conversationId}/messages`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ content }),
        }
      );

      const result = await response.json();

      if (!response.ok || !result.success) {
        throw new Error(result.error || "Unable to send message");
      }

      // Only append if the user is still viewing this conversation.
      if (selectedId === conversationId) {
        setMessages((previous) => {
          const alreadyExists = previous.some(
            (message) => message.id === result.message.id
          );

          return alreadyExists ? previous : [...previous, result.message];
        });
        setReply("");
      }

      await loadConversations(true);
    } catch (err) {
      setMessageError(
        err instanceof Error
          ? err.message
          : "Unable to send message"
      );
    } finally {
      setSending(false);
    }
  }

  // Update assignment, status or handover
  async function updateConversation(updates: {
    assigned_to?: string | null;
    status?: string;
    human_handover?: boolean;
  }) {
    if (!selectedId || updatingConversation) return;

    const conversationId = selectedId;

    try {
      setUpdatingConversation(true);
      setUpdateError("");

      const response = await fetch(
        `/api/conversations/${conversationId}`,
        {
          method: "PATCH",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(updates),
        }
      );

      const result = await response.json();

      if (!response.ok || !result.success) {
        console.error("Conversation update API error:", result);

        const errorMessage = [
          result.error || "Unable to update conversation",
          result.details,
          result.databaseDetails,
          result.code ? `Code: ${result.code}` : null,
          result.hint,
        ]
          .filter(Boolean)
          .join(" | ");

        throw new Error(errorMessage);
      }

      // Reflect the successful update immediately.
      if (result.conversation) {
        setConversations((previous) =>
          previous.map((conversation) =>
            conversation.id === conversationId
              ? {
                  ...conversation,
                  ...result.conversation,
                }
              : conversation
          )
        );
      }

      // Refresh the inbox list after the update.
      await loadConversations(true);
    } catch (err) {
      console.error("Update conversation failed:", err);

      setUpdateError(
        err instanceof Error
          ? err.message
          : "Unable to update conversation"
      );
    } finally {
      setUpdatingConversation(false);
    }
  }

  return (
    <div className="mx-auto flex w-full max-w-[1600px] min-w-0 flex-col gap-5">

      {/* Header */}
      <section className="flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
        <div>
          <span className="inline-flex items-center gap-2 rounded-full bg-[#F0EEFF] px-3 py-1.5 text-xs font-bold uppercase tracking-wider text-[#5149E8]">
            <MessageSquare size={14} />
            Customer Engagement
          </span>

          <h1 className="mt-3 text-2xl font-bold tracking-tight text-[#20234A] sm:text-3xl">
            Unified Inbox
          </h1>

          <p className="mt-2 text-sm text-slate-500">
            Manage customer conversations across your channels.
          </p>
        </div>

        <button
          onClick={() => loadConversations(true)}
          disabled={refreshing}
          className="inline-flex items-center justify-center gap-2 rounded-xl bg-white px-4 py-3 text-sm font-semibold text-[#5149E8] shadow-sm transition hover:bg-[#F0EEFF] disabled:opacity-60"
        >
          <RefreshCw
            size={16}
            className={refreshing ? "animate-spin" : ""}
          />
          Refresh
        </button>
      </section>

      {/* Metrics */}
      <section className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        {[
          {
            label: "Total Conversations",
            value: counts.all,
            icon: MessageSquare,
            color: "#5149E8",
            bg: "#F0EEFF",
          },
          {
            label: "Open",
            value: counts.open,
            icon: CircleDot,
            color: "#7565F5",
            bg: "#F2F0FF",
          },
          {
            label: "Pending",
            value: counts.pending,
            icon: Clock3,
            color: "#80621D",
            bg: "#FCF5DF",
          },
          {
            label: "Resolved",
            value: counts.resolved,
            icon: CheckCheck,
            color: "#20AAA6",
            bg: "#EAF8F6",
          },
        ].map((metric) => {
          const Icon = metric.icon;

          return (
            <div
              key={metric.label}
              className="rounded-2xl bg-white p-4 shadow-[0_3px_16px_rgba(32,35,74,0.045)] sm:p-5"
            >
              <div className="flex items-center justify-between gap-2">
                <div>
                  <p className="text-xs font-semibold text-slate-500 sm:text-sm">
                    {metric.label}
                  </p>

                  <p className="mt-2 text-2xl font-bold text-[#20234A]">
                    {metric.value}
                  </p>
                </div>

                <div
                  className="rounded-xl p-3"
                  style={{
                    color: metric.color,
                    backgroundColor: metric.bg,
                  }}
                >
                  <Icon size={21} />
                </div>
              </div>
            </div>
          );
        })}
      </section>

      {/* Inbox */}
      <section className="flex min-h-[650px] min-w-0 flex-col overflow-hidden rounded-2xl bg-white shadow-[0_3px_20px_rgba(32,35,74,0.055)] lg:flex-row">

        {/* Conversation list */}
        <div className="flex w-full min-w-0 flex-col border-b border-slate-100 lg:w-[340px] lg:shrink-0 lg:border-b-0 lg:border-r">

          <div className="border-b border-slate-100 p-4">
            <div className="flex items-center justify-between">
              <h2 className="font-bold text-[#20234A]">
                Conversations
              </h2>

              <span className="rounded-full bg-[#F0EEFF] px-2.5 py-1 text-xs font-bold text-[#5149E8]">
                {filteredConversations.length}
              </span>
            </div>

            {/* Search */}
            <div className="mt-4 flex items-center gap-2 rounded-xl bg-[#F7F7FC] px-3 py-3">
              <Search size={17} className="shrink-0 text-slate-400" />

              <input
                value={search}
                onChange={(event) => setSearch(event.target.value)}
                placeholder="Search conversations..."
                className="w-full min-w-0 bg-transparent text-sm outline-none placeholder:text-slate-400"
              />
            </div>

            {/* Status filters */}
            <div className="mt-4 flex gap-1 overflow-x-auto pb-1">
              {statusOptions.map((option) => (
                <button
                  key={option.id}
                  onClick={() => setStatusFilter(option.id)}
                  className={`whitespace-nowrap rounded-lg px-3 py-2 text-xs font-semibold transition ${
                    statusFilter === option.id
                      ? "bg-[#5149E8] text-white"
                      : "bg-[#F7F7FC] text-slate-500 hover:bg-[#F0EEFF]"
                  }`}
                >
                  {option.label}

                  {option.id !== "all" && (
                    <span className="ml-1 opacity-70">
                      {counts[option.id]}
                    </span>
                  )}
                </button>
              ))}
            </div>

            {/* Channel filter */}
            <select
              value={channelFilter}
              onChange={(event) =>
                setChannelFilter(event.target.value as ChannelFilter)
              }
              className="mt-3 w-full rounded-xl bg-[#F7F7FC] px-3 py-2.5 text-sm text-slate-600 outline-none"
            >
              {channelOptions.map((option) => (
                <option key={option.id} value={option.id}>
                  {option.label}
                </option>
              ))}
            </select>
          </div>

          {/* Conversation items */}
          <div className="min-h-[300px] flex-1 overflow-y-auto">
            {loading ? (
              <div className="flex min-h-64 flex-col items-center justify-center gap-3 text-slate-400">
                <RefreshCw size={23} className="animate-spin" />
                <p className="text-sm">Loading conversations...</p>
              </div>
            ) : error ? (
              <div className="p-5 text-center">
                <AlertCircle
                  size={25}
                  className="mx-auto text-red-400"
                />

                <p className="mt-3 text-sm text-red-500">{error}</p>

                <button
                  onClick={() => loadConversations(true)}
                  className="mt-3 text-sm font-bold text-[#5149E8]"
                >
                  Try again
                </button>
              </div>
            ) : filteredConversations.length === 0 ? (
              <div className="flex min-h-64 flex-col items-center justify-center px-5 text-center">
                <div className="rounded-2xl bg-[#F0EEFF] p-4 text-[#5149E8]">
                  <Inbox size={26} />
                </div>

                <h3 className="mt-4 font-bold text-[#20234A]">
                  No conversations found
                </h3>

                <p className="mt-2 text-xs leading-5 text-slate-400">
                  Conversations from your connected channels will appear here.
                </p>
              </div>
            ) : (
              filteredConversations.map((conversation) => {
                const ChannelIcon = getChannelIcon(conversation.channel);
                const isSelected = selectedId === conversation.id;

                return (
                  <button
                    key={conversation.id}
                    onClick={() => setSelectedId(conversation.id)}
                    className={`w-full border-b border-slate-50 p-4 text-left transition ${
                      isSelected
                        ? "bg-[#F0EEFF]/70"
                        : "hover:bg-[#FAFAFE]"
                    }`}
                  >
                    <div className="flex items-start gap-3">
                      <div className="relative flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-[#F0EEFF] font-bold text-[#5149E8]">
                        {getVisitorName(conversation)
                          .charAt(0)
                          .toUpperCase()}

                        <span className="absolute -bottom-1 -right-1 rounded-full border-2 border-white bg-white p-0.5">
                          <ChannelIcon
                            size={12}
                            className="text-[#7565F5]"
                          />
                        </span>
                      </div>

                      <div className="min-w-0 flex-1">
                        <div className="flex items-start justify-between gap-2">
                          <p className="truncate text-sm font-bold text-[#20234A]">
                            {getVisitorName(conversation)}
                          </p>

                          <span className="shrink-0 text-[10px] text-slate-400">
                            {formatTime(
                              conversation.last_message_at ||
                              conversation.created_at
                            )}
                          </span>
                        </div>

                        <p className="mt-1 line-clamp-2 text-xs leading-5 text-slate-500">
                          {conversation.latest_message?.content ||
                            "No messages yet"}
                        </p>

                        <div className="mt-2 flex flex-wrap items-center gap-2">
                          <span
                            className={`rounded-full px-2 py-1 text-[10px] font-bold capitalize ${getStatusStyle(
                              conversation.status
                            )}`}
                          >
                            {conversation.status}
                          </span>

                          {conversation.human_handover && (
                            <span className="inline-flex items-center gap-1 rounded-full bg-[#EAF8F6] px-2 py-1 text-[10px] font-bold text-[#16877F]">
                              <Headphones size={11} />
                              Human
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                  </button>
                );
              })
            )}
          </div>
        </div>

        {/* Main conversation panel */}
        <div className="flex min-h-[550px] min-w-0 flex-1 flex-col bg-[#FAFAFD]">
          {selectedConversation ? (
            <>
              {/* Conversation header */}
              <div className="flex items-center justify-between gap-3 border-b border-slate-100 bg-white p-4 sm:p-5">
                <div className="flex min-w-0 items-center gap-3">
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-[#F0EEFF] font-bold text-[#5149E8]">
                    {getVisitorName(selectedConversation)
                      .charAt(0)
                      .toUpperCase()}
                  </div>

                  <div className="min-w-0">
                    <h3 className="truncate text-sm font-bold text-[#20234A]">
                      {getVisitorName(selectedConversation)}
                    </h3>

                    <p className="mt-1 text-xs text-slate-400">
                      {getChannelLabel(selectedConversation.channel)}
                      {selectedConversation.agent?.name
                        ? ` · ${selectedConversation.agent.name}`
                        : ""}
                    </p>
                  </div>
                </div>

                <button
                  onClick={() => setShowDetails(!showDetails)}
                  className="rounded-lg p-2 text-slate-400 transition hover:bg-[#F0EEFF] hover:text-[#5149E8]"
                  title="Toggle customer details"
                >
                  <PanelRightClose size={19} />
                </button>
              </div>

              {/* Message history */}
              <div className="flex-1 space-y-5 overflow-y-auto p-4 sm:p-6">
                {messagesLoading ? (
                  <div className="flex min-h-48 items-center justify-center gap-2 text-sm text-slate-400">
                    <RefreshCw size={18} className="animate-spin" />
                    Loading messages...
                  </div>
                ) : messages.length === 0 ? (
                  <div className="flex min-h-48 flex-col items-center justify-center text-center">
                    <MessageSquare size={28} className="text-slate-300" />

                    <p className="mt-3 text-sm font-semibold text-[#20234A]">
                      No messages yet
                    </p>
                  </div>
                ) : (
                  messages.map((message) => {
                    const isVisitor = message.role === "user";
                    const isHuman = message.role === "human";

                    return (
                      <div
                        key={message.id}
                        className={`flex ${
                          isVisitor ? "justify-start" : "justify-end"
                        }`}
                      >
                        <div className="max-w-[85%] sm:max-w-[75%]">
                          <div
                            className={`mb-1 flex items-center gap-2 text-[11px] text-slate-400 ${
                              isVisitor ? "" : "justify-end"
                            }`}
                          >
                            <span>
                              {isVisitor
                                ? getVisitorName(selectedConversation)
                                : isHuman
                                ? "Team member"
                                : selectedConversation.agent?.name ||
                                  "AI Assistant"}
                            </span>

                            <span>·</span>

                            <span>{formatTime(message.created_at)}</span>
                          </div>

                          <div
                            className={`rounded-2xl px-4 py-3 text-sm leading-6 shadow-sm ${
                              isVisitor
                                ? "rounded-tl-sm bg-white text-slate-700"
                                : isHuman
                                ? "rounded-tr-sm bg-[#5149E8] text-white"
                                : "rounded-tr-sm bg-[#EAF8F6] text-[#205D59]"
                            }`}
                          >
                            <p className="whitespace-pre-wrap break-words">
                              {message.content}
                            </p>
                          </div>

                          {!isVisitor && (
                            <p className="mt-1 text-right text-[10px] text-slate-400">
                              {isHuman ? "Human reply" : "AI response"}
                            </p>
                          )}
                        </div>
                      </div>
                    );
                  })
                )}

                {messageError && (
                  <div className="rounded-xl bg-red-50 px-4 py-3 text-xs text-red-600">
                    {messageError}
                  </div>
                )}
              </div>

              {/* Reply composer */}
              <form
                onSubmit={handleSendReply}
                className="border-t border-slate-100 bg-white p-4 sm:p-5"
              >
                {selectedConversation.human_handover ? (
                  <div className="mb-3 flex items-center gap-2 text-xs font-semibold text-[#16877F]">
                    <Headphones size={15} />
                    Human handover active
                  </div>
                ) : (
                  <div className="mb-3 flex items-center gap-2 text-xs text-slate-400">
                    <MessageCircle size={15} />
                    Sending a reply will activate human handover
                  </div>
                )}

                <div className="flex items-end gap-3 rounded-xl bg-[#F7F7FC] p-3">
                  <textarea
                    value={reply}
                    onChange={(event) => setReply(event.target.value)}
                    onKeyDown={(event) => {
                      if (
                        event.key === "Enter" &&
                        !event.shiftKey
                      ) {
                        event.preventDefault();
                        event.currentTarget.form?.requestSubmit();
                      }
                    }}
                    placeholder="Type your reply..."
                    rows={2}
                    maxLength={10000}
                    disabled={
                      sending ||
                      selectedConversation.status === "resolved"
                    }
                    className="max-h-32 min-h-[48px] flex-1 resize-y bg-transparent text-sm text-[#20234A] outline-none placeholder:text-slate-400 disabled:opacity-50"
                  />

                  <button
                    type="submit"
                    disabled={
                      !reply.trim() ||
                      sending ||
                      selectedConversation.status === "resolved"
                    }
                    className="flex shrink-0 items-center gap-2 rounded-xl bg-[#5149E8] px-4 py-3 text-sm font-bold text-white transition hover:bg-[#433BD0] disabled:cursor-not-allowed disabled:opacity-40"
                  >
                    <Send size={15} />
                    {sending ? "Sending..." : "Send"}
                  </button>
                </div>

                <p className="mt-2 text-[10px] text-slate-400">
                  Press Enter to send · Shift + Enter for a new line
                </p>
              </form>
            </>
          ) : (
            <div className="flex flex-1 flex-col items-center justify-center p-6 text-center">
              <div className="rounded-2xl bg-white p-5 text-[#5149E8] shadow-sm">
                <MessageSquare size={30} />
              </div>

              <h3 className="mt-4 font-bold text-[#20234A]">
                Select a conversation
              </h3>

              <p className="mt-2 max-w-xs text-sm text-slate-400">
                Choose a customer conversation to view its messages.
              </p>
            </div>
          )}
        </div>

        {/* Customer details and management */}
        {showDetails && selectedConversation && (
          <aside className="w-full shrink-0 border-t border-slate-100 bg-white lg:w-[270px] lg:border-l lg:border-t-0">

            <div className="border-b border-slate-100 p-5">
              <h3 className="text-sm font-bold text-[#20234A]">
                Customer details
              </h3>

              <div className="mt-5 flex flex-col items-center text-center">
                <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-[#F0EEFF] text-[#5149E8]">
                  <User size={28} />
                </div>

                <h4 className="mt-3 text-sm font-bold text-[#20234A]">
                  {getVisitorName(selectedConversation)}
                </h4>

                <span className="mt-2 rounded-full bg-[#F0EEFF] px-3 py-1 text-[10px] font-bold capitalize text-[#5149E8]">
                  {getChannelLabel(selectedConversation.channel)}
                </span>
              </div>
            </div>

            <div className="space-y-5 p-5">

              {/* Contact information */}
              <div>
                <p className="mb-2 text-[10px] font-bold uppercase tracking-wider text-slate-400">
                  Contact information
                </p>

                <div className="space-y-3">
                  <div className="flex items-start gap-2">
                    <Mail size={15} className="mt-0.5 shrink-0 text-slate-400" />

                    <span className="break-all text-xs text-slate-600">
                      {selectedConversation.visitor_email || "No email"}
                    </span>
                  </div>

                  <div className="flex items-start gap-2">
                    <UserRound size={15} className="mt-0.5 shrink-0 text-slate-400" />

                    <span className="break-all text-xs text-slate-600">
                      {selectedConversation.visitor_phone || "No phone"}
                    </span>
                  </div>
                </div>
              </div>

              {/* Conversation management */}
              <div className="border-t border-slate-100 pt-4">
                <p className="mb-3 text-[10px] font-bold uppercase tracking-wider text-slate-400">
                  Conversation management
                </p>

                <div className="space-y-4">

                  {/* Status */}
                  <div>
                    <label className="mb-2 block text-xs font-semibold text-slate-500">
                      Conversation status
                    </label>

                    <select
                      value={selectedConversation.status || "open"}
                      disabled={updatingConversation}
                      onChange={(event) =>
                        updateConversation({
                          status: event.target.value,
                        })
                      }
                      className="w-full rounded-xl bg-[#F7F7FC] px-3 py-2.5 text-xs font-semibold text-[#20234A] outline-none disabled:opacity-50"
                    >
                      <option value="open">Open</option>
                      <option value="pending">Pending</option>
                      <option value="resolved">Resolved</option>
                    </select>
                  </div>

                  {/* Assignment */}
                  <div>
                    <label className="mb-2 block text-xs font-semibold text-slate-500">
                      Assign to team member
                    </label>

                    <select
                      value={selectedConversation.assigned_to || ""}
                      disabled={updatingConversation}
                      onChange={(event) =>
                        updateConversation({
                          assigned_to: event.target.value || null,
                        })
                      }
                      className="w-full rounded-xl bg-[#F7F7FC] px-3 py-2.5 text-xs font-semibold text-[#20234A] outline-none disabled:opacity-50"
                    >
                      <option value="">Unassigned</option>

                      {teamMembers.map((member) => (
                        <option
                          key={member.id}
                          value={member.id}
                        >
                          {member.email} ({member.role})
                        </option>
                      ))}
                    </select>
                  </div>

                  {/* AI / Human handling */}
                  <div>
                    <label className="mb-2 block text-xs font-semibold text-slate-500">
                      Conversation handling
                    </label>

                    <div className="grid grid-cols-2 gap-2">
                      <button
                        type="button"
                        disabled={updatingConversation}
                        onClick={() =>
                          updateConversation({
                            human_handover: false,
                          })
                        }
                        className={`rounded-xl px-3 py-2.5 text-xs font-bold transition disabled:opacity-50 ${
                          !selectedConversation.human_handover
                            ? "bg-[#5149E8] text-white"
                            : "bg-[#F7F7FC] text-slate-500 hover:bg-[#F0EEFF]"
                        }`}
                      >
                        AI Assistant
                      </button>

                      <button
                        type="button"
                        disabled={updatingConversation}
                        onClick={() =>
                          updateConversation({
                            human_handover: true,
                            status: "open",
                          })
                        }
                        className={`rounded-xl px-3 py-2.5 text-xs font-bold transition disabled:opacity-50 ${
                          selectedConversation.human_handover
                            ? "bg-[#20AAA6] text-white"
                            : "bg-[#F7F7FC] text-slate-500 hover:bg-[#EAF8F6]"
                        }`}
                      >
                        Human
                      </button>
                    </div>
                  </div>

                  {updatingConversation && (
                    <p className="text-xs text-slate-400">
                      Updating conversation...
                    </p>
                  )}

                  {updateError && (
                    <p className="rounded-lg bg-red-50 p-2 text-xs text-red-600">
                      {updateError}
                    </p>
                  )}
                </div>
              </div>

              {/* Conversation information */}
              <div className="border-t border-slate-100 pt-4">
                <p className="mb-3 text-[10px] font-bold uppercase tracking-wider text-slate-400">
                  Conversation information
                </p>

                <div className="space-y-3">
                  <div>
                    <p className="text-xs text-slate-500">AI Agent</p>

                    <p className="mt-1 text-xs font-semibold text-[#20234A]">
                      {selectedConversation.agent?.name || "Unknown agent"}
                    </p>
                  </div>

                  <div>
                    <p className="text-xs text-slate-500">Assigned to</p>

                    <p className="mt-1 break-all text-xs font-semibold text-[#20234A]">
                      {selectedConversation.assignee?.email ||
                        teamMembers.find(
                          (member) =>
                            member.id === selectedConversation.assigned_to
                        )?.email ||
                        "Unassigned"}
                    </p>
                  </div>

                  <div className="flex items-center justify-between gap-2">
                    <span className="text-xs text-slate-500">
                      Handling
                    </span>

                    <span className="text-xs font-semibold text-[#20234A]">
                      {selectedConversation.human_handover
                        ? "Human"
                        : "AI"}
                    </span>
                  </div>

                  <div>
                    <p className="text-xs text-slate-500">Started</p>

                    <p className="mt-1 text-xs font-semibold text-[#20234A]">
                      {formatDate(selectedConversation.created_at)}
                    </p>
                  </div>
                </div>
              </div>

              {/* Conversation ID */}
              <div className="border-t border-slate-100 pt-4">
                <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                  Conversation ID
                </p>

                <p className="mt-2 break-all text-[10px] leading-5 text-slate-500">
                  {selectedConversation.id}
                </p>
              </div>

              <button
                onClick={() => setShowDetails(false)}
                className="flex w-full items-center justify-center rounded-xl bg-[#F7F7FC] py-2.5 text-xs font-semibold text-slate-500 hover:bg-[#F0EEFF] hover:text-[#5149E8] lg:hidden"
              >
                Hide details
              </button>
            </div>
          </aside>
        )}
      </section>

      {/* Footer */}
      <div className="flex items-start gap-3 rounded-2xl bg-[#F0EEFF] p-4">
        <div className="shrink-0 rounded-xl bg-white p-2.5 text-[#5149E8]">
          <Headphones size={19} />
        </div>

        <div>
          <h3 className="text-sm font-bold text-[#20234A]">
            One inbox for every customer
          </h3>

          <p className="mt-1 text-xs leading-5 text-slate-600">
            Website conversations are currently connected. WhatsApp and
            email will appear here once their integrations are configured.
          </p>
        </div>
      </div>
    </div>
  );
}
