const fs = require('fs');
const { parse } = require('csv-parse/sync');
const { CATEGORIES } = require('../utils/constants');
const { categorizeDescription } = require('../utils/constants');
const { hashImportRow } = require('../utils/helpers');

function normalizeType(value) {
  const v = String(value || '').trim().toLowerCase();
  if (['income', 'in', 'credit', 'cr'].includes(v)) return 'INCOME';
  if (['expense', 'out', 'debit', 'dr'].includes(v)) return 'EXPENSE';
  return null;
}

function parseAmount(value) {
  const n = Number(String(value || '').replace(/[,₹$]/g, '').trim());
  return Number.isFinite(n) ? n : null;
}

function parseDate(value) {
  if (!value) return null;
  const d = new Date(value);
  return Number.isNaN(d.getTime()) ? null : d;
}

function parseCsvBuffer(buffer) {
  let text = buffer.toString('utf8');
  if (text.charCodeAt(0) === 0xfeff) text = text.slice(1);
  const records = parse(text, {
    columns: true,
    skip_empty_lines: true,
    trim: true,
    relax_column_count: true,
  });
  return records;
}

function validateRows(records, userId) {
  return records.map((row) => {
    const errors = [];
    const dateRaw = row.Date || row.date;
    const desc = row.Description || row.description || row.Narration || '';
    const amountRaw = row.Amount || row.amount;
    let type = normalizeType(row.Type || row.type);
    const amount = parseAmount(amountRaw);
    const date = parseDate(dateRaw);
    let category = row.Category || row.category || '';

    if (!date) errors.push('Invalid or missing date');
    if (!desc) errors.push('Missing description');
    if (amount === null || amount === 0) errors.push('Invalid amount');
    if (!type) {
      if (amount !== null && amount < 0) type = 'EXPENSE';
      else if (row.Type || row.type) errors.push('Invalid type');
      else type = 'EXPENSE';
    }
    if (!category) category = categorizeDescription(desc, type);
    if (category && !CATEGORIES.includes(category)) category = 'Other';

    const absAmount = amount !== null ? Math.abs(amount) : null;
    const importHash =
      date && desc && absAmount && type
        ? hashImportRow(userId, date.toISOString().slice(0, 10), desc.trim().toLowerCase(), absAmount, type)
        : null;

    return {
      date: dateRaw || '',
      description: desc,
      amount: amountRaw || '',
      type: type || '',
      category,
      valid: errors.length === 0,
      errors,
      parsed: errors.length === 0
        ? {
            date: date.toISOString(),
            description: desc.trim(),
            amount: absAmount,
            type,
            category,
            importHash,
          }
        : null,
      importHash,
    };
  });
}

module.exports = { parseCsvBuffer, validateRows };
