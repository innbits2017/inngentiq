"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import DynamicField from "@/components/forms/DynamicField";

export default function PreviewPage() {
  const { id } = useParams<{ id: string }>();

  const [fields, setFields] = useState<any[]>([]);
  const [values, setValues] = useState<Record<string, any>>({});

  useEffect(() => {
    if (!id) return;

    fetch(`/api/forms/${id}/fields`)
      .then((res) => res.json())
      .then(setFields);
  }, [id]);

  return (
    <div className="max-w-2xl mx-auto p-10">
      <h1 className="text-3xl font-bold mb-8">
        Form Preview
      </h1>

      <div className="space-y-6">
        {fields.map((field) => (
          <div key={field.id}>
            <label className="block mb-2 font-medium">
              {field.label}

              {field.required && (
                <span className="text-red-500 ml-1">*</span>
              )}
            </label>

            <DynamicField
              field={field}
              values={values}
              setValues={setValues}
            />
          </div>
        ))}

        <button
          onClick={async () => {
            const res = await fetch(`/api/forms/${id}/submit`, {
              method: "POST",
              headers: {
                "Content-Type": "application/json",
              },
              body: JSON.stringify(values),
            });

            if (res.ok) {
              alert("Submitted Successfully");
              setValues({});
            } else {
              alert("Submission Failed");
            }
          }}
          className="bg-blue-600 text-white px-5 py-3 rounded-xl"
        >
          Submit
        </button>
      </div>
    </div>
  );
}