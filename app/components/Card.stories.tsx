import type { Meta, StoryObj } from '@storybook/react';
import { Card, CardHeader, CardContent, CardFooter, CardImage, Button } from '~/components';

const meta: Meta<typeof Card> = {
  title: 'Components/Card',
  component: Card,
  parameters: {
    layout: 'padded',
    docs: {
      description: {
        component: 'A flexible card component with header, content, footer, and image sub-components. Supports multiple variants, padding options, and interactive states.',
      },
    },
  },
  argTypes: {
    variant: {
      control: 'select',
      options: ['default', 'elevated', 'outlined'],
      description: 'Visual variant of the card',
    },
    padding: {
      control: 'select',
      options: ['none', 'sm', 'md', 'lg'],
      description: 'Internal padding of the card',
    },
    interactive: {
      control: 'boolean',
      description: 'Whether the card is clickable/interactive',
    },
    onClick: {
      action: 'clicked',
      description: 'Click handler for interactive cards',
    },
  },
  tags: ['autodocs'],
};

export default meta;
type Story = StoryObj<typeof Card>;

// Basic card examples
export const Default: Story = {
  args: {
    children: (
      <>
        <CardHeader>Card Title</CardHeader>
        <CardContent>
          This is the default card variant with standard styling and medium padding.
        </CardContent>
      </>
    ),
  },
};

export const SimpleCard: Story = {
  args: {
    children: 'Simple card with just text content.',
    padding: 'md',
  },
};

// Card variants
export const Elevated: Story = {
  args: {
    variant: 'elevated',
    children: (
      <>
        <CardHeader>Elevated Card</CardHeader>
        <CardContent>
          This card has an elevated appearance with shadow styling.
        </CardContent>
      </>
    ),
  },
};

export const Outlined: Story = {
  args: {
    variant: 'outlined',
    children: (
      <>
        <CardHeader>Outlined Card</CardHeader>
        <CardContent>
          This card features a prominent border outline for emphasis.
        </CardContent>
      </>
    ),
  },
};

// Padding variants
export const NoPadding: Story = {
  args: {
    padding: 'none',
    children: (
      <div className="p-6">
        <CardHeader>No Padding Card</CardHeader>
        <CardContent>
          This card has no internal padding, giving you full control over spacing.
        </CardContent>
      </div>
    ),
  },
};

export const SmallPadding: Story = {
  args: {
    padding: 'sm',
    children: (
      <>
        <CardHeader>Small Padding</CardHeader>
        <CardContent>
          This card uses small padding for a more compact layout.
        </CardContent>
      </>
    ),
  },
};

export const LargePadding: Story = {
  args: {
    padding: 'lg',
    children: (
      <>
        <CardHeader>Large Padding</CardHeader>
        <CardContent>
          This card uses large padding for a more spacious, premium feel.
        </CardContent>
      </>
    ),
  },
};

// Interactive cards
export const Interactive: Story = {
  args: {
    interactive: true,
    variant: 'elevated',
    children: (
      <>
        <CardHeader>Interactive Card</CardHeader>
        <CardContent>
          Click this card to see the interaction in action. Interactive cards can be clicked and have hover effects.
        </CardContent>
      </>
    ),
  },
};

export const ClickableCard: Story = {
  args: {
    interactive: true,
    onClick: () => alert('Card clicked!'),
    children: (
      <>
        <CardHeader>Clickable Card</CardHeader>
        <CardContent>
          This card triggers an alert when clicked. Perfect for navigation cards or action items.
        </CardContent>
      </>
    ),
  },
};

// Card with image
export const WithImage: Story = {
  args: {
    padding: 'none',
    children: (
      <>
        <CardImage
          src="https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=400&h=300&fit=crop"
          alt="Mountain landscape"
          aspectRatio="video"
        />
        <div className="p-6">
          <CardHeader>Mountain Adventure</CardHeader>
          <CardContent>
            Explore breathtaking mountain landscapes and discover hidden trails in this amazing adventure.
          </CardContent>
        </div>
      </>
    ),
  },
};

