// Github: https://github.com/bpunya/roll20-api/blob/master/BackwaterCampaign/KABOOM.js
// Author: PaprikaCC (Bodin Punyaprateep)
/* ************************************************************************** */

var KABOOM = KABOOM || (function () {

  // This script allows GMs to send things flying!
  // !KABOOM <minRange> <maxRange> --<options>
  var explosion_ratio = 2
  // <minRange> determines the closest radius that all objects will be pushed to.
  // <maxRange> determines the furthest an object should fly.
  // (default is the explosion_ratio)

  var version = '1.0',
    lastUpdate = 1485211467,
    Chat_Formatting_START = '<div style="background-color:#ffffff; padding:5px; border-width:2px; border-style:solid;">' +
                            '<div style="border-width:2px; border-style:dotted; padding:5px">',
    Chat_Formatting_END = '</div>' +
                          '</div>',
    VFXtypes = ['acid', 'blood', 'charm', 'death', 'fire', 'frost', 'holy', 'magic', 'slime', 'smoke', 'water'],
    Layers = ['objects', 'map'],
    defaultState = {'vfx': true, 'ignore_size': false, 'default_type': 'fire', 'same_layer_only': true, 'min_size': 1, 'max_size': 9},
    s = state.KABOOM

  // Run on launch
  var checkVersion = function () {
    if (!s) { state.KABOOM = defaultState }
    log(`-- KABOOM v${version} -- [${new Date(lastUpdate * 1000)}]`)
  }

/** This is the function that is exposed externally. You can call it in other
 ** scripts (as long as this is installed) with "KABOOM.NOW(param1, param2)"
 ** This function takes two parameters.
 **    1. An object containing the specifications of the explosion structured as such.
 **         object = {
 **           minRange: <any number>    // REQUIRED - Determines the min radius of the explosion
 **           maxRange: <any number>    // Not required - Determines max radius of the explosion
 **           type: <a VFX colour type> // Not required - Determines explosion's colour
 **         }
 **
 **    2. A Roll20 graphic object -OR- an object containing the location information, structured as such.
 **         object = {
 **           position: [X_coordinate, Y_coordinate]               // REQUIRED - May not be outside of map boundaries
 **           pageid: <a pageid>                                   // Not required - Defaults to the current player page
 **           layer: <the layer to search for affected objects on> // Not required - Defaults to object/token layer
 **         }
 **
 ** An example function call would be:
 **   var explosionSize = { minRange: 15 }
 **   var explosionLocation = {
 **     pageid: K1-fk2ksbt7sjlsbn
 **     position: [Math.floor((Math.random()*1000) + 1), Math.floor((Math.random()*1000) + 1)]
 **   }
 **   KABOOM.NOW(explosionSize, explosionLocation)
 **
 ** What this does is create an explosion with a minimum effect range of 15 units (scales to the page),
 ** at a random location on the page (if it is within page boundaries). The explosion is by default
 ** 'fire red', it will affect only objects on the token/object layer and the maximum range is 30 units.
 **/

  var NOW = function (rawOptions, rawCenter) {
    var options = verifyOptions(rawOptions)
    var explosion_center = verifyObject(rawCenter)
    if (!options.min || !explosion_center.position) return
    var affectedObjects = findDrawings(explosion_center)
    for (var i = 0; i < affectedObjects.length; i++) {
      if (moveGraphic(affectedObjects[i], explosion_center, options) === 'failed') {
        break
      }
    }
    if (s.vfx) createExplosion(explosion_center, options.type)
  }

/****************************************************************************/
/*********************** END OF EXPOSED FUNCTION ****************************/
/****************************************************************************/

  // Creates the explosion VFX
  var createExplosion = function (explosion_center, explosion_type) {
    if (explosion_type === undefined) explosion_type = s.default_type
    spawnFx(explosion_center.position[0], explosion_center.position[1], `explode-${explosion_type}`, explosion_center.pageid)
  }

  // Returns an array of all valid drawings to move
  var findDrawings = function (explosion_center) {
    return findObjs({
      '_type': 'graphic',
      '_pageid': explosion_center.pageid,
      'isdrawing': true,
      'layer': s.same_layer_only ? explosion_center.layer : true
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
        var options = parseOptions(args.slice(1))
        if (!options.hasOwnProperty('min')) return
        if (!msg.selected) {
          printToChat(msg.who, 'Please select one token to designate the center of the explosion.')
          return
        }
        // Explosion now!
        NOW(options, getObj('graphic', msg.selected[0]._id))
    }
  }

  // Handles figuring out how far to throw the object and where
  var moveGraphic = function (flying_object, explosion_center, options) {
    var obj1, obj2, d_x, d_y, distance, distance_weight, f_obj_size, item_weight, new_distance,
      theta, new_d_x, new_d_y, new_x, new_y, page, page_scale, page_max_x, page_max_y

    if (flying_object.id === explosion_center.id) return

    // Get page information
    page = getObj('page', explosion_center.pageid)
    page_scale = 70 / page.get('scale_number')
    page_max_x = page.get('width') * 70
    page_max_y = page.get('height') * 70

    // Separate objects from coords
    obj1 = [explosion_center.position[0], explosion_center.position[1]]
    obj2 = getCoordinates(flying_object)

    // ARE OUR COORDS OKAY?
    if (obj1[0] < 0 || obj1[1] < 0 ||
      obj1[0] > page_max_x || obj1[1] > page_max_y ||
      obj2[0] < 0 || obj2[1] < 0 ||
      obj2[0] > page_max_x || obj2[1] > page_max_y)
    {
      log('Coordinate information is out of bounds. KABOOM will not activate')
      return 'failed'
    }

    // Start math calculations
    d_x = (obj2[0] - obj1[0])
    d_y = (obj2[1] - obj1[1])
    distance = Math.sqrt(Math.pow(d_x, 2) + Math.pow(d_y, 2))

    // Calculate new distance
    if (!options.maxRange) options.maxRange = options.minRange * explosion_ratio
    item_weight = getWeight(flying_object.get('width') * flying_object.get('height') / 4900, s.min_size, s.max_size)
    distance_weight = getWeight(distance, options.min * page_scale, options.maxRange * page_scale)
    if (distance_weight === 0 || item_weight === 0) return
    new_distance = distance + (options.minRange * page_scale * distance_weight * (s.ignore_size ? 1 : item_weight))

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

  // Returns an object with options parsed from chat messages.
  var parseOptions = function (input) {
    var settings_unchanged = true
    var options = {}
    if (parseInt(input[0], 10).toString() === input[0]) options['minRange'] = parseInt(input[0], 10)
    if (parseInt(input[1], 10).toString() === input[1]) options['maxRange'] = parseInt(input[1], 10)

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
          if (parseInt(input[i + 1], 10).toString() === input[i + 1]) s.min_size = parseInt(input[i + 1], 10)
          printToChat('gm', `All objects smaller than ${s.min_size} square(s) are now considered light.`)
          settings_unchanged = false
          break

        case 'max-size':
          if (parseInt(input[i + 1], 10).toString() === input[i + 1]) s.max_size = parseInt(input[i + 1], 10)
          printToChat('gm', `All objects larger than ${s.max_size} square(s) are now considered too heavy to move.`)
          settings_unchanged = false
          break

        case 'help':
          var helpRequested = true
          break
      }
    } // End Main Loop!
    if ((Object.keys(options).length < 1 && settings_unchanged) || helpRequested) showHelp('gm')
    return options
  }

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

  // ***************************************************************************
  // This function just verifies that our options are correct

  var verifyOptions = function (options) {
    return cleanedOptions = {
      minRange: (parseInt(options.minRange, 10) === options.minRange) ? options.minRange : false,
      maxRange: (parseInt(options.maxRange, 10) === options.maxRange) ? options.maxRange : options.minRange * explosion_ratio,
      type: (_.contains(VFXtypes, options.type)) ? options.type : s.default_type
    }
  }

  // ***************************************************************************
  // We use this function to verify that the object is formatted properly for
  // our other functions. It returns an object with a coordinate array and
  // pageid property. It only accepts objects in two forms:
  //     1. A Roll20 token object
  //     2. An object with a position array and pageid property

  var verifyObject = function (obj) {
    if (typeof obj.get == 'function') {
      return cleanObject = {
        'position': getCoordinates(obj),
        'pageid': obj.get('_pageid'),
        'layer': obj.get('layer'),
        'id': obj.id
    }}
    else {
      return cleanObject = {
        'layer': _.contains(Layers, obj.layer) ? obj.layer : 'objects',
        'pageid': obj.pageid ? obj.pageid : Campaign().get('playerpageid'),
        'position': Array.isArray(obj.position) ? obj.position : false,
        'id': false
  }}}

  var registerEventHandlers = function () {
    on('chat:message', handleChatInput)
  }

  return {
    NOW: NOW,
    CheckVersion: checkVersion,
    RegisterEventHandlers: registerEventHandlers
  }
}())

on('ready', function () {
  'use strict'
  KABOOM.CheckVersion()
  KABOOM.RegisterEventHandlers()
})
