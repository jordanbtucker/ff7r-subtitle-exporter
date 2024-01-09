import { UAsset } from "./uasset";
import { UExport } from "./uexport";

export class UPackage {
  uassetFilename = "";
  uexpFilename = "";
  uasset = new UAsset("");
  uexp = new UExport("", this.uasset);

  constructor(public filename: string) {
    if (filename.endsWith(".uasset")) {
      this.uassetFilename = filename;
      this.uexpFilename = filename.replace(/\.uasset$/i, ".uexp");
    } else {
      throw new Error(
        `Filename must end with .uasset or .uexp but got ${filename}`
      );
    }
  }

  async read() {
    this.uasset = new UAsset(this.uassetFilename);
    await this.uasset.read();

    this.uexp = new UExport(this.uexpFilename, this.uasset);
    await this.uexp.read();
  }
}
