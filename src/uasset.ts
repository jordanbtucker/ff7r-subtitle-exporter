import { UFile } from "./ufile";

/** A tag that all FF7R *.uasset files start with. */
const VALID_TAG = 0x9e2a83c1;

/**
 * Represents a *.uasset file.
 */
export class UAsset extends UFile {
  tag = 0;
  version = 0;
  legacyVersion = 0;
  ue3Version = 0;
  licenseeVersion = 0;
  fileVersion = 0;
  customVersionsCount = 0;
  headersSize = 0;
  packageGroup = "";
  packageFlags = 0;
  namesCount = 0;
  namesOffset = 0;
  gatherableTextDataCount = 0;
  gatherableTextDataOffset = 0;
  exportsCount = 0;
  exportsOffset = 0;
  names: string[] = [];
  exports: ExportDefinition[] = [];

  /**
   * Reads the file data into memory.
   */
  async read(): Promise<void> {
    await super.read();
    this.readHeader();
    this.readNames();
    this.readExports();
  }

  /**
   * Reads the header information into memory.
   */
  readHeader(): void {
    // Assert that this is a valid Unreal Engine file.
    this.tag = this.readUInt32();
    if (this.tag !== VALID_TAG) {
      throw new Error(`Invalid tag ${this.tag}`);
    }

    // These version numbers aren't important for reading subtitle data, but we
    // check them to assert that this is a valid Unreal Engine file.
    this.version = this.readUInt32();
    this.legacyVersion = this.version & 0xffffffff;

    if (this.legacyVersion !== -4) {
      this.ue3Version = this.readInt32();
    }

    this.version = this.readInt32();
    this.licenseeVersion = this.readInt32() & 0xffff;
    this.fileVersion = this.version & 0xffff;

    if ((this.version & 0xffff) !== 0) {
      throw new Error(`Invalid version ${this.version}`);
    }

    if (this.licenseeVersion !== 0) {
      throw new Error(`Invalid licensee version ${this.licenseeVersion}`);
    }

    if (this.fileVersion !== 0) {
      throw new Error(`Invalid file version ${this.fileVersion}`);
    }

    if (this.legacyVersion <= -2) {
      this.customVersionsCount = this.readInt32();
      if (this.customVersionsCount !== 0) {
        throw new Error("Unsupported custom versions");
      }
    }

    // More information that isn't important for reading subtitle data.
    this.headersSize = this.readInt32();
    this.packageGroup = this.readFString();
    this.packageFlags = this.readInt32();

    // Read the name count and position of the name list.
    this.namesCount = this.readInt32();
    this.namesOffset = this.readInt32();

    // More information that isn't important for reading subtitle data.
    this.gatherableTextDataCount = this.readInt32();
    this.gatherableTextDataOffset = this.readInt32();

    // Read the export count and the position of the export definitions.
    this.exportsCount = this.readInt32();
    this.exportsOffset = this.readInt32();

    // FF7R text files should only have one export.
    if (this.exportsCount !== 1) {
      throw new Error(`Invalid number of exports: ${this.exportsCount}`);
    }
  }

  /**
   * Reads the list of names into memory.
   */
  readNames(): void {
    this.pos = this.namesOffset;
    this.names = [];

    for (let i = 0; i < this.namesCount; i++) {
      const name = this.readFString();
      this.readBytes(4);
      this.names.push(name);
    }
  }

  /**
   * Reads the export definitions into memory.
   */
  readExports(): void {
    this.pos = this.exportsOffset;
    this.exports = [];

    for (let i = 0; i < this.exportsCount; i++) {
      const definition = new ExportDefinition(this);
      definition.read();
      this.exports.push(definition);
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
    const name = this.names[index];
    if (instance > 0) {
      return `${name}_${instance - 1}`;
    } else {
      return name;
    }
  }
}

/**
 * Represents information about an export.
 */
export class ExportDefinition {
  classIndex = 0;
  superIndex = 0;
  templateIndex = 0;
  packageIndex = 0;
  objectName = "";
  objectFlags = 0;
  serialSize = 0;
  serialOffset = 0;
  isForcedExport = false;
  isNotForClient = false;
  isNotForServer = false;
  guid = Buffer.alloc(0);
  packageFlags = 0;
  isNotForEditorGame = false;
  isAsset = false;

  /**
   * Constructs an export definition tied to a *.uasset file.
   * @param uasset The *.uasset file to tie this export to.
   */
  constructor(public uasset: UAsset) {}

  /**
   * Reads the export definition into memory.
   */
  read(): void {
    // Information that isn't important for reading subtitle data.
    this.classIndex = this.uasset.readInt32();
    this.superIndex = this.uasset.readInt32();
    this.templateIndex = this.uasset.readInt32();
    this.packageIndex = this.uasset.readInt32();
    this.objectName = this.uasset.readFName();
    this.objectFlags = this.uasset.readUInt32();

    /** The size of the export data. */
    const serialSize = this.uasset.readInt64();
    /** The position of the export data. */
    const serialOffset = this.uasset.readInt64();

    // More information that isn't important for reading subtitle data.
    this.isForcedExport = this.uasset.readBoolean();
    this.isNotForClient = this.uasset.readBoolean();
    this.isNotForServer = this.uasset.readBoolean();
    this.guid = this.uasset.readBytes(16);
    this.packageFlags = this.uasset.readInt32();
    this.isNotForEditorGame = this.uasset.readBoolean();
    this.isAsset = this.uasset.readBoolean();

    // Assert that the export data size and position are not to large to handle.
    if (serialSize > Number.MAX_SAFE_INTEGER) {
      throw new Error(`Unsupported export size ${serialSize}`);
    }
    if (serialOffset > Number.MAX_SAFE_INTEGER) {
      throw new Error(`Unsupported export offset ${serialOffset}`);
    }

    // Convert the export data size and position from bigints to numbers.
    this.serialSize = Number(serialSize);
    this.serialOffset = Number(serialOffset);
  }
}
