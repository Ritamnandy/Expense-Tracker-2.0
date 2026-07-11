
import mongoose, { Model, type HydratedDocument, Schema, Types } from "mongoose";

interface ICategory
{
    ownerId: Types.ObjectId
    name: string
    icon: string

}

export type CategoryDocument = HydratedDocument<ICategory>

type CategoryModel = Model<ICategory>


const categorySchema = new Schema<ICategory, CategoryModel>(
    {
        name: {
            type: String,
            required: true,
            trim: true,
            lowercase: true,
            unique: true,
        },
        icon: {
            type: String,
            required: true,
            trim: true,
        },
        ownerId: {
            type: Schema.Types.ObjectId,
            ref: "User",
            required: true,
        },

    }, { timestamps: true }
)

export const Category = mongoose.model<ICategory, CategoryModel>( "Category", categorySchema )