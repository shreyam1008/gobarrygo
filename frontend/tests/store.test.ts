import { describe, expect, it } from "vitest";
import { appStore } from "@/lib/store/app-store";

describe("app store", () => {
  it("updates filter and search state", () => {
    appStore.setFilter("active");
    appStore.setSearch("ubuntu");

    const state = appStore.getState();
    expect(state.filter).toBe("active");
    expect(state.search).toBe("ubuntu");
  });
});
