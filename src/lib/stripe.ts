import Stripe from "stripe";

let stripeClient: Stripe | null = null;

function getStripe(): Stripe | null {
  const key = process.env.STRIPE_SECRET_KEY;
  if (!key) return null;
  if (!stripeClient) {
    stripeClient = new Stripe(key);
  }
  return stripeClient;
}

function isDeletedCustomer(
  customer: Stripe.Customer | Stripe.DeletedCustomer
): customer is Stripe.DeletedCustomer {
  return "deleted" in customer && customer.deleted === true;
}

/**
 * Reads phone from an active Stripe Customer (not deleted).
 * Prefers `phone`, then `shipping.phone`.
 */
function extractPhoneFromCustomer(
  customer: Stripe.Customer | Stripe.DeletedCustomer
): string {
  if (isDeletedCustomer(customer)) return "";
  const direct = customer.phone?.trim();
  if (direct) return direct;
  const shipping = customer.shipping?.phone?.trim();
  return shipping ?? "";
}

export type GetStripeCustomerPhoneInput = {
  customerId?: string | null;
  email?: string | null;
};

/**
 * Resolves a phone number from Stripe for CSV export.
 * - If `customerId` is set, tries `customers.retrieve` first, then `phone` / `shipping.phone`.
 * - If still empty and `email` is set, tries `customers.list({ email, limit: 1 })`.
 * - If no `customerId` but `email` is set, uses list lookup only.
 * Never throws; returns "" on missing config, errors, or deleted customers.
 */
export async function getStripeCustomerPhone({
  customerId,
  email,
}: GetStripeCustomerPhoneInput): Promise<string> {
  const stripe = getStripe();
  if (!stripe) return "";

  const trimmedEmail = typeof email === "string" ? email.trim() : "";
  const trimmedId =
    typeof customerId === "string" ? customerId.trim() : "";

  try {
    if (trimmedId) {
      const retrieved = await stripe.customers.retrieve(trimmedId);
      const phone = extractPhoneFromCustomer(retrieved);
      if (phone) return phone;
    }

    if (trimmedEmail) {
      const list = await stripe.customers.list({
        email: trimmedEmail,
        limit: 1,
      });
      const first = list.data[0];
      if (!first) return "";
      return extractPhoneFromCustomer(first);
    }

    return "";
  } catch (error) {
    console.error("[getStripeCustomerPhone] Stripe error:", error);
    return "";
  }
}
