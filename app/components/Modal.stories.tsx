import type { Meta, StoryObj } from '@storybook/react';
import { Modal, Button, Input } from '~/components';
import { useState } from 'react';

const meta: Meta<typeof Modal> = {
  title: 'Components/Modal',
  component: Modal,
  parameters: {
    layout: 'fullscreen',
    docs: {
      description: {
        component: 'A versatile modal component with focus management, keyboard navigation, and accessibility features. Supports multiple sizes, custom styling, and portal-based rendering.',
      },
    },
  },
  argTypes: {
    isOpen: {
      control: 'boolean',
      description: 'Whether the modal is open',
    },
    size: {
      control: 'select',
      options: ['sm', 'md', 'lg', 'xl', 'full'],
      description: 'Size of the modal',
    },
    title: {
      control: 'text',
      description: 'Modal title text',
    },
    description: {
      control: 'text',
      description: 'Modal description text',
    },
    closeOnBackdropClick: {
      control: 'boolean',
      description: 'Allow closing by clicking the backdrop',
    },
    closeOnEscape: {
      control: 'boolean',
      description: 'Allow closing with Escape key',
    },
    showCloseButton: {
      control: 'boolean',
      description: 'Show close button in header',
    },
    preventBodyScroll: {
      control: 'boolean',
      description: 'Prevent body scrolling when modal is open',
    },
    onClose: {
      action: 'closed',
      description: 'Handler called when modal is closed',
    },
  },
  tags: ['autodocs'],
};

export default meta;
type Story = StoryObj<typeof Modal>;

// Helper component for interactive stories
const ModalDemo = ({ children, buttonText = 'Open Modal', ...modalProps }: any) => {
  const [isOpen, setIsOpen] = useState(false);
  
  return (
    <>
      <Button onClick={() => setIsOpen(true)}>
        {buttonText}
      </Button>
      <Modal
        {...modalProps}
        isOpen={isOpen}
        onClose={() => setIsOpen(false)}
      >
        {children}
      </Modal>
    </>
  );
};

// Basic modal examples
export const Default: Story = {
  render: () => (
    <ModalDemo title="Default Modal">
      <p>This is a basic modal with default settings.</p>
    </ModalDemo>
  ),
};

export const WithDescription: Story = {
  render: () => (
    <ModalDemo
      title="Modal with Description"
      description="This modal includes both a title and a description for better context."
    >
      <p>The main content of the modal goes here.</p>
    </ModalDemo>
  ),
};

export const NoCloseButton: Story = {
  render: () => (
    <ModalDemo
      title="Modal without Close Button"
      showCloseButton={false}
    >
      <p>This modal doesn't have a close button in the header.</p>
      <div className="mt-4 flex justify-end">
        <Button onClick={() => {}} size="sm">
          Custom Close Action
        </Button>
      </div>
    </ModalDemo>
  ),
};

// Size variants
export const SmallSize: Story = {
  render: () => (
    <ModalDemo
      title="Small Modal"
      size="sm"
      buttonText="Open Small Modal"
    >
      <p>This is a small modal perfect for simple confirmations or brief messages.</p>
    </ModalDemo>
  ),
};

export const MediumSize: Story = {
  render: () => (
    <ModalDemo
      title="Medium Modal"
      size="md"
      buttonText="Open Medium Modal"
    >
      <p>This is a medium-sized modal, which is the default size. Good for most content.</p>
    </ModalDemo>
  ),
};

export const LargeSize: Story = {
  render: () => (
    <ModalDemo
      title="Large Modal"
      size="lg"
      buttonText="Open Large Modal"
    >
      <p>This is a large modal suitable for more extensive content, forms, or detailed information.</p>
      <p>It provides more space for complex interactions and longer text content.</p>
    </ModalDemo>
  ),
};

export const ExtraLargeSize: Story = {
  render: () => (
    <ModalDemo
      title="Extra Large Modal"
      size="xl"
      buttonText="Open XL Modal"
    >
      <div className="space-y-4">
        <p>This is an extra large modal for complex interfaces or detailed content.</p>
        <p>Perfect for forms with multiple sections, data tables, or comprehensive information displays.</p>
        <div className="grid grid-cols-2 gap-4">
          <div className="p-4 bg-gray-50 rounded">Column 1</div>
          <div className="p-4 bg-gray-50 rounded">Column 2</div>
        </div>
      </div>
    </ModalDemo>
  ),
};

