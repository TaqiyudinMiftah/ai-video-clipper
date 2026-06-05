import assert from "node:assert/strict";
import test from "node:test";
import { manualLoginRequestSchema } from "../src/lib/api/validation";

test("manual login validation accepts NextAuth credentials payload extras", () => {
  const parsed = manualLoginRequestSchema.safeParse({
    email: "USER@Example.COM ",
    password: "password",
    csrfToken: "csrf-token",
    callbackUrl: "http://localhost:3000/dashboard",
    json: "true",
  });

  assert.equal(parsed.success, true);

  if (parsed.success) {
    assert.equal(parsed.data.email, "user@example.com");
    assert.equal(parsed.data.password, "password");
  }
});
