import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET() {
    try {
        // Fetch real counts from the database using Prisma
        const [totalInward, totalOutward, totalMasters] = await Promise.all([
            prisma.inward.count(),
            prisma.outward.count(),
            prisma.inOutwardFromTo.count()
        ]);

        return NextResponse.json({
            stats: {
                totalInward,
                totalOutward,
                totalMasters,
                pendingTasks: 0 // Placeholder for future logic
            }
        });
    } catch (error) {
        console.error("Error fetching profile stats:", error);
        return NextResponse.json({ error: "Failed to fetch stats" }, { status: 500 });
    }
}
