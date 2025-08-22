import { NextRequest, NextResponse } from "next/server";
import { connectToDB } from "@/lib/mongodg";
import { User } from "@/models/User";

export async function GET(request: NextRequest) {
  try {
    // Connect to MongoDB
    await connectToDB();

    // Extract query parameters
    const { searchParams } = new URL(request.url);
    const pageParam = searchParams.get("page");
    const limitParam = searchParams.get("limit");
    const page = parseInt(pageParam || "1");
    const limitIsAll = (limitParam || "").toLowerCase() === "all";
    const parsedLimit = parseInt(limitParam || "10");
    const limit = limitIsAll
      ? 0
      : isNaN(parsedLimit) || parsedLimit <= 0
      ? 10
      : parsedLimit;
    const fromDate = searchParams.get("from");
    const toDate = searchParams.get("to");
    const idFilter = searchParams.get("id");
    const institutionsOnlyParam = searchParams.get("institutionsOnly");
    const subscriptionType = searchParams.get("subscriptionType");

    // Calculate pagination
    const skip = limitIsAll ? 0 : (page - 1) * limit;

    // Build filter object
    const filter: Record<string, unknown> = {};

    // Date filter
    if (fromDate || toDate) {
      filter.createdAt = {};
      if (fromDate) {
        (filter.createdAt as Record<string, Date>).$gte = new Date(fromDate);
      }
      if (toDate) {
        (filter.createdAt as Record<string, Date>).$lte = new Date(toDate);
      }
    }

    // ID/Email/Username filter (case-insensitive partial match across common identifiers)
    if (idFilter) {
      const regex = { $regex: idFilter, $options: "i" } as const;
      Object.assign(filter, {
        $or: [{ id: regex }, { email: regex }, { username: regex }],
      });
    }

    // Subscription type filter
    if (subscriptionType && subscriptionType.trim()) {
      filter["subscription.plan"] = subscriptionType.trim();
    }

    // Exclude common free email providers to approximate "institutional" emails
    const institutionsOnly =
      institutionsOnlyParam === "true" || institutionsOnlyParam === "1";
    if (institutionsOnly) {
      // Keep the list focused on the most common providers
      const commonDomains = [
        "gmail.com",
        "hotmail.com",
        "outlook.com",
        "live.com",
        "yahoo.com",
        "icloud.com",
        "aol.com",
        "msn.com",
        "uol.com",
        "uol.com.br",
        "bol.com.br",
        "terra.com.br",
      ];

      const escaped = commonDomains.map((d) => d.replace(/\./g, "\\."));
      const domainPattern = `@(?:${escaped.join("|")})$`;

      Object.assign(filter, {
        email: { $ne: null, $not: { $regex: domainPattern, $options: "i" } },
      });
    }

    // Get total count for pagination
    const totalUsers = await User.countDocuments(filter);

    // Get paginated users from the database
    const users = await User.find(filter)
      .select("-__v")
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit);

    // Transform users to include display fields with robust fallbacks
    const transformedUsers = users.map((user) => {
      const raw = user.toObject();
      const resolvedEmail = raw.email ?? raw.id;
      const resolvedDisplayName =
        raw.username ??
        (typeof resolvedEmail === "string" && resolvedEmail.includes("@")
          ? resolvedEmail.split("@")[0]
          : raw.id);

      return {
        ...raw,
        email: resolvedEmail,
        displayName: resolvedDisplayName,
        clerk_id: raw.id,
      };
    });

    // Calculate pagination metadata
    const totalPages = limitIsAll
      ? 1
      : Math.max(1, Math.ceil(totalUsers / Math.max(1, limit)));
    const hasNextPage = limitIsAll ? false : page < totalPages;
    const hasPrevPage = limitIsAll ? false : page > 1;

    return NextResponse.json({
      success: true,
      data: transformedUsers,
      pagination: {
        currentPage: page,
        totalPages,
        totalUsers,
        limit,
        hasNextPage,
        hasPrevPage,
      },
    });
  } catch (error) {
    console.error("Error fetching user list:", error);

    return NextResponse.json(
      {
        success: false,
        error: "Failed to fetch user list",
        message: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}
