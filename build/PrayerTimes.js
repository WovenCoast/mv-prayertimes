"use strict";
var __extends = (this && this.__extends) || (function () {
    var extendStatics = function (d, b) {
        extendStatics = Object.setPrototypeOf ||
            ({ __proto__: [] } instanceof Array && function (d, b) { d.__proto__ = b; }) ||
            function (d, b) { for (var p in b) if (Object.prototype.hasOwnProperty.call(b, p)) d[p] = b[p]; };
        return extendStatics(d, b);
    };
    return function (d, b) {
        if (typeof b !== "function" && b !== null)
            throw new TypeError("Class extends value " + String(b) + " is not a constructor or null");
        extendStatics(d, b);
        function __() { this.constructor = d; }
        d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
    };
})();
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.MVPrayerTimes = exports.timings = void 0;
var events_1 = __importDefault(require("events"));
var fs_1 = __importDefault(require("fs"));
var path_1 = __importDefault(require("path"));
var raw = JSON.parse(fs_1.default.readFileSync(path_1.default.join(__dirname, "../salat.json"), { encoding: "utf-8" }));
var timings = ["fajr", "sunrise", "dhuhr", "asr", "maghrib", "isha"];
exports.timings = timings;
function removeUnneededStuff(string) {
    return string.toLowerCase().replace(/['-. ]/g, "");
}
var MVPrayerTimes = /** @class */ (function (_super) {
    __extends(MVPrayerTimes, _super);
    function MVPrayerTimes() {
        var args = [];
        for (var _i = 0; _i < arguments.length; _i++) {
            args[_i] = arguments[_i];
        }
        var _this = _super.call(this) || this;
        if (args.length === 2) {
            // expecting something similar to "K", "Male"
            var atoll_1 = removeUnneededStuff(args[0]);
            var island_1 = removeUnneededStuff(args[1]);
            _this.island = raw.islands.find(function (i) {
                return removeUnneededStuff(i.atoll) === atoll_1 &&
                    removeUnneededStuff(i.island) === island_1;
            });
        }
        else if (args.length === 1) {
            var arg_1 = args[0];
            if (typeof arg_1 === "number") {
                // expecting island id
                _this.island = raw.islands.find(function (i) { return i.islandId === arg_1; });
            }
            else if (typeof arg_1 === "string") {
                // expecting something similar to "K. Male"
                if (!arg_1.includes("."))
                    _this.error = new Error("Can't decipher atoll and island from \"".concat(arg_1, "\", expecting something similar to \"K. Male\""));
                var _a = arg_1
                    .split(".")
                    .map(function (a) { return removeUnneededStuff(a); }), atoll_2 = _a[0], island_2 = _a[1];
                _this.island = raw.islands.find(function (i) {
                    return removeUnneededStuff(i.atoll) === atoll_2 &&
                        removeUnneededStuff(i.island) === island_2;
                });
            }
            else {
                _this.error = new Error("Expected a string or number, received \"".concat(typeof arg_1, "\""));
            }
        }
        else {
            _this.error = new Error('No arguments received, was expecting a format of new MVPrayerTimes(102) or new MVPrayerTimes("K. Male") or new MVPrayerTimes("K", "Male")');
        }
        if (!_this.error && !_this.island)
            _this.error = new Error("Couldn't find the island that you were looking for :(");
        if (_this.error)
            console.error(_this.error);
        _this.entries = raw.atolls[_this.island.atollId].map(function (e) {
            timings.forEach(function (t) { return (e[t] += _this.island.offset); });
            return e;
        });
        _this.start();
        return _this;
    }
    MVPrayerTimes.daysIntoYear = function (date) {
        return (((Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()) -
            Date.UTC(date.getFullYear(), 0, 0)) /
            24 /
            60 /
            60 /
            1000) %
            366);
    };
    MVPrayerTimes.convertTimestampToString = function (timestamp) {
        return [Math.floor(timestamp / 60), timestamp % 60]
            .map(function (i) { return i.toString().padStart(2, "0"); })
            .join(":");
    };
    MVPrayerTimes.convertTimestampToDate = function (timestamp) {
        var hours = Math.floor(timestamp / 60);
        var minutes = timestamp % 60;
        var date = new Date();
        date.setHours(hours);
        date.setMinutes(minutes);
        date.setSeconds(0);
        return date;
    };
    /**
     * Starts an interval that will emit 'prayer' events on prayer times
     */
    MVPrayerTimes.prototype.start = function () {
        var _this = this;
        if (this._interval)
            clearInterval(this._interval);
        this._previousNextPrayer = this.nextPrayer.call;
        this._interval = setInterval((function () {
            if (_this._previousNextPrayer !== _this.nextPrayer.call) {
                _this.emit("prayer", _this.getCall(_this._previousNextPrayer));
            }
            _this._previousNextPrayer = _this.nextPrayer.call;
        }).bind(this), 1000);
        this.emit("start");
        return true;
    };
    /**
     * Stop the interval that would emit 'prayer' events on prayer times
     */
    MVPrayerTimes.prototype.stop = function () {
        clearInterval(this._interval);
        this.emit("stop");
        return true;
    };
    /**
     * Gets a certain prayer call for a given day
     */
    MVPrayerTimes.prototype.getCall = function (call, day) {
        if (day === void 0) { day = MVPrayerTimes.daysIntoYear(new Date()); }
        var timestamp = this.getEntryFromDay(day)[call];
        return {
            call: call,
            minutesIntoDay: timestamp,
            date: MVPrayerTimes.convertTimestampToDate(timestamp),
            string: MVPrayerTimes.convertTimestampToString(timestamp),
        };
    };
    /**
     * Gets all the timestamp details for a given day
     */
    MVPrayerTimes.prototype.getAll = function (day) {
        if (day === void 0) { day = MVPrayerTimes.daysIntoYear(new Date()); }
        var timestamps = this.getEntryFromDay(day);
        return timings.map(function (call) {
            return new Object({
                call: call,
                minutesIntoDay: timestamps[call],
                date: MVPrayerTimes.convertTimestampToDate(timestamps[call]),
                string: MVPrayerTimes.convertTimestampToString(timestamps[call]),
            });
        });
    };
    /**
     * Get the prayer time entry for the day
     */
    MVPrayerTimes.prototype.getEntryFromDay = function (day) {
        return this.entries.find(function (e) { return e.day === day; });
    };
    Object.defineProperty(MVPrayerTimes.prototype, "today", {
        get: function () {
            return this.getEntryFromDay(MVPrayerTimes.daysIntoYear(new Date()));
        },
        enumerable: false,
        configurable: true
    });
    Object.defineProperty(MVPrayerTimes.prototype, "nextPrayer", {
        get: function () {
            var timestamps = this.today;
            var now = new Date();
            var call = timings.find(function (call) { return MVPrayerTimes.convertTimestampToDate(timestamps[call]) > now; });
            if (!call) {
                call = "fajr";
                timestamps = this.getEntryFromDay((MVPrayerTimes.daysIntoYear(new Date()) + 1) % 366);
            }
            return {
                call: call,
                minutesIntoDay: timestamps[call],
                date: MVPrayerTimes.convertTimestampToDate(timestamps[call]),
                string: MVPrayerTimes.convertTimestampToString(timestamps[call]),
            };
        },
        enumerable: false,
        configurable: true
    });
    return MVPrayerTimes;
}(events_1.default));
exports.MVPrayerTimes = MVPrayerTimes;
