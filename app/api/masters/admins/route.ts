import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET() {
    try {
        const users = await prisma.user.findMany({
            include: { role: true },
            orderBy: { Created: "desc" },
        });
        return NextResponse.json(users);
    } catch (error) {
        console.error("Error fetching users:", error);
        return NextResponse.json({ error: "Failed to fetch users" }, { status: 500 });
    }
}

export async function POST(request: Request) {
    try {
        const body = await request.json();
        const { Email, Password, Name, RoleID } = body;

        // Check if user already exists
        const existingUser = await prisma.user.findUnique({
            where: { Email }
        });

        if (existingUser) {
            return NextResponse.json({ error: "User with this email already exists" }, { status: 400 });
        }

        const user = await prisma.user.create({
            data: {
                Email,
                Password, // NOTE: In a real app, hash this!
                Name,
                RoleID: Number(RoleID),
            },
            include: { role: true }
        });
        return NextResponse.json(user);
    } catch (error) {
        console.error("Error creating user:", error);
        return NextResponse.json({ error: "Failed to create user" }, { status: 500 });
    }
}

export async function PUT(request: Request) {
    try {
        const body = await request.json();
        const { UserID, Email, Password, Name, RoleID, IsActive } = body;

        const updateData: any = {
            Email,
            Name,
            RoleID: Number(RoleID),
            IsActive: IsActive !== undefined ? IsActive : true
        };

        if (Password) {
            updateData.Password = Password;
        }

        const user = await prisma.user.update({
            where: { UserID: Number(UserID) },
            data: updateData,
            include: { role: true }
        });
        return NextResponse.json(user);
    } catch (error) {
        console.error("Error updating user:", error);
        return NextResponse.json({ error: "Failed to update user" }, { status: 500 });
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
            await prisma.user.deleteMany({
                where: { UserID: { in: ids } },
            });
            return NextResponse.json({ message: `${ids.length} users deleted successfully` });
        }

        if (!id) {
            return NextResponse.json({ error: "ID is required" }, { status: 400 });
        }

        await prisma.user.delete({
            where: { UserID: parseInt(id) },
        });

        return NextResponse.json({ message: "User deleted successfully" });
    } catch (error) {
        console.error("Error deleting user:", error);
        return NextResponse.json({ error: "Failed to delete user" }, { status: 500 });
    }
}
