import mongoose, { Schema, models, model } from "mongoose";

const BookingSchema = new Schema(
  {
    mandir: [String],

    date: String,

    pickup: String,
    drop: String,

    carType: String,

    price: Number,

    status: {
      type: String,
      default: "pending",
    },
  },
  { timestamps: true }
);

const Booking = models.Booking || model("Booking", BookingSchema);

export default Booking;
