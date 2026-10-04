const prisma = require('../lib/prisma');
const { AppError, asyncHandler } = require('../middleware/errorHandler');
const { serialize } = require('../utils/helpers');
const { CATEGORIES, PAYMENT_METHODS, categorizeDescription } = require('../utils/constants');
const { parseCsvBuffer, validateRows } = require('../services/csvService');

const list = asyncHandler(async (req, res) => {
  const page = Math.max(1, Number(req.query.page) || 1);
  const limit = Math.min(50, Math.max(1, Number(req.query.limit) || 10));
  const search = String(req.query.search || '').trim();
  const type = req.query.type;
  const category = req.query.category;
  const sort = req.query.sort === 'amount' ? 'amount' : 'date';
  const order = req.query.order === 'asc' ? 'asc' : 'desc';

  const where = { userId: req.userId };
  if (type === 'INCOME' || type === 'EXPENSE') where.type = type;
  if (category) where.category = category;
  if (search) {
    where.OR = [
      { description: { contains: search, mode: 'insensitive' } },
      { notes: { contains: search, mode: 'insensitive' } },
      { category: { contains: search, mode: 'insensitive' } },
    ];
  }

  const [total, rows] = await Promise.all([
    prisma.transaction.count({ where }),
    prisma.transaction.findMany({
      where,
      orderBy: { [sort]: order },
      skip: (page - 1) * limit,
      take: limit,
    }),
  ]);

  res.json({
    success: true,
    data: serialize(rows),
    meta: { page, limit, total, pages: Math.ceil(total / limit) },
  });
});

const create = asyncHandler(async (req, res) => {
  const { amount, type, category, description, date, paymentMethod, notes, autoCategory } = req.body;
  const value = Number(amount);
  if (!Number.isFinite(value) || value <= 0) throw new AppError('Enter a valid amount.');
  if (!['INCOME', 'EXPENSE'].includes(type)) throw new AppError('Type must be INCOME or EXPENSE.');
  if (!description) throw new AppError('Description is required.');
  let cat = category;
  if (autoCategory || !cat) cat = categorizeDescription(description, type);
  if (!CATEGORIES.includes(cat)) throw new AppError('Invalid category.');
  const method = PAYMENT_METHODS.includes(paymentMethod) ? paymentMethod : 'UPI';
  const row = await prisma.transaction.create({
    data: {
      userId: req.userId,
      amount: value,
      type,
      category: cat,
      description: String(description).trim(),
      date: date ? new Date(date) : new Date(),
      paymentMethod: method,
      notes: notes || null,
    },
  });
  res.status(201).json({ success: true, data: serialize(row) });
});

const update = asyncHandler(async (req, res) => {
  const existing = await prisma.transaction.findFirst({
    where: { id: req.params.id, userId: req.userId },
  });
  if (!existing) throw new AppError('Transaction not found.', 404, 'NOT_FOUND');
  const data = {};
  if (req.body.amount !== undefined) {
    const value = Number(req.body.amount);
    if (!Number.isFinite(value) || value <= 0) throw new AppError('Enter a valid amount.');
    data.amount = value;
  }
  if (req.body.type) {
    if (!['INCOME', 'EXPENSE'].includes(req.body.type)) throw new AppError('Invalid type.');
    data.type = req.body.type;
  }
  if (req.body.category) {
    if (!CATEGORIES.includes(req.body.category)) throw new AppError('Invalid category.');
    data.category = req.body.category;
  }
  if (req.body.description !== undefined) data.description = String(req.body.description).trim();
  if (req.body.date) data.date = new Date(req.body.date);
  if (req.body.paymentMethod) {
    if (!PAYMENT_METHODS.includes(req.body.paymentMethod)) throw new AppError('Invalid payment method.');
    data.paymentMethod = req.body.paymentMethod;
  }
  if (req.body.notes !== undefined) data.notes = req.body.notes || null;
  const row = await prisma.transaction.update({ where: { id: existing.id }, data });
  res.json({ success: true, data: serialize(row) });
});

const remove = asyncHandler(async (req, res) => {
  const existing = await prisma.transaction.findFirst({
    where: { id: req.params.id, userId: req.userId },
  });
  if (!existing) throw new AppError('Transaction not found.', 404, 'NOT_FOUND');
  await prisma.transaction.delete({ where: { id: existing.id } });
  res.json({ success: true, data: { id: existing.id } });
});

const previewImport = asyncHandler(async (req, res) => {
  if (!req.file) throw new AppError('Please upload a CSV file.', 400, 'INVALID_FILE');
  let records;
  try {
    records = parseCsvBuffer(require('fs').readFileSync(req.file.path));
  } catch {
    throw new AppError('Could not parse the CSV file. Check the columns and try again.', 400, 'CSV_PARSE');
  }
  const rows = validateRows(records, req.userId);
  const hashes = rows.filter((r) => r.importHash).map((r) => r.importHash);
  const existing = hashes.length
    ? await prisma.transaction.findMany({
        where: { userId: req.userId, importHash: { in: hashes } },
        select: { importHash: true },
      })
    : [];
  const existingSet = new Set(existing.map((e) => e.importHash));
  const annotated = rows.map((r) => ({
    ...r,
    duplicate: r.importHash ? existingSet.has(r.importHash) : false,
  }));
  const batch = await prisma.importBatch.create({
    data: {
      userId: req.userId,
      fileName: req.file.originalname,
      totalRows: annotated.length,
      validRows: annotated.filter((r) => r.valid && !r.duplicate).length,
      invalidRows: annotated.filter((r) => !r.valid).length,
      rows: {
        create: annotated.map((r) => ({
          date: r.date,
          description: r.description,
          amount: String(r.amount),
          type: r.type,
          category: r.category,
          valid: r.valid && !r.duplicate,
          errors: r.duplicate ? [...(r.errors || []), 'Possible duplicate'] : r.errors,
          importHash: r.importHash,
        })),
      },
    },
    include: { rows: true },
  });
  res.json({ success: true, data: serialize(batch) });
});

const confirmImport = asyncHandler(async (req, res) => {
  const batch = await prisma.importBatch.findFirst({
    where: { id: req.body.batchId, userId: req.userId },
    include: { rows: true },
  });
  if (!batch) throw new AppError('Import batch not found.', 404, 'NOT_FOUND');
  const valid = batch.rows.filter((r) => r.valid);
  let imported = 0;
  for (const row of valid) {
    const amount = Math.abs(Number(row.amount));
    const date = new Date(row.date);
    if (!Number.isFinite(amount) || Number.isNaN(date.getTime())) continue;
    const exists = await prisma.transaction.findFirst({
      where: { userId: req.userId, importHash: row.importHash || '__none__' },
    });
    if (exists) continue;
    await prisma.transaction.create({
      data: {
        userId: req.userId,
        amount,
        type: row.type === 'INCOME' ? 'INCOME' : 'EXPENSE',
        category: row.category || 'Other',
        description: row.description || 'Imported',
        date,
        paymentMethod: 'OTHER',
        source: 'csv',
        importHash: row.importHash,
      },
    });
    imported += 1;
  }
  const updated = await prisma.importBatch.update({
    where: { id: batch.id },
    data: { imported },
  });
  res.json({ success: true, data: serialize(updated) });
});

const suggestCategory = asyncHandler(async (req, res) => {
  const { description, type } = req.body;
  res.json({
    success: true,
    data: { category: categorizeDescription(description, type || 'EXPENSE') },
  });
});

module.exports = { list, create, update, remove, previewImport, confirmImport, suggestCategory };
