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
    default: "",
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
    default: "",
  },

  // Custom Booking Fields
  packageType: {
    type: String,
    default: "",
  },
  packageName: {
    type: String,
    default: "",
  },
  temples: [{
    _id: String,
    name: String,
    price: Number,
  }],
  selectedTemples: {
    type: [String],
    default: [],
  },
  notes: {
    type: String,
    default: "",
  },
  hotel: {
    type: Boolean,
    default: false,
  },

  // Booking Status
  status: {
    type: String,
    enum: ["pending", "confirmed", "rejected", "cancelled"],
    default: "pending",
  },

  // Cancellation Info
  cancelledAt: {
    type: Date,
  },
  cancelReason: {
    type: String,
    default: "",
  },
  cancelledBy: {
    type: String,
    enum: ["user", "admin"],
  },

  // Admin Note (optional future use)
  adminNote: {
    type: String,
    default: "",
  },
  
  driverName: {
    type: String,
    default: "",
  },

  driverPhone: {
    type: String,
    default: "",
  },

  createdAt: {
    type: Date,
    default: Date.now,
  },

});

bookingSchema.index({ userId: 1 });
bookingSchema.index({ status: 1 });
bookingSchema.index({ createdAt: -1 });

bookingSchema.index({ date: 1 });
bookingSchema.index({ phone: 1 });

export default mongoose.models.Booking ||
  mongoose.model("Booking", bookingSchema);
