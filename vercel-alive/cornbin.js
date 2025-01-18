// 设置前端访问密码，使用 "https://域名/?key=密码" 访问
const APIKEY = "root";

// 定义错误类型常量
const ErrorTypes = {
  KV_NOT_FOUND: 'kvNotFound',
  UNAUTHORIZED: 'unauthorized',
  TASK_NOT_FOUND: 'taskNotFound',
  INTERVAL_REQUIRED: 'intervalRequired',
  INVALID_INTERVAL: 'invalidInterval',
  URL_REQUIRED: 'urlRequired', 
  INVALID_URL: 'invalidUrl',
  TASK_ROUTE_NOT_FOUND: 'taskRouteNotFound',
  JSON_PARSE_ERROR: 'jsonParseError',
  NOT_FOUND: 'notFound',
  INVALID_NOTIFICATION: 'invalidNotification_curl'
};

// 错误提示函数集合
const createError = {
  // KV 错误
  kvNotFound() { return new HTTPError( ErrorTypes.KV_NOT_FOUND, "未找到 KV 数据库绑定", 500, "服务器内部错误" ); },
  // APIKEY 错误
  unauthorized() { return new HTTPError( ErrorTypes.UNAUTHORIZED, "需要提供 Authorization Bearer abc 或搜索参数 key=abc", 401, "未经授权" ); },
  // task 任务错误
  taskNotFound() { return new HTTPError( ErrorTypes.TASK_NOT_FOUND, "未找到任务", 404, "未找到请求的资源" ); },
  // 间隔时间错误
  intervalRequired() { return new HTTPError( ErrorTypes.INTERVAL_REQUIRED, "需要提供间隔时间", 400, "请求错误" ); },
  // 间隔格式错误
  invalidInterval() { return new HTTPError( ErrorTypes.INVALID_INTERVAL, "间隔时间格式无效", 400, "请求错误" ); },
  // URL 空值错误
  urlRequired() { return new HTTPError( ErrorTypes.URL_REQUIRED, "需要提供 URL", 400, "请求错误" ); },
  // URL 格式错误
  invalidUrl() { return new HTTPError( ErrorTypes.INVALID_URL, "URL 格式无效", 400, "请求错误" ); },
  // task 任务路由错误
  taskRouteNotFound() { return new HTTPError( ErrorTypes.TASK_ROUTE_NOT_FOUND, "未找到任务路由", 404, "未找到请求的资源" ); },
  // json 解析错误
  jsonParseError(message) { return new HTTPError( ErrorTypes.JSON_PARSE_ERROR, `请求体 JSON 格式无效，${message}`, 400, "请求错误" ); },
  // 资源请求错误
  notFound() { return new HTTPError( ErrorTypes.NOT_FOUND, "未找到", 404, "未找到请求的资源" ); },
  // curl 通知错误
  invalidNotification() { return new HTTPError( ErrorTypes.INVALID_NOTIFICATION, "通知 curl 格式无效", 400, "请求错误" ); }
};

export default {
  async fetch(request, env) {
    try {
      const responseArray = await handleRequest(request, env, APIKEY);
      const contentType = responseArray[1] || "application/json";     
      if (contentType === "redirect") {
        const response = new Response(`重定向到 ${responseArray[0]}`, {
          status: 302,
          headers: {
            Location: responseArray[0],
          },
        });
        return response;
      } else if (typeof contentType === "string") {
        const response = new Response(responseArray[0], {
          headers: {
            "Content-Type": contentType,
          },
        });
        return response;
      } else {
        // 头部信息
        const responseHeaders = new Headers();
        for (const [key, value] of Object.entries(contentType)) {
          for (const v of value) {
            responseHeaders.append(key, v);
          }
        }
        const response = new Response(responseArray[0], {
          headers: responseHeaders,
        });
        return response;
      }
    } catch (e) {
      console.warn("处理请求出错", e);
      return errorToResponse(e);
    }
  },

  async scheduled(event, env, ctx) {
    ctx.waitUntil(checkAndRunTasks(env));
  },
};

// HTTPError 错误类
class HTTPError extends Error {
  constructor(name, message, status, statusText) {
    super(message);
    this.name = name;
    this.status = status;
    this.statusText = statusText;
  }
}

// Response 返回错误类
function errorToResponse(error) {
  const bodyJson = {
    ok: false,
    error: "服务器内部错误",
    message: "服务器内部错误",
  };
  let status = 500;
  let statusText = "服务器内部错误";

  if (error instanceof Error) {
    bodyJson.message = error.message;
    bodyJson.error = error.name;

    if (error.status) {
      status = error.status;
    }
    if (error.statusText) {
      statusText = error.statusText;
    }
  }
  return new Response(JSON.stringify(bodyJson, null, 2), {
    status: status,
    statusText: statusText,
    headers: {
      "Content-Type": "application/json",
    },
  });
}

