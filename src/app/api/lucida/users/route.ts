import { NextRequest, NextResponse } from "next/server";
import { connectToDB } from "@/lib/mongodg";
import { User } from "@/models/User";

export async function GET(request: NextRequest) {
  try {
    // Connect to MongoDB
    await connectToDB();

    // Extract query parameters
    const { searchParams } = new URL(request.url);
    const fromDate = searchParams.get("from");
    const toDate = searchParams.get("to");

    // Build filter object
    const filter: Record<string, unknown> = {};
    if (fromDate || toDate) {
      filter.createdAt = {};
      if (fromDate) {
        (filter.createdAt as Record<string, Date>).$gte = new Date(fromDate);
      }
      if (toDate) {
        (filter.createdAt as Record<string, Date>).$lte = new Date(toDate);
      }
    }

    // Get filtered users from the database
    const users = await User.find(filter)
      .select("-__v")
      .sort({ createdAt: -1 });

    // Calculate users created in the last 7 days
    const oneWeekAgo = new Date();
    oneWeekAgo.setDate(oneWeekAgo.getDate() - 7);

    // If we have date filters, calculate weekly based on the filtered period
    // Otherwise, use the standard 7-day window
    let weeklyFilter: Record<string, unknown> = {};
    if (fromDate || toDate) {
      // For filtered data, show the count within the filtered period
      weeklyFilter = { ...filter };
    } else {
      // For unfiltered data, show last 7 days
      weeklyFilter = { createdAt: { $gte: oneWeekAgo } };
    }

    const weeklyUsers = await User.countDocuments(weeklyFilter);

    return NextResponse.json({
      success: true,
      data: users,
      count: users.length,
      weeklyCount: weeklyUsers,
    });
  } catch (error) {
    console.error("Error fetching users:", error);

    return NextResponse.json(
      {
        success: false,
        error: "Failed to fetch users",
        message: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}
