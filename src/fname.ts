import type { UAsset } from "./uasset";

export class FName {
  #uasset: UAsset;
  #index: number;
  #instance: number;

  constructor(uasset: UAsset, index: number, instance: number) {
    this.#uasset = uasset;
    this.#index = index;
    this.#instance = instance;
  }

  get uasset() {
    return this.#uasset;
  }

  get index() {
    return this.#index;
  }

  get instance() {
    return this.#instance;
  }

  toString() {
    return (
      this.uasset.names[this.index] +
      (this.instance === 0 ? "" : `_${this.instance - 1}`)
    );
  }
}
