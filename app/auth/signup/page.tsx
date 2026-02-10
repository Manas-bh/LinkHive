"use client";

import { FormEvent, useState } from "react";
import Link from "next/link";
import Image, { StaticImageData } from "next/image";
import { useRouter } from "next/navigation";
import { signIn } from "next-auth/react";
import Logo from "@/components/Logo";
import googleLogo from "@/public/icons8-google.svg";
import githubLogo from "@/public/icons8-github.svg";
import facebookLogo from "@/public/icons8-facebook.svg";
import appleLogo from "@/public/icons8-apple.svg";

export default function SignupPage() {
  const router = useRouter();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    const response = await fetch("/api/auth/signup", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name, email, password }),
    });

    const data = await response.json();

    if (!response.ok) {
      setLoading(false);
      setError(data.error || "Unable to create account");
      return;
    }

    const signInResult = await signIn("credentials", {
      email,
      password,
      redirect: false,
      callbackUrl: "/dashboard",
    });

    setLoading(false);

    if (signInResult?.error) {
      router.push("/auth/login");
      return;
    }

    router.push("/dashboard");
    router.refresh();
  };

  return (
    <div className="min-h-screen bg-[#04070c] text-white p-4 md:p-6">
      <div className="mx-auto max-w-[1400px] min-h-[92vh] border border-white/20 p-6 md:p-8 flex flex-col lg:flex-row gap-10 rounded-sm">
        <div className="w-full lg:w-[420px] flex items-center">
          <form onSubmit={handleSubmit} className="w-full space-y-5">
            <Logo />
            <div>
              <h1 className="text-4xl font-bold">Create a free account</h1>
              <p className="text-gray-400 mt-2">Join LinkHive – Shorten Smarter, Share Faster, Track Better</p>
            </div>

            <Field label="Name" value={name} onChange={setName} placeholder="Enter your name" />
            <Field label="Email" value={email} onChange={setEmail} placeholder="Enter your E-mail" type="email" />
            <Field label="Password" value={password} onChange={setPassword} placeholder="Enter password" type="password" />

            {error && <p className="text-red-400 text-sm">{error}</p>}

            <button
              type="submit"
              disabled={loading}
              className="w-full rounded-full bg-white text-black font-semibold py-3 hover:bg-gray-200 disabled:opacity-70"
            >
              {loading ? "Creating account..." : "Create my account"}
            </button>

            <div className="pt-1">
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

            <p className="text-center text-gray-400 text-sm pt-1">
              Already have an account?{" "}
              <Link href="/auth/login" className="text-white hover:text-blue-300">Log In</Link>
            </p>
          </form>
        </div>

        <div className="flex-1 border border-white/20 rounded-sm relative overflow-hidden bg-[radial-gradient(circle_at_70%_35%,rgba(108,181,255,.32),transparent_35%),linear-gradient(180deg,#0a1019_0%,#070b13_100%)] min-h-[420px]">
          <div className="absolute inset-0 opacity-25 bg-[url('/dashboard.svg')] bg-cover bg-center" />
          <div className="relative z-10 h-full grid place-items-center p-8">
            <div className="max-w-lg rounded-2xl border border-white/30 bg-black/45 backdrop-blur p-6 md:p-8">
              <p className="text-2xl">★★★★★</p>
              <h3 className="text-3xl font-semibold mt-3">&ldquo;Perfect for my blog&rdquo;</h3>
              <p className="text-gray-200 mt-6 leading-relaxed">I run a small blog and use it to shorten links for my posts. The quick mode is amazing, and once I started using the advanced features, it felt like I had leveled up my whole site.</p>
              <p className="mt-6 text-gray-300">Priya S.<br/>Blogger</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function Field({
  label,
  value,
  onChange,
  placeholder,
  type = "text",
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  placeholder: string;
  type?: string;
}) {
  return (
    <div>
      <label className="block mb-2 text-sm">{label}</label>
      <input
        value={value}
        onChange={(e) => onChange(e.target.value)}
        type={type}
        required
        placeholder={placeholder}
        className="w-full rounded-full border border-white/20 bg-transparent px-5 py-3 focus:outline-none focus:border-blue-400"
      />
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
