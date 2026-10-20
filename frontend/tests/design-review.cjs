// Read-only visual review of existing demo data. Never prints credentials.
const { chromium } = require("@playwright/test");
const fs = require("node:fs");
const path = require("node:path");
const assert = require("node:assert/strict");
const values = Object.fromEntries(
  fs
    .readFileSync(path.resolve(__dirname, "../../backend/.env"), "utf8")
    .split(/\r?\n/)
    .filter((line) => line.includes("="))
    .map((line) => {
      const i = line.indexOf("=");
      return [line.slice(0, i), line.slice(i + 1)];
    }),
);
const base = process.env.TEST_BASE_URL || "http://127.0.0.1:3000";
const issues = [];

async function readable(page) {
  const result = await page.evaluate(() => {
    const tiny = [];
    for (const element of document.querySelectorAll(
      "h1,h2,h3,p,label,small,button,a,.badge,.subtle,.eyebrow,th,td",
    )) {
      const style = getComputedStyle(element),
        box = element.getBoundingClientRect();
      if (
        box.width &&
        box.height &&
        style.visibility !== "hidden" &&
        parseFloat(style.fontSize) < 13
      )
        tiny.push(element.tagName + "." + element.className);
    }
    return {
      overflow: document.documentElement.scrollWidth > innerWidth,
      tiny,
    };
  });
  assert.equal(
    result.overflow,
    false,
    `Horizontal overflow at ${page.viewportSize().width}px`,
  );
  assert.deepEqual(result.tiny, [], "Text smaller than the design minimum");
}

// Actual light/dark token contrast is checked by theme-review.cjs.

async function run() {
  const browser = await chromium.launch({
    headless: true,
    executablePath: "C:/Program Files/Google/Chrome/Application/chrome.exe",
  });
  try {
    for (const role of ["customer", "rider", "staff"]) {
      const context = await browser.newContext({
          viewport: { width: role === "staff" ? 1440 : 390, height: 1000 },
        }),
        page = await context.newPage();
      page.on("pageerror", (e) => issues.push(e.message));
      await page.goto(base);
      await page
        .getByLabel("Email address")
        .fill(
          role === "staff"
            ? "staff@parcelcare.demo"
            : `${role}.a@parcelcare.demo`,
        );
      await page
        .getByLabel("Password", { exact: true })
        .fill(values.DEMO_PASSWORD);
      await page.getByRole("button", { name: "Open my workspace" }).click();
      await page.waitForURL(`**/${role}`);
      await page
        .getByRole("heading", {
          name: role === "staff" ? "Exception workspace" : "My cases",
          exact: true,
        })
        .waitFor();
      await page.waitForFunction(
        () =>
          document.querySelectorAll(".case-row,.staff-queue-table tbody tr")
            .length > 0,
      );
      for (const width of role === "staff"
        ? [768, 1024, 1440]
        : [320, 375, 390, 768]) {
        await page.setViewportSize({ width, height: 1000 });
        await readable(page);
        if (role === "staff" && width >= 1024) {
          assert.equal(
            await page.locator(".staff-queue-table").isVisible(),
            true,
          );
          assert.equal(
            await page
              .locator(".sidebar")
              .evaluate((el) => getComputedStyle(el).position),
            "fixed",
          );
        }
      }
      if (role === "staff") {
        await page.screenshot({
          path: "artifacts/design-staff-queue-1440.png",
          fullPage: true,
        });
        await page.locator(".queue-open").first().click();
        await page
          .getByRole("heading", { name: "Report details", exact: true })
          .waitFor();
        for (const width of [1024, 1440]) {
          await page.setViewportSize({ width, height: 1000 });
          await readable(page);
          const columns = await page
            .locator(".detail-grid")
            .evaluate(
              (el) =>
                getComputedStyle(el).gridTemplateColumns.split(" ").length,
            );
          assert.equal(
            columns,
            2,
            `Staff detail must have two columns at ${width}px`,
          );
        }
        await page.screenshot({
          path: "artifacts/design-staff-case-1440.png",
          fullPage: true,
        });
        await page.setViewportSize({ width: 1024, height: 1000 });
        await page.evaluate(
          () => (document.documentElement.style.fontSize = "200%"),
        );
        await readable(page);
        assert.equal(
          await page
            .getByRole("button", { name: "Save triage & update" })
            .isVisible(),
          true,
        );
      } else {
        await page.setViewportSize({ width: 390, height: 1000 });
        await page.screenshot({
          path: `artifacts/design-${role}-cases-390.png`,
          fullPage: true,
        });
        await page
          .getByRole("button", { name: "Report an exception", exact: true })
          .first()
          .click();
        await page
          .getByRole("heading", { name: "Report an exception", exact: true })
          .waitFor();
        for (const width of [320, 390, 768]) {
          await page.setViewportSize({ width, height: 1000 });
          await readable(page);
        }
        assert.equal(
          await page
            .getByLabel("What happened?")
            .evaluate((el) => getComputedStyle(el).fontSize),
          "16px",
        );
        await page.setViewportSize({ width: 390, height: 1000 });
        await page.screenshot({
          path: `artifacts/design-${role}-report-390.png`,
          fullPage: true,
        });
        await page.evaluate(
          () => (document.documentElement.style.fontSize = "200%"),
        );
        await readable(page);
      }
      await context.close();
    }
    assert.deepEqual(issues, []);
    console.log(
      "PASS: role-specific layouts, desktop table/two-column cases, 13px minimum text, 16px inputs, viewport reflow and 200% text resizing.",
    );
  } finally {
    await browser.close();
  }
}
run().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
