import { NextRequest, NextResponse } from "next/server";
import { connectToDB } from "@/lib/mongodg";
import { User } from "@/models/User";
import { Exam } from "@/models/Exam";
import { Result } from "@/models/Result";

interface ChartDataPoint {
  date: string;
  users: number;
  exams: number;
  questions: number;
  answers: number;
}

export async function GET(request: NextRequest) {
  try {
    // Connect to MongoDB
    await connectToDB();

    // Extract query parameters
    const { searchParams } = new URL(request.url);
    const fromDate = searchParams.get("from");
    const toDate = searchParams.get("to");

    // Set default date range (last 30 days if no dates provided)
    const defaultEndDate = new Date();
    const defaultStartDate = new Date();
    defaultStartDate.setDate(defaultStartDate.getDate() - 30);

    const startDate = fromDate ? new Date(fromDate) : defaultStartDate;
    const endDate = toDate ? new Date(toDate) : defaultEndDate;

    // Aggregation pipeline to group data by date
    const userPipeline = [
      {
        $match: {
          createdAt: { $gte: startDate, $lte: endDate },
        },
      },
      {
        $group: {
          _id: {
            $dateToString: { format: "%Y-%m-%d", date: "$createdAt" },
          },
          count: { $sum: 1 },
        },
      },
      { $sort: { _id: 1 } },
    ];

    const examPipeline = [
      {
        $match: {
          createdAt: { $gte: startDate, $lte: endDate },
        },
      },
      {
        $group: {
          _id: {
            $dateToString: { format: "%Y-%m-%d", date: "$createdAt" },
          },
          count: { $sum: 1 },
        },
      },
      { $sort: { _id: 1 } },
    ];

    const questionPipeline = [
      {
        $match: {
          createdAt: { $gte: startDate, $lte: endDate },
        },
      },
      {
        $group: {
          _id: {
            $dateToString: { format: "%Y-%m-%d", date: "$createdAt" },
          },
          count: { $sum: { $size: { $ifNull: ["$questions", []] } } },
        },
      },
      { $sort: { _id: 1 } },
    ];

    const answerPipeline = [
      {
        $match: {
          createdAt: { $gte: startDate, $lte: endDate },
        },
      },
      {
        $group: {
          _id: {
            $dateToString: { format: "%Y-%m-%d", date: "$createdAt" },
          },
          count: { $sum: 1 },
        },
      },
      { $sort: { _id: 1 } },
    ];

    // Execute all aggregations in parallel
    const [usersByDate, examsByDate, questionsByDate, answersByDate] =
      await Promise.all([
        User.aggregate(userPipeline),
        Exam.aggregate(examPipeline),
        Exam.aggregate(questionPipeline),
        Result.aggregate(answerPipeline),
      ]);

    // Create a map of all dates in the range
    const dateMap: Record<string, ChartDataPoint> = {};
    const currentDate = new Date(startDate);

    while (currentDate <= endDate) {
      const dateString = currentDate.toISOString().split("T")[0];
      dateMap[dateString] = {
        date: dateString,
        users: 0,
        exams: 0,
        questions: 0,
        answers: 0,
      };
      currentDate.setDate(currentDate.getDate() + 1);
    }

    // Fill in the actual data
    usersByDate.forEach((item) => {
      if (dateMap[item._id]) {
        dateMap[item._id].users = item.count;
      }
    });

    examsByDate.forEach((item) => {
      if (dateMap[item._id]) {
        dateMap[item._id].exams = item.count;
      }
    });

    questionsByDate.forEach((item) => {
      if (dateMap[item._id]) {
        dateMap[item._id].questions = item.count;
      }
    });

    answersByDate.forEach((item) => {
      if (dateMap[item._id]) {
        dateMap[item._id].answers = item.count;
      }
    });

    // Convert to array and sort by date
    const chartData = Object.values(dateMap).sort(
      (a: ChartDataPoint, b: ChartDataPoint) => a.date.localeCompare(b.date)
    );

    return NextResponse.json({
      success: true,
      data: chartData,
      dateRange: {
        from: startDate.toISOString(),
        to: endDate.toISOString(),
      },
    });
  } catch (error) {
    console.error("Error fetching chart data:", error);

    return NextResponse.json(
      {
        success: false,
        error: "Failed to fetch chart data",
        message: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}
