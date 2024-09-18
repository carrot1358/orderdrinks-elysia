import mongoose, { Document, Schema } from "mongoose";

interface IFilterCleaning {
  cleaned: boolean;
  date: Date;
}

interface IFilterCleaningModel extends IFilterCleaning, Document {}

const filterCleaningSchema = new Schema<IFilterCleaningModel>(
  {
    cleaned: { type: Boolean, required: true },
    date: { type: Date, required: true },
  },
  {
    timestamps: true,
  }
);

const FilterCleaning = mongoose.model<IFilterCleaningModel>(
  "FilterCleaning",
  filterCleaningSchema
);

export default FilterCleaning;