// Complete card examples
export const ProductCard: Story = {
  args: {
    variant: 'elevated',
    padding: 'none',
    children: (
      <>
        <CardImage
          src="https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=400&h=300&fit=crop"
          alt="Red sneakers"
          aspectRatio="square"
        />
        <div className="p-6">
          <CardHeader level={3}>Premium Sneakers</CardHeader>
          <CardContent>
            <p className="text-gray-600 mb-4">
              High-quality sneakers with premium materials and exceptional comfort.
            </p>
            <div className="text-2xl font-bold text-gray-900">$129.99</div>
          </CardContent>
          <CardFooter justify="between">
            <Button variant="outline" size="sm">
              Add to Wishlist
            </Button>
            <Button variant="primary" size="sm">
              Add to Cart
            </Button>
          </CardFooter>
        </div>
      </>
    ),
  },
};

export const ProfileCard: Story = {
  args: {
    variant: 'outlined',
    children: (
      <>
        <CardHeader>
          <div className="flex items-center space-x-4">
            <img
              src="https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=64&h=64&fit=crop&crop=faces"
              alt="Profile"
              className="w-12 h-12 rounded-full"
            />
            <div>
              <h3 className="text-lg font-semibold">John Doe</h3>
              <p className="text-sm text-gray-500">Software Engineer</p>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <p className="text-gray-600">
            Passionate about creating exceptional user experiences and building scalable applications.
          </p>
        </CardContent>
        <CardFooter>
          <Button variant="primary" size="sm">
            Connect
          </Button>
        </CardFooter>
      </>
    ),
  },
};

export const BlogPostCard: Story = {
  args: {
    interactive: true,
    children: (
      <>
        <CardImage
          src="https://images.unsplash.com/photo-1486312338219-ce68d2c6f44d?w=400&h=200&fit=crop"
          alt="Laptop and coffee"
          aspectRatio="video"
        />
        <div className="p-6">
          <CardHeader level={4}>The Future of Web Development</CardHeader>
          <CardContent>
            <p className="text-gray-600 mb-4">
              Exploring the latest trends and technologies shaping the future of web development.
            </p>
            <div className="flex items-center text-sm text-gray-500">
              <span>By Jane Smith</span>
              <span className="mx-2">•</span>
              <span>5 min read</span>
              <span className="mx-2">•</span>
              <span>March 15, 2024</span>
            </div>
          </CardContent>
        </div>
      </>
    ),
  },
};

// Card compositions
export const CardGrid: Story = {
  render: () => (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
      <Card variant="default">
        <CardHeader>Feature 1</CardHeader>
        <CardContent>
          Description of the first feature with some details about its functionality.
        </CardContent>
      </Card>
      <Card variant="elevated">
        <CardHeader>Feature 2</CardHeader>
        <CardContent>
          Description of the second feature with some details about its functionality.
        </CardContent>
      </Card>
      <Card variant="outlined">
        <CardHeader>Feature 3</CardHeader>
        <CardContent>
          Description of the third feature with some details about its functionality.
        </CardContent>
      </Card>
    </div>
  ),
  parameters: {
    docs: {
      description: {
        story: 'Example of cards arranged in a responsive grid layout.',
      },
    },
  },
};

// Card with different aspect ratios
export const ImageAspectRatios: Story = {
  render: () => (
    <div className="space-y-6">
      <div>
        <h3 className="mb-4 text-lg font-semibold">Square Aspect Ratio</h3>
        <Card padding="none" className="max-w-xs">
          <CardImage
            src="https://images.unsplash.com/photo-1566438480900-0609be27a4be?w=300&h=300&fit=crop"
            alt="City lights"
            aspectRatio="square"
          />
          <div className="p-4">
            <CardContent>Square image format (1:1)</CardContent>
          </div>
        </Card>
      </div>
      
      <div>
        <h3 className="mb-4 text-lg font-semibold">Video Aspect Ratio</h3>
        <Card padding="none" className="max-w-md">
          <CardImage
            src="https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=400&h=225&fit=crop"
            alt="Mountain view"
            aspectRatio="video"
          />
          <div className="p-4">
            <CardContent>Video aspect ratio (16:9)</CardContent>
          </div>
        </Card>
      </div>
      
      <div>
        <h3 className="mb-4 text-lg font-semibold">Wide Aspect Ratio</h3>
        <Card padding="none" className="max-w-lg">
          <CardImage
            src="https://images.unsplash.com/photo-1586348943529-beaae6c28db9?w=600&h=200&fit=crop"
            alt="Ocean view"
            aspectRatio="wide"
          />
          <div className="p-4">
            <CardContent>Wide format (3:1)</CardContent>
          </div>
        </Card>
      </div>
    </div>
  ),
  parameters: {
    docs: {
      description: {
        story: 'Different aspect ratio options for card images.',
      },
    },
  },
};

