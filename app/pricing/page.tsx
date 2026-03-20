import type { Metadata } from "next";
import { PageHero } from "@/components/sections/page-hero";
import { PricingToggle } from "@/components/sections/pricing-toggle";

export const metadata: Metadata = {
  title: "Pricing",
  description:
    "See single-visit pricing, bundle savings, and subscription plans from Lubbock Lawn Pros."
};

export default function PricingPage() {
  return (
    <>
      <PageHero
        eyebrow="Lubbock pricing"
        title="Tier cards, strikethrough savings, and strong subscription upsells"
        description="Single visits stay simple, bundles save money immediately, and subscription plans are framed the way a real local operator would want them sold."
      />
      <section className="py-16">
        <div className="container">
          <PricingToggle />
        </div>
      </section>
    </>
  );
}
