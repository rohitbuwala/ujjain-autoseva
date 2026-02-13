import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";

import connectDB from "@/lib/db";
import User from "@/models/User";

import { registerSchema } from "@/lib/validators/auth";


export async function POST(req: Request) {

  try {

    const body = await req.json();


    /* ================= VALIDATE ================= */

    const data = registerSchema.parse(body);


    await connectDB();


    /* ================= CHECK DUPLICATE ================= */

    const exist = await User.findOne({
      email: data.email.toLowerCase(),
    });

    if (exist) {
      return NextResponse.json(
        { error: "EMAIL_EXISTS" },
        { status: 400 }
      );
    }



    /* ================= HASH ================= */

    const hash = await bcrypt.hash(data.password, 12);



    /* ================= CREATE ================= */

    await User.create({
      name: data.name.trim(),
      email: data.email.toLowerCase(),
      password: hash,
      role: "user",
      verified: false, // future email verify
    });



    return NextResponse.json({
      success: true,
      message: "Registered successfully",
    });


  } catch (err: any) {


    /* Zod Validation */
    if (err.name === "ZodError") {
      return NextResponse.json(
        { error: err.errors[0].message },
        { status: 400 }
      );
    }


    console.error("Register Error:", err);


    return NextResponse.json(
      { error: "Server error" },
      { status: 500 }
    );

  }

}
