import { render } from '@testing-library/react';
import { renderPiePercentLabel } from '../PiePercentLabel';

const base = { cx: 100, cy: 100, midAngle: 0, outerRadius: 80 };

describe('renderPiePercentLabel', () => {
  it('muestra el porcentaje con un decimal', () => {
    const { container } = render(
      <svg>{renderPiePercentLabel({ ...base, percent: 0.4567 })}</svg>
    );
    expect(container.querySelector('text')?.textContent).toBe('45.7%');
  });

  it('omite porciones menores al 3%', () => {
    expect(renderPiePercentLabel({ ...base, percent: 0.02 })).toBeNull();
  });

  it('ancla a la izquierda las porciones del lado izquierdo', () => {
    const { container } = render(
      <svg>
        {renderPiePercentLabel({ ...base, midAngle: 180, percent: 0.5 })}
      </svg>
    );
    expect(container.querySelector('text')?.getAttribute('text-anchor')).toBe(
      'end'
    );
  });
});
