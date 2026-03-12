import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getAuthUserId } from "@/lib/authUtils";

export async function GET() {
    try {
        const offices = await prisma.inwardOutwardOffice.findMany({
            orderBy: { Created: "desc" },
        });
        return NextResponse.json(offices);
    } catch (error) {
        console.error("Error fetching offices:", error);
        return NextResponse.json({ error: "Failed to fetch offices" }, { status: 500 });
    }
}

export async function POST(request: Request) {
    try {
        const userId = await getAuthUserId();
        if (!userId) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const body = await request.json();
        const office = await prisma.inwardOutwardOffice.create({
            data: {
                OfficeName: body.OfficeName,
                InstituteID: Number(body.InstituteID) || 1,
                DepartmentID: body.DepartmentID ? Number(body.DepartmentID) : null,
                OpeningDate: new Date(body.OpeningDate),
                OpeningInwardNo: Number(body.OpeningInwardNo) || 1,
                OpeningOutwardNo: Number(body.OpeningOutwardNo) || 1,
                UserID: userId,
            },
        });
        return NextResponse.json(office);
    } catch (error) {
        console.error("Error creating office:", error);
        return NextResponse.json({ error: "Failed to create office" }, { status: 500 });
    }
}

export async function PUT(request: Request) {
    try {
        const body = await request.json();
        const { id, ...data } = body;

        const office = await prisma.inwardOutwardOffice.update({
            where: { InwardOutwardOfficeID: Number(id) },
            data: {
                OfficeName: data.OfficeName,
                InstituteID: Number(data.InstituteID) || 1,
                DepartmentID: data.DepartmentID ? Number(data.DepartmentID) : null,
                OpeningDate: new Date(data.OpeningDate),
                OpeningInwardNo: Number(data.OpeningInwardNo) || 1,
                OpeningOutwardNo: Number(data.OpeningOutwardNo) || 1,
            },
        });
        return NextResponse.json(office);
    } catch (error) {
        console.error("Error updating office:", error);
        return NextResponse.json({ error: "Failed to update office" }, { status: 500 });
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
            await prisma.inwardOutwardOffice.deleteMany({
                where: { InwardOutwardOfficeID: { in: ids } },
            });
            return NextResponse.json({ message: `${ids.length} offices deleted successfully` });
        }

        if (!id) {
            return NextResponse.json({ error: "ID is required" }, { status: 400 });
        }

        await prisma.inwardOutwardOffice.delete({
            where: { InwardOutwardOfficeID: parseInt(id) },
        });

        return NextResponse.json({ message: "Office deleted successfully" });
    } catch (error) {
        console.error("Error deleting office:", error);
        return NextResponse.json({ error: "Failed to delete office" }, { status: 500 });
    }
}
