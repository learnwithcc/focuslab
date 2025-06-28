import type { MetaFunction, ActionFunctionArgs } from "@remix-run/node";
import { json } from "@remix-run/node";
import { Button, Card, GitHubIcon, HighlightCards } from "~/components";
import { Section, Container } from "~/components/Layout";
import { validateForm, newsletterSchema } from "~/utils/validation";
import { checkRateLimit, subscribeToNewsletter } from "~/utils/server";
import { generateMeta, generatePageUrl } from "~/utils/seo";
import { Link } from "@remix-run/react";

export const meta: MetaFunction = () => {
  return generateMeta({
    url: generatePageUrl('/'),
    canonical: 'https://focuslab.dev/',
    // Temporarily disabled to fix React mounting issues
    // includeOrganizationSchema: true,
    // includeWebsiteSchema: true,
  });
};

export async function action({ request }: ActionFunctionArgs) {
  const formData = await request.formData();
  
  return validateForm(
    formData,
    newsletterSchema,
    async (data) => {
      const { email } = data;
      // Get client IP for rate limiting
      const clientIp = request.headers.get('x-forwarded-for')?.split(',')[0] || 
                      request.headers.get('x-real-ip') || 
                      '127.0.0.1';

      // Check rate limit
      const rateLimitResult = await checkRateLimit(clientIp);
      if (!rateLimitResult.success || !rateLimitResult.isAllowed) {
        return json(
          {
            success: false,
            error: 'Too many subscription attempts. Please try again later.',
            reset: rateLimitResult.reset,
            remaining: rateLimitResult.remaining,
          },
          { 
            status: 429,
            headers: {
              'X-RateLimit-Limit': rateLimitResult.limit?.toString() || '3',
              'X-RateLimit-Remaining': rateLimitResult.remaining?.toString() || '0',
              'X-RateLimit-Reset': rateLimitResult.reset?.toString() || '',
              'Retry-After': rateLimitResult.reset ? 
                Math.ceil((rateLimitResult.reset - Date.now()) / 1000).toString() : 
                '3600'
            }
          }
        );
      }

      // Subscribe to newsletter with GDPR consent
      const subscriptionResult = await subscribeToNewsletter({ email, gdprConsent: true }); // Assuming consent from form
      if (!subscriptionResult.success) {
        return json(
          {
            success: false,
            error: subscriptionResult.error || 'Failed to subscribe to newsletter',
          },
          { status: subscriptionResult.error?.includes('already subscribed') ? 409 : 500 }
        );
      }

      return json(
        {
          success: true,
          message: 'Successfully subscribed to newsletter!',
          remaining: rateLimitResult.remaining,
          subscriber: subscriptionResult.data,
        },
        { 
          status: 200,
          headers: {
            'X-RateLimit-Limit': rateLimitResult.limit?.toString() || '3',
            'X-RateLimit-Remaining': rateLimitResult.remaining?.toString() || '0',
            'X-RateLimit-Reset': rateLimitResult.reset?.toString() || ''
          }
        }
      );
    }
  );
}

const featuredProjects = [
  {
    title: "Tally MCP Server",
    description:
      "A powerful form management integration that connects Tally.so directly to AI assistants through the Model Context Protocol, enabling natural language form creation and management without context switching. It features intelligent bulk operations with safety-first workflows, real-time response analytics, and automated form lifecycle management designed to streamline workflows for content creators and developers.",
    href: "https://github.com/learnwithcc/tally-mcp",
    tags: ["MCP", "TypeScript", "API", "Form Management"],
  },
  {
    title: "FocusLab Website",
    description:
      "The official website for FocusLab, built with Remix, Tailwind CSS, and TypeScript. It serves as a central hub for our tools, resources, and community, showcasing our commitment to accessible and neurodivergent-friendly design.",
    href: "https://github.com/focus-lab-ltd/focuslab",
    tags: ["Remix", "React", "Tailwind CSS", "TypeScript"],
  },
];

