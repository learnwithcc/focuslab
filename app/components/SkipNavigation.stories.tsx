import type { Meta, StoryObj } from '@storybook/react';
import { SkipNavigation } from './SkipNavigation';

const meta: Meta<typeof SkipNavigation> = {
  title: 'Accessibility/SkipNavigation',
  component: SkipNavigation,
  parameters: {
    layout: 'fullscreen',
    docs: {
      description: {
        component: 'WCAG 2.1 AA compliant skip navigation component. Press Tab to see the skip link appear, then press Enter to test navigation.',
      },
    },
  },
  argTypes: {
    targetId: {
      control: 'text',
      description: 'ID of the main content element to skip to',
    },
    className: {
      control: 'text',
      description: 'Additional CSS classes',
    },
  },
};

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  args: {
    targetId: 'main-content',
  },
  render: (args) => (
    <div>
      <SkipNavigation {...args} />
      <header style={{ 
        padding: '1rem', 
        backgroundColor: '#f3f4f6', 
        borderBottom: '1px solid #e5e7eb' 
      }}>
        <h1>Website Header</h1>
        <nav>
          <a href="#" style={{ marginRight: '1rem' }}>Home</a>
          <a href="#" style={{ marginRight: '1rem' }}>About</a>
          <a href="#" style={{ marginRight: '1rem' }}>Services</a>
          <a href="#" style={{ marginRight: '1rem' }}>Contact</a>
        </nav>
      </header>
      <main 
        id="main-content" 
        style={{ 
          padding: '2rem',
          minHeight: '60vh',
          backgroundColor: '#ffffff',
          border: '2px dashed #3b82f6',
        }}
        tabIndex={-1}
      >
        <h2>Main Content Area</h2>
        <p>This is the main content area that the skip navigation link will focus.</p>
        <p>To test the skip navigation:</p>
        <ol>
          <li>Press <kbd>Tab</kbd> to focus the skip link (it will appear at the top)</li>
          <li>Press <kbd>Enter</kbd> or <kbd>Space</kbd> to activate it</li>
          <li>Focus should move here to this main content area</li>
          <li>You can also try <kbd>Alt+S</kbd> to focus the skip link directly</li>
        </ol>
        <p>The skip link helps keyboard and screen reader users bypass repetitive navigation content.</p>
      </main>
    </div>
  ),
};

export const CustomTarget: Story = {
  args: {
    targetId: 'custom-main',
  },
  render: (args) => (
    <div>
      <SkipNavigation {...args} />
      <header style={{ 
        padding: '1rem', 
        backgroundColor: '#f3f4f6',
        borderBottom: '1px solid #e5e7eb'
      }}>
        <h1>Website Header</h1>
        <nav>
          <a href="#" style={{ marginRight: '1rem' }}>Navigation Link 1</a>
          <a href="#" style={{ marginRight: '1rem' }}>Navigation Link 2</a>
          <a href="#" style={{ marginRight: '1rem' }}>Navigation Link 3</a>
        </nav>
      </header>
      <div style={{ padding: '1rem', backgroundColor: '#fef3c7' }}>
        <p>Additional content area (sidebar, ads, etc.)</p>
      </div>
      <main 
        id="custom-main" 
        style={{ 
          padding: '2rem',
          minHeight: '60vh',
          backgroundColor: '#ffffff',
          border: '2px dashed #10b981',
        }}
        tabIndex={-1}
      >
        <h2>Custom Target Main Content</h2>
        <p>This demonstrates using a custom target ID for the skip navigation.</p>
        <p>The skip link will focus this element when activated.</p>
      </main>
    </div>
  ),
};

