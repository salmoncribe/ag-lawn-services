import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { ShieldCheck, Sprout } from "lucide-react";
import { auth } from "@/auth";
import { LoginForm } from "@/components/forms/login-form";

export const metadata: Metadata = {
  title: "Login",
  description:
    "Secure login for the protected Lubbock Lawn Pros account portal."
};

type LoginPageProps = {
  searchParams: Promise<{
    callbackUrl?: string;
  }>;
};

export default async function LoginPage({ searchParams }: LoginPageProps) {
  const session = await auth();
  const params = await searchParams;

  if (session?.user) {
    redirect("/dashboard");
  }

  return (
    <section className="py-16">
      <div className="container grid gap-10 lg:grid-cols-[0.85fr_1.15fr]">
        <div className="space-y-6 rounded-[36px] bg-[#143720] p-8 text-white shadow-meadow md:p-10">
          <div className="inline-flex h-14 w-14 items-center justify-center rounded-2xl bg-white/10">
            <Sprout className="h-7 w-7 text-[#d5ff9d]" />
          </div>
          <div className="space-y-4">
            <h1 className="font-display text-6xl uppercase tracking-[0.08em]">
              Secure account access for Lubbock Lawn Pros
            </h1>
            <p className="max-w-xl text-lg leading-8 text-white/72">
              Access scheduling, billing, and service activity from one protected
              portal built for fast local operations.
            </p>
          </div>
          <div className="grid gap-4 rounded-[28px] border border-white/12 bg-white/10 p-6">
            <div className="flex items-center gap-3">
              <ShieldCheck className="h-5 w-5 text-[#d5ff9d]" />
              <p className="font-semibold">Protected portal</p>
            </div>
            <p className="text-white/70">
              Sessions are secured through NextAuth and isolated from the public
              marketing site.
            </p>
          </div>
        </div>
        <LoginForm callbackUrl={params.callbackUrl ?? "/dashboard"} />
      </div>
    </section>
  );
}
