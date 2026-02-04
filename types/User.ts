import { Document } from "mongoose";

export interface TUser extends Document {
  name: string;
  email: string;
  password: string;
  role?: "user" | "admin" | "driver";
}
