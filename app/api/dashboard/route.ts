import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const userId = searchParams.get("userId");
  const role = searchParams.get("role");

  try {
    const isClerk = role === "clerk";
    const userFilter =
      isClerk && userId && !isNaN(parseInt(userId))
        ? { UserID: parseInt(userId) }
        : {};

    // Calculate date ranges for charts
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

    const [
      totalInward,
      totalOutward,
      recentInwards,
      recentOutwards,
      activeOffices,
      inwardVolume,
      outwardVolume,
      modeStats,
    ] = await Promise.all([
      prisma.inward.count({ where: userFilter }),
      prisma.outward.count({ where: userFilter }),
      prisma.inward.findMany({
        where: userFilter,
        orderBy: { InwardDate: "desc" },
        take: 5,
      }),
      prisma.outward.findMany({
        where: userFilter,
        orderBy: { OutwardDate: "desc" },
        take: 5,
      }),
      prisma.inwardOutwardOffice.count(), // Offices are always global count

      // Chart Data: Volume last 7 days
      prisma.inward.groupBy({
        by: ["InwardDate"],
        where: {
          ...userFilter,
          InwardDate: { gte: sevenDaysAgo },
        },
        _count: { InwardID: true },
      }),
      prisma.outward.groupBy({
        by: ["OutwardDate"],
        where: {
          ...userFilter,
          OutwardDate: { gte: sevenDaysAgo },
        },
        _count: { OutwardID: true },
      }),

      // Chart Data: Mode Distribution (using InOutwardModeID from Inward table for now as sample)
      prisma.inward.groupBy({
        by: ["InOutwardModeID"],
        where: userFilter,
        _count: { InwardID: true },
      }),
    ]);

    // Process Volume Data for Recharts
    // Create map of last 7 days
    const volumeMap = new Map<
      string,
      { date: string; inward: number; outward: number }
    >();
    for (let i = 0; i < 7; i++) {
      const d = new Date();
      d.setDate(d.getDate() - i);
      const dateStr = d.toISOString().split("T")[0];
      volumeMap.set(dateStr, {
        date: d.toLocaleDateString("en-US", { weekday: "short" }),
        inward: 0,
        outward: 0,
      });
    }

    // Type definition for Prisma groupBy result items
    type VolumeStatItem = {
      _count: { InwardID?: number; OutwardID?: number };
      InwardDate?: Date;
      OutwardDate?: Date;
    };

    (inwardVolume as VolumeStatItem[]).forEach((item) => {
      if (item.InwardDate) {
        const dateStr = new Date(item.InwardDate).toISOString().split("T")[0];
        if (volumeMap.has(dateStr)) {
          volumeMap.get(dateStr)!.inward = item._count.InwardID || 0;
        }
      }
    });

    (outwardVolume as VolumeStatItem[]).forEach((item) => {
      if (item.OutwardDate) {
        const dateStr = new Date(item.OutwardDate).toISOString().split("T")[0];
        if (volumeMap.has(dateStr)) {
          volumeMap.get(dateStr)!.outward = item._count.OutwardID || 0;
        }
      }
    });

    const volumeChartData = Array.from(volumeMap.values()).reverse();

    // Process Mode Data
    // Needs mode names, so we fetch them first
    const modes = await prisma.inOutwardMode.findMany();
    
    type ModeStatItem = {
      InOutwardModeID: number | null;
      _count: { InwardID: number };
    };

    const modeChartData = (modeStats as ModeStatItem[]).map((stat) => {
      const modeName =
        modes.find((m) => m.InOutwardModeID === stat.InOutwardModeID)
          ?.InOutwardModeName || "Unknown";
      return { name: modeName, value: stat._count.InwardID };
    });

    // Format recent traffic
    const recentTraffic = [
      ...recentInwards.map((i) => ({
        id: `in-${i.InwardID}`,
        type: "Inward",
        subject: i.Subject,
        time: new Date(i.Created).toLocaleTimeString(),
        status: "Completed",
      })),
      ...recentOutwards.map((o) => ({
        id: `out-${o.OutwardID}`,
        type: "Outward",
        subject: o.Subject,
        time: new Date(o.Created).toLocaleTimeString(),
        status: "Sent",
      })),
    ]
      .sort((a, b) => b.id.localeCompare(a.id))
      .slice(0, 10);

    return NextResponse.json({
      stats: {
        totalInward,
        totalOutward,
        pendingItems: 0,
        activeOffices,
      },
      recentTraffic,
      charts: {
        volume: volumeChartData,
        distribution: modeChartData,
      },
    });
  } catch (error) {
    console.error("Dashboard API Error:", error);
    return NextResponse.json(
      { error: "Failed to fetch dashboard data" },
      { status: 500 },
    );
  }
}