export const FullSize: Story = {
  render: () => (
    <ModalDemo
      title="Full Size Modal"
      size="full"
      buttonText="Open Full Modal"
    >
      <div className="space-y-6">
        <p>This modal takes up the full available space with minimal margins.</p>
        <p>Ideal for complex applications, detailed forms, or when you need maximum screen real estate.</p>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="p-4 bg-gray-50 rounded">Section 1</div>
          <div className="p-4 bg-gray-50 rounded">Section 2</div>
          <div className="p-4 bg-gray-50 rounded">Section 3</div>
        </div>
        <div className="h-64 bg-gray-100 rounded flex items-center justify-center">
          <span className="text-gray-500">Large content area</span>
        </div>
      </div>
    </ModalDemo>
  ),
};

// Behavior variants
export const NoBackdropClose: Story = {
  render: () => (
    <ModalDemo
      title="No Backdrop Close"
      closeOnBackdropClick={false}
      buttonText="Open Modal (No Backdrop Close)"
      description="This modal cannot be closed by clicking the backdrop area."
    >
      <p>You must use the close button or press Escape to close this modal.</p>
    </ModalDemo>
  ),
};

export const NoEscapeClose: Story = {
  render: () => (
    <ModalDemo
      title="No Escape Close"
      closeOnEscape={false}
      buttonText="Open Modal (No Escape Close)"
      description="This modal cannot be closed using the Escape key."
    >
      <p>You must use the close button or click the backdrop to close this modal.</p>
    </ModalDemo>
  ),
};

export const ForceClose: Story = {
  render: () => (
    <ModalDemo
      title="Force Close Modal"
      closeOnBackdropClick={false}
      closeOnEscape={false}
      showCloseButton={false}
      buttonText="Open Force Close Modal"
      description="This modal has all automatic close methods disabled."
    >
      <p>This modal demonstrates a force-close scenario where the user must complete an action.</p>
      <div className="mt-6 flex justify-end space-x-2">
        <Button variant="outline" size="sm">
          Cancel
        </Button>
        <Button size="sm">
          Confirm Action
        </Button>
      </div>
    </ModalDemo>
  ),
};

// Content examples
export const ConfirmationModal: Story = {
  render: () => (
    <ModalDemo
      title="Confirm Delete"
      size="sm"
      buttonText="Delete Item"
    >
      <div className="space-y-4">
        <p>Are you sure you want to delete this item? This action cannot be undone.</p>
        <div className="flex justify-end space-x-2">
          <Button variant="outline" size="sm">
            Cancel
          </Button>
          <Button variant="primary" size="sm">
            Delete
          </Button>
        </div>
      </div>
    </ModalDemo>
  ),
};

export const FormModal: Story = {
  render: () => (
    <ModalDemo
      title="Create New Account"
      size="lg"
      buttonText="Create Account"
      description="Fill out the form below to create a new user account."
    >
      <form className="space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Input
            label="First Name"
            placeholder="Enter first name"
            required
          />
          <Input
            label="Last Name"
            placeholder="Enter last name"
            required
          />
        </div>
        <Input
          label="Email Address"
          type="email"
          placeholder="Enter email address"
          required
        />
        <Input
          label="Password"
          type="password"
          placeholder="Create password"
          helperText="Password must be at least 8 characters"
          required
        />
        <Input
          label="Confirm Password"
          type="password"
          placeholder="Confirm password"
          required
        />
        <div className="flex justify-end space-x-2 mt-6">
          <Button variant="outline" size="sm">
            Cancel
          </Button>
          <Button type="submit" size="sm">
            Create Account
          </Button>
        </div>
      </form>
    </ModalDemo>
  ),
};

export const InformationModal: Story = {
  render: () => (
    <ModalDemo
      title="Product Information"
      size="lg"
      buttonText="View Details"
    >
      <div className="space-y-6">
        <div className="flex items-start space-x-4">
          <img
            src="https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=120&h=120&fit=crop"
            alt="Product"
            className="w-24 h-24 rounded-lg object-cover"
          />
          <div className="flex-1">
            <h3 className="text-lg font-semibold">Premium Sneakers</h3>
            <p className="text-2xl font-bold text-green-600 mt-1">$129.99</p>
            <p className="text-gray-600 mt-2">
              High-quality sneakers with premium materials and exceptional comfort.
            </p>
          </div>
        </div>
        
        <div className="border-t pt-4">
          <h4 className="font-semibold mb-2">Features</h4>
          <ul className="list-disc list-inside space-y-1 text-gray-600">
            <li>Premium leather construction</li>
            <li>Cushioned sole for all-day comfort</li>
            <li>Breathable mesh lining</li>
            <li>Durable rubber outsole</li>
          </ul>
        </div>
        
        <div className="flex justify-end space-x-2">
          <Button variant="outline" size="sm">
            Add to Wishlist
          </Button>
          <Button size="sm">
            Add to Cart
          </Button>
        </div>
      </div>
    </ModalDemo>
  ),
};

