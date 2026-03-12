import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function PUT(
    request: Request,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const { id } = await params;
        const body = await request.json();

        const updatedEntry = await prisma.inOutwardFromTo.update({
            where: { InOutwardFromToID: parseInt(id) },
            data: {
                InOutwardFromToName: body.InOutwardFromToName,
                PersonName: body.PersonName,
                Address: body.Address,
                Place: body.Place,
                IsActive: body.IsActive,
                Sequence: body.Sequence ? parseFloat(body.Sequence) : null,
                Remarks: body.Remarks,
            },
        });

        return NextResponse.json(updatedEntry);
    } catch (error) {
        console.error("Error updating From/To entry:", error);
        return NextResponse.json({ error: "Failed to update entry" }, { status: 500 });
    }
}

export async function DELETE(
    request: Request,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const { id } = await params;

        await prisma.inOutwardFromTo.delete({
            where: { InOutwardFromToID: parseInt(id) },
        });

        return NextResponse.json({ message: "Entry deleted successfully" });
    } catch (error) {
        console.error("Error deleting From/To entry:", error);
        return NextResponse.json({ error: "Failed to delete entry" }, { status: 500 });
    }
}
