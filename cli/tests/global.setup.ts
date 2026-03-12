import { test as setup } from "@playwright/test";

setup.describe.configure({ mode: "serial" });

setup("global setup", async ({}) => {
  // No provider-specific setup — all providers tested with identical browser automation
});
