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

    getHPStatus = function (obj, prev) {
      if (!prev) { prev = obj }
      var HP = {
        now: parseInt(obj.get(CurrentHPLocation), 10) || 0,
        old: parseInt(prev[CurrentHPLocation], 10) || 0,
        max: parseInt(obj.get(MaxHPLocation), 10) || 0,
        tmp: parseInt(getAttrByName(obj.get('represents'), TempHitPointsIn), 10) || 0,
        reduced: parseInt(getAttrByName(obj.get('represents'), ReducedMaxIn), 10) || 0
      }
      HP.delta = Math.abs(HP.now - HP.old)
      HP.hurt = (HP.now < HP.old)
      HP.bloodied = Math.floor(HP.max / 2) || 0
      HP.dead = (obj.get('represents') !== '') ? -HP.bloodied : 0
      return HP
    },

    removeTurn = function (obj) {
      var turnorder = JSON.parse(Campaign().get('turnorder'))
      if (turnorder.length === 0) return
      Campaign().set('turnorder', JSON.stringify(_.reject(turnorder, function (item) { return item.id === obj.id })))
    },

    tokenChange = function (obj, prev) {
      if (obj.get('isdrawing')) return
      var HP = getHPStatus(obj, prev)
      if (HP.max === 0 || HP.delta === 0) return
      // So we can set all attributes at once
      var target = {}
      // Handle healing while below 0
      if (ASSUME_HEALS && !HP.hurt && HP.old < 0) {
        HP.now = HP.delta
      }
      // Handle temp HP damage calc
      if (HP.hurt && HP.tmp !== 0) {
        var tempHPAttr = findObjs({
          _type: 'attribute',
          _characterid: obj.get('represents'),
          name: TempHitPointsIn})[0]
        if (HP.tmp < 0) {
          HP.tmp = 0
          tempHPAttr.set('current', HP.tmp)
        } else {
          var oldTmp = HP.tmp
          HP.tmp = Math.max(HP.tmp - HP.delta, 0)
          HP.delta = Math.max(HP.delta - oldTmp, 0)
          HP.now = (HP.old - HP.delta)
        }
        tempHPAttr.set('current', HP.tmp)
      }
      // Handle too much HP
      if (HP.now > HP.max) {
        HP.now = HP.max
      }
      if (HP.reduced && HP.now > HP.reduced) {
        HP.now = HP.reduced
      }
      target[CurrentHPLocation] = HP.now
      if (HP.now <= HP.dead) removeTurn(obj)
      obj.set(Object.assign(target, statusCheck(HP)))
    },

    statusChange = function (obj, prev) {
      var toCheck = [BloodiedMarker, DyingMarker, DeadMarker],
        oldStatus = prev['statusmarkers'].split(','),
        newStatus = obj.get('statusmarkers').split(',')
      if (_.intersection(oldStatus, toCheck) > _.intersection(newStatus, toCheck)) {
        var HP = getHPStatus(obj)
        obj.set(statusCheck(HP))
      }
    },

    statusCheck = function (HP) {
      // Status Marker Updates Now
      var target = {}
      if (HP.now <= 0 && HP.now > HP.dead) {
        target['status_' + DyingMarker] = true
      } else {
        target['status_' + DyingMarker] = false
      }
      if (HP.now <= HP.bloodied && HP.now > HP.dead) {
        target['status_' + BloodiedMarker] = true
      } else {
        target['status_' + BloodiedMarker] = false
      }
      if (HP.now <= HP.dead) {
        HP.now = HP.dead
        target[CurrentHPLocation] = HP.dead
        target['status_' + DeadMarker] = true
      } else {
        target['status_' + DeadMarker] = false
      }
      return target
    },

    registerEventHandlers = function () {
      on('change:token:' + CurrentHPLocation, tokenChange)
      on('change:token:statusmarkers', statusChange)
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
