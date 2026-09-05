import { afterEach, describe, expect, it, vi } from "vitest";
import { cleanup, render, screen } from "@testing-library/react";
import "../src/i18n.ts";
import AppRoot from "../src/AppRoot.tsx";
import type { PricesPayload } from "../src/lib/types";

const fixture: PricesPayload = {
  meta: {
    generatedAt: "2026-01-01T00:00:00.000Z",
    source: "test",
    note: "",
  },
  items: [
    {
      id: "test-item",
      libelle: "Test produce France vrac",
      attrs: {
        variety: null,
        color: null,
        origin: "France",
        packaging: "vrac",
        size: null,
        label: null,
        saleUnit: null,
        note: null,
      },
      productSlug: "TEST_PRODUCE",
      productName_fr: "Produit test",
      productName_en: "Test produce",
      group: "Fruits",
      unit: "le kg",
      isMonthly: false,
      period: "01-01-2026",
      lastDate: "01-01-2026",
      summary: {
        conventional: {
          date: "01-01-2026",
          marche: "test",
          stade: "Détail",
          libelle: "Test produce France vrac",
          unit: "le kg",
          mean: 1.5,
          varia: 0,
          min: 1,
          max: 2,
          isBio: false,
        },
        bio: null,
        bioGms: null,
        bioMag: null,
      },
      prices: [],
    },
  ],
};

describe("app render", () => {
  afterEach(() => {
    cleanup();
    vi.unstubAllGlobals();
  });

  it("mounts Home: search box and items from fetched payload", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue({ json: () => Promise.resolve(fixture) }),
    );

    render(<AppRoot />);

    expect(await screen.findByRole("searchbox")).toBeTruthy();
    expect(await screen.findByText(fixture.items[0].libelle)).toBeTruthy();
  });
});
