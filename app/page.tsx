import { auth } from "@/auth";
import { BookingWizard } from "@/components/forms/booking-wizard";
import { HeroSection } from "@/components/sections/hero-section";
import { ServicesPreview } from "@/components/sections/services-preview";
import { TestimonialsSection } from "@/components/sections/testimonials-section";
import { TrustBar } from "@/components/sections/trust-bar";
import { WhyUsSection } from "@/components/sections/why-us-section";

const jsonLd = {
  "@context": "https://schema.org",
  "@type": "LocalBusiness",
  name: "Lubbock Lawn Pros",
  image: "https://lubbocklawnpros.com/opengraph-image",
  telephone: "806-555-LAWN",
  address: {
    "@type": "PostalAddress",
    addressLocality: "Lubbock",
    addressRegion: "TX",
    addressCountry: "US"
  },
  areaServed: ["Lubbock", "Wolfforth", "Ransom Canyon"],
  founders: ["Billy", "Josh"],
  description:
    "Same-day mowing and expert lawn treatments in Lubbock, Texas."
};

export default async function HomePage() {
  const session = await auth();

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      <HeroSection />
      <TrustBar />
      <ServicesPreview />
      <WhyUsSection />
      <section className="py-20">
        <div className="container">
          <BookingWizard
            embedded
            initialServiceId="premium-mow"
            stripePublishableKey={process.env.STRIPE_PUBLISHABLE_KEY ?? ""}
            viewerName={session?.user?.name}
          />
        </div>
      </section>
      <TestimonialsSection />
    </>
  );
}
