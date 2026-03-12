import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getAuthUserId } from "@/lib/authUtils";

export async function GET() {
    try {
        const modes = await prisma.inOutwardMode.findMany({
            orderBy: { Sequence: "asc" },
        });
        return NextResponse.json(modes);
    } catch (error) {
        console.error("Error fetching modes:", error);
        return NextResponse.json({ error: "Failed to fetch modes" }, { status: 500 });
    }
}

export async function POST(request: Request) {
    try {
        const userId = await getAuthUserId();
        if (!userId) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const body = await request.json();
        const mode = await prisma.inOutwardMode.create({
            data: {
                InOutwardModeName: body.InOutwardModeName,
                IsActive: body.IsActive ?? true,
                Sequence: body.Sequence ? parseFloat(body.Sequence) : null,
                Remarks: body.Remarks,
                UserID: userId,
            },
        });
        return NextResponse.json(mode);
    } catch (error) {
        console.error("Error creating mode:", error);
        return NextResponse.json({ error: "Failed to create mode" }, { status: 500 });
    }
}

export async function PUT(request: Request) {
    try {
        const body = await request.json();
        const { id, ...data } = body;

        if (!id) {
            return NextResponse.json({ error: "ID is required" }, { status: 400 });
        }

        const mode = await prisma.inOutwardMode.update({
            where: { InOutwardModeID: parseInt(id) },
            data: {
                InOutwardModeName: data.InOutwardModeName,
                IsActive: data.IsActive,
                Sequence: data.Sequence ? parseFloat(data.Sequence) : null,
                Remarks: data.Remarks,
            },
        });
        return NextResponse.json(mode);
    } catch (error) {
        console.error("Error updating mode:", error);
        return NextResponse.json({ error: "Failed to update mode" }, { status: 500 });
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
            await prisma.inOutwardMode.deleteMany({
                where: { InOutwardModeID: { in: ids } },
            });
            return NextResponse.json({ message: `${ids.length} modes deleted successfully` });
        }

        if (!id) {
            return NextResponse.json({ error: "ID is required" }, { status: 400 });
        }

        await prisma.inOutwardMode.delete({
            where: { InOutwardModeID: parseInt(id) },
        });

        return NextResponse.json({ message: "Mode deleted successfully" });
    } catch (error) {
        console.error("Error deleting mode:", error);
        return NextResponse.json({ error: "Failed to delete mode" }, { status: 500 });
    }
}
