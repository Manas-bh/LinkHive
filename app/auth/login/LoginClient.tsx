"use client";

import { FormEvent, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import Image, { StaticImageData } from "next/image";
import { useRouter } from "next/navigation";
import { getProviders, signIn } from "next-auth/react";
import Logo from "@/components/Logo";
import googleLogo from "@/public/icons8-google.svg";
import githubLogo from "@/public/icons8-github.svg";

type ProviderInfo = { id: string; name: string };

export default function LoginClient({ callbackUrl }: { callbackUrl: string }) {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [providers, setProviders] = useState<ProviderInfo[]>([]);

  useEffect(() => {
    const loadProviders = async () => {
      const available = await getProviders();
      if (!available) return;
      setProviders(
        Object.values(available)
          .filter((provider) => provider.id !== "credentials")
          .map((provider) => ({ id: provider.id, name: provider.name }))
      );
    };

    loadProviders();
  }, []);

  const oauthProviders = useMemo(
    () =>
      providers.map((provider) => ({
        ...provider,
        icon: provider.id === "google" ? googleLogo : githubLogo,
      })),
    [providers]
  );

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
    <div className="min-h-screen bg-[#05080d] text-white p-4 md:p-8">
      <div className="mx-auto max-w-[1550px] min-h-[92vh] border border-[#3f3f45] p-6 md:p-8 flex flex-col lg:flex-row gap-8">
        <div className="hidden lg:flex flex-1 border border-white/20 bg-[radial-gradient(circle_at_45%_38%,rgba(107,188,255,.35),rgba(8,11,19,0)_35%),linear-gradient(180deg,#0d121b_0%,#070b12_100%)] relative overflow-hidden">
          <div className="absolute inset-0 opacity-15 bg-[url('/dashboard.svg')] bg-cover bg-center" />
          <div className="relative z-10 flex items-center justify-center w-full p-8">
            <div className="grid grid-cols-2 gap-5 max-w-3xl">
              <InfoCard title="Analytics Dashboard" text="Track clicks, locations, and devices with an intuitive analytics view." />
              <InfoCard title="Quick & Advanced" text="Switch between fast link creation and advanced controls for deeper customization." offset />
            </div>
          </div>
        </div>

        <div className="w-full lg:w-[430px] flex items-center">
          <form onSubmit={handleSubmit} className="w-full space-y-5">
            <Logo />
            <div>
              <h1 className="text-[44px] font-semibold leading-tight">Welcome Back</h1>
              <p className="text-gray-400 mt-1.5">Join LinkHive – Shorten Smarter, Share Faster, Track Better</p>
            </div>

            <Field label="Email" value={email} onChange={setEmail} placeholder="Enter your E-mail" type="email" />
            <Field label="Password" value={password} onChange={setPassword} placeholder="Enter password" type="password" />

            {error && <p className="text-red-400 text-sm">{error}</p>}

            <button
              type="submit"
              disabled={loading}
              className="w-full rounded-full bg-white text-black font-semibold py-3.5 hover:bg-gray-200 disabled:opacity-70"
            >
              {loading ? "Logging in..." : "Log In"}
            </button>

            <div>
              <div className="flex items-center gap-3 text-gray-400 text-xs">
                <div className="h-px bg-white/15 flex-1" />
                <span>or continue with</span>
                <div className="h-px bg-white/15 flex-1" />
              </div>

              <div className="mt-4 flex justify-center gap-3">
                {oauthProviders.length > 0 ? (
                  oauthProviders.map((provider) => (
                    <OAuthCircle
                      key={provider.id}
                      icon={provider.icon}
                      label={provider.name}
                      onClick={() => signIn(provider.id, { callbackUrl: "/dashboard" })}
                    />
                  ))
                ) : (
                  <p className="text-xs text-gray-500">OAuth providers are not configured.</p>
                )}
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

function Field({ label, value, onChange, placeholder, type = "text" }: { label: string; value: string; onChange: (value: string) => void; placeholder: string; type?: string }) {
  return (
    <div>
      <label className="block mb-2 text-[23px] font-medium">{label}</label>
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

function InfoCard({ title, text, offset = false }: { title: string; text: string; offset?: boolean }) {
  return (
    <div className={`rounded-2xl border border-white/20 bg-black/35 backdrop-blur px-5 py-6 ${offset ? "mt-12" : ""}`}>
      <h3 className="text-xl font-semibold">{title}</h3>
      <p className="text-sm text-gray-300 mt-2 leading-relaxed">{text}</p>
    </div>
  );
}

function OAuthCircle({ icon, label, onClick }: { icon: StaticImageData; label: string; onClick?: () => void }) {
  return (
    <button type="button" onClick={onClick} title={label} className="h-12 w-12 rounded-full bg-white grid place-items-center hover:bg-gray-200">
      <Image src={icon} alt={label} width={22} height={22} />
    </button>
  );
}
