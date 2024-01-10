import { appendFile, readdir, writeFile } from "fs/promises";
import { UPackage } from "./upackage";

/**
 * Processes the Unreal Engine files and outputs a CSV file for each region.
 */
async function run(): Promise<void> {
  // The `data` directory should contain one directory for each region.
  const regions = (await readdir("data")).filter((name) => name !== ".gitkeep");

  // Fail fast on no region directories found.
  if (regions.length === 0) {
    console.log(
      "No region folders found. Make sure at least one region folder is in the `data` folder. See README.md for details."
    );
    process.exitCode = 1;
    return;
  }

  for (const region of regions) {
    console.log(`Processing region ${region}...`);

    // Get all *.uasset files in the current region directory.
    const names = (await readdir(`data/${region}`)).filter((name) =>
      name.endsWith(".uasset")
    );

    // Write the header for the CSV file.
    await writeFile(`out/${region}.csv`, "ID,Speaker,Text\n");

    for (const name of names) {
      // Read each *.uasset/*.uexp file in the region directory.
      const pkg = new UPackage(`data/${region}/${name}`);
      await pkg.read();

      for (const { id, text, meta } of pkg.uexp.lines) {
        // Each "line" in a *.uexp file has an ID, text, and a list of key-value
        // meta pairs. The ACTOR meta pair is the name of the speaker.
        const speaker = meta["ACTOR"];

        // Skip any lines that do not have a speaker or do not have any text.
        if (speaker != null && speaker !== "" && text !== "") {
          // Write each line to the CSV file.
          await appendFile(
            `out/${region}.csv`,
            `${quote(id)},${quote(speaker)},${quote(text)}\n`
          );
        }
      }
    }
  }
}

/**
 * Returns a CSV-quoted version of the provided text to allow for double quotes
 * and line breaks to exist in a CSV field.
 *
 * The text is wrapped in double-quotes, and any pre-existing double-quotes are
 * escaped as double-double-quotes. For example, the text `Who are you calling
 * "buster", buster?` is converted to `"Who are you calling ""buster"",
 * buster?"`
 * @param text The text to quote.
 * @returns The CSV-quoted text.
 */
function quote(text: string): string {
  return `"${text.replaceAll('"', '""')}"`;
}

// Process the Unreal Engine files and write an errors to the console.
run().catch(console.error);
