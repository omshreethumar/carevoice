const OpenAI = require('openai');

function getClient() {
  const key = process.env.OPENAI_API_KEY;
  if (!key) return null;
  const Client = OpenAI.OpenAI || OpenAI;
  return new Client({ apiKey: key });
}

function compactSnapshot(snap) {
  return {
    currency: snap.user.currency,
    name: snap.user.name,
    monthlyIncomeTarget: snap.user.monthlyIncomeTarget,
    monthlySavingsTarget: snap.user.monthlySavingsTarget,
    financialGoal: snap.user.financialGoal,
    thisMonth: {
      income: snap.thisMonth.income,
      expenses: snap.thisMonth.expenses,
      savings: snap.thisMonth.savings,
    },
    lastMonth: {
      income: snap.lastMonth.income,
      expenses: snap.lastMonth.expenses,
      savings: snap.lastMonth.savings,
    },
    lifetimeBalance: snap.lifetime.balance,
    savingsRate: Math.round(snap.savingsRate * 10) / 10,
    categoriesThisMonth: snap.categoryThis,
    categoriesLastMonth: snap.categoryLast,
    budgets: snap.budgetUsage,
    goals: snap.goals.map((g) => ({
      name: g.name,
      target: g.targetAmount,
      saved: g.currentAmount,
      progress: Math.round(g.progress * 10) / 10,
      targetDate: g.targetDate,
    })),
    upcomingBills: snap.upcomingBills.map((b) => ({
      name: b.name,
      amount: b.amount,
      dueDate: b.dueDate,
      status: b.status,
    })),
    upcomingBillsTotal: snap.upcomingBillsTotal,
    emergencyFund: snap.emergency,
  };
}

async function chatWithPocketAI(userId, message, conversationId) {
  const client = getClient();
  if (!client) {
    throw new AppError(
      'AI is not configured. Set OPENAI_API_KEY on the server to enable Pocket AI.',
      503,
      'AI_UNAVAILABLE'
    );
  }

  const snap = await buildFinanceSnapshot(userId);
  const health = computeHealthScore(snap);
  const context = compactSnapshot(snap);

  let conversation;
  if (conversationId) {
    conversation = await prisma.aIConversation.findFirst({
      where: { id: conversationId, userId },
      include: { messages: { orderBy: { createdAt: 'asc' }, take: 20 } },
    });
  }
  if (!conversation) {
    conversation = await prisma.aIConversation.create({
      data: { userId, title: message.slice(0, 60) },
      include: { messages: true },
    });
  }

  const system = `You are Pocket AI, a helpful personal finance assistant for students and young professionals with irregular income.
Use ONLY the user's financial data provided in the JSON context. Do not invent transactions, balances, or percentages.
If data is missing, say so clearly.
Be concise, specific, and educational.
Never present investment or financial guidance as a guaranteed outcome.
Include a brief disclaimer when discussing affordability, investments, or long-term planning: this is educational and not professional financial advice.
Currency is ${context.currency}. Format money in that currency.
Financial health score (educational only): ${health.score}/100.

User financial context JSON:
${JSON.stringify(context)}`;

  const history = (conversation.messages || []).map((m) => ({
    role: m.role,
    content: m.content,
  }));

  try {
    const completion = await client.chat.completions.create({
      model: process.env.OPENAI_MODEL || 'gpt-4o-mini',
      temperature: 0.4,
      messages: [
        { role: 'system', content: system },
        ...history,
        { role: 'user', content: message },
      ],
    });
    const reply = completion.choices[0]?.message?.content?.trim() || 'I could not generate a response.';

    await prisma.aIMessage.create({
      data: { conversationId: conversation.id, role: 'user', content: message },
    });
    await prisma.aIMessage.create({
      data: { conversationId: conversation.id, role: 'assistant', content: reply },
    });

    return {
      conversationId: conversation.id,
      reply,
      disclaimer: 'Pocket AI is educational only and is not professional financial advice.',
    };
  } catch (err) {
    console.error('OpenAI error', err?.message);
    throw new AppError(
      'The AI service is temporarily unavailable. Please try again later.',
      503,
      'AI_FAILURE'
    );
  }
}

async function extractReceiptWithVision(fileBuffer, mimeType) {
  const client = getClient();
  if (!client) return null;
  const b64 = fileBuffer.toString('base64');
  const completion = await client.chat.completions.create({
    model: process.env.OPENAI_MODEL || 'gpt-4o-mini',
    temperature: 0,
    response_format: { type: 'json_object' },
    messages: [
      {
        role: 'system',
        content:
          'Extract receipt fields as JSON: merchantName, amount (number), date (YYYY-MM-DD or null), items (array of {name, amount}), suggestedCategory (one of Food, Transport, Shopping, Entertainment, Education, Bills, Healthcare, Rent, Travel, Subscriptions, Other).',
      },
      {
        role: 'user',
        content: [
          { type: 'text', text: 'Extract the receipt data.' },
          {
            type: 'image_url',
            image_url: { url: `data:${mimeType};base64,${b64}` },
          },
        ],
      },
    ],
  });
  return JSON.parse(completion.choices[0].message.content);
}

module.exports = { chatWithPocketAI, extractReceiptWithVision, getClient };
