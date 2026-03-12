import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import connectDB from "@/lib/db";
import Temple from "@/models/Temple";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { templeUpdateSchema } from "@/lib/validators/temple";

export async function PATCH(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session || session.user.role !== "admin") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;
    const body = await req.json();
    const validatedData = templeUpdateSchema.parse(body);

    await connectDB();
    const temple = await Temple.findByIdAndUpdate(
      id,
      validatedData,
      { new: true }
    );

    if (!temple) {
      return NextResponse.json({ error: "Temple not found" }, { status: 404 });
    }

    return NextResponse.json({
      success: true,
      data: temple,
    });
  } catch (error) {
    console.log("Admin Temple PATCH Error:", error);

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

export async function DELETE(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session || session.user.role !== "admin") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;

    await connectDB();
    const temple = await Temple.findByIdAndDelete(id);

    if (!temple) {
      return NextResponse.json({ error: "Temple not found" }, { status: 404 });
    }

    return NextResponse.json({
      success: true,
      message: "Temple deleted successfully",
    });
  } catch (error) {
    console.log("Admin Temple DELETE Error:", error);
    return NextResponse.json({ error: "Server Error" }, { status: 500 });
  }
}
