"use client";

import { useEffect, useState } from "react";

type Props = {
  open: boolean;
  field: any;
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

export default function EditFieldDialog({
  open,
  field,
  onClose,
  onSuccess,
}: Props) {
  const [label, setLabel] = useState("");
  const [type, setType] = useState("text");
  const [placeholder, setPlaceholder] = useState("");
  const [required, setRequired] = useState(false);
  const [options, setOptions] = useState("");

  useEffect(() => {
    if (!field) return;

    setLabel(field.label);
    setType(field.field_type);
    setPlaceholder(field.placeholder ?? "");
    setRequired(field.required);
    setOptions((field.options ?? []).join("\n"));
  }, [field]);

  if (!open || !field) return null;

  return (
    <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50">

      <div className="bg-white rounded-xl p-6 w-full max-w-lg">

        <h2 className="text-xl font-bold mb-5">
          Edit Field
        </h2>

        <div className="space-y-4">

          <input
            value={label}
            onChange={(e)=>setLabel(e.target.value)}
            className="w-full border rounded-lg px-3 py-2"
          />

          <select
            value={type}
            onChange={(e)=>setType(e.target.value)}
            className="w-full border rounded-lg px-3 py-2"
          >
            {fieldTypes.map(t=>(
              <option key={t}>{t}</option>
            ))}
          </select>

          <input
            value={placeholder}
            onChange={(e)=>setPlaceholder(e.target.value)}
            className="w-full border rounded-lg px-3 py-2"
          />

          {(type==="select" ||
            type==="radio" ||
            type==="checkbox") && (

            <textarea
              rows={4}
              value={options}
              onChange={(e)=>setOptions(e.target.value)}
              className="w-full border rounded-lg px-3 py-2"
            />

          )}

          <label className="flex gap-2">

            <input
              type="checkbox"
              checked={required}
              onChange={(e)=>setRequired(e.target.checked)}
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
            onClick={async()=>{

              await fetch(`/api/form-fields/${field.id}`,{
                method:"PATCH",
                headers:{
                  "Content-Type":"application/json"
                },
                body:JSON.stringify({
                  label,
                  field_type:type,
                  placeholder,
                  required,
                  options:options
                    .split("\n")
                    .map(o=>o.trim())
                    .filter(Boolean)
                })
              });

              onSuccess();
              onClose();

            }}
            className="bg-blue-600 text-white rounded-lg px-4 py-2"
          >
            Save
          </button>

        </div>

      </div>

    </div>
  );
}