// 定时任务调度器
// https://www.npmjs.com/package/cron-schedule
export const cronSchedule = (() => {
  var __defProp = Object.defineProperty;
  var __defProps = Object.defineProperties;
  var __getOwnPropDesc = Object.getOwnPropertyDescriptor;
  var __getOwnPropDescs = Object.getOwnPropertyDescriptors;
  var __getOwnPropNames = Object.getOwnPropertyNames;
  var __getOwnPropSymbols = Object.getOwnPropertySymbols;
  var __hasOwnProp = Object.prototype.hasOwnProperty;
  var __propIsEnum = Object.prototype.propertyIsEnumerable;
  var __defNormalProp = (obj, key, value) =>
    key in obj
      ? __defProp(obj, key, {
          enumerable: true,
          configurable: true,
          writable: true,
          value,
        })
      : (obj[key] = value);
  var __spreadValues = (a, b) => {
    for (var prop in b || (b = {}))
      if (__hasOwnProp.call(b, prop)) __defNormalProp(a, prop, b[prop]);
    if (__getOwnPropSymbols)
      for (var prop of __getOwnPropSymbols(b)) {
        if (__propIsEnum.call(b, prop)) __defNormalProp(a, prop, b[prop]);
      }
    return a;
  };
  var __spreadProps = (a, b) => __defProps(a, __getOwnPropDescs(b));
  var __export = (target, all) => {
    for (var name in all)
      __defProp(target, name, { get: all[name], enumerable: true });
  };
  var __copyProps = (to, from, except, desc) => {
    if ((from && typeof from === "object") || typeof from === "function") {
      for (let key of __getOwnPropNames(from))
        if (!__hasOwnProp.call(to, key) && key !== except)
          __defProp(to, key, {
            get: () => from[key],
            enumerable:
              !(desc = __getOwnPropDesc(from, key)) || desc.enumerable,
          });
    }
    return to;
  };
  var __toCommonJS = (mod) =>
    __copyProps(__defProp({}, "__esModule", { value: true }), mod);
  var __accessCheck = (obj, member, msg) => {
    if (!member.has(obj)) throw TypeError("无法执行" + msg);
  };
  var __privateGet = (obj, member, getter) => {
    __accessCheck(obj, member, "读取私有字段");
    return getter ? getter.call(obj) : member.get(obj);
  };
  var __privateAdd = (obj, member, value) => {
    if (member.has(obj))
      throw TypeError("不能重复添加相同的私有成员");
    member instanceof WeakSet ? member.add(obj) : member.set(obj, value);
  };
  var __privateSet = (obj, member, value, setter) => {
    __accessCheck(obj, member, "写入私有字段");
    setter ? setter.call(obj, value) : member.set(obj, value);
    return value;
  };

  // src/index.ts
  var src_exports = {};
  __export(src_exports, {
    Cron: () => Cron,
    IntervalBasedCronScheduler: () => IntervalBasedCronScheduler,
    TIMEOUT_MAX: () => TIMEOUT_MAX,
    TimerBasedCronScheduler: () => TimerBasedCronScheduler,
    extractDateElements: () => extractDateElements,
    getDaysBetweenWeekdays: () => getDaysBetweenWeekdays,
    getDaysInMonth: () => getDaysInMonth,
    longTimeout: () => longTimeout,
    parseCronExpression: () => parseCronExpression,
    wrapFunction: () => wrapFunction,
  });

  // src/utils.ts
  var TIMEOUT_MAX = 2147483647;
  // 工具函数
  function longTimeout(fn, timeout, handle) {
    // 处理超时
    let after = 0;
    if (timeout > TIMEOUT_MAX) {
      after = timeout - TIMEOUT_MAX;
      timeout = TIMEOUT_MAX;
    }
    handle != null
      ? handle
      : (handle = {
          timeoutId: void 0,
        });
    handle.timeoutId = setTimeout(() => {
      if (after > 0) {
        longTimeout(fn, after, handle);
      } else {
        fn();
      }
    }, timeout);
    return handle;
  }
  // 提取日期元素
  function extractDateElements(date) {
    return {
      second: date.getSeconds(),
      minute: date.getMinutes(),
      hour: date.getHours(),
      day: date.getDate(),
      month: date.getMonth(),
      weekday: date.getDay(),
      year: date.getFullYear(),
    };
  }
  // 获取两个工作日之间的天数
  function getDaysInMonth(year, month) {
    return new Date(year, month + 1, 0).getDate();
  }
  function getDaysBetweenWeekdays(weekday1, weekday2) {
    if (weekday1 <= weekday2) {
      return weekday2 - weekday1;
    }
    return 6 - weekday1 + weekday2 + 1;
  }
  // 包装函数，添加错误处理
  function wrapFunction(fn, errorHandler) {
    return () => {
      try {
        const res = fn();
        if (res instanceof Promise) {
          res.catch((err) => {
            if (errorHandler) {
              errorHandler(err);
            }
          });
        }
      } catch (err) {
        if (errorHandler) {
          errorHandler(err);
        }
      }
    };
  }

  // 基于时间间隔的定时任务调度器
  // src/schedulers/interval-based.ts
  var _interval, _intervalId, _tasks, _nextTaskId;
  var IntervalBasedCronScheduler = class {
    constructor(interval) {
      __privateAdd(this, _interval, void 0);
      __privateAdd(this, _intervalId, void 0);
      __privateAdd(this, _tasks, []);
      __privateAdd(this, _nextTaskId, 1);
      __privateSet(this, _interval, interval);
      this.start();
    }
    start() {
      if (__privateGet(this, _intervalId) !== void 0) {
        throw new Error("任务调度器已经启动。");
      }
      __privateSet(
        this,
        _intervalId,
        setInterval(this.processTasks.bind(this), __privateGet(this, _interval))
      );
    }
    stop() {
      if (__privateGet(this, _intervalId)) {
        clearInterval(__privateGet(this, _intervalId));
        __privateSet(this, _intervalId, void 0);
      }
    }
    insertTask(newTask) {
      const index = __privateGet(this, _tasks).findIndex(
        (task) => task.nextExecution.getTime() > newTask.nextExecution.getTime()
      );
      __privateGet(this, _tasks).splice(index, 0, newTask);
    }
    registerTask(cron, task, opts) {
      var _a;
      const id = __privateGet(this, _nextTaskId);
      this.insertTask({
        id,
        cron,
        nextExecution: cron.getNextDate(),
        task,
        isOneTimeTask:
          (_a = opts == null ? void 0 : opts.isOneTimeTask) != null
            ? _a
            : false,
        errorHandler: opts == null ? void 0 : opts.errorHandler,
      });
      __privateSet(this, _nextTaskId, __privateGet(this, _nextTaskId) + 1);
      return id;
    }
    unregisterTask(id) {
      const taskIndex = __privateGet(this, _tasks).findIndex(
        (task) => task.id === id
      );
      if (taskIndex === -1) throw new Error("未找到任务。");
      __privateGet(this, _tasks).splice(taskIndex, 1);
    }
    sortTasks() {
      __privateGet(this, _tasks).sort((a, b) => {
        return a.nextExecution.getTime() - b.nextExecution.getTime();
      });
    }
    processTasks() {
      const now = Date.now();
      let taskExecuted = false;
      let oneTimeTaskExecuted = false;
      for (let i = 0; i < __privateGet(this, _tasks).length; i += 1) {
        const task = __privateGet(this, _tasks)[i];
        if (task.nextExecution.getTime() <= now) {
          wrapFunction(task.task, task.errorHandler)();
          if (!task.isOneTimeTask) {
            taskExecuted = true;
            task.nextExecution = task.cron.getNextDate();
          } else {
            oneTimeTaskExecuted = true;
          }
        } else {
          break;
        }
      }
      if (oneTimeTaskExecuted) {
        __privateSet(
          this,
          _tasks,
          __privateGet(this, _tasks).filter(
            (task) => task.nextExecution.getTime() > now
          )
        );
      }
      if (taskExecuted) {
        this.sortTasks();
      }
    }
  };
  _interval = new WeakMap();
  _intervalId = new WeakMap();
  _tasks = new WeakMap();
  _nextTaskId = new WeakMap();

  // 基于定时器的任务调度器
  // src/schedulers/timer-based.ts
  var TimerBasedCronScheduler = class {
    static setTimeout(cron, task, opts) {
      const nextSchedule = cron.getNextDate();
      const timeout = nextSchedule.getTime() - Date.now();
      return longTimeout(
        wrapFunction(task, opts == null ? void 0 : opts.errorHandler),
        timeout
      );
    }
    static setInterval(cron, task, opts) {
      var _a;
      const handle =
        (_a = opts == null ? void 0 : opts.handle) != null
          ? _a
          : { timeoutId: void 0 };
      const { timeoutId } = this.setTimeout(cron, () => {
        wrapFunction(task, opts == null ? void 0 : opts.errorHandler)();
        this.setInterval(
          cron,
          task,
          __spreadProps(__spreadValues({}, opts), { handle })
        );
      });
      handle.timeoutId = timeoutId;
      return handle;
    }
    static clearTimeoutOrInterval(handle) {
      if (handle.timeoutId) {
        clearTimeout(handle.timeoutId);
      }
    }
  };

  // src/cron.ts
  var Cron = class {
    constructor({ seconds, minutes, hours, days, months, weekdays }) {
      if (!seconds || seconds.size === 0)
        throw new Error("必须至少设置一个有效的秒数。");
      if (!minutes || minutes.size === 0)
        throw new Error("必须至少设置一个有效的分钟。");
      if (!hours || hours.size === 0)
        throw new Error("必须至少设置一个有效的小时。");
      if (!months || months.size === 0)
        throw new Error("必须至少设置一个有效的月份。");
      if ((!weekdays || weekdays.size === 0) && (!days || days.size === 0))
        throw new Error("必须至少设置一个有效的日期或星期。");
      this.seconds = Array.from(seconds).sort((a, b) => a - b);
      this.minutes = Array.from(minutes).sort((a, b) => a - b);
      this.hours = Array.from(hours).sort((a, b) => a - b);
      this.days = Array.from(days).sort((a, b) => a - b);
      this.months = Array.from(months).sort((a, b) => a - b);
      this.weekdays = Array.from(weekdays).sort((a, b) => a - b);
      const validateData = (name, data, constraint) => {
        if (
          data.some(
            (x) =>
              typeof x !== "number" ||
              x % 1 !== 0 ||
              x < constraint.min ||
              x > constraint.max
          )
        ) {
          throw new Error(
            `${name} 只能包含 ${constraint.min} 到 ${constraint.max} 之间的整数`
          );
        }
      };
      validateData("seconds", this.seconds, { min: 0, max: 59 });
      validateData("minutes", this.minutes, { min: 0, max: 59 });
      validateData("hours", this.hours, { min: 0, max: 23 });
      validateData("days", this.days, { min: 1, max: 31 });
      validateData("months", this.months, { min: 0, max: 11 });
      validateData("weekdays", this.weekdays, { min: 0, max: 6 });
      this.reversed = {
        seconds: this.seconds.map((x) => x).reverse(),
        minutes: this.minutes.map((x) => x).reverse(),
        hours: this.hours.map((x) => x).reverse(),
        days: this.days.map((x) => x).reverse(),
        months: this.months.map((x) => x).reverse(),
        weekdays: this.weekdays.map((x) => x).reverse(),
      };
    }
    findAllowedHour(dir, startHour) {
      return dir === "next"
        ? this.hours.find((x) => x >= startHour)
        : this.reversed.hours.find((x) => x <= startHour);
    }
    findAllowedMinute(dir, startMinute) {
      return dir === "next"
        ? this.minutes.find((x) => x >= startMinute)
        : this.reversed.minutes.find((x) => x <= startMinute);
    }
    findAllowedSecond(dir, startSecond) {
      return dir === "next"
        ? this.seconds.find((x) => x > startSecond)
        : this.reversed.seconds.find((x) => x < startSecond);
    }
    findAllowedTime(dir, startTime) {
      let hour = this.findAllowedHour(dir, startTime.hour);
      if (hour !== void 0) {
        if (hour === startTime.hour) {
          let minute = this.findAllowedMinute(dir, startTime.minute);
          if (minute !== void 0) {
            if (minute === startTime.minute) {
              const second = this.findAllowedSecond(dir, startTime.second);
              if (second !== void 0) {
                return { hour, minute, second };
              } else {
                minute = this.findAllowedMinute(
                  dir,
                  dir === "next" ? startTime.minute + 1 : startTime.minute - 1
                );
                if (minute !== void 0) {
                  return {
                    hour,
                    minute,
                    second:
                      dir === "next"
                        ? this.seconds[0]
                        : this.reversed.seconds[0],
                  };
                }
              }
            } else {
              return {
                hour,
                minute,
                second:
                  dir === "next" ? this.seconds[0] : this.reversed.seconds[0],
              };
            }
          }
          hour = this.findAllowedHour(
            dir,
            dir === "next" ? startTime.hour + 1 : startTime.hour - 1
          );
          if (hour !== void 0) {
            return {
              hour,
              minute:
                dir === "next" ? this.minutes[0] : this.reversed.minutes[0],
              second:
                dir === "next" ? this.seconds[0] : this.reversed.seconds[0],
            };
          }
        } else {
          return {
            hour,
            minute: dir === "next" ? this.minutes[0] : this.reversed.minutes[0],
            second: dir === "next" ? this.seconds[0] : this.reversed.seconds[0],
          };
        }
      }
      return void 0;
    }
    findAllowedDayInMonth(dir, year, month, startDay) {
      var _a, _b;
      if (startDay < 1) throw new Error("开始日期不能小于1。");
      const daysInMonth = getDaysInMonth(year, month);
      const daysRestricted = this.days.length !== 31;
      const weekdaysRestricted = this.weekdays.length !== 7;
      if (!daysRestricted && !weekdaysRestricted) {
        if (startDay > daysInMonth) {
          return dir === "next" ? void 0 : daysInMonth;
        }
        return startDay;
      }
      let allowedDayByDays;
      if (daysRestricted) {
        allowedDayByDays =
          dir === "next"
            ? this.days.find((x) => x >= startDay)
            : this.reversed.days.find((x) => x <= startDay);
        if (allowedDayByDays !== void 0 && allowedDayByDays > daysInMonth) {
          allowedDayByDays = void 0;
        }
      }
      let allowedDayByWeekdays;
      if (weekdaysRestricted) {
        const startWeekday = new Date(year, month, startDay).getDay();
        const nearestAllowedWeekday =
          dir === "next"
            ? (_a = this.weekdays.find((x) => x >= startWeekday)) != null
              ? _a
              : this.weekdays[0]
            : (_b = this.reversed.weekdays.find((x) => x <= startWeekday)) !=
              null
            ? _b
            : this.reversed.weekdays[0];
        if (nearestAllowedWeekday !== void 0) {
          const daysBetweenWeekdays =
            dir === "next"
              ? getDaysBetweenWeekdays(startWeekday, nearestAllowedWeekday)
              : getDaysBetweenWeekdays(nearestAllowedWeekday, startWeekday);
          allowedDayByWeekdays =
            dir === "next"
              ? startDay + daysBetweenWeekdays
              : startDay - daysBetweenWeekdays;
          if (allowedDayByWeekdays > daysInMonth || allowedDayByWeekdays < 1) {
            allowedDayByWeekdays = void 0;
          }
        }
      }
      if (allowedDayByDays !== void 0 && allowedDayByWeekdays !== void 0) {
        return dir === "next"
          ? Math.min(allowedDayByDays, allowedDayByWeekdays)
          : Math.max(allowedDayByDays, allowedDayByWeekdays);
      }
      if (allowedDayByDays !== void 0) {
        return allowedDayByDays;
      }
      if (allowedDayByWeekdays !== void 0) {
        return allowedDayByWeekdays;
      }
      return void 0;
    }
    getNextDate(startDate = new Date()) {
      const startDateElements = extractDateElements(startDate);
      let minYear = startDateElements.year;
      let startIndexMonth = this.months.findIndex(
        (x) => x >= startDateElements.month
      );
      if (startIndexMonth === -1) {
        startIndexMonth = 0;
        minYear++;
      }
      const maxIterations = this.months.length * 5;
      for (let i = 0; i < maxIterations; i++) {
        const year =
          minYear + Math.floor((startIndexMonth + i) / this.months.length);
        const month = this.months[(startIndexMonth + i) % this.months.length];
        const isStartMonth =
          year === startDateElements.year && month === startDateElements.month;
        let day = this.findAllowedDayInMonth(
          "next",
          year,
          month,
          isStartMonth ? startDateElements.day : 1
        );
        let isStartDay = isStartMonth && day === startDateElements.day;
        if (day !== void 0 && isStartDay) {
          const nextTime = this.findAllowedTime("next", startDateElements);
          if (nextTime !== void 0) {
            return new Date(
              year,
              month,
              day,
              nextTime.hour,
              nextTime.minute,
              nextTime.second
            );
          }
          day = this.findAllowedDayInMonth("next", year, month, day + 1);
          isStartDay = false;
        }
        if (day !== void 0 && !isStartDay) {
          return new Date(
            year,
            month,
            day,
            this.hours[0],
            this.minutes[0],
            this.seconds[0]
          );
        }
      }
      throw new Error("未找到有效的下一个日期。");
    }
    getNextDates(amount, startDate) {
      const dates = [];
      let nextDate;
      for (let i = 0; i < amount; i++) {
        nextDate = this.getNextDate(nextDate != null ? nextDate : startDate);
        dates.push(nextDate);
      }
      return dates;
    }
    *getNextDatesIterator(startDate, endDate) {
      let nextDate;
      while (true) {
        nextDate = this.getNextDate(startDate);
        startDate = nextDate;
        if (endDate && endDate.getTime() < nextDate.getTime()) {
          return;
        }
        yield nextDate;
      }
    }
    getPrevDate(startDate = new Date()) {
      const startDateElements = extractDateElements(startDate);
      let maxYear = startDateElements.year;
      let startIndexMonth = this.reversed.months.findIndex(
        (x) => x <= startDateElements.month
      );
      if (startIndexMonth === -1) {
        startIndexMonth = 0;
        maxYear--;
      }
      const maxIterations = this.reversed.months.length * 5;
      for (let i = 0; i < maxIterations; i++) {
        const year =
          maxYear -
          Math.floor((startIndexMonth + i) / this.reversed.months.length);
        const month =
          this.reversed.months[
            (startIndexMonth + i) % this.reversed.months.length
          ];
        const isStartMonth =
          year === startDateElements.year && month === startDateElements.month;
        let day = this.findAllowedDayInMonth(
          "prev",
          year,
          month,
          isStartMonth ? startDateElements.day : 31
        );
        let isStartDay = isStartMonth && day === startDateElements.day;
        if (day !== void 0 && isStartDay) {
          const prevTime = this.findAllowedTime("prev", startDateElements);
          if (prevTime !== void 0) {
            return new Date(
              year,
              month,
              day,
              prevTime.hour,
              prevTime.minute,
              prevTime.second
            );
          }
          if (day > 1) {
            day = this.findAllowedDayInMonth("prev", year, month, day - 1);
            isStartDay = false;
          }
        }
        if (day !== void 0 && !isStartDay) {
          return new Date(
            year,
            month,
            day,
            this.reversed.hours[0],
            this.reversed.minutes[0],
            this.reversed.seconds[0]
          );
        }
      }
      throw new Error("找到有效的上一个日期");
    }
    getPrevDates(amount, startDate) {
      const dates = [];
      let prevDate;
      for (let i = 0; i < amount; i++) {
        prevDate = this.getPrevDate(prevDate != null ? prevDate : startDate);
        dates.push(prevDate);
      }
      return dates;
    }
    *getPrevDatesIterator(startDate, endDate) {
      let prevDate;
      while (true) {
        prevDate = this.getPrevDate(startDate);
        startDate = prevDate;
        if (endDate && endDate.getTime() > prevDate.getTime()) {
          return;
        }
        yield prevDate;
      }
    }
    matchDate(date) {
      const { second, minute, hour, day, month, weekday } =
        extractDateElements(date);
      if (
        this.seconds.indexOf(second) === -1 ||
        this.minutes.indexOf(minute) === -1 ||
        this.hours.indexOf(hour) === -1 ||
        this.months.indexOf(month) === -1
      ) {
        return false;
      }
      if (this.days.length !== 31 && this.weekdays.length !== 7) {
        return (
          this.days.indexOf(day) !== -1 || this.weekdays.indexOf(weekday) !== -1
        );
      }
      return (
        this.days.indexOf(day) !== -1 && this.weekdays.indexOf(weekday) !== -1
      );
    }
  };

  // src/cron-parser.ts
  var secondConstraint = {
    min: 0,
    max: 59,
  };
  var minuteConstraint = {
    min: 0,
    max: 59,
  };
  var hourConstraint = {
    min: 0,
    max: 23,
  };
  var dayConstraint = {
    min: 1,
    max: 31,
  };
  var monthConstraint = {
    min: 1,
    max: 12,
    aliases: {
      jan: "1",
      feb: "2",
      mar: "3",
      apr: "4",
      may: "5",
      jun: "6",
      jul: "7",
      aug: "8",
      sep: "9",
      oct: "10",
      nov: "11",
      dec: "12",
    },
  };
  var weekdayConstraint = {
    min: 0,
    max: 6,
    aliases: {
      7: "0",
      sun: "0",
      mon: "1",
      tue: "2",
      wed: "3",
      thu: "4",
      fri: "5",
      sat: "6",
    },
  };
  var timeNicknames = {
    "@yearly": "0 0 1 1 *",
    "@annually": "0 0 1 1 *",
    "@monthly": "0 0 1 1 *",
    "@weekly": "0 0 * * 0",
    "@daily": "0 0 * * *",
    "@hourly": "0 * * * *",
    "@minutely": "* * * * *",
  };
  function parseElement(element, constraint) {
    const result = /* @__PURE__ */ new Set();
    if (element === "*") {
      for (let i = constraint.min; i <= constraint.max; i = i + 1) {
        result.add(i);
      }
      return result;
    }
    const listElements = element.split(",");
    if (listElements.length > 1) {
      listElements.forEach((listElement) => {
        const parsedListElement = parseElement(listElement, constraint);
        parsedListElement.forEach((x) => result.add(x));
      });
      return result;
    }
    const parseSingleElement = (singleElement) => {
      var _a, _b;
      singleElement =
        (_b =
          (_a = constraint.aliases) == null
            ? void 0
            : _a[singleElement.toLowerCase()]) != null
          ? _b
          : singleElement;
      const parsedElement = parseInt(singleElement, 10);
      if (Number.isNaN(parsedElement)) {
        throw new Error(`解析 ${element} 失败：${singleElement} 不是一个有效数字。`);
      }
      if (parsedElement < constraint.min || parsedElement > constraint.max) {
        throw new Error(
          `解析 ${element} 失败：${singleElement} 超出了允许范围 ${constraint.min} - ${constraint.max}。`
        );
      }
      return parsedElement;
    };
    const rangeSegments =
      /^((([0-9a-zA-Z]+)-([0-9a-zA-Z]+))|\*)(\/([0-9]+))?$/.exec(element);
    if (rangeSegments === null) {
      result.add(parseSingleElement(element));
      return result;
    }
    const parsedStart =
      rangeSegments[1] === "*"
        ? constraint.min
        : parseSingleElement(rangeSegments[3]);
    const parsedEnd =
      rangeSegments[1] === "*"
        ? constraint.max
        : parseSingleElement(rangeSegments[4]);
    if (parsedStart > parsedEnd) {
      throw new Error(
        `解析 ${element} 失败：无效的范围 (起始值: ${parsedStart}, 结束值: ${parsedEnd}).`
      );
    }
    const step = rangeSegments[6];
    let parsedStep = 1;
    if (step !== void 0) {
      parsedStep = parseInt(step, 10);
      if (Number.isNaN(parsedStep)) {
        `解析步骤失败：期望 ${step} 的值应该大于 0。`
      } else if (parsedStep < 1) {
        throw new Error(
          `解析步骤失败：期望 ${step} 的值应该大于 0。`
        );
      }
    }
    for (let i = parsedStart; i <= parsedEnd; i = i + parsedStep) {
      result.add(i);
    }
    return result;
  }
  function parseCronExpression(cronExpression) {
    var _a;
    if (typeof cronExpression !== "string") {
      throw new TypeError("无效的 cron 表达式：必须是字符串类型。");
    }
    cronExpression =
      (_a = timeNicknames[cronExpression.toLowerCase()]) != null
        ? _a
        : cronExpression;
    const elements = cronExpression.split(" ");
    if (elements.length < 5 || elements.length > 6) {
      throw new TypeError("无效的 cron 表达式：必须是字符串类型。");
    }
    const rawSeconds = elements.length === 6 ? elements[0] : "0";
    const rawMinutes = elements.length === 6 ? elements[1] : elements[0];
    const rawHours = elements.length === 6 ? elements[2] : elements[1];
    const rawDays = elements.length === 6 ? elements[3] : elements[2];
    const rawMonths = elements.length === 6 ? elements[4] : elements[3];
    const rawWeekdays = elements.length === 6 ? elements[5] : elements[4];
    return new Cron({
      seconds: parseElement(rawSeconds, secondConstraint),
      minutes: parseElement(rawMinutes, minuteConstraint),
      hours: parseElement(rawHours, hourConstraint),
      days: parseElement(rawDays, dayConstraint),
      months: new Set(
        Array.from(parseElement(rawMonths, monthConstraint)).map((x) => x - 1)
      ),
      weekdays: parseElement(rawWeekdays, weekdayConstraint),
    });
  }
  return __toCommonJS(src_exports);
})();

