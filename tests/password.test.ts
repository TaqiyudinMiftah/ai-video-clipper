import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { hashPassword, verifyPassword } from "../src/lib/password";

describe("password helper", () => {
  it("creates a non-plaintext scrypt hash", async () => {
    const hash = await hashPassword("correct horse battery staple");

    assert.match(hash, /^scrypt:[a-f0-9]+:[a-f0-9]+$/);
    assert.notEqual(hash, "correct horse battery staple");
  });

  it("verifies the correct password", async () => {
    const hash = await hashPassword("correct horse battery staple");

    assert.equal(await verifyPassword("correct horse battery staple", hash), true);
  });

  it("rejects the wrong password", async () => {
    const hash = await hashPassword("correct horse battery staple");

    assert.equal(await verifyPassword("wrong password", hash), false);
  });

  it("rejects malformed hashes", async () => {
    assert.equal(await verifyPassword("password", "not-a-valid-hash"), false);
    assert.equal(await verifyPassword("password", "scrypt:salt:hash:extra"), false);
  });
});
