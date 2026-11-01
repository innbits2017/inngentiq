"use client";

import { useEffect, useState } from "react";

interface Props {
  agentId: string;
}

interface Document {
  id: string;
  file_name: string;
  file_size: number;
  status: string;
  created_at: string;
}

export default function DocumentList({ agentId }: Props) {
  const [documents, setDocuments] = useState<Document[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadDocuments() {
      try {
        const res = await fetch(
          `/api/knowledge/documents?agentId=${agentId}`
        );

        const data = await res.json();

        if (Array.isArray(data)) {
          setDocuments(data);
        }
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    }

    loadDocuments();
  }, [agentId]);

  if (loading) {
    return (
      <p className="text-gray-500">
        Loading documents...
      </p>
    );
  }

  if (documents.length === 0) {
    return (
      <p className="text-gray-500">
        No documents uploaded yet.
      </p>
    );
  }

  return (
    <div className="space-y-4">
      {documents.map((doc) => (
        <div
          key={doc.id}
          className="rounded-lg border p-4"
        >
          <h4 className="font-semibold">
            {doc.file_name}
          </h4>

          <p className="text-sm text-gray-500">
            {(doc.file_size / 1024).toFixed(1)} KB
          </p>

          <p className="text-sm">
            {doc.status}
          </p>
        </div>
      ))}
    </div>
  );
}