// 工具函数
function getCookieValue(cookie, key) {
  let keyValue = null;
  if (cookie) {
    const parts = cookie.split(";");
    for (const part of parts) {
      const [cookieKey, value] = part.split("=");
      if (cookieKey && cookieKey.trim() === key) {
        keyValue = value;
        break;
      }
    }
  }
  return keyValue;
}

function encodeHTML(str) {
  return str.replace(/[\u00A0-\u9999<>\&]/g, function (i) {
    return "&#" + i.charCodeAt(0) + ";";
  });
}

function isValidInterval(value) {
  const num = Number(value);

  if (!isNaN(num)) {
    if (num >= 1) {
      // yes valid
      return true;
    } else {
      return false;
    }
  } else {
    // try parse cron expression
    try {
      cronSchedule.parseCronExpression(value);
      return true;
    } catch (_e) {
      console.warn("定时任务解析错误", _e);
      return false;
    }
  }
}

function isValidUrl(url) {
  try {
    new URL(url);
    return true;
  } catch (err) {
    // 如果是 curl 命令
    try {
      parseCurl(url);
      return true;
    } catch (e) {
      console.warn("curl 命令解析错误", e);
      return false;
    }
    return false;
  }
}

function addZero(num) {
  return num < 10 ? "0" + num : num;
}

