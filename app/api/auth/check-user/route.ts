import { NextResponse } from "next/server";
import connectDB from "@/lib/db";
import User from "@/models/User";

export async function POST(req: Request) {

  const { email } = await req.json();

  await connectDB();

  const user = await User.findOne({
    email: email.toLowerCase().trim(),
  });

  if (!user) {
    return NextResponse.json(
      { exists: false },
      { status: 404 }
    );
  }

  return NextResponse.json({
    exists: true,
  });
}
