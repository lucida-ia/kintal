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

    // Get filtered exams and calculate total questions
    const exams = await Exam.find(filter).select(
      "questions questionCount createdAt"
    );

    // Sum up all questions from filtered exams
    const totalQuestions = exams.reduce((sum, exam) => {
      return sum + (exam.questions ? exam.questions.length : 0);
    }, 0);

    // Alternative calculation using questionCount field
    const totalQuestionsFromCount = exams.reduce((sum, exam) => {
      return sum + (exam.questionCount || 0);
    }, 0);

    // Calculate exams (and their questions) created in the last 7 days
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

    const weeklyExams = await Exam.find(weeklyFilter).select(
      "questions questionCount"
    );

    const weeklyQuestions = weeklyExams.reduce((sum, exam) => {
      return sum + (exam.questions ? exam.questions.length : 0);
    }, 0);

    return NextResponse.json({
      success: true,
      data: {
        totalQuestions,
        totalQuestionsFromCount,
        examCount: exams.length,
      },
      weeklyCount: weeklyQuestions,
    });
  } catch (error) {
    console.error("Error calculating questions sum:", error);

    return NextResponse.json(
      {
        success: false,
        error: "Failed to calculate questions sum",
        message: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}
