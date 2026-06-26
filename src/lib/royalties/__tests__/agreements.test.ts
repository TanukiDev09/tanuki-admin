jest.mock('@/models/Agreement', () => ({
  __esModule: true,
  default: { find: jest.fn() },
}));
jest.mock('@/models/Book', () => ({ __esModule: true, default: {} }));

import { loadCreatorAgreements } from '../agreements';
import Agreement from '@/models/Agreement';

const findMock = Agreement.find as unknown as jest.Mock;

const mockAgreements = (rows: unknown[]) =>
  findMock.mockReturnValue({ populate: () => Promise.resolve(rows) });

beforeEach(() => {
  findMock.mockReset();
});

describe('loadCreatorAgreements', () => {
  it('solo incluye contratos con royaltyPercentage > 0 (excluye tanto alzado y dominio público)', async () => {
    mockAgreements([]);
    await loadCreatorAgreements('creator1');

    expect(findMock).toHaveBeenCalledWith({
      creator: 'creator1',
      royaltyPercentage: { $gt: 0 },
    });
  });

  it('mapea cada contrato con su libro (título + centro de costo)', async () => {
    mockAgreements([
      {
        _id: { toString: () => 'a1' },
        role: 'translator',
        royaltyPercentage: 5,
        book: {
          _id: { toString: () => 'b1' },
          title: 'Resignación',
          costCenter: '01T009',
        },
      },
    ]);

    const res = await loadCreatorAgreements('creator1');

    expect(res).toEqual([
      {
        _id: 'a1',
        role: 'translator',
        royaltyPercentage: 5,
        book: { _id: 'b1', title: 'Resignación', costCenter: '01T009' },
      },
    ]);
  });

  it('descarta contratos sin libro asociado', async () => {
    mockAgreements([
      {
        _id: { toString: () => 'a1' },
        role: 'author',
        royaltyPercentage: 8,
        book: null,
      },
    ]);

    const res = await loadCreatorAgreements('creator1');
    expect(res).toHaveLength(0);
  });
});
