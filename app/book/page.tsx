import type { Metadata } from "next";
import { BookingWizard } from "@/components/forms/booking-wizard";
import { PageHero } from "@/components/sections/page-hero";
import { serviceCatalog, type ServiceId } from "@/lib/site-data";

export const metadata: Metadata = {
  title: "Book Now",
  description:
    "Book same-day mowing or lawn treatments with Lubbock Lawn Pros in under 60 seconds."
};

type BookPageProps = {
  searchParams: Promise<{
    service?: string;
  }>;
};

export default async function BookPage({ searchParams }: BookPageProps) {
  const params = await searchParams;
  const requestedService = params.service;
  const initialServiceId = serviceCatalog.some(
    (service) => service.id === requestedService
  )
    ? (requestedService as ServiceId)
    : "premium-mow";

  return (
    <>
      <PageHero
        eyebrow="Book now"
        title="Choose the service, lock the slot, and send them to Stripe"
        description="The flow is built for speed: service selection, calendar, address, review, secure checkout, then an instant booking confirmation."
      />
      <section className="py-16">
        <div className="container">
          <BookingWizard
            initialServiceId={initialServiceId}
            stripePublishableKey={process.env.STRIPE_PUBLISHABLE_KEY ?? ""}
          />
        </div>
      </section>
    </>
  );
}
