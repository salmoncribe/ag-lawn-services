import type { Metadata } from "next";
import Link from "next/link";
import { format, isAfter } from "date-fns";
import {
  CalendarDays,
  Clock3,
  CreditCard,
  History,
  MapPinned,
  Repeat2
} from "lucide-react";
import { redirect } from "next/navigation";
import { auth } from "@/auth";
import { LogoutButton } from "@/components/layout/logout-button";
import { SuccessCelebration } from "@/components/dashboard/success-celebration";
import { UpcomingCalendar } from "@/components/dashboard/upcoming-calendar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { toggleSubscriptionAction, confirmCheckoutSuccess } from "@/lib/actions";
import { getServiceById } from "@/lib/pricing";
import { prisma } from "@/lib/prisma";
import { type ServiceId } from "@/lib/site-data";
import { getReceiptUrl } from "@/lib/stripe";
import { formatCurrency } from "@/lib/utils";

export const metadata: Metadata = {
  title: "Dashboard",
  description:
    "Protected Lubbock Lawn Pros dashboard with upcoming bookings, subscriptions, saved locations, and payment history."
};

type DashboardPageProps = {
  searchParams: Promise<{
    success?: string;
    bookingId?: string;
    session_id?: string;
  }>;
};

export default async function DashboardPage({ searchParams }: DashboardPageProps) {
  const session = await auth();

  if (!session?.user) {
    redirect("/login?callbackUrl=/dashboard");
  }

  const params = await searchParams;

  if (params.success === "true" && params.bookingId && params.session_id) {
    await confirmCheckoutSuccess(
      params.bookingId,
      params.session_id,
      session.user.id
    );
  }

  const [bookings, subscriptions] = await Promise.all([
    prisma.booking.findMany({
      where: {
        userId: session.user.id
      },
      orderBy: {
        date: "asc"
      }
    }),
    prisma.subscription.findMany({
      where: {
        userId: session.user.id
      },
      orderBy: {
        nextBillingDate: "asc"
      }
    })
  ]);

  const now = new Date();
  const upcomingBookings = bookings.filter(
    (booking) =>
      (isAfter(booking.date, now) || booking.status === "CONFIRMED") &&
      booking.status !== "COMPLETED" &&
      booking.status !== "CANCELLED"
  );
  const pastBookings = bookings.filter(
    (booking) =>
      !isAfter(booking.date, now) || booking.status === "COMPLETED"
  );
  const savedLocations = Array.from(new Set(bookings.map((booking) => booking.address)));
  const paymentHistory = await Promise.all(
    bookings
      .filter((booking) => booking.stripeSessionId)
      .map(async (booking) => ({
        booking,
        receiptUrl: booking.stripeSessionId
          ? await getReceiptUrl(booking.stripeSessionId)
          : null
      }))
  );

  return (
    <section className="py-16">
      <div className="container space-y-8">
        {params.success === "true" ? <SuccessCelebration /> : null}

        <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
          <div className="space-y-3">
            <Badge>Protected customer dashboard</Badge>
            <h1 className="font-display text-6xl uppercase tracking-[0.08em] text-primary">
              Welcome back, {session.user.name}!
            </h1>
            <p className="text-lg text-muted-foreground">
              Upcoming services, history, active subscriptions, saved locations,
              and receipt links all in one place.
            </p>
          </div>
          <LogoutButton />
        </div>

        <div className="grid gap-6 md:grid-cols-3">
          <Card>
            <CardContent className="flex items-center gap-4 p-6">
              <CalendarDays className="h-10 w-10 text-primary" />
              <div>
                <p className="text-sm text-muted-foreground">Upcoming services</p>
                <p className="font-display text-5xl uppercase tracking-[0.08em] text-primary">
                  {upcomingBookings.length}
                </p>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="flex items-center gap-4 p-6">
              <Repeat2 className="h-10 w-10 text-primary" />
              <div>
                <p className="text-sm text-muted-foreground">Active subscriptions</p>
                <p className="font-display text-5xl uppercase tracking-[0.08em] text-primary">
                  {subscriptions.filter((subscription) => subscription.active).length}
                </p>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="flex items-center gap-4 p-6">
              <CreditCard className="h-10 w-10 text-primary" />
              <div>
                <p className="text-sm text-muted-foreground">Payment records</p>
                <p className="font-display text-5xl uppercase tracking-[0.08em] text-primary">
                  {paymentHistory.length}
                </p>
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="grid gap-6 xl:grid-cols-[0.92fr_1.08fr]">
          <Card>
            <CardHeader>
              <CardTitle>Upcoming services calendar</CardTitle>
            </CardHeader>
            <CardContent>
              <UpcomingCalendar dates={upcomingBookings.map((booking) => booking.date.toISOString())} />
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Upcoming service list</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {upcomingBookings.length ? (
                upcomingBookings.map((booking) => {
                  const service = getServiceById(booking.serviceType as ServiceId);
                  return (
                    <div
                      key={booking.id}
                      className="grid gap-3 rounded-[24px] border border-border bg-white/70 p-4 md:grid-cols-[1fr_auto]"
                    >
                      <div className="space-y-2">
                        <p className="font-semibold text-primary">
                          {service?.name ?? booking.serviceType}
                        </p>
                        <div className="flex flex-col gap-2 text-sm text-muted-foreground md:flex-row md:gap-4">
                          <span className="inline-flex items-center gap-2">
                            <Clock3 className="h-4 w-4 text-primary" />
                            {format(booking.date, "EEE, MMM d • h:mm a")}
                          </span>
                          <span className="inline-flex items-center gap-2">
                            <MapPinned className="h-4 w-4 text-primary" />
                            {booking.address}
                          </span>
                        </div>
                      </div>
                      <div className="flex items-start justify-between gap-3 md:flex-col md:items-end">
                        <Badge>{booking.status}</Badge>
                        <span className="font-semibold text-primary">
                          {formatCurrency(booking.totalPrice)}
                        </span>
                      </div>
                    </div>
                  );
                })
              ) : (
                <p className="text-muted-foreground">
                  No upcoming services yet. Book one from the public site.
                </p>
              )}
            </CardContent>
          </Card>
        </div>

        <div className="grid gap-6 xl:grid-cols-2">
          <Card>
            <CardHeader>
              <CardTitle>Past service history</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {pastBookings.length ? (
                pastBookings
                  .slice()
                  .reverse()
                  .map((booking) => {
                    const service = getServiceById(booking.serviceType as ServiceId);
                    return (
                      <div
                        key={booking.id}
                        className="rounded-[24px] border border-border bg-white/75 p-4"
                      >
                        <div className="flex items-start justify-between gap-4">
                          <div>
                            <p className="font-semibold text-primary">
                              {service?.name ?? booking.serviceType}
                            </p>
                            <p className="mt-1 text-sm text-muted-foreground">
                              {format(booking.date, "MMMM d, yyyy • h:mm a")}
                            </p>
                          </div>
                          <Badge variant="secondary">{booking.status}</Badge>
                        </div>
                        <p className="mt-3 text-sm leading-7 text-muted-foreground">
                          {booking.notes ?? booking.address}
                        </p>
                      </div>
                    );
                  })
              ) : (
                <p className="text-muted-foreground">No past visits yet.</p>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Active subscriptions</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {subscriptions.length ? (
                subscriptions.map((subscription) => (
                  <div
                    key={subscription.id}
                    className="rounded-[24px] border border-border bg-white/75 p-4"
                  >
                    <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
                      <div>
                        <p className="font-semibold text-primary">
                          {subscription.planName}
                        </p>
                        <p className="mt-1 text-sm text-muted-foreground">
                          Next billing {format(subscription.nextBillingDate, "MMMM d, yyyy")}
                        </p>
                        <p className="mt-2 text-sm font-semibold text-foreground">
                          {formatCurrency(subscription.price)}
                        </p>
                      </div>
                      <form action={toggleSubscriptionAction.bind(null, subscription.id)}>
                        <Button variant={subscription.active ? "outline" : "default"}>
                          {subscription.active ? "Pause plan" : "Resume plan"}
                        </Button>
                      </form>
                    </div>
                  </div>
                ))
              ) : (
                <p className="text-muted-foreground">No subscription plans active.</p>
              )}
            </CardContent>
          </Card>
        </div>

        <div className="grid gap-6 xl:grid-cols-2">
          <Card>
            <CardHeader>
              <CardTitle>Saved locations</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {savedLocations.map((location) => (
                <div
                  key={location}
                  className="rounded-[24px] border border-border bg-white/70 p-4"
                >
                  <div className="flex items-center gap-3">
                    <MapPinned className="h-5 w-5 text-primary" />
                    <p className="font-medium">{location}</p>
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Payment history</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {paymentHistory.length ? (
                paymentHistory
                  .slice()
                  .reverse()
                  .map(({ booking, receiptUrl }) => {
                    const service = getServiceById(booking.serviceType as ServiceId);
                    return (
                      <div
                        key={booking.id}
                        className="flex flex-col gap-3 rounded-[24px] border border-border bg-white/75 p-4 md:flex-row md:items-center md:justify-between"
                      >
                        <div>
                          <p className="font-semibold text-primary">
                            {service?.name ?? booking.serviceType}
                          </p>
                          <p className="mt-1 text-sm text-muted-foreground">
                            {format(booking.date, "MMMM d, yyyy")}
                          </p>
                        </div>
                        <div className="flex items-center gap-3">
                          <span className="font-semibold text-primary">
                            {formatCurrency(booking.totalPrice)}
                          </span>
                          {receiptUrl ? (
                            <Button asChild variant="outline">
                              <Link href={receiptUrl} target="_blank">
                                Stripe receipt
                              </Link>
                            </Button>
                          ) : (
                            <div className="inline-flex items-center gap-2 rounded-full bg-secondary px-4 py-2 text-sm text-secondary-foreground">
                              <History className="h-4 w-4" />
                              Receipt appears after live Stripe payment
                            </div>
                          )}
                        </div>
                      </div>
                    );
                  })
              ) : (
                <p className="text-muted-foreground">No payment history yet.</p>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </section>
  );
}
