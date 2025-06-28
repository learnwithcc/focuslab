import { render, screen } from '@testing-library/react';
import { BlogCallout, InfoCallout, WarningCallout, SuccessCallout, ErrorCallout, TipCallout } from '../BlogCallout';

describe('BlogCallout', () => {
  it('renders with info type correctly', () => {
    render(
      <BlogCallout type="info" title="Information">
        This is an info callout
      </BlogCallout>
    );
    
    expect(screen.getByText('Information')).toBeInTheDocument();
    expect(screen.getByText('This is an info callout')).toBeInTheDocument();
    expect(screen.getByRole('region')).toHaveClass('info');
  });

  it('renders with warning type correctly', () => {
    render(
      <BlogCallout type="warning" title="Warning">
        This is a warning callout
      </BlogCallout>
    );
    
    expect(screen.getByText('Warning')).toBeInTheDocument();
    expect(screen.getByText('This is a warning callout')).toBeInTheDocument();
    expect(screen.getByRole('region')).toHaveClass('warning');
  });

  it('renders with success type correctly', () => {
    render(
      <BlogCallout type="success" title="Success">
        This is a success callout
      </BlogCallout>
    );
    
    expect(screen.getByText('Success')).toBeInTheDocument();
    expect(screen.getByText('This is a success callout')).toBeInTheDocument();
    expect(screen.getByRole('region')).toHaveClass('success');
  });

  it('renders with error type correctly', () => {
    render(
      <BlogCallout type="error" title="Error">
        This is an error callout
      </BlogCallout>
    );
    
    expect(screen.getByText('Error')).toBeInTheDocument();
    expect(screen.getByText('This is an error callout')).toBeInTheDocument();
    expect(screen.getByRole('region')).toHaveClass('error');
  });

  it('renders with tip type correctly', () => {
    render(
      <BlogCallout type="tip" title="Tip">
        This is a tip callout
      </BlogCallout>
    );
    
    expect(screen.getByText('Tip')).toBeInTheDocument();
    expect(screen.getByText('This is a tip callout')).toBeInTheDocument();
    expect(screen.getByRole('region')).toHaveClass('tip');
  });

  it('renders without title when not provided', () => {
    render(
      <BlogCallout type="info">
        This is a callout without title
      </BlogCallout>
    );
    
    expect(screen.getByText('This is a callout without title')).toBeInTheDocument();
    expect(screen.queryByRole('heading')).not.toBeInTheDocument();
  });

  it('supports custom className', () => {
    render(
      <BlogCallout type="info" className="custom-callout">
        Custom class callout
      </BlogCallout>
    );
    
    expect(screen.getByRole('region')).toHaveClass('custom-callout');
  });

  it('has proper accessibility attributes', () => {
    render(
      <BlogCallout type="warning" title="Important Warning">
        This is important
      </BlogCallout>
    );
    
    const callout = screen.getByRole('region');
    expect(callout).toHaveAttribute('aria-labelledby');
    
    const heading = screen.getByRole('heading');
    expect(heading).toHaveAttribute('id');
  });
});

describe('InfoCallout', () => {
  it('renders as info type by default', () => {
    render(
      <InfoCallout title="Info Title">
        Info content
      </InfoCallout>
    );
    
    expect(screen.getByText('Info Title')).toBeInTheDocument();
    expect(screen.getByText('Info content')).toBeInTheDocument();
    expect(screen.getByRole('region')).toHaveClass('info');
  });
});

describe('WarningCallout', () => {
  it('renders as warning type by default', () => {
    render(
      <WarningCallout title="Warning Title">
        Warning content
      </WarningCallout>
    );
    
    expect(screen.getByText('Warning Title')).toBeInTheDocument();
    expect(screen.getByText('Warning content')).toBeInTheDocument();
    expect(screen.getByRole('region')).toHaveClass('warning');
  });
});

describe('SuccessCallout', () => {
  it('renders as success type by default', () => {
    render(
      <SuccessCallout title="Success Title">
        Success content
      </SuccessCallout>
    );
    
    expect(screen.getByText('Success Title')).toBeInTheDocument();
    expect(screen.getByText('Success content')).toBeInTheDocument();
    expect(screen.getByRole('region')).toHaveClass('success');
  });
});

describe('ErrorCallout', () => {
  it('renders as error type by default', () => {
    render(
      <ErrorCallout title="Error Title">
        Error content
      </ErrorCallout>
    );
    
    expect(screen.getByText('Error Title')).toBeInTheDocument();
    expect(screen.getByText('Error content')).toBeInTheDocument();
    expect(screen.getByRole('region')).toHaveClass('error');
  });
});

describe('TipCallout', () => {
  it('renders as tip type by default', () => {
    render(
      <TipCallout title="Tip Title">
        Tip content
      </TipCallout>
    );
    
    expect(screen.getByText('Tip Title')).toBeInTheDocument();
    expect(screen.getByText('Tip content')).toBeInTheDocument();
    expect(screen.getByRole('region')).toHaveClass('tip');
  });
});