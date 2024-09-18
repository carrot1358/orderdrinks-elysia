import mongoose, { Document, Schema } from "mongoose";

interface IFilterChange {
  smallFilter: boolean;
  membraneFilter: boolean;
  other: string;
  date: Date;
}

interface IFilterChangeModel extends IFilterChange, Document {}

const filterChangeSchema = new Schema<IFilterChangeModel>(
  {
    smallFilter: { type: Boolean, required: true },
    membraneFilter: { type: Boolean, required: true },
    other: { type: String },
    date: { type: Date, required: true },
  },
  {
    timestamps: true,
  }
);

const FilterChange = mongoose.model<IFilterChangeModel>(
  "FilterChange",
  filterChangeSchema
);

export default FilterChange;
