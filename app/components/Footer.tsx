import { Link } from '@remix-run/react';

export function Footer() {
  return (
    <footer role="contentinfo" className="bg-muted text-muted-foreground py-6 px-4 md:px-6">
      <div className="container mx-auto flex flex-col md:flex-row items-center justify-between">
        <p className="text-sm">&copy; {new Date().getFullYear()} Focus Lab. All rights reserved.</p>
        <nav className="flex gap-4 sm:gap-6 mt-4 md:mt-0">
          <Link to="/privacy-policy" className="text-sm hover:underline">
            Privacy Policy
          </Link>
          <Link to="/terms-of-service" className="text-sm hover:underline">
            Terms of Service
          </Link>
        </nav>
      </div>
    </footer>
  );
} 