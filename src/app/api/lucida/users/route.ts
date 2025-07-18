import { NextRequest, NextResponse } from "next/server";
import { connectToDB } from "@/lib/mongodg";
import { User } from "@/models/User";

export async function GET(request: NextRequest) {
  try {
    // Connect to MongoDB
    await connectToDB();

    // Get all users from the database
    const users = await User.find({}).select("-__v").sort({ createdAt: -1 });

    return NextResponse.json({
      success: true,
      data: users,
      count: users.length,
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
