import { UAsset } from "./uasset";
import { UFile } from "./ufile";

export interface Line {
  id: string;
  text: string;
  meta: Record<string, string>;
}

export class UExport extends UFile {
  linesCount = 0;
  lines: Line[] = [];

  constructor(filename: string, public uasset: UAsset) {
    super(filename);
  }

  static get PropertyType() {
    return {
      BOOLEAN: 1,
      BYTE: 2,
      BOOLEAN_BYTE: 3,
      UINT16: 4,
      INT32: 7,
      FLOAT: 9,
      STRING: 10,
      NAME: 11,
    };
  }

  async read() {
    await super.read();
    this.readLines();
  }

  readLines() {
    this.pos = 0x000d;
    this.linesCount = this.readUInt32();
    this.lines = [];
    for (let i = 0; i < this.linesCount; i++) {
      const id = this.readFString();
      const text = this.readFString();
      const metaCount = this.readUInt32();
      const meta: Record<string, string> = {};
      for (let j = 0; j < metaCount; j++) {
        const type = this.readFName();
        const value = this.readFString();
        meta[type] = value;
      }
      this.lines.push({ id, text, meta });
    }
  }

  // readEntries() {
  //   this.header = this.readBytes(0x0a);
  //   this.entriesCount = this.readInt32();
  //   this.propsCount = this.readInt32();
  //   /** @type {Property[]} */
  //   this.props = [];
  //   for (let i = 0; i < this.propsCount; i++) {
  //     const name = this.readFName();
  //     const type = this.readByte();
  //     this.props.push({ name, type });
  //   }

  //   /** @type {Entry[]} */
  //   this.entries = [];
  //   this.offsets = [];
  //   for (let i = 0; i < this.entriesCount; i++) {
  //     const entry = {} as Record<string, string | number | (string | number)[]>;
  //     const offsetData = {} as Record<string, number>;
  //     entry.$tag = this.readFName();

  //     for (const prop of this.props) {
  //       offsetData[prop.name] = this.pos;

  //       let value;
  //       if (prop.name.endsWith("_Array")) {
  //         value = [];
  //         const length = this.readInt32();
  //         for (let j = 0; j < length; j++) {
  //           value.push(this.readPropValue(prop));
  //         }
  //       } else {
  //         value = this.readPropValue(prop);
  //       }

  //       entry[prop.name] = value;
  //     }

  //     this.entries.push(entry);
  //     this.offsets.push(offsetData);
  //   }
  // }

  // /**
  //  * @param {Property} prop
  //  */
  // readPropValue(prop: Property) {
  //   const { name, type } = prop;
  //   switch (type) {
  //     case UExport.PropertyType.BOOLEAN:
  //       return name.endsWith("_Array") ? this.readByte() : this.readInt32();
  //     case UExport.PropertyType.BYTE:
  //     case UExport.PropertyType.BOOLEAN_BYTE:
  //       return this.readByte();
  //     case UExport.PropertyType.UINT16:
  //       return this.readInt16();
  //     case UExport.PropertyType.INT32:
  //       return this.readInt32();
  //     case UExport.PropertyType.FLOAT:
  //       return this.readFloat();
  //     case UExport.PropertyType.STRING:
  //       return this.readFString();
  //     case UExport.PropertyType.NAME:
  //       return this.readFName();
  //     default:
  //       throw new Error(`Unknown property type ${type}`);
  //   }
  // }

  readFName() {
    const index = this.readInt32();
    this.readBytes(4);
    return this.uasset.names[index];
  }
}
