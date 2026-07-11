
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


export { User_LoginType, TransactionType, dbName }