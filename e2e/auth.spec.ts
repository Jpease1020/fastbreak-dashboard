import { expect, test } from "@playwright/test";

import { setupMockState } from "./helpers";

test("redirects unauthenticated users to login, logs in, and logs out", async ({
  page,
}) => {
  await setupMockState(page, {
    users: [{ email: "coach@example.com", password: "password123" }],
    sessionEmail: null,
  });

  await page.goto("/dashboard");
  await expect(page).toHaveURL(/\/login$/);

  await page.getByLabel("Email").fill("coach@example.com");
  await page.getByLabel("Password").fill("password123");
  await page.getByRole("button", { name: /sign in/i }).click();

  await expect(page).toHaveURL(/\/dashboard$/);
  await expect(page.getByText("coach@example.com")).toBeVisible();
  await expect(page.getByText("No events yet")).toBeVisible();

  await page.getByRole("button", { name: /sign out/i }).click();

  await expect(page).toHaveURL(/\/login$/);
  await expect(page.getByText("Welcome back")).toBeVisible();
});

test("signs up a new user and lands on the protected dashboard", async ({
  page,
}) => {
  await setupMockState(page, {
    users: [],
    sessionEmail: null,
  });

  await page.goto("/signup");
  await page.getByLabel("Email").fill("new-user@example.com");
  await page.getByLabel(/^Password$/).fill("password123");
  await page.getByLabel("Confirm Password").fill("password123");
  await page.getByRole("button", { name: /create account/i }).click();

  await expect(page).toHaveURL(/\/dashboard$/);
  await expect(page.getByText("new-user@example.com")).toBeVisible();
});
