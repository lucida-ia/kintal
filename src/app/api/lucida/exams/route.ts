import { NextRequest, NextResponse } from "next/server";
import { connectToDB } from "@/lib/mongodg";
import { Exam } from "@/models/Exam";

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

    // Get filtered exams from the database
    const exams = await Exam.find(filter)
      .select("-__v")
      .sort({ createdAt: -1 });

    // Calculate exams created in the last 7 days
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

    const weeklyExams = await Exam.countDocuments(weeklyFilter);

    return NextResponse.json({
      success: true,
      data: exams,
      count: exams.length,
      weeklyCount: weeklyExams,
    });
  } catch (error) {
    console.error("Error fetching exams:", error);

    return NextResponse.json(
      {
        success: false,
        error: "Failed to fetch exams",
        message: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}
