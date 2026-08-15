import { act, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { PortfolioContext } from "@/portfolio/context";
import { LoggedStamp } from "./LoggedStamp";

function mockMatchMedia(matches: boolean) {
  window.matchMedia = vi.fn().mockImplementation((query: string) => ({
    matches,
    media: query,
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
  })) as unknown as typeof window.matchMedia;
}

// LoggedStamp reads the "Logged" label via useTranslation(), which needs
// account Settings from PortfolioContext — real usage sites are always
// inside RequirePortfolio's tree, so the test provides the same context.
function renderLoggedStamp() {
  return render(
    <PortfolioContext.Provider
      value={{
        spreadsheetId: "test-spreadsheet-id",
        settings: { language: "en", currency: "USD" },
        homeSpreadsheetId: "test-spreadsheet-id",
        activeLabel: null,
        activeConnectionId: null,
        connectedPortfolios: [],
        switchToHome: () => {},
        switchToPortfolio: () => {},
      }}
    >
      <LoggedStamp />
    </PortfolioContext.Provider>,
  );
}

describe("LoggedStamp", () => {
  afterEach(() => {
    vi.useRealTimers();
  });

  it("skips the animated stamp entirely when reduced motion is preferred", () => {
    mockMatchMedia(true);
    renderLoggedStamp();

    expect(screen.getByLabelText("Logged")).toBeInTheDocument();
    expect(screen.queryByRole("status")).not.toBeInTheDocument();
  });

  it("shows the stamp first, then settles to a checkmark after ~1.5s", () => {
    vi.useFakeTimers();
    mockMatchMedia(false);
    renderLoggedStamp();

    expect(screen.getByRole("status")).toHaveTextContent("Logged");

    act(() => {
      vi.advanceTimersByTime(1500);
    });

    expect(screen.getByLabelText("Logged")).toBeInTheDocument();
    expect(screen.queryByRole("status")).not.toBeInTheDocument();
  });
});
