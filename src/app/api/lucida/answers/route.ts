import { NextRequest, NextResponse } from "next/server";
import { connectToDB } from "@/lib/mongodg";
import { Exam } from "@/models/Exam";

interface Question {
  question: string;
  context?: string;
  options?: string[];
  correctAnswer: unknown;
}

export async function GET(request: NextRequest) {
  try {
    // Connect to MongoDB
    await connectToDB();

    // Get all exams with their questions
    const exams = await Exam.find({}).select("title questions");

    // Extract all correct answers from all questions
    const allAnswers: Array<{
      examId: string;
      examTitle: string;
      questionIndex: number;
      question: string;
      correctAnswer: unknown;
    }> = [];

    exams.forEach((exam) => {
      if (exam.questions && exam.questions.length > 0) {
        exam.questions.forEach((question: Question, index: number) => {
          allAnswers.push({
            examId: exam._id.toString(),
            examTitle: exam.title,
            questionIndex: index + 1,
            question: question.question,
            correctAnswer: question.correctAnswer,
          });
        });
      }
    });

    return NextResponse.json({
      success: true,
      data: allAnswers,
      count: allAnswers.length,
      summary: {
        totalExams: exams.length,
        totalAnswers: allAnswers.length,
      },
    });
  } catch (error) {
    console.error("Error fetching answers:", error);

    return NextResponse.json(
      {
        success: false,
        error: "Failed to fetch answers",
        message: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}
