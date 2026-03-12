import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import connectDB from "@/lib/db";
import Temple from "@/models/Temple";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { templeSchema } from "@/lib/validators/temple";

export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session || session.user.role !== "admin") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    await connectDB();
    const temples = await Temple.find().sort({ createdAt: -1 });

    return NextResponse.json(temples);
  } catch (error) {
    console.log("Admin Temple GET Error:", error);
    return NextResponse.json({ error: "Server Error" }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session || session.user.role !== "admin") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();
    const validatedData = templeSchema.parse(body);

    await connectDB();
    const temple = await Temple.create(validatedData);

    return NextResponse.json({
      success: true,
      data: temple,
    });
  } catch (error) {
    console.log("Admin Temple POST Error:", error);

    if (error instanceof Error && "name" in error && error.name === "ZodError") {
      const zodError = error as unknown as { errors: { message: string }[] };
      return NextResponse.json(
        { error: zodError.errors[0].message },
        { status: 400 }
      );
    }

    return NextResponse.json({ error: "Server Error" }, { status: 500 });
  }
}