// Multiple modals example
export const NestedModals: Story = {
  render: () => {
    const [firstOpen, setFirstOpen] = useState(false);
    const [secondOpen, setSecondOpen] = useState(false);
    
    return (
      <>
        <Button onClick={() => setFirstOpen(true)}>
          Open First Modal
        </Button>
        
        <Modal
          isOpen={firstOpen}
          onClose={() => setFirstOpen(false)}
          title="First Modal"
          description="This modal can open another modal"
        >
          <p>This is the first modal. You can open another modal from here.</p>
          <div className="mt-4">
            <Button onClick={() => setSecondOpen(true)} size="sm">
              Open Second Modal
            </Button>
          </div>
        </Modal>
        
        <Modal
          isOpen={secondOpen}
          onClose={() => setSecondOpen(false)}
          title="Second Modal"
          size="sm"
        >
          <p>This is the second modal, opened from the first one.</p>
        </Modal>
      </>
    );
  },
  parameters: {
    docs: {
      description: {
        story: 'Example showing multiple modals that can be opened independently.',
      },
    },
  },
};

// Accessibility demonstration
export const AccessibilityFeatures: Story = {
  render: () => (
    <ModalDemo
      title="Accessibility Features"
      description="This modal demonstrates various accessibility features including focus management and keyboard navigation."
      buttonText="Open Accessible Modal"
    >
      <div className="space-y-4">
        <p>This modal includes several accessibility features:</p>
        <ul className="list-disc list-inside space-y-1 text-gray-600">
          <li>Focus is trapped within the modal</li>
          <li>Pressing Escape closes the modal</li>
          <li>Clicking the backdrop closes the modal</li>
          <li>Proper ARIA labels and roles</li>
          <li>Body scroll is prevented</li>
        </ul>
        
        <div className="space-y-2">
          <Input label="First Input" placeholder="Tab navigation test" />
          <Input label="Second Input" placeholder="Focus trap test" />
          <div className="flex space-x-2">
            <Button variant="outline" size="sm">Action 1</Button>
            <Button size="sm">Action 2</Button>
          </div>
        </div>
      </div>
    </ModalDemo>
  ),
  parameters: {
    docs: {
      description: {
        story: 'Demonstrates accessibility features like focus trapping, keyboard navigation, and proper ARIA attributes.',
      },
    },
  },
};

// Long content modal
export const ScrollableContent: Story = {
  render: () => (
    <ModalDemo
      title="Privacy Policy"
      size="lg"
      buttonText="View Privacy Policy"
      description="Our complete privacy policy with scrollable content."
    >
      <div className="space-y-4 max-h-96 overflow-y-auto">
        <h3 className="font-semibold">Information We Collect</h3>
        <p>We collect information you provide directly to us, such as when you create an account, make a purchase, subscribe to our newsletter, or contact us for support.</p>
        
        <h3 className="font-semibold">How We Use Your Information</h3>
        <p>We use the information we collect to provide, maintain, and improve our services, process transactions, send communications, and comply with legal obligations.</p>
        
        <h3 className="font-semibold">Information Sharing</h3>
        <p>We do not sell, trade, or otherwise transfer your personal information to third parties without your consent, except as described in this policy.</p>
        
        <h3 className="font-semibold">Data Security</h3>
        <p>We implement appropriate security measures to protect your personal information against unauthorized access, alteration, disclosure, or destruction.</p>
        
        <h3 className="font-semibold">Your Rights</h3>
        <p>You have the right to access, update, or delete your personal information. You may also opt out of certain communications from us.</p>
        
        <h3 className="font-semibold">Contact Us</h3>
        <p>If you have any questions about this privacy policy, please contact us at privacy@example.com.</p>
        
        <div className="pt-4 border-t">
          <p className="text-sm text-gray-500">Last updated: March 15, 2024</p>
        </div>
      </div>
      
      <div className="flex justify-end mt-4">
        <Button size="sm">I Accept</Button>
      </div>
    </ModalDemo>
  ),
  parameters: {
    docs: {
      description: {
        story: 'Modal with scrollable content for longer text or complex layouts.',
      },
    },
  },
};