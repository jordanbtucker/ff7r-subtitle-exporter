import { readFile } from "node:fs/promises";

export class UFile {
  data = Buffer.alloc(0);
  pos = 0;

  constructor(public filename: string) {}

  async read() {
    this.data = await readFile(this.filename);
    this.pos = 0;
  }

  readBoolean() {
    return this.readByte() !== 0;
  }

  readByte() {
    return this.data[this.pos++];
  }

  /**
   * @param {number} n
   */
  readBytes(n: number) {
    const value = this.data.slice(this.pos, this.pos + n);
    this.pos += n;
    return value;
  }

  readInt16() {
    const value = this.data.readInt16LE(this.pos);
    this.pos += 2;
    return value;
  }

  readInt32() {
    const value = this.data.readInt32LE(this.pos);
    this.pos += 4;
    return value;
  }

  readInt64() {
    const value = this.data.readBigInt64LE(this.pos);
    this.pos += 8;
    return value;
  }

  readUInt32() {
    const value = this.data.readUInt32LE(this.pos);
    this.pos += 4;
    return value;
  }

  readFloat() {
    const value = this.data.readFloatLE(this.pos);
    this.pos += 4;
    return value;
  }

  readFString() {
    const length = this.readInt32();
    if (length === 0) {
      return "";
    } else if (length > 0) {
      const value = this.data.toString("utf8", this.pos, this.pos + length);
      this.pos += length;
      return value.replace(/\0$/, "");
    } else {
      const ucs2Length = length * -1 * 2;
      const value = this.data.toString(
        "utf16le",
        this.pos,
        this.pos + ucs2Length
      );
      this.pos += ucs2Length;
      return value.replace(/\0$/, "");
    }
  }
}
