import { Document, Schema, model } from "mongoose";

interface User {
  userId: string;
  name: string;
  lineName: string;
  email: string;
  password: string;
  address: string;
  phone: string;
  lng: number;
  lat: number;
  isAdmin: boolean;
  role: "admin" | "driver" | "manager" | "user";
  lineId: string;
  avatar: string;
  lineAvatar: string;
  passwordConfirmExisted: string;
}

interface UserDoc extends User, Document {
  mathPassword: (pass: string) => Promise<boolean>;
}

const userSchema = new Schema<UserDoc>(
  {
    userId: { type: String, unique: true },
    phone: { type: String, required: true },
    password: { type: String, required: true },
    name: { type: String },
    lineName: { type: String },
    email: { type: String },
    isAdmin: { type: Boolean, default: false },
    role: {
      type: String,
      required: true,
      enum: ["admin", "driver", "manager", "user"],
      default: "user",
    },
    lineId: { type: String },
    avatar: { type: String },
    lineAvatar: { type: String },
    address: { type: String },
    lng: { type: Number },
    lat: { type: Number },
    passwordConfirmExisted: { type: String },
  },
  {
    timestamps: true,
  }
);

// Match user entered password to hashed password in database
userSchema.methods.mathPassword = async function (enteredPassword: string) {
  return Bun.password.verifySync(enteredPassword, this.password);
};

// Hash password with Bun
userSchema.pre("save", async function (next) {
  if (!this.isModified("password")) {
    next();
  }

  // use bcrypt
  this.password = await Bun.password.hash(this.password, {
    algorithm: "bcrypt",
    cost: 4, // number between 4-31
  });
});

const User = model<UserDoc>("User", userSchema);
export default User;
