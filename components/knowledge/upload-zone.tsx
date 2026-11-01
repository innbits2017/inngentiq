"use client";

import { useCallback } from "react";
import { useDropzone } from "react-dropzone";
import { UploadCloud } from "lucide-react";

interface Props {
  onFilesSelected: (files: File[]) => void;
}

export default function UploadZone({
  onFilesSelected,
}: Props) {

  const onDrop = useCallback(
    (acceptedFiles: File[]) => {
      onFilesSelected(acceptedFiles);
    },
    [onFilesSelected]
  );

  const {
    getRootProps,
    getInputProps,
    isDragActive,
  } = useDropzone({
    onDrop,
    multiple: true,
    accept: {
      "application/pdf": [".pdf"],
      "text/plain": [".txt"],
      "application/vnd.openxmlformats-officedocument.wordprocessingml.document":
        [".docx"],
    },
  });

  return (
    <div
      {...getRootProps()}
      className={`rounded-xl border-2 border-dashed p-16 text-center cursor-pointer transition

      ${
        isDragActive
          ? "border-blue-600 bg-blue-50"
          : "border-gray-300"
      }
      `}
    >
      <input {...getInputProps()} />

      <UploadCloud className="mx-auto h-14 w-14 text-blue-600" />

      <h3 className="mt-5 text-xl font-semibold">
        Drag & Drop Documents
      </h3>

      <p className="mt-2 text-gray-500">
        PDF, DOCX and TXT files
      </p>

    </div>
  );
}