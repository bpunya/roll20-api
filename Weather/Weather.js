// Github: https://github.com/bpunya/roll20-api/blob/master/Weather/1.0/Weather.js
// Author: PaprikaCC (Bodin Punyaprateep)

var Weather = Weather || (function () {
  const version = '1.0';
  const lastUpdate = 0;
  const EFFECT_SEARCH_RANGE = 100;
  const SECONDS_PER_DAY = 86400 / (state.Weather && state.Weather.timeScale ? state.Weather.timeScale : 7);

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

  const SEASON_LIST = [{ name: 'spring', id: 1 }, { name: 'summer', id: 2 }, { name: 'fall', id: 3 }, { name: 'winter', id: 4 }];
  const BIOME_LIST = [new WeatherEffect('Metropolis', 10, 5, 10, 10)];
  const WEATHER_LIST = [new WeatherEffect('rain', 25, 20, 100, 100), new WeatherEffect('snow', -10, 20, 50, 100), new WeatherEffect('fog', 10, 0, 100, 50), new WeatherEffect('dust', 20, 15, 0, 0), new WeatherEffect('haze', 35, 0, 50, 0), new WeatherEffect('a gentle breeze', 10, 5, 5, 5), new WeatherEffect('a bitter chill', -30, 30, 0, 0), new WeatherEffect('a sweltering heat', 50, 0, 0, 0)];
  const CLOUD_LIST = [new WeatherEffect('Overcast', 0, 15, 75, 75), new WeatherEffect('Clear', 0, 20, 0, 0), new WeatherEffect('Partly Cloudy', 0, 20, 25, 25), new WeatherEffect('Mostly Cloudy', 0, 15, 35, 35), new WeatherEffect('still', 0, 0, 0, 0)];
  const PHENOMENA_LIST = [new WeatherEffect('Thunderstorms', 20, 50, 100, 100), new WeatherEffect('Tornados', 40, 100, 100, 100), new WeatherEffect('Hail', 0, 50, 33, 100)];

  class Database {
    constructor() {
      this.forecasts = [];
      this.clear = () => { this.forecasts = this.forecasts.slice(-1); };
      this.get = () => this.forecasts.slice(0);
      this.first = () => this.forecasts.slice(0, 1)[0];
      this.last = () => this.forecasts.slice(-1)[0];
      this.length = () => this.forecasts.length;
      this.filter = callback => this.forecasts.filter(callback);
      this.push = (value) => {
        if (this.forecasts.length = state.Weather.maxHistory) {
          this.trim(1);
        }
        this.forecasts.push(value);
      };
      this.trim = (num) => {
        if (num > 0 && num < this.forecasts.length) {
          this.forecasts = [this.forecasts[0], ...this.forecasts.slice(num + 1)];
        }
      };
      this.biome = BIOME_LIST;
      this.season = SEASON_LIST;
      this.weather = WEATHER_LIST;
      this.cloud = CLOUD_LIST;
      this.phenomena = PHENOMENA_LIST;
    }
  }

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
      this.next = () => {
        if (this.stageIndex < 3) {
          this.stageIndex += 1;
        }
        return this.stage();
      };
      this.finish = () => {
        this = { code: null, needed: false };
      };
    }
  }

  class PauseObj {
    constructor() {
      this.active = false;
      this.start = null;
    }
  }

  class StateObj {
    constructor() {
      this.database = new Database();
      this.lastupdated = 0;
      this.gmOnly = false;
      this.install = new InstallObj();
      this.timeSeed = null;
      this.seasonSeed = null;
      this.pause = new PauseObj();
      this.autoAdvance = true;
      this.timeScale = 7;
      this.seasonDuration = 92;
      this.trendScale = 1;
      this.biome = null;
      this.maxHistory = 50;
    }
  }

  class WeatherObj {
    constructor(statistics, daysSinceSeed) {
      this.day = daysSinceSeed || getDaysElapsed(state.Weather.timeSeed, new Date().getTime());
      this.time = state.Weather.timeSeed + (daysSinceSeed * SECONDS_PER_DAY);
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
        const majorCondition = getClosest('weather', this.stats);
        const minorCondition = getClosest('cloud', this.stats);
        const phenomena = getClosest('phenomena', this.stats, EFFECT_SEARCH_RANGE);
        const humidity = this.stats.windSpeed < 5 ? 'very light' : this.state.windSpeed < 15 ? 'light' : this.stats.windSpeed < 30 ? 'moderate' : 'heavy';
        const temperature = this.stats.windSpeed < 5 ? 'very light' : this.state.windSpeed < 15 ? 'light' : this.stats.windSpeed < 30 ? 'moderate' : 'heavy';
        const windSpeed = this.stats.windSpeed < 5 ? 'very light' : this.state.windSpeed < 15 ? 'light' : this.stats.windSpeed < 30 ? 'moderate' : 'heavy';
        return `The air is filled with ${majorCondition}, and the sky is ${minorCondition}. It is ${temperature} and ${humidity} here, and the wind blows ${windSpeed} against you. ${phenomena ? `Because of current conditions, a ${phenomena} is likely to occur, if not already happening.` : 'Thankfully nothing worse is happening right now.'}`;
      }
      this.print = function () {
        log(`Weather -- Printing day ${this.day} description in chat.`)
        sendChat('', `/desc ${this.description()}`);
      };
      this.log = function () {
        log(this);
      };
    }
  }

