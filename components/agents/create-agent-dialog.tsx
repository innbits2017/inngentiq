
"use client";

import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";
import { Plus, Loader2 } from "lucide-react";

interface Props {
  onCreated: (agent: any) => void;
}

export default function CreateAgentDialog({ onCreated }: Props) {
  const [open, setOpen] = useState(false);
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [model, setModel] = useState("gpt-4.1-mini");
  const [loading, setLoading] = useState(false);

  async function createAgent() {
    if (!name.trim()) {
      toast.error("Please enter an agent name.");
      return;
    }

    try {
      setLoading(true);

      const res = await fetch("/api/agents/create", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          name: name.trim(),
          description: description.trim(),
          model,
        }),
      });

      const data = await res.json();

      if (!res.ok || !data.success) {
        throw new Error(data.error || "Failed to create agent.");
      }

      toast.success("Agent created successfully!");
      onCreated(data.agent);

      setName("");
      setDescription("");
      setModel("gpt-4.1-mini");
      setOpen(false);
    } catch (error: any) {
      toast.error(error.message || "Something went wrong.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button className="gap-2 rounded-xl bg-[#5149E8] px-5 text-white shadow-sm hover:bg-[#433BD1]">
          <Plus size={17} />
          Create Agent
        </Button>
      </DialogTrigger>

      <DialogContent className="rounded-2xl border-0 bg-white shadow-xl sm:max-w-xl">
        <DialogHeader>
          <div className="mb-2 flex h-12 w-12 items-center justify-center rounded-xl bg-[#F0EEFF] text-[#5149E8]">
            <Plus size={23} />
          </div>

          <DialogTitle className="text-xl font-bold text-[#20234A]">
            Create AI Agent
          </DialogTitle>

          <p className="text-sm text-slate-500">
            Set up a new AI employee for your business.
          </p>
        </DialogHeader>

        <div className="mt-4 space-y-5">
          <div className="space-y-2">
            <label className="text-sm font-semibold text-[#20234A]">
              Agent Name *
            </label>

            <Input
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. Sales Assistant"
              disabled={loading}
              className="h-11 rounded-xl border-slate-200 focus-visible:ring-[#5149E8]"
            />
          </div>

          <div className="space-y-2">
            <label className="text-sm font-semibold text-[#20234A]">
              Description
            </label>

            <Textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Describe what this AI agent will do..."
              rows={3}
              disabled={loading}
              className="resize-none rounded-xl border-slate-200 focus-visible:ring-[#5149E8]"
            />
          </div>

          <div className="space-y-2">
            <label className="text-sm font-semibold text-[#20234A]">
              AI Model
            </label>

            <Input
              value={model}
              onChange={(e) => setModel(e.target.value)}
              disabled={loading}
              className="h-11 rounded-xl border-slate-200 focus-visible:ring-[#5149E8]"
            />

            <p className="text-xs text-slate-400">
              You can configure advanced model settings later.
            </p>
          </div>

          <Button
            onClick={createAgent}
            disabled={loading || !name.trim()}
            className="h-11 w-full rounded-xl bg-[#5149E8] font-semibold text-white hover:bg-[#433BD1]"
          >
            {loading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Creating Agent...
              </>
            ) : (
              "Create Agent"
            )}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
