"use client";

import { useState } from "react";

type Props = {
  formId: string;
  open: boolean;
  onClose: () => void;
  onSuccess: () => void;
};

const fieldTypes = [
  "text",
  "email",
  "phone",
  "number",
  "textarea",
  "select",
  "checkbox",
  "radio",
  "date",
];


export default function AddFieldDialog({
  formId,
  open,
  onClose,
  onSuccess,
}: Props) {
  const [label, setLabel] = useState("");
  const [type, setType] = useState("text");
  const [placeholder, setPlaceholder] = useState("");
  const [required, setRequired] = useState(false);
  const [options, setOptions] = useState("");
  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
      <div className="w-full max-w-lg rounded-xl bg-white p-6">

        <h2 className="text-xl font-semibold mb-6">
          Add Field
        </h2>

        <div className="space-y-4">

        <div>
          <label>Label</label>
          <input
            value={label}
            onChange={(e) => setLabel(e.target.value)}
            className="w-full border rounded-lg px-3 py-2 mt-1"
          />
        </div>

        <div>
          <label>Field Type</label>

          <select
            value={type}
            onChange={(e) => setType(e.target.value)}
            className="w-full border rounded-lg px-3 py-2 mt-1"
          >
            {fieldTypes.map((t) => (
              <option key={t}>{t}</option>
            ))}
          </select>
        </div>

        <div>
          <label>Placeholder</label>

          <input
            value={placeholder}
            onChange={(e) => setPlaceholder(e.target.value)}
            className="w-full border rounded-lg px-3 py-2 mt-1"
          />
        </div>

        {/* 👇 Paste it here */}

        {(type === "select" ||
          type === "radio" ||
          type === "checkbox") && (
          <div>
            <label>Options</label>

            <textarea
              value={options}
              onChange={(e) => setOptions(e.target.value)}
              placeholder={`Apartment
      Villa
      Office`}
              rows={4}
              className="w-full border rounded-lg px-3 py-2 mt-1"
            />
          </div>
        )}

        {/* 👆 End */}

        <label className="flex items-center gap-2">
          <input
            type="checkbox"
            checked={required}
            onChange={(e) => setRequired(e.target.checked)}
          />

          Required
        </label>

      </div>

        <div className="flex justify-end gap-3 mt-6">

          <button
            onClick={onClose}
            className="border rounded-lg px-4 py-2"
          >
            Cancel
          </button>

          <button
                onClick={async () => {
                    const res = await fetch(`/api/forms/${formId}/fields`, {
                    method: "POST",
                    headers: {
                        "Content-Type": "application/json",
                    },
                    body: JSON.stringify({
                      label,
                      field_type: type,
                      placeholder,
                      required,
                      options: options
                        .split("\n")
                        .map((o) => o.trim())
                        .filter(Boolean),
                    }),
                    });

                    if (!res.ok) {
                    alert("Failed");
                    return;
                    }

                    onSuccess();
                    onClose();
                }}
                className="bg-blue-600 text-white rounded-lg px-4 py-2"
                            >
            Add Field
            </button>
        </div>

      </div>
    </div>
  );
}