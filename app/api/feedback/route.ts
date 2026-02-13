import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import connectDB from "@/lib/db";
import Feedback from "@/models/Feedback";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { successResponse, errorResponse } from "@/lib/api-utils";
import { feedbackSchema } from "@/lib/validators/feedback";

export async function POST(req: Request) {
    try {
        const session = await getServerSession(authOptions);

        if (!session) {
            return errorResponse("Login Required", 401);
        }

        const body = await req.json();
        const parsed = feedbackSchema.safeParse(body);

        if (!parsed.success) {
            return errorResponse(parsed.error.issues[0].message, 400);
        }

        await connectDB();

        const feedback = await Feedback.create({
            userId: session.user.id,
            name: parsed.data.name,
            rating: parsed.data.rating,
            comment: parsed.data.comment,
        });

        return successResponse(feedback, 201);
    } catch (err) {
        console.error("Feedback Error:", err);
        return errorResponse("Failed to submit feedback", 500);
    }
}

export async function GET(req: Request) {
    try {
        const { searchParams } = new URL(req.url);
        const homepage = searchParams.get("homepage") === "true";

        await connectDB();

        let query = {};
        if (homepage) {
            query = { showOnHome: true };
        }

        const feedbacks = await Feedback.find(query).sort({ createdAt: -1 }).limit(10);
        return successResponse(feedbacks);
    } catch (err) {
        console.error("Fetch Feedback Error:", err);
        return errorResponse("Failed to fetch feedback", 500);
    }
}
