import { NextRequest, NextResponse } from "next/server";

const POSTHOG_API_KEY = process.env.POSTHOG_API_KEY;
const POSTHOG_PROJECT_ID = process.env.POSTHOG_PROJECT_ID;

export async function GET(request: NextRequest) {
  try {
    if (!POSTHOG_API_KEY || !POSTHOG_PROJECT_ID) {
      return NextResponse.json(
        {
          success: false,
          error: "PostHog configuration missing",
        },
        { status: 500 }
      );
    }

    const { searchParams } = new URL(request.url);
    const fromDate = searchParams.get("from");
    const toDate = searchParams.get("to");
    const limit = searchParams.get("limit") || "100";

    let url = `https://us.posthog.com/api/projects/${POSTHOG_PROJECT_ID}/events/?event=$exception`;

    if (fromDate) {
      url += `&after=${fromDate}`;
    }
    if (toDate) {
      url += `&before=${toDate}`;
    }

    url += `&limit=${limit}`;

    const response = await fetch(url, {
      method: "GET",
      headers: {
        Authorization: `Bearer ${POSTHOG_API_KEY}`,
        "Content-Type": "application/json",
      },
    });

    if (!response.ok) {
      throw new Error(
        `PostHog API error: ${response.status} ${response.statusText}`
      );
    }

    const data = await response.json();

    const processedErrors =
      data.results?.map((event: Record<string, unknown>) => {
        const properties = (event.properties as Record<string, unknown>) || {};
        return {
          id: event.id,
          timestamp: event.timestamp,
          errorType: (properties.$exception_type as string) || "Unknown",
          errorTypes: Array.isArray(properties.$exception_types)
            ? (properties.$exception_types as string[])
            : [],
          errorMessage:
            (properties.$exception_message as string) || "No message",
          errorStack: (properties.$exception_stack_trace_raw as string) || "",
          url: (properties.$current_url as string) || "Unknown",
          userAgent: (properties.$user_agent as string) || "Unknown",
          userId: (properties.distinct_id as string) || "Anonymous",
          severity: (properties.$exception_severity as string) || "error",
          source: (properties.$exception_source as string) || "javascript",
        };
      }) || [];

    return NextResponse.json({
      success: true,
      data: processedErrors,
      count: processedErrors.length,
      total: data.count || 0,
    });
  } catch (error) {
    console.error("Error fetching PostHog errors:", error);

    return NextResponse.json(
      {
        success: false,
        error: "Failed to fetch errors from PostHog",
        message: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}
