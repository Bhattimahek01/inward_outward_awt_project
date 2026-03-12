import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getAuthUserId } from "@/lib/authUtils";

export async function GET() {
    try {
        const inwards = await prisma.inward.findMany({
            orderBy: { InwardDate: "desc" },
            take: 50,
        });
        return NextResponse.json(inwards);
    } catch (error) {
        console.error("Error fetching inward entries:", error);
        return NextResponse.json({ error: "Failed to fetch inward entries" }, { status: 500 });
    }
}

export async function POST(request: Request) {
    try {
        const userId = await getAuthUserId();
        if (!userId) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const body = await request.json();
        const inward = await prisma.inward.create({
            data: {
                InwardNo: body.InwardNo,
                InwardDate: new Date(body.InwardDate),
                Subject: body.Subject,
                Remarks: body.Description,
                CourierCompanyName: body.CourierCompanyName,
                InwardLetterNo: body.InwardLetterNo,
                InwardLetterDate: body.InwardLetterDate ? new Date(body.InwardLetterDate) : null,
                ToInwardOutwardOfficeID: parseInt(body.ToInwardOutwardOfficeID) || 1,
                InOutwardModeID: body.InOutwardModeID ? parseInt(body.InOutwardModeID) : null,
                InOutwardFromToID: body.InOutwardFromToID ? parseInt(body.InOutwardFromToID) : null,
                FinYearID: 1,
                UserID: userId,
            },
        });
        return NextResponse.json(inward);
    } catch (error) {
        console.error("Error creating inward entry:", error);
        return NextResponse.json({ error: "Failed to create inward entry" }, { status: 500 });
    }
}

export async function PUT(request: Request) {
    try {
        const body = await request.json();
        const { InwardID, ...updateData } = body;

        const inward = await prisma.inward.update({
            where: { InwardID: parseInt(InwardID) },
            data: {
                InwardNo: updateData.InwardNo,
                InwardDate: new Date(updateData.InwardDate),
                Subject: updateData.Subject,
                Description: updateData.Description,
                CourierCompanyName: updateData.CourierCompanyName,
                InwardLetterNo: updateData.InwardLetterNo,
                InwardLetterDate: updateData.InwardLetterDate ? new Date(updateData.InwardLetterDate) : null,
                ToInwardOutwardOfficeID: parseInt(updateData.ToInwardOutwardOfficeID),
                InOutwardModeID: updateData.InOutwardModeID ? parseInt(updateData.InOutwardModeID) : null,
                InOutwardFromToID: updateData.InOutwardFromToID ? parseInt(updateData.InOutwardFromToID) : null,
                Modified: new Date(),
            },
        });
        return NextResponse.json(inward);
    } catch (error) {
        console.error("Error updating inward entry:", error);
        return NextResponse.json({ error: "Failed to update inward entry" }, { status: 500 });
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
            await prisma.inward.deleteMany({
                where: { InwardID: { in: ids } },
            });
            return NextResponse.json({ message: `${ids.length} inward entries deleted successfully` });
        }

        if (!id) {
            return NextResponse.json({ error: "ID is required" }, { status: 400 });
        }

        await prisma.inward.delete({
            where: { InwardID: parseInt(id) },
        });

        return NextResponse.json({ message: "Inward entry deleted successfully" });
    } catch (error) {
        console.error("Error deleting inward entry:", error);
        return NextResponse.json({ error: "Failed to delete inward entry" }, { status: 500 });
    }
}
