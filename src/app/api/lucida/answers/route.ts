import { NextRequest, NextResponse } from "next/server";
import { connectToDB } from "@/lib/mongodg";
import { Result } from "@/models/Result";

export async function GET(request: NextRequest) {
  try {
    // Connect to MongoDB
    await connectToDB();

    // Get all results from the database
    const results = await Result.find({}).sort({ createdAt: -1 });

    // Calculate results created in the last 7 days
    const oneWeekAgo = new Date();
    oneWeekAgo.setDate(oneWeekAgo.getDate() - 7);

    const weeklyResults = await Result.countDocuments({
      createdAt: { $gte: oneWeekAgo },
    });

    return NextResponse.json({
      success: true,
      data: results,
      count: results.length,
      weeklyCount: weeklyResults,
      summary: {
        totalResults: results.length,
      },
    });
  } catch (error) {
    console.error("Error fetching results:", error);

    return NextResponse.json(
      {
        success: false,
        error: "Failed to fetch results",
        message: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}
