import EventEmitter from "events";
import fs from "fs";
import path from "path";
const raw: { islands: Island[]; atolls: Entry[][] } = JSON.parse(
  fs.readFileSync(path.join(__dirname, "../salat.json"), { encoding: "utf-8" })
);

const timings = ["fajr", "sunrise", "dhuhr", "asr", "maghrib", "isha"];
type timingsType = "fajr" | "sunrise" | "dhuhr" | "asr" | "maghrib" | "isha";

function removeUnneededStuff(string) {
  return string.toLowerCase().replace(/['-. ]/g, "");
}

class MVPrayerTimes extends EventEmitter {
  error?: Error;
  island: Island;
  entries: Entry[];

  private _previousNextPrayer: string;
  private _interval: NodeJS.Timer;

  static daysIntoYear(date: Date) {
    return (
      ((Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()) -
        Date.UTC(date.getFullYear(), 0, 0)) /
        24 /
        60 /
        60 /
        1000) %
      366
    );
  }

  static convertTimestampToString(timestamp: number): string {
    return [Math.floor(timestamp / 60), timestamp % 60]
      .map((i) => i.toString().padStart(2, "0"))
      .join(":");
  }

  static convertTimestampToDate(timestamp: number): Date {
    const hours = Math.floor(timestamp / 60);
    const minutes = timestamp % 60;

    let date = new Date();
    date.setHours(hours);
    date.setMinutes(minutes);
    date.setSeconds(0);

    return date;
  }

  constructor(...args) {
    super();

    if (args.length === 2) {
      // expecting something similar to "K", "Male"
      const atoll = removeUnneededStuff(args[0]);
      const island = removeUnneededStuff(args[1]);

      this.island = raw.islands.find(
        (i) =>
          removeUnneededStuff(i.atoll) === atoll &&
          removeUnneededStuff(i.island) === island
      );
    } else if (args.length === 1) {
      const arg = args[0];
      if (typeof arg === "number") {
        // expecting island id
        this.island = raw.islands.find((i) => i.islandId === arg);
      } else if (typeof arg === "string") {
        // expecting something similar to "K. Male"
        if (!arg.includes("."))
          this.error = new Error(
            `Can't decipher atoll and island from "${arg}", expecting something similar to "K. Male"`
          );

        const [atoll, island] = arg
          .split(".")
          .map((a) => removeUnneededStuff(a));

        this.island = raw.islands.find(
          (i) =>
            removeUnneededStuff(i.atoll) === atoll &&
            removeUnneededStuff(i.island) === island
        );
      } else {
        this.error = new Error(
          `Expected a string or number, received "${typeof arg}"`
        );
      }
    } else {
      this.error = new Error(
        'No arguments received, was expecting a format of new MVPrayerTimes(102) or new MVPrayerTimes("K. Male") or new MVPrayerTimes("K", "Male")'
      );
    }

    if (!this.error && !this.island)
      this.error = new Error(
        "Couldn't find the island that you were looking for :("
      );

    if (this.error) console.error(this.error);

    this.entries = raw.atolls[this.island.atollId].map((e) => {
      timings.forEach((t) => (e[t] += this.island.offset));
      return e;
    });
    this.start();
  }

  /**
   * Starts an interval that will emit 'prayer' events on prayer times
   */
  start() {
    if (this._interval) clearInterval(this._interval);
    this._previousNextPrayer = this.nextPrayer.call;
    this._interval = setInterval(
      (() => {
        if (this._previousNextPrayer !== this.nextPrayer.call) {
          this.emit(
            "prayer",
            this.getCall(this._previousNextPrayer as timingsType)
          );
        }

        this._previousNextPrayer = this.nextPrayer.call;
      }).bind(this),
      1000
    );
    this.emit("start");
    return true;
  }

  /**
   * Stop the interval that would emit 'prayer' events on prayer times
   */
  stop() {
    clearInterval(this._interval);
    this.emit("stop");
    return true;
  }

  /**
   * Gets a certain prayer call for a given day
   */
  getCall(
    call: timingsType,
    day = MVPrayerTimes.daysIntoYear(new Date())
  ): DetailedTimestamp {
    const timestamp = this.getEntryFromDay(day)[call];
    return {
      call,
      minutesIntoDay: timestamp,
      date: MVPrayerTimes.convertTimestampToDate(timestamp),
      string: MVPrayerTimes.convertTimestampToString(timestamp),
    };
  }

  /**
   * Gets all the timestamp details for a given day
   */
  getAll(day = MVPrayerTimes.daysIntoYear(new Date())): DetailedTimestamp[] {
    const timestamps = this.getEntryFromDay(day);
    return timings.map(
      (call) =>
        new Object({
          call,
          minutesIntoDay: timestamps[call],
          date: MVPrayerTimes.convertTimestampToDate(timestamps[call]),
          string: MVPrayerTimes.convertTimestampToString(timestamps[call]),
        }) as DetailedTimestamp
    );
  }

  /**
   * Get the prayer time entry for the day
   */
  getEntryFromDay(day: number): Entry {
    return this.entries.find((e) => e.day === day);
  }

  get today(): Entry {
    return this.getEntryFromDay(MVPrayerTimes.daysIntoYear(new Date()));
  }

  get nextPrayer(): DetailedTimestamp {
    let timestamps = this.today;
    const now = new Date();

    let call: timingsType = timings.find(
      (call) => MVPrayerTimes.convertTimestampToDate(timestamps[call]) > now
    ) as timingsType;
    if (!call) {
      call = "fajr";
      timestamps = this.getEntryFromDay(
        (MVPrayerTimes.daysIntoYear(new Date()) + 1) % 366
      );
    }

    return {
      call,
      minutesIntoDay: timestamps[call],
      date: MVPrayerTimes.convertTimestampToDate(timestamps[call]),
      string: MVPrayerTimes.convertTimestampToString(timestamps[call]),
    } as DetailedTimestamp;
  }
}

interface Island {
  atollId: number;
  islandId: number;
  atoll: string;
  island: string;
  offset: number;
  location: {
    lat?: number;
    long?: number;
  };
}

interface Timestamps<T> {
  fajr: T;
  sunrise: T;
  dhuhr: T;
  asr: T;
  maghrib: T;
  isha: T;
}

interface Entry extends Timestamps<number> {
  atollId: number;
  day: number;
}

interface DetailedTimestamp {
  call: string;
  minutesIntoDay: number;
  date: Date;
  string: string;
}

export { timings, MVPrayerTimes, Island, Entry };
