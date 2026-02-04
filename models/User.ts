import mongoose, { Schema } from "mongoose";
import { TUser } from "@/types/User";

const UserSchema = new Schema<TUser>(
  {
    name: {
      type: String,
      required: true,
      trim: true,
    },

    email: {
      type: String, // ✅ Capital S
      required: true,
      unique: true,
      lowercase: true,
    },

    password: {
      type: String, // ✅ Capital S
      required: true,
      minlength: 6,
    },

    role: {
      type: String,
      default: "user",
    },
  },
  {
    timestamps: true,
  }
);

const User =
  mongoose.models.User ||
  mongoose.model<TUser>("User", UserSchema);

export default User;