/**************************************************************************************************/
/************************** Below lies all of the function declarations ***************************/
/**************************************************************************************************/

  const checkInstall = function () {
    log(`-- Weather v${version} -- [${new Date(lastUpdate * 1000)}]`);
    if (!state.Weather) {
      log('Weather -- Thank you for installing Weather! Please see the chat log to set up the script to your environment.');
      resetState();
      runInstall();
    } else if (state.Weather.install.needed) {
      log('Weather -- Your installation is not yet complete. Please see the chat log to continue setting up the script.')
      runInstall();
    } else {
      checkGlobalConfig();
      getUpdatedWeather().print();
    }
  };

  const checkGlobalConfig = function () {
    const g = globalconfig.weather;
    const s = state.Weather;
    if (g && g.lastsaved && g.lastsaved > s.lastupdated) {
      s.lastupdated = g.lastsaved;
      s.timeScale = Math.max(parseInt(g['Rate of Passing Time'], 10), 1);
      s.seasonDuration = Math.max(parseInt(g['In-Game Days per Season'], 10), 0);
      s.trendScale = Math.max((parseInt(g['Season Effect Percentage'], 10) / 100), 0);
      s.maxHistory = Math.max(Math.min(parseInt(g['Maximum Forecasts Kept in History'], 10), 5), 150)
      s.autoAdvance = g['Automatic Time Advancement'] === 'true';
      s.gmOnly = g['GM Only'] === 'true';
    }
  };

