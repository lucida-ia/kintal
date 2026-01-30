import { NextRequest, NextResponse } from "next/server";
import { connectToDB } from "@/lib/mongodg";
import { User } from "@/models/User";
import { Integration } from "@/models/Integration";

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await connectToDB();

    const { id } = await params;
    const body = (await request.json()) as Partial<{ integrationId: string }>;
    const integrationId = (body.integrationId ?? "").trim();

    if (!integrationId) {
      return NextResponse.json(
        {
          success: false,
          error: "integrationId is required",
        },
        { status: 400 }
      );
    }

    // Ensure integration exists
    const integrationExists = await Integration.exists({ integrationId });
    if (!integrationExists) {
      return NextResponse.json(
        {
          success: false,
          error: "Integration not found for the provided integrationId",
        },
        { status: 404 }
      );
    }

    const updatedUser = await User.findOneAndUpdate(
      { id },
      {
        $set: {
          integrationId,
          updatedAt: new Date(),
        },
      },
      { new: true, select: "-__v" }
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
        message: "User integration updated successfully",
      },
    });
  } catch (error) {
    console.error("Error updating user integration:", error);
    return NextResponse.json(
      {
        success: false,
        error: "Failed to update user integration",
        message: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}

export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await connectToDB();

    const { id } = await params;

    const updatedUser = await User.findOneAndUpdate(
      { id },
      {
        $set: {
          integrationId: null,
          updatedAt: new Date(),
        },
      },
      { new: true, select: "-__v" }
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
        message: "User integration removed successfully",
      },
    });
  } catch (error) {
    console.error("Error removing user integration:", error);
    return NextResponse.json(
      {
        success: false,
        error: "Failed to remove user integration",
        message: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}

