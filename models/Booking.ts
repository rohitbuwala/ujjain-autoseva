import mongoose from "mongoose";

const bookingSchema = new mongoose.Schema({

  // Professional Booking ID (e.g., UA-12345)
  bookingId: {
    type: String,
    required: true,
    unique: true,
  },

  // Logged in user
  userId: {
    type: String,
    required: true,
  },

  // User Personal Info
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

  // Ride Details
  pickup: {
    type: String,
    required: true,
  },

  drop: {
    type: String,
    required: true,
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

  route: {
    type: String,
    required: true,
  },

  // Booking Status
  status: {
    type: String,
    enum: ["pending", "confirmed", "rejected"],
    default: "pending",
  },

  // Admin Note (optional future use)
  adminNote: {
    type: String,
    default: "",
  },

  createdAt: {
    type: Date,
    default: Date.now,
  },

});

export default mongoose.models.Booking ||
  mongoose.model("Booking", bookingSchema);
