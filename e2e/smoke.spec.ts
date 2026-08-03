import { test, expect } from "@playwright/test";

test("chronicle: chapters, term popover, QA chips", async ({ page }) => {
  await page.goto("/");
  await expect(page.getByRole("heading", { name: "연대기" })).toBeVisible();
  await expect(page.getByText("크로노스와 열두 세계")).toBeVisible();
  await expect(page.getByText("벨리아의 개입과 1년 회귀")).toBeVisible();

  // auto-linked term opens a definition popover with a KB deep link
  await page.getByRole("button", { name: "크로노스", exact: true }).click();
  const popover = page.getByRole("dialog", { name: "크로노스 정의" });
  await expect(popover).toBeVisible();
  await expect(popover.getByText("Chronos", { exact: true })).toBeVisible();
  const kbLink = popover.getByRole("link", { name: /지식베이스에서 보기/ });
  await expect(kbLink).toHaveAttribute("href", "/knowledge?entity=ENT-CHRONOS");

  // QA chips woven into the story
  await expect(
    page.getByRole("link", { name: /이 대목의 미해소 복선 \d+건/ }).first()
  ).toBeVisible();
  await expect(
    page.getByText(
      "본 프로젝트는 크로노스튜디오·카카오게임즈와 무관한 비공식 팬 포트폴리오이며"
    )
  ).toBeVisible();
});

test("knowledge deep link opens the entity", async ({ page }) => {
  await page.goto("/knowledge?entity=ENT-VELIA");
  await expect(page.getByRole("heading", { name: /벨리아/ })).toBeVisible();
});

test("QA dashboard leads with gate and reports", async ({ page }) => {
  await page.goto("/dashboard");
  await expect(
    page.getByRole("heading", { name: "QA 대시보드" })
  ).toBeVisible();
  await expect(
    page.locator('a[href="/gate"]').filter({ hasText: "NARRATIVE CI" })
  ).toBeVisible();
  await expect(
    page.locator('a[href="/reports"]').filter({ hasText: "5종 정합성 검사" })
  ).toBeVisible();
  await expect(page.getByText("최근 변경 감지")).toBeVisible();
});

test("knowledge explorer: graph, intro path, list fallback", async ({ page }) => {
  await page.goto("/knowledge");
  await expect(
    page.getByRole("img", { name: "세계관 관계망 그래프" })
  ).toBeVisible();

  // intro path opens and navigates
  await page.getByRole("button", { name: /세계관 입문 경로/ }).click();
  await expect(page.getByText("주요 인물 — 시간을 짊어진 자들")).toBeVisible();
  await page.getByRole("button", { name: "다음 →" }).click();
  await expect(page.getByText(/세력 지형/).first()).toBeVisible();

  // selecting an entity from the intro path shows its detail
  await page.getByRole("button", { name: /^프론티어/ }).click();
  await expect(page.getByRole("heading", { name: /프론티어/ })).toBeVisible();

  // list view still works
  await page.getByRole("tab", { name: "리스트" }).click();
  await expect(page.getByPlaceholder("이름·영문·별칭 검색")).toBeVisible();
});

test("reports page renders findings with evidence", async ({ page }) => {
  await page.goto("/reports");
  await expect(
    page.getByRole("heading", { name: "정합성 검사 리포트" })
  ).toBeVisible();
  const naming = page.getByRole("button", { name: /Etheldreda/ }).first();
  await naming.click();
  await expect(page.getByText("판정 근거").first()).toBeVisible();
  await expect(page.getByText("FACT-0100").first()).toBeVisible();
});

test("glossary exports CSV with all rows", async ({ page }) => {
  await page.goto("/glossary");
  await expect(page.getByText("⚠ 표기 충돌").first()).toBeVisible();
  const downloadPromise = page.waitForEvent("download");
  await page.getByRole("button", { name: "CSV 내보내기" }).click();
  const download = await downloadPromise;
  expect(download.suggestedFilename()).toBe("loreguard-glossary.csv");
});

test("gate demo scenarios verdict instantly", async ({ page }) => {
  await page.goto("/gate");
  await page.getByRole("button", { name: "FAIL 시나리오" }).click();
  await expect(page.locator(".seal")).toHaveText("FAIL");
  await expect(page.getByText("FACT-0024").first()).toBeVisible();

  await page.getByRole("button", { name: "PASS 시나리오" }).click();
  await expect(page.locator(".seal")).toHaveText("PASS");

  await page.getByRole("button", { name: "WARN 시나리오" }).click();
  await expect(page.locator(".seal")).toHaveText("WARN");
});

test("ledger kanban shows resurfaced item", async ({ page }) => {
  await page.goto("/ledger");
  await expect(page.getByRole("region", { name: "재부상" })).toBeVisible();
  await page.getByRole("button", { name: /매트릭스/ }).click();
  await expect(
    page.getByRole("heading", { name: "이력 타임라인" })
  ).toBeVisible();
  await expect(page.getByText(/재부상 — 5차 개발자 노트/).first()).toBeVisible();
});
