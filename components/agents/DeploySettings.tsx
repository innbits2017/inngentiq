
"use client";

import { useEffect, useState } from "react";
import {
  Loader2,
  Save,
  Check,
  Sun,
  Moon,
  Bot,
} from "lucide-react";
import { toast } from "sonner";

import EmbedCode from "./EmbedCode";
import WidgetPreview from "./WidgetPreview";

interface Props {
  agentId: string;
}

interface DeploymentSettings {
  is_active: boolean;
  widget_title: string;
  welcome_message: string;
  primary_color: string;
  text_color: string;
  theme: "light" | "dark";
  position: "bottom-left" | "bottom-right";
  border_radius: number;
  allowed_domains: string[];
  avatar_url: string;
}

const defaults: DeploymentSettings = {
  is_active: true,
  widget_title: "AI Assistant",
  welcome_message: "Hi! 👋 How can I help you today?",
  primary_color: "#5149E8",
  text_color: "#FFFFFF",
  theme: "light",
  position: "bottom-right",
  border_radius: 20,
  allowed_domains: [],
  avatar_url: "",
};

export default function DeploySettings({ agentId }: Props) {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [deployment, setDeployment] =
    useState<DeploymentSettings>(defaults);

  useEffect(() => {
    let cancelled = false;

    async function loadDeployment() {
      try {
        const response = await fetch(
          `/api/agents/${agentId}/deployment`,
          { cache: "no-store" }
        );

        const data = await response.json();

        if (!response.ok) {
          throw new Error(
            data.error || "Unable to load deployment settings."
          );
        }

        if (!cancelled) {
          setDeployment({
            is_active: data.is_active ?? defaults.is_active,
            widget_title: data.widget_title ?? defaults.widget_title,
            welcome_message:
              data.welcome_message ?? defaults.welcome_message,
            primary_color: data.primary_color ?? defaults.primary_color,
            text_color: data.text_color ?? defaults.text_color,
            theme: data.theme ?? defaults.theme,
            position: data.position ?? defaults.position,
            border_radius:
              data.border_radius ?? defaults.border_radius,
            allowed_domains:
              data.allowed_domains ?? defaults.allowed_domains,
            avatar_url: data.avatar_url ?? defaults.avatar_url,
          });
        }
      } catch (error) {
        console.error("Deployment loading error:", error);
        if (!cancelled) {
          toast.error(
            error instanceof Error
              ? error.message
              : "Unable to load deployment settings."
          );
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    loadDeployment();

    return () => {
      cancelled = true;
    };
  }, [agentId]);

  function updateSetting<K extends keyof DeploymentSettings>(
    key: K,
    value: DeploymentSettings[K]
  ) {
    setDeployment((previous) => ({
      ...previous,
      [key]: value,
    }));
  }

  async function saveDeployment() {
    if (!deployment.widget_title.trim()) {
      toast.error("Widget title is required.");
      return;
    }

    if (!deployment.welcome_message.trim()) {
      toast.error("Welcome message is required.");
      return;
    }

    try {
      setSaving(true);

      const response = await fetch(
        `/api/agents/${agentId}/deployment`,
        {
          method: "PATCH",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(deployment),
        }
      );

      const result = await response.json();

      if (!response.ok) {
        throw new Error(
          result.error || "Unable to save deployment settings."
        );
      }

      toast.success("Deployment settings saved.");
    } catch (error) {
      toast.error(
        error instanceof Error
          ? error.message
          : "Unable to save deployment settings."
      );
    } finally {
      setSaving(false);
    }
  }

  const selectedButton =
    "bg-[#5149E8] text-white shadow-sm";

  const unselectedButton =
    "bg-white text-[#20234A] hover:bg-[#F0EEFF]";

  if (loading) {
    return (
      <div className="flex items-center justify-center rounded-2xl bg-white p-12">
        <Loader2 className="mr-2 h-5 w-5 animate-spin text-[#5149E8]" />
        <span className="text-sm text-slate-500">
          Loading deployment settings...
        </span>
      </div>
    );
  }

  return (
    <>
      <div className="flex w-full flex-col gap-6 xl:flex-row">
        {/* SETTINGS PANEL */}
        <div className="min-w-0 flex-[1.7] rounded-2xl bg-white shadow-[0_2px_12px_rgba(32,35,74,0.05)]">
          <div className="p-6">
            <h2 className="text-xl font-semibold text-[#20234A]">
              Deployment Settings
            </h2>

            <p className="mt-1 text-sm text-slate-500">
              Configure your chatbot widget appearance and behaviour.
            </p>

            <div className="mt-7 space-y-6">
              {/* ENABLE / DISABLE */}
              <div className="flex items-center justify-between rounded-xl bg-[#F4F3FF] p-4">
                <div>
                  <p className="font-medium text-[#20234A]">
                    Agent Active
                  </p>
                  <p className="mt-1 text-sm text-slate-500">
                    Enable or disable this website widget.
                  </p>
                </div>

                <label className="relative inline-flex cursor-pointer items-center">
                  <input
                    type="checkbox"
                    className="peer sr-only"
                    checked={deployment.is_active}
                    onChange={(event) =>
                      updateSetting("is_active", event.target.checked)
                    }
                  />

                  <span className="h-6 w-11 rounded-full bg-slate-300 transition-colors peer-checked:bg-[#5149E8] peer-focus-visible:ring-4 peer-focus-visible:ring-[#5149E8]/20" />

                  <span className="pointer-events-none absolute left-1 top-1 h-4 w-4 rounded-full bg-white shadow-sm transition-transform peer-checked:translate-x-5" />
                </label>
              </div>

              {/* WIDGET TITLE */}
              <div>
                <label className="mb-2 block text-sm font-medium text-[#20234A]">
                  Widget Title
                </label>

                <input
                  value={deployment.widget_title}
                  onChange={(event) =>
                    updateSetting("widget_title", event.target.value)
                  }
                  placeholder="AI Assistant"
                  className="w-full rounded-xl bg-[#F8F8FC] px-4 py-3 text-sm text-[#20234A] outline-none transition focus:ring-2 focus:ring-[#5149E8]/30"
                />
              </div>

              {/* WELCOME MESSAGE */}
              <div>
                <label className="mb-2 block text-sm font-medium text-[#20234A]">
                  Welcome Message
                </label>

                <textarea
                  rows={4}
                  value={deployment.welcome_message}
                  onChange={(event) =>
                    updateSetting("welcome_message", event.target.value)
                  }
                  className="w-full resize-y rounded-xl bg-[#F8F8FC] px-4 py-3 text-sm text-[#20234A] outline-none focus:ring-2 focus:ring-[#5149E8]/30"
                />
              </div>

              {/* PRIMARY COLOR */}
              <div>
                <label className="mb-2 block text-sm font-medium text-[#20234A]">
                  Primary Color
                </label>

                <div className="flex items-center gap-3">
                  <input
                    type="color"
                    value={deployment.primary_color}
                    onChange={(event) =>
                      updateSetting("primary_color", event.target.value)
                    }
                    className="h-11 w-14 cursor-pointer rounded-lg bg-white p-1"
                  />

                  <input
                    value={deployment.primary_color}
                    onChange={(event) =>
                      updateSetting("primary_color", event.target.value)
                    }
                    className="w-full rounded-xl bg-[#F8F8FC] px-4 py-3 text-sm outline-none"
                  />
                </div>
              </div>

              {/* TEXT COLOR */}
              <div>
                <label className="mb-2 block text-sm font-medium text-[#20234A]">
                  Text Color
                </label>

                <div className="flex items-center gap-3">
                  <input
                    type="color"
                    value={deployment.text_color}
                    onChange={(event) =>
                      updateSetting("text_color", event.target.value)
                    }
                    className="h-11 w-14 cursor-pointer rounded-lg bg-white p-1"
                  />

                  <input
                    value={deployment.text_color}
                    onChange={(event) =>
                      updateSetting("text_color", event.target.value)
                    }
                    className="w-full rounded-xl bg-[#F8F8FC] px-4 py-3 text-sm outline-none"
                  />
                </div>
              </div>

              {/* AVATAR */}
              <div>
                <label className="mb-2 block text-sm font-medium text-[#20234A]">
                  Avatar URL
                </label>

                <input
                  value={deployment.avatar_url}
                  onChange={(event) =>
                    updateSetting("avatar_url", event.target.value)
                  }
                  placeholder="https://example.com/avatar.png"
                  className="w-full rounded-xl bg-[#F8F8FC] px-4 py-3 text-sm outline-none"
                />
              </div>

              {/* THEME */}
              <div>
                <label className="mb-3 block text-sm font-medium text-[#20234A]">
                  Theme
                </label>

                <div className="grid grid-cols-2 gap-3">
                  <button
                    type="button"
                    onClick={() => updateSetting("theme", "light")}
                    className={`flex cursor-pointer items-center justify-center gap-2 rounded-xl px-4 py-3 text-sm font-medium transition ${
                      deployment.theme === "light"
                        ? selectedButton
                        : unselectedButton
                    }`}
                  >
                    <Sun size={17} />
                    Light
                    {deployment.theme === "light" && (
                      <Check size={15} />
                    )}
                  </button>

                  <button
                    type="button"
                    onClick={() => updateSetting("theme", "dark")}
                    className={`flex cursor-pointer items-center justify-center gap-2 rounded-xl px-4 py-3 text-sm font-medium transition ${
                      deployment.theme === "dark"
                        ? selectedButton
                        : unselectedButton
                    }`}
                  >
                    <Moon size={17} />
                    Dark
                    {deployment.theme === "dark" && (
                      <Check size={15} />
                    )}
                  </button>
                </div>
              </div>

              {/* POSITION */}
              <div>
                <label className="mb-3 block text-sm font-medium text-[#20234A]">
                  Widget Position
                </label>

                <div className="grid grid-cols-2 gap-3">
                  <button
                    type="button"
                    onClick={() =>
                      updateSetting("position", "bottom-left")
                    }
                    className={`cursor-pointer rounded-xl px-4 py-3 text-sm font-medium transition ${
                      deployment.position === "bottom-left"
                        ? selectedButton
                        : unselectedButton
                    }`}
                  >
                    ← Left
                    {deployment.position === "bottom-left" && (
                      <Check size={15} className="ml-2 inline" />
                    )}
                  </button>

                  <button
                    type="button"
                    onClick={() =>
                      updateSetting("position", "bottom-right")
                    }
                    className={`cursor-pointer rounded-xl px-4 py-3 text-sm font-medium transition ${
                      deployment.position === "bottom-right"
                        ? selectedButton
                        : unselectedButton
                    }`}
                  >
                    Right →
                    {deployment.position === "bottom-right" && (
                      <Check size={15} className="ml-2 inline" />
                    )}
                  </button>
                </div>
              </div>

              {/* BORDER RADIUS */}
              <div>
                <label className="mb-3 block text-sm font-medium text-[#20234A]">
                  Border Radius ({deployment.border_radius}px)
                </label>

                <input
                  type="range"
                  min={0}
                  max={30}
                  value={deployment.border_radius}
                  onChange={(event) =>
                    updateSetting(
                      "border_radius",
                      Number(event.target.value)
                    )
                  }
                  className="w-full cursor-pointer accent-[#5149E8]"
                />
              </div>

              {/* ALLOWED DOMAINS */}
              <div>
                <label className="mb-2 block text-sm font-medium text-[#20234A]">
                  Allowed Domains
                </label>

                <textarea
                  rows={4}
                  placeholder={"example.com\napp.example.com"}
                  value={deployment.allowed_domains.join("\n")}
                  onChange={(event) =>
                    updateSetting(
                      "allowed_domains",
                      event.target.value
                        .split("\n")
                        .map((domain) => domain.trim())
                        .filter(Boolean)
                    )
                  }
                  className="w-full rounded-xl bg-[#F8F8FC] px-4 py-3 text-sm outline-none focus:ring-2 focus:ring-[#5149E8]/30"
                />

                <p className="mt-1 text-xs text-slate-400">
                  Enter one domain per line.
                </p>
              </div>
            </div>
          </div>

          {/* SAVE */}
          <div className="border-t border-slate-100 p-5">
            <button
              type="button"
              onClick={saveDeployment}
              disabled={saving}
              className="flex w-full cursor-pointer items-center justify-center gap-2 rounded-xl bg-[#5149E8] px-5 py-3 text-sm font-semibold text-white transition hover:bg-[#4038CF] disabled:cursor-not-allowed disabled:opacity-60"
            >
              {saving ? (
                <Loader2 size={17} className="animate-spin" />
              ) : (
                <Save size={17} />
              )}
              {saving ? "Saving..." : "Save Deployment Settings"}
            </button>
          </div>
        </div>

        {/* LIVE PREVIEW */}
        <div className="relative min-w-0 flex-1">
          <div className="sticky top-4 h-[600px] overflow-hidden rounded-2xl bg-[#F0EEFF] p-3">
            <div className="mb-3 flex items-center gap-2 px-2 pt-1">
              <Bot size={17} className="text-[#5149E8]" />
              <span className="text-sm font-semibold text-[#20234A]">
                Live Preview
              </span>
            </div>

            <div className="h-[550px] overflow-hidden rounded-xl bg-white">
              <WidgetPreview settings={deployment} />
            </div>
          </div>
        </div>
      </div>

      <div className="mt-6">
        <EmbedCode agentId={agentId} />
      </div>
    </>
  );
}
