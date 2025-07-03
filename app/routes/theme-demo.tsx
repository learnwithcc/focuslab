import { ThemeToggle, MobileThemeToggle } from "~/components/ui/theme-toggle";

export default function ThemeDemo() {
  return (
    <div className="min-h-screen bg-white dark:bg-gray-900 transition-colors">
      <div className="container mx-auto px-4 py-16">
        <div className="max-w-2xl mx-auto space-y-8">
          <div className="text-center">
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-4">
              Theme System Demo
            </h1>
            <p className="text-gray-600 dark:text-gray-400">
              Testing our new ShadCN-style theme toggle components built with Radix UI and next-themes.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {/* Desktop Toggle */}
            <div className="p-6 bg-gray-50 dark:bg-gray-800 rounded-lg">
              <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                Desktop Theme Toggle
              </h2>
              <p className="text-gray-600 dark:text-gray-400 mb-4">
                Switch component with sun/moon icons
              </p>
              <ThemeToggle />
            </div>

            {/* Mobile Toggle */}
            <div className="p-6 bg-gray-50 dark:bg-gray-800 rounded-lg">
              <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                Mobile Theme Toggle
              </h2>
              <p className="text-gray-600 dark:text-gray-400 mb-4">
                Button component for mobile interfaces
              </p>
              <MobileThemeToggle />
            </div>
          </div>

          {/* Demo Cards */}
          <div className="space-y-4">
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
              Theme Testing Cards
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {[1, 2, 3].map((i) => (
                <div
                  key={i}
                  className="p-4 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg shadow-sm"
                >
                  <h3 className="font-medium text-gray-900 dark:text-white mb-2">
                    Card {i}
                  </h3>
                  <p className="text-gray-600 dark:text-gray-400 text-sm">
                    This card should switch between light and dark themes smoothly.
                  </p>
                </div>
              ))}
            </div>
          </div>

          {/* Glassmorphic Test */}
          <div className="relative">
            <div className="absolute inset-0 bg-gradient-to-r from-blue-600 to-purple-600 rounded-lg"></div>
            <div className="relative backdrop-blur-sm bg-white/80 dark:bg-gray-900/80 p-6 rounded-lg border border-white/20 dark:border-gray-700/20">
              <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
                Glassmorphic Effect Test
              </h2>
              <p className="text-gray-600 dark:text-gray-400">
                This card demonstrates the glassmorphic effects similar to what the header should have.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
} 