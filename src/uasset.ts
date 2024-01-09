import { UFile } from "./ufile";

const VALID_TAG = 0x9e2a83c1;

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

  async read() {
    await super.read();
    this.readHeader();
    this.readNames();
    this.readExports();
  }

  readHeader() {
    this.tag = this.readUInt32();
    if (this.tag !== VALID_TAG) {
      throw new Error(`Invalid tag ${this.tag}`);
    }

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

    this.headersSize = this.readInt32();
    this.packageGroup = this.readFString();
    this.packageFlags = this.readInt32();

    this.namesCount = this.readInt32();
    this.namesOffset = this.readInt32();
    this.gatherableTextDataCount = this.readInt32();
    this.gatherableTextDataOffset = this.readInt32();
    this.exportsCount = this.readInt32();
    this.exportsOffset = this.readInt32();

    // if (this.exportsCount != 1) {
    //   throw new Error(`Unsupported export count ${this.exportsCount}`);
    // }

    // this.importsCount = this.readInt32()
    // this.importsOffset = this.readInt32()

    // let restEnd = this.data.length
    // if (this.namesCount > 0) {
    //   restEnd = this.namesOffset
    // }

    // if (
    //   this.gatherableTextDataCount > 0 &&
    //   this.gatherableTextDataOffset > restEnd
    // ) {
    //   restEnd = this.gatherableTextDataOffset
    // }

    // if (this.exportsCount > 0 && this.exportsOffset > restEnd) {
    //   restEnd = this.exportsOffset
    // }

    // this.headerRest = this.readBytes(this.data.length - restEnd)
  }

  readNames() {
    this.pos = this.namesOffset;
    this.names = [];

    for (let i = 0; i < this.namesCount; i++) {
      const name = this.readFString();
      this.readBytes(4);
      this.names.push(name);
    }
  }

  readExports() {
    this.pos = this.exportsOffset;
    this.exports = [];

    for (let i = 0; i < this.exportsCount; i++) {
      const definition = new ExportDefinition(this);
      definition.read();
      this.exports.push(definition);
    }
  }

  readFName() {
    const nameIndex = this.readInt32();
    this.readBytes(4);
    return this.names[nameIndex];
  }
}

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

  constructor(public uasset: UAsset) {}

  read() {
    this.classIndex = this.uasset.readInt32();
    this.superIndex = this.uasset.readInt32();
    this.templateIndex = this.uasset.readInt32();
    this.packageIndex = this.uasset.readInt32();
    this.objectName = this.uasset.readFName();
    this.objectFlags = this.uasset.readUInt32();
    const serialSize = this.uasset.readInt64();
    const serialOffset = this.uasset.readInt64();
    this.isForcedExport = this.uasset.readBoolean();
    this.isNotForClient = this.uasset.readBoolean();
    this.isNotForServer = this.uasset.readBoolean();
    this.guid = this.uasset.readBytes(16);
    this.packageFlags = this.uasset.readInt32();
    this.isNotForEditorGame = this.uasset.readBoolean();
    this.isAsset = this.uasset.readBoolean();

    if (serialSize > Number.MAX_SAFE_INTEGER) {
      throw new Error(`Unsupported export size ${serialSize}`);
    }

    if (serialOffset > Number.MAX_SAFE_INTEGER) {
      throw new Error(`Unsupported export offset ${serialOffset}`);
    }

    this.serialSize = Number(serialSize);
    this.serialOffset = Number(serialOffset);
  }
}
