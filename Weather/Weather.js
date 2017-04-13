//
//

var Weather = Weather || (function () {

  class InstallObj {
    constructor() {
      this.code = null,
      this.needed = true,
      this.temp = null,
      this.biome = null,
      this.season = null,
      this.temperature = null,
      this.stage = () => this.stageList[this.stageIndex];
      this.stageIndex = 0;
      this.stageList = ['biome', 'season', 'temperature', false];
      this.next = () => { if (this.stageIndex < 3) { this.stageIndex += 1; } return this.stage(); };
    }
  }
  class StateDataObj {
    constructor() {
      this.array = [];
      this.clear = () => { this.array = []; };
      this.get = () => this.array.slice(0);
      this.last = () => this.array.slice(-1);
      this.length = () => this.array.length;
      this.filter = callback => this.array.filter(callback);
      this.push = (value) => { this.array.push(value); };
    }
  }

  class WeatherEffect {
    constructor(name, temp, wind, humid, precip) {
      this.name = name;
      this.stats = {
        temperature: temp || 0,
        windSpeed: wind || 0,
        humidity: humid || 0,
        precipitation: precip || 0,
      };
    }
  }

  class WeatherObj {
    constructor(statistics, daysSinceSeed, date) {
      this.time = typeof date === 'number' ? date : new Date().getTime();
      this.day = daysSinceSeed || Math.floor((new Date().getTime() - state.Weather.timeSeed) / secondsPerDay);
      this.stats = {
        temperature: statistics.temperature || 0,
        windSpeed: statistics.windSpeed || 0,
        humidity: statistics.humidity || 0,
        precipitation: statistics.precipitation || 0,
      };
      this.verify = function () {
        for (const value in this.stats) {
          if (parseFloat(value) !== value) return false;
        }
        return true;
      };
      this.description = function () {
        const majorCondition = getClosest('precipitation', this.stats);
        const minorCondition = getClosest('clouds', this.stats);
        const phenomena = getClosest('phenomena', this.stats, effectSearchRange);
        const humidity = this.stats.windSpeed < 5 ? 'very light' : this.state.windSpeed < 15 ? 'light' : this.stats.windSpeed < 30 ? 'moderate' : 'heavy';
        const temperature = this.stats.windSpeed < 5 ? 'very light' : this.state.windSpeed < 15 ? 'light' : this.stats.windSpeed < 30 ? 'moderate' : 'heavy';
        const windSpeed = this.stats.windSpeed < 5 ? 'very light' : this.state.windSpeed < 15 ? 'light' : this.stats.windSpeed < 30 ? 'moderate' : 'heavy';
        return `The air is filled with ${majorCondition}, and the sky is ${minorCondition}. The air is ${humidity} and ${temperature}, and the wind is ${windSpeed}.${phenomena ? ` Because of current conditions, a ${phenomena} is likely.` : ''}`;
      }
      this.print = function () {
        sendChat('', `/desc ${this.description()}`)
      };
      this.log = function () {
        log(`Weather -- ${this.description()}`)
      };
    }
  }

  const version = '1.0';
  const lastUpdate = 0;
  const defaultState = {
    data: new StateDataObj(),
    lastupdated: 0,
    gmOnly: false,
    install: new InstallObj(),
    timeSeed: null,
    seasonSeed: null,
    temperatureSeed: null,
    paused: false,
    autoAdvance: true,
    timeScale: 7,
    seasonDuration: 92,
    trendScale: 1,
    biome: null,
  };

  const secondsPerDay = 86400 / (state.Weather && state.Weather.timeScale ? state.Weather.timeScale : 1);
  const effectSearchRange = 100 * (state.Weather && state.Weather.trendScale ? state.Weather.trendScale : 1);

  const BIOME_LIST = [new WeatherEffect('Metropolis', 10, 5, 10, 10)];
  const SEASON_LIST = [{ name: 'spring', id: 1 }, { name: 'summer', id: 2 }, { name: 'fall', id: 3 }, { name: 'winter', id: 4 }];
  const WEATHER_DESCRIPTIONS = [new WeatherEffect('Rain', 25, 20, 100, 100), new WeatherEffect('Snow', -10, 20, 50, 100), new WeatherEffect('Fog', 10, 0, 100, 50), new WeatherEffect('Dust', 30, 20, 0, 0), new WeatherEffect('Haze', 40, 0, 50, 0)];
  const CLOUD_DESCRIPTIONS = [new WeatherEffect('Overcast', 0, 15, 75, 75), new WeatherEffect('Clear', 0, 20, 0, 0), new WeatherEffect('Partly Cloudy', 0, 20, 25, 25), new WeatherEffect('Mostly Cloudy', 0, 15, 35, 35)];
  const PHENOMENA = [new WeatherEffect('Thunderstorms', 20, 50, 100, 100), new WeatherEffect('Tornados', 40, 60, 100, 50), new WeatherEffect('Hail', 0, 50, 33, 100)];

  const checkInstall = function () {
    log(`-- Weather v${version} -- [${new Date(lastUpdate * 1000)}]`);
    if (!state.Weather || (state.Weather.install && state.Weather.install.needed)) {
      log('Weather -- Thank you for installing Weather! Please see the chat log to set up the script to your environment.');
      resetState();
      runInstall('start');
    } else {
      checkGlobalConfig();
      getUpdatedWeather().print();
    }
  };

  const checkGlobalConfig = function () {
    const g = globalconfig.weather;
    if (g && g.lastsaved && g.lastsaved > state.Weather.lastupdated) {
      state.Weather.lastupdated = g.lastsaved;
      state.Weather.timeScale = Math.max(parseInt(g['Rate of Passing Time'], 10), 1);
      state.Weather.seasonDuration = Math.max(parseInt(g['In-game Days Per Season'], 10), 0);
      state.Weather.trendScale = Math.max((parseInt(g['Trend Scale Percentage'], 10) / 100), 0);
      state.Weather.autoAdvance = g['Automatic Time Advancement'] === 'true';
      state.Weather.gmOnly = g['GM Only'] === 'true';
    }
  };

  const changeTime = function (args) {
    if (parseInt(args, 10) >= 1) {
      createCurrentWeather(args);
    }
  };

  // Creates a new weather object and pushes it to state.
  const createCurrentWeather = function (days) {
    const previous = state.Weather.data.last()
    const realDaysSinceLast = getTimeElapsed(previous.time, new Date().getTime())
    const daysSinceLast = parseInt(days, 10) || realDaysSinceLast;
    const seasonDay = daysSinceLast + previous.day;
    const trends = {
      temperature: getSeasonTrend('temperature', seasonDay),
      windSpeed: getChange(0, state.Weather.biome.stats.windSpeed * state.Weather.trendScale, daysSinceLast),
      humidity: getChange(0, state.Weather.biome.stats.windSpeed * state.Weather.trendScale, daysSinceLast),
      precipitation: getChange(0, state.Weather.biome.stats.windSpeed * state.Weather.trendScale, daysSinceLast),
    };
    const newStats = {
      temperature: getChange(previous.stats.temperature + trends.temperature, state.Weather.biome.stats.temperature * state.Weather.trendScale, daysSinceLast),
      windSpeed: Math.max(getChange(5 + trends.windSpeed, state.Weather.biome.stats.windSpeed * state.Weather.trendScale, daysSinceLast), 0),
      humidity: Math.min(Math.max(getChange(previous.stats.humidity + trends.humidity, state.Weather.biome.stats.humidity * state.Weather.trendScale, daysSinceLast), 0), 100),
      precipitation: Math.min(Math.max(getChange(previous.stats.precipitation + trends.precipitation, state.Weather.biome.stats.precipitation * state.Weather.trendScale, daysSinceLast), 0), 100),
    };
    const currentWeather = new WeatherObj(newStats, seasonDay)
    if (currentWeather.verify()) state.Weather.data.push(currentWeather);
  };

  // Returns a new value depending on the amount of iterations, trends and original
  const getChange = function (original, trend, iteration) {
    const current = original;
    let count = iteration || 1;
    const iterator = (value) => {
      if (count > 0) {
        count -= 1;
        const newValue = normalInverse(Math.random(), value, trend);
        return iterator(newValue);
      }
      return value;
    };
    return iterator(current);
  };

// Returns the closest object to the given array
  const getClosest = function (type, toCompare, range) {
    const searchArray = type === 'phenomena' ? PHENOMENA : type === 'precipitation' ? WEATHER_DESCRIPTIONS : type === 'clouds' ? CLOUD_DESCRIPTIONS : [];
    if (!searchArray.length) return undefined;
    const closestArray = _.chain(searchArray)
                          .map(effect => ({
                            name: effect.name,
                            distance: ['temperature', 'windSpeed', 'humidity', 'precipitation'].reduce((memo, name) => Math.abs(effect.stats[name] - toCompare[name]), 0),
                          }))
                          .sortBy(effect => effect.distance)
                          .first()
                          .value();
    if (!range || closestArray.distance < range) return closestArray.name;
    return undefined;
  };

  const getCurrentWeather = function () {
    if (state.Weather.data.array.length) return state.Weather.data.last();
    return undefined;
  };

  const getRandomString = function (length) {
    return Math.round((36 ** (length + 1)) - (Math.random() * (36 ** (length + 1)))).toString(36).slice(1);
  };

  const getSeasonTrend = function (name, days) {
    const biomeStat = state.Weather.biome.stats[name];
    const time = (days / state.Weather.seasonDuration) * Math.PI;
    const seedShift = (state.Weather.seasonSeed * (Math.PI / 4)) + (Math.PI / 8);
    return biomeStat * Math.cos(time + seedShift);
  };

  const getTimeElapsed = function (originalTime, newTime) {
    return Math.floor((originalTime - newTime) / secondsPerDay);
  };

  const getUpdatedWeather = function () {
    if (!state.Weather.data.array.length) return undefined;
    const days = getTimeElapsed(state.Weather.data.last().time, new Date().getTime());
    if (days >= 1) return createCurrentWeather(days);
    if (state.Weather.data.length) return state.Weather.data.last();
  };

  const handleChatInput = function (msg) {
    if (msg.type !== 'api' || (state.Weather.gmOnly && !playerIsGM(msg.playerid))) return;
    const args = msg.content.split(/\s/);
    const target = msg.who.replace(/( \(GM\)$)/g, '');
    if (args[0].toLowerCase() === '!weather') {
      switch (args[1]) {
        case state.Weather.install.code: {
          if (!playerIsGM(msg.playerid)) return;
          runInstall(args.slice(2))
          break;
        }
        case 'advance': {
          if (!playerIsGM(msg.playerid)) return;
          changeTime(args[2])
          break;
        }
        case 'clear': {
          if (!playerIsGM(msg.playerid)) return;
          printToChat(target, 'Clearing weather history!');
          state.Weather.data.clear();
          break;
        }
        case 'debug': {
          log(s);
          break;
        }
        case 'decline': {
          if (!playerIsGM(msg.playerid)) return;
          state.Weather.install.code = null;
          printToChat(target, 'Action declined.')
          break;
        }
        case 'help': {
          showHelp(target);
          break;
        }
        case 'reinstall': {
          if (!playerIsGM(msg.playerid)) return;
          const secureString = getRandomString(32)
          state.Weather.install.code = secureString;
          printToChat(target, `Are you sure you want to reset all information? <br>[Yes](!weather ${secureString} start) [No](!weather decline)`)
          break;
        }
        case 'update': {
          if (!playerIsGM(msg.playerid)) return;
          getUpdatedWeather().print()
          break;
        }
        default: {
          if (args[1] && args[1].length === 32) return;
          if (state.Weather.install.needed) {
            printToChat(target, `Weather hasn't been fully installed yet. ${playerIsGM(msg.playerid) ? `Click this button to [Continue](!weather ${state.Weather.install.code} continue) the process.` : 'Message your GM to let them know!'}`)
          } else {
            if (state.Weather.data.array.length) printToChat(target, getCurrentWeather().description());
          }
        }
      }
    }
  };

  const normalInverse = function (percentile, mean, deviation) {
  // Taken from: https://gist.github.com/kmpm/1211922/
    if (![percentile, mean, deviation].every(arg => parseFloat(arg) === arg)) {
      throw new Error('An input is not a number');
    } else if (deviation < 0 || mean < 0 || percentile < 0) {
      throw new Error('Negative inputs not allowed');
    } else if (percentile >= 1 || percentile <= 0) {
      return percentile > 0 ? Infinity : -Infinity;
    } else if (deviation === 0 || percentile === 0.5) {
      return mean;
    }
    const q = percentile - 0.5;
    if (Math.abs(q) <= 0.425) {
      const r = 0.180625 - q * q;
      return mean + deviation * q *
        (((((((r * 2509.0809287301226727 + 33430.575583588128105) *
        r + 67265.770927008700853) * r + 45921.953931549871457) *
        r + 13731.693765509461125) * r + 1971.5909503065514427) *
        r + 133.14166789178437745) * r + 3.387132872796366608) /
        (((((((r * 5226.495278852854561 + 28729.085735721942674) *
        r + 39307.89580009271061) * r + 21213.794301586595867) *
        r + 5394.1960214247511077) * r + 687.1870074920579083) *
        r + 42.313330701600911252) * r + 1);
    }
    let r = q < 0 ? percentile : 1 - percentile;
    r = Math.sqrt(-Math.log(r));
    if (r <= 5) {
      r -= 1.6;
      return mean + deviation * (q < 0.0 ? -1 : 1) *
        (((((((r * 7.7454501427834140764e-4 + 0.0227238449892691845833) *
        r + 0.24178072517745061177) * r + 1.27045825245236838258) *
        r + 3.64784832476320460504) * r + 5.7694972214606914055) *
        r + 4.6303378461565452959) * r + 1.42343711074968357734) /
        (((((((r * 1.05075007164441684324e-9 + 5.475938084995344946e-4) *
        r + 0.0151986665636164571966) * r + 0.14810397642748007459) *
        r + 0.68976733498510000455) * r + 1.6763848301838038494) *
        r + 2.05319162663775882187) * r + 1);
    }
    r -= 5;
    return mean + deviation * (q < 0.0 ? -1 : 1) *
      (((((((r * 2.01033439929228813265e-7 + 2.71155556874348757815e-5) *
      r + 0.0012426609473880784386) * r + 0.026532189526576123093) *
      r + 0.29656057182850489123) * r + 1.7848265399172913358) *
      r + 5.4637849111641143699) * r + 6.6579046435011037772) /
      (((((((r * 2.04426310338993978564e-15 + 1.4215117583164458887e-7) *
      r + 1.8463183175100546818e-5) * r + 7.868691311456132591e-4) *
      r + 0.0148753612908506148525) * r + 0.13692988092273580531) *
      r + 0.59983220655588793769) * r + 1);
  };

  const resetState = function () {
    state.Weather = _.clone(defaultState);
    state.Weather.timeSeed = new Date().getTime();
  };

/* This needs to be refactored so badly. Using a variable in state, determine what I'm trying to do with the arg pushed into runInstall
 *
 * if (args === true && temp), push temp to stage state variable and ask next question.
 * else switch(install_stage), case 'stage' If (arg is valid in stage), store in temp state and ask if that was correct. Else if (arg === continue) ask the question again.
 *
 */

  const runInstall = function (args) {
    const secureString = getRandomString(32);
    const biomeQuestion = _.reduce(BIOME_LIST, (memo, biome) => { memo += `[${biome.name}](!weather ${secureString} ${biome.name})`; return memo; }, 'Please select one of the following biomes to describe where your players are:<br>');
    const seasonQuestion = _.reduce(SEASON_LIST, (memo, season) => { memo += `[${season.name}](!weather ${secureString} ${season.name})`; return memo; }, 'Please select the current season your players are experiencing:<br>')
    const temperatureQuestion = `Please click this button and enter the current temperature your players are experiencing in the window that appears.<br>[Temperature](!weather ${secureString} ?{Please enter a temperature in Celsius.|0})`;
    const confirmationStatement = `You said that the ${state.Weather.install.stage()} is ${args[0]}. Is that what you wanted?<br>[Yes](!weather ${secureString} true)[No](!weather ${secureString} false)`;
    const finishedStatement = 'Congratulations! The installation of Weather is complete. Get your first weather description with the command<br><span style="color:#777777">!weather</span><br>If you\'ve made a mistake somewhere, you can fix it with the command<br><span style="color:#777777">!weather set [temperature|humidity|windSpeed|precipitation]:15</span>, replacing the 15 with your own value. If you need more help, just use <span style="color:#777777">"!weather help"</span> to see the help menu.';
    if (state.Weather.install.temp) {
      if (args === 'true') {
        let stage = state.Weather.install.stage();
        state.Weather.install[stage] = state.Weather.install.temp;
        stage = state.Weather.install.next();
        if (stage) {
          const message = stage === 'biome' ? biomeQuestion : stage === 'season' ? seasonQuestion : temperatureQuestion;
          printToChat('gm', message);
        } else {
          state.Weather.biome = _.find(BIOME_LIST)
          state.Weather.seasonSeed = state.Weather.install.season
          return;
        }
      } else if (args === 'false') {
        state.Weather.install.temp = null;
      }
    } else {
      switch (state.Weather.install.stage()) {
        case 'biome': {
          if (_.find(BIOME_LIST, item => item.name === args[0])) {
            state.Weather.install.temp = _.find(BIOME_LIST, item => item.name === args[0]);
            printToChat('gm', confirmationStatement);
          } else {
            printToChat('gm', biomeQuestion);
          }
          break;
        }
        case 'season': {
          if (_.find(SEASON_LIST, item => item.name === args[0])) {
            state.Weather.install.temp = _.find(SEASON_LIST, item => item.name === args[0]);
            printToChat('gm', confirmationStatement);
          } else {
            printToChat('gm', seasonQuestion);
          }
          break;
        }
        case 'temperature': {
          if (parseFloat(args[0]).toString() === args[0]) {
            state.Weather.install.temp = args[0];
            printToChat('gm', confirmationStatement);
          } else {
            printToChat('gm', temperatureQuestion);
          }
          break;
        }
        default: {
          printToChat('gm', finishedStatement);
        }
      }
    }
    state.Weather.install.code = secureString;
  };

  const printToChat = function (target, content, callback) {
    sendChat('Weather', `/w ${target} <br>${content}`, callback, { noarchive: true });
  };

  const showHelp = function (target) {
    const help = '' +
                 '';
    printToChat(target, help);
  };

  const registerEventHandlers = function () {
    on('chat:message', handleChatInput);
  };

  return {
    CheckInstall: checkInstall,
    RegisterEventHandlers: registerEventHandlers,
    Get: getCurrentWeather,
    GetUpdate: getUpdatedWeather,
    NormSInv: normalInverse,
  };
}());

on('ready', () => {
  "use strict";

  Weather.CheckInstall();
  Weather.RegisterEventHandlers();
});