// Advances time if Weather isn't paused, and returns the relevant weather object.
  const advanceDay = function (args) {
    const days = parseInt(args, 10);
    const daysSinceLast = getDaysElapsed(state.Weather.database.last().time, new Date().getTime());
    if (!state.Weather.pause.active && days > 0) {
      if (days > daysSinceLast) {
        state.Weather.timeSeed -= SECONDS_PER_DAY * (days - daysSinceLast);
        return createCurrentWeather(days);
      } else {
        return createCurrentWeather();
    } else {
      return state.Weather.database.last();
    }
  };

// Changes the stats for the latest weather forecast (if valid)
  const changeCurrentStats = function (arg) {
    const s = state.Weather;
    const parsedArgs = _.chain(arg)
                      .map(item => { const stat = item.split(':'); return { name: stat[0], value: stat[1] }; })
                      .filter(stat => _.contains(['temperature', 'windSpeed', 'humidity', 'precipitation'], stat.name))
                      .reject(stat => parseFloat(stat.value).toString() !== stat.value)
                      .filter(stat => stat.name === 'temperature' || parseFloat(stat.value) > 0)
                      .value();
    const message = parsedArgs.reduce((memo, stat) => memo += ` ${stat.name} by ${stat.value}`, 'Changing the following values on the latest forecast:');
    const newStats = parsedArgs.reduce((memo, stat) => memo[stat.name] = parseFloat(stat.value), {});
    printToChat('gm', message);
    s.database.forecasts[s.database.length() - 1]['stats'] = Object.assign(state.Weather.database.last().stats, newStats);
  };

// Creates a new weather object and pushes it to the state database.
// Also returns the object created.
  const createCurrentWeather = function (days) {
    const s = state.Weather
    const previous = s.database.last();
    const daysSinceLast = parseInt(days, 10) || getDaysElapsed(previous.time, new Date().getTime());
    const seasonDay = daysSinceLast + previous.day;
    const trends = {
      temperature: getSeasonTrend('temperature', seasonDay),
      windSpeed: getChange(0, s.biome.stats.windSpeed, daysSinceLast),
      humidity: getChange(0, s.biome.stats.windSpeed, daysSinceLast),
      precipitation: getChange(0, s.biome.stats.windSpeed, daysSinceLast),
    };
    const newStats = {
      temperature: getChange(previous.stats.temperature + trends.temperature, s.biome.stats.temperature * s.trendScale, daysSinceLast),
      windSpeed: Math.max(getChange(5 + trends.windSpeed, s.biome.stats.windSpeed * s.trendScale, daysSinceLast), 0),
      humidity: Math.min(Math.max(getChange(previous.stats.humidity + trends.humidity, s.biome.stats.humidity * s.trendScale, daysSinceLast), 0), 100),
      precipitation: Math.min(Math.max(getChange(previous.stats.precipitation + trends.precipitation, s.biome.stats.precipitation * s.trendScale, daysSinceLast), 0), 100),
    };
    const currentWeather = new WeatherObj(newStats, seasonDay)
    if (currentWeather.verify()) {
      s.database.push(currentWeather);
      return currentWeather;
    }
    return undefined;
  };

// Creates a new WeatherEffect object and pushes it to the proper state database
  const createNewEffect = function (name, temperature, windSpeed, humidity, precipitation) {
    const inputArray = [temperature, windSpeed, humidity, precipitation].map(value => parseFloat(value));
    if (inputArray.every(value => !Number.isNaN(value))) {
      printToChat('gm', 'You need to provide a valid value for the effect\'s temperature, wind speed, humidity, and precipitation (in that order).')
    } else if (!state.Weather.database[name]) {
      printToChat('gm', 'You need to provide a valid weather effect type. Your options are "biome", "weather", and "cloud".')
    } else {
      state.Weather.database[name].push(new WeatherEffect(name, ...inputArray));
    }
  }

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
    if (!state.Weather.database[type]) return undefined;
    const closestArray = _.chain(state.Weather.database[type])
                          .map(effect => ({
                            name: effect.name,
                            distance: ['temperature', 'windSpeed', 'humidity', 'precipitation'].reduce((memo, name) => memo += Math.abs(effect.stats[name] - toCompare[name]), 0),
                          }))
                          .sortBy(effect => effect.distance)
                          .first()
                          .value();
    if (!range || closestArray.distance < range) return closestArray.name;
    return undefined;
  };

// Returns the latest weather forecast
  const getCurrentWeather = function () {
    if (state.Weather.database.length()) return state.Weather.database.last();
    return undefined;
  };

// Returns the amount of full in-game days elapsed between the two inputs
  const getDaysElapsed = function (originalTime, newTime) {
    return Math.floor((originalTime - newTime) / SECONDS_PER_DAY);
  };

  const getRandomString = function (length) {
    return Math.round((36 ** (length + 1)) - (Math.random() * (36 ** (length + 1)))).toString(36).slice(1);
  };

// Returns a value based on the slope of a sine curve where wave period is equal to seasonDuration
  const getSeasonTrend = function (name, days) {
    const biomeStat = state.Weather.biome.stats[name];
    const time = (days / state.Weather.seasonDuration) * Math.PI;
    const seedShift = (state.Weather.seasonSeed * (Math.PI / 4)) + (Math.PI / 8);
    return biomeStat * state.Weather.trendScale * Math.cos(time + seedShift);
  };

// Checks to see if we need to update. If yes, return a new forecast. Otherwise return the latest.
  const getUpdatedWeather = function () {
    const days = getDaysElapsed(state.Weather.database.last().time, new Date().getTime());
    if (!state.Weather.paused.active && days >= 1 && state.Weather.autoAdvance) return createCurrentWeather(days);
    return state.Weather.database.last();
  };

