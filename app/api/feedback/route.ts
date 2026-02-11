import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import connectDB from "@/lib/db";
import Feedback from "@/models/Feedback";
import { z } from "zod";

const feedbackSchema = z.object({
    rating: z.number().min(1).max(5),
    comment: z.string().min(3, "Comment too short").max(500),
});

export async function POST(req: Request) {
    try {
        const session = await getServerSession(authOptions);

        if (!session) {
            return NextResponse.json({ error: "Login required" }, { status: 401 });
        }

        const body = await req.json();
        const parsed = feedbackSchema.safeParse(body);

        if (!parsed.success) {
            return NextResponse.json(
                { error: parsed.error.issues[0].message },
                { status: 400 }
            );
        }

        await connectDB();

        const feedback = await Feedback.create({
            userId: session.user.id,
            name: session.user.name,
            rating: parsed.data.rating,
            comment: parsed.data.comment,
        });

        return NextResponse.json(feedback, { status: 201 });
    } catch (error) {
        console.error("Feedback Error:", error);
        return NextResponse.json(
            { error: "Failed to submit feedback" },
            { status: 500 }
        );
    }
}
