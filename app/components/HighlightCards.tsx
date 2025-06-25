import React from 'react';

interface HighlightCard {
  title: string;
  description: string;
  icon: React.ReactNode;
  color: 'purple' | 'teal' | 'orange';
}

const highlights: HighlightCard[] = [
  {
    title: "Reducing Cognitive Load",
    description: "Simplifying interfaces and workflows to preserve mental energy for what matters",
    icon: (
      <div className="flex h-12 w-12 items-center justify-center rounded-full bg-purple-100 dark:bg-purple-900/30">
        <svg className="h-6 w-6 text-primary-purple dark:text-purple-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
      </div>
    ),
    color: 'purple'
  },
  {
    title: "Minimizing Decision Fatigue",
    description: "Creating opinionated tools that eliminate unnecessary choices",
    icon: (
      <div className="flex h-12 w-12 items-center justify-center rounded-full bg-teal-100 dark:bg-teal-900/30">
        <svg className="h-6 w-6 text-teal-primary dark:text-teal-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
        </svg>
      </div>
    ),
    color: 'teal'
  },
  {
    title: "Streamlining Context Switching",
    description: "Building systems that maintain continuity between different work modes",
    icon: (
      <div className="flex h-12 w-12 items-center justify-center rounded-full bg-orange-100 dark:bg-orange-900/30">
        <svg className="h-6 w-6 text-orange-accent dark:text-orange-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4" />
        </svg>
      </div>
    ),
    color: 'orange'
  }
];

const colorClasses = {
  purple: {
    title: 'text-primary-purple dark:text-purple-400',
    card: 'border-purple-200 dark:border-purple-800 bg-gradient-to-br from-purple-50 to-white dark:from-gray-900 dark:to-gray-950'
  },
  teal: {
    title: 'text-teal-primary dark:text-teal-400',
    card: 'border-teal-200 dark:border-teal-800 bg-gradient-to-br from-teal-50 to-white dark:from-gray-900 dark:to-gray-950'
  },
  orange: {
    title: 'text-orange-accent dark:text-orange-400',
    card: 'border-orange-200 dark:border-orange-800 bg-gradient-to-br from-orange-50 to-white dark:from-gray-900 dark:to-gray-950'
  }
};

export function HighlightCards() {
  return (
    <section className="bg-white dark:bg-gray-950">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        <div className="py-16 text-center lg:py-20">
          <h2 className="mb-4 text-3xl font-bold text-primary-purple dark:text-white sm:text-4xl">
            <span className="bg-gradient-to-r from-teal-primary to-primary-purple bg-clip-text text-transparent">
              What We're Building
            </span>
          </h2>
          <p className="mx-auto mb-12 max-w-4xl text-lg text-gray-700 dark:text-gray-200 sm:text-xl">
            FocusLab is developing specialized tools that enhance productivity for developers with ADHD, autism, and other 
            neurodivergent traits. Our approach isn't about "fixing" anything—it's about creating technology that works with your 
            brain, not against it:
          </p>
          
          <div className="grid grid-cols-1 gap-8 md:grid-cols-3">
            {highlights.map((highlight) => (
              <div
                key={highlight.title}
                className={`rounded-2xl border p-8 text-left transition-all duration-300 hover:scale-105 ${colorClasses[highlight.color].card}`}
              >
                <div className="mb-6">
                  {highlight.icon}
                </div>
                <h3 className={`mb-4 text-xl font-bold ${colorClasses[highlight.color].title}`}>
                  {highlight.title}
                </h3>
                <p className="text-gray-600 dark:text-gray-300">
                  {highlight.description}
                </p>
              </div>
            ))}
          </div>
          
          <div className="mt-12">
            <p className="text-gray-600 dark:text-gray-200">
              While most of our projects are still in development, we're excited to be launching select tools to the community soon.
            </p>
          </div>
        </div>
      </div>
    </section>
  );
}