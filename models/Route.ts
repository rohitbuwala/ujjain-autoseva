import { Schema, model, models } from "mongoose";

const RouteSchema = new Schema({
  routeName: {
    type: String,
    required: true,
    trim: true,
    unique: true
  },
  slug: {
    type: String,
    unique: true,
    sparse: true,
    default: ""
  },
  templeList: [{
    type: Schema.Types.ObjectId,
    ref: "Temple"
  }],
  totalPrice: {
    type: Number,
    required: true,
    min: 0
  },
  packageType: {
    type: String,
    enum: ["CITY_TOUR", "FIVE_TEMPLE", "city-tour", "five", ""],
    default: ""
  },
  category: {
    type: String,
    enum: ["inside", "outside", "custom"],
    default: "inside"
  },
  description: {
    type: String,
    default: ""
  },
  activeStatus: {
    type: Boolean,
    default: true
  },
  displayOrder: {
    type: Number,
    default: 0
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
});

const Route = models.Route || model("Route", RouteSchema);

export default Route;
