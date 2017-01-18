// Github: https://github.com/bpunya/roll20-api/blob/master/BackwaterCampaign/HPandStatus.js
// Author: PaprikaCC (Bodin Punyaprateep)

// This script was adapted from the one originally created by The Aaron.
// You can find the original at:
// https://github.com/shdwjk/Roll20API/blob/master/TempHPAndStatus/TempHPAndStatus.js

var HPandStatus = HPandStatus || (function () {
  var version = '0.5',
    lastUpdate = 1480560786,
    HitPointBarNum = 1,
    TempHitPointsIn = 'temp_hp',
    ReducedMaxIn = 'hp_max_reduced',

    BloodiedMarker = 'half-heart',
    DyingMarker = 'sleepy',
    DeadMarker = 'dead',
    ASSUME_HEALS = true,

    CurrentHPLocation = 'bar' + HitPointBarNum + '_value',
    MaxHPLocation = 'bar' + HitPointBarNum + '_max',

    checkVersion = function () {
      log(`-- HPandStatus v${version} -- [${new Date(lastUpdate * 1000)}]`)
    },

    getHP = function (obj, prev) {
      if (!prev) { prev = obj }
      var HP = {
        now: parseInt(obj.get(CurrentHPLocation), 10) || 0,
        old: parseInt(prev[CurrentHPLocation], 10) || 0,
        max: parseInt(obj.get(MaxHPLocation), 10) || 0,
        tmp: parseInt(getAttrByName(obj.get('represents'), TempHitPointsIn), 10) || 0,
        reduced: parseInt(getAttrByName(obj.get('represents'), ReducedMaxIn), 10) || 0
      }
      HP.delta = Math.abs(HP.old - HP.now)
      HP.hurt = (HP.now < HP.old)
      HP.bloodied = Math.floor(HP.max / 2)
      HP.dead = (obj.get('represents') !== '') ? -HP.max : 0
      return HP
    },

    removeTurn = function (obj) {
      var turnorder = JSON.parse(Campaign().get('turnorder'))
      if (turnorder.length === 0) return
      Campaign().set('turnorder', JSON.stringify(_.reject(turnorder, function (item) { return item.id === obj.id })))
    },

    onTokenChange = function (obj, prev) {
      if (obj.get('isdrawing')) return
      var HP = getHP(obj, prev)
      if (HP.max === 0 || HP.delta === 0) return
      var target = {}

      // Handle (temp HP) damage
      if (HP.hurt && HP.tmp !== 0) {
        var tempHPAttr = findObjs({
          _type: 'attribute',
          _characterid: obj.get('represents'),
          name: TempHitPointsIn})[0]
        if (HP.tmp < 0) {
          HP.tmp = 0
        } else {
          var oldTmp = HP.tmp
          HP.tmp = Math.max(HP.tmp - HP.delta, 0)
          HP.delta = Math.max(HP.delta - oldTmp, 0)
          HP.now = HP.old - HP.delta
        }
        tempHPAttr.set('current', HP.tmp)
      }

      // Handle healing
      if (ASSUME_HEALS && !HP.hurt && HP.old < 0) {
        HP.now = HP.delta
      }
      if (HP.reduced && HP.now > HP.reduced) {
        HP.now = HP.reduced
      }
      if (HP.now > HP.max) {
        HP.now = HP.max
      }

      target[CurrentHPLocation] = HP.now
      if (HP.now <= HP.dead) removeTurn(obj)
      obj.set(Object.assign(target, statusCheck(HP)))
    },

    onStatusChange = function (obj, prev) {
      var toCheck = [BloodiedMarker, DyingMarker, DeadMarker],
        oldStatus = prev['statusmarkers'].split(','),
        newStatus = obj.get('statusmarkers').split(',')
      if (_.intersection(oldStatus, toCheck) > _.intersection(newStatus, toCheck)) {
        var HP = getHP(obj)
        if (HP.max !== 0) obj.set(statusCheck(HP))
      }
    },

    statusCheck = function (HP) {
      // Status Marker Updates Now
      var target = {}
      target['status_' + BloodiedMarker] = (HP.now > HP.dead && HP.now <= HP.bloodied)
      target['status_' + DyingMarker] = (HP.now > HP.dead && HP.now <= 0)
      target['status_' + DeadMarker] = (HP.now <= HP.dead)
      target[CurrentHPLocation] = (HP.now <= HP.dead) ? HP.dead : HP.now
      return target
    },

    registerEventHandlers = function () {
      on('change:token:' + CurrentHPLocation, onTokenChange)
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
