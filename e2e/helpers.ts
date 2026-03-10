import { expect, type Locator, type Page } from "@playwright/test";

const E2E_SECRET = "fastbreak-e2e-secret";

type SetupPayload = {
  users?: Array<{ email: string; password?: string; id?: string }>;
  events?: Array<{
    id?: string;
    user_email: string;
    name: string;
    sport_type: string;
    date_time: string;
    description?: string | null;
    venues?: Array<{ name: string; address?: string | null }>;
  }>;
  sessionEmail?: string | null;
};

export async function setupMockState(page: Page, payload: SetupPayload) {
  const response = await page.request.post("/api/e2e/setup", {
    data: payload,
    headers: {
      "x-e2e-secret": E2E_SECRET,
    },
  });

  expect(response.ok()).toBeTruthy();
}

export async function chooseSelectOption(
  trigger: Locator,
  optionName: string
) {
  await trigger.click();
  await trigger.page().getByRole("option", { name: optionName }).click();
}
