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

  var s = state.KABOOM
  if (!s) state.KABOOM = {'vfx': true, 'ignore_size': false, 'default_type': 'fire', 'same_layer_only': true, 'min_size': 1, 'max_size': 9}

  // Run on launch
  checkVersion = function () {
    log(`-- Combat Movement v${version} -- [${new Date(lastUpdate * 1000)}]`)
  }

  // Creates the explosion VFX
  // Requires a coordinate array.
  createExplosion = function (coordinate_array, pageid, explosion_type = s.default_colour) {
    spawnFx(coordinate_array[0], coordinate_array[1], `explode-${explosion_type}`, pageid)
  }

  // Returns the 'weight' of the object (to modify distance thrown) from 0 to 1
  // If the weight is lower than min_threshold, the returned value is always 1
  // If the weight is higher than max_threshold, the returned value is always 0
  determineWeight = function (weight, min_threshold, max_threshold) {
    return min_threshold > max_threshold ? 1 : weight < min_threshold ? 1 : weight > max_threshold ? 0 : -(weight - min_threshold) / (max_threshold - min_threshold) + 1
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

  // Handles chat input
  handleChatInput = function (msg) {
    var args = msg.split(/\s/)
    if (msg.type !== 'api' || !playerIsGM(msg.playerid) || args[0].toUpper() !== '!KABOOM') return
    switch (args[0]) {
      case '!KABOOM':
        // parseOptions actually handles all functions related to the chat command
        // I think that I should probably change this
        var options = parseOptions(args.slice(1))
        if (!options.hasOwnProperty('min')) return

        // Can we make an explosion?
        if (msg.selected.length < 1) { printToChat(msg.who, 'Please select one token to designate the center of the explosion.'); return }

        // Prepare objects
        var explosion_center = getObj('graphic'. msg.selected[0])
        var objectsThrown = findDrawings(explosion_center)

        // Do we need to explode?
        if (s.vfx) createExplosion(getCoordinates(explosion_center), explosion_center.get('_pageid'), options.type)

        // Main loop to make things move
        for (let i = 0; i < objectsThrown.length; i++) {
          moveGraphic(objectsThrown[i], explosion_center, options)
        } // End main loop
    }
  }

  // Handles figuring out how far to throw the object and where
  moveGraphic = function (flying_object, explosion_center, options) {
    var obj1, obj2, d_x, d_y, distance, distance_weight, f_obj_size, item_weight, new_distance,
      theta, new_d_x, new_d_y, new_x, new_y, page, page_scale, page_max_x, page_max_y

    // Get page information
    page = getObj('page', explosion_center.get('_pageid'))
    page_scale = 70 / page.get('scale_number')
    page_max_x = page.get('width') * 70
    page_max_y = page.get('height') * 70

    // Separate objects from coords
    obj1 = getCoordinates(explosion_center)
    obj2 = getCoordinates(flying_object)

    // Start math calculations
    d_x = obj2[0] - obj1[0]
    d_y = obj2[1] - obj1[1]
    distance = Math.sqrt(d_x ^ 2 + d_y ^ 2)

    // Calculate new distance
    if (!options.max) options.max = options.min * 2
    distance_weight = getWeight(distance, options.min * page_scale, options.max * page_scale)
    f_obj_size = flying_object.get('width') * flying_object.get('height') / 4900
    item_weight = getWeight(f_obj_size, s.min_size, s.max_size)
    if (distance_weight === 0 || item_weight === 0) return
    new_distance = distance + (options.min * page_scale * distance_weight * s.ignore_size ? 1 : item_weight)

    // Calculate new location
    theta = Math.atan2(d_y, d_x)
    new_d_y = Math.sin(theta) * new_distance
    new_d_x = Math.cos(theta) * new_distance
    new_y = obj1[1] + new_d_y
    new_x = obj1[0] + new_d_x

    // QA STUFF HERE
    new_x = new_x > page_max_x ? page_max_x : new_x < 0 ? 0 : new_x
    new_y = new_y > page_max_y ? page_max_y : new_y < 0 ? 0 : new_y

    // Time to move
    flying_object.set({'left': new_x, 'top': new_y})
  }

  // Returns an object with all of the commands inside.
  // This functionality should probably go back to handleChatInput
  parseOptions = function (input) {
    var option_found = true
    var options = {}
    if (input.length === 1) { showHelp('gm'); return }
    if (parseInt(input[0], 10).toString() === input[0]) options.min = parseInt(input[0], 10)
    if (parseInt(input[1], 10).toString() === input[1]) options.max = parseInt(input[1], 10)
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
              option_found = false
              break
            case 'vfx':
              if (input[i + 2] === 'on') s.vfx = true
              else if (input[i + 2] === 'off') s.vfx = false
              printToChat('gm', `VFX are now ${s.vfx ? 'enabled' : 'disabled'} on explosions.`)
              option_found = false
              break
            case 'same-layer':
              if (input[i + 2] === 'on') s.same_layer_only = true
              else if (input[i + 2] === 'off') s.same_layer_only = false
              printToChat('gm', `Objects ${s.same_layer_only ? 'must be' : "don't have to be"} on the same layer as the explosion token now.`)
              option_found = false
              break
            case 'ignore-size':
              if (input[i + 2] === 'on') s.ignore_size = true
              else if (input[i + 2] === 'off') s.ignore_size = false
              printToChat('gm', `An object's size is now ${s.ignore_size ? 'ignored' : 'included'} in distance calculations.`)
              option_found = false
              break
            case 'min-size':
              if (parseInt(input[i + 2], 10).toString() === input[i + 2]) s.min_size = parseInt(input[i + 2], 10)
              printToChat('gm', `All objects smaller than ${s.min_size} square(s) are now considered light.`)
              option_found = false
              break
            case 'max-size':
              if (parseInt(input[i + 2], 10).toString() === input[i + 2]) s.max_size = parseInt(input[i + 2], 10)
              printToChat('gm', `All objects larger than ${s.max_size} square(s) are now considered too heavy to move.`)
              option_found = false
              break
          }
      }
    }
    if (Object.keys(options).length < 1 && option_found) showHelp('gm')
    return options
  }

  // Shows help!
  showHelp = function (target) {
    var content = '' +
                  '' +
                  ''
    printToChat(target, content)
  }

  // Pre-formatted sendChat function.
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
