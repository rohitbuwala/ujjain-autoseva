import mongoose from "mongoose";
import dotenv from "dotenv";

dotenv.config();

const MONGODB_URI = process.env.MONGODB_URI as string;

const TempleSchema = new mongoose.Schema({
  name: { type: String, required: true },
  category: { type: String, enum: ["inside", "outside", "custom"], default: "inside" },
  basePrice: { type: Number, default: 0 },
  price: { type: Number, default: 0 },
  activeStatus: { type: Boolean, default: true },
  displayOrder: { type: Number, default: 0 },
});

const RouteSchema = new mongoose.Schema({
  routeName: { type: String, required: true, unique: true },
  templeList: [{ type: mongoose.Schema.Types.ObjectId, ref: "Temple" }],
  totalPrice: { type: Number, required: true },
  category: { type: String, enum: ["inside", "outside", "custom"], default: "inside" },
  activeStatus: { type: Boolean, default: true },
  displayOrder: { type: Number, default: 0 },
});

const Temple = mongoose.models.Temple || mongoose.model("Temple", TempleSchema);
const Route = mongoose.models.Route || mongoose.model("Route", RouteSchema);

async function seed() {
  if (!MONGODB_URI) {
    console.error("MONGODB_URI not found");
    process.exit(1);
  }

  console.log("Connecting to MongoDB...");
  await mongoose.connect(MONGODB_URI);
  console.log("Connected!");

  try {
    // Clear existing data
    await Route.deleteMany({});
    await Temple.deleteMany({});
    console.log("Cleared existing data");

    // Seed Temples
    const temples = await Temple.insertMany([
      { name: "Mahakaleshwar", category: "inside", basePrice: 150, price: 200, activeStatus: true, displayOrder: 1 },
      { name: "Kaal Bhairav", category: "inside", basePrice: 100, price: 150, activeStatus: true, displayOrder: 2 },
      { name: "Harsiddhi", category: "inside", basePrice: 80, price: 120, activeStatus: true, displayOrder: 3 },
      { name: "Ram Ghat", category: "inside", basePrice: 50, price: 80, activeStatus: true, displayOrder: 4 },
      { name: "Mangalnath", category: "inside", basePrice: 60, price: 100, activeStatus: true, displayOrder: 5 },
      { name: "Omkareshwar", category: "outside", basePrice: 800, price: 1000, activeStatus: true, displayOrder: 6 },
      { name: "Maheshwar", category: "outside", basePrice: 600, price: 800, activeStatus: true, displayOrder: 7 },
      { name: "Sandipani", category: "inside", basePrice: 50, price: 80, activeStatus: true, displayOrder: 8 },
    ]);
    console.log(`Seeded ${temples.length} temples`);

    // Seed Routes
    const routes = await Route.insertMany([
      {
        routeName: "Mahakal Darshan",
        category: "inside",
        totalPrice: 350,
        templeList: [temples[0]._id, temples[1]._id],
        activeStatus: true,
        displayOrder: 1
      },
      {
        routeName: "5 Temple Tour",
        category: "inside",
        totalPrice: 800,
        templeList: [temples[0]._id, temples[1]._id, temples[2]._id, temples[3]._id, temples[4]._id],
        activeStatus: true,
        displayOrder: 2
      },
      {
        routeName: "Full Ujjain Darshan",
        category: "inside",
        totalPrice: 1200,
        templeList: temples.slice(0, 5).map(t => t._id),
        activeStatus: true,
        displayOrder: 3
      },
      {
        routeName: "Omkareshwar Trip",
        category: "outside",
        totalPrice: 2500,
        templeList: [temples[5]._id],
        activeStatus: true,
        displayOrder: 4
      },
      {
        routeName: "Omkareshwar + Maheshwar",
        category: "outside",
        totalPrice: 3500,
        templeList: [temples[5]._id, temples[6]._id],
        activeStatus: true,
        displayOrder: 5
      },
    ]);
    console.log(`Seeded ${routes.length} routes`);

    console.log("✅ Seed completed successfully!");
  } catch (error) {
    console.error("Seed error:", error);
  } finally {
    await mongoose.disconnect();
    console.log("Disconnected");
  }
}

seed();