// Chat Handler //
  const handleChatInput = function (msg) {
    if (msg.type !== 'api' || (state.Weather.gmOnly && !playerIsGM(msg.playerid))) return;
    const args = msg.content.split(/\s/);
    const target = playerIsGM(msg.playerid) ? msg.who.replace(/( \(GM\)$)/g, '') : msg.who;
    if (args[0].toLowerCase() === '!weather') {
      switch (args[1]) {
        case state.Weather.install.code: {
          if (!playerIsGM(msg.playerid)) return;
          runInstall(args.slice(2))
          break;
        }
        case 'add': {
          if (!playerIsGM(msg.playerid)) return;
          if (args[2]) createNewEffect(...args.slice(2));
          else printToChat(target, 'I didn\'t see what you wanted to add.')
          break;
        }
        case 'advance': {
          if (!playerIsGM(msg.playerid)) return;
          if (args[2] && args[2] > 0) advanceDay(args[2])
          else printToChat(target, 'You can\'t advance backwards (sadly).')
          break;
        }
        case 'clear': {
          if (!playerIsGM(msg.playerid)) return;
          printToChat(target, 'Clearing weather history!');
          state.Weather.database.clear();
          break;
        }
        case 'debug': {
          if (!playerIsGM(msg.playerid)) return;
          log(state.Weather);
          break;
        }
        case 'decline': {
          if (!playerIsGM(msg.playerid) || !state.Weather.install.code) return;
          state.Weather.install.code = null;
          printToChat(target, 'Action declined.')
          break;
        }
        case 'help': {
          showHelp(target);
          break;
        }
        case 'move': {
          if (!playerIsGM(msg.playerid)) return;
          if (args[2] && args[2] === state.Weather.install.code && args[3]) {
            if (_.find(state.Weather.database.biome, item => item.name === args[3])) {
              state.Weather.biome = _.find(state.Weather.database.biome, item => item.name === args[3]);
              printToChat('gm', `Changing the biome to ${args[3]}.`)
            } else {
              printToChat(target, `The ${args[3]} biome doesn\'t exist.`)
            }
            state.Weather.install.code = null;
          } else {
            const secureString = getRandomString(32);
            const message = _.reduce(state.Weather.database.biome, (memo, biome) => memo += `[${biome.name}](!weather move ${secureString} ${biome.name})`, 'Please select the biome that your players are moving to.<br>')
            state.Weather.install.code = secureString;
            printToChat(target, message);
          }
          break;
        }
        case 'pause': {
          if (!playerIsGM(msg.playerid)) return;
          handlePause(true);
          break;
        }
        case 'reinstall': {
          if (!playerIsGM(msg.playerid)) return;
          const secureString = getRandomString(32)
          state.Weather.install.code = secureString;
          printToChat(target, `Are you sure you want to reset all information? <br>[Yes](!weather ${secureString}) [No](!weather decline)`)
          break;
        }
        case 'remove': {
          if (!playerIsGM(msg.playerid)) return;
          removeEffect(...args.slice(2));
          break;
        }
        case 'resume': {
          if (!playerIsGM(msg.playerid)) return;
          handlePause(false);
          break;
        }
        case 'set': {
          if (!playerIsGM(msg.playerid)) return;
          if (args[2]) changeCurrentStats(args.slice(2));
          else printToChat(target, 'I didn\'t see what you wanted to change.')
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
            printToChat(target, `Weather hasn't been fully installed yet. ${playerIsGM(msg.playerid) ? `Click this button to [Continue](!weather ${state.Weather.install.code}) the process.` : 'Message your GM to let them know!'}`)
          } else {
            printToChat(target, getCurrentWeather().description());
          }
        }
      }
    }
  };

// Handles all pausing, and changing of timestamps.
  const handlePause = function (pause) {
    if (pause) {
      if (state.Weather.pause.active) {
        printToChat('gm', 'Weather is already paused.');
        return;
      }
      state.Weather.pause.active = true;
      state.Weather.pause.start = new Date().getTime();
      printToChat('gm', 'Weather has been paused. You will only be able to retrieve the last weather effect until the resume command is received.');
    } else {
      if (!state.Weather.pause.active) {
        printToChat('gm', 'Weather is not currently paused.');
        return;
      }
      const timeDifference = new Date().getTime() - state.Weather.pause.start;
      // Update all existing timestamps by adding timeDifference;
      state.Weather.database.forecasts = _.each(state.Weather.database.get(), forecast => forecast.time += timeDifference);
      state.Weather.timeSeed += timeDifference;
      printToChat('gm', 'Weather has resumed. You can now advance days and get updates again.');
      state.pause = new PauseObj();
    }
  }

// This function mimics a Quartile Function
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

// ------------------------------------------------ INCOMPLETE -------------------------------------
  const removeEffect = function (...args) {
    const nameArray = _.clone(args);
    // GOTTA DO THIS SOMETIMEbdfg90fgb80dfg9dvk409j0r9wk093w8jr0bw309tk0w9r0v9w3j3wf90w3j09fjw90jbf9
  };

