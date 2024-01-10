import { UAsset } from "./uasset";
import { UExport } from "./uexport";

/**
 * Represents a pair of *.uasset and *.uexp files.
 */
export class UPackage {
  /** The *.uasset filename. */
  uassetFilename = "";
  /** The *.uexp filename. */
  uexpFilename = "";
  /** The UAsset representing the *.uasset file. */
  uasset = new UAsset("");
  /** The UExport representing the *.uexp file. */
  uexp = new UExport("", this.uasset);

  /**
   * Opens a pair of *.uasset and *.uexp files for reading.
   * @param filename The filename of either the *.uasset or *.uexp file.
   */
  constructor(public filename: string) {
    // Check that the filename ends with either .uasset or .uexp and build the
    // corresponding filename pairs.
    if (filename.endsWith(".uasset")) {
      this.uassetFilename = filename;
      this.uexpFilename = filename.replace(/\.uasset$/i, ".uexp");
    } else if (filename.endsWith(".uexp")) {
      this.uexpFilename = filename;
      this.uassetFilename = filename.replace(/.uexp$/i, ".uasset");
    } else {
      throw new Error(
        `Filename must end with .uasset or .uexp but got ${filename}`
      );
    }
  }

  /**
   * Reads the file data for the pair into memory.
   */
  async read(): Promise<void> {
    this.uasset = new UAsset(this.uassetFilename);
    await this.uasset.read();

    this.uexp = new UExport(this.uexpFilename, this.uasset);
    await this.uexp.read();
  }
}
