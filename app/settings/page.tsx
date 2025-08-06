"use client";
import React, { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Alert, AlertTitle, AlertDescription } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import {
  Loader2,
  ShieldCheck,
  ShieldOff,
  QrCode,
  KeyRound,
} from "lucide-react";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "https://localhost:3002/api";

export default function SettingsPage() {
  const [status, setStatus] = useState<"loading" | "enabled" | "disabled">(
    "loading"
  );
  const [showSetup, setShowSetup] = useState(false);
  const [setupData, setSetupData] = useState<any>(null);
  const [setupCode, setSetupCode] = useState("");
  const [setupError, setSetupError] = useState("");
  const [setupSuccess, setSetupSuccess] = useState(false);
  const [backupCodes, setBackupCodes] = useState<string[] | null>(null);
  const [disableMode, setDisableMode] = useState(false);
  const [disablePassword, setDisablePassword] = useState("");
  const [disableError, setDisableError] = useState("");
  const [disableSuccess, setDisableSuccess] = useState(false);

  // Get token, username, userType from localStorage
  const token =
    typeof window !== "undefined" ? localStorage.getItem("token") : null;
  const username =
    typeof window !== "undefined" ? localStorage.getItem("username") : null;
  const userType =
    typeof window !== "undefined" ? localStorage.getItem("userType") : null;

  // Fetch 2FA status on load
  useEffect(() => {
    async function fetchStatus() {
      setStatus("loading");
      try {
        const res = await fetch(`${API_URL}/auth/user-2fa-status`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({ username, userType }),
        });
        const data = await res.json();
        setStatus(data.enabled ? "enabled" : "disabled");
      } catch {
        setStatus("disabled");
      }
    }
    if (token && username && userType) fetchStatus();
    else setStatus("disabled");
  }, [token, username, userType, setupSuccess, disableSuccess]);

  // Start 2FA setup
  //   async function handleSetupStart() {
  //     setShowSetup(true);
  //     setSetupError("");
  //     setSetupSuccess(false);
  //     setSetupData(null);
  //     setBackupCodes(null);
  //     try {
  //       const res = await fetch(`${API_URL}/auth/setup-2fa`, {
  //         method: "POST",
  //         headers: { "Content-Type": "application/json" },
  //         body: JSON.stringify({ username, userType }),
  //       });
  //       const data = await res.json();
  //       if (!data.qrCode || !data.secret)
  //         throw new Error(data.error || "Failed to initiate 2FA setup");
  //       setSetupData(data);
  //     } catch (err: any) {
  //       setSetupError(err.message || "Error initiating 2FA setup");
  //     }
  //   }

  async function handleSetupStart() {
    setShowSetup(true);
    setSetupError("");
    setSetupSuccess(false);
    setSetupData(null);
    setBackupCodes(null);

    if (!username || !userType) {
      setSetupError("User context missing. Please re-login.");
      return;
    }
    try {
      const res = await fetch(`${API_URL}/auth/setup-2fa`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username, userType }),
      });
      const data = await res.json();
      if (!data.qrCode || !data.secret)
        throw new Error(data.error || "Failed to initiate 2FA setup");
      setSetupData(data);
    } catch (err: any) {
      setSetupError(err.message || "Error initiating 2FA setup");
    }
  }

  // Complete 2FA setup
  async function handleSetupVerify(e: React.FormEvent) {
    e.preventDefault();
    setSetupError("");
    setSetupSuccess(false);
    try {
      const res = await fetch(`${API_URL}/auth/verify-2fa`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username, userType, token: setupCode }),
      });
      const data = await res.json();
      if (!data.success)
        throw new Error(data.error || data.message || "Invalid 2FA code");
      setSetupSuccess(true);
      setBackupCodes(setupData?.backupCodes || []);
      setShowSetup(false);
    } catch (err: any) {
      setSetupError(err.message || "Error verifying 2FA code");
    }
  }

  // Handle 2FA disable
  async function handleDisable2FA(e: React.FormEvent) {
    e.preventDefault();
    setDisableError("");
    setDisableSuccess(false);
    try {
      const res = await fetch(`${API_URL}/auth/disable-2fa`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username, userType, password: disablePassword }),
      });
      const data = await res.json();
      if (!data.success)
        throw new Error(data.error || data.message || "Failed to disable 2FA");
      setDisableSuccess(true);
      setDisableMode(false);
      setStatus("disabled");
    } catch (err: any) {
      setDisableError(err.message || "Error disabling 2FA");
    }
  }

  return (
    <div className="max-w-xl mx-auto py-10 px-4">
      <h1 className="text-2xl font-bold mb-2 flex items-center gap-2">
        <ShieldCheck className="w-6 h-6 text-green-600" />
        Account Security Settings
      </h1>
      <div className="mb-4 flex items-center gap-3">
        <span className="font-medium">Two-Factor Authentication (2FA):</span>
        {status === "loading" ? (
          <Loader2 className="animate-spin w-5 h-5" />
        ) : status === "enabled" ? (
          <Badge className="bg-green-600">Enabled</Badge>
        ) : (
          <Badge className="bg-gray-400">Disabled</Badge>
        )}
      </div>

      {/* 2FA enabled: show disable option */}
      {status === "enabled" && !disableMode && (
        <div className="mb-6">
          <Alert variant="default" className="mb-2">
            <ShieldCheck className="w-5 h-5 text-green-600 mr-2" />
            <AlertTitle>2FA is enabled</AlertTitle>
            <AlertDescription>
              Your account is protected with two-factor authentication.
            </AlertDescription>
          </Alert>
          <Button variant="destructive" onClick={() => setDisableMode(true)}>
            <ShieldOff className="w-4 h-4 mr-1" /> Disable 2FA
          </Button>
        </div>
      )}

      {/* Disable 2FA form */}
      {status === "enabled" && disableMode && (
        <form onSubmit={handleDisable2FA} className="mb-6 space-y-3">
          <Alert variant="destructive">
            <ShieldOff className="w-5 h-5 text-red-600 mr-2" />
            <AlertTitle>Disable Two-Factor Authentication?</AlertTitle>
            <AlertDescription>
              Enter your password to confirm disabling 2FA. This will make your
              account less secure.
            </AlertDescription>
          </Alert>
          <Input
            type="password"
            placeholder="Enter your password"
            value={disablePassword}
            onChange={(e) => setDisablePassword(e.target.value)}
            required
          />
          <div className="flex gap-2">
            <Button type="submit" variant="destructive">
              Disable 2FA
            </Button>
            <Button
              type="button"
              variant="secondary"
              onClick={() => setDisableMode(false)}
            >
              Cancel
            </Button>
          </div>
          {disableError && <Alert variant="destructive">{disableError}</Alert>}
          {disableSuccess && (
            <Alert
              variant="default"
              className="bg-green-50 text-green-900 border-green-300"
            >
              2FA has been disabled for your account.
            </Alert>
          )}
        </form>
      )}

      {/* 2FA disabled: show enable/setup option */}
      {status === "disabled" && !showSetup && (
        <div className="mb-6">
          <Alert variant="default" className="mb-2">
            <ShieldOff className="w-5 h-5 text-gray-500 mr-2" />
            <AlertTitle>2FA is not enabled</AlertTitle>
            <AlertDescription>
              Protect your account by enabling two-factor authentication.
            </AlertDescription>
          </Alert>
          <Button onClick={handleSetupStart}>
            <QrCode className="w-4 h-4 mr-1" /> Enable 2FA
          </Button>
        </div>
      )}

      {/* 2FA Setup UI */}
      {showSetup && setupData && (
        <form onSubmit={handleSetupVerify} className="space-y-4 mb-6">
          <Alert variant="default" className="mb-2">
            <QrCode className="w-5 h-5 text-blue-600 mr-2" />
            <AlertTitle>Set up Two-Factor Authentication</AlertTitle>
            <AlertDescription>
              Scan the QR code below with your authenticator app (e.g., Google
              Authenticator, Authy), or enter the manual key.
            </AlertDescription>
          </Alert>
          <div className="flex flex-col items-center gap-2">
            <img
              src={setupData.qrCode}
              alt="2FA QR Code"
              className="w-40 h-40"
            />
            <div className="flex items-center gap-2">
              <KeyRound className="w-4 h-4 text-gray-500" />
              <span className="font-mono text-sm">
                {setupData.manualEntryKey}
              </span>
            </div>
          </div>
          <Input
            type="text"
            inputMode="numeric"
            pattern="[0-9]{6}"
            maxLength={6}
            placeholder="Enter 6-digit code from app"
            value={setupCode}
            onChange={(e) => setSetupCode(e.target.value)}
            required
          />
          <div className="flex gap-2">
            <Button type="submit">Verify & Enable 2FA</Button>
            <Button
              type="button"
              variant="secondary"
              onClick={() => setShowSetup(false)}
            >
              Cancel
            </Button>
          </div>
          {setupError && <Alert variant="destructive">{setupError}</Alert>}
        </form>
      )}

      {/* Show backup codes after successful setup */}
      {backupCodes && (
        <div className="mb-6">
          <Alert variant="default">
            <KeyRound className="w-5 h-5 text-gray-800 mr-2" />
            <AlertTitle>Backup Codes</AlertTitle>
            <AlertDescription>
              Save these backup codes in a safe place. Each code can be used
              once if you lose access to your authenticator app. <br />
              <span className="font-bold text-red-700">
                These codes will not be shown again!
              </span>
            </AlertDescription>
            <div className="grid grid-cols-2 gap-2 mt-2">
              {backupCodes.map((code) => (
                <span
                  key={code}
                  className="font-mono text-base bg-gray-100 px-2 py-1 rounded"
                >
                  {code}
                </span>
              ))}
            </div>
          </Alert>
        </div>
      )}

      {/* Security Tips */}
      <div className="mt-8">
        <h2 className="font-semibold mb-2">Security Tips</h2>
        <ul className="list-disc pl-5 text-gray-700 text-sm space-y-1">
          <li>Never share your password or backup codes with anyone.</li>
          <li>
            Store your backup codes in a secure location (password manager,
            encrypted vault, or printed copy).
          </li>
          <li>
            Enable 2FA on your email and other important accounts for added
            security.
          </li>
          <li>
            Contact support immediately if you suspect unauthorized access.
          </li>
        </ul>
      </div>
    </div>
  );
}
