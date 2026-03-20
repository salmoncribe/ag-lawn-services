import { addDays } from "date-fns";
import { prisma } from "@/lib/prisma";
import {
  getNextBillingOffsetDays,
  getServiceById,
  isSubscriptionService
} from "@/lib/pricing";
import { getStripeServer } from "@/lib/stripe";
import { type ServiceId } from "@/lib/site-data";

export async function finalizeBookingFromCheckout(
  sessionId: string,
  bookingId?: string
) {
  const stripe = getStripeServer();
  const checkoutSession = await stripe.checkout.sessions.retrieve(sessionId);

  let booking = null;

  if (bookingId) {
    try {
      booking = await prisma.booking.findUnique({
        where: { id: bookingId }
      });

      if (
        booking &&
        checkoutSession.payment_status === "paid" &&
        booking.status !== "CONFIRMED" &&
        booking.status !== "COMPLETED"
      ) {
        booking = await prisma.booking.update({
          where: { id: booking.id },
          data: {
            status: "CONFIRMED",
            stripeSessionId: checkoutSession.id
          }
        });

        if (
          booking.userId &&
          isSubscriptionService(booking.serviceType as ServiceId)
        ) {
          const service = getServiceById(booking.serviceType as ServiceId);

          if (service) {
            await prisma.subscription.upsert({
              where: {
                userId_planName: {
                  userId: booking.userId,
                  planName: service.name
                }
              },
              update: {
                price: service.price,
                active: true,
                nextBillingDate: addDays(
                  new Date(),
                  getNextBillingOffsetDays(booking.serviceType as ServiceId)
                )
              },
              create: {
                userId: booking.userId,
                planName: service.name,
                price: service.price,
                active: true,
                nextBillingDate: addDays(
                  new Date(),
                  getNextBillingOffsetDays(booking.serviceType as ServiceId)
                )
              }
            });
          }
        }
      }
    } catch (error) {
      console.error("Booking finalization skipped:", error);
    }
  }

  return {
    checkoutSession,
    booking
  };
}
