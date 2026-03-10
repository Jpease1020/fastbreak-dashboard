import { expect, test } from "@playwright/test";

import { chooseSelectOption, setupMockState } from "./helpers";

test("searches by name, filters by sport, and preserves state in the URL", async ({
  page,
}) => {
  await setupMockState(page, {
    users: [{ email: "coach@fastbreak.dev", password: "password123" }],
    sessionEmail: "coach@fastbreak.dev",
    events: [
      {
        user_email: "coach@fastbreak.dev",
        name: "City Cup Final",
        sport_type: "Soccer",
        date_time: "2026-06-10T19:00",
        venues: [{ name: "Main Stadium" }],
      },
      {
        user_email: "coach@fastbreak.dev",
        name: "Practice Run",
        sport_type: "Basketball",
        date_time: "2026-06-12T09:00",
        venues: [{ name: "Training Gym" }],
      },
      {
        user_email: "coach@fastbreak.dev",
        name: "City Cup Warmup",
        sport_type: "Soccer",
        date_time: "2026-06-08T10:00",
        venues: [{ name: "Aux Field" }],
      },
    ],
  });

  await page.goto("/dashboard");

  await page.getByPlaceholder("Search events...").fill("City Cup");
  await expect(page).toHaveURL(/search=City\+Cup/);
  await expect(page.getByText("City Cup Final")).toBeVisible();
  await expect(page.getByText("City Cup Warmup")).toBeVisible();
  await expect(page.getByText("Practice Run")).toHaveCount(0);

  await chooseSelectOption(page.getByRole("combobox").first(), "Soccer");
  await expect(page).toHaveURL(/sport=Soccer/);
  await expect(page.getByText("City Cup Final")).toBeVisible();
  await expect(page.getByText("City Cup Warmup")).toBeVisible();

  await page.reload();

  await expect(page.getByPlaceholder("Search events...")).toHaveValue("City Cup");
  await expect(page.getByRole("combobox").first()).toContainText("Soccer");
  await expect(page.getByText("City Cup Final")).toBeVisible();
  await expect(page.getByText("Practice Run")).toHaveCount(0);
});
