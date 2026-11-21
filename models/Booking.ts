import mongoose, { Schema } from "mongoose";

const deliverySchema = new Schema({
  eventKey: { type: String, required: true }, recipientId: { type: String, required: true },
  audience: { type: String, enum: ["customer", "admin"], required: true },
  type: { type: String, required: true }, title: { type: String, required: true },
  message: { type: String, required: true }, bookingId: { type: String, required: true },
  state: { type: String, enum: ["pending", "delivered", "skipped", "review"], required: true },
  attempts: { type: Number, required: true }, nextAt: { type: Date, required: true },
  leaseToken: String, leaseUntil: Date,
}, { _id: false });

const bookingSchema = new mongoose.Schema({
  notificationOutbox: { type: [deliverySchema], default: undefined, select: false },

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

  email: {
    type: String,
    default: "",
    lowercase: true,
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

  // Reference to Route document (only for fixed-package bookings)
  routeId: {
    type: Schema.Types.ObjectId,
    ref: "Route",
    default: null,
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

  // Payment Status
  paymentMethod: {
    type: String,
    enum: ["none", "online", "cash"],
    default: "none",
  },
  paymentStatus: {
    type: String,
    enum: [
      "not_required",
      "payment_pending",
      "online_order_created",
      "paid",
      "cash_pending",
      "cash_collected",
      "failed",
    ],
    default: "not_required",
  },
  paymentAmount: {
    type: Number,
    default: 0,
    min: 0,
  },
  paymentCurrency: {
    type: String,
    default: "INR",
  },
  paymentDueAt: {
    type: Date,
  },
  paidAt: {
    type: Date,
  },
  razorpayOrderId: {
    type: String,
    default: "",
  },
  razorpayPaymentId: {
    type: String,
    default: "",
  },
  lastFailedPaymentId: { type: String, select: false },
  lastFailedPaymentAt: { type: Date, select: false },
  paymentReviewRequired: { type: Boolean, default: false },
  reconciliationNextAt: { type: Date, select: false },
  reconciliationAttempts: { type: Number, select: false },
  reconciliationLeaseToken: { type: String, select: false },
  reconciliationLeaseExpiresAt: { type: Date, select: false },
  reconciliationLastResult: { type: String, select: false },
  reconciliationLastError: { type: String, select: false },
  reconciliationNeedsReview: { type: Boolean, select: false },

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
bookingSchema.index({ routeId: 1 }, { sparse: true });
bookingSchema.index({ paymentMethod: 1, reconciliationNextAt: 1, _id: 1 });
bookingSchema.index({ paymentMethod: 1, paymentStatus: 1, reconciliationNextAt: 1, reconciliationLastResult: 1 });

export default mongoose.models.Booking ||
  mongoose.model("Booking", bookingSchema);
