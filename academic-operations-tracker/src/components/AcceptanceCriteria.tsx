"use client";

import { CheckIcon } from "@/components/Icons";

interface Criterion {
  id: string;
  description: string;
  isComplete: boolean;
  completedAt: string | Date | null;
  sortOrder: number;
}

export default function AcceptanceCriteria({
  criteria,
}: {
  criteria: Criterion[];
}) {
  const sorted = [...criteria].sort((a, b) => a.sortOrder - b.sortOrder);

  if (sorted.length === 0) {
    return (
      <div className="bg-white rounded-lg p-4 shadow-sm mb-4">
        <h3 className="text-sm font-semibold text-gray-700 mb-2">
          Acceptance Criteria
        </h3>
        <p className="text-sm text-gray-400">No acceptance criteria defined.</p>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg p-4 shadow-sm mb-4">
      <h3 className="text-sm font-semibold text-gray-700 mb-3">
        Acceptance Criteria
      </h3>
      <ul className="space-y-2">
        {sorted.map((item) => (
          <li key={item.id} className="flex items-start gap-2">
            {item.isComplete ? (
              <span className="mt-0.5 flex-shrink-0 w-5 h-5 rounded-full bg-green-100 flex items-center justify-center">
                <CheckIcon className="text-green-600" />
              </span>
            ) : (
              <span className="mt-0.5 flex-shrink-0 w-5 h-5 rounded-full border-2 border-gray-300" />
            )}
            <div className="flex-1 min-w-0">
              <p
                className={`text-sm ${
                  item.isComplete
                    ? "line-through text-gray-400"
                    : "text-gray-700"
                }`}
              >
                {item.description}
              </p>
              {item.isComplete && item.completedAt && (
                <p className="text-xs text-gray-400 mt-0.5">
                  Completed{" "}
                  {new Date(item.completedAt).toLocaleDateString()}
                </p>
              )}
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
}
