
import mongoose, { Model, type HydratedDocument, Schema, Types } from "mongoose";
import { TransactionType } from "../constants.js";

interface ICategory
{
    ownerId: Types.ObjectId
    name: string
    icon: string
    type: TransactionType,
    isDefault: boolean

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
        },
        icon: {
            type: String,
            required: true,
            trim: true,
        },
        type: {
            type: String,
            enum: TransactionType,
            required: true
        },
        ownerId: {
            type: Schema.Types.ObjectId,
            ref: "User",
            required: true,
        },
        isDefault: {
            type: Boolean,
            default: false,
        },

    }, { timestamps: true }
)

categorySchema.index( { name: 1, ownerId: 1 }, { unique: true } )

export const Category = mongoose.model<ICategory, CategoryModel>( "Category", categorySchema )