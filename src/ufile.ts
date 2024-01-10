import { readFile } from "node:fs/promises";

/**
 * A base class for reading an Unreal Engine file.
 */
export class UFile {
  /** The file data. */
  data = Buffer.alloc(0);
  /** The current position to begin reading. */
  pos = 0;

  /**
   * Opens an Unreal Engine file for reading.
   * @param filename The filename of the file to read.
   */
  constructor(public filename: string) {}

  /**
   * Reads the file data into memory and resets the position.
   */
  async read(): Promise<void> {
    this.data = await readFile(this.filename);
    this.pos = 0;
  }

  /**
   * Reads a Boolean value at the current position.
   * @returns The Boolean value at the current position.
   */
  readBoolean(): boolean {
    return this.readByte() !== 0;
  }

  /**
   * Reads a byte at the current position.
   * @returns The byte at the current position.
   */
  readByte(): number {
    if (this.pos >= this.data.byteLength) {
      throw new Error("Attempt to read past the end of the buffer");
    }
    return this.data[this.pos++];
  }

  /**
   * Reads an array of bytes at the current position.
   * @param n The number of bytes to read.
   * @returns The array of bytes at the current position.
   */
  readBytes(n: number): Buffer {
    const value = this.data.subarray(this.pos, this.pos + n);
    this.pos += n;
    return value;
  }

  /**
   * Reads a 16-bit signed integer at the current position.
   * @returns The 16-bit signed integer at the current position.
   */
  readInt16(): number {
    const value = this.data.readInt16LE(this.pos);
    this.pos += 2;
    return value;
  }

  /**
   * Reads a 32-bit signed integer at the current position.
   * @returns The 32-bit signed integer at the current position.
   */
  readInt32(): number {
    const value = this.data.readInt32LE(this.pos);
    this.pos += 4;
    return value;
  }

  /**
   * Reads a 64-bit signed integer at the current position.
   * @returns The 64-bit signed integer at the current position.
   */
  readInt64(): bigint {
    const value = this.data.readBigInt64LE(this.pos);
    this.pos += 8;
    return value;
  }

  /**
   * Reads a 32-bit unsigned integer at the current position.
   * @returns The 32-bit unsigned integer at the current position.
   */
  readUInt32(): number {
    const value = this.data.readUInt32LE(this.pos);
    this.pos += 4;
    return value;
  }

  /**
   * Reads a 32-bit floating point number at the current position.
   * @returns The 32-bit floating point number at the current position.
   */
  readFloat(): number {
    const value = this.data.readFloatLE(this.pos);
    this.pos += 4;
    return value;
  }

  /**
   * Reads a string at the current position.
   * @returns The string at the current position.
   */
  readFString(): string {
    // The length is the number of characters in the string, including the
    // closing NULL character.
    const length = this.readInt32();
    if (length === 0) {
      // Empty strings have a length of zero and no NULL character.
      return "";
    } else if (length > 0) {
      // A positive length means the string is encoded as ASCII, and the
      // character length equals the number of bytes.
      const value = this.data.toString("utf8", this.pos, this.pos + length);
      this.pos += length;
      return value.replace(/\0$/, "");
    } else {
      // A negative length means the string is encoded as UTF-16 LE and the
      // absolute value of the length is the number of UTF-16 characters, which
      // is half of the byte length.
      const byteLength = length * -1 * 2;
      const value = this.data.toString(
        "utf16le",
        this.pos,
        this.pos + byteLength
      );
      this.pos += byteLength;
      return value.replace(/\0$/, "");
    }
  }
}
