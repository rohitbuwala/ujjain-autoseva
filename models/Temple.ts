import mongoose, { Schema, model, models } from "mongoose";

const TempleSchema = new Schema({
  name: {
    type: String,
    required: true,
    trim: true,
  },
  category: {
    type: String,
    enum: ["inside", "outside", "custom"],
    default: "inside",
    required: true,
  },
  basePrice: {
    type: Number,
    required: true,
    min: 0,
    default: 0,
  },
  routeGroup: {
    type: String,
    default: "",
  },
  activeStatus: {
    type: Boolean,
    default: true,
  },
  displayOrder: {
    type: Number,
    default: 0,
  },
  description: {
    type: String,
    default: "",
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
});

const Temple = models.Temple || model("Temple", TempleSchema);

export default Temple;
