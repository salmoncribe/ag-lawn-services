import type { Metadata } from "next";
import Link from "next/link";
import { CheckCircle2, Clock3, MapPinned, ShieldCheck } from "lucide-react";
import { redirect } from "next/navigation";
import { SuccessCelebration } from "@/components/dashboard/success-celebration";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { finalizeBookingFromCheckout } from "@/lib/booking-service";
import { formatCurrency } from "@/lib/utils";

export const metadata: Metadata = {
  title: "Booking Confirmed",
  description:
    "Your Lubbock Lawn Pros booking is confirmed and your payment was received."
};

type BookingSuccessPageProps = {
  searchParams: Promise<{
    session_id?: string;
    bookingId?: string;
  }>;
};

export default async function BookingSuccessPage({
  searchParams
}: BookingSuccessPageProps) {
  const params = await searchParams;

  if (!params.session_id) {
    redirect("/book");
  }

  const { checkoutSession } = await finalizeBookingFromCheckout(
    params.session_id,
    params.bookingId
  );

  const isPaid = checkoutSession.payment_status === "paid";
  const metadata = checkoutSession.metadata ?? {};
  const serviceName = metadata.serviceName ?? "Lawn service";
  const serviceDate = metadata.serviceDate ?? "Scheduled date";
  const timeSlot = metadata.timeSlot ?? "Selected time";
  const address = metadata.address ?? "Lubbock, TX";
  const addons = metadata.addons || "No add-ons";
  const totalPrice = Number(metadata.totalPrice ?? 0);

  return (
    <section className="py-16">
      <div className="container space-y-8">
        <SuccessCelebration />

        <div className="grid gap-6 xl:grid-cols-[1.1fr_0.9fr]">
          <Card className="overflow-hidden">
            <CardHeader className="space-y-4 border-b border-[#eadfce]">
              <div className="flex items-center gap-3 text-primary">
                <CheckCircle2 className="h-7 w-7" />
                <p className="font-semibold uppercase tracking-[0.2em]">
                  {isPaid ? "Payment received" : "Checkout received"}
                </p>
              </div>
              <CardTitle className="text-[2.6rem]">
                {serviceName} booked successfully
              </CardTitle>
            </CardHeader>
            <CardContent className="grid gap-4 p-6 md:grid-cols-2">
              <div className="rounded-[28px] border border-border bg-white/70 p-5">
                <p className="text-xs uppercase tracking-[0.2em] text-muted-foreground">
                  Service window
                </p>
                <p className="mt-3 inline-flex items-center gap-2 font-semibold text-primary">
                  <Clock3 className="h-4 w-4" />
                  {serviceDate} at {timeSlot}
                </p>
              </div>
              <div className="rounded-[28px] border border-border bg-white/70 p-5">
                <p className="text-xs uppercase tracking-[0.2em] text-muted-foreground">
                  Service address
                </p>
                <p className="mt-3 inline-flex items-start gap-2 font-semibold text-primary">
                  <MapPinned className="mt-0.5 h-4 w-4 shrink-0" />
                  {address}
                </p>
              </div>
              <div className="rounded-[28px] border border-border bg-white/70 p-5">
                <p className="text-xs uppercase tracking-[0.2em] text-muted-foreground">
                  Add-ons
                </p>
                <p className="mt-3 font-semibold text-foreground">{addons}</p>
              </div>
              <div className="rounded-[28px] border border-primary/20 bg-[#ecf8ef] p-5">
                <p className="text-xs uppercase tracking-[0.2em] text-muted-foreground">
                  Total paid
                </p>
                <p className="mt-3 font-display text-5xl uppercase tracking-[0.08em] text-primary">
                  {formatCurrency(totalPrice)}
                </p>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-[#143720] text-white">
            <CardContent className="space-y-6 p-6">
              <div className="inline-flex items-center gap-2 text-[#d5ff9d]">
                <ShieldCheck className="h-5 w-5" />
                <span className="font-semibold uppercase tracking-[0.18em]">
                  No account required
                </span>
              </div>
              <div className="space-y-3">
                <h2 className="font-display text-5xl uppercase tracking-[0.08em] text-[#ecffcf]">
                  You&apos;re good to go
                </h2>
                <p className="leading-8 text-white/75">
                  Billy and Josh now have the booking details and the payment has
                  been captured through Stripe. You can head back to the site or
                  book another service any time.
                </p>
              </div>
              <div className="flex flex-col gap-3">
                <Button asChild variant="secondary">
                  <Link href="/">Back to Home</Link>
                </Button>
                <Button
                  asChild
                  variant="outline"
                  className="border-white/20 bg-transparent text-white hover:bg-white/10"
                >
                  <Link href="/services">View Services</Link>
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </section>
  );
}
