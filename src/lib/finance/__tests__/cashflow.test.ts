import {
  classifyMovementType,
  accountMatchStage,
  flowExpressions,
} from '../cashflow';

describe('cashflow', () => {
  describe('classifyMovementType', () => {
    it('clasifica ingresos, egresos y traslados', () => {
      expect(classifyMovementType('Ingreso')).toBe('income');
      expect(classifyMovementType('INCOME')).toBe('income');
      expect(classifyMovementType('factura_emitida')).toBe('income');
      expect(classifyMovementType('Egreso')).toBe('expense');
      expect(classifyMovementType('EXPENSE')).toBe('expense');
      expect(classifyMovementType('Traslado')).toBe('transfer');
      expect(classifyMovementType('TRANSFER')).toBe('transfer');
    });

    it('trata un tipo desconocido como egreso (comportamiento previo)', () => {
      expect(classifyMovementType('otro')).toBe('expense');
      expect(classifyMovementType(undefined)).toBe('expense');
    });
  });

  describe('accountMatchStage', () => {
    it('sin cuenta no filtra', () => {
      expect(accountMatchStage()).toEqual({});
      expect(accountMatchStage(null)).toEqual({});
    });

    it('con cuenta filtra por origen o destino comparando como texto', () => {
      const json = JSON.stringify(accountMatchStage('abc'));
      expect(json).toContain('$account');
      expect(json).toContain('$destinationAccount');
      expect(json).toContain('$toString');
      expect(json).toContain('abc');
    });
  });

  describe('flowExpressions', () => {
    it('consolidado: los traslados no cuentan como egreso', () => {
      const { expense } = flowExpressions('$amountInCOP');
      const json = JSON.stringify(expense);
      expect(json).toContain('Traslado');
      expect(json).not.toContain('destinationAccount');
    });

    it('por cuenta: el traslado entra al destino y sale del origen', () => {
      const { income, expense } = flowExpressions('$amountInCOP', 'abc');
      expect(JSON.stringify(income)).toContain('$destinationAccount');
      const exp = JSON.stringify(expense);
      expect(exp).toContain('$account');
      expect(exp).not.toContain('$destinationAccount');
    });
  });
});
