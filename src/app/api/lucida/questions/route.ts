import { NextRequest, NextResponse } from "next/server";
import { connectToDB } from "@/lib/mongodg";
import { Exam } from "@/models/Exam";

export async function GET(request: NextRequest) {
  try {
    // Connect to MongoDB
    await connectToDB();

    // Get all exams and calculate total questions
    const exams = await Exam.find({}).select("questions questionCount");

    // Sum up all questions from all exams
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

    const weeklyExams = await Exam.find({
      createdAt: { $gte: oneWeekAgo },
    }).select("questions questionCount");

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
