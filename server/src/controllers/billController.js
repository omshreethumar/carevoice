const prisma = require('../lib/prisma');
const { AppError, asyncHandler } = require('../middleware/errorHandler');
const { serialize } = require('../utils/helpers');

function refreshStatus(bill) {
  if (bill.status === 'PAID') return 'PAID';
  const due = new Date(bill.dueDate);
  due.setHours(23, 59, 59, 999);
  return due < new Date() ? 'OVERDUE' : 'UPCOMING';
}

const list = asyncHandler(async (req, res) => {
  const rows = await prisma.bill.findMany({
    where: { userId: req.userId },
    orderBy: { dueDate: 'asc' },
  });
  const updated = [];
  for (const bill of rows) {
    const status = refreshStatus(bill);
    if (status !== bill.status) {
      updated.push(
        prisma.bill.update({ where: { id: bill.id }, data: { status } })
      );
    }
  }
  const fresh = updated.length ? await Promise.all(updated) : rows;
  const all = updated.length
    ? await prisma.bill.findMany({ where: { userId: req.userId }, orderBy: { dueDate: 'asc' } })
    : fresh;
  res.json({ success: true, data: serialize(all) });
});

const create = asyncHandler(async (req, res) => {
  const { name, amount, dueDate, category, recurring, frequency, notes } = req.body;
  if (!name) throw new AppError('Bill name is required.');
  const value = Number(amount);
  if (!Number.isFinite(value) || value <= 0) throw new AppError('Enter a valid amount.');
  if (!dueDate) throw new AppError('Due date is required.');
  const due = new Date(dueDate);
  const status = due < new Date() ? 'OVERDUE' : 'UPCOMING';
  const row = await prisma.bill.create({
    data: {
      userId: req.userId,
      name: String(name).trim(),
      amount: value,
      dueDate: due,
      category: category || 'Bills',
      recurring: Boolean(recurring),
      frequency: recurring ? frequency || 'MONTHLY' : null,
      status,
      notes: notes || null,
    },
  });
  res.status(201).json({ success: true, data: serialize(row) });
});

const update = asyncHandler(async (req, res) => {
  const existing = await prisma.bill.findFirst({ where: { id: req.params.id, userId: req.userId } });
  if (!existing) throw new AppError('Bill not found.', 404, 'NOT_FOUND');
  const data = {};
  ['name', 'category', 'notes'].forEach((k) => {
    if (req.body[k] !== undefined) data[k] = req.body[k];
  });
  if (req.body.amount !== undefined) {
    const value = Number(req.body.amount);
    if (!Number.isFinite(value) || value <= 0) throw new AppError('Enter a valid amount.');
    data.amount = value;
  }
  if (req.body.dueDate) data.dueDate = new Date(req.body.dueDate);
  if (req.body.recurring !== undefined) data.recurring = Boolean(req.body.recurring);
  if (req.body.frequency !== undefined) data.frequency = req.body.frequency || null;
  if (req.body.status) data.status = req.body.status;
  if (data.dueDate && req.body.status !== 'PAID') {
    data.status = refreshStatus({ ...existing, ...data, status: existing.status });
  }
  const row = await prisma.bill.update({ where: { id: existing.id }, data });
  res.json({ success: true, data: serialize(row) });
});

const remove = asyncHandler(async (req, res) => {
  const existing = await prisma.bill.findFirst({ where: { id: req.params.id, userId: req.userId } });
  if (!existing) throw new AppError('Bill not found.', 404, 'NOT_FOUND');
  await prisma.bill.delete({ where: { id: existing.id } });
  res.json({ success: true, data: { id: existing.id } });
});

module.exports = { list, create, update, remove };
