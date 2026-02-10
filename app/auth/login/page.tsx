"use client";

import { FormEvent, useState } from "react";
import Link from "next/link";
import Image, { StaticImageData } from "next/image";
import { useRouter, useSearchParams } from "next/navigation";
import { signIn } from "next-auth/react";
import Logo from "@/components/Logo";
import googleLogo from "@/public/icons8-google.svg";
import githubLogo from "@/public/icons8-github.svg";
import facebookLogo from "@/public/icons8-facebook.svg";
import appleLogo from "@/public/icons8-apple.svg";

export default function LoginPage() {
  const router = useRouter();
  const params = useSearchParams();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const callbackUrl = params?.get("callbackUrl") || "/dashboard";

  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    const result = await signIn("credentials", {
      email,
      password,
      redirect: false,
      callbackUrl,
    });

    setLoading(false);

    if (result?.error) {
      setError("Invalid email or password");
      return;
    }

    router.push(callbackUrl);
    router.refresh();
  };

  return (
    <div className="min-h-screen bg-[#04070c] text-white p-4 md:p-6">
      <div className="mx-auto max-w-[1400px] min-h-[92vh] border border-white/30 p-6 md:p-8 flex flex-col lg:flex-row rounded-sm">
        <div className="hidden lg:flex flex-1 items-end justify-center pr-8">
          <div className="relative h-full w-full rounded-sm border border-white/20 bg-[radial-gradient(circle_at_top,rgba(72,127,255,.2),transparent_45%),linear-gradient(to_bottom,rgba(16,22,32,.9),rgba(4,7,12,.95))] p-8">
            <div className="absolute inset-0 opacity-20 bg-[url('/dashboard.svg')] bg-cover bg-center" />
            <div className="relative z-10 grid h-full place-items-center">
              <div className="grid grid-cols-2 gap-4 w-full max-w-2xl">
                <div className="rounded-2xl border border-white/20 bg-white/10 backdrop-blur p-4">
                  <h3 className="text-lg font-semibold">Analytics Dashboard</h3>
                  <p className="text-sm text-gray-300 mt-2">Track clicks, locations and devices for every shortened link.</p>
                </div>
                <div className="rounded-2xl border border-white/20 bg-white/5 backdrop-blur p-4 mt-12">
                  <h3 className="text-lg font-semibold">Quick & Advanced Mode</h3>
                  <p className="text-sm text-gray-300 mt-2">Switch modes to use simple links or rich controls like aliases and passwords.</p>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="w-full lg:w-[430px] flex items-center justify-center">
          <form onSubmit={handleSubmit} className="w-full max-w-md space-y-5">
            <Logo />
            <div>
              <h1 className="text-4xl font-bold">Welcome Back</h1>
              <p className="text-gray-400 mt-2">Join LinkHive – Shorten Smarter, Share Faster, Track Better</p>
            </div>

            <div>
              <label className="block mb-2 text-sm">Email</label>
              <input
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                type="email"
                required
                placeholder="Enter your E-mail"
                className="w-full rounded-full border border-white/20 bg-transparent px-5 py-3 focus:outline-none focus:border-blue-400"
              />
            </div>

            <div>
              <label className="block mb-2 text-sm">Password</label>
              <input
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                type="password"
                required
                placeholder="Enter password"
                className="w-full rounded-full border border-white/20 bg-transparent px-5 py-3 focus:outline-none focus:border-blue-400"
              />
            </div>

            {error && <p className="text-red-400 text-sm">{error}</p>}

            <button
              type="submit"
              disabled={loading}
              className="w-full rounded-full bg-white text-black font-semibold py-3 hover:bg-gray-200 disabled:opacity-70"
            >
              {loading ? "Logging in..." : "Log In"}
            </button>

            <div className="pt-2">
              <div className="flex items-center gap-3 text-gray-400 text-xs">
                <div className="h-px bg-white/15 flex-1" />
                <span>or continue with</span>
                <div className="h-px bg-white/15 flex-1" />
              </div>

              <div className="mt-4 flex justify-center gap-3">
                <OAuthCircle icon={googleLogo} label="Google" onClick={() => signIn("google", { callbackUrl: "/dashboard" })} />
                <OAuthCircle icon={githubLogo} label="GitHub" onClick={() => signIn("github", { callbackUrl: "/dashboard" })} />
                <OAuthCircle icon={facebookLogo} label="Facebook" disabled />
                <OAuthCircle icon={appleLogo} label="Apple" disabled />
              </div>
            </div>

            <p className="text-center text-gray-400 text-sm">
              Don&apos;t have an account?{" "}
              <Link href="/auth/signup" className="text-white hover:text-blue-300">Register</Link>
            </p>
          </form>
        </div>
      </div>
    </div>
  );
}

function OAuthCircle({ icon, label, onClick, disabled = false }: { icon: StaticImageData; label: string; onClick?: () => void; disabled?: boolean }) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      title={disabled ? `${label} coming soon` : label}
      className="h-12 w-12 rounded-full bg-white grid place-items-center hover:bg-gray-200 disabled:opacity-50"
    >
      <Image src={icon} alt={label} width={22} height={22} />
    </button>
  );
}
