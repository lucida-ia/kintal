import { NextRequest, NextResponse } from "next/server";
import { connectToDB } from "@/lib/mongodg";
import { Result } from "@/models/Result";

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

    // Get filtered results from the database
    const results = await Result.find(filter).sort({ createdAt: -1 });

    // Calculate results created in the last 7 days
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

    const weeklyResults = await Result.countDocuments(weeklyFilter);

    return NextResponse.json({
      success: true,
      data: results,
      count: results.length,
      weeklyCount: weeklyResults,
      summary: {
        totalAnswers: results.length,
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

export async function DELETE(request: NextRequest) {
  try {
    // Connect to MongoDB
    await connectToDB();

    // Extract result ID from query parameters
    const { searchParams } = new URL(request.url);
    const resultId = searchParams.get("id");

    if (!resultId) {
      return NextResponse.json(
        {
          success: false,
          error: "Result ID is required",
        },
        { status: 400 }
      );
    }

    // Find and delete the result
    const deletedResult = await Result.findByIdAndDelete(resultId);

    if (!deletedResult) {
      return NextResponse.json(
        {
          success: false,
          error: "Result not found",
        },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      message: "Result deleted successfully",
      data: deletedResult,
    });
  } catch (error) {
    console.error("Error deleting result:", error);

    return NextResponse.json(
      {
        success: false,
        error: "Failed to delete result",
        message: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}
