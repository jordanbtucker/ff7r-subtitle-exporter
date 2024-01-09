# Final Fantasy VII Remake Subtitle Exporter

Creates CSV files containing the subtitles of the game by reading the extracted
game files.

## Requirements

- Node.js v20 or later

## Installing

1. Clone this repository or download it.
2. Open the project folder in a terminal.
3. Run the following commands:
   ```
   npm install
   npm run build
   ```
4. Copy the desired region folders (`US`, `JP`, etc.) from
   `End/Content/GameContents/Text` into the `data` folder. (Obtaining the region
   folders is outside the scope of this project.)
5. Run the following command:
   ```
   npm start
   ```
6. Each region will be output to a CSV file in the `out` folder (e.g. `US.csv`,
   `JP.csv`, etc.).
