import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getAuthUserId } from "@/lib/authUtils";

export async function GET() {
    try {
        const outwards = await prisma.outward.findMany({
            orderBy: { OutwardDate: "desc" },
            take: 50,
        });
        return NextResponse.json(outwards);
    } catch (error) {
        console.error("Error fetching outward entries:", error);
        return NextResponse.json({ error: "Failed to fetch outward entries" }, { status: 500 });
    }
}

export async function POST(request: Request) {
    try {
        const userId = await getAuthUserId();
        if (!userId) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const body = await request.json();
        const outward = await prisma.outward.create({
            data: {
                OutwardNo: body.OutwardNo,
                OutwardDate: new Date(body.OutwardDate),
                Subject: body.Subject,
                Remarks: body.Description,
                LetterNo: body.OutwardLetterNo,
                LetterDate: body.OutwardLetterDate ? new Date(body.OutwardLetterDate) : null,
                FromInwardOutwardOfficeID: parseInt(body.FromInwardOutwardOfficeID) || 1,
                InOutwardModeID: body.InOutwardModeID ? parseInt(body.InOutwardModeID) : null,
                InOutwardFromToID: body.InOutwardFromToID ? parseInt(body.InOutwardFromToID) : null,
                FinYearID: 1,
                UserID: userId,
            },
        });
        return NextResponse.json(outward);
    } catch (error) {
        console.error("Error creating outward entry:", error);
        return NextResponse.json({ error: "Failed to create outward entry" }, { status: 500 });
    }
}

export async function PUT(request: Request) {
    try {
        const body = await request.json();
        const { OutwardID, ...updateData } = body;

        const outward = await prisma.outward.update({
            where: { OutwardID: parseInt(OutwardID) },
            data: {
                OutwardNo: updateData.OutwardNo,
                OutwardDate: new Date(updateData.OutwardDate),
                Subject: updateData.Subject,
                Remarks: updateData.Description,
                LetterNo: updateData.OutwardLetterNo,
                LetterDate: updateData.OutwardLetterDate ? new Date(updateData.OutwardLetterDate) : null,
                FromInwardOutwardOfficeID: parseInt(updateData.FromInwardOutwardOfficeID),
                InOutwardModeID: updateData.InOutwardModeID ? parseInt(updateData.InOutwardModeID) : null,
                InOutwardFromToID: updateData.InOutwardFromToID ? parseInt(updateData.InOutwardFromToID) : null,
                Modified: new Date(),
            },
        });
        return NextResponse.json(outward);
    } catch (error) {
        console.error("Error updating outward entry:", error);
        return NextResponse.json({ error: "Failed to update outward entry" }, { status: 500 });
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
            await prisma.outward.deleteMany({
                where: { OutwardID: { in: ids } },
            });
            return NextResponse.json({ message: `${ids.length} outward entries deleted successfully` });
        }

        if (!id) {
            return NextResponse.json({ error: "ID is required" }, { status: 400 });
        }

        await prisma.outward.delete({
            where: { OutwardID: parseInt(id) },
        });

        return NextResponse.json({ message: "Outward entry deleted successfully" });
    } catch (error) {
        console.error("Error deleting outward entry:", error);
        return NextResponse.json({ error: "Failed to delete outward entry" }, { status: 500 });
    }
}
