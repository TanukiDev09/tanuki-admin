import Agreement from '@/models/Agreement';
import '@/models/Book';
import { AgreementForComputation } from './calculate';

interface PopulatedBook {
  _id: { toString(): string };
  title: string;
  costCenter?: string;
}

/**
 * Filtro de contratos que SÍ liquidan regalías: `royaltyPercentage > 0`.
 *
 * En el form, "Tipo de Acuerdo" se reduce a este campo:
 *  - Regalías (Standard)        → % > 0  → entra
 *  - Pago de Contado / tanto alzado → % = 0 → NO entra (no genera regalías)
 *  - Dominio Público (autor)    → % = 0  → NO entra
 *
 * El traductor/ilustrador de una obra de dominio público firma un contrato de
 * Regalías (% > 0), así que entra correctamente.
 */
export const ROYALTY_ELIGIBLE_AGREEMENT_FILTER = {
  royaltyPercentage: { $gt: 0 },
};

/**
 * Carga todos los contratos de un creador con su libro (título + centro de
 * costo), para calcular su liquidación de regalías por persona.
 */
export async function loadCreatorAgreements(
  creatorId: string
): Promise<AgreementForComputation[]> {
  // Solo contratos que liquidan regalías (% > 0): excluye tanto alzado y
  // dominio público; ver ROYALTY_ELIGIBLE_AGREEMENT_FILTER.
  const agreements = await Agreement.find({
    creator: creatorId,
    ...ROYALTY_ELIGIBLE_AGREEMENT_FILTER,
  }).populate('book', 'title costCenter');

  return agreements
    .filter((a) => a.book)
    .map((a) => {
      const book = a.book as unknown as PopulatedBook;
      return {
        _id: a._id.toString(),
        role: a.role,
        royaltyPercentage: a.royaltyPercentage,
        book: {
          _id: book._id.toString(),
          title: book.title,
          costCenter: book.costCenter,
        },
      };
    });
}
