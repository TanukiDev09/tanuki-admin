export type MovementQuery = {
  [key: string]:
    | string
    | number
    | boolean
    | Date
    | RegExp
    | MovementQuery
    | MovementQuery[]
    | { [key: string]: unknown }
    | null
    | undefined;
};

const handleUndefined = (field: string, conditions: MovementQuery[]) => {
  const baseOr: MovementQuery[] = [
    { [field]: null },
    { [field]: { $exists: false } },
  ];

  if (
    field === 'paymentChannel' ||
    field === 'costCenter' ||
    field === 'unit'
  ) {
    baseOr.push({ [field]: '' } as MovementQuery);
  }

  if (field === 'costCenter') {
    baseOr.push(
      { 'allocations.costCenter': null } as MovementQuery,
      {
        'allocations.costCenter': { $exists: false },
      } as MovementQuery
    );
  }

  conditions.push({ $or: baseOr });
};

const applyBaseFilters = (
  searchParams: URLSearchParams,
  conditions: MovementQuery[]
) => {
  const category = searchParams.get('category');
  const paymentChannel = searchParams.get('paymentChannel');
  const costCenter = searchParams.get('costCenter');
  const unit = searchParams.get('unit');

  if (category === '__UNDEFINED__') handleUndefined('category', conditions);
  else if (category) conditions.push({ category } as MovementQuery);

  if (paymentChannel === '__UNDEFINED__')
    handleUndefined('paymentChannel', conditions);
  else if (paymentChannel) conditions.push({ paymentChannel } as MovementQuery);

  if (costCenter === '__UNDEFINED__') {
    handleUndefined('costCenter', conditions);
  } else if (costCenter) {
    conditions.push({
      $or: [{ 'allocations.costCenter': costCenter }, { costCenter }],
    } as MovementQuery);
  }

  if (unit === '__UNDEFINED__') handleUndefined('unit', conditions);
  else if (unit) conditions.push({ unit } as MovementQuery);
};

const applyNumericFilters = (
  searchParams: URLSearchParams,
  conditions: MovementQuery[]
) => {
  const minAmount = searchParams.get('minAmount');
  const maxAmount = searchParams.get('maxAmount');
  const minQuantity = searchParams.get('minQuantity');
  const maxQuantity = searchParams.get('maxQuantity');

  if (minAmount || maxAmount) {
    const amountQuery: Record<string, number> = {};
    if (minAmount) amountQuery.$gte = parseFloat(minAmount);
    if (maxAmount) amountQuery.$lte = parseFloat(maxAmount);
    conditions.push({ amount: amountQuery } as MovementQuery);
  }

  if (minQuantity === '__UNDEFINED__' || maxQuantity === '__UNDEFINED__') {
    handleUndefined('quantity', conditions);
  } else if (minQuantity || maxQuantity) {
    const quantityQuery: Record<string, number> = {};
    if (minQuantity) quantityQuery.$gte = parseFloat(minQuantity);
    if (maxQuantity) quantityQuery.$lte = parseFloat(maxQuantity);
    conditions.push({
      quantity: quantityQuery,
    } as MovementQuery);
  }
};

const applyOtherFilters = (
  searchParams: URLSearchParams,
  conditions: MovementQuery[]
) => {
  const type = searchParams.get('type');
  const search = searchParams.get('search');
  const startDate = searchParams.get('startDate');
  const endDate = searchParams.get('endDate');

  if (type) {
    const typeMap: Record<string, string[]> = {
      INCOME: ['INCOME', 'Ingreso'],
      EXPENSE: ['EXPENSE', 'Egreso'],
    };
    conditions.push({
      type: typeMap[type] ? { $in: typeMap[type] } : type,
    } as MovementQuery);
  }

  if (startDate || endDate) {
    const dateQuery: Record<string, Date> = {};
    if (startDate) {
      const start = new Date(startDate);
      start.setUTCHours(0, 0, 0, 0);
      dateQuery.$gte = start;
    }
    if (endDate) {
      const end = new Date(endDate);
      end.setUTCHours(23, 59, 59, 999);
      dateQuery.$lte = end;
    }
    conditions.push({ date: dateQuery } as MovementQuery);
  }

  if (search) {
    const searchRegex = new RegExp(search, 'i');
    conditions.push({
      $or: [
        { description: searchRegex },
        { beneficiary: searchRegex },
        { notes: searchRegex },
      ],
    } as MovementQuery);
  }

  const debtId = searchParams.get('debtId');
  if (debtId) {
    conditions.push({ debtId } as MovementQuery);
  }
};

export function buildQuery(searchParams: URLSearchParams): MovementQuery {
  const andConditions: MovementQuery[] = [];

  applyBaseFilters(searchParams, andConditions);
  applyNumericFilters(searchParams, andConditions);
  applyOtherFilters(searchParams, andConditions);

  return andConditions.length > 0 ? { $and: andConditions } : {};
}
