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
    const groupBy =
      searchParams.get("groupBy") || (fromDate || toDate ? "hour" : "day"); // hour, day, week

    // Build PostHog API URL
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

    // Group events by time period
    const groupedData = events.reduce((acc: any, event: any) => {
      const date = new Date(event.timestamp);
      let timeKey: string;

      switch (groupBy) {
        case "day":
          timeKey = date.toISOString().split("T")[0]; // YYYY-MM-DD
          break;
        case "week":
          const weekStart = new Date(date);
          weekStart.setDate(date.getDate() - date.getDay());
          timeKey = weekStart.toISOString().split("T")[0];
          break;
        case "hour":
        default:
          timeKey = `${date.getHours().toString().padStart(2, "0")}:00`;
          break;
      }

      if (!acc[timeKey]) {
        acc[timeKey] = {
          time: timeKey,
          errors: 0,
          warnings: 0,
          critical: 0,
          total: 0,
        };
      }

      const severity = event.properties?.$exception_severity || "error";
      if (severity === "critical" || severity === "fatal") {
        acc[timeKey].critical++;
      } else if (severity === "warning" || severity === "warn") {
        acc[timeKey].warnings++;
      } else {
        acc[timeKey].errors++;
      }

      acc[timeKey].total++;
      return acc;
    }, {});

    // Convert to array and sort by time
    const chartData = Object.values(groupedData).sort((a: any, b: any) => {
      if (groupBy === "day" || groupBy === "week") {
        return new Date(a.time).getTime() - new Date(b.time).getTime();
      }
      return a.time.localeCompare(b.time);
    });

    // Format dates for display if needed
    const formattedData = chartData.map((item: any) => {
      if (groupBy === "day") {
        const date = new Date(item.time);
        return {
          ...item,
          formattedTime: date.toLocaleDateString("pt-BR", {
            day: "2-digit",
            month: "2-digit",
          }),
        };
      } else if (groupBy === "week") {
        const date = new Date(item.time);
        return {
          ...item,
          formattedTime: `Sem ${
            date.getWeek?.() || Math.ceil(date.getDate() / 7)
          }`,
        };
      }
      return item;
    });

    return NextResponse.json({
      success: true,
      data: formattedData,
      dateRange: {
        from: fromDate,
        to: toDate,
      },
      groupBy,
    });
  } catch (error) {
    console.error("Error fetching PostHog chart data:", error);

    return NextResponse.json(
      {
        success: false,
        error: "Failed to fetch chart data from PostHog",
        message: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}
