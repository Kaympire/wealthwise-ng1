export const EXPENSE_CATEGORIES = [
  'Food',
  'Transport',
  'Rent',
  'Utilities',
  'Airtime/Data',
  'Shopping',
  'Health',
  'Education',
  'Entertainment',
  'Other',
]

export const INCOME_CATEGORIES = ['Salary', 'Freelance', 'Business', 'Gift', 'Other']

export const ALL_CATEGORIES = Array.from(
  new Set([...EXPENSE_CATEGORIES, ...INCOME_CATEGORIES])
)
