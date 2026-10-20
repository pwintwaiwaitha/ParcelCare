// Read-only live-data review. Theme preferences are the only browser-persisted values.
const { chromium } = require("@playwright/test");
const fs = require("node:fs");
const path = require("node:path");
const assert = require("node:assert/strict");
const values = Object.fromEntries(
  fs
    .readFileSync(path.resolve(__dirname, "../../backend/.env"), "utf8")
    .split(/\r?\n/)
    .filter((l) => l.includes("="))
    .map((l) => {
      const i = l.indexOf("=");
      return [l.slice(0, i), l.slice(i + 1)];
    }),
);
const base = process.env.TEST_BASE_URL || "http://127.0.0.1:3000";
const errors = [];
const themes = ["light", "dark"];
function luminance(hex) {
  let value = hex.trim().replace("#", "");
  if (value.length === 3)
    value = value
      .split("")
      .map((c) => c + c)
      .join("");
  const c = value
    .match(/../g)
    .map((v) => parseInt(v, 16) / 255)
    .map((v) => (v <= 0.04045 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4));
  return 0.2126 * c[0] + 0.7152 * c[1] + 0.0722 * c[2];
}
function ratio(a, b) {
  const x = luminance(a),
    y = luminance(b);
  return (Math.max(x, y) + 0.05) / (Math.min(x, y) + 0.05);
}
async function palette(page) {
  const v = await page.evaluate(() => {
    const s = getComputedStyle(document.documentElement);
    return Object.fromEntries(
      Array.from(s)
        .filter((n) => n.startsWith("--"))
        .map((n) => [n, s.getPropertyValue(n).trim()]),
    );
  });
  assert.equal(v["--brand"].toLowerCase(), "#08a6a5");
  assert.equal(v["--highlight"].toLowerCase(), "#fcc829");
  for (const [fg, bg] of [
    ["ink", "surface"],
    ["ink", "bg"],
    ["muted", "surface"],
    ["muted", "bg"],
    ["muted", "surface-muted"],
    ["brand-ink", "brand-wash"],
    ["brand-ink", "nav-active-bg"],
    ["on-brand", "brand"],
    ["on-brand-hover", "brand-hover"],
    ["warning-ink", "warning-bg"],
    ["info-ink", "info-bg"],
    ["waiting-ink", "waiting-bg"],
    ["danger-ink", "danger-bg"],
    ["success-ink", "success-bg"],
  ]) {
    const r = ratio(v[`--${fg}`], v[`--${bg}`]);
    assert.ok(
      r >= 4.5,
      `${fg}/${bg} contrast ${r.toFixed(2)} in ${await page.locator("html").getAttribute("data-theme")}`,
    );
  }
  for (const [fg, bg] of [
    ["focus", "surface"],
    ["control-border", "surface"],
    ["brand-border", "surface"],
  ])
    assert.ok(
      ratio(v[`--${fg}`], v[`--${bg}`]) >= 3,
      `${fg}/${bg} boundary contrast`,
    );
}
async function readable(page) {
  const result = await page.evaluate(() => ({
    overflow: document.documentElement.scrollWidth > innerWidth,
    tiny: Array.from(
      document.querySelectorAll(
        "h1,h2,h3,p,label,small,button,a,th,td,.badge,.eyebrow",
      ),
    )
      .filter((el) => {
        const r = el.getBoundingClientRect();
        return (
          r.width && r.height && parseFloat(getComputedStyle(el).fontSize) < 13
        );
      })
      .map((el) => el.tagName + "." + el.className),
  }));
  assert.equal(
    result.overflow,
    false,
    `Page overflow at ${page.viewportSize().width}px`,
  );
  assert.deepEqual(result.tiny, []);
}
async function setTheme(page, theme) {
  if ((await page.locator("html").getAttribute("data-theme")) !== theme)
    await page
      .getByRole("button", { name: `Switch to ${theme} theme` })
      .click();
  assert.equal(await page.locator("html").getAttribute("data-theme"), theme);
  await palette(page);
}
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
      page.setDefaultTimeout(45000);
      page.on("pageerror", (e) => errors.push(e.message));
      await page.goto(base);
      assert.equal(
        await page.locator("html").getAttribute("data-theme"),
        "light",
      );
      if (role === "customer") {
        for (const theme of themes) {
          await setTheme(page, theme);
          await readable(page);
          await page.screenshot({
            path: `artifacts/theme-${theme}-login.png`,
            fullPage: true,
          });
        }
        await page.reload();
        assert.equal(
          await page.locator("html").getAttribute("data-theme"),
          "dark",
        );
        const toggle = page.getByRole("button", {
          name: "Switch to light theme",
        });
        await toggle.focus();
        await page.keyboard.press("Enter");
        assert.equal(
          await page.locator("html").getAttribute("data-theme"),
          "light",
        );
        const outline = await page
          .getByRole("button", { name: "Switch to dark theme" })
          .evaluate((el) => getComputedStyle(el).outlineStyle);
        assert.notEqual(outline, "none");
      }
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
      for (const theme of themes) {
        await page.goto(`${base}/${role}`);
        await page
          .getByRole("heading", {
            name: role === "staff" ? "Exception workspace" : "My cases",
            exact: true,
          })
          .waitFor();
        await setTheme(page, theme);
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
          if (role === "staff" && width >= 1024)
            assert.equal(
              await page.locator(".staff-queue-table").isVisible(),
              true,
            );
        }
        await page.setViewportSize({
          width: role === "staff" ? 1440 : 390,
          height: 1000,
        });
        await page.screenshot({
          path: `artifacts/theme-${theme}-${role}-cases.png`,
          fullPage: true,
        });
        if (role === "staff") {
          await page.locator(".queue-open").first().click();
          await page
            .getByRole("heading", { name: "Report details", exact: true })
            .waitFor();
          for (const width of [1024, 1440]) {
            await page.setViewportSize({ width, height: 1000 });
            await readable(page);
            assert.equal(
              await page
                .locator(".detail-grid")
                .evaluate(
                  (el) =>
                    getComputedStyle(el).gridTemplateColumns.split(" ").length,
                ),
              2,
            );
          }
          await page.screenshot({
            path: `artifacts/theme-${theme}-staff-detail.png`,
            fullPage: true,
          });
        } else {
          const cases = await (
            await page.request.get(`${base}/api/cases?limit=1`)
          ).json();
          await page.goto(`${base}/${role}/cases/${cases[0].id}`);
          await page
            .getByRole("heading", { name: "Report details", exact: true })
            .waitFor();
          await readable(page);
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
            path: `artifacts/theme-${theme}-${role}-report.png`,
            fullPage: true,
          });
          const submit = page.getByRole("button", {
            name: "Submit report",
            exact: true,
          });
          await submit.scrollIntoViewIfNeeded();
          const clearance = await page.evaluate(() => {
            const submit = Array.from(document.querySelectorAll("button")).find(
              (el) => el.textContent.includes("Submit report"),
            );
            return (
              submit.getBoundingClientRect().bottom <=
              document.querySelector(".sidebar nav").getBoundingClientRect().top
            );
          });
          assert.equal(
            clearance,
            true,
            "Bottom navigation overlaps submit action",
          );
        }
        await page.evaluate(
          () => (document.documentElement.style.fontSize = "200%"),
        );
        await readable(page);
        await page.evaluate(
          () => (document.documentElement.style.fontSize = ""),
        );
        await page.reload();
        assert.equal(
          await page.locator("html").getAttribute("data-theme"),
          theme,
        );
      }
      // Exercise real empty/error presentation with read-only API responses, not fabricated cases.
      await page.route("**/api/cases?*", (route) =>
        route.fulfill({
          status: 200,
          contentType: "application/json",
          body: "[]",
        }),
      );
      for (const theme of themes) {
        await page.goto(`${base}/${role}`);
        await setTheme(page, theme);
        await page
          .getByRole("heading", { name: "A fresh start.", exact: true })
          .waitFor();
        await readable(page);
      }
      await page.unroute("**/api/cases?*");
      await page.route("**/api/cases?*", (route) =>
        route.fulfill({
          status: 503,
          contentType: "application/json",
          body: JSON.stringify({
            detail: "Test: service unavailable. Please retry.",
          }),
        }),
      );
      for (const theme of themes) {
        await page.goto(`${base}/${role}`);
        await setTheme(page, theme);
        await page
          .getByRole("alert")
          .filter({ hasText: "Test: service unavailable" })
          .waitFor();
        await readable(page);
      }
      await context.close();
    }
    const context = await browser.newContext();
    await context.addInitScript(() => {
      Object.defineProperty(window, "localStorage", {
        get() {
          throw new Error("Storage blocked for theme fallback test");
        },
      });
    });
    const page = await context.newPage();
    page.on("pageerror", (e) => errors.push(e.message));
    await page.goto(base);
    await page.getByRole("button", { name: "Switch to dark theme" }).click();
    assert.equal(await page.locator("html").getAttribute("data-theme"), "dark");
    await page.reload();
    assert.equal(
      await page.locator("html").getAttribute("data-theme"),
      "light",
    );
    await context.close();
    assert.deepEqual(errors, []);
    console.log(
      "PASS: both themes across all roles, exact brand colors, real token contrast, persistence, keyboard toggle, blocked storage, navigation clearance, states, responsive layouts and 200% text resizing.",
    );
  } finally {
    await browser.close();
  }
}
run().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