// Dark mode examples
export const DarkModeVariants: Story = {
  render: () => (
    <div className="space-y-6 p-6 bg-gray-900 rounded-lg">
      <Card variant="default">
        <CardHeader>Default in Dark Mode</CardHeader>
        <CardContent>
          Default card styling in dark mode theme.
        </CardContent>
      </Card>
      <Card variant="elevated">
        <CardHeader>Elevated in Dark Mode</CardHeader>
        <CardContent>
          Elevated card with shadow in dark mode theme.
        </CardContent>
      </Card>
      <Card variant="outlined">
        <CardHeader>Outlined in Dark Mode</CardHeader>
        <CardContent>
          Outlined card with border in dark mode theme.
        </CardContent>
      </Card>
    </div>
  ),
  parameters: {
    backgrounds: { default: 'dark' },
    docs: {
      description: {
        story: 'Card variants displayed in dark mode theme.',
      },
    },
  },
};

// All padding options
export const AllPaddingOptions: Story = {
  render: () => (
    <div className="space-y-4">
      <Card padding="none" variant="outlined">
        <div className="p-2 bg-blue-50 text-blue-700 text-sm">No Padding</div>
        <div className="p-4">Content area with manual padding</div>
      </Card>
      <Card padding="sm" variant="outlined">
        <div className="bg-blue-50 text-blue-700 text-sm -m-4 p-2 mb-4">Small Padding</div>
        <CardContent>Content with small padding</CardContent>
      </Card>
      <Card padding="md" variant="outlined">
        <div className="bg-blue-50 text-blue-700 text-sm -m-6 p-2 mb-4">Medium Padding (Default)</div>
        <CardContent>Content with medium padding</CardContent>
      </Card>
      <Card padding="lg" variant="outlined">
        <div className="bg-blue-50 text-blue-700 text-sm -m-8 p-2 mb-4">Large Padding</div>
        <CardContent>Content with large padding</CardContent>
      </Card>
    </div>
  ),
  parameters: {
    docs: {
      description: {
        story: 'Comparison of all available padding options.',
      },
    },
  },
};

// Header levels
export const HeaderLevels: Story = {
  render: () => (
    <div className="space-y-4">
      <Card>
        <CardHeader level={1}>Header Level 1</CardHeader>
        <CardContent>Card with h1 header</CardContent>
      </Card>
      <Card>
        <CardHeader level={2}>Header Level 2</CardHeader>
        <CardContent>Card with h2 header</CardContent>
      </Card>
      <Card>
        <CardHeader level={3}>Header Level 3 (Default)</CardHeader>
        <CardContent>Card with h3 header</CardContent>
      </Card>
      <Card>
        <CardHeader level={4}>Header Level 4</CardHeader>
        <CardContent>Card with h4 header</CardContent>
      </Card>
    </div>
  ),
  parameters: {
    docs: {
      description: {
        story: 'Different heading levels available for card headers.',
      },
    },
  },
};

// Footer justification options
export const FooterJustification: Story = {
  render: () => (
    <div className="space-y-4">
      <Card>
        <CardHeader>Start Justified Footer</CardHeader>
        <CardContent>Content above footer</CardContent>
        <CardFooter justify="start">
          <Button size="sm">Action</Button>
        </CardFooter>
      </Card>
      <Card>
        <CardHeader>Center Justified Footer</CardHeader>
        <CardContent>Content above footer</CardContent>
        <CardFooter justify="center">
          <Button size="sm">Action</Button>
        </CardFooter>
      </Card>
      <Card>
        <CardHeader>End Justified Footer</CardHeader>
        <CardContent>Content above footer</CardContent>
        <CardFooter justify="end">
          <Button size="sm">Action</Button>
        </CardFooter>
      </Card>
      <Card>
        <CardHeader>Space Between Footer</CardHeader>
        <CardContent>Content above footer</CardContent>
        <CardFooter justify="between">
          <Button variant="outline" size="sm">Cancel</Button>
          <Button size="sm">Confirm</Button>
        </CardFooter>
      </Card>
    </div>
  ),
  parameters: {
    docs: {
      description: {
        story: 'Different justification options for card footers.',
      },
    },
  },
};