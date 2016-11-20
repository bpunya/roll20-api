// Github: https://github.com/bpunya/roll20-api/blob/master/BackwaterCampaign/KABOOM.js
// Author: PaprikaCC (Bodin Punyaprateep)
/* ************************************************************************** */

var KABOOM = KABOOM || (function () {
  // This script allows GMs to send things flying!
  // !KABOOM <min> <max> --<options>
  //
  // <min> determines the closest radius that all objects will be pushed to.
  // <max> determines the furthest an object should fly (default is twice min)
  var
    version = '1.0',
    lastUpdate = 1476996144,
    Chat_Formatting_START = '<div style="background-color:#ffffff; padding:5px; border-width:2px; border-style:solid;">' +
                            '<div style="border-width:2px; border-style:dotted; padding:5px">',
    Chat_Formatting_END = '</div>' +
                          '</div>'

  const VFXtypes = ['acid', 'blood', 'charm', 'death', 'fire', 'frost', 'holy', 'magic', 'slime', 'smoke', 'water']

  var s = state.BOOM
  if (!s) state.BOOM = {'vfx': true, 'ignore_size': false, 'default_type': 'fire', 'same_layer_only': true}

  // Run on launch
  checkVersion = function () {
    log(`-- Combat Movement v${version} -- [${new Date(lastUpdate * 1000)}]`)
  }

  // Creates the explosion VFX
  createExplosion = function (x, y, pageid, explosion_type = s.default_colour) {
    spawnFx(x, y, `explode-${explosion_type}`, pageid)
  }

  // Returns the 'weight' of the object (to modify distance thrown) from 0 to 1.
  determineObjectWeight = function (graphic) {
    var drawingWidth, drawingHeight, drawingArea
    const MAX = 1 // Smaller than 1 square = max distance moved
    const MIN = 9 // Larger than 9 squares = no distance moved
    drawingWidth = graphic.get('width') / 70
    drawingHeight = graphic.get('height') / 70
    drawingArea = drawingWidth * drawingHeight
    return MAX > drawingArea ? 1 : MIN < drawingArea ? 0 : -(drawingArea - 1) / 8 + 1
  }

  // Returns an array of all valid drawings to move
  findDrawings = function (explosion_center) {
    return filterObjs(function (graphic) {
      if (graphic.get('_type' === 'graphic') &&
          graphic.get('_pageid') === explosion_center.get('_pageid') &&
          graphic.get('isdrawing' === true) &&
          s.same_layer_only ? (graphic.get('layer') === explosion_center.get('layer')) : true
          ) return true
    })
  }

  // Returns an array of the input object's coordinates
  getCoordinates = function (obj) {
    return [obj.get('left'), obj.get('top')]
  }

  // Handles chat input (???)
  handleChatInput = function (msg) {
    var args = msg.split(/\s/)
    if (msg.type !== 'api' || !playerIsGM(msg.playerid) || args[0].toUpper() !== '!KABOOM') return
    switch (args[0]) {
      case '!KABOOM':
        var options = parseOptions(args.slice(1))
        if (!options.hasOwnProperty('min')) return
        if (msg.selected.length < 1) printToChat(msg.who, 'Please select one token to designate the center of the explosion.'); return
        var explosion_center = getObj('graphic'. msg.selected[0])
        var objectsThrown = findDrawings(explosion_center)
        for (let i = 0; i < objectsThrown.length; i++) {
          moveGraphic(objectsThrown[i], explosion_center, options)
        }
        break
    }
  }

  // Handles figuring out how far to throw the object and where
  moveGraphic = function (flying_object, explosion_center, options) {
    var obj_coords = getCoordinates(flying_object)
    var explosion_coords = getCoordinates(explosion_center)
  }

  // Returns an object with all of the commands inside.
  parseOptions = function (input) {
    var settings_unchanged = true
    var options = {}
    if (input.length === 1) { showHelp('gm'); return }
    if (parseInt(input[0], 10).toString() === input[0]) options.min = input[0]
    if (parseInt(input[1], 10).toString() === input[1]) options.max = input[1]
    for (let i = 0, option_found = false; i < input.length; i++) {
      if (input[i].slice(0, 1) !== '--') continue
      switch (input[i].slice(2)) {
        case 'type':
          if (VFXtypes.includes(input[i + 1])) options.type = input[i + 1]
          break
        case 'default':
          switch (input[i + 1]) {
            case 'type':
              if (VFXtypes.includes(input[i + 2])) s.default_type = input[i + 2]
              printToChat('gm', `The default explosion type is now ${input[i + 2]}.`)
              settings_unchanged = false
              break
            case 'vfx':
              if (input[i + 2] === 'on') s.vfx = true
              else if (input[i + 2] === 'off') s.vfx = false
              printToChat('gm', `VFX are now ${s.vfx ? 'enabled' : 'disabled'} on explosions.`)
              settings_unchanged = false
              break
            case 'same-layer':
              if (input[i + 2] === 'on') s.same_layer_only = true
              else if (input[i + 2] === 'off') s.same_layer_only = false
              printToChat('gm', `Objects ${s.same_layer_only ? 'must be' : "don't have to be"} on the same layer as the explosion token now.`)
              settings_unchanged = false
              break
            case 'ignore-size':
              if (input[i + 2] === 'on') s.ignore_size = true
              else if (input[i + 2] === 'off') s.ignore_size = false
              printToChat('gm', `An object's size is now ${s.ignore_size ? 'ignored' : 'included'} in distance calculations.`)
              settings_unchanged = false
              break
          }
          break
      }
    }
    if (Object.keys(options).length < 1 && settings_unchanged ) showHelp('gm')
    return options
  }

  // Shows help!
  showHelp = function (target) {
    var content = '' +
                  '' +
                  ''
    printToChat(target, content)
  }

  printToChat = function (target, content) {
    sendChat('Combat Movement', `/w ${target} <br>` +
             Chat_Formatting_START + content + Chat_Formatting_END,
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
