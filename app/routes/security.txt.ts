

export async function loader() {
  const securityTxt = `Contact: https://focuslab.io/contact
Expires: ${new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString()}
Canonical: https://focuslab.io/.well-known/security.txt
Policy: https://focuslab.io/terms-of-service
Preferred-Languages: en`;

  return new Response(securityTxt, {
    status: 200,
    headers: {
      "Content-Type": "text/plain; charset=utf-8",
      "Cache-Control": "public, max-age=86400", // Cache for 1 day
    },
  });
} 