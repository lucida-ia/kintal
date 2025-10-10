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
    const limit = searchParams.get("limit") || "1000"; // Higher limit to get more error types

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
    const events = data.results || [];

    // Extract and count error types
    const errorTypeCounts: Record<string, number> = {};
    const errorTypeDetails: Record<
      string,
      {
        count: number;
        lastOccurrence: string;
        severity: string;
        examples: string[];
      }
    > = {};

    events.forEach((event: any) => {
      const properties = event.properties || {};
      const errorTypes = Array.isArray(properties.$exception_types)
        ? properties.$exception_types
        : [];
      const errorType = properties.$exception_type || "Unknown";
      const errorMessage = properties.$exception_message || "No message";
      const severity = properties.$exception_severity || "error";
      const timestamp = event.timestamp;

      // Process both single error type and error types array
      const typesToProcess = errorTypes.length > 0 ? errorTypes : [errorType];

      typesToProcess.forEach((type: string) => {
        if (!errorTypeCounts[type]) {
          errorTypeCounts[type] = 0;
          errorTypeDetails[type] = {
            count: 0,
            lastOccurrence: timestamp,
            severity: severity,
            examples: [],
          };
        }

        errorTypeCounts[type]++;
        errorTypeDetails[type].count++;

        // Update last occurrence if this is more recent
        if (
          new Date(timestamp) > new Date(errorTypeDetails[type].lastOccurrence)
        ) {
          errorTypeDetails[type].lastOccurrence = timestamp;
        }

        // Update severity to the most critical one
        const severityLevels = { error: 1, warning: 2, critical: 3, fatal: 4 };
        const currentLevel =
          severityLevels[severity as keyof typeof severityLevels] || 1;
        const existingLevel =
          severityLevels[
            errorTypeDetails[type].severity as keyof typeof severityLevels
          ] || 1;

        if (currentLevel > existingLevel) {
          errorTypeDetails[type].severity = severity;
        }

        // Add example messages (limit to 3)
        if (
          errorTypeDetails[type].examples.length < 3 &&
          errorMessage !== "No message"
        ) {
          if (!errorTypeDetails[type].examples.includes(errorMessage)) {
            errorTypeDetails[type].examples.push(errorMessage);
          }
        }
      });
    });

    // Convert to array and sort by count (most frequent first)
    const errorTypesList = Object.entries(errorTypeCounts)
      .map(([type, count]) => ({
        type,
        count,
        ...errorTypeDetails[type],
      }))
      .sort((a, b) => b.count - a.count);

    return NextResponse.json({
      success: true,
      data: errorTypesList,
      total: errorTypesList.length,
    });
  } catch (error) {
    console.error("Error fetching PostHog error types:", error);

    return NextResponse.json(
      {
        success: false,
        error: "Failed to fetch error types from PostHog",
        message: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}
