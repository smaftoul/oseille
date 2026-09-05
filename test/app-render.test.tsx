import { afterEach, describe, expect, it, vi } from "vitest";
import { cleanup, render, screen } from "@testing-library/react";
import "../src/i18n.ts";
import AppRoot from "../src/AppRoot.tsx";
import type { PricesPayload } from "../src/lib/types";

const payload = {
  meta: {
    generatedAt: "2026-09-02T14:09:22.260Z",
    source: "RNM FranceAgriMer",
    note: "",
  },
  items: [
    {
      id: "PAMPLEMOUSSE_pamplemousse",
      libelle: "PAMPLEMOUSSE France vrac",
      attrs: {
        variety: null,
        color: null,
        origin: "France",
        packaging: "vrac",
        size: null,
        label: null,
        saleUnit: null,
        note: "PAMPLEMOUSSE",
      },
      productSlug: "PAMPLEMOUSSE",
      productName_fr: "Pamplemousse",
      productName_en: "Grapefruit",
      group: "Fruits",
      unit: "le kg",
      isMonthly: false,
      period: "27-08-2026",
      lastDate: "27-08-2026",
      summary: {
        conventional: {
          date: "27-08-2026",
          marche: "Fruits France DETAIL GMS",
          stade: "Détail",
          libelle: "PAMPLEMOUSSE France vrac",
          unit: "le kg",
          mean: 2.5,
          varia: 0,
          min: 2,
          max: 3,
          isBio: false,
        },
        bio: null,
        bioGms: null,
        bioMag: null,
      },
      prices: [],
    },
  ],
} as unknown as PricesPayload;

describe("app render at the deployed base path", () => {
  afterEach(() => {
    cleanup();
    vi.unstubAllGlobals();
  });

  it("renders the search box and prices when served under /oseille/", async () => {
    window.history.pushState({}, "", "/oseille/");
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue({ json: () => Promise.resolve(payload) }),
    );

    render(<AppRoot />);

    expect(await screen.findByRole("searchbox")).toBeTruthy();
    expect(await screen.findByText("PAMPLEMOUSSE France vrac")).toBeTruthy();
  });
});