import { expect, test } from "@playwright/test";

import { chooseSelectOption, setupMockState } from "./helpers";

test("creates, edits, and deletes an event with multiple venues", async ({
  page,
}) => {
  await setupMockState(page, {
    users: [{ email: "coach@example.com", password: "password123" }],
    sessionEmail: "coach@example.com",
  });

  await page.goto("/dashboard");
  await expect(page.getByText("No events yet")).toBeVisible();

  await page.getByRole("button", { name: /create your first event/i }).click();
  await expect(page).toHaveURL(/\/dashboard\/events\/new$/);

  await page.getByLabel("Event Name").fill("Championship Game");
  await chooseSelectOption(
    page.getByRole("combobox", { name: "Sport Type" }),
    "Basketball"
  );
  await page.getByLabel("Date & Time").fill("2026-03-15T14:00");
  await page.getByLabel("Description").fill("Winner takes all.");
  await page.getByPlaceholder("Venue name").fill("Main Arena");
  await page.getByPlaceholder("Venue address (optional)").fill("4 Pennsylvania Plaza");

  await page.getByRole("button", { name: /add venue/i }).click();
  await page.getByPlaceholder("Venue name").nth(1).fill("Training Gym");
  await page
    .getByPlaceholder("Venue address (optional)")
    .nth(1)
    .fill("12 Side Street");

  await page.getByRole("button", { name: /create event/i }).click();

  await expect(page).toHaveURL(/\/dashboard$/);
  await expect(page.getByText("Championship Game")).toBeVisible();
  await expect(page.getByText(/Training Gym/)).toBeVisible();

  await page.getByRole("button", { name: /^edit$/i }).click();
  await expect(page).toHaveURL(/\/edit$/);

  await page.getByLabel("Event Name").fill("Championship Game Updated");
  await chooseSelectOption(
    page.getByRole("combobox", { name: "Sport Type" }),
    "Soccer"
  );
  await page.getByRole("button", { name: /update event/i }).click();

  await expect(page).toHaveURL(/\/dashboard$/);
  await expect(page.getByText("Championship Game Updated")).toBeVisible();
  await expect(page.getByText("Soccer")).toBeVisible();

  await page.getByRole("button", { name: /^delete$/i }).click();
  await page
    .locator("[data-slot='dialog-content']")
    .getByRole("button", { name: /^delete$/i })
    .click();

  await expect(page.getByText("No events yet")).toBeVisible();
  await expect(page.getByText("Championship Game Updated")).toHaveCount(0);
});
