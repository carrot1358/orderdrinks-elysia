import { Document, Schema, model } from "mongoose";

interface OrderProduct {
  productId: string;
  quantity: number;
}

interface Order {
  orderId: string;
  userId: string;
  products: OrderProduct[];
  totalPrice: number;
  methodPaid: "cash" | "promptpay";
  statusPaid: "paid" | "not_paid" | "check_paid" | "wait_paid" | "error";
  deliverStatus: "pending" | "delivering" | "delivered" | "cancel";
  slipImage?: string;
  deliver_image_path?: string;
  bottle_image_path?: string;
  bottle_count?: number;
  time_completed?: string;
  latitude?: number;
  longitude?: number;
  distance?: number;
  deviceId?: string;
  notifiedDistances?: number[];
}

interface OrderDoc extends Order, Document {}

const orderSchema = new Schema<OrderDoc>(
  {
    orderId: { type: String, unique: true },
    userId: { type: String, ref: "User", required: true },
    products: [
      {
        productId: { type: String, ref: "Product", required: true },
        quantity: { type: Number, required: true, min: 1 },
      },
    ],
    totalPrice: { type: Number, required: true, min: 0 },
    methodPaid: { type: String, enum: ["cash", "promptpay"], required: true },
    statusPaid: {
      type: String,
      enum: ["paid", "wait_paid", "check_paid", "not_paid", "error"],
      required: true,
      default: "not_paid",
    },
    deliverStatus: {
      type: String,
      enum: ["pending", "delivering", "delivered", "cancel"],
      required: true,
      default: "pending",
    },
    slipImage: { type: String },
    bottle_count: { type: Number },
    time_completed: { type: String },
    latitude: { type: Number },
    longitude: { type: Number },
    distance: { type: Number },
    deviceId: { type: String, ref: "Device" },
    bottle_image_path: { type: String },
    deliver_image_path: { type: String },
    notifiedDistances: { type: [Number] },
  },
  {
    timestamps: true,
  }
);

const Order = model<OrderDoc>("Order", orderSchema);
export default Order;
