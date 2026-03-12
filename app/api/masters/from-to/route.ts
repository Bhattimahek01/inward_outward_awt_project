import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getAuthUserId } from "@/lib/authUtils";

export async function GET(request: Request) {
    try {
        const { searchParams } = new URL(request.url);
        const query = searchParams.get("q");

        const where: any = {};
        if (query) {
            where.OR = [
                { InOutwardFromToName: { contains: query, mode: 'insensitive' } },
                { PersonName: { contains: query, mode: 'insensitive' } },
                { Place: { contains: query, mode: 'insensitive' } },
                { Address: { contains: query, mode: 'insensitive' } },
            ];
        }

        const data = await prisma.inOutwardFromTo.findMany({
            where,
            orderBy: { Sequence: "asc" },
        });
        return NextResponse.json(data);
    } catch (error) {
        console.error("Error fetching From/To entries:", error);
        return NextResponse.json({ error: "Failed to fetch entries" }, { status: 500 });
    }
}

export async function POST(request: Request) {
    try {
        const userId = await getAuthUserId();
        if (!userId) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const body = await request.json();
        const entry = await prisma.inOutwardFromTo.create({
            data: {
                InOutwardFromToName: body.InOutwardFromToName,
                PersonName: body.PersonName,
                Address: body.Address,
                Place: body.Place,
                IsActive: body.IsActive ?? true,
                Sequence: body.Sequence ? parseFloat(body.Sequence) : null,
                Remarks: body.Remarks,
                UserID: userId,
            },
        });
        return NextResponse.json(entry);
    } catch (error) {
        console.error("Error creating From/To entry:", error);
        return NextResponse.json({ error: "Failed to create entry" }, { status: 500 });
    }
}
export async function DELETE(request: Request) {
    try {
        const { searchParams } = new URL(request.url);
        const id = searchParams.get("id");
        const idsString = searchParams.get("ids");

        if (idsString) {
            const ids = idsString.split(",").map(id => parseInt(id)).filter(id => !isNaN(id));
            if (ids.length === 0) {
                return NextResponse.json({ error: "Valid IDs are required" }, { status: 400 });
            }
            await prisma.inOutwardFromTo.deleteMany({
                where: { InOutwardFromToID: { in: ids } },
            });
            return NextResponse.json({ message: `${ids.length} entries deleted successfully` });
        }

        if (!id) {
            return NextResponse.json({ error: "ID is required" }, { status: 400 });
        }

        await prisma.inOutwardFromTo.delete({
            where: { InOutwardFromToID: parseInt(id) },
        });

        return NextResponse.json({ message: "Entry deleted successfully" });
    } catch (error) {
        console.error("Error deleting From/To entries:", error);
        return NextResponse.json({ error: "Failed to delete entries" }, { status: 500 });
    }
}
