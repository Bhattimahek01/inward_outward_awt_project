import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET() {
    try {
        const roles = await prisma.role.findMany({
            orderBy: { RoleName: "asc" },
        });
        return NextResponse.json(roles);
    } catch (error) {
        console.error("Error fetching roles:", error);
        return NextResponse.json({ error: "Failed to fetch roles" }, { status: 500 });
    }
}
