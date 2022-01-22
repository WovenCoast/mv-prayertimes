const { MVPrayerTimes } = require("../build/PrayerTimes");

const PrayerTimes = new MVPrayerTimes(102);

PrayerTimes.on("start", () => console.log(`Started interval`));
PrayerTimes.on("stop", () => console.log(`Stopped interval`));

console.log(
  `Next prayer call: ${PrayerTimes.nextPrayer.call} at ${PrayerTimes.nextPrayer.string}`
);

PrayerTimes.on("prayer", (prayerTime) =>
  console.log(
    `Prayer Call: ${
      prayerTime.call
    }\nNow: ${new Date().getTime()}\nPrayer Time: ${PrayerTimes.getCall(
      prayerTime.call
    ).date.getTime()}`
  )
);
