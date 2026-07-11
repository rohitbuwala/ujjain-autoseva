import { NextResponse } from "next/server";
import connectDB from "@/lib/db";
import PricingConfiguration from "@/models/PricingConfiguration";
import Route from "@/models/Route";
import { requireAdminSession } from "@/lib/auth-utils";
import { pricingConfigurationSchema } from "@/lib/validators/pricing-configuration";

const CONFIG_KEY = "pricing-page";

function isLegacyDocument(
  doc: Record<string, unknown>
): doc is { cards: Array<{ route: unknown; visible?: boolean }> } {
  return Array.isArray(doc.cards) && !Array.isArray(doc.slots);
}

async function migrateLegacyConfig(doc: { _id: unknown }) {
  const legacy = doc as unknown as {
    cards: Array<{ route: unknown; visible?: boolean }>;
  };

  const slots = legacy.cards.map((card, index) => ({
    key: `slot-${index + 1}`,
    route: card.route,
    enabled: card.visible ?? true,
  }));

  return PricingConfiguration.findByIdAndUpdate(
    doc._id,
    { $set: { slots }, $unset: { cards: "" } },
    { new: true }
  );
}

export async function GET() {
  try {
    const { response } = await requireAdminSession();
    if (response) return response;

    await connectDB();

    let config = await PricingConfiguration.findOne({ key: CONFIG_KEY }).lean();

    if (!config) {
      const created = await PricingConfiguration.create({
        key: CONFIG_KEY,
        slots: [],
      });
      config = await PricingConfiguration.findById(created._id).lean();
    }

    if (config && isLegacyDocument(config as Record<string, unknown>)) {
      await migrateLegacyConfig(config as { _id: unknown });
      config = await PricingConfiguration.findOne({ key: CONFIG_KEY })
        .populate(
          "slots.route",
          "routeName totalPrice packageType activeStatus"
        )
        .lean();
    } else {
      config = await PricingConfiguration.findOne({ key: CONFIG_KEY })
        .populate(
          "slots.route",
          "routeName totalPrice packageType activeStatus"
        )
        .lean();
    }

    return NextResponse.json({ data: config });
  } catch (error) {
    console.error("ADMIN PRICING CONFIG GET ERROR:", error);
    return NextResponse.json({ error: "Server Error" }, { status: 500 });
  }
}

export async function PUT(req: Request) {
  try {
    const { response } = await requireAdminSession();
    if (response) return response;

    const body = await req.json();

    const parsed = pricingConfigurationSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.issues[0].message },
        { status: 400 }
      );
    }

    await connectDB();

    const routeIds = parsed.data.slots
      .map((s) => s.route)
      .filter((r): r is string => r !== null);

    if (routeIds.length > 0) {
      const existingRoutes = await Route.find({
        _id: { $in: routeIds },
      }).select("_id");

      if (existingRoutes.length !== routeIds.length) {
        const foundIds = new Set(
          existingRoutes.map((r) => r._id.toString())
        );
        const missing = routeIds.filter((id) => !foundIds.has(id));
        return NextResponse.json(
          { error: `Routes not found: ${missing.join(", ")}` },
          { status: 400 }
        );
      }
    }

    const config = await PricingConfiguration.findOneAndUpdate(
      { key: CONFIG_KEY },
      { slots: parsed.data.slots },
      { new: true, upsert: true }
    ).populate(
      "slots.route",
      "routeName totalPrice packageType activeStatus"
    );

    return NextResponse.json({ data: config });
  } catch (error) {
    console.error("ADMIN PRICING CONFIG PUT ERROR:", error);
    return NextResponse.json({ error: "Server Error" }, { status: 500 });
  }
}
