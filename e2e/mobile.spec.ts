import { test, expect } from "@playwright/test";

// Mobile floor (DIRECTIVE §5): the graph view must fall back to the list on
// small screens, and the unofficial-fan-work notice must stay visible.

test("knowledge: graph falls back to the list on mobile", async ({ page }) => {
  await page.goto("/knowledge");
  await expect(
    page.getByRole("img", { name: "세계관 관계망 그래프" })
  ).toBeHidden();
  await expect(page.getByPlaceholder("이름·영문·별칭 검색")).toBeVisible();
});

test("topbar: the conflict count survives where the sidebar gauges do not", async ({
  page,
}) => {
  await page.goto("/dashboard");
  const watch = page.getByTestId("topbar-watch");
  await expect(watch).toBeVisible();
  await expect(watch).toContainText(/충돌 \d+|정상/);
  await expect(watch).toHaveAttribute("href", "/reports");
});

test("chronicle: unofficial notice is present on mobile", async ({ page }) => {
  await page.goto("/");
  const notice = page.getByText(
    "본 프로젝트는 크로노스튜디오·카카오게임즈와 무관한 비공식 팬 포트폴리오이며"
  );
  await notice.scrollIntoViewIfNeeded();
  await expect(notice).toBeVisible();
});
