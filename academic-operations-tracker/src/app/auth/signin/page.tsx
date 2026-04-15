"use client";

import { signIn, getProviders } from "next-auth/react";
import { useEffect, useState } from "react";

type Provider = {
  id: string;
  name: string;
};

const PROVIDER_STYLES: Record<string, { bg: string; hover: string; icon: string }> = {
  "azure-ad": {
    bg: "bg-[#0078D4]",
    hover: "hover:bg-[#106EBE]",
    icon: "M21.17 2.06A1.13 1.13 0 0020.05 1h-8.42a1.14 1.14 0 00-1.13 1.06L9 13h3.35l.43-2h4.83L16.56 13h3.49l1.12-10.94zM2 13l1.5 8.94A1.13 1.13 0 004.63 23h8.42a1.14 1.14 0 001.13-1.06L15.7 13H2z",
  },
  google: {
    bg: "bg-white border border-gray-300",
    hover: "hover:bg-gray-50",
    icon: "",
  },
};

function GoogleIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24">
      <path
        d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 01-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z"
        fill="#4285F4"
      />
      <path
        d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
        fill="#34A853"
      />
      <path
        d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
        fill="#FBBC05"
      />
      <path
        d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
        fill="#EA4335"
      />
    </svg>
  );
}

function MicrosoftIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 23 23">
      <rect x="1" y="1" width="10" height="10" fill="#F25022" />
      <rect x="12" y="1" width="10" height="10" fill="#7FBA00" />
      <rect x="1" y="12" width="10" height="10" fill="#00A4EF" />
      <rect x="12" y="12" width="10" height="10" fill="#FFB900" />
    </svg>
  );
}

export default function SignInPage() {
  const [providers, setProviders] = useState<Record<string, Provider> | null>(null);

  useEffect(() => {
    getProviders().then((p) => setProviders(p));
  }, []);

  return (
    <div className="flex items-center justify-center min-h-screen bg-bg">
      <div className="bg-white rounded-xl shadow-lg p-8 w-full max-w-md">
        <div className="text-center mb-8">
          <h1
            className="text-2xl font-bold mb-2"
            style={{ fontFamily: "Georgia, serif", color: "#003366" }}
          >
            NUST Academic Operations Tracker
          </h1>
          <p className="text-gray-500 text-sm">Sign in with your institutional account</p>
        </div>

        <div className="space-y-3">
          {providers &&
            Object.values(providers).map((provider) => (
              <button
                key={provider.id}
                onClick={() => signIn(provider.id, { callbackUrl: "/" })}
                className={`w-full flex items-center justify-center gap-3 px-4 py-3 rounded-lg font-medium transition-colors ${
                  provider.id === "google"
                    ? "bg-white border border-gray-300 hover:bg-gray-50 text-gray-700"
                    : "bg-[#0078D4] hover:bg-[#106EBE] text-white"
                }`}
              >
                {provider.id === "google" && <GoogleIcon />}
                {provider.id === "azure-ad" && <MicrosoftIcon />}
                Sign in with {provider.name}
              </button>
            ))}
        </div>

        {!providers && (
          <div className="text-center text-gray-400 text-sm py-4">Loading...</div>
        )}

        <p className="text-center text-xs text-gray-400 mt-8">
          Your account must be pre-registered by the System Administrator.
        </p>
      </div>
    </div>
  );
}
