"use client";

import { signOut } from "next-auth/react";

export default function Unauthorized() {
  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-bg">
      <div className="bg-white rounded-lg shadow-md p-8 max-w-md text-center">
        <h1 className="text-2xl font-heading text-nust-blue mb-4">Unauthorized</h1>
        <p className="text-gray-600 mb-6">
          You do not have permission to access this page.
        </p>
        <button
          onClick={() => signOut({ callbackUrl: "/" })}
          className="bg-nust-blue text-white px-6 py-2 rounded-lg hover:opacity-90"
        >
          Sign Out
        </button>
      </div>
    </div>
  );
}
