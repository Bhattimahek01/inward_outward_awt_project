import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getAuthUserId } from "@/lib/authUtils";

export async function GET() {
    try {
        const couriers = await prisma.courierCompany.findMany({
            orderBy: { Created: "desc" },
        });
        return NextResponse.json(couriers);
    } catch (error) {
        console.error("Error fetching couriers:", error);
        return NextResponse.json({ error: "Failed to fetch couriers" }, { status: 500 });
    }
}

export async function POST(request: Request) {
    try {
        const userId = await getAuthUserId();
        if (!userId) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const body = await request.json();
        const courier = await prisma.courierCompany.create({
            data: {
                CourierCompanyName: body.CourierCompanyName,
                ContactPersonName: body.ContactPersonName,
                DefaultRate: body.DefaultRate ? parseFloat(body.DefaultRate) : null,
                PhoneNo: body.PhoneNo,
                Email: body.Email,
                Address: body.Address,
                UserID: userId,
            },
        });
        return NextResponse.json(courier);
    } catch (error) {
        console.error("Error creating courier:", error);
        return NextResponse.json({ error: "Failed to create courier" }, { status: 500 });
    }
}

export async function PUT(request: Request) {
    try {
        const body = await request.json();
        const { id, ...data } = body;

        if (!id) {
            return NextResponse.json({ error: "ID is required" }, { status: 400 });
        }

        const courier = await prisma.courierCompany.update({
            where: { CourierCompanyID: parseInt(id) },
            data: {
                CourierCompanyName: data.CourierCompanyName,
                ContactPersonName: data.ContactPersonName,
                DefaultRate: data.DefaultRate ? parseFloat(data.DefaultRate) : null,
                PhoneNo: data.PhoneNo,
                Email: data.Email,
                Address: data.Address,
            },
        });
        return NextResponse.json(courier);
    } catch (error) {
        console.error("Error updating courier:", error);
        return NextResponse.json({ error: "Failed to update courier" }, { status: 500 });
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
            await prisma.courierCompany.deleteMany({
                where: { CourierCompanyID: { in: ids } },
            });
            return NextResponse.json({ message: `${ids.length} couriers deleted successfully` });
        }

        if (!id) {
            return NextResponse.json({ error: "ID is required" }, { status: 400 });
        }

        await prisma.courierCompany.delete({
            where: { CourierCompanyID: parseInt(id) },
        });

        return NextResponse.json({ message: "Courier deleted successfully" });
    } catch (error) {
        console.error("Error deleting courier:", error);
        return NextResponse.json({ error: "Failed to delete courier" }, { status: 500 });
    }
}
