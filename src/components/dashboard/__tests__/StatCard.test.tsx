import { render, screen } from '@testing-library/react';
import { StatCard } from '../StatCard';
import { TrendingUp } from 'lucide-react';

describe('StatCard', () => {
  it('renders title and value correctly', () => {
    render(
      <StatCard
        title="Test Metric"
        value="$1,000"
        icon={TrendingUp}
      />
    );

    expect(screen.getByText('Test Metric')).toBeInTheDocument();
    expect(screen.getByText('$1,000')).toBeInTheDocument();
  });

  it('displays subtext when provided', () => {
    render(
      <StatCard
        title="Revenue"
        value="$50,000"
        icon={TrendingUp}
        subtext="Last 30 days"
      />
    );

    expect(screen.getByText('Last 30 days')).toBeInTheDocument();
  });

  it('applies variant styles correctly', () => {
    const { container } = render(
      <StatCard
        title="Income"
        value="$75,000"
        icon={TrendingUp}
        variant="flow"
      />
    );

    const card = container.firstChild;
    expect(card).toHaveClass('zone-flow');
  });
});
