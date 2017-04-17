// Github: https://github.com/bpunya/roll20-api/blob/master/Weather/1.0/Weather.js
// Author: PaprikaCC (Bodin Punyaprateep)

var Weather = Weather || (function () {
  const version = 1.0;
  const lastUpdate = 1492406524;
  const EFFECT_SEARCH_RANGE = 100;
  const SECONDS_PER_DAY = 86400000 / (state.Weather && state.Weather.timeScale ? state.Weather.timeScale : 7);
  const FORMATTING_START = '<div style="box-shadow:-2px 2px 3px #999; background-color:#ADD8E6; border-style:solid; border-width:1px;">' +
                           '<div style="border-width:5px; border-style:solid; border-color:#FFF; padding:5px">';
  const FORMATTING_END = '</div></div>';

  class Biome {
    constructor(a, b, c, d, e) {
      this.name = a;
      this.temperature = {
        max: b[0],
        min: b[1],
        variance: b[2],
      };
      this.windSpeed = c;
      this.humidity = d;
      this.precipitation = e;
    }
  }

  class Database {
    constructor() {
      this.biome = BIOME_LIST;
      this.weather = WEATHER_LIST;
      this.cloud = CLOUD_LIST;
      this.phenomena = PHENOMENA_LIST;
      this.season = SEASON_LIST;
      this.forecasts = [];
    }
  }

  class Forecast {
    constructor(statistics, daysSinceSeed) {
      this.day = daysSinceSeed || getDaysElapsed(state.Weather.timeSeed, Date.now());
      this.time = daysSinceSeed ? state.Weather.timeSeed + (daysSinceSeed * SECONDS_PER_DAY) : Date.now();
      this.stats = {
        temperature: statistics.temperature || 0,
        windSpeed: statistics.windSpeed || 0,
        humidity: statistics.humidity || 0,
        precipitation: statistics.precipitation || 0,
      };
    }
  }

  class InstallObj {
    constructor() {
      this.code = null;
      this.needed = true;
      this.tmp = null;
      this.biome = null;
      this.season = null;
      this.stageIndex = 0;
      this.stageList = ['biome', 'season', false];
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
      this.biome = null;
      this.gmOnly = false;
      this.autoAdvance = false;
      this.timeSeed = Date.now();
      this.seasonSeed = null;
      this.trendScale = 1;
      this.timeScale = 7;
      this.seasonDuration = 92;
      this.maxHistory = 50;
      this.lastupdated = 0;
      this.pause = new PauseObj();
      this.install = new InstallObj();
      this.database = new Database();
    }
  }

  class WeatherEffect {
    constructor(a, b, c, d, e) {
      this.name = a;
      this.stats = {
        temperature: b,
        windSpeed: c,
        humidity: d,
        precipitation: e,
      };
    }
  }

  const SEASON_LIST = [{ name: 'Spring', id: 7 }, { name: 'Summer', id: 1 }, { name: 'Fall', id: 3 }, { name: 'Winter', id: 5 }];
  const BIOME_LIST = [new Biome('Metropolis', [25, -20, 5], 25, 25, 33)];
  const WEATHER_LIST = [new WeatherEffect('rain', 25, 20, 100, 100), new WeatherEffect('snow', -10, 20, 50, 100), new WeatherEffect('fog', 10, 0, 100, 50), new WeatherEffect('dust', 20, 15, 0, 0), new WeatherEffect('haze', 35, 0, 50, 0), new WeatherEffect('a gentle breeze', 10, 5, 5, 5), new WeatherEffect('a bitter chill', -30, 30, 0, 0), new WeatherEffect('a sweltering heat', 50, 0, 0, 0)];
  const CLOUD_LIST = [new WeatherEffect('overcast', 0, 15, 75, 75), new WeatherEffect('clear', 0, 20, 0, 0), new WeatherEffect('partly cloudy', 0, 20, 25, 25), new WeatherEffect('mostly cloudy', 0, 15, 35, 35), new WeatherEffect('still', 0, 0, 0, 0)];
  const PHENOMENA_LIST = [new WeatherEffect('thunderstorm', 20, 50, 100, 100), new WeatherEffect('tornado', 40, 100, 100, 100), new WeatherEffect('hail storm', 0, 50, 33, 100)];

/**************************************************************************************************/
/********************************** SETUP AND CHECKING FUNCTION  **********************************/
/**************************************************************************************************/

  const checkInstall = function () {
    log(`-- Weather v${version} -- [${new Date(lastUpdate * 1000)}]`);
    if (!state.Weather) {
      log('Weather -- Thank you for installing Weather! Please see the chat log to set up the script to your environment.');
      printToUser('gm', 'Thank you for installing Weather! Please follow the instructions in the following chat messages to set up the script to your environment.');
      resetState();
      handleInstall();
    } else if (state.Weather.install.needed) {
      log('Weather -- Your installation is not yet complete. Please see the chat log to continue setting up the script.');
      handleInstall();
    } else {
      checkGlobalConfig();
      printToChat(getWeatherDescription(getUpdatedForecast()));
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
      s.maxHistory = Math.max(Math.min(parseInt(g['Maximum Forecasts Kept in History'], 10), 5), 150);
      s.autoAdvance = g['Automatic Time Advancement'] === 'true';
      s.gmOnly = g['GM Only'] === 'true';
    }
  };

/**************************************************************************************************/
/*********************************** Object Creation Functions ************************************/
/**************************************************************************************************/

// Creates a new WeatherEffect object and pushes it to the proper state database
  const createNewEffect = function (name, temperature, windSpeed, humidity, precipitation) {
    return;
  };

// Creates a new weather object and pushes it to the state database.
// Also returns the object created.
  const createNewForecast = function (days) {
    const s = state.Weather;
    const prev = s.database.forecasts.slice(-1)[0];
    const daysSinceLast = parseInt(days, 10) || getDaysElapsed(prev.time, Date.now());
    const seasonDay = daysSinceLast + prev.day;
    const trend = {
      temperature: getSeasonTrend(seasonDay),
      windSpeed: getValueChange(0, s.biome.windSpeed, daysSinceLast),
      humidity: getValueChange(0, s.biome.humidity, daysSinceLast),
      precipitation: getValueChange(0, s.biome.precipitation, daysSinceLast),
    };
    const newStats = {
      temperature: getValueChange(trend.temperature, s.biome.temperature * s.trendScale, daysSinceLast),
      windSpeed: Math.max(getValueChange(prev.stats.windSpeed, s.biome.windSpeed * s.trendScale, daysSinceLast), 0),
      humidity: Math.min(Math.max(getValueChange(prev.stats.humidity + trend.humidity, s.biome.humidity * s.trendScale, daysSinceLast), 0), 100),
      precipitation: Math.max(getValueChange(prev.stats.precipitation + trend.precipitation, s.biome.precipitation * s.trendScale, daysSinceLast), 0),
    };
    const currentWeather = new Forecast(newStats, seasonDay);
    s.database.forecasts.push(currentWeather);
    return currentWeather;
  };

// Changes the stats for the latest weather forecast (if valid)
  const modifyLatestForecast = function (arg) {
    const s = state.Weather;
    const parsedArgs = _.chain(arg)
                      .map((item) => { const stat = item.split(':'); return { name: stat[0], value: stat[1] }; })
                      .filter(stat => _.contains(['temperature', 'windSpeed', 'humidity', 'precipitation'], stat.name))
                      .reject(stat => parseFloat(stat.value).toString() !== stat.value)
                      .filter(stat => stat.name === 'temperature' || parseFloat(stat.value) > 0)
                      .value();
    const message = parsedArgs.reduce((memo, stat) => { memo += ` ${stat.name} by ${stat.value}`; return memo; }, 'Changing the following values on the latest forecast:');
    const newStats = parsedArgs.reduce((memo, stat) => { memo[stat.name] = parseFloat(stat.value); return memo; }, {});
    printToUser('gm', message);
    s.database.forecasts[s.database.forecasts.length - 1]['stats'] = Object.assign(s.database.forecasts.slice(-1)[0]['stats'], newStats);
  };

  const modifyForecastTimes = function (input) {
    if (_.isNaN(input)) return;
    state.Weather.forecasts = _.map(state.Weather.forecasts, (forecast) => { const newForecast = forecast; newForecast.time -= input; return newForecast; });
    state.Weather.timeSeed -= input;
  };

/**************************************************************************************************/
/********************************* MATH AND COMPARISON FUNCTIONS **********************************/
/**************************************************************************************************/

// Returns the closest object to the given array
  const getClosestEffect = function (type, toCompare, range) {
    if (!state.Weather.database[type]) return undefined;
    const closestEffect = _.chain(state.Weather.database[type])
                           .map(effect => ({
                             name: effect.name,
                             distance: ['temperature', 'windSpeed', 'humidity', 'precipitation'].reduce((memo, name) => { memo += Math.abs(effect.stats[name] - toCompare[name]); return memo; }, 0),
                           }))
                           .sortBy(effect => effect.distance)
                           .first()
                           .value();
    if (!range || closestEffect.distance < range) return closestEffect.name;
    return undefined;
  };

// Returns the amount of full in-game days elapsed between the two inputs
  const getDaysElapsed = function (originalTime, newTime) {
    return Math.floor((newTime - originalTime) / SECONDS_PER_DAY);
  };

  const getRandomString = function (length) {
    return Math.round((36 ** (length + 1)) - (Math.random() * (36 ** (length + 1)))).toString(36).slice(1);
  };

// Returns a value based on the slope of a sine curve where wave period is equal to seasonDuration
  const getSeasonTrend = function (days) {
    const s = state.Weather;
    const tempSkew = (s.biome.temperature.max + s.biome.temperature.max) / 2;
    const tempRange = (s.biome.temperature.max - s.biome.temperature.max) / 2;
    const time = (days / s.seasonDuration) * (Math.PI / 4);
    const seedShift = (s.seasonSeed * (Math.PI / 4));
    return tempSkew + (tempRange * Math.sin(time + seedShift));
  };

// Returns a description of the forecast
  const getWeatherDescription = function (forecast) {
    const f = forecast.stats;
    const majorCondition = getClosestEffect('weather', f);
    const minorCondition = getClosestEffect('cloud', f);
    const phenomena = getClosestEffect('phenomena', f, EFFECT_SEARCH_RANGE);
    const humidity = f.humidity < 5 ? 'dry' : f.humidity < 15 ? 'calm' : f.humidity < 30 ? 'moist' : 'wet';
    const temperature = f.temperature < 5 ? 'chilly' : f.temperature < 15 ? 'mild' : f.temperature < 30 ? 'hot' : 'blisteringly hot';
    const windSpeed = f.windSpeed < 5 ? 'very light' : f.windSpeed < 15 ? 'light' : f.windSpeed < 30 ? 'moderate' : 'heavi';
    const precipitation = f.precipitation < 10 ? '' : f.precipitation < 30 ? 'lightly' : f.precipitation < 75 ? 'heavily' : f.precipitation < 150 ? 'non-stop' : 'like a monsoon';
    return `The air is filled with ${majorCondition}, and the sky is ${minorCondition}. It is ${temperature} and ${humidity} here, and the wind blows ${windSpeed}ly against you. ${precipitation ? `It has been raining ${precipitation} for the last while.` : ''} ${phenomena ? `Because of current conditions, a ${phenomena} is likely to occur if it isn't already happening.` : 'Thankfully nothing worse is happening right now.'}`;
  };

// Returns a new value depending on the amount of iterations, trend and original
  const getValueChange = function (original, trend, iteration) {
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

/**************************************************************************************************/
/*************************************** Forecast Handlers ****************************************/
/**************************************************************************************************/

// Advances time if Weather isn't paused, and returns the relevant weather object.
  const advanceWeather = function (args) {
    const s = state.Weather;
    const days = parseInt(args, 10);
    const daysSinceLast = getDaysElapsed(s.database.forecasts.slice(-1)[0]['time'], Date.now());
    if (!s.pause.active && days > 0) {
      if (days > daysSinceLast) {
        modifyForecastTimes(SECONDS_PER_DAY * (days - daysSinceLast));
        return createNewForecast(days);
      }
      return createNewForecast();
    }
    return s.database.forecasts.slice(-1)[0];
  };

// Returns the latest weather forecast
  const getLastForecast = function () {
    if (state.Weather.database.forecasts.length) return state.Weather.database.forecasts.slice(-1)[0];
    return undefined;
  };

// Checks to see if we need to update. If yes, return a new forecast. Otherwise return the latest.
  const getUpdatedForecast = function () {
    const s = state.Weather;
    const daysSinceLast = getDaysElapsed(s.database.forecasts.slice(-1)[0]['time'], Date.now());
    if (!s.pause.active && daysSinceLast >= 1 && s.autoAdvance) return createNewForecast(daysSinceLast);
    return s.database.forecasts.slice(-1)[0];
  };

/**************************************************************************************************/
/***************************************** Input Handlers *****************************************/
/**************************************************************************************************/

// Chat Handler //
  const handleChatInput = function (msg) {
    if (msg.type !== 'api' || (state.Weather.gmOnly && !playerIsGM(msg.playerid))) return;
    const s = state.Weather;
    const args = msg.content.split(/\s/);
    const target = playerIsGM(msg.playerid) ? msg.who.replace(/( \(GM\)$)/g, '') : msg.who;
    if (args[0].toLowerCase() === '!weather') {
      switch (args[1]) {
        case state.Weather.install.code: {
          if (!playerIsGM(msg.playerid)) return;
          handleInstall(args.slice(2));
          break;
        }
        case 'add': {
          if (!playerIsGM(msg.playerid)) return;
          if (args[2]) createNewEffect(...args.slice(2));
          else printToUser(target, 'I didn\'t see what you wanted to add.');
          break;
        }
        case 'advance': {
          if (!playerIsGM(msg.playerid)) return;
          if (args[2] && args[2] > 0) advanceWeather(args[2]);
          else printToUser(target, 'You can\'t advance backwards (sadly).');
          break;
        }
        case 'clear': {
          if (!playerIsGM(msg.playerid)) return;
          printToUser(target, 'Clearing weather history!');
          state.Weather.database.forecasts = [s.database.forecasts.slice(-1)[0]];
          break;
        }
        case 'debug': {
          if (!playerIsGM(msg.playerid)) return;
          if (args[2] && args[2] === 'reset') resetState();
          log(state.Weather);
          break;
        }
        case 'decline': {
          if (!playerIsGM(msg.playerid) || !s.install.code) return;
          state.Weather.install.code = null;
          printToUser(target, 'Action declined.');
          break;
        }
        case 'help': {
          showHelp(target);
          break;
        }
        case 'move': {
          if (!playerIsGM(msg.playerid)) return;
          if (args[2] && args[2] === s.install.code && args[3]) {
            if (_.find(s.database.biome, item => item.name === args[3])) {
              s.biome = _.find(s.database.biome, item => item.name === args[3]);
              printToUser('gm', `Changing the biome to ${args[3]}.`);
            } else {
              printToUser(target, `The ${args[3]} biome doesn't exist.`);
            }
            state.Weather.install.code = null;
          } else {
            const secureString = getRandomString(32);
            const message = _.reduce(s.database.biome, (memo, biome) => { memo += `[${biome.name}](!weather move ${secureString} ${biome.name})`; return memo; }, 'Please select the biome that your players are moving to.<br>');
            state.Weather.install.code = secureString;
            printToUser(target, message);
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
          const secureString = getRandomString(32);
          state.Weather.install.code = secureString;
          printToUser(target, `Are you sure you want to reset all information? <br>[Yes](!weather ${secureString}) [No](!weather decline)`);
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
          if (args[2]) modifyLatestForecast(args.slice(2));
          else printToUser(target, 'I didn\'t see what you wanted to change.');
          break;
        }
        case 'update': {
          if (!playerIsGM(msg.playerid)) return;
          printToChat(getWeatherDescription(getUpdatedForecast()));
          break;
        }
        default: {
          if (s.install.needed) {
            const secureString = getRandomString(32);
            state.Weather.install.code = secureString;
            printToUser(target, `Weather hasn't been fully installed yet. ${playerIsGM(msg.playerid) ? `Click this button to continue the process.<br>[Continue](!weather ${secureString})` : 'Message your GM to let them know!'}`);
          } else {
            printToUser(target, getWeatherDescription(getLastForecast()));
          }
        }
      }
    }
  };

// Handles all installation stages
  const handleInstall = function (input) {
    const s = state.Weather;
    if (!s.install.needed) {
      state.Weather.install = new InstallObj();
    }
    const args = input || [];
    const secureString = getRandomString(32);
    const getQuestion = (list, statement) => _.reduce(state.Weather.database[list], (memo, item) => { memo += `[${item.name}](!weather ${secureString} ${item.name})`; return memo; }, `${statement}<hr>`);
    state.Weather.install.code = secureString;
    const biomeQuestion = getQuestion('biome', 'Please select the biome that most closely resembles where your players are. This can be changed later.');
    const seasonQuestion = getQuestion('season', 'Please select the season that your characters are experiencing. This script assumes you\'re starting at the beginning of a season.');
    const confirmationStatement = `You said that the ${state.Weather.install.stageList[state.Weather.install.stageIndex]} is ${args[0]}. Is that what you wanted?<hr>[Yes](!weather ${secureString} true)[No](!weather ${secureString} false)`;
    const finishedStatement = 'The installation of Weather is complete. Get your first weather description with the command <span style="color:#777777">!weather</span>. If you\'ve made a mistake somewhere, you can fix it with the command <span style="color:#777777">!weather set temperature:15</span>, replacing the 15 with your own value. If you need more help, just use <span style="color:#777777">"!weather help"</span> to see the help menu.';
    // LOGIC BELOW - Confirmation ? Handle confirmation : Check what to do at each stage;
    if (state.Weather.install.tmp) {
      if (args[0] === 'true') {
        let stage = state.Weather.install.stageList[state.Weather.install.stageIndex];
        state.Weather.install[stage] = state.Weather.install.tmp;
        state.Weather.install.tmp = null;
        state.Weather.install.stageIndex += 1;
        stage = state.Weather.install.stageList[state.Weather.install.stageIndex];
        if (stage) {
          const message = stage === 'biome' ? biomeQuestion : seasonQuestion;
          printToUser('gm', message);
        } else {
          state.Weather.biome = state.Weather.install.biome;
          state.Weather.seasonSeed = state.Weather.install.season.id;
          state.Weather.database.forecasts.push(new Forecast({
            temperature: getSeasonTrend(0),
            windSpeed: normalInverse(Math.random(), s.biome.windSpeed * 2, s.biome.windSpeed),
            humidity: normalInverse(Math.random(), s.biome.humidity * 2, s.biome.humidity),
            precipitation: normalInverse(Math.random(), s.biome.precipitation * 2, s.biome.precipitation),
            }, 0));
          printToUser('gm', finishedStatement);
          state.Weather.install = new InstallObj();
          state.Weather.install.needed = false;
        }
      } else {
        state.Weather.install.tmp = null;
        const stage = state.Weather.install.stageList[state.Weather.install.stageIndex];
        const message = stage === 'biome' ? biomeQuestion : seasonQuestion;
        printToUser('gm', message);
      }
    // End of IF WAITING ON CONFIRMATION;
    } else {
      switch (state.Weather.install.stageList[state.Weather.install.stageIndex]) {
        case 'biome': {
          if (_.find(state.Weather.database.biome, item => item.name === args[0])) {
            state.Weather.install.tmp = _.find(state.Weather.database.biome, item => item.name === args[0]);
            printToUser('gm', confirmationStatement);
          } else {
            printToUser('gm', biomeQuestion);
          }
          break;
        }
        case 'season': {
          if (_.find(state.Weather.database.season, item => item.name === args[0])) {
            state.Weather.install.tmp = _.find(state.Weather.database.season, item => item.name === args[0]);
            printToUser('gm', confirmationStatement);
          } else {
            printToUser('gm', seasonQuestion);
          }
          break;
        }
      }
    }
  };

// Handles all pausing, and changing of timestamps.
  const handlePause = function (pause) {
    const s = state.Weather;
    if (pause === s.pause.active) {
      printToUser('gm', `Weather is ${s.pause.active ? 'already' : 'not currently'} paused.`);
      return;
    }
    if (pause) {
      s.pause.active = true;
      s.pause.start = Date.now();
      printToUser('gm', 'Weather has been paused. You will only be able to retrieve the last weather effect until the resume command is received.');
    } else {
      const timeDifference = Date.now() - s.pause.start;
      modifyForecastTimes(timeDifference);
      s.pause = new PauseObj();
      printToUser('gm', 'Weather has resumed. You can now advance days and get updates again.');
    }
  };

// This function mimics a Quartile Function
  const normalInverse = function (percentile, mean, deviation) {
  // Taken from: https://gist.github.com/kmpm/1211922/
    if ([percentile, mean, deviation].find(arg => _.isNaN(arg))) {
      throw new Error('An input is not a number');
    } else if (deviation < 0 || percentile < 0) {
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

  const printToChat = function (content) {
    sendChat('', `/desc ${FORMATTING_START}${content}${FORMATTING_END}`);
  };

// Stylized sendChat function with preset formatting.
  const printToUser = function (target, content, callback) {
    sendChat('Weather', `/w ${target} <br>${FORMATTING_START}${content}${FORMATTING_END}`, callback, { noarchive: true });
  };

  const resetState = function () {
    state.Weather = new StateObj();
  };

// Help message
  const showHelp = function (target) {
    const help = '<div>' +
                  '<strong><h1 style="text-align:left;color:#FFF">Weather</h1></strong>' +
                  '<p style="text-align:left;font-size:75%;">The following is a list of all current settings.</p>' +
                  '</div>' +
                  '<div style="color:#000000;background-color:#FFF">' +
                  '<hr style="background:#000000; border:0; height:7px" />' +
                  '<ul><b>Automatic Weather Updates</b>:<br>' +
                    `${state.Weather.autoAdvance ? 'Passage of time is observed' : 'Weather must be updated manually'}</ul>` +
                  '</div>' +
                  '<div style="">' +
                  '<p style="font-size:90%;">To use <span style="color:#162955">Weather</span> as a macro or chat command, follow this format:<br>' +
                  '<span style="color:#555">!weather</span><br>' +
                  'or<br>' +
                  '<span style="color:#555">!weather advance 7</span></p>' +
                  '</div>' +
                  '<div>' +
                  `<p style="font-size:90%;"> To change one or more of <span style="color:#162955">Weather</span>'s settings, enter !weather ` +
                  `before one or more of the commands listed above, followed by a value.` +
                  '</p>' +
                  '</div>';
    printToUser(target, help);
  };

// Register event handlers
  const registerEventHandlers = function () {
    on('chat:message', handleChatInput);
  };

// Exposed functions
  return {
    CheckInstall: checkInstall,
    RegisterEventHandlers: registerEventHandlers,
    Advance: advanceWeather,
    Get: getLastForecast,
    GetUpdate: getUpdatedForecast,
    NormSInv: normalInverse,
    Season: getSeasonTrend,
  };
}());

on('ready', () => {
  "use strict";

  Weather.CheckInstall();
  Weather.RegisterEventHandlers();
});
