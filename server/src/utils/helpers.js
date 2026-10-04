function toNumber(value) {
  if (value === null || value === undefined) return 0;
  return Number(value);
}

function serialize(record) {
  if (Array.isArray(record)) return record.map(serialize);
  if (record && typeof record === 'object') {
    if (record instanceof Date) return record.toISOString();
    if (typeof record.toNumber === 'function') return record.toNumber();
    const out = {};
    for (const [key, val] of Object.entries(record)) {
      out[key] = serialize(val);
    }
    return out;
  }
  return record;
}

function startOfMonth(date = new Date()) {
  return new Date(date.getFullYear(), date.getMonth(), 1);
}

function endOfMonth(date = new Date()) {
  return new Date(date.getFullYear(), date.getMonth() + 1, 0, 23, 59, 59, 999);
}

function addMonths(date, n) {
  const d = new Date(date);
  d.setMonth(d.getMonth() + n);
  return d;
}

function monthKey(date) {
  const d = new Date(date);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
}

function rangeFromPeriod(period = '30d') {
  const end = new Date();
  const start = new Date();
  const map = { '7d': 7, '30d': 30, '3m': 90, '6m': 180, '1y': 365 };
  const days = map[period] || 30;
  start.setDate(end.getDate() - days);
  start.setHours(0, 0, 0, 0);
  return { start, end };
}

function hashImportRow(userId, date, description, amount, type) {
  const crypto = require('crypto');
  return crypto
    .createHash('sha256')
    .update(`${userId}|${date}|${description}|${amount}|${type}`)
    .digest('hex');
}

module.exports = {
  toNumber,
  serialize,
  startOfMonth,
  endOfMonth,
  addMonths,
  monthKey,
  rangeFromPeriod,
  hashImportRow,
};
