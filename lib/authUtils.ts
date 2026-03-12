import { cookies } from "next/headers";
import jwt from "jsonwebtoken";

const JWT_SECRET = process.env.JWT_SECRET || "your-secret-key";

export async function getAuthUserId(): Promise<number | null> {
    try {
        const cookieStore = await cookies();
        const token = cookieStore.get("token")?.value;
        if (!token) return null;
        
        const decoded = jwt.verify(token, JWT_SECRET) as any;
        return decoded.userId ? parseInt(decoded.userId) : null;
    } catch (e) {
        console.error("Error decoding token:", e);
        return null;
    }
}
