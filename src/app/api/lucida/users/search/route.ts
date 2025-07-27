import { NextRequest, NextResponse } from "next/server";
import { connectToDB } from "@/lib/mongodg";
import { User } from "@/models/User";
import { Exam } from "@/models/Exam";
import { Result } from "@/models/Result";

export async function GET(request: NextRequest) {
  try {
    // Connect to MongoDB
    await connectToDB();

    // Extract search query parameter
    const { searchParams } = new URL(request.url);
    const searchQuery = searchParams.get("q");

    if (!searchQuery) {
      return NextResponse.json(
        {
          success: false,
          error: "Search query parameter 'q' is required",
        },
        { status: 400 }
      );
    }

    // Search for user by partial match on id field (email)
    // Using regex for case-insensitive partial matching
    // Also try exact match first for better performance
    let user = await User.findOne({
      id: { $regex: `^${searchQuery}$`, $options: "i" },
    }).select("-__v");
    
    // If no exact match, try partial match
    if (!user) {
      user = await User.findOne({
        id: { $regex: searchQuery, $options: "i" },
      }).select("-__v");
    }

    if (!user) {
      return NextResponse.json({
        success: true,
        data: null,
        message: "No user found matching the search query",
      });
    }

    // Get all exams for this user
    const exams = await Exam.find({ userId: user.id })
      .select("-__v")
      .sort({ createdAt: -1 });

    // Get all results from exams created by this user
    const examIds = exams.map((exam) => exam._id.toString());
    const results = await Result.find({ examId: { $in: examIds } })
      .select("-__v")
      .sort({ createdAt: -1 });

    // Calculate exams created in the last 30 days
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    const examsLast30Days = exams.filter(
      (exam) => new Date(exam.createdAt) >= thirtyDaysAgo
    ).length;

    // Create user object with corrected examsThisMonth and enhanced display info
    const userWithCorrectUsage = {
      ...user.toObject(),
      usage: {
        ...user.usage,
        examsThisMonth: examsLast30Days,
        examsThisMonthResetDate: user.usage.examsThisMonthResetDate,
      },
      // Add user-friendly display fields
      email: user.id, // Since id is the email
      displayName: user.id.split('@')[0], // Extract username part for display
    };

    return NextResponse.json({
      success: true,
      data: {
        user: userWithCorrectUsage,
        exams: exams,
        results: results,
        counts: {
          exams: exams.length,
          results: results.length,
        },
        // Add search metadata
        searchMetadata: {
          query: searchQuery,
          searchedAt: new Date().toISOString(),
          isExactMatch: user.id.toLowerCase() === searchQuery.toLowerCase(),
        },
      },
    });
  } catch (error) {
    console.error("Error searching user:", error);

    return NextResponse.json(
      {
        success: false,
        error: "Failed to search user",
        message: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}