export default function Index() {
  return (
    <div className="min-h-screen bg-white dark:bg-gray-975">
      <main className="w-full">
        {/* Hero Section */}
        <div className="w-full bg-white dark:bg-header-bg">
          <Section spacing="lg">
            <Container maxWidth="7xl">
              <div className="text-center">
                <h1 className="leading-tight text-6xl font-bold text-primary-purple dark:text-header-primary-text sm:text-7xl lg:text-8xl xl:text-9xl">
                  Tech Tools
                </h1>
                <p className="mt-4 text-3xl font-semibold text-teal-primary dark:text-header-secondary-text sm:text-4xl lg:text-5xl xl:text-6xl">
                  Built for Your Beautiful Brain!
                </p>
                <p className="mx-auto mt-6 max-w-4xl leading-relaxed text-lg text-gray-600 dark:text-gray-200 sm:text-xl lg:text-2xl">
                  Creating accessible, intuitive development solutions that work
                  with your brain, not against it. Empowering neurodivergent
                  developers to build amazing things.
                </p>
                <div className="relative isolate">
                  <div className="mt-10 flex flex-col items-center gap-4 sm:flex-row sm:justify-center">
                    <Link to="/contact" prefetch="intent">
                      <Button className="w-full px-8 py-4 text-lg font-semibold sm:w-auto motion-safe:transition-transform motion-reduce:transform-none duration-200 hover:scale-105">
                        Get in Touch
                      </Button>
                    </Link>
                    <Link to="/#featured-projects">
                      <Button
                        variant="secondary"
                        className="w-full px-8 py-4 text-lg sm:w-auto motion-safe:transition-transform motion-reduce:transform-none duration-200 hover:scale-105"
                      >
                        View Our Work
                      </Button>
                    </Link>
                  </div>
                </div>
              </div>
            </Container>
          </Section>
        </div>

        {/* Mission Statement Section */}
        <div className="w-full bg-gradient-to-r from-teal-50 to-purple-50 dark:from-teal-900/20 dark:to-purple-900/20">
          <Section spacing="lg">
            <Container maxWidth="7xl">
              <div className="grid grid-cols-1 items-center gap-12 lg:grid-cols-2 lg:gap-16">
                {/* Mission Statement Content */}
                <div className="order-2 lg:order-1">
                  <h2 className="mb-6 text-3xl font-bold text-primary-purple dark:text-white sm:text-4xl">
                    Our Mission
                  </h2>
                  <div className="space-y-6 leading-relaxed text-lg text-gray-600 dark:text-gray-200">
                    <p>
                      Every developer deserves tools that work <em>with</em>{" "}
                      their unique way of thinking, not against it. We're
                      building development solutions specifically designed for
                      neurodivergent minds—tools that reduce cognitive load,
                      enhance focus, and celebrate different ways of processing
                      information.
                    </p>
                    <p>
                      Whether you're ADHD, autistic, dyslexic, or think
                      differently in any way, our mission is to create an
                      ecosystem where your neurodivergent traits become
                      superpowers in your development journey.
                    </p>
                  </div>
                </div>

                {/* Founder Story */}
                <div className="order-1 lg:order-2">
                  <div className="rounded-2xl border border-gray-200 bg-white p-8 shadow-lg dark:border-gray-800 dark:bg-gray-950">
                    <div className="mb-6 flex items-center">
                      <div className="flex h-16 w-16 items-center justify-center rounded-full bg-gradient-to-br from-teal-primary to-primary-purple text-2xl font-bold text-white">
                        F
                      </div>
                      <div className="ml-4">
                        <h3 className="text-xl font-semibold text-primary-purple dark:text-white">
                          Founder's Story
                        </h3>
                        <p className="text-gray-600 dark:text-gray-300">
                          Building from experience
                        </p>
                      </div>
                    </div>
                    <blockquote className="leading-relaxed text-gray-700 dark:text-gray-200">
                      "As a neurodivergent developer, I've experienced firsthand
                      the frustration of tools that seem designed for
                      neurotypical workflows. After years of adapting myself to
                      fit the tools, I realized we needed tools that adapt to us
                      instead. FocusLab was born from this vision—creating
                      development environments that embrace neurodiversity as a
                      strength."
                    </blockquote>
                    <div className="mt-6 border-t border-gray-200 pt-4 dark:border-gray-700">
                      <p className="text-sm text-gray-500 dark:text-gray-400">
                        <strong className="text-gray-700 dark:text-gray-200">
                          FocusLab Founder
                        </strong>{" "}
                        — Passionate about inclusive development tools
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </Container>
          </Section>
        </div>

        {/* What We're Building Section */}
        <HighlightCards />

        {/* Featured Projects Section */}
        <div className="w-full bg-white dark:bg-projects-bg">
          <Section spacing="lg">
            <Container maxWidth="7xl">
              <div className="text-center">
                <h2 className="mb-4 text-3xl font-bold text-primary-purple dark:text-white sm:text-4xl">
                  Our Flagship Projects
                </h2>
                <p className="mx-auto mb-12 max-w-3xl text-lg text-gray-600 dark:text-gray-200 sm:text-xl">
                  We're actively developing open-source tools to make the
                  developer experience more accessible and productive for
                  everyone.
                </p>
                <div className="mx-auto max-w-4xl">
                  <div className="grid grid-cols-1 gap-8 md:grid-cols-2">
                    {featuredProjects.map((project) => (
                    <a
                      key={project.title}
                      href={project.href}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="block rounded-lg motion-safe:transition-transform motion-reduce:transform-none duration-300 hover:-translate-y-2 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
                      aria-label={`${project.title} - view on GitHub`}
                    >
                      <Card variant="elevated" className="flex h-full flex-col text-left">
                        <div className="flex-grow">
                          <div className="mb-4 flex items-start justify-between">
                            <h3 className="text-xl font-bold text-primary-purple dark:text-white">
                              {project.title}
                            </h3>
                            <GitHubIcon className="h-6 w-6 text-gray-400" />
                          </div>
                          <p className="text-gray-600 dark:text-gray-200">
                            {project.description}
                          </p>
                        </div>
                        <div className="mt-6 flex flex-wrap gap-2">
                          {project.tags.map((tag) => (
                            <span
                              key={tag}
                              className="inline-block rounded-full bg-gray-100 px-3 py-1 text-sm font-medium text-gray-700 dark:bg-gray-800 dark:text-gray-200"
                            >
                              {tag}
                            </span>
                          ))}
                        </div>
                      </Card>
                    </a>
                    ))}
                  </div>
                </div>
              </div>
            </Container>
          </Section>
        </div>
      </main>
    </div>
  );
}

