import { NextRequest, NextResponse } from "next/server";
import { connectToDB } from "@/lib/mongodg";
import { User } from "@/models/User";

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await connectToDB();

    const { id } = await params;
    const body = (await request.json()) as Partial<{
      integratPartnerToken: string | null;
    }>;

    const raw = body.integratPartnerToken;
    const integratPartnerToken =
      raw === null ? null : (raw ?? "").toString().trim() || null;

    const updatedUser = await User.findOneAndUpdate(
      { id },
      {
        $set: {
          integratPartnerToken,
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
        message: "Integrat partner token updated successfully",
      },
    });
  } catch (error) {
    console.error("Error updating integrat partner token:", error);
    return NextResponse.json(
      {
        success: false,
        error: "Failed to update integrat partner token",
        message: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}

