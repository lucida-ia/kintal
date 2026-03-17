import { NextRequest, NextResponse } from "next/server";
import { createClerkClient } from "@clerk/backend";

const clerk = createClerkClient({ secretKey: process.env.CLERK_SECRET_KEY });

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const clerkIds: string[] = body?.clerkIds ?? [];

    if (!Array.isArray(clerkIds) || clerkIds.length === 0) {
      return NextResponse.json({ success: true, data: {} });
    }

    // Clerk getUserList supports up to 500 IDs per request; chunk if needed
    const CHUNK_SIZE = 500;
    const nameMap: Record<string, string> = {};

    for (let i = 0; i < clerkIds.length; i += CHUNK_SIZE) {
      const chunk = clerkIds.slice(i, i + CHUNK_SIZE);
      const { data: clerkUsers } = await clerk.users.getUserList({
        userId: chunk,
        limit: CHUNK_SIZE,
      });

      for (const cu of clerkUsers) {
        const fullName = [cu.firstName, cu.lastName].filter(Boolean).join(" ").trim();
        nameMap[cu.id] = fullName || cu.username || cu.emailAddresses[0]?.emailAddress || cu.id;
      }
    }

    return NextResponse.json({ success: true, data: nameMap });
  } catch (error) {
    console.error("Error fetching Clerk names:", error);
    return NextResponse.json(
      {
        success: false,
        error: "Failed to fetch Clerk names",
        message: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}