const resources = [
  {
    href: "https://remix.run/start/quickstart",
    text: "Quick Start (5 min)",
    icon: (
      <svg
        xmlns="http://www.w3.org/2000/svg"
        width="24"
        height="20"
        viewBox="0 0 20 20"
        fill="none"
        className="stroke-gray-600 group-hover:stroke-current dark:stroke-gray-300"
      >
        <path
          d="M8.51851 12.0741L7.92592 18L15.6296 9.7037L11.4815 7.33333L12.0741 2L4.37036 10.2963L8.51851 12.0741Z"
          strokeWidth="1.5"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
    ),
  },
  {
    href: "https://remix.run/start/tutorial",
    text: "Tutorial (30 min)",
    icon: (
      <svg
        xmlns="http://www.w3.org/2000/svg"
        width="24"
        height="20"
        viewBox="0 0 20 20"
        fill="none"
        className="stroke-gray-600 group-hover:stroke-current dark:stroke-gray-300"
      >
        <path
          d="M4.561 12.749L3.15503 14.1549M3.00811 8.99944H1.01978M3.15503 3.84489L4.561 5.2508M8.3107 1.70923L8.3107 3.69749M13.4655 3.84489L12.0595 5.2508M18.1868 17.0974L16.635 18.6491C16.4636 18.8205 16.1858 18.8205 16.0144 18.6491L13.568 16.2028C13.383 16.0178 13.0784 16.0347 12.915 16.239L11.2697 18.2956C11.047 18.5739 10.6029 18.4847 10.505 18.142L7.85215 8.85711C7.75756 8.52603 8.06365 8.21994 8.39472 8.31453L17.6796 10.9673C18.0223 11.0653 18.1115 11.5094 17.8332 11.7321L15.7766 13.3773C15.5723 13.5408 15.5554 13.8454 15.7404 14.0304L18.1868 16.4767C18.3582 16.6481 18.3582 16.926 18.1868 17.0974Z"
          strokeWidth="1.5"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
    ),
  },
  {
    href: "https://remix.run/docs",
    text: "Remix Docs",
    icon: (
      <svg
        xmlns="http://www.w3.org/2000/svg"
        width="24"
        height="20"
        viewBox="0 0 20 20"
        fill="none"
        className="stroke-gray-600 group-hover:stroke-current dark:stroke-gray-300"
      >
        <path
          d="M9.99981 10.0751V9.99992M17.4688 17.4688C15.889 19.0485 11.2645 16.9853 7.13958 12.8604C3.01467 8.73546 0.951405 4.11091 2.53116 2.53116C4.11091 0.951405 8.73546 3.01467 12.8604 7.13958C16.9853 11.2645 19.0485 15.889 17.4688 17.4688ZM2.53132 17.4688C0.951566 15.8891 3.01483 11.2645 7.13974 7.13963C11.2647 3.01471 15.8892 0.951453 17.469 2.53121C19.0487 4.11096 16.9854 8.73551 12.8605 12.8604C8.73562 16.9853 4.11107 19.0486 2.53132 17.4688Z"
          strokeWidth="1.5"
          strokeLinecap="round"
        />
      </svg>
    ),
  },
  {
    href: "https://rmx.as/discord",
    text: "Join Discord",
    icon: (
      <svg
        xmlns="http://www.w3.org/2000/svg"
        width="24"
        height="20"
        viewBox="0 0 24 20"
        fill="none"
        className="stroke-gray-600 group-hover:stroke-current dark:stroke-gray-300"
      >
        <path
          d="M15.0686 1.25995L14.5477 1.17423L14.2913 1.63578C14.1754 1.84439 14.0545 2.08275 13.9422 2.31963C12.6461 2.16488 11.3406 2.16505 10.0445 2.32014C9.92822 2.08178 9.80478 1.84975 9.67412 1.62413L9.41449 1.17584L8.90333 1.25995C7.33547 1.51794 5.80717 1.99419 4.37748 2.66939L4.19 2.75793L4.07461 2.93019C1.23864 7.16437 0.46302 11.3053 0.838165 15.3924L0.868838 15.7266L1.13844 15.9264C2.81818 17.1714 4.68053 18.1233 6.68582 18.719L7.18892 18.8684L7.50166 18.4469C7.96179 17.8268 8.36504 17.1824 8.709 16.4944L8.71099 16.4904C10.8645 17.0471 13.128 17.0485 15.2821 16.4947C15.6261 17.1826 16.0293 17.8269 16.4892 18.4469L16.805 18.8725L17.3116 18.717C19.3056 18.105 21.1876 17.1751 22.8559 15.9238L23.1224 15.724L23.1528 15.3923C23.5873 10.6524 22.3579 6.53306 19.8947 2.90714L19.7759 2.73227L19.5833 2.64518C18.1437 1.99439 16.6386 1.51826 15.0686 1.25995ZM16.6074 10.7755L16.6074 10.7756C16.5934 11.6409 16.0212 12.1444 15.4783 12.1444C14.9297 12.1444 14.3493 11.6173 14.3493 10.7877C14.3493 9.94885 14.9378 9.41192 15.4783 9.41192C16.0471 9.41192 16.6209 9.93851 16.6074 10.7755ZM8.49373 12.1444C7.94513 12.1444 7.36471 11.6173 7.36471 10.7877C7.36471 9.94885 7.95323 9.41192 8.49373 9.41192C9.06038 9.41192 9.63892 9.93712 9.6417 10.7815C9.62517 11.6239 9.05462 12.1444 8.49373 12.1444Z"
          strokeWidth="1.5"
        />
      </svg>
    ),
  },
];
