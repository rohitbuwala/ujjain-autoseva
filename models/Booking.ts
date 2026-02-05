// import mongoose from "mongoose";

// const BookingSchema = new mongoose.Schema({
//   userId: {
//     type: mongoose.Schema.Types.ObjectId,
//     ref: "User",
//   },

//   name: String,
//   phone: String,
//   email: String,

//   from: String,
//   to: String,

//   date: String,
//   time: String,

//   status: {
//     type: String,
//     default: "pending", // pending | confirmed | completed
//   },

// }, { timestamps: true });

// export default mongoose.models.Booking ||
//   mongoose.model("Booking", BookingSchema);

import mongoose from "mongoose";

const BookingSchema = new mongoose.Schema(
  {
    userId: String,
    name: String,
    email: String,

    route: String,
    time: String,
    price: String,

    status: {
      type: String,
      default: "pending",
    },
  },
  { timestamps: true }
);

export default mongoose.models.Booking ||
  mongoose.model("Booking", BookingSchema);

