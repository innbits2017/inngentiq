"use client";

import { useState } from "react";

interface WidgetProps {
  config: {
    widget_title: string;
    welcome_message: string;
    primary_color: string;
    text_color: string;
    border_radius: number;
    position: "bottom-right" | "bottom-left";
  };
}

export default function Widget({
  config,
}: WidgetProps) {
  const [open, setOpen] = useState(false);

  const isRight =
    config.position === "bottom-right";

  return (
    <>
      {open && (
        <div
          style={{
            position: "fixed",
            bottom: "100px",
            [isRight ? "right" : "left"]: "24px",
            width: "380px",
            height: "600px",
            background: "#fff",
            borderRadius: config.border_radius,
            overflow: "hidden",
            boxShadow:
              "0 20px 60px rgba(0,0,0,.25)",
            zIndex: 999999,
          }}
        >
          <div
            style={{
              background: config.primary_color,
              color: config.text_color,
              padding: "18px",
              fontWeight: 600,
            }}
          >
            {config.widget_title}
          </div>

          <div
            style={{
              padding: "20px",
            }}
          >
            {config.welcome_message}
          </div>
        </div>
      )}

      <button
        onClick={() => setOpen(!open)}
        style={{
          position: "fixed",
          bottom: "24px",
          [isRight ? "right" : "left"]: "24px",
          width: "64px",
          height: "64px",
          border: "none",
          borderRadius: "50%",
          cursor: "pointer",
          background: config.primary_color,
          color: config.text_color,
          fontSize: "28px",
          boxShadow:
            "0 10px 30px rgba(0,0,0,.25)",
          zIndex: 999999,
        }}
      >
        {open ? "×" : "💬"}
      </button>
    </>
  );
}