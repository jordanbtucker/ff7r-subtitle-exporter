import { FName } from "./fname";
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

interface UExportDefinition {
  offset: number;
  size: number;
}

export class UAsset extends UFile {
  #names: string[] = [];
  #exports: UExportDefinition[] = [];
  #lines: Line[] = [];
  // #dataOffset = 0;
  // #namesByOffset: Record<number, string> = {};

  constructor(filename: string) {
    super(filename);
  }

  get names() {
    return this.#names;
  }

  get exports() {
    return this.#exports;
  }

  get lines() {
    return this.#lines;
  }

  // get props() {
  //   return this.#props;
  // }

  // get offsets() {
  //   return this.#offsets;
  // }

  override read(): void {
    super.read();

    this.readFName(); // name
    this.readFName(); // sourceName
    this.readUint32(); // packageFlags
    this.readUint32(); // cookedHeaderSize
    const namesOffset = this.readUint32();
    const namesSize = this.readUint32();
    this.readUint32(); // namesHashesOffset
    this.readUint32(); // namesHashesSize
    this.readUint32(); // importsOffset
    const exportsOffset = this.readUint32();
    const exportsBundlesOffset = this.readUint32();
    const graphDataOffset = this.readUint32();
    const graphDataSize = this.readUint32();
    const headerSize = graphDataOffset + graphDataSize;

    this.#names = [];
    for (this.pos = namesOffset; this.pos < namesOffset + namesSize; ) {
      this.#names.push(this.readFString());
    }

    this.#exports = [];
    let offset = headerSize;
    for (this.pos = exportsOffset; this.pos < exportsBundlesOffset; ) {
      this.readUint64(); // cookedSerialOffset
      const size = Number(this.readUint64());
      this.readUint64(); // objectName (FMappedName)
      this.readUint64(); // outerIndex
      this.readUint64(); // classIndex
      this.readUint64(); // superIndex
      this.readUint64(); // templateIndex
      this.readUint64(); // globalImportIndex
      this.readUint32(); // objectFlags
      this.readByte(); // filterFlags
      this.readBytes(3); // padding
      this.#exports.push({ offset, size });
      offset += size;
    }

    if (this.#exports.length !== 1) {
      throw new Error(`Expected 1 export, but found ${this.#exports.length}`);
    }

    this.pos = this.#exports[0]!.offset;
    this.pos += 0x2c;

    // Read the number of lines in the file.
    const linesCount = this.readUint32();
    this.#lines = [];

    for (let i = 0; i < linesCount; i++) {
      // Read the ID and text of the line.
      const id = this.readString();
      const text = this.readString();

      // Read the number of key-value meta pairs tied to the line. For most
      // files this will be 1, but `US/Resident_TxtRes.uexp` contains meta pairs
      // for the articles and plurals of certain nouns.
      const metaCount = this.readUint32();
      const meta: Record<string, string> = {};
      for (let j = 0; j < metaCount; j++) {
        // Read the type of the meta pair. For most lines this is 'ACTOR', but
        // `US/Resident_TxtRes.uexp` contains types like 'ARTICLE', 'PLURAL',
        // and 'SINGULAR'.
        const type = this.readFName();
        const value = this.readString();
        meta[type] = value;
      }

      this.lines.push({ id, text, meta });
    }
  }

  readFName() {
    return new FName(this, this.readUint32(), this.readUint32()).toString();
  }
}
