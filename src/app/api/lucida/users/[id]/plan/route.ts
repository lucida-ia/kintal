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
    const { plan } = body;

    // Validate the plan value
    const validPlans = [
      "free",
      "pro",
      "premium",
      "enterprise",
      "trial",
      "monthly",
      "semi-annual",
      "annual",
      "admin",
      "custom",
    ];

    if (!plan || !validPlans.includes(plan)) {
      return NextResponse.json(
        {
          success: false,
          error: "Invalid plan. Must be one of: " + validPlans.join(", "),
        },
        { status: 400 }
      );
    }

    // Find and update the user
    const updatedUser = await User.findOneAndUpdate(
      { id: id },
      {
        $set: {
          "subscription.plan": plan,
          updatedAt: new Date(),
        },
      },
      {
        new: true, // Return the updated document
        select: "-__v", // Exclude version field
      }
    );

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
        message: `User plan updated to ${plan} successfully`,
      },
    });
  } catch (error) {
    console.error("Error updating user plan:", error);

    return NextResponse.json(
      {
        success: false,
        error: "Failed to update user plan",
        message: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}
