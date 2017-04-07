// Github: https://github.com/bpunya/roll20-api/blob/master/TruePageCopy/1.0/TruePageCopy.js
// Author: PaprikaCC (Bodin Punyaprateep)

var Music = Music || (function () {
  const version = "1.0";
  const lastUpdate = 1491532526;
  const updateRate = 250; // In milliseconds
  const minFadeTime = 1;
  const defaultFadeTime = 20;
  const maxFadeTime = 60;

  const checkInstall = function () {
    log(`Music v${version} loaded -- ${new Date(lastUpdate * 1000)}`)
  };

  const getMessage = function (start, tracklist) {
    return _.reduce(tracklist, (memo, track) => `${memo} ${track.get('title')},`, start);
  }

  const fadeTrackVolume = function (trackList, volumeCurve) {
    const adjustVolume = () => {
      const volumeMultiplier = volumeCurve.shift();
      log(volumeMultiplier)
      _.each(trackList, track => {
        const newVolume = parseInt(track.volume, 10) * volumeMultiplier;
        track.data.set('volume', Math.floor(parseInt(newVolume, 10)).toString());
      })
      if (volumeCurve.length) {
        _.delay(adjustVolume, updateRate, trackList, volumeCurve);
      } else {
        setTimeout(() => _.each(trackList, track => track.data.set({ playing: false, volume: track.volume })), 2000);
      }
    };
    adjustVolume();
  };

  const prepareTrackFade = function (value) {
    let duration = parseInt(value, 10) || defaultFadeTime;
    duration = duration < 0 ? minFadeTime : duration > maxFadeTime ? maxFadeTime : duration;
    const tracks = findObjs({ _type: 'jukeboxtrack', playing: true })
    if (!tracks) return;
    log(getMessage(`Fading the following tracks over ${duration} seconds:`, tracks))
    const trackList = _.map(tracks, track => ({ volume: track.get('volume'), data: track }))
    fadeTrackVolume(trackList, getLogCurve(duration));
  };

  const getLogCurve = function (duration, increase) {
    const base = 4;
    const length = duration * (1000 / updateRate);
    const curve = new Float32Array(length);
    for (let i = 0; i < length; i += 1) {
      const index = increase ? i : length - 1 - i;
      const percent = i / length;
      curve[index] = Math.exp(1 + (base * percent)) / Math.exp(1 + base);
    }
    const array = [];
    for (let v = 0; v < length; v += 1) {
      array.push(curve[v]);
    }
    return array;
  };

  const changeTrackVolume = function (increase, value) {
    let delta = parseInt(value, 10) || 5;
    delta = delta > 100 ? 100 : delta < -100 ? -100 : delta;
    const percentage = value.substr(-1) === '%';
    const tracks = findObjs({ _type: 'jukeboxtrack', playing: true });
    if (!tracks) return;
    log(getMessage(`Adjusting the following track volumes by ${increase ? delta : -delta}${percentage ? '%' : ' units'}:`, tracks))
    _.each(tracks, (track) => {
      const oldVolume = parseInt(track.get('volume'), 10);
      let newVolume = oldVolume + (percentage ?
        oldVolume * (delta / 100) * (increase ? 1 : -1) :
        increase ? delta : -delta);
      newVolume = newVolume > 100 ? 100 : newVolume < 0 ? 0 : newVolume;
      track.set({ volume: (newVolume === 0 ? oldVolume : newVolume.toString()), playing: newVolume !== 0 });
    });
  };

  const stopTracks = function () {
    const tracks = findObjs({ _type: 'jukeboxtrack', playing: true });
    if (!tracks) return;
    log(getMessage('Stopping the following tracks:', tracks))
    _.each(tracks, track => track.set('playing', false));
  };

  const handleChatInput = function (msg) {
    if (msg.type !== 'api' || !playerIsGM(msg.playerid)) return;
    const args = msg.content.split(/\s/)
    switch (args[0]) {
      case '!music': {
        switch (args[1]) {
          case 'fade': {
            prepareTrackFade(args[2])
            break;
          }
          case 'stop': {
            stopTracks()
            break;
          }
          case 'up': {
            changeTrackVolume(true, args[2])
            break;
          }
          case 'down': {
            changeTrackVolume(false, args[2])
            break;
          }
        }
      }
    }
  };

  const registerEventHandlers = function () {
    on('chat:message', handleChatInput)
  };

  return {
    CheckInstall: checkInstall,
    RegisterEventHandlers: registerEventHandlers,
    Fade: prepareTrackFade,
  };
}());

on('ready', () => {
  "use strict";

  Music.CheckInstall();
  Music.RegisterEventHandlers();
});
