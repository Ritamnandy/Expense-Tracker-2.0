
const dbName = "expense-tracker"

enum User_LoginType
{
    GOOGLE = "google",
    EMAIL_PASSWORD = "email"
}

enum TransactionType
{
    INCOME = "income",
    EXPENSE = "expense"
}

enum PaymentMethod
{
    CASH = "cash",
    UPI = "upi",
    CREDIT_CARD = "credit_card",
    DEBIT_CARD = "debit_card",
    NET_BANKING = "net_banking",
    CHEQUE = "cheque",
    WALLET = "wallet",
    BANK_TRANSFER = "bank_transfer",
    AUTO_DEBIT = "auto_debit",
    OTHER = "other",
}






export { User_LoginType, TransactionType,PaymentMethod, dbName }