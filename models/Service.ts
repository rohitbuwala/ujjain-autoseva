import mongoose, { Schema } from "mongoose";

const ServiceSchema = new Schema(
  {
    from: String,
    to: String,

    type: {
      type: String, // taxi | darshan | tour
      enum: ["taxi", "darshan", "tour"],
    },

    distance: String,
    time: String,

    price: Number,

    description: String,
  },
  { timestamps: true }
);

export default mongoose.models.Service ||
  mongoose.model("Service", ServiceSchema);
