import { appendFile, readdir, writeFile } from "fs/promises";
import { UPackage } from "./upackage";

async function run() {
  const regions = (await readdir("data")).filter((name) => name !== ".gitkeep");
  if (regions.length === 0) {
    console.log(
      "No region folders found. Make sure at least one region folder is in the `data` folder. See README.md for details."
    );
    process.exitCode = 1;
    return;
  }
  for (const region of regions) {
    console.log(`Processing region ${region}...`);
    const names = (await readdir(`data/${region}`)).filter((name) =>
      name.endsWith(".uasset")
    );
    await writeFile(`out/${region}.csv`, "ID,Speaker,Text\n");
    for (const name of names) {
      const pkg = new UPackage(`data/${region}/${name}`);
      await pkg.read();
      for (const { id, text, meta } of pkg.uexp.lines) {
        const speaker = meta["ACTOR"];
        if (speaker != null && speaker !== "" && text !== "") {
          await appendFile(
            `out/${region}.csv`,
            `${quote(id)},${quote(speaker)},${quote(text)}\n`
          );
        }
      }
    }
  }
}

function quote(text: string): string {
  return `"${text.replaceAll('"', '""')}"`;
}

run().catch(console.error);
