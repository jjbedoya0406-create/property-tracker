import { act, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { LoggedStamp } from "./LoggedStamp";

function mockMatchMedia(matches: boolean) {
  window.matchMedia = vi.fn().mockImplementation((query: string) => ({
    matches,
    media: query,
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
  })) as unknown as typeof window.matchMedia;
}

describe("LoggedStamp", () => {
  afterEach(() => {
    vi.useRealTimers();
  });

  it("skips the animated stamp entirely when reduced motion is preferred", () => {
    mockMatchMedia(true);
    render(<LoggedStamp />);

    expect(screen.getByLabelText("Logged")).toBeInTheDocument();
    expect(screen.queryByRole("status")).not.toBeInTheDocument();
  });

  it("shows the stamp first, then settles to a checkmark after ~1.5s", () => {
    vi.useFakeTimers();
    mockMatchMedia(false);
    render(<LoggedStamp />);

    expect(screen.getByRole("status")).toHaveTextContent("Logged");

    act(() => {
      vi.advanceTimersByTime(1500);
    });

    expect(screen.getByLabelText("Logged")).toBeInTheDocument();
    expect(screen.queryByRole("status")).not.toBeInTheDocument();
  });
});
