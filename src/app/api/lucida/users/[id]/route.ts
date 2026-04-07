import { NextRequest, NextResponse } from "next/server";
import { connectToDB } from "@/lib/mongodg";
import { User } from "@/models/User";

const VALID_STATUSES = [
  "active",
  "canceled",
  "past_due",
  "unpaid",
  "incomplete",
] as const;

function parseOptionalDate(
  value: unknown
): { ok: true; date: Date | null } | { ok: false; error: string } {
  if (value === null || value === "") {
    return { ok: true, date: null };
  }
  if (typeof value !== "string") {
    return { ok: false, error: "Date fields must be ISO strings or null" };
  }
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) {
    return { ok: false, error: "Invalid date value" };
  }
  return { ok: true, date: d };
}

/**
 * PATCH /api/lucida/users/[id]
 * Partial update for user fields (email, username, subscription.*, usage.examsThisPeriodResetDate).
 */
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await connectToDB();
    const { id } = await params;
    const body = (await request.json()) as Record<string, unknown>;

    const $set: Record<string, unknown> = {};

    if ("email" in body) {
      const email = body.email;
      if (email !== null && email !== undefined && typeof email !== "string") {
        return NextResponse.json(
          { success: false, error: "email must be a string or null" },
          { status: 400 }
        );
      }
      $set.email =
        email === null || email === undefined
          ? null
          : String(email).trim() || null;
    }

    if ("username" in body) {
      const username = body.username;
      if (
        username !== null &&
        username !== undefined &&
        typeof username !== "string"
      ) {
        return NextResponse.json(
          { success: false, error: "username must be a string or null" },
          { status: 400 }
        );
      }
      $set.username =
        username === null || username === undefined
          ? null
          : String(username).trim() || null;
    }

    const sub = body.subscription as Record<string, unknown> | undefined;
    if (sub && typeof sub === "object") {
      if ("status" in sub) {
        const status = sub.status;
        if (
          status !== null &&
          status !== undefined &&
          (typeof status !== "string" ||
            !VALID_STATUSES.includes(status as (typeof VALID_STATUSES)[number]))
        ) {
          return NextResponse.json(
            {
              success: false,
              error: `Invalid subscription.status. Must be one of: ${VALID_STATUSES.join(", ")}`,
            },
            { status: 400 }
          );
        }
        if (status !== undefined && status !== null) {
          $set["subscription.status"] = status;
        }
      }

      if ("cancelAtPeriodEnd" in sub) {
        const v = sub.cancelAtPeriodEnd;
        if (v !== undefined && typeof v !== "boolean") {
          return NextResponse.json(
            {
              success: false,
              error: "subscription.cancelAtPeriodEnd must be a boolean",
            },
            { status: 400 }
          );
        }
        if (v !== undefined) {
          $set["subscription.cancelAtPeriodEnd"] = v;
        }
      }

      if ("stripeCustomerId" in sub) {
        const v = sub.stripeCustomerId;
        if (v !== null && v !== undefined && typeof v !== "string") {
          return NextResponse.json(
            {
              success: false,
              error: "subscription.stripeCustomerId must be a string or null",
            },
            { status: 400 }
          );
        }
        if (v !== undefined) {
          $set["subscription.stripeCustomerId"] =
            v === null ? null : String(v).trim() || null;
        }
      }

      if ("stripeSubscriptionId" in sub) {
        const v = sub.stripeSubscriptionId;
        if (v !== null && v !== undefined && typeof v !== "string") {
          return NextResponse.json(
            {
              success: false,
              error: "subscription.stripeSubscriptionId must be a string or null",
            },
            { status: 400 }
          );
        }
        if (v !== undefined) {
          $set["subscription.stripeSubscriptionId"] =
            v === null ? null : String(v).trim() || null;
        }
      }

      if ("currentPeriodStart" in sub) {
        const parsed = parseOptionalDate(sub.currentPeriodStart);
        if (!parsed.ok) {
          return NextResponse.json(
            { success: false, error: parsed.error },
            { status: 400 }
          );
        }
        if (sub.currentPeriodStart !== undefined) {
          $set["subscription.currentPeriodStart"] = parsed.date;
        }
      }

      if ("currentPeriodEnd" in sub) {
        const parsed = parseOptionalDate(sub.currentPeriodEnd);
        if (!parsed.ok) {
          return NextResponse.json(
            { success: false, error: parsed.error },
            { status: 400 }
          );
        }
        if (sub.currentPeriodEnd !== undefined) {
          $set["subscription.currentPeriodEnd"] = parsed.date;
        }
      }

      if ("trialEnd" in sub) {
        const parsed = parseOptionalDate(sub.trialEnd);
        if (!parsed.ok) {
          return NextResponse.json(
            { success: false, error: parsed.error },
            { status: 400 }
          );
        }
        if (sub.trialEnd !== undefined) {
          $set["subscription.trialEnd"] = parsed.date;
        }
      }
    }

    const usage = body.usage as Record<string, unknown> | undefined;
    if (usage && typeof usage === "object" && "examsThisPeriodResetDate" in usage) {
      const parsed = parseOptionalDate(usage.examsThisPeriodResetDate);
      if (!parsed.ok) {
        return NextResponse.json(
          { success: false, error: parsed.error },
          { status: 400 }
        );
      }
      if (usage.examsThisPeriodResetDate !== undefined) {
        $set["usage.examsThisPeriodResetDate"] = parsed.date;
      }
    }

    if (Object.keys($set).length === 0) {
      return NextResponse.json(
        {
          success: false,
          error:
            "No valid fields to update. Send email, username, subscription, or usage.",
        },
        { status: 400 }
      );
    }

    $set.updatedAt = new Date();

    const updatedUser = await User.findOneAndUpdate(
      { id },
      { $set },
      { new: true, select: "-__v" }
    );

    if (!updatedUser) {
      return NextResponse.json(
        { success: false, error: "User not found" },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      data: {
        user: updatedUser,
        message: "User updated successfully",
      },
    });
  } catch (error) {
    console.error("Error updating user:", error);
    return NextResponse.json(
      {
        success: false,
        error: "Failed to update user",
        message: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}
