import { Schema, model, models } from "mongoose";

const PricingSlotSchema = new Schema(
  {
    key: {
      type: String,
      required: true,
    },
    route: {
      type: Schema.Types.ObjectId,
      ref: "Route",
      required: true,
    },
    enabled: {
      type: Boolean,
      default: true,
    },
  },
  { _id: false }
);

const PricingConfigurationSchema = new Schema(
  {
    key: {
      type: String,
      required: true,
      unique: true,
      immutable: true,
      default: "pricing-page",
    },
    slots: {
      type: [PricingSlotSchema],
      default: [],
    },
  },
  { timestamps: true }
);

const PricingConfiguration =
  models.PricingConfiguration ||
  model("PricingConfiguration", PricingConfigurationSchema);

export default PricingConfiguration;
