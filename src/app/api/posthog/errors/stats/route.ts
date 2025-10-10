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

    // Extract query parameters
    const { searchParams } = new URL(request.url);
    const fromDate = searchParams.get("from");
    const toDate = searchParams.get("to");

    // Build PostHog API URL for error events
    let url = `https://us.posthog.com/api/projects/${POSTHOG_PROJECT_ID}/events/?event=$exception`;

    if (fromDate) {
      url += `&after=${fromDate}`;
    }
    if (toDate) {
      url += `&before=${toDate}`;
    }

    // Make request to PostHog API
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

    // Calculate statistics by processing both single error types and error types arrays
    let totalErrors = 0;
    let criticalErrors = 0;
    let warnings = 0;

    events.forEach((event: any) => {
      const properties = event.properties || {};
      const errorTypes = Array.isArray(properties.$exception_types)
        ? properties.$exception_types
        : [];
      const errorType = properties.$exception_type || "Unknown";
      const severity = properties.$exception_severity || "error";

      // Process both single error type and error types array
      const typesToProcess = errorTypes.length > 0 ? errorTypes : [errorType];

      // Count each error type occurrence
      totalErrors += typesToProcess.length;

      // Count by severity
      if (severity === "critical" || severity === "fatal") {
        criticalErrors += typesToProcess.length;
      } else if (severity === "warning" || severity === "warn") {
        warnings += typesToProcess.length;
      }
    });

    // Group errors by type (handling both single and array types)
    const errorTypes = events.reduce((acc: any, event: any) => {
      const properties = event.properties || {};
      const errorTypesArray = Array.isArray(properties.$exception_types)
        ? properties.$exception_types
        : [];
      const errorType = properties.$exception_type || "Unknown";

      // Process both single error type and error types array
      const typesToProcess =
        errorTypesArray.length > 0 ? errorTypesArray : [errorType];

      typesToProcess.forEach((type: string) => {
        acc[type] = (acc[type] || 0) + 1;
      });

      return acc;
    }, {});

    // Group errors by hour for chart data (handling both single and array types)
    const hourlyData = events.reduce((acc: any, event: any) => {
      const properties = event.properties || {};
      const errorTypesArray = Array.isArray(properties.$exception_types)
        ? properties.$exception_types
        : [];
      const errorType = properties.$exception_type || "Unknown";
      const severity = properties.$exception_severity || "error";
      const date = new Date(event.timestamp);
      const hour = date.getHours();
      const timeKey = `${hour.toString().padStart(2, "0")}:00`;

      if (!acc[timeKey]) {
        acc[timeKey] = { time: timeKey, errors: 0, warnings: 0, critical: 0 };
      }

      // Process both single error type and error types array
      const typesToProcess =
        errorTypesArray.length > 0 ? errorTypesArray : [errorType];

      // Count each error type occurrence in the chart data
      typesToProcess.forEach(() => {
        if (severity === "critical" || severity === "fatal") {
          acc[timeKey].critical++;
        } else if (severity === "warning" || severity === "warn") {
          acc[timeKey].warnings++;
        } else {
          acc[timeKey].errors++;
        }
      });

      return acc;
    }, {});

    // Convert to array and sort by time
    const chartData = Object.values(hourlyData).sort((a: any, b: any) =>
      a.time.localeCompare(b.time)
    );

    // Calculate weekly comparison (last 7 days)
    const oneWeekAgo = new Date();
    oneWeekAgo.setDate(oneWeekAgo.getDate() - 7);

    let weeklyUrl = `https://us.posthog.com/api/projects/${POSTHOG_PROJECT_ID}/events/?event=$exception&after=${oneWeekAgo.toISOString()}`;

    const weeklyResponse = await fetch(weeklyUrl, {
      method: "GET",
      headers: {
        Authorization: `Bearer ${POSTHOG_API_KEY}`,
        "Content-Type": "application/json",
      },
    });

    let weeklyCount = 0;
    if (weeklyResponse.ok) {
      const weeklyData = await weeklyResponse.json();
      weeklyCount = weeklyData.results?.length || 0;
    }

    // If no date filters were provided, use all data for weekly count
    if (!fromDate && !toDate) {
      weeklyCount = totalErrors; // Use total errors as weekly count when showing all data
    }

    return NextResponse.json({
      success: true,
      data: {
        totalErrors,
        criticalErrors,
        warnings,
        errorTypes,
        chartData,
        weeklyCount,
      },
    });
  } catch (error) {
    console.error("Error fetching PostHog error stats:", error);

    return NextResponse.json(
      {
        success: false,
        error: "Failed to fetch error statistics from PostHog",
        message: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}
