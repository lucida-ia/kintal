import { NextRequest, NextResponse } from "next/server";

interface OpenAICostResult {
  object: string;
  amount: {
    value: number;
    currency: string;
  };
  line_item: string;
  project_id: string;
  organization_id: string;
}

interface OpenAICostBucket {
  object: string;
  start_time: number;
  end_time: number;
  results: OpenAICostResult[];
}

interface OpenAICostResponse {
  object: string;
  has_more: boolean;
  next_page: string | null;
  data: OpenAICostBucket[];
}

interface SimplifiedCostResult {
  model: string;
  type: string;
  total_cost: number;
}

interface ExchangeRateResponse {
  base: string;
  date: string;
  rates: {
    BRL: number;
    [key: string]: number;
  };
}

async function getUsdToBrlRate(): Promise<number> {
  try {
    // Using a free exchange rate API
    const response = await fetch(
      "https://api.exchangerate-api.com/v4/latest/USD"
    );
    const data: ExchangeRateResponse = await response.json();
    return data.rates.BRL;
  } catch (error) {
    console.error("Error fetching exchange rate, using default rate:", error);
    // Fallback rate (approximate USD to BRL rate)
    return 5.2;
  }
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const start_time = searchParams.get("start_time");
    const end_time = searchParams.get("end_time");

    if (!start_time || !end_time) {
      return NextResponse.json(
        { error: "start_time and end_time parameters are required" },
        { status: 400 }
      );
    }

    const openaiApiKey = process.env.OPENAI_API_KEY;
    if (!openaiApiKey) {
      return NextResponse.json(
        { error: "OpenAI API key not configured" },
        { status: 500 }
      );
    }

    // Get USD to BRL exchange rate
    const usdToBrlRate = await getUsdToBrlRate();

    // Call OpenAI API
    const openaiUrl = `https://api.openai.com/v1/organization/costs?start_time=${start_time}&end_time=${end_time}&group_by=line_item`;

    const response = await fetch(openaiUrl, {
      headers: {
        Authorization: `Bearer ${openaiApiKey}`,
        "Content-Type": "application/json",
      },
    });

    if (!response.ok) {
      const errorText = await response.text();
      return NextResponse.json(
        { error: `OpenAI API error: ${response.status} ${errorText}` },
        { status: response.status }
      );
    }

    const data: OpenAICostResponse = await response.json();

    // Transform the data
    const costMap = new Map<string, number>();

    data.data.forEach((bucket: OpenAICostBucket) => {
      bucket.results.forEach((result: OpenAICostResult) => {
        // Parse line_item to extract model and type
        // Format: "gpt-4o-mini-2024-07-18, input" or "gpt-4o-mini-2024-07-18, output"
        const lineItemParts = result.line_item.split(", ");
        if (lineItemParts.length >= 2) {
          const model = lineItemParts[0];
          const type = lineItemParts[1];
          const key = `${model}|${type}`;

          const currentCost = costMap.get(key) || 0;
          costMap.set(key, currentCost + result.amount.value);
        }
      });
    });

    // Convert map to array format and convert USD to BRL
    const simplifiedResults: SimplifiedCostResult[] = Array.from(
      costMap.entries()
    ).map(([key, total_cost]) => {
      const [model, type] = key.split("|");
      const costInBrl = total_cost * usdToBrlRate;
      return {
        model,
        type,
        total_cost: Math.round(costInBrl * 10000) / 10000, // Round to 4 decimal places for BRL
      };
    });

    // Sort by model name and then by type for consistent output
    simplifiedResults.sort((a, b) => {
      if (a.model !== b.model) {
        return a.model.localeCompare(b.model);
      }
      return a.type.localeCompare(b.type);
    });

    return NextResponse.json(simplifiedResults);
  } catch (error) {
    console.error("Error fetching OpenAI costs:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
