import { Link } from '@remix-run/react';

export function Footer() {
  return (
    <footer
      role="contentinfo"
      className="bg-muted text-muted-foreground py-6 px-4 md:px-6"
    >
      <div className="container mx-auto grid grid-cols-1 md:grid-cols-4 gap-8">
        <div className="flex flex-col gap-2 md:col-span-2">
          <h3 className="text-lg font-semibold">Focus Lab</h3>
          <p className="text-sm">A design and development agency.</p>
          <p className="text-sm">
            &copy; {new Date().getFullYear()} Focus Lab. All rights reserved.
          </p>
        </div>
        <div className="flex flex-col space-y-2">
          <h3 className="text-lg font-semibold">Company</h3>
          <Link to="/about" className="hover:underline text-sm">
            About
          </Link>
          <Link to="/contact" className="hover:underline text-sm">
            Contact
          </Link>
          <Link to="/blog" className="hover:underline text-sm">
            Blog
          </Link>
        </div>
        <div className="flex flex-col space-y-2">
          <h3 className="text-lg font-semibold">Legal</h3>
          <Link to="/privacy-policy" className="hover:underline text-sm">
            Privacy Policy
          </Link>
          <Link to="/terms-of-service" className="hover:underline text-sm">
            Terms of Service
          </Link>
          <Link to="/accessibility-statement" className="hover:underline text-sm">
            Accessibility
          </Link>
        </div>
      </div>
    </footer>
  );
} 