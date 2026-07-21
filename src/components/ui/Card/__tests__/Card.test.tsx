import * as React from 'react';
import { render, screen } from '@testing-library/react';
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
  CardFooter,
} from '../Card';

describe('Card', () => {
  it('renders all components correctly', () => {
    render(
      <Card className="custom-card">
        <CardHeader className="custom-header">
          <CardTitle className="custom-title">Title</CardTitle>
          <CardDescription className="custom-desc">Description</CardDescription>
        </CardHeader>
        <CardContent className="custom-content">Content</CardContent>
        <CardFooter className="custom-footer">Footer</CardFooter>
      </Card>
    );

    const card = screen.getByText('Title').closest('.card');
    expect(card).toBeInTheDocument();
    expect(card).toHaveClass('custom-card');

    const header = screen.getByText('Title').closest('.card__header');
    expect(header).toBeInTheDocument();
    expect(header).toHaveClass('custom-header');

    const title = screen.getByText('Title');
    expect(title).toHaveClass('card__title', 'custom-title');
    expect(title.tagName).toBe('H3');

    const description = screen.getByText('Description');
    expect(description).toHaveClass('card__description', 'custom-desc');
    expect(description.tagName).toBe('P');

    const content = screen.getByText('Content');
    expect(content).toHaveClass('card__content', 'custom-content');

    const footer = screen.getByText('Footer');
    expect(footer).toHaveClass('card__footer', 'custom-footer');
  });

  it('forwards refs correctly', () => {
    const cardRef = React.createRef<HTMLDivElement>();
    const titleRef = React.createRef<HTMLHeadingElement>();

    render(
      <Card ref={cardRef}>
        <CardHeader>
          <CardTitle ref={titleRef}>Title</CardTitle>
        </CardHeader>
      </Card>
    );

    expect(cardRef.current).toBeInstanceOf(HTMLDivElement);
    expect(titleRef.current).toBeInstanceOf(HTMLHeadingElement);
  });
});