// Resets the state object safely
  const resetState = function () {
    state.Weather = new StateObj();
    state.Weather.timeSeed = new Date().getTime();
  };

// Handles all installation stages
  const runInstall = function (args) {
    const s = state.Weather;
    if (!s.install.needed) {
      s.install = new InstallObj();
    }
    const secureString = getRandomString(32);
    const getQuestion = (list, statement) => _.reduce(s.database[list], (memo, item) => memo += `[${item.name}](!weather ${secureString} ${item.name})`, `${statement}<br>`);
    s.install.code = secureString;
    const biomeQuestion = getQuestion('biome', 'Please select the biome that most closely resembles where your players are. This can be changed later.');
    const seasonQuestion = getQuestion('season', 'Please select the season that your characters are experiencing. This script assumes you\'re starting at the beginning of a season.');
    const temperatureQuestion = `Please click this button and enter the current temperature your players are experiencing in the window that appears.<br>[Select Temperature](!weather ${secureString} ?{Please enter a temperature in Celsius.|0})`;
    const confirmationStatement = `You said that the ${s.install.stage()} is ${args[0]}. Is that what you wanted?<br>[Yes](!weather ${secureString} true)[No](!weather ${secureString} false)`;
    const finishedStatement = 'The installation of Weather is complete. Get your first weather description with the command<br><span style="color:#777777">!weather</span><br>If you\'ve made a mistake somewhere, you can fix it with the command<br><span style="color:#777777">!weather set [temperature|humidity|windSpeed|precipitation]:15</span>, replacing the 15 with your own value. If you need more help, just use <span style="color:#777777">"!weather help"</span> to see the help menu.';
    // LOGIC BELOW - Confirmation ? Handle confirmation : Check what to do at each stage;
    if (s.install.tmp) {
      if (args === 'true') {
        let stage = s.install.stage();
        s.install[stage] = s.install.tmp;
        s.install.tmp = null;
        stage = s.install.next();
        if (stage) {
          const message = stage === 'biome' ? biomeQuestion : stage === 'season' ? seasonQuestion : temperatureQuestion;
          printToChat('gm', message);
        } else {
          s.biome = s.install.biome;
          s.seasonSeed = s.install.season.id;
          const firstWeather = new WeatherObj({ temperature: s.install.temperature }, 0);
          if (firstWeather.verify()) {
            s.install.finish();
            s.database.push(firstWeather);
            return;
          } else {
            s.install = new InstallObj()
            printToChat('gm', 'Something went wrong during weather generation. Click this button to restart installation.<br>[Restart](!weather reinstall)');
          }
        }
      } else if (args === 'false') {
        s.install.tmp = null;
        const stage = s.install.stage();
        const message = stage === 'biome' ? biomeQuestion : stage === 'season' ? seasonQuestion : temperatureQuestion;
        printToChat('gm', `Sorry! ${message}`);
      }
    // End of IF WAITING ON CONFIRMATION;
    } else {
      switch (s.install.stage()) {
        case 'biome':
        case 'season':
          if (args[0] && _.find(s.database[s.install.stage()], item => item.name === args[0])) {
            s.install.tmp = _.find(s.database[s.install.stage()], item => item.name === args[0]);
            printToChat('gm', confirmationStatement);
          } else {
            printToChat('gm', getQuestion(s.install.stage(), secureString, `Please select one of the following ${s.install.stage()}s to describe where your players are:<br>`));
          }
          break;
        case 'temperature': {
          if (args[0] && parseFloat(args[0]).toString() === args[0]) {
            s.install.tmp = parseFloat(args[0]);
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
  };

// Stylized sendChat function with preset formatting.
  const printToChat = function (target, content, callback) {
    const FORMATTING_START = '<div style="background-color:#ffffff; padding:5px; border-width:2px; border-style:solid;">' +
                             '<div style="border-width:2px; border-style:dotted; padding:5px">';
    const FORMATTING_END = '</div></div>';
    sendChat('Weather', `/w ${target} <br>${FORMATTING_START}${content}${FORMATTING_END}`, callback, { noarchive: true });
  };

// Help message
  const showHelp = function (target) {
    const help = '' +
                 '';
    printToChat(target, help);
  };

// Register event handlers
  const registerEventHandlers = function () {
    on('chat:message', handleChatInput);

  };

// Exposed functions
  return {
    CheckInstall: checkInstall,
    RegisterEventHandlers: registerEventHandlers,
    AdvanceDay: advanceDay,
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
