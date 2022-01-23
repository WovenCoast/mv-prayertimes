/// <reference types="node" />
import EventEmitter from "events";
declare const timings: string[];
declare type timingsType = "fajr" | "sunrise" | "dhuhr" | "asr" | "maghrib" | "isha";
declare class MVPrayerTimes extends EventEmitter {
    error?: Error;
    island: Island;
    entries: Entry[];
    private _previousNextPrayer;
    private _interval;
    static daysIntoYear(date: Date): number;
    static convertTimestampToString(timestamp: number): string;
    static convertTimestampToDate(timestamp: number): Date;
    constructor(...args: any[]);
    /**
     * Starts an interval that will emit 'prayer' events on prayer times
     */
    start(): boolean;
    /**
     * Stop the interval that would emit 'prayer' events on prayer times
     */
    stop(): boolean;
    /**
     * Gets a certain prayer call for a given day
     */
    getCall(call: timingsType, day?: number): DetailedTimestamp;
    /**
     * Gets all the timestamp details for a given day
     */
    getAll(day?: number): DetailedTimestamp[];
    /**
     * Get the prayer time entry for the day
     */
    getEntryFromDay(day: number): Entry;
    get today(): Entry;
    get nextPrayer(): DetailedTimestamp;
    /**
     * Event emitter types
    */
   emit(event: "prayer", payload: DetailedTimestamp);

   on(event: "prayer", payload: DetailedTimestamp);

   off(event: "prayer", payload: DetailedTimestamp);
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
