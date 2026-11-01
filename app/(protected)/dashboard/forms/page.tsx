"use client";

import { useEffect, useState } from "react";
import CreateFormDialog from "@/components/forms/CreateFormDialog";
import Link from "next/link";

export default function FormsPage() {
  const [open, setOpen] = useState(false);
  const [forms, setForms] = useState<any[]>([]);

  useEffect(() => {
    fetch("/api/forms")
      .then((r) => r.json())
      .then(setForms);
  }, []);

  return (
    <>
      <div className="max-w-7xl mx-auto p-8">
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-3xl font-bold">Forms</h1>
            <p className="text-gray-500">Create and manage AI Forms</p>
          </div>

          <button
            onClick={() => setOpen(true)}
            className="bg-blue-600 text-white px-5 py-3 rounded-xl"
          >
            + New Form
          </button>
        </div>

        <div className="space-y-4">
          {forms.map((form) => (
            <div
              key={form.id}
              className="rounded-xl border p-5 flex justify-between items-center"
            >
              <div>
                <h3 className="font-semibold text-lg">{form.name}</h3>
                <p className="text-sm text-gray-500">
                  {form.description}
                </p>
              </div>

              <Link
                    href={`/dashboard/forms/${form.id}`}
                    className="border rounded-lg px-4 py-2"
                    >
                    Edit
              </Link>
            </div>
          ))}

          {forms.length === 0 && (
            <div className="border rounded-xl p-10 text-center text-gray-500">
              No forms created yet.
            </div>
          )}
        </div>
      </div>

      <CreateFormDialog
        open={open}
        onClose={() => setOpen(false)}
      />
    </>
  );
}