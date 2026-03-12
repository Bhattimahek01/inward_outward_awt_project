import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(request: Request) {
    try {
        const { searchParams } = new URL(request.url);
        const email = searchParams.get("email");

        if (!email) {
            return NextResponse.json({ error: "Email is required" }, { status: 400 });
        }

        const user = await prisma.user.findUnique({
            where: { Email: email },
            include: { role: true }
        });

        if (!user) {
            return NextResponse.json({ error: "User not found" }, { status: 404 });
        }

        return NextResponse.json(user);
    } catch (error) {
        console.error("Error fetching user profile:", error);
        return NextResponse.json({ error: "Internal server error" }, { status: 500 });
    }
}

export async function PUT(request: Request) {
    try {
        const body = await request.json();
        const { Email, Name, Password, currentEmail, ProfilePath, JoinedAt } = body;

        if (!currentEmail) {
            return NextResponse.json({ error: "Current email is required" }, { status: 400 });
        }

        // Check if new username (email) already exists for another user
        if (Email && Email !== currentEmail) {
            const existingUser = await prisma.user.findUnique({
                where: { Email }
            });
            if (existingUser) {
                return NextResponse.json({ error: "Email already in use" }, { status: 400 });
            }
        }

        const updateData: any = {};

        if (Email) updateData.Email = Email;
        if (Name !== undefined) updateData.Name = Name;
        if (Password) updateData.Password = Password;
        if (ProfilePath !== undefined) updateData.ProfilePath = ProfilePath;
        if (JoinedAt !== undefined) updateData.JoinedAt = JoinedAt ? new Date(JoinedAt) : null;

        console.log("Attempting to update user:", currentEmail, "with data:", { ...updateData, ProfilePath: updateData.ProfilePath ? "...image..." : null });

        try {
            const updatedUser = await prisma.user.update({
                where: { Email: currentEmail },
                data: updateData
            });
            return NextResponse.json(updatedUser);
        } catch (prismaError: any) {
            if (prismaError.code === 'P2025') {
                return NextResponse.json({
                    error: "User account not found in database",
                    details: `The user '${currentEmail}' does not exist in the database. Please try logging in again.`
                }, { status: 404 });
            }
            throw prismaError;
        }
    } catch (error: any) {
        console.error("Profile update error details:", error);

        // Map common errors to friendly messages
        let friendlyMessage = "We couldn't update your profile right now.";

        if (error.code === 'P2002') {
            friendlyMessage = "This email is already being used by another account.";
        } else if (error.code === 'P1001') {
            friendlyMessage = "We're having trouble reaching our database. Please try again in a moment.";
        }

        return NextResponse.json({
            error: friendlyMessage
        }, { status: 500 });
    }
}
