import { MetaFunction } from '@remix-run/node';

export const meta: MetaFunction = () => {
  return [
    { title: 'Accessibility Statement | Focus Lab' },
    {
      name: 'description',
      content: 'Our commitment to accessibility.',
    },
  ];
};

export default function AccessibilityStatement() {
  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="mb-4 text-4xl font-bold">Accessibility Statement</h1>
      <div className="prose dark:prose-invert max-w-none">
        <p>
          Focus Lab is committed to ensuring digital accessibility for people
          with disabilities. We are continually improving the user experience
          for everyone and applying the relevant accessibility standards.
        </p>
        <h2 className="text-2xl font-bold mt-8 mb-4">Measures to support accessibility</h2>
        <p>
          Focus Lab takes the following measures to ensure accessibility of
          our website:
        </p>
        <ul>
          <li>Include accessibility as part of our mission statement.</li>
          <li>Integrate accessibility into our procurement practices.</li>
          <li>Appoint an accessibility officer and/or ombudsperson.</li>
          <li>Provide continual accessibility training for our staff.</li>
          <li>Assign clear accessibility targets and responsibilities.</li>
        </ul>
        <h2 className="text-2xl font-bold mt-8 mb-4">Conformance status</h2>
        <p>
          The{' '}
          <a href="https://www.w3.org/WAI/standards-guidelines/wcag/">
            Web Content Accessibility Guidelines (WCAG)
          </a>{' '}
          defines requirements for designers and developers to improve
          accessibility for people with disabilities. It defines three levels
          of conformance: Level A, Level AA, and Level AAA. Focus Lab is
          partially conformant with WCAG 2.1 level AA. Partially conformant
          means that some parts of the content do not fully conform to the
          accessibility standard.
        </p>
        <h2 className="text-2xl font-bold mt-8 mb-4">Feedback</h2>
        <p>
          We welcome your feedback on the accessibility of our website. Please
          let us know if you encounter accessibility barriers on Focus Lab:
        </p>
        <ul>
          <li>
            E-mail:{' '}
            <a href="mailto:hey@focuslab.io">hey@focuslab.io</a>
          </li>
        </ul>
        <h2 className="text-2xl font-bold mt-8 mb-4">Technical specifications</h2>
        <p>
          Accessibility of Focus Lab relies on the following technologies to
          work with the particular combination of web browser and any assistive
          technologies or plugins installed on your computer:
        </p>
        <ul>
          <li>HTML</li>
          <li>WAI-ARIA</li>
          <li>CSS</li>
          <li>JavaScript</li>
        </ul>
        <p>
          These technologies are relied upon for conformance with the
          accessibility standards used.
        </p>
      </div>
    </div>
  );
} 