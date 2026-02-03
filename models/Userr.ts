import mongoose, {Schema, Document, Model} from "mongoose";
import { string } from "zod";


const UserSchema = new Schema({
    name: {
        type: String,
        required: true
    },
    email: {
        type: string,
        required: true
    },
    password: {
        type: string,
        required: true
    }
},{
    timestamps: true})

 const User = mongoose.models.User || mongoose.model("User", UserSchema)

 export default User;