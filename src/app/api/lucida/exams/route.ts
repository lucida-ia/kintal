import { NextRequest, NextResponse } from "next/server";
import { connectToDB } from "@/lib/mongodg";
import { Exam } from "@/models/Exam";

export async function GET(request: NextRequest) {
  try {
    // Connect to MongoDB
    await connectToDB();

    // Get all exams from the database
    const exams = await Exam.find({}).select("-__v").sort({ createdAt: -1 });

    return NextResponse.json({
      success: true,
      data: exams,
      count: exams.length,
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
