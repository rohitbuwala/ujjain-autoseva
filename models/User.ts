import { Schema, model, models } from "mongoose";

const AuthProviderSchema = new Schema(
  {
    provider: {
      type: String,
      required: true,
      trim: true,
    },

    providerAccountId: {
      type: String,
      required: true,
      trim: true,
    },

    providerEmail: {
      type: String,
      default: "",
      lowercase: true,
      trim: true,
    },

    linkedAt: {
      type: Date,
      default: Date.now,
    },
  },
  {
    _id: false,
  }
);

const UserSchema = new Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true,
    },

    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
    },

    password: {
      type: String,
      required: true,
      minlength: 6,
    },

    role: {
      type: String,
      default: "user",
    },

    authProviders: {
      type: [AuthProviderSchema],
      default: [],
    },

    // ✅ Forgot Password ke liye
    resetToken: {
      type: String,
      default: null,
    },

    resetTokenExpiry: {
      type: Date,
      default: null,
    },

    // ✅ Email Verification
    verified: {
      type: Boolean,
      default: false,
    },

    verifyToken: {
      type: String,
      default: null,
    },

    verifyTokenExpiry: {
      type: Date,
      default: null,
    },
  },
  {
    timestamps: true,
  }
);

const User =
  models.User || model("User", UserSchema);

export default User;
