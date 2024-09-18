import mongoose, { Document, Schema } from "mongoose";

interface IFilterRefill {
  iodine: boolean;
  carbon: boolean;
  resin: boolean;
  manganese: boolean;
  sodaAsh: boolean;
  other: string;
  date: Date;
}

interface IFilterRefillModel extends IFilterRefill, Document {}

const filterRefillSchema = new Schema<IFilterRefillModel>(
  {
    iodine: { type: Boolean, required: true },
    carbon: { type: Boolean, required: true },
    resin: { type: Boolean, required: true },
    manganese: { type: Boolean, required: true },
    sodaAsh: { type: Boolean, required: true },
    other: { type: String },
    date: { type: Date, required: true },
  },
  {
    timestamps: true,
  }
);

const FilterRefill = mongoose.model<IFilterRefillModel>(
  "FilterRefill",
  filterRefillSchema
);

export default FilterRefill;
