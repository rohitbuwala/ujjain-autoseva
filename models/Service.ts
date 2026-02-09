import mongoose, { Schema } from "mongoose";

const ServiceSchema = new Schema(
  {
    /* OLD FIELDS (Safe – already used) */
    from: {
      type: String,
      default: "",
    },

    to: {
      type: String,
      default: "",
    },

    type: {
      type: String, // taxi | darshan | tour
      enum: ["taxi", "darshan", "tour"],
      default: "taxi",
    },

    distance: {
      type: String,
      default: "",
    },

    time: {
      type: String,
      default: "",
    },

    price: {
      type: Number,
      default: 0,
    },

    description: {
      type: String,
      default: "",
    },

    /* ✅ NEW FIELDS (For Admin Panel) */

    category: {
      type: String, // inside | outside
      enum: ["inside", "outside"],
      default: "inside",
    },

    route: {
      type: String,
      default: "", // "Station to Mahakal"
    },

    isActive: {
      type: Boolean,
      default: true, // enable / disable service
    },
  },

  { timestamps: true }
);

export default mongoose.models.Service ||
  mongoose.model("Service", ServiceSchema);
