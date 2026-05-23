"use client";

import * as React from "react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { useAuthStore } from "@/lib/auth-store";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  InputOTP,
  InputOTPGroup,
  InputOTPSlot,
} from "@/components/ui/input-otp";

type Step = "email" | "otp";

export default function LoginPage() {
  const router = useRouter();
  const login = useAuthStore((s) => s.login);

  const [step, setStep] = React.useState<Step>("email");
  const [email, setEmail] = React.useState("");
  const [otp, setOtp] = React.useState("");
  const [loading, setLoading] = React.useState(false);

  const handleEmailSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim()) {
      toast.error("Please enter your email.");
      return;
    }
    setStep("otp");
  };

  const handleOtpComplete = async (value: string) => {
    if (value.length < 6) return;
    setLoading(true);

    // Simulate a small network delay for realism
    await new Promise((r) => setTimeout(r, 600));

    const ok = login(email);
    if (ok) {
      toast.success("Signed in.");
      router.push("/admin");
    } else {
      toast.error("No admin account found for that email.");
      setStep("email");
      setOtp("");
    }
    setLoading(false);
  };

  return (
    <div className="min-h-screen bg-zinc-50 flex items-center justify-center p-4">
      <div className="w-full max-w-sm">
        <div className="flex flex-col items-center mb-8">
          <Image
            src="/logos/unapologeticBlack.png"
            alt="Unapologetic"
            width={180}
            height={40}
            className="object-contain mb-6"
            priority
          />
          <h1 className="text-2xl font-semibold text-zinc-900">
            {step === "email" ? "Sign in" : "Enter your code"}
          </h1>
          <p className="text-sm text-zinc-500 mt-1 text-center">
            {step === "email"
              ? "Admin access only."
              : `We sent a 6-digit code to ${email}`}
          </p>
        </div>

        <div className="bg-white rounded-xl border border-zinc-200 p-6 shadow-sm space-y-5">
          {step === "email" ? (
            <form onSubmit={handleEmailSubmit} className="space-y-4">
              <div className="space-y-1.5">
                <Label htmlFor="email">Email address</Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="you@unapologetic.store"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  autoComplete="email"
                  autoFocus
                />
              </div>
              <Button type="submit" className="w-full">
                Continue
              </Button>
            </form>
          ) : (
            <div className="space-y-4">
              <div className="space-y-3">
                <Label>Verification code</Label>
                <div className="flex justify-center">
                  <InputOTP
                    maxLength={6}
                    value={otp}
                    onChange={setOtp}
                    onComplete={handleOtpComplete}
                    autoFocus
                    disabled={loading}
                  >
                    <InputOTPGroup>
                      <InputOTPSlot index={0} />
                      <InputOTPSlot index={1} />
                      <InputOTPSlot index={2} />
                      <InputOTPSlot index={3} />
                      <InputOTPSlot index={4} />
                      <InputOTPSlot index={5} />
                    </InputOTPGroup>
                  </InputOTP>
                </div>
                <p className="text-xs text-zinc-400 text-center">
                  Enter any 6-digit code to continue.
                </p>
              </div>
              <Button
                className="w-full"
                disabled={otp.length < 6 || loading}
                onClick={() => handleOtpComplete(otp)}
              >
                {loading ? "Verifying..." : "Sign in"}
              </Button>
              <button
                type="button"
                className="w-full text-sm text-zinc-500 hover:text-zinc-700 text-center"
                onClick={() => {
                  setStep("email");
                  setOtp("");
                }}
              >
                Use a different email
              </button>
            </div>
          )}
        </div>

        <p className="text-xs text-zinc-400 text-center mt-6">
          Access is restricted to approved admin accounts only.
        </p>
      </div>
    </div>
  );
}
