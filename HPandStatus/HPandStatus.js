// Github: https://github.com/bpunya/roll20-api/blob/master/BackwaterCampaign/HPandStatus.js
// Author: PaprikaCC (Bodin Punyaprateep)

// This script was adapted from the one originally created by The Aaron.
// You can find the original at:
// https://github.com/shdwjk/Roll20API/blob/master/TempHPAndStatus/TempHPAndStatus.js

var HPandStatus = HPandStatus || (function () {

//  Campaign-Specific Settings -- Change these to suit your game.

  var HPBarNumber = 1,
    Is_NPC_Attribute = 'is_npc',
    TempHPAttribute = 'temp_hp',
    ReducedMaxHPAttribute = 'hp_max_reduced',
    Always_Start_Healing_From_Zero = true,

//  Status Marker Information -- A full list of statusmarker names is here:
//  https://wiki.roll20.net/API:Objects#Graphic_.28Token.2FMap.2FCard.2FEtc..29

    BloodiedMarker = 'half-heart',
    DyingMarker = 'sleepy',
    DeadMarker = 'dead',

/******************************************************************************/
/** End of Campaign-Specific Settings                                        **/
/******************************************************************************/
    version = '1.0',
    lastUpdate = 1485210467,
    CurrentHP = 'bar' + HPBarNumber + '_value',
    MaxHP = 'bar' + HPBarNumber + '_max',

    checkVersion = function () {
      log(`-- HPandStatus v${version} -- [${new Date(lastUpdate * 1000)}]`)
    },

    getHP = function (obj, prev) {
      if (!prev) prev = obj
      var isPC = (obj.get('represents') !== '' || getAttrByName(obj.get('represents'), Is_NPC_Attribute) === '0')
      var HP = {
        now: parseInt(obj.get(CurrentHP), 10) || 0,
        old: parseInt(prev[CurrentHP], 10) || 0,
        max: parseInt(obj.get(MaxHP), 10) || 0,
        temp: isPC ? parseInt(getAttrByName(obj.get('represents'), TempHPAttribute), 10) || 0 : 0,
        reducedmax: isPC ? parseInt(getAttrByName(obj.get('represents'), ReducedMaxHPAttribute), 10) || 0 : 0
      }
      HP.delta = Math.abs(HP.old - HP.now)
      HP.hurt = (HP.now < HP.old)
      HP.bloodied = Math.floor(HP.max / 2)
      HP.dead = isPC ? -HP.max : 0
      return HP
    },

    removeTurn = function (token) {
      var turnorder = JSON.parse(Campaign().get('turnorder'))
      if (turnorder.length === 0) return
      else Campaign().set('turnorder',
        JSON.stringify(_.reject(turnorder, function (turnObj) { return turnObj.id === token.id })))
    },

    onTokenChange = function (obj, prev) {
      var HP = getHP(obj, prev)
      if (!HP.max || !HP.delta) return

      // Handle (temp HP) damage
      if (HP.hurt && HP.temp) {
        var tempHPAttr = findObjs({
          _type: 'attribute',
          _characterid: obj.get('represents'),
          name: TempHPAttribute})[0]
        if (HP.temp < 0) HP.temp = 0
        else {
          var damageTaken = HP.delta
          HP.delta = Math.max(HP.delta - HP.temp, 0)
          HP.temp = Math.max(HP.temp - damageTaken, 0)
          HP.now = HP.old - HP.delta
        }
        tempHPAttr.set('current', HP.temp)
      }

      // Are we healing? Are we higher than we're supposed to be? Are we dead?
      HP.now = (Always_Start_Healing_From_Zero && !HP.hurt && HP.old < 0)
        ? HP.delta : HP.now
      HP.now = (HP.reducedmax && HP.now > HP.reducedmax)
        ? HP.reduced : HP.now
      HP.now = (HP.now > HP.max)
        ? HP.max : HP.now
      if (HP.now <= HP.dead) {
        HP.now = HP.dead
        removeTurn(obj)
      }
      var tokenStats = {
        [CurrentHP]: HP.now
      }
      obj.set(Object.assign(tokenStats, statusCheck(HP)))
    },

    onStatusChange = function (obj, prev) {
      var toCheck = [BloodiedMarker, DyingMarker, DeadMarker],
        oldStatus = prev['statusmarkers'].split(','),
        newStatus = obj.get('statusmarkers').split(',')
      if (_.intersection(oldStatus, toCheck) > _.intersection(newStatus, toCheck)) {
        var HP = getHP(obj)
        if (HP.max) obj.set(statusCheck(HP))
      }
    },

    statusCheck = function (HP) {
      return updatedToken = {
        ['status_' + BloodiedMarker]: (HP.now > HP.dead && HP.now <= HP.bloodied),
        ['status_' + DyingMarker]: (HP.now > HP.dead && HP.now <= 0),
        ['status_' + DeadMarker]: (HP.now <= HP.dead)
      }
    },

    registerEventHandlers = function () {
      on('change:token:' + CurrentHP, onTokenChange)
      on('change:token:statusmarkers', onStatusChange)
    }

  return {
    CheckInstall: checkVersion,
    RegisterEventHandlers: registerEventHandlers
  }
}())

on('ready', function () {
  'use strict'
  HPandStatus.CheckInstall()
  HPandStatus.RegisterEventHandlers()
})
