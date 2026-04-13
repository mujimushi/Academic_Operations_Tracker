"use client";

import { FileIcon } from "@/components/Icons";

interface DocumentItem {
  id: string;
  type: string;
  filename: string;
  size: number;
  status: string;
  uploadedBy: { name: string };
}

function formatFileSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

const DOC_TYPE_LABELS: Record<string, string> = {
  REQUIREMENTS: "Requirements",
  POLICY: "Policy Documents",
  CHAT_ATTACHMENT: "Chat Attachments",
};

export default function DocumentChecklist({
  documents,
  taskId,
}: {
  documents: DocumentItem[];
  taskId: string;
}) {
  if (documents.length === 0) {
    return (
      <div className="bg-white rounded-lg p-4 shadow-sm mb-4">
        <h3 className="text-sm font-semibold text-gray-700 mb-2">Documents</h3>
        <p className="text-sm text-gray-400">No documents attached.</p>
      </div>
    );
  }

  // Group documents by type
  const grouped: Record<string, DocumentItem[]> = {};
  for (const doc of documents) {
    if (!grouped[doc.type]) grouped[doc.type] = [];
    grouped[doc.type].push(doc);
  }

  return (
    <div className="bg-white rounded-lg p-4 shadow-sm mb-4">
      <h3 className="text-sm font-semibold text-gray-700 mb-3">Documents</h3>
      {Object.entries(grouped).map(([type, docs]) => (
        <div key={type} className="mb-3 last:mb-0">
          <p className="text-xs font-medium text-gray-500 uppercase tracking-wide mb-1.5">
            {DOC_TYPE_LABELS[type] || type}
          </p>
          <ul className="space-y-1.5">
            {docs.map((doc) => (
              <li key={doc.id} className="flex items-center gap-2">
                <FileIcon className="text-gray-400 flex-shrink-0" />
                <a
                  href={`/api/tasks/${taskId}/documents/${doc.id}`}
                  className="text-sm text-nust-blue hover:underline truncate flex-1 min-w-0"
                >
                  {doc.filename}
                </a>
                <span className="text-xs text-gray-400 flex-shrink-0">
                  {formatFileSize(doc.size)}
                </span>
                <span
                  className={`text-[10px] font-semibold px-1.5 py-0.5 rounded flex-shrink-0 ${
                    doc.status === "APPROVED"
                      ? "bg-green-100 text-green-700"
                      : "bg-gray-100 text-gray-600"
                  }`}
                >
                  {doc.status}
                </span>
              </li>
            ))}
          </ul>
        </div>
      ))}
    </div>
  );
}
