"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Shield, Eye, EyeOff, RotateCcw } from "lucide-react";

export default function LoginPage() {
  const [formData, setFormData] = useState({
    email: "",
    password: "",
    userType: "",
    twoFactorCode: "",
  });
  const [showPassword, setShowPassword] = useState(false);
  const [show2FA, setShow2FA] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    try {
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/auth/login`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            email: formData.email,
            password: formData.password,
            userType: formData.userType,
          }),
        }
      );
      const data = await response.json();
      if (response.ok) {
        if (data.requires2FA) {
          setShow2FA(true);
        } else {
          localStorage.setItem("token", data.token);
          localStorage.setItem(
            "userType",
            data.user?.userType || data.userType
          );
          localStorage.setItem("username", data.user?.username || "");
          window.location.href = "/dashboard";
        }
      } else if (data.requires2FA) {
        setShow2FA(true);
      } else {
        setError(data.error || data.message || "Login failed");
      }
    } catch {
      setError("Network error. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const handle2FASubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    try {
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/auth/login`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            email: formData.email,
            password: formData.password,
            userType: formData.userType,
            twoFactorCode: formData.twoFactorCode,
          }),
        }
      );
      const data = await response.json();
      if (response.ok) {
        localStorage.setItem("token", data.token);
        localStorage.setItem("userType", data.user?.userType || data.userType);
        localStorage.setItem("username", data.user?.username || "");
        window.location.href = "/dashboard";
      } else {
        setError(data.error || data.message || "Invalid 2FA code");
      }
    } catch {
      setError("Network error. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const handleBackToLogin = () => {
    setShow2FA(false);
    setFormData({ ...formData, twoFactorCode: "" });
    setError("");
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <Shield className="h-12 w-12 text-blue-600 mx-auto mb-2" />
          <CardTitle className="text-2xl">Health Records Vault</CardTitle>
          <CardDescription>
            {show2FA
              ? "Enter your 2FA code"
              : "Sign in to access medical records"}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form
            onSubmit={show2FA ? handle2FASubmit : handleSubmit}
            className="space-y-4"
          >
            {!show2FA && (
              <>
                <div>
                  <Label htmlFor="email">Email</Label>
                  <Input
                    id="email"
                    type="email"
                    autoComplete="username"
                    value={formData.email}
                    onChange={(e) =>
                      setFormData({ ...formData, email: e.target.value })
                    }
                    required
                  />
                </div>
                <div>
                  <Label htmlFor="password">Password</Label>
                  <div className="relative">
                    <Input
                      id="password"
                      type={showPassword ? "text" : "password"}
                      autoComplete="current-password"
                      value={formData.password}
                      onChange={(e) =>
                        setFormData({ ...formData, password: e.target.value })
                      }
                      required
                    />
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      className="absolute right-2 top-1/2 -translate-y-1/2"
                      onClick={() => setShowPassword((v) => !v)}
                      tabIndex={-1}
                    >
                      {showPassword ? (
                        <EyeOff className="w-4 h-4" />
                      ) : (
                        <Eye className="w-4 h-4" />
                      )}
                    </Button>
                  </div>
                </div>
                <div>
                  <Label htmlFor="userType">User Type</Label>
                  <Select
                    value={formData.userType}
                    onValueChange={(value) =>
                      setFormData({ ...formData, userType: value })
                    }
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select user type" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="admin">Admin</SelectItem>
                      <SelectItem value="doctor">Doctor</SelectItem>
                      <SelectItem value="nurse">Nurse</SelectItem>
                      <SelectItem value="pharmacist">Pharmacist</SelectItem>
                      <SelectItem value="patient">Patient</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </>
            )}

            {show2FA && (
              <div>
                <Label htmlFor="twoFactorCode">2FA Code</Label>
                <Input
                  id="twoFactorCode"
                  type="text"
                  inputMode="numeric"
                  autoComplete="one-time-code"
                  value={formData.twoFactorCode}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      twoFactorCode: e.target.value.replace(/\D/g, ""),
                    })
                  }
                  required
                  maxLength={6}
                  pattern="\d{6}"
                  placeholder="Enter 6-digit code"
                />
              </div>
            )}

            {error && (
              <Alert variant="destructive">
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}

            <div className="flex items-center justify-between">
              {show2FA ? (
                <>
                  <Button
                    type="button"
                    variant="outline"
                    onClick={handleBackToLogin}
                    disabled={loading}
                  >
                    <RotateCcw className="w-4 h-4 mr-1" /> Back
                  </Button>
                  <Button
                    type="submit"
                    className="ml-2"
                    disabled={loading || !formData.twoFactorCode}
                  >
                    {loading ? "Verifying..." : "Verify 2FA"}
                  </Button>
                </>
              ) : (
                <Button
                  type="submit"
                  className="w-full"
                  disabled={
                    loading || !formData.email || !formData.password
                    // !formData.userType
                  }
                >
                  {loading ? "Signing in..." : "Sign In"}
                </Button>
              )}
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
