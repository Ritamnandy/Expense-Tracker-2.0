
import { TransactionType } from "../constants.js";
interface DefaultCategory
{
    type: TransactionType,
    name: string,
    icon: string,
    isDefault: boolean
}


const DEFAULT_EXPENSE_CATEGORIES: DefaultCategory[] = [
    { name: "Food & Dining", icon: "🍔", type: TransactionType.EXPENSE, isDefault: true },
    { name: "Groceries", icon: "🛒", type: TransactionType.EXPENSE, isDefault: true },
    { name: "Transportation", icon: "🚗", type: TransactionType.EXPENSE, isDefault: true },
    { name: "Fuel", icon: "⛽", type: TransactionType.EXPENSE, isDefault: true },
    { name: "Shopping", icon: "🛍️", type: TransactionType.EXPENSE, isDefault: true },
    { name: "Entertainment", icon: "🎬", type: TransactionType.EXPENSE, isDefault: true },
    { name: "Bills & Utilities", icon: "💡", type: TransactionType.EXPENSE, isDefault: true },
    { name: "Rent", icon: "🏠", type: TransactionType.EXPENSE, isDefault: true },
    { name: "Healthcare", icon: "🏥", type: TransactionType.EXPENSE, isDefault: true },
    { name: "Education", icon: "📚", type: TransactionType.EXPENSE, isDefault: true },
    { name: "Travel", icon: "✈️", type: TransactionType.EXPENSE, isDefault: true },
    { name: "Insurance", icon: "🛡️", type: TransactionType.EXPENSE, isDefault: true },
    { name: "EMI / Loan", icon: "💳", type: TransactionType.EXPENSE, isDefault: true },
    { name: "Gifts & Donations", icon: "🎁", type: TransactionType.EXPENSE, isDefault: true },
    { name: "Personal Care", icon: "💇", type: TransactionType.EXPENSE, isDefault: true },
    { name: "Pets", icon: "🐶", type: TransactionType.EXPENSE, isDefault: true },
    { name: "Taxes", icon: "📄", type: TransactionType.EXPENSE, isDefault: true },
    { name: "Investments", icon: "📈", type: TransactionType.EXPENSE, isDefault: true },
    { name: "Miscellaneous", icon: "📦", type: TransactionType.EXPENSE, isDefault: true },
];

const DEFAULT_INCOME_CATEGORIES: DefaultCategory[] = [
    { name: "Salary", icon: "💼", type: TransactionType.INCOME, isDefault: true },
    { name: "Freelancing", icon: "💻", type: TransactionType.INCOME, isDefault: true },
    { name: "Business", icon: "🏢", type: TransactionType.INCOME, isDefault: true },
    { name: "Investment", icon: "📈", type: TransactionType.INCOME, isDefault: true },
    { name: "Interest", icon: "🏦", type: TransactionType.INCOME, isDefault: true },
    { name: "Bonus", icon: "🎉", type: TransactionType.INCOME, isDefault: true },
    { name: "Gift Received", icon: "🎁", type: TransactionType.INCOME, isDefault: true },
    { name: "Rental Income", icon: "🏠", type: TransactionType.INCOME, isDefault: true },
    { name: "Refund", icon: "💰", type: TransactionType.INCOME, isDefault: true },
    { name: "Other Income", icon: "💵", type: TransactionType.INCOME, isDefault: true },
];

export const DEFAULT_CATEGORIES: DefaultCategory[] = [
    ...DEFAULT_EXPENSE_CATEGORIES,
    ...DEFAULT_INCOME_CATEGORIES,
];
