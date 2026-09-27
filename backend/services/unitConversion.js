const UNIT_ALIASES = {
  liters: 'liters',
  litre: 'liters',
  l: 'liters',
  ml: 'ml',
  kg: 'kg',
  g: 'gms',
  gm: 'gms',
  gms: 'gms',
  pieces: 'pieces',
  pcs: 'pieces',
  packs: 'packs',
};

export function normalizeUnit(unit) {
  if (!unit) return null;
  const key = String(unit).trim().toLowerCase();
  return UNIT_ALIASES[key] || key;
}

export function canConvertUnit(fromUnit, toUnit) {
  const from = normalizeUnit(fromUnit);
  const to = normalizeUnit(toUnit);
  if (!from || !to) return false;
  if (from === to) return true;
  return (
    (from === 'kg' && to === 'gms') ||
    (from === 'gms' && to === 'kg') ||
    (from === 'liters' && to === 'ml') ||
    (from === 'ml' && to === 'liters')
  );
}

export function convertQuantity(quantity, fromUnit, toUnit) {
  const from = normalizeUnit(fromUnit);
  const to = normalizeUnit(toUnit);
  const qty = Number(quantity);

  if (!Number.isFinite(qty)) {
    throw new Error('Invalid quantity for unit conversion');
  }
  if (!from || !to) {
    throw new Error('Missing unit for conversion');
  }
  if (from === to) return qty;

  // Mass
  if (from === 'kg' && to === 'gms') return qty * 1000;
  if (from === 'gms' && to === 'kg') return qty / 1000;

  // Volume
  if (from === 'liters' && to === 'ml') return qty * 1000;
  if (from === 'ml' && to === 'liters') return qty / 1000;

  throw new Error(`Unsupported unit conversion: ${from} -> ${to}`);
}
