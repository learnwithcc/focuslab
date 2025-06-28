import { expect, test } from "vitest";
import { loader } from "../../routes/security.txt";
import { loader as wellKnownLoader } from "../../routes/.well-known/security.txt";

test("security.txt route returns proper content and headers", async () => {
  const response = await loader();
  
  expect(response.status).toBe(200);
  expect(response.headers.get("Content-Type")).toBe("text/plain; charset=utf-8");
  
  const text = await response.text();
  expect(text).toContain("Contact: https://focuslab.io/contact");
  expect(text).toContain("Expires:");
  expect(text).toContain("Canonical: https://focuslab.io/.well-known/security.txt");
  expect(text).toContain("Policy: https://focuslab.io/terms-of-service");
  expect(text).toContain("Preferred-Languages: en");
});

test("/.well-known/security.txt route returns proper content and headers", async () => {
  const response = await wellKnownLoader();
  
  expect(response.status).toBe(200);
  expect(response.headers.get("Content-Type")).toBe("text/plain; charset=utf-8");
  
  const text = await response.text();
  expect(text).toContain("Contact: https://focuslab.io/contact");
  expect(text).toContain("Expires:");
  expect(text).toContain("Canonical: https://focuslab.io/.well-known/security.txt");
});

test("security.txt expires date is approximately 1 year from now", async () => {
  const response = await loader();
  
  const text = await response.text();
  const expiresMatch = text.match(/Expires: (.+)/);
  expect(expiresMatch).toBeTruthy();
  
  if (expiresMatch) {
    const expiresDate = new Date(expiresMatch[1]);
    const now = new Date();
    const oneYear = 365 * 24 * 60 * 60 * 1000;
    const diff = expiresDate.getTime() - now.getTime();
    
    // Should expire within 1 year (with some tolerance)
    expect(diff).toBeGreaterThan(oneYear - 86400000); // 1 day tolerance
    expect(diff).toBeLessThan(oneYear + 86400000);
  }
}); 