export const AccessibilityDemo: Story = {
  args: {
    targetId: 'demo-main',
  },
  render: (args) => (
    <div>
      <SkipNavigation {...args} />
      
      {/* Simulate a complex header with many focusable elements */}
      <header style={{ 
        padding: '1rem', 
        backgroundColor: '#1f2937', 
        color: 'white',
        borderBottom: '1px solid #374151'
      }}>
        <div style={{ marginBottom: '1rem' }}>
          <input type="search" placeholder="Search..." style={{ marginRight: '1rem', padding: '0.5rem' }} />
          <button style={{ marginRight: '1rem', padding: '0.5rem 1rem' }}>Search</button>
          <button style={{ padding: '0.5rem 1rem' }}>Login</button>
        </div>
        <nav>
          <a href="#" style={{ marginRight: '1rem', color: 'white' }}>Home</a>
          <a href="#" style={{ marginRight: '1rem', color: 'white' }}>Products</a>
          <a href="#" style={{ marginRight: '1rem', color: 'white' }}>Services</a>
          <a href="#" style={{ marginRight: '1rem', color: 'white' }}>About</a>
          <a href="#" style={{ marginRight: '1rem', color: 'white' }}>Blog</a>
          <a href="#" style={{ marginRight: '1rem', color: 'white' }}>Support</a>
          <a href="#" style={{ marginRight: '1rem', color: 'white' }}>Contact</a>
        </nav>
      </header>
      
      {/* Breadcrumb navigation */}
      <div style={{ 
        padding: '0.5rem 1rem', 
        backgroundColor: '#f9fafb',
        borderBottom: '1px solid #e5e7eb'
      }}>
        <nav aria-label="Breadcrumb">
          <a href="#" style={{ marginRight: '0.5rem' }}>Home</a>
          <span style={{ marginRight: '0.5rem' }}>›</span>
          <a href="#" style={{ marginRight: '0.5rem' }}>Category</a>
          <span style={{ marginRight: '0.5rem' }}>›</span>
          <span>Current Page</span>
        </nav>
      </div>
      
      {/* Sidebar with more navigation */}
      <div style={{ display: 'flex' }}>
        <aside style={{ 
          width: '200px', 
          padding: '1rem', 
          backgroundColor: '#f3f4f6',
          borderRight: '1px solid #e5e7eb'
        }}>
          <h3>Categories</h3>
          <ul style={{ listStyle: 'none', padding: 0 }}>
            <li style={{ marginBottom: '0.5rem' }}>
              <a href="#" style={{ textDecoration: 'none' }}>Category 1</a>
            </li>
            <li style={{ marginBottom: '0.5rem' }}>
              <a href="#" style={{ textDecoration: 'none' }}>Category 2</a>
            </li>
            <li style={{ marginBottom: '0.5rem' }}>
              <a href="#" style={{ textDecoration: 'none' }}>Category 3</a>
            </li>
            <li style={{ marginBottom: '0.5rem' }}>
              <a href="#" style={{ textDecoration: 'none' }}>Category 4</a>
            </li>
          </ul>
        </aside>
        
        <main 
          id="demo-main" 
          style={{ 
            flex: 1,
            padding: '2rem',
            backgroundColor: '#ffffff',
            border: '3px solid #ef4444',
            margin: '1rem'
          }}
          tabIndex={-1}
        >
          <h1>Main Content - Finally!</h1>
          <p><strong>Without skip navigation</strong>, keyboard users would need to tab through:</p>
          <ul>
            <li>Search input field</li>
            <li>Search button</li>
            <li>Login button</li>
            <li>7 main navigation links</li>
            <li>3 breadcrumb links</li>
            <li>4 sidebar category links</li>
          </ul>
          <p>That's <strong>17 tab presses</strong> just to reach this main content!</p>
          
          <p><strong>With skip navigation</strong>, users can:</p>
          <ul>
            <li>Press <kbd>Tab</kbd> once to focus the skip link</li>
            <li>Press <kbd>Enter</kbd> to jump directly here</li>
            <li>Or use <kbd>Alt+S</kbd> as a shortcut</li>
          </ul>
          
          <div style={{ 
            padding: '1rem', 
            backgroundColor: '#dcfce7', 
            border: '1px solid #16a34a',
            borderRadius: '0.5rem',
            marginTop: '2rem'
          }}>
            <p><strong>Accessibility Impact:</strong></p>
            <ul>
              <li>Significantly improves navigation efficiency</li>
              <li>Reduces cognitive load for users with disabilities</li>
              <li>Meets WCAG 2.1 AA Success Criterion 2.4.1</li>
              <li>Enhances overall user experience</li>
            </ul>
          </div>
        </main>
      </div>
    </div>
  ),
};