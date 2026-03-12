import mongoose, { Schema, model, models } from "mongoose";

const customBookingSchema = new Schema({
  bookingId: {
    type: String,
    required: true,
    unique: true,
  },
  userId: {
    type: String,
    default: "",
  },
  name: {
    type: String,
    required: true,
    trim: true,
  },
  phone: {
    type: String,
    required: true,
  },
  altPhone: {
    type: String,
    default: "",
  },
  temples: [{
    _id: { type: Schema.Types.ObjectId, ref: "Temple" },
    name: String,
    price: Number,
  }],
  pickup: {
    type: String,
    default: "Ujjain",
  },
  date: {
    type: String,
    required: true,
  },
  time: {
    type: String,
    required: true,
  },
  price: {
    type: String,
    required: true,
  },
  basePrice: {
    type: Number,
    default: 0,
  },
  templePrice: {
    type: Number,
    default: 0,
  },
  status: {
    type: String,
    enum: ["pending", "confirmed", "rejected"],
    default: "pending",
  },
  adminNote: {
    type: String,
    default: "",
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
});

const CustomBooking = models.CustomBooking || model("CustomBooking", customBookingSchema);

export default CustomBooking;
