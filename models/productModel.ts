import { Document, Schema, model } from "mongoose";

interface Product {
  productId: string;
  name: string;
  description: string;
  price: number;
  stock: number;
  imagePath: string;
  isAvailable: boolean;
}

interface ProductDoc extends Product, Document {}

const productSchema = new Schema<ProductDoc>(
  {
    productId: { type: String, unique: true },
    name: { type: String, required: true, unique: true },
    description: { type: String, required: true },
    price: { type: Number, required: true, min: 0 },
    stock: { type: Number, required: true, min: -1 },
    imagePath: { type: String, required: true },
    isAvailable: { type: Boolean, default: true },
  },
  {
    timestamps: true,
  }
);

const Product = model<ProductDoc>("Product", productSchema);
export default Product;
