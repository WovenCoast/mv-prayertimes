# mv-prayertimes

Prayer times for Maldives

This package uses a JSON replicate of the database used in the salatmv app. The source .db file can be found in the [github repo](https://github.com/WovenCoast/mv-prayertimes).

## Install

```sh
npm install mv-prayertimes
```

or

```sh
yarn install mv-prayertimes
```

## Usage

```js
import { MVPrayerTimes } from "mv-prayertimes";
// const { MVPrayerTimes } = require("mv-prayertimes");

const PrayerTimes = new MVPrayerTimes(102); // island id
const PrayerTimes = new MVPrayerTimes("K. Male"); // atoll and island
const PrayerTimes = new MVPrayerTimes("K", "Male"); // atoll and island

// get island id using
PrayerTimes.island.islandId; // 102

// prayer times for today
PrayerTimes.today; // [{call: 'fajr', ...}, ...]

// next prayer time
PrayerTimes.nextPrayer; // {call: 'fajr', timeInMinutes: 301, string: '' ...}

// events for every prayer time

PrayerTimes.on("prayer", (details) => {
  console.log(
    `[${details.string /* 5:30 */}] It's ${details.call /* fajr */} time!`
  );

  console.log(
    `Next prayer: ${PrayerTimes.nextPrayer.call /* dhuhr */} at ${
      PrayerTimes.nextPrayer.string /* 12:11 */
    }`
  );
});
```
