import type { Meta, StoryObj } from '@storybook/react';
import { Input } from '~/components';

const meta: Meta<typeof Input> = {
  title: 'Components/Input',
  component: Input,
  parameters: {
    layout: 'padded',
    docs: {
      description: {
        component: 'A versatile input component with support for validation, different types, and accessibility features. Built with proper ARIA attributes and form validation patterns.',
      },
    },
  },
  argTypes: {
    label: {
      control: 'text',
      description: 'Label text for the input field',
    },
    hideLabel: {
      control: 'boolean',
      description: 'Hide the label visually while keeping it accessible',
    },
    size: {
      control: 'select',
      options: ['sm', 'md', 'lg'],
      description: 'Size variant of the input',
    },
    type: {
      control: 'select',
      options: ['text', 'email', 'password', 'number', 'tel', 'url', 'search'],
      description: 'HTML input type',
    },
    disabled: {
      control: 'boolean',
      description: 'Whether the input is disabled',
    },
    required: {
      control: 'boolean',
      description: 'Whether the input is required',
    },
    error: {
      control: 'text',
      description: 'Error message to display (string) or error state (boolean)',
    },
    helperText: {
      control: 'text',
      description: 'Helper text to guide the user',
    },
    placeholder: {
      control: 'text',
      description: 'Placeholder text',
    },
  },
  tags: ['autodocs'],
};

export default meta;
type Story = StoryObj<typeof Input>;

// Basic input examples
export const Default: Story = {
  args: {
    label: 'Email Address',
    placeholder: 'Enter your email',
    type: 'email',
  },
};

export const WithHelperText: Story = {
  args: {
    label: 'Username',
    placeholder: 'Choose a username',
    helperText: 'Username must be at least 3 characters long',
  },
};

export const Required: Story = {
  args: {
    label: 'Password',
    type: 'password',
    placeholder: 'Enter your password',
    required: true,
    helperText: 'Password is required for account creation',
  },
};

// Size variants
export const Small: Story = {
  args: {
    label: 'Small Input',
    size: 'sm',
    placeholder: 'Small size input',
  },
};

export const Medium: Story = {
  args: {
    label: 'Medium Input',
    size: 'md',
    placeholder: 'Medium size input (default)',
  },
};

export const Large: Story = {
  args: {
    label: 'Large Input',
    size: 'lg',
    placeholder: 'Large size input',
  },
};

// Input types
export const EmailInput: Story = {
  args: {
    label: 'Email',
    type: 'email',
    placeholder: 'user@example.com',
    helperText: 'We\'ll never share your email',
  },
};

export const PasswordInput: Story = {
  args: {
    label: 'Password',
    type: 'password',
    placeholder: 'Enter password',
    required: true,
  },
};

export const NumberInput: Story = {
  args: {
    label: 'Age',
    type: 'number',
    placeholder: '25',
    helperText: 'Enter your age in years',
  },
};

export const TelephoneInput: Story = {
  args: {
    label: 'Phone Number',
    type: 'tel',
    placeholder: '+1 (555) 123-4567',
    helperText: 'Include country code',
  },
};

export const URLInput: Story = {
  args: {
    label: 'Website',
    type: 'url',
    placeholder: 'https://example.com',
    helperText: 'Enter your website URL',
  },
};

export const SearchInput: Story = {
  args: {
    label: 'Search',
    type: 'search',
    placeholder: 'Search components...',
  },
};

// Error states
export const WithError: Story = {
  args: {
    label: 'Email',
    type: 'email',
    placeholder: 'Enter your email',
    error: 'Please enter a valid email address',
    defaultValue: 'invalid-email',
  },
};

export const ErrorState: Story = {
  args: {
    label: 'Username',
    placeholder: 'Enter username',
    error: true,
    defaultValue: 'ab',
    helperText: 'Username must be at least 3 characters',
  },
};

// Disabled state
export const Disabled: Story = {
  args: {
    label: 'Disabled Input',
    placeholder: 'This input is disabled',
    disabled: true,
    defaultValue: 'Cannot edit this',
  },
};

export const DisabledWithValue: Story = {
  args: {
    label: 'Read Only Data',
    disabled: true,
    defaultValue: 'john@example.com',
    helperText: 'This field cannot be modified',
  },
};

// Accessibility examples
export const HiddenLabel: Story = {
  args: {
    label: 'Search',
    hideLabel: true,
    placeholder: 'Search for anything...',
    type: 'search',
  },
  parameters: {
    docs: {
      description: {
        story: 'Label is hidden visually but still available to screen readers for accessibility.',
      },
    },
  },
};

