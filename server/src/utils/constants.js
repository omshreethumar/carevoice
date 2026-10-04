const CATEGORIES = [
  'Food',
  'Transport',
  'Shopping',
  'Entertainment',
  'Education',
  'Bills',
  'Healthcare',
  'Rent',
  'Travel',
  'Subscriptions',
  'Salary',
  'Freelance',
  'Business',
  'Other',
];

const EXPENSE_CATEGORIES = CATEGORIES.filter(
  (c) => !['Salary', 'Freelance', 'Business'].includes(c)
);

const INCOME_CATEGORIES = ['Salary', 'Freelance', 'Business', 'Other'];

const PAYMENT_METHODS = ['CASH', 'UPI', 'CARD', 'BANK_TRANSFER', 'OTHER'];

const CATEGORY_RULES = [
  { pattern: /swiggy|zomato|foodpanda|dominos|pizza|cafe|restaurant|starbucks|mcdonald|kfc|biryani|meal/i, category: 'Food' },
  { pattern: /uber|ola|rapido|metro|irctc|fuel|petrol|diesel|parking|bus|train/i, category: 'Transport' },
  { pattern: /amazon|flipkart|myntra|ajio|nykaa|ikea|mall/i, category: 'Shopping' },
  { pattern: /netflix|spotify|hotstar|prime video|youtube premium|disney|subscription/i, category: 'Subscriptions' },
  { pattern: /movie|pvr|inox|bookmyshow|concert|game|steam/i, category: 'Entertainment' },
  { pattern: /udemy|coursera|byju|unacademy|college|tuition|book/i, category: 'Education' },
  { pattern: /electricity|wifi|broadband|airtel|jio|vodafone|water bill|gas/i, category: 'Bills' },
  { pattern: /pharmacy|apollo|1mg|hospital|clinic|doctor|dental/i, category: 'Healthcare' },
  { pattern: /rent|landlord|housing/i, category: 'Rent' },
  { pattern: /makemytrip|goibibo|airbnb|indigo|air india|hotel|flight/i, category: 'Travel' },
  { pattern: /salary|payroll|stipend/i, category: 'Salary' },
  { pattern: /freelance|upwork|fiverr|client payment/i, category: 'Freelance' },
];

function categorizeDescription(description, type) {
  const text = String(description || '');
  const match = CATEGORY_RULES.find((rule) => rule.pattern.test(text));
  if (match) return match.category;
  return type === 'INCOME' ? 'Other' : 'Other';
}

module.exports = {
  CATEGORIES,
  EXPENSE_CATEGORIES,
  INCOME_CATEGORIES,
  PAYMENT_METHODS,
  CATEGORY_RULES,
  categorizeDescription,
};
