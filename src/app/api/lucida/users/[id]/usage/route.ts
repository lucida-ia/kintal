import { NextRequest, NextResponse } from "next/server";
import { connectToDB } from "@/lib/mongodg";
import { User } from "@/models/User";

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    // Connect to MongoDB
    await connectToDB();

    const { id } = await params;
    const body = await request.json();
    const { examsThisPeriod } = body;

    // Validate the examsThisPeriod value
    if (examsThisPeriod === undefined || examsThisPeriod === null) {
      return NextResponse.json(
        {
          success: false,
          error: "examsThisPeriod is required",
        },
        { status: 400 }
      );
    }

    const usageNumber = parseInt(examsThisPeriod);
    if (isNaN(usageNumber) || usageNumber < 0) {
      return NextResponse.json(
        {
          success: false,
          error: "examsThisPeriod must be a valid non-negative number",
        },
        { status: 400 }
      );
    }

    // Find and update the user
    const userBeforeUpdate = await User.findOne({ id: id });

    // Try to force update examsThisPeriod by using $inc first
    const incrementResult = await User.updateOne(
      { id: id },
      {
        $inc: {
          "usage.examsThisPeriod":
            -userBeforeUpdate?.usage?.examsThisPeriod || 0,
        },
      }
    );

    const updateResult = await User.updateOne(
      { id: id },
      {
        $set: {
          "usage.examsThisPeriod": usageNumber,
          updatedAt: new Date(),
        },
      }
    );

    const updatedUser = await User.findOne({ id: id }).select("-__v");

    if (!updatedUser) {
      return NextResponse.json(
        {
          success: false,
          error: "User not found",
        },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      data: {
        user: updatedUser,
        message: `User usage updated to ${usageNumber} exams successfully`,
      },
    });
  } catch (error) {
    return NextResponse.json(
      {
        success: false,
        error: "Failed to update user usage",
        message: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}
