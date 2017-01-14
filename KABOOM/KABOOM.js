// Github: https://github.com/bpunya/roll20-api/blob/master/BackwaterCampaign/KABOOM.js
// Author: PaprikaCC (Bodin Punyaprateep)
/* ************************************************************************** */

var KABOOM = KABOOM || (function () {
  // This script allows GMs to send things flying!
  // !KABOOM <min> <max> --<options>
  var explosion_ratio = 2
  // <min> determines the closest radius that all objects will be pushed to.
  // <max> determines the furthest an object should fly relative to the min value
  // (default is the explosion_ratio)
  var version = '1.0',
    lastUpdate = 1479716508,
    Chat_Formatting_START = '<div style="background-color:#ffffff; padding:5px; border-width:2px; border-style:solid;">' +
                            '<div style="border-width:2px; border-style:dotted; padding:5px">',
    Chat_Formatting_END = '</div>' +
                          '</div>',
    VFXtypes = ['acid', 'blood', 'charm', 'death', 'fire', 'frost', 'holy', 'magic', 'slime', 'smoke', 'water'],
    s = state.KABOOM;

  // Run on launch
  var checkVersion = function () {
    if (!s) { state.KABOOM = {'vfx': true, 'ignore_size': false, 'default_type': 'fire', 'same_layer_only': true, 'min_size': 1, 'max_size': 9} }
    log(`-- KABOOM v${version} -- [${new Date(lastUpdate * 1000)}]`)
  }

  // Creates the explosion VFX
  // Requires a coordinate array.
  var createExplosion = function (explosion_center, explosion_type) {
    if (explosion_type === undefined) explosion_type = s.default_type
    var coordinate_array = getCoordinates(explosion_center)
    var pageid = explosion_center.get('_pageid')
    spawnFx(coordinate_array[0], coordinate_array[1], `explode-${explosion_type}`, pageid)
  }

  // Returns an array of all valid drawings to move
  var findDrawings = function (explosion_center) {
    var pageID = explosion_center.get('_pageid')
    var layer = explosion_center.get('layer')
    return findObjs({
        '_type': 'graphic',
        '_pageid': pageID,
        'isdrawing': true,
        'layer': s.same_layer_only ? layer : true
      })
  }

  // Returns an array of the input object's coordinates
  var getCoordinates = function (obj) {
    return [obj.get('left'), obj.get('top')]
  }

  // Returns the 'weight' of the object (to modify distance thrown) from 0 to 1
  // If the weight is lower than min_threshold, the returned value is always 1
  // If the weight is higher than max_threshold, the returned value is always 0
  var getWeight = function (weight, min_threshold, max_threshold) {
    return min_threshold > max_threshold ? 1
            : weight < min_threshold ? 1
            : weight > max_threshold ? 0
            : -(weight - min_threshold) / (max_threshold - min_threshold) + 1
  }

  // Handles chat input
  var handleChatInput = function (msg) {
    if (msg.type !== 'api' || !playerIsGM(msg.playerid)) return
    var args = msg.content.split(/\s/)
    switch (args[0]) {
      case '!KABOOM':
        // parseOptions actually handles all functions related to the chat command
        // I think that I should probably change this
        var options = parseOptions(args.slice(1))
        if (!options.hasOwnProperty('min')) return

        // Can we make an explosion?
        if (!msg.selected) { printToChat(msg.who, 'Please select one token to designate the center of the explosion.'); return }

        // Prepare objects
        var explosion_center = getObj('graphic', msg.selected[0]._id)
        var objectsThrown = findDrawings(explosion_center)

        // Do the fun stuff
        if (s.vfx) createExplosion(explosion_center, options.type)
        objectsThrown.map(function (object) { moveGraphic(object, explosion_center, options) })
    }
  }

  // Handles figuring out how far to throw the object and where
  var moveGraphic = function (flying_object, explosion_center, options) {
    var obj1, obj2, d_x, d_y, distance, distance_weight, f_obj_size, item_weight, new_distance,
      theta, new_d_x, new_d_y, new_x, new_y, page, page_scale, page_max_x, page_max_y

    if (flying_object.id === explosion_center.id) return

    // Get page information
    page = getObj('page', explosion_center.get('_pageid'))
    page_scale = 70 / page.get('scale_number')
    page_max_x = page.get('width') * 70
    page_max_y = page.get('height') * 70

    // Separate objects from coords
    obj1 = getCoordinates(explosion_center)
    obj2 = getCoordinates(flying_object)

    // Start math calculations
    d_x = (obj2[0] - obj1[0])
    d_y = (obj2[1] - obj1[1])
    distance = Math.sqrt(Math.pow(d_x, 2) + Math.pow(d_y, 2))

    // Calculate new distance
    if (!options.max) options.max = options.min * explosion_ratio
    distance_weight = getWeight(distance, options.min * page_scale, options.max * page_scale)
    f_obj_size = flying_object.get('width') * flying_object.get('height') / 4900
    item_weight = getWeight(f_obj_size, s.min_size, s.max_size)
    if (distance_weight === 0 || item_weight === 0) return
    new_distance = distance + (options.min * page_scale * distance_weight * (s.ignore_size ? 1 : item_weight))

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
  var parseOptions = function (input) {
    var settings_unchanged = true
    var options = {}
    if (parseInt(input[0], 10).toString() === input[0]) options['min'] = parseInt(input[0], 10)
    if (parseInt(input[1], 10).toString() === input[1]) options['max'] = parseInt(input[1], 10)

    // Start Main Loop!
    for (var i = 0; i < input.length; i++) {
      if (input[i].slice(0, 2) !== '--') continue
      // We check here if they want a specific type. Last command wins.
      if (_.contains(VFXtypes, input[i].slice(2))) options['type'] = input[i].slice(2)
      switch (input[i].slice(2)) {

        case 'type':
          if (_.contains(VFXtypes, input[i + 1])) s.default_type = input[i + 1]
          printToChat('gm', `The default explosion type is now ${s.default_type}.`)
          settings_unchanged = false
          break

        case 'vfx':
          if (input[i + 1] === 'on') s.vfx = true
          else if (input[i + 1] === 'off') s.vfx = false
          printToChat('gm', `VFX are now ${s.vfx ? 'enabled' : 'disabled'} on explosions.`)
          settings_unchanged = false
          break

        case 'same-layer':
          if (input[i + 1] === 'on') s.same_layer_only = true
          else if (input[i + 1] === 'off') s.same_layer_only = false
          printToChat('gm', `Objects ${s.same_layer_only ? 'must be' : "don't have to be"} on the same layer as the explosion token now.`)
          settings_unchanged = false
          break

         case 'ignore-size':
          if (input[i + 1] === 'on') s.ignore_size = true
          else if (input[i + 1] === 'off') s.ignore_size = false
          printToChat('gm', `An object's size is now ${s.ignore_size ? 'ignored' : 'included'} in distance calculations.`)
          settings_unchanged = false
          break

        case 'min-size':
          if (parseInt(input[i + 1], 10).toString() === input[i + 2]) s.min_size = parseInt(input[i + 1], 10)
          printToChat('gm', `All objects smaller than ${s.min_size} square(s) are now considered light.`)
          settings_unchanged = false
          break

        case 'max-size':
          if (parseInt(input[i + 1], 10).toString() === input[i + 1]) s.max_size = parseInt(input[i + 1], 10)
          printToChat('gm', `All objects larger than ${s.max_size} square(s) are now considered too heavy to move.`)
          settings_unchanged = false
          break
      }
    } // End Main Loop!
    if (Object.keys(options).length < 1 && settings_unchanged) showHelp('gm')
    return options
  }

  // Shows help!
  var showHelp = function (target) {
    var content = 'This is supposed to be a help menu.' +
                  'But I forgot to add a real one.'
    printToChat(target, content)
  }

  // Pre-formatted sendChat function.
  var printToChat = function (target, content) {
    sendChat('Combat Movement', `/w ${target} <br>` +
             Chat_Formatting_START + content + Chat_Formatting_END,
             null, {noarchive: true})
  }

  var registerEventHandlers = function () {
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
