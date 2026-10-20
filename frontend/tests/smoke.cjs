/* Local three-role integration check against running frontend and backend. */
const { chromium } = require("@playwright/test");
const fs = require("node:fs");
const path = require("node:path");
const assert = require("node:assert/strict");
const settings = Object.fromEntries(
  fs
    .readFileSync(path.resolve(__dirname, "../../backend/.env"), "utf8")
    .split(/\r?\n/)
    .filter((line) => line.includes("="))
    .map((line) => {
      const at = line.indexOf("=");
      return [line.slice(0, at), line.slice(at + 1)];
    }),
);
const base = process.env.TEST_BASE_URL || "http://127.0.0.1:3000";
const liveSupabase = process.argv.includes("--supabase");
if (
  settings.APP_ENV !== "local" ||
  (settings.AUTH_MODE !== "local" &&
    !(liveSupabase && settings.AUTH_MODE === "supabase"))
)
  throw Error(
    "Use local synthetic data, or explicitly pass --supabase for the configured demo project.",
  );
const issues = [];
async function login(browser, role, width) {
  const context = await browser.newContext({
    viewport: { width, height: 950 },
  });
  const page = await context.newPage();
  page.on("pageerror", (error) => issues.push(error.message));
  await page.goto(base);
  const theme = process.env.TEST_THEME || "light";
  if (await page.locator("html").getAttribute("data-theme") !== theme) {
    await page.getByRole("button", { name: `Switch to ${theme} theme` }).click();
  }
  await page
    .getByLabel("Email address")
    .fill(
      role === "staff" ? "staff@parcelcare.demo" : `${role}.a@parcelcare.demo`,
    );
  await page
    .getByLabel("Password", { exact: true })
    .fill(settings.DEMO_PASSWORD);
  await page.getByRole("button", { name: "Open my workspace" }).click();
  await page.waitForURL(`**/${role}`);
  const identity = await (await page.request.get(`${base}/api/me`)).json();
  assert.equal(identity.local_demo, !liveSupabase);
  await page
    .getByRole("heading", {
      name: role === "staff" ? "Exception workspace" : "My cases",
    })
    .waitFor();
  return { context, page };
}
async function run() {
  const browser = await chromium.launch({
    headless: true,
    executablePath: "C:/Program Files/Google/Chrome/Application/chrome.exe",
  });
  try {
    const customer = await login(browser, "customer", 390);
    await customer.page
      .getByRole("button", { name: "Report an exception", exact: true })
      .last()
      .click();
    await customer.page
      .getByRole("heading", { name: "Report an exception", exact: true })
      .waitFor();
    await customer.page.getByLabel("Tracking ID").selectOption("PC-1001");
    await customer.page
      .getByLabel("What went wrong?")
      .selectOption("WRONG_ADDRESS");
    const unique = `Browser test ${Date.now()}: Please add apartment 4B to the address.`;
    await customer.page.getByLabel("What happened?").fill(unique);
    await customer.page
      .getByRole("button", { name: "Submit report", exact: true })
      .click();
    await customer.page.waitForURL("**/customer/cases/*");
    await customer.page.getByText(unique, { exact: true }).waitFor();
    const caseId = customer.page.url().split("/").pop();
    const staff = await login(browser, "staff", 1440);
    await staff.page.goto(`${base}/staff/cases/${caseId}`);
    await staff.page.getByLabel("Case status").selectOption("TRIAGED");
    await staff.page.getByLabel("Priority").selectOption("HIGH");
    await staff.page
      .getByLabel("Update for the reporter")
      .fill("We have reviewed your report and are checking the address.");
    await staff.page
      .getByLabel("Internal note")
      .fill("PRIVATE: check with dispatch before any changes.");
    await staff.page
      .getByRole("button", { name: "Save triage & update" })
      .click();
    await staff.page
      .getByText("Triage saved. The reporter can see your update.")
      .waitFor();
    await customer.page
      .getByText("We have reviewed your report and are checking the address.", {
        exact: true,
      })
      .waitFor({ timeout: 20000 });
    assert.equal(
      await customer.page
        .getByText("PRIVATE: check with dispatch before any changes.")
        .count(),
      0,
    );
    await customer.page.reload();
    await customer.page.getByText(unique, { exact: true }).waitFor();
    await customer.page
      .getByText("We have reviewed your report and are checking the address.", {
        exact: true,
      })
      .waitFor();
    const image = Buffer.from(
      "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO+aDaAAAAAASUVORK5CYII=",
      "base64",
    );
    const upload = await customer.page.request.post(
      `${base}/api/cases/${caseId}/evidence`,
      {
        headers: {
          "x-parcelcare-request": "1",
          "Idempotency-Key": `browser-${Date.now()}`,
        },
        multipart: {
          file: {
            name: "synthetic-evidence.png",
            mimeType: "image/png",
            buffer: image,
          },
        },
      },
    );
    assert.equal(upload.status(), 200);
    const evidence = await upload.json();
    assert.equal(
      (
        await customer.page.request.get(
          `${base}/api/cases/${caseId}/evidence/${evidence.id}`,
        )
      ).status(),
      200,
    );
    for (const width of [320, 375, 390, 768]) {
      await customer.page.setViewportSize({ width, height: 950 });
      assert.equal(
        await customer.page.evaluate(
          () => document.documentElement.scrollWidth > window.innerWidth,
        ),
        false,
        `Customer overflows at ${width}`,
      );
    }
    await customer.page.setViewportSize({ width: 390, height: 950 });
    await customer.page.screenshot({
      path: "artifacts/customer-case-mobile.png",
      fullPage: true,
    });
    for (const width of [768, 1024, 1440]) {
      await staff.page.setViewportSize({ width, height: 950 });
      assert.equal(
        await staff.page.evaluate(
          () => document.documentElement.scrollWidth > window.innerWidth,
        ),
        false,
        `Staff overflows at ${width}`,
      );
    }
    await staff.page.screenshot({
      path: "artifacts/staff-triage-desktop.png",
      fullPage: true,
    });
    const rider = await login(browser, "rider", 375);
    await rider.page
      .getByRole("button", { name: "Report an exception", exact: true })
      .last()
      .click();
    await rider.page.getByLabel("Tracking ID").selectOption("PC-1001");
    await rider.page
      .getByLabel("What went wrong?")
      .selectOption("CUSTOMER_UNAVAILABLE");
    await rider.page
      .getByLabel("What happened?")
      .fill(
        `Browser test ${Date.now()}: Customer was unavailable at the delivery location.`,
      );
    await rider.page
      .getByRole("button", { name: "Submit report", exact: true })
      .click();
    await rider.page.waitForURL("**/rider/cases/*");
    await rider.page
      .getByRole("heading", { name: "Customer unavailable", exact: true })
      .waitFor();
    assert.equal(
      (await rider.page.request.get(`${base}/api/cases/${caseId}`)).status(),
      404,
    );
    for (const width of [320, 375, 390, 768]) {
      await rider.page.setViewportSize({ width, height: 950 });
      assert.equal(
        await rider.page.evaluate(
          () => document.documentElement.scrollWidth > window.innerWidth,
        ),
        false,
        `Rider overflows at ${width}`,
      );
    }
    assert.deepEqual(issues, []);
    console.log(
      "PASS: customer/rider reporting, staff triage, polling, refresh persistence, private notes/evidence, case isolation, and all planned viewport widths.",
    );
  } finally {
    await browser.close();
  }
}
run().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
