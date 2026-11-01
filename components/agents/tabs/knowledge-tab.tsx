"use client";

import { useState } from "react";
import { Upload } from "lucide-react";

import { Button } from "@/components/ui/button";
import UploadZone from "@/components/knowledge/upload-zone";
import DocumentList from "@/components/knowledge/document-list";

interface Props {
  agent: any;
}

export default function KnowledgeTab({ agent }: Props) {

  async function handleUpload(selectedFiles: File[]) {
  setFiles(selectedFiles);

  for (const file of selectedFiles) {
    const formData = new FormData();

    formData.append("file", file);
    formData.append("agentId", agent.id);

    try {
      const res = await fetch("/api/knowledge/upload", {
        method: "POST",
        body: formData,
      });

      const data = await res.json();

      if (!data.success) {
        console.error(data.error);
        alert(data.error);
        continue;
      }

      console.log("Uploaded:", data.document);
    } catch (err) {
      console.error(err);
    }
  }

  alert("Upload completed.");
}

  const [files, setFiles] = useState<File[]>([]);

  return (
    <div className="space-y-6">

      {/* Header */}
      <div className="flex items-center justify-between">

        <div>
          <h2 className="text-2xl font-bold">
            Knowledge Base
          </h2>

          <p className="text-gray-500 mt-2">
            Upload documents to train this AI Agent.
          </p>
        </div>

        <Button>
          <Upload className="mr-2 h-4 w-4" />
          Upload Document
        </Button>

      </div>

      {/* Upload Zone */}
      <UploadZone
        onFilesSelected={handleUpload}
        />

      {/* Selected Files */}
      {files.length > 0 && (
        <div className="rounded-xl border bg-white p-6">

          <h3 className="text-lg font-semibold mb-5">
            Selected Files
          </h3>

          <div className="space-y-3">

            {files.map((file) => (
              <div
                key={file.name}
                className="flex items-center justify-between rounded-lg border p-4"
              >

                <div>
                  <p className="font-medium">
                    {file.name}
                  </p>

                  <p className="text-sm text-gray-500">
                    {(file.size / 1024).toFixed(1)} KB
                  </p>
                </div>

              </div>
            ))}

          </div>

        </div>
      )}

      {/* Uploaded Documents */}
      <div className="rounded-xl border bg-white p-8">

        <h3 className="text-lg font-semibold">
          Uploaded Documents
        </h3>

        <DocumentList
            agentId={agent.id}
        />

      </div>

    </div>
  );
}