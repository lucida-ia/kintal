import { NextRequest, NextResponse } from "next/server";
import { connectToDB } from "@/lib/mongodg";
import { Integration } from "@/models/Integration";
import { randomUUID } from "crypto";

export async function GET() {
  try {
    await connectToDB();

    const integrations = await Integration.find({})
      .select("-__v")
      .sort({ createdAt: -1 });

    return NextResponse.json({
      success: true,
      data: integrations,
      count: integrations.length,
    });
  } catch (error) {
    console.error("Error fetching integrations:", error);

    return NextResponse.json(
      {
        success: false,
        error: "Failed to fetch integrations",
        message: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    await connectToDB();

    const body = (await request.json()) as Partial<{
      integrationName: string;
    }>;

    const integrationName = (body.integrationName ?? "").trim();

    if (!integrationName) {
      return NextResponse.json(
        {
          success: false,
          error: "integrationName is required",
        },
        { status: 400 }
      );
    }

    // Generate a unique integrationId server-side (avoids issues with cached Mongoose models in dev)
    const integrationId = randomUUID();

    const created = await Integration.create({
      integrationId,
      integrationName,
    });

    return NextResponse.json(
      {
        success: true,
        data: created,
      },
      { status: 201 }
    );
  } catch (error: unknown) {
    // Duplicate key error (Mongo)
    const maybeMongo = error as { code?: number; keyPattern?: unknown };
    if (maybeMongo?.code === 11000) {
      return NextResponse.json(
        {
          success: false,
          error: "Integration already exists (duplicate integrationId)",
        },
        { status: 409 }
      );
    }

    console.error("Error creating integration:", error);

    return NextResponse.json(
      {
        success: false,
        error: "Failed to create integration",
        message: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}

export async function DELETE(request: NextRequest) {
  try {
    await connectToDB();

    const { searchParams } = new URL(request.url);
    const id = searchParams.get("id");

    if (!id) {
      return NextResponse.json(
        {
          success: false,
          error: "Integration id is required",
        },
        { status: 400 }
      );
    }

    const deleted = await Integration.findByIdAndDelete(id);

    if (!deleted) {
      return NextResponse.json(
        {
          success: false,
          error: "Integration not found",
        },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      message: "Integration deleted successfully",
      data: deleted,
    });
  } catch (error) {
    console.error("Error deleting integration:", error);

    return NextResponse.json(
      {
        success: false,
        error: "Failed to delete integration",
        message: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}