// 解析 curl 命令
export function parseCurl(curl_request) {
  const argvsArr = stringToArgv(curl_request, {
    removequotes: "always",
  }).map((item) => {
    let value = item.trim();
    if (value.startsWith("\\")) {
      value = value.slice(1).trim();
    }
    return value;
  });

  const argvs = parseArgv(argvsArr);
  const json = {
    headers: {},
  };

  const removeQuotes = (str) => str.replace(/['"]+/g, "");

  const stringIsUrl = (url) => {
    return /^(ftp|http|https):\/\/[^ "]+$/.test(url);
  };

  const parseField = (string) => {
    return string.split(/: (.+)/);
  };

  const parseHeader = (header) => {
    let parsedHeader = {};
    if (Array.isArray(header)) {
      header.forEach((item, index) => {
        const field = parseField(item);
        parsedHeader[field[0]] = field[1];
      });
    } else {
      const field = parseField(header);
      parsedHeader[field[0]] = field[1];
    }

    return parsedHeader;
  };

  for (const argv in argvs) {
    switch (argv) {
      case "_":
        {
          const _ = argvs[argv];
          _.forEach((item) => {
            item = removeQuotes(item);

            if (stringIsUrl(item)) {
              json.url = item;
            }
          });
        }
        break;

      case "X":
      case "request":
        json.method = argvs[argv];
        break;

      case "H":
      case "header":
        {
          const parsedHeader = parseHeader(argvs[argv]);
          json.headers = {
            ...json.header,
            ...parsedHeader,
          };
        }
        break;

      case "u":
      case "user":
        json.header["Authorization"] = argvs[argv];
        break;

      case "A":
      case "user-agent":
        json.header["user-agent"] = argvs[argv];
        break;

      case "I":
      case "head":
        json.method = "HEAD";
        break;

      case "L":
      case "location":
        json.redirect = "follow";
        const value = argvs[argv];
        if (typeof value === "string") {
          json.url = value;
        }
        break;

      case "b":
      case "cookie":
        json.header["Set-Cookie"] = argvs[argv];
        break;

      case "d":
      case "data":
      case "data-raw":
      case "data-ascii":
        const dataValue = argvs[argv];
        if (typeof dataValue === "string") {
          json.body = argvs[argv];
        } else {
          throw new Error("无效的curl命令，必须是字符串类型");
        }
        break;

      case "data-urlencode":
        json.body = argvs[argv];
        break;

      case "compressed":
        if (!json.header["Accept-Encoding"]) {
          json.header["Accept-Encoding"] = argvs[argv] || "deflate, gzip";
        }
        break;

      default:
        break;
    }
  }
  if (!json.url) {
    throw new Error("无效的curl命令，url不能为空");
  }

  if (!json.method) {
    if (json.body) {
      json.method = "POST";
    } else {
      json.method = "GET";
    }
  }

  return json;
}

// 字符串转命令行
function stringToArgv(args, opts) {
  opts = opts || {};
  args = args || "";
  var arr = [];

  var current = null;
  var quoted = null;
  var quoteType = null;

  function addcurrent() {
    if (current) {
      // trim extra whitespace on the current arg
      arr.push(current.trim());
      current = null;
    }
  }

  // remove escaped newlines
  args = args.replace(/\\\n/g, "");

  for (var i = 0; i < args.length; i++) {
    var c = args.charAt(i);

    if (c == " ") {
      if (quoted) {
        quoted += c;
      } else {
        addcurrent();
      }
    } else if (c == "'" || c == '"') {
      if (quoted) {
        quoted += c;
        // only end this arg if the end quote is the same type as start quote
        if (quoteType === c) {
          // make sure the quote is not escaped
          if (quoted.charAt(quoted.length - 2) !== "\\") {
            arr.push(quoted);
            quoted = null;
            quoteType = null;
          }
        }
      } else {
        addcurrent();
        quoted = c;
        quoteType = c;
      }
    } else {
      if (quoted) {
        quoted += c;
      } else {
        if (current) {
          current += c;
        } else {
          current = c;
        }
      }
    }
  }

  addcurrent();

  if (opts.removequotes) {
    arr = arr.map(function (arg) {
      if (opts.removequotes === "always") {
        return arg.replace(/^["']|["']$/g, "");
      } else {
        if (arg.match(/\s/)) return arg;
        return arg.replace(/^"|"$/g, "");
      }
    });
  }

  return arr;
}

function parseArgv(args, opts) {
  if (!opts) {
    opts = {};
  }

  var flags = {
    bools: {},
    strings: {},
    unknownFn: null,
  };

  if (typeof opts.unknown === "function") {
    flags.unknownFn = opts.unknown;
  }

  if (typeof opts.boolean === "boolean" && opts.boolean) {
    flags.allBools = true;
  } else {
    []
      .concat(opts.boolean)
      .filter(Boolean)
      .forEach(function (key) {
        flags.bools[key] = true;
      });
  }

  var aliases = {};

  function aliasIsBoolean(key) {
    return aliases[key].some(function (x) {
      return flags.bools[x];
    });
  }

  Object.keys(opts.alias || {}).forEach(function (key) {
    aliases[key] = [].concat(opts.alias[key]);
    aliases[key].forEach(function (x) {
      aliases[x] = [key].concat(
        aliases[key].filter(function (y) {
          return x !== y;
        }),
      );
    });
  });

  []
    .concat(opts.string)
    .filter(Boolean)
    .forEach(function (key) {
      flags.strings[key] = true;
      if (aliases[key]) {
        [].concat(aliases[key]).forEach(function (k) {
          flags.strings[k] = true;
        });
      }
    });

  var defaults = opts.default || {};

  var argv = { _: [] };

  function argDefined(key, arg) {
    return (
      (flags.allBools && /^--[^=]+$/.test(arg)) ||
      flags.strings[key] ||
      flags.bools[key] ||
      aliases[key]
    );
  }

  function setKey(obj, keys, value) {
    var o = obj;
    for (var i = 0; i < keys.length - 1; i++) {
      var key = keys[i];
      if (isConstructorOrProto(o, key)) {
        return;
      }
      if (o[key] === undefined) {
        o[key] = {};
      }
      if (
        o[key] === Object.prototype ||
        o[key] === Number.prototype ||
        o[key] === String.prototype
      ) {
        o[key] = {};
      }
      if (o[key] === Array.prototype) {
        o[key] = [];
      }
      o = o[key];
    }

    var lastKey = keys[keys.length - 1];
    if (isConstructorOrProto(o, lastKey)) {
      return;
    }
    if (
      o === Object.prototype ||
      o === Number.prototype ||
      o === String.prototype
    ) {
      o = {};
    }
    if (o === Array.prototype) {
      o = [];
    }
    if (
      o[lastKey] === undefined ||
      flags.bools[lastKey] ||
      typeof o[lastKey] === "boolean"
    ) {
      o[lastKey] = value;
    } else if (Array.isArray(o[lastKey])) {
      o[lastKey].push(value);
    } else {
      o[lastKey] = [o[lastKey], value];
    }
  }

  function setArg(key, val, arg) {
    if (arg && flags.unknownFn && !argDefined(key, arg)) {
      if (flags.unknownFn(arg) === false) {
        return;
      }
    }

    var value = !flags.strings[key] && isNumber(val) ? Number(val) : val;
    setKey(argv, key.split("."), value);

    (aliases[key] || []).forEach(function (x) {
      setKey(argv, x.split("."), value);
    });
  }

  Object.keys(flags.bools).forEach(function (key) {
    setArg(key, defaults[key] === undefined ? false : defaults[key]);
  });

  var notFlags = [];

  if (args.indexOf("--") !== -1) {
    notFlags = args.slice(args.indexOf("--") + 1);
    args = args.slice(0, args.indexOf("--"));
  }

  for (var i = 0; i < args.length; i++) {
    var arg = args[i];
    var key;
    var next;

    if (/^--.+=/.test(arg)) {
      // Using [\s\S] instead of . because js doesn't support the
      // 'dotall' regex modifier. See:
      // http://stackoverflow.com/a/1068308/13216
      var m = arg.match(/^--([^=]+)=([\s\S]*)$/);
      key = m[1];
      var value = m[2];
      if (flags.bools[key]) {
        value = value !== "false";
      }
      setArg(key, value, arg);
    } else if (/^--no-.+/.test(arg)) {
      key = arg.match(/^--no-(.+)/)[1];
      setArg(key, false, arg);
    } else if (/^--.+/.test(arg)) {
      key = arg.match(/^--(.+)/)[1];
      next = args[i + 1];
      if (
        next !== undefined &&
        !/^(-|--)[^-]/.test(next) &&
        !flags.bools[key] &&
        !flags.allBools &&
        (aliases[key] ? !aliasIsBoolean(key) : true)
      ) {
        setArg(key, next, arg);
        i += 1;
      } else if (/^(true|false)$/.test(next)) {
        setArg(key, next === "true", arg);
        i += 1;
      } else {
        setArg(key, flags.strings[key] ? "" : true, arg);
      }
    } else if (/^-[^-]+/.test(arg)) {
      var letters = arg.slice(1, -1).split("");

      var broken = false;
      for (var j = 0; j < letters.length; j++) {
        next = arg.slice(j + 2);

        if (next === "-") {
          setArg(letters[j], next, arg);
          continue;
        }

        if (/[A-Za-z]/.test(letters[j]) && next[0] === "=") {
          setArg(letters[j], next.slice(1), arg);
          broken = true;
          break;
        }

        if (
          /[A-Za-z]/.test(letters[j]) &&
          /-?\d+(\.\d*)?(e-?\d+)?$/.test(next)
        ) {
          setArg(letters[j], next, arg);
          broken = true;
          break;
        }

        if (letters[j + 1] && letters[j + 1].match(/\W/)) {
          setArg(letters[j], arg.slice(j + 2), arg);
          broken = true;
          break;
        } else {
          setArg(letters[j], flags.strings[letters[j]] ? "" : true, arg);
        }
      }

      key = arg.slice(-1)[0];
      if (!broken && key !== "-") {
        if (
          args[i + 1] &&
          !/^(-|--)[^-]/.test(args[i + 1]) &&
          !flags.bools[key] &&
          (aliases[key] ? !aliasIsBoolean(key) : true)
        ) {
          setArg(key, args[i + 1], arg);
          i += 1;
        } else if (args[i + 1] && /^(true|false)$/.test(args[i + 1])) {
          setArg(key, args[i + 1] === "true", arg);
          i += 1;
        } else {
          setArg(key, flags.strings[key] ? "" : true, arg);
        }
      }
    } else {
      if (!flags.unknownFn || flags.unknownFn(arg) !== false) {
        argv._.push(flags.strings._ || !isNumber(arg) ? arg : Number(arg));
      }
      if (opts.stopEarly) {
        argv._.push.apply(argv._, args.slice(i + 1));
        break;
      }
    }
  }

  Object.keys(defaults).forEach(function (k) {
    if (!hasKey(argv, k.split("."))) {
      setKey(argv, k.split("."), defaults[k]);

      (aliases[k] || []).forEach(function (x) {
        setKey(argv, x.split("."), defaults[k]);
      });
    }
  });

  if (opts["--"]) {
    argv["--"] = notFlags.slice();
  } else {
    notFlags.forEach(function (k) {
      argv._.push(k);
    });
  }

  return argv;
}

// 生成 HTML
function getIndexHtml(data, _clientOffset) {
  let html = `<!DOCTYPE html>
    <html lang="zh">
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <link rel="shortcut icon" href="data:image/x-icon;," type="image/x-icon"> 
      <title>网页访问自动化</title>
      <style>
        body {
          font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
          padding: 20px;
          max-width: 1200px;
          margin: 0 auto;
          background: #f5f5f5;
        }

        @media (max-width: 768px) {
          body {
            padding: 10px;
          }
          .table {
            display: block;
            overflow-x: auto;
            -webkit-overflow-scrolling: touch;
            white-space: nowrap;
            max-width: 100%;
          }
          .w-md, .w-lg {
            min-width: 120px;
            max-width: 100%;
          }
          input[type="text"], textarea {
            overflow-x: auto !important;
            -webkit-overflow-scrolling: touch;
            scrollbar-width: none;
            -ms-overflow-style: none;
          }
          .td {
            white-space: normal;
            word-break: break-word;
          }
          input[type="text"]::-webkit-scrollbar,
          textarea::-webkit-scrollbar {
            display: none;
          }
          input[type="text"] {
            white-space: nowrap !important;  /* 表单输入框不许换行 */
          }
          textarea {
            white-space: pre-wrap !important;  /* 通知输入框允许内容换行 */
          }
        }

        .w-md, .w-lg {
          width: 100%;
          box-sizing: border-box;
        }

        .mr { margin-right: 1rem; }
        .mb { margin-bottom: 0.5rem; }

        .table {
          display: table;
          border-radius: 8px;
          overflow: hidden;
          box-shadow: 0 2px 4px rgba(0,0,0,0.1);
          background: white;
          width: 100%;
        }

        .tr {
          display: table-row;
          border: 1px solid #e5e7eb;
        }

        .td {
          display: table-cell;
          padding: 12px;
          border: 1px solid #e5e7eb;
          vertical-align: middle;
          white-space: nowrap;
        }

        /* 设置特定列的宽度 */
        .td:nth-child(1) { width: 40px; }
        .td:nth-child(2) { width: 100px; }
        .td:nth-child(3) { width: 360px; }
        .td:nth-child(4) { width: 250px; }
        .td:nth-child(5) { width: 120px; }
        .td:nth-child(6) { 
          max-width: 150px;
          white-space: normal;    /* 允许自动换行 */
        }

        input[type="text"], textarea {
          padding: 8px;
          border: 1px solid #e5e7eb;
          border-radius: 4px;
          width: 100%;
          box-sizing: border-box;
          height: 36px;
          font-size: 14px;
          white-space: nowrap;
          overflow-x: auto;
        }

        textarea {
          resize: none;
          line-height: 20px;
          display: block;
          overflow-y: auto;
          white-space: pre;
          min-height: 36px;
        }

        button, input[type="submit"] {
          background: #3b82f6;
          color: white;
          border: none;
          padding: 8px 16px;
          border-radius: 4px;
          cursor: pointer;
          transition: all 0.2s;
          font-size: 14px;
        }

        button:hover, input[type="submit"]:hover {
          background: #2563eb;
          transform: translateY(-1px);
        }

        button[formaction*="delete"] {
          background: #ef4444;
        }

        button[formaction*="delete"]:hover {
          background: #dc2626;
        }

        details summary {
          cursor: pointer;
          color: #4b5563;
          padding: 4px 0;
        }

        details p {
          margin: 8px 0;
          color: #666;
        }

        /* 通知区域样式 */
        .notification-section {
          margin-top: 20px;
          background: white;
          padding: 20px;
          border-radius: 8px;
          box-shadow: 0 2px 4px rgba(0,0,0,0.1);
        }

        .notification-section h3 {
          margin: 0 0 20px 0;
          color: #1f2937;
        }

        .notification-section textarea {
          width: 100%;
          height: auto;
          resize: vertical;
          min-height: 60px;
          margin-bottom: 10px;
        }

        /* Toast 提示样式 */
        .toast {
          position: fixed;
          top: 20px;
          left: 50%;
          transform: translateX(-50%);
          background: rgba(3, 206, 3, 0.65);
          color: white;
          padding: 10px 20px;
          border-radius: 4px;
          z-index: 1000;
          display: none;
          transition: opacity 0.3s;
        }

        @keyframes slideIn {
          from {
            transform: translateX(100%);
            opacity: 0;
          }
          to {
            transform: translateX(0);
            opacity: 1;
          }
        }
      </style>
    </head>
    <body>`;

  const taskKeys = Object.keys(data.tasks);
  // sort it
  taskKeys.sort((a, b) => {
    return b - a;
  });

  const tasksLists = taskKeys
    .map((key) => {
      const task = data.tasks[key];
      if (!task) {
        return "";
      }
      let { interval, url, logs, note } = task;
      if (!note) {
        note = "";
      }
      let logsHtml = "";
      if (logs && logs.length > 0) {
        const latestLog = encodeHTML(logToText(logs[0], _clientOffset));
        let moreLogsHtml = "";
        if (logs.length > 1) {
          moreLogsHtml = ``;
          for (let i = 1; i < logs.length; i++) {
            let logDetail = logToText(logs[i], _clientOffset);

            logDetail = encodeHTML(logDetail);
            moreLogsHtml += "<p>" + logDetail + "</p>";
          }
          moreLogsHtml += ``;
        }

        logsHtml = `<details><summary>${latestLog}</summary>${moreLogsHtml}</details>`;
      }
      let checked = true;
      if (task.enabled === false) {
        checked = false;
      }
      return `
      <form autocomplete="off" class="tr" method="POST">
      <span class="td">
        <input 
          name="enabled" 
          type="checkbox" 
          ${checked ? 'checked="checked"' : ""}
          autocomplete="false"
        >${key}
      </span>

      <span class="td">
        <input 
          type="submit" 
          formaction="/tasks/${key}/edit" 
          style="visibility: hidden; display: none;"
        >
        <input 
          class="w-md" 
          type="text" 
          autocomplete="off" 
          name="interval" 
          value="${interval}" 
          required 
          placeholder="*/5 * * *" 
        />
      </span>

      <span class="td">
        <textarea 
          rows="1" 
          class="w-lg" 
          name="url" 
          autocomplete="off" 
          rqeuired 
          placeholder="输入URL或Curl命令"
        >${url}</textarea>
      </span>    

      <span class="td">
        <input 
          class="mr mb" 
          type="submit" 
          formaction="/tasks/${key}/edit" 
          value="保存"
        >
        <button 
          formaction="/tasks/${key}/run" 
          class="mr mb"
        >运行</button>
        <button 
          formaction="/tasks/${key}/delete"
        >删除</button>
      </span>

      <span class="td">
        <input 
          class="w-md" 
          value="${note}" 
          autocomplete="off" 
          type="text" 
          name="note" 
          placeholder="添加备注" 
        />
      </span>

      <span class="td">
        ${logsHtml}
      </span>
    </form>`;
    })
    .join("");

  const body = `<main>
  <h2>网页访问自动化</h2>
  <p>Copyright © 2024 by <a href="https://www.24811213.xyz/">yutian81</a> (<a href="https://github.com/yutian81/serv00-ct8-ssh/tree/main/vercel-alive">Github</a>)</p>
    
    <div class="table">
      <div class="tr">
        <span class="td"><b>ID</b></span>
        <span class="td"><b>定时/分钟</b></span>
        <span class="td"><b>链接/命令</b></span>
        <span class="td"><b>操作</b></span>
        <span class="td"><b>备注</b></span>
        <span class="td"><b>日志</b></span>
      </div>
      
      <!-- 添加新任务表单 -->
      <form class="tr" autocomplete="off" method="POST">
        <span class="td">
          <input 
            type="hidden" 
            name="enabled" 
            value="on"
          >
        </span>

        <span class="td">
          <input 
            type="submit" 
            formaction="/tasks" 
            style="display:none"
          >
          <input 
            class="w-md" 
            type="text" 
            name="interval" 
            value="30" 
            required 
            placeholder="*/5 * * *"
          >
        </span>

        <span class="td">
          <textarea 
            rows="1" 
            class="w-lg" 
            name="url" 
            required 
            placeholder="输入URL或Curl命令"
          ></textarea>
        </span>

        <span class="td">
          <button formaction="/tasks">添加任务</button>
        </span>

        <span class="td">
          <input 
            class="w-md" 
            type="text" 
            name="note" 
            placeholder="添加备注"
          >
        </span>

        <span class="td"></span>
      </form>
      
      ${tasksLists}
    </div>

    <section class="notification-section">
      <h3>失败时通知</h3>
      <form id="notification-form" action="/notification" method="POST">
        <textarea
          rows="2"
          name="notification_curl"
          placeholder="输入Curl命令，{{message}} 为错误信息占位符"
        >${data.notification_curl || ""}</textarea>
      </form>
      <div class="mb">
        <input type="submit" form="notification-form" value="保存">
      </div>
    </section>
  </main>
  `;

  const script = `
    var clientOffset = getCookie("_clientOffset");
    var currentOffset = new Date().getTimezoneOffset() * -1;
    var reloadForCookieRefresh = false;

    if (clientOffset  == undefined || clientOffset == null || clientOffset != currentOffset) {
        setCookie("_clientOffset", currentOffset, 30);
        reloadForCookieRefresh = true;
    }

    if (reloadForCookieRefresh)
        window.location.reload();

    function setCookie(name, value, days) {
        var expires = "";
        if (days) {
            var date = new Date();
            date.setTime(date.getTime() + (days * 24 * 60 * 60 * 1000));
            expires = "; expires=" + date.toUTCString();
        }
        document.cookie = name + "=" + (value || "") + expires + "; path=/";
    }

    function getCookie(name) {
        var nameEQ = name + "=";
        var ca = document.cookie.split(';');
        for (var i = 0; i < ca.length; i++) {
            var c = ca[i];
            while (c.charAt(0) == ' ') c = c.substring(1, c.length);
            if (c.indexOf(nameEQ) == 0) return c.substring(nameEQ.length, c.length);
        }
        return null;
    }
    
    // Toast 提示
    function showToast(message) {
      const toast = document.createElement('div');
      toast.className = 'toast';
      toast.textContent = message;
      document.body.appendChild(toast);
      requestAnimationFrame(() => {
        toast.style.display = 'block';
      });
      setTimeout(() => {
        toast.style.display = 'none';
        toast.addEventListener('transitionend', () => toast.remove());
      }, 3000);
    }

    // 表单提交处理
    document.querySelectorAll('form').forEach(form => {
      form.onsubmit = (e) => {
        const submitButton = e.submitter; // 获取触发提交的按钮
        if(!submitButton) return true;       
        const action = submitButton.formAction || form.action;       
        // 删除操作需要确认
        if(action.includes('/delete')) {
          if(!confirm('确认要删除该任务吗?')) {
            e.preventDefault();
            return false;
          }
          return true;
        }       
        // 运行操作显示正在运行
        if(action.includes('/run')) {
          showToast('正在运行');
          return true;
        }       
        // 添加新任务
        if(action.includes('/tasks') && !action.includes('/edit')) {
          showToast('任务已添加');
        }
        // 保存任务或通知设置
        else if(action.includes('/edit') || action.includes('/notification')) {
          showToast('保存成功');
        }
      }
    });
  `;

  return html + body + `<script>${script}</script></body></html>`;
}

function logToText(log, _clientOffset) {
  let { ok, run_at, message } = log;
  message = message || "";

  return `${ok ? "✅" : "❌"} ${timeToText(
    new Date(run_at),
    _clientOffset
  )} ${message}`;
}

function timeToText(time, clientOffset) {
  const now = new Date();
  const diff = now.getTime() - time.getTime();
  const diffInMinutes = Math.floor(diff / 1000 / 60);
  if (diffInMinutes < 1) {
    const seconds = Math.floor(diff / 1000);
    return `${seconds} 秒前`;
  }
  const diffInHours = Math.floor(diffInMinutes / 60);

  const clientTimezoneDateTime = time.getTime() + clientOffset * 60 * 1000;
  const clientDate = new Date(clientTimezoneDateTime);

  if (diffInHours < 24) {
    const hour = clientDate.getUTCHours();
    const minutes = clientDate.getUTCMinutes();
    return `${addZero(hour)}:${addZero(minutes)}`;
  }
  const diffInDays = Math.floor(diffInHours / 24);
  if (diffInDays < 7) {
    return `${diffInDays} 天前`;
  }
}

// 数据处理——获取收据
async function getData(env) {
  if (!env.CRONBIN) { throw createError.kvNotFound(); }
  const value = await env.CRONBIN.get("data");
  if (value === null) {
    return {
      tasks: {},
    };
  }
  return JSON.parse(value);
}

// 数据处理——保存数据
async function setData(env, data) {
  await env.CRONBIN.put("data", JSON.stringify(data, null, 2));
}

async function handleRequest(request, env) {
  if (!env.CRONBIN) { throw createError.kvNotFound(); }
  // 首先检查请求是否被授权
  const { headers } = request;
  const urlObj = new URL(request.url);
  const { pathname } = urlObj;
  const authorization = headers.get("Authorization");
  const headerAuthorizationValue = `Bearer ${APIKEY}`;

  if (authorization) {
    if (authorization !== headerAuthorizationValue) { throw createError.unauthorized(); }
  } else if (urlObj.searchParams.has("key")) {
    const keyFromQuery = urlObj.searchParams.get("key");
    if (keyFromQuery !== APIKEY) { throw createError.unauthorized(); }
  } else {
    const cookie = headers.get("cookie");
    const apiKey = getCookieValue(cookie, "key");
    if (apiKey !== APIKEY) { throw createError.unauthorized(); }
  }

  if (pathname === "/") {
    const data = await getData(env);
    const cookie = headers.get("cookie");
    let clientOffset = getCookieValue(cookie, "_clientOffset");
    if (!clientOffset) {
      clientOffset = 0;
    }
    clientOffset = Number(clientOffset);

    const body = getIndexHtml(data, clientOffset);
    const responseHeaders = {
      "Content-Type": ["text/html"],
    };

    // send cookie if changed
    const apiKey = getCookieValue(cookie, "key");
    const domain = request.headers.get("host")?.split(":")[0];
    if (apiKey !== APIKEY) {
      responseHeaders["set-cookie"] = [
        `key=${APIKEY}; HttpOnly; Max-Age=9999999999999999999999999999; Domain=${domain}; Path=/;`,
      ];
    }
    return [body, responseHeaders];
  } else if (pathname.startsWith("/tasks")) {
    const data = await getData(env);
    if (pathname === "/tasks") {
      const formData = await request.formData();
      const interval = formData.get("interval");
      const url = formData.get("url");

      if (!interval) { throw createError.intervalRequired(); }     
      if (!isValidInterval(interval)) { throw createError.invalidInterval(); }      
      if (!url) { throw createError.urlRequired(); }
      if (!isValidUrl(url)) { throw createError.invalidUrl(); }

      let note = formData.get("note") || "";
      if (note) { note = note.slice(0, 150); }

      const { tasks } = data;
      const taskKeys = Object.keys(tasks);
      const sortedTaskKeys = taskKeys.sort((a, b) => {
        return tasks[a] - tasks[b];
      });

      const largestTaskKey = sortedTaskKeys[sortedTaskKeys.length - 1];
      const nextTaskKey = largestTaskKey ? Number(largestTaskKey) + 1 : 1;
      data.tasks[nextTaskKey] = {
        interval,
        url,
        note,
        fetch_options: urlToFetchOptions(url),
      };
      await setData(env, data);
      return ["/", "redirect"];
    }

    const taskRunPattern = new URLPattern({
      pathname: "/tasks/:id/run",
      baseURL: urlObj.origin,
    });

    const match = taskRunPattern.exec(request.url);
    if (
      match &&
      match.pathname &&
      match.pathname.groups &&
      match.pathname.groups.id
    ) {
      const { id } = match.pathname.groups;
      const task = data.tasks[id];
      if (!task) { throw createError.taskNotFound(); }

      const formData = await request.formData();
      const interval = formData.get("interval");
      const url = formData.get("url");
      if (!interval) { throw createError.intervalRequired(); }
      if (!isValidInterval(interval)) { throw createError.invalidInterval(); }
      if (!url) { throw createError.urlRequired(); }
      if (!isValidUrl(url)) { throw createError.invalidUrl(); }
      let note = formData.get("note") || "";
      if (note) { note = note.slice(0, 150); }
      if (
        !(
          data.tasks[id].interval === interval &&
          data.tasks[id].url === url &&
          data.tasks[id].note === note
        )
      ) {
        // find the largest task key
        data.tasks[id] = {
          ...task,
          interval,
          url,
          note,
          fetch_options: urlToFetchOptions(url),
        };
        await setData(env, data);
      }

      await runTasks([id], data, env);
      return ["/", "redirect"];
    } else {
      const taskEditPattern = new URLPattern({
        pathname: "/tasks/:id/edit",
        baseURL: urlObj.origin,
      });
      const editMatch = taskEditPattern.exec(request.url);
      if (
        editMatch &&
        editMatch.pathname &&
        editMatch.pathname.groups &&
        editMatch.pathname.groups.id
      ) {
        const { id } = editMatch.pathname.groups;
        const task = data.tasks[id];
        if (!task) { throw createError.taskNotFound(); }

        const formData = await request.formData();
        const interval = formData.get("interval");
        const url = formData.get("url");
        const enabled = formData.get("enabled");
        if (!interval) { throw createError.intervalRequired(); }
        if (!isValidInterval(interval)) { throw createError.invalidInterval(); }
        if (!url) { throw createError.urlRequired(); }
        if (!isValidUrl(url)) { throw createError.invalidUrl(); }
        let note = formData.get("note") || "";
        if (note) { note = note.slice(0, 150); }

        data.tasks[id] = {
          ...task,
          interval,
          url,
          note,
          fetch_options: urlToFetchOptions(url),
          enabled: enabled === "on" ? true : false,
        };
        await setData(env, data);
        return ["/", "redirect"];
      }

      const taskDeletePattern = new URLPattern({
        pathname: "/tasks/:id/delete",
        baseURL: urlObj.origin,
      });
      const taskDeletePatternMatch = taskDeletePattern.exec(request.url);
      if (
        taskDeletePatternMatch &&
        taskDeletePatternMatch.pathname &&
        taskDeletePatternMatch.pathname.groups &&
        taskDeletePatternMatch.pathname.groups.id
      ) {
        const { id } = taskDeletePatternMatch.pathname.groups;
        const task = data.tasks[id];
        if (!task) { throw createError.taskNotFound(); }
        delete data.tasks[id];
        await setData(env, data);
        return ["/", "redirect"];
      }
      throw createError.taskRouteNotFound();
    }
  } else if (pathname === "/notification") {
    const data = await getData(env);
    const formData = await request.formData();
    const notification_curl = formData.get("notification_curl") || "";
    if (notification_curl && !isValidUrl(notification_curl)) { throw createError.invalidNotification(); }
    data.notification_curl = notification_curl;
    if (notification_curl) {
      data.notification_fetch_options = urlToFetchOptions(notification_curl);
    } else {
      delete data.notification_fetch_options;
    }

    await setData(env, data);
    return ["/", "redirect"];
  } else if (pathname === "/api/data") {
    if (request.method === "POST") {
      let json = "";
      try { json = JSON.stringify(await request.json()); } 
      catch (e) { throw createError.jsonParseError(); }
      await setData(env, json);
      return ['{"ok":true}'];
    } else {
      const data = await getData(env);
      return [JSON.stringify(data, null, 2)];
    }
  }
  throw createError.notFound();
}

export async function checkAndRunTasks(env) {
  const now = new Date();
  const data = await getData(env);
  const taksIds = getCurrentTaskIds(now.toISOString(), data);
  if (!taksIds || taksIds.length === 0) {
    return;
  }
  await runTasks(taksIds, data, env);
}

export async function runTasks(taksIds, data, env) {
  const fetchOptionsArr = [];
  for (const taskId of taksIds) {
    const task = data.tasks[taskId];
    if (!task) {
      continue;
    }
    const { fetch_options } = task;
    if (fetch_options) {
      fetchOptionsArr.push(fetch_options);
    }
  }
  const notification_fetch_options = data.notification_fetch_options;

  const results = await Promise.allSettled(
    fetchOptionsArr.map(async (options) => {
      const res = await fetch(options.url, options);
      const body = await res.text();
      if (res.ok) {
        return body;
      } else {
        throw new Error(`❌ 请求失败 —— \n【状态码】${res.status} \n【状态信息】${res.statusText || '访问失败'} \n【详细信息】${body}`);
      }
    })
  );
  const now = new Date();
  let globalError = null;
  for (let i = 0; i < results.length; i++) {
    const result = results[i];
    const taskId = taksIds[i];
    if (!data.tasks[taskId].logs) {
      data.tasks[taskId].logs = [];
    }
    // check logs is too long, if so, remove the last one
    if (data.tasks[taskId].logs.length >= 10) {
      data.tasks[taskId].logs.pop();
    }
    if (result.status === "fulfilled") {
      data.tasks[taskId].logs.unshift({
        run_at: now.toISOString(),
        ok: true,
      });
    } else {
      const { reason } = result;
      let failedMessage = reason.message || "unknownError";
      failedMessage = failedMessage.slice(0, 150);

      globalError = globalError || failedMessage;
      console.warn("task failed", reason);
      data.tasks[taskId].logs.unshift({
        run_at: now.toISOString(),
        ok: false,
        message: failedMessage,
      });
    }
  }

  // if data is changed, update it
  await setData(env, data);
  if (globalError && notification_fetch_options) {
    let { url, method, headers, body } = notification_fetch_options;
    const finalHeaders = {
      "User-Agent":
        "Mozilla/5.0 (Macintosh; Intel Mac OS X 10.15; rv:109.0) Gecko/20100101 Firefox/110.0",
      ...headers,
    };
    // replace \n  for json

    let finalGlobalMessage = globalError
      .replace(/\n/g, "\\n")
      .replace(/"/g, '\\"');
    finalGlobalMessage = finalGlobalMessage + " -- cronbin";
    const finalBody = body.replace(/{{message}}/g, finalGlobalMessage);
    if (url.includes("{{message}}")) {
      url = url.replace(/{{message}}/g, encodeURIComponent(finalGlobalMessage));
    }

    const res = await fetch(url, {
      method,
      headers: finalHeaders,
      body: finalBody,
    });
    await res.text();
    if (!res.ok) {
      const notificationError = new Error(
        `通知发送失败: 状态码 ${res.status}: ${
          res.statusText
        }, ${await res.text()}`
      );
      console.warn("通知错误", notificationError);
    }
  }
}

export function urlToFetchOptions(url) {
  let finalUrl = "";
  const finalOptions = {};
  // check url is valid url or curl
  try {
    new URL(url);
    finalUrl = url;
  } catch (_e) {
    // not valid url, try to parse it as curl
    const curlOptions = parseCurl(url);
    finalUrl = curlOptions.url;
    if (curlOptions.method) {
      finalOptions.method = curlOptions.method;
    }

    if (curlOptions.headers) {
      finalOptions.headers = curlOptions.headers;
    }
    if (curlOptions.body) {
      finalOptions.body = curlOptions.body;
    }
  }
  if (!finalOptions.headers) {
    finalOptions.headers = {};
  }
  if (!finalOptions.headers["User-Agent"]) {
    finalOptions.headers["User-Agent"] =
      "Mozilla/5.0 (Macintosh; Intel Mac OS X 10.15; rv:109.0) Gecko/20100101 Firefox/110.0";
  }
  finalOptions.url = finalUrl;
  return finalOptions;
}

export function getCurrentTaskIds(now, data) {
  if (!data || !data.tasks) {
    return;
  }
  const nowDate = new Date(now);
  const { tasks } = data;
  const taskKeys = Object.keys(tasks);
  const finalTasks = [];
  for (const key of taskKeys) {
    const task = tasks[key];
    if (!task) {
      continue;
    }
    let lastRunAt = new Date(0);
    let { interval, logs } = task;

    if (logs && logs.length > 0) {
      lastRunAt = new Date(logs[0].run_at);
    }

    const diff = nowDate.getTime() - lastRunAt.getTime();

    const num = Number(interval);

    if (!isNaN(num)) {
      if (num >= 1) {
        if (diff >= interval * 60 * 1000) {
          finalTasks.push(key);
        }
      } else {
        throw new Error("时间间隔必须大于1");
      }
    } else {
      const cron = cronSchedule.parseCronExpression(interval);
      const prevDate = cron.getPrevDate(nowDate);
      if (prevDate.getTime() > lastRunAt.getTime()) {
        finalTasks.push(key);
      }
    }
  }
  return finalTasks;
}

// https://github.com/minimistjs/minimist/blob/main/index.js
function hasKey(obj, keys) {
  var o = obj;
  keys.slice(0, -1).forEach(function (key) {
    o = o[key] || {};
  });

  var key = keys[keys.length - 1];
  return key in o;
}

function isNumber(x) {
  if (typeof x === "number") {
    return true;
  }
  if (/^0x[0-9a-f]+$/i.test(x)) {
    return true;
  }
  return /^[-+]?(?:\d+(?:\.\d*)?|\.\d+)(e[-+]?\d+)?$/.test(x);
}

function isConstructorOrProto(obj, key) {
  return (
    (key === "constructor" && typeof obj[key] === "function") ||
    key === "__proto__"
  );
}
