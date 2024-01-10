import { UAsset } from "./uasset";
import { UFile } from "./ufile";

/**
 * A line in an FF7R text file.
 */
export interface Line {
  /** The ID of the line. */
  id: string;
  /** The text of the line. */
  text: string;
  /** A list of key-value pairs tied to the line. */
  meta: Record<string, string>;
}

/**
 * Represents a *.uexp file.
 */
export class UExport extends UFile {
  /** The number of lines in the file. */
  linesCount = 0;
  /** The lines in the file. */
  lines: Line[] = [];

  /**
   * Opens a *.uexp file for reading, tied to a *.uasset file.
   * @param filename The filename of the *.uexp file.
   * @param uasset The UAsset representing the related *.uasset file.
   */
  constructor(filename: string, public uasset: UAsset) {
    super(filename);
  }

  /**
   * Reads the file data into memory.
   */
  async read(): Promise<void> {
    await super.read();
    this.readLines();
  }

  /**
   * Reads the lines in the file.
   */
  readLines(): void {
    // Skip the first 12 bytes of the file. I don't know what they mean.
    this.pos = 0x000d;

    // Read the number of lines in the file.
    this.linesCount = this.readUInt32();
    this.lines = [];

    for (let i = 0; i < this.linesCount; i++) {
      // Read the ID and text of the line.
      const id = this.readFString();
      const text = this.readFString();

      // Read the number of key-value meta pairs tied to the line. For most
      // files this will be 1, but `US/Resident_TxtRes.uexp` contains meta pairs
      // for the articles and plurals of certain nouns.
      const metaCount = this.readUInt32();
      const meta: Record<string, string> = {};
      for (let j = 0; j < metaCount; j++) {
        // Read the type of the meta pair. For most lines this is 'ACTOR', but
        // `US/Resident_TxtRes.uexp` contains types like 'ARTICLE', 'PLURAL',
        // and 'SINGULAR'.
        const type = this.readFName();
        const value = this.readFString();
        meta[type] = value;
      }

      this.lines.push({ id, text, meta });
    }
  }

  /**
   * Reads a name at the current position.
   * @returns The name at the current position.
   */
  readFName(): string {
    // An FName is a string built from an index into the related *.uasset file
    // and an instance number. A *.uasset file has a list of "names", and the
    // FName's zero-based index points to a name in that list. If the FName has
    // a non-zero instance number, then the instance number is decremented by
    // one, preceeded by an underscore, and appended to the name. Otherwise the
    // name is returned as-is. For example, if a *.uasset has the list of names
    // ["Foo", "Bar"], and the FName has an index of 1 and an instance number of
    // 2, then the string "Bar_1" is returned. If the FName has an index of 0
    // and an instance number of 0, then "Foo" is returned.
    const index = this.readInt32();
    const instance = this.readInt32();
    const name = this.uasset.names[index];
    if (instance > 0) {
      return `${name}_${instance - 1}`;
    } else {
      return name;
    }
  }
}
