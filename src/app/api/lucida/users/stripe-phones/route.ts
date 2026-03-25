import { NextRequest, NextResponse } from "next/server";
import { getStripeCustomerPhone } from "@/lib/stripe";

const BATCH_SIZE = 20;

type StripePhoneUserInput = {
  id: string;
  stripeCustomerId?: string | null;
  email?: string | null;
};

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const users: StripePhoneUserInput[] = body?.users ?? [];

    if (!Array.isArray(users) || users.length === 0) {
      return NextResponse.json({ success: true, data: {} });
    }

    const phoneMap: Record<string, string> = {};

    for (let i = 0; i < users.length; i += BATCH_SIZE) {
      const batch = users.slice(i, i + BATCH_SIZE);
      await Promise.all(
        batch.map(async (u) => {
          const userId = u?.id;
          if (!userId) return;
          try {
            const phone = await getStripeCustomerPhone({
              customerId: u.stripeCustomerId,
              email: u.email,
            });
            phoneMap[userId] = phone;
          } catch (error) {
            console.error(
              `[stripe-phones] Failed for user ${userId}:`,
              error
            );
            phoneMap[userId] = "";
          }
        })
      );
    }

    return NextResponse.json({ success: true, data: phoneMap });
  } catch (error) {
    console.error("Error fetching Stripe phone numbers:", error);
    return NextResponse.json(
      {
        success: false,
        error: "Failed to fetch Stripe phone numbers",
        message: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}
