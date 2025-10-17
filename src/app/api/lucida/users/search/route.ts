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

    // Helper to escape regex special chars from user input
    const escapeRegex = (value: string) =>
      value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

    // Build queries that try exact match first (case-insensitive) on id, email, or username
    const exactRegex = new RegExp(`^${escapeRegex(searchQuery)}$`, "i");
    const partialRegex = new RegExp(escapeRegex(searchQuery), "i");

    // Try exact match on any of the identifying fields
    let user = await User.findOne({
      $or: [
        { id: { $regex: exactRegex } },
        { email: { $regex: exactRegex } },
        { username: { $regex: exactRegex } },
      ],
    }).select("-__v");

    // If not found, try partial match
    if (!user) {
      user = await User.findOne({
        $or: [
          { id: { $regex: partialRegex } },
          { email: { $regex: partialRegex } },
          { username: { $regex: partialRegex } },
        ],
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

    // Resolve proper email/displayName with fallbacks
    const rawUser = user.toObject();
    const resolvedEmail = rawUser.email ?? rawUser.id;
    const resolvedDisplayName =
      rawUser.username ??
      (typeof resolvedEmail === "string" && resolvedEmail.includes("@")
        ? resolvedEmail.split("@")[0]
        : rawUser.id);

    // Use stored examsThisPeriod if it exists and is different from calculated value
    // This allows manual updates to override the calculated value
    const storedExamsThisPeriod = rawUser.usage?.examsThisPeriod;
    const finalExamsThisPeriod =
      storedExamsThisPeriod !== undefined
        ? storedExamsThisPeriod
        : examsLast30Days;

    // Create user object with corrected examsThisPeriod and enhanced display info
    const userWithCorrectUsage = {
      ...rawUser,
      usage: {
        ...rawUser.usage,
        examsThisPeriod: finalExamsThisPeriod,
        examsThisPeriodResetDate: rawUser.usage?.examsThisPeriodResetDate,
      },
      email: resolvedEmail,
      displayName: resolvedDisplayName,
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
          isExactMatch: [rawUser.id, rawUser.email, rawUser.username]
            .filter(Boolean)
            .map((v: string) => v.toLowerCase())
            .includes(searchQuery.toLowerCase()),
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
