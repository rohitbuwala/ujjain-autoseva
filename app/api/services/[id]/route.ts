import { NextResponse } from "next/server";
import connectDB from "@/lib/db";
import Service from "@/models/Service";
import { updateServiceSchema } from "@/lib/validators/service";

export async function GET(
  req: Request,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await context.params;

    await connectDB();

    const service = await Service.findById(id);

    if (!service) {
      return NextResponse.json(
        { error: "Service not found" },
        { status: 404 }
      );
    }

    return NextResponse.json(service);

  } catch (err) {
    console.error(err);

    return NextResponse.json(
      { error: "Failed to load service" },
      { status: 500 }
    );
  }
}

export async function PUT(
  req: Request,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await context.params;

    await connectDB();

    const body = await req.json();

    const parsed = updateServiceSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.issues[0].message },
        { status: 400 }
      );
    }

    const updated = await Service.findByIdAndUpdate(
      id,
      parsed.data,
      { new: true }
    );

    if (!updated) {
      return NextResponse.json(
        { error: "Service not found" },
        { status: 404 }
      );
    }

    return NextResponse.json(updated);

  } catch (err) {
    console.error(err);

    return NextResponse.json(
      { error: "Update failed" },
      { status: 500 }
    );
  }
}
