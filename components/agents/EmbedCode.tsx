"use client";

import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";
import { Copy } from "lucide-react";

interface Props {
  agentId: string;
}

export default function EmbedCode({ agentId }: Props) {
  const [embedCode, setEmbedCode] = useState("");

  useEffect(() => {
    loadEmbedCode();
  }, []);

  async function loadEmbedCode() {
    const res = await fetch(`/api/agents/${agentId}/embed`);
    const data = await res.json();

    setEmbedCode(data.embedCode);
  }

  async function copyCode() {
    await navigator.clipboard.writeText(embedCode);
    toast.success("Embed code copied.");
  }

  return (
    <div className="rounded-2xl border bg-white p-6 shadow-sm">

      <div className="mb-4 flex items-center justify-between">

        <h3 className="text-lg font-semibold">
          Embed Code
        </h3>

        <Button
          size="sm"
          variant="outline"
          onClick={copyCode}
        >
          <Copy className="mr-2 h-4 w-4" />
          Copy
        </Button>

      </div>

      <Textarea
        readOnly
        rows={7}
        value={embedCode}
        className="font-mono text-xs"
      />

      <p className="mt-3 text-sm text-muted-foreground">
        Copy this code and paste it before the closing
        {" </body> "} tag of your website.
      </p>

    </div>
  );
}