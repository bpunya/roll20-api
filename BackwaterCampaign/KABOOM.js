// Github: https://github.com/bpunya/roll20-api/blob/master/BackwaterCampaign/KABOOM.js
// Author: PaprikaCC (Bodin Punyaprateep)
/* ************************************************************************** */

var KABOOM = KABOOM || (function () {
  // This script allows GMs to send things flying!
  // !KABOOM <min> <max> --<colour>
  //
  // <min> determines the closest radius that all objects will be pushed to.
  // <max> determines the furthest an object should fly (default is twice min)
  var
    version = '1.0',
    lastUpdate = 1476996144,
    Chat_Formatting_START = '<div style="background-color:#ffffff; padding:5px; border-width:2px; border-style:solid;">' +
                            '<div style="border-width:2px; border-style:dotted; padding:5px">',
    Chat_Formatting_END = '</div>' +
                          '</div>',
    VFXcolours = ['acid', 'blood', 'charm', 'death', 'fire', 'frost', 'holy', 'magic', 'slime', 'smoke', 'water']

  var s = state.BOOM
  if (!s) state.BOOM = {'vfx': true, 'ignore_size': false, 'default_colour': 'fire'}

  checkVersion = function () {
    log(`-- Combat Movement v${version} -- [${new Date(lastUpdate * 1000)}]`)
  }

  determineDistanceThrown = function (min, explosion_center, obj) {
      // find distance from center.
      // if it's within the min distance, go to the outside
  }

  determineObjectWeight = function (graphic) {
    var drawingWidth, drawingHeight, drawingArea
    const MAX = 1 // Smaller than 1 square = max distance moved
    const MIN = 9 // Larger than 9 squares = no distance moved
    drawingWidth = graphic.get('width') / 70
    drawingHeight = graphic.get('height') / 70
    drawingArea = drawingWidth * drawingHeight
    return MAX > drawingArea ? 1 : MIN < drawingArea ? 0 : -(drawingArea - 1) / 8 + 1
  }

  createExplosion = function (x, y, pageid, explosion_type = 'fire') {
    spawnFx(x, y, `explode-${explosion_type}`, pageid)
  }

  findDrawings = function (obj) {
    return findObjs({
        _pageid: obj.get('_pageid'),
        _type: 'graphic',
        isdrawing: true
    })
  }

  handleChatInput = function (msg) {
    var args = msg.split(/\s/)
    if (msg.type !== 'api' || !playerIsGM(msg.playerid) || args[0].toUpper() !== '!KABOOM') return
    switch (args[0]) {
      case '!KABOOM':
        if (msg.selected.length < 1) {
          printToChat(msg.who, 'Please select a token to designate the center of the explosion.')
          return
        }
        break
      default:
        showHelp(msg)
    }

    objectsThrown = findDrawings(msg.selected[0])
  }

  showHelp = function (msg) {
    var content = '' +
                  ''
    printToChat(msg, content)
  }

  printToChat = function (msg, content) {
    sendChat('Combat Movement', `/w ${msg.who} <br>` +
             content,
             null, {noarchive: true})
  }

  registerEventHandlers = function () {
    on('chat:message', handleChatInput)
  }

  return {
    CheckVersion: checkVersion,
    RegisterEventHandlers: registerEventHandlers
  }
}())

on('ready', function () {
  'use strict'
  KABOOM.CheckVersion()
  KABOOM.RegisterEventHandlers()
})