export const WithAriaLabel: Story = {
  args: {
    placeholder: 'Search products',
    'aria-label': 'Product search',
    type: 'search',
  },
  parameters: {
    docs: {
      description: {
        story: 'Using aria-label instead of a visible label for cases where context is clear.',
      },
    },
  },
};

// Form validation examples
export const ValidationExample: Story = {
  render: () => {
    const [values, setValues] = React.useState({
      email: '',
      password: '',
      confirmPassword: '',
    });
    const [errors, setErrors] = React.useState<Record<string, string>>({});

    const validateEmail = (email: string) => {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      return emailRegex.test(email) ? '' : 'Please enter a valid email address';
    };

    const validatePassword = (password: string) => {
      return password.length >= 6 ? '' : 'Password must be at least 6 characters';
    };

    const validateConfirmPassword = (password: string, confirmPassword: string) => {
      return password === confirmPassword ? '' : 'Passwords do not match';
    };

    const handleChange = (field: string) => (e: React.ChangeEvent<HTMLInputElement>) => {
      const value = e.target.value;
      setValues(prev => ({ ...prev, [field]: value }));
      
      // Real-time validation
      let error = '';
      switch (field) {
        case 'email':
          error = validateEmail(value);
          break;
        case 'password':
          error = validatePassword(value);
          break;
        case 'confirmPassword':
          error = validateConfirmPassword(values.password, value);
          break;
      }
      
      setErrors(prev => ({ ...prev, [field]: error }));
    };

    return (
      <div className="space-y-4 max-w-md">
        <Input
          label="Email"
          type="email"
          placeholder="Enter your email"
          value={values.email}
          onChange={handleChange('email')}
          error={errors.email}
          required
        />
        <Input
          label="Password"
          type="password"
          placeholder="Enter password"
          value={values.password}
          onChange={handleChange('password')}
          error={errors.password}
          helperText="Must be at least 6 characters"
          required
        />
        <Input
          label="Confirm Password"
          type="password"
          placeholder="Confirm password"
          value={values.confirmPassword}
          onChange={handleChange('confirmPassword')}
          error={errors.confirmPassword}
          required
        />
      </div>
    );
  },
  parameters: {
    docs: {
      description: {
        story: 'Example showing real-time form validation with error states.',
      },
    },
  },
};

// Dark mode examples
export const DarkModeVariants: Story = {
  render: () => (
    <div className="space-y-4 p-6 bg-gray-900 rounded-lg">
      <Input
        label="Default in Dark Mode"
        placeholder="Enter text"
        helperText="Helper text in dark mode"
      />
      <Input
        label="With Error in Dark Mode"
        placeholder="Invalid input"
        error="This field has an error"
        defaultValue="invalid-value"
      />
      <Input
        label="Disabled in Dark Mode"
        placeholder="Disabled input"
        disabled
        defaultValue="Cannot edit"
      />
    </div>
  ),
  parameters: {
    backgrounds: { default: 'dark' },
    docs: {
      description: {
        story: 'Input component variants in dark mode theme.',
      },
    },
  },
};

// Size comparison
export const AllSizes: Story = {
  render: () => (
    <div className="space-y-4">
      <Input
        label="Small Size"
        size="sm"
        placeholder="Small input"
        helperText="Small size example"
      />
      <Input
        label="Medium Size"
        size="md"
        placeholder="Medium input (default)"
        helperText="Medium size example"
      />
      <Input
        label="Large Size"
        size="lg"
        placeholder="Large input"
        helperText="Large size example"
      />
    </div>
  ),
  parameters: {
    docs: {
      description: {
        story: 'Comparison of all available input sizes.',
      },
    },
  },
};

// Input types showcase
export const AllTypes: Story = {
  render: () => (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
      <Input label="Text" type="text" placeholder="Text input" />
      <Input label="Email" type="email" placeholder="email@example.com" />
      <Input label="Password" type="password" placeholder="Password" />
      <Input label="Number" type="number" placeholder="123" />
      <Input label="Telephone" type="tel" placeholder="+1 (555) 123-4567" />
      <Input label="URL" type="url" placeholder="https://example.com" />
      <Input label="Search" type="search" placeholder="Search..." />
    </div>
  ),
  parameters: {
    docs: {
      description: {
        story: 'All supported input types displayed in a grid layout.',
      },
    },
  },
};