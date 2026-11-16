import { test } from "node:test";
import assert from "node:assert/strict";

const endpoints = [
  ["platform-me", "GET"],
  ["platform-products", "GET"],
  ["platform-integrations", "GET"],
  ["platform-exchange", "POST"]
];
test("Cloudflare endpoints deny unauthenticated requests", async () => {
  for (const [name, method] of endpoints) {
    const { onRequest } = await import("../functions/api/" + name + ".js");
    const response = await onRequest({
      request: new Request("https://example.pages.dev/api/" + name, { method }),
      env: {}
    });
    assert.equal(response.status, 401, name);
    assert.deepEqual(await response.json(), { error: "Authentication required" });
  }
});
