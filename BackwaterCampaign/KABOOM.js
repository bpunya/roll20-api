// Github: https://github.com/bpunya/roll20-api/blob/master/BackwaterCampaign/CombatMovement.js
// Author: PaprikaCC (Bodin Punyaprateep)
/* ************************************************************************** */

var KABOOM = KABOOM || (function () {
  // This script allows GMs to send things flying!
  // !KABOOM <min> <max> --<colour>
  //
  // <min> determines the closest radius that all objects will be pushed to.
  // <max> determines the furthest an object should fly (default is twice min)
  //
  var
    version = '1.0',
    lastUpdate = 1476996144,
    Chat_Formatting_START = '<div style="background-color:#ffffff; padding:5px; border-width:2px; border-style:solid;">' +
                            '<div style="border-width:2px; border-style:dotted; padding:5px">',
    Chat_Formatting_END = '</div>' +
                          '</div>',
    VFXcolours = []

  var s = state.BOOM
  if (!s) state.BOOM = {'vfx': true, 'ignore_size': false, 'default_colour': 'fire'}

  checkVersion = function () {
    log(`-- Combat Movement v${version} -- [${new Date(lastUpdate * 1000)}]`)
  }

  determineDistanceThrown = function (objArray) {
  }

  determineObjectWeight = function () {
  }

  findDrawings = function (obj) {
    drawingsArray = findObjs({
        _pageid: obj.get('pageid')
        _type: 'graphic',
    })
    return drawingArray
  }

  handleChatInput = function (msg) {
    var args = msg.split(/\s/)
    if (msg.type !== 'api' || !playerIsGM(msg.playerid) || args[0].toUpper() !== '!KABOOM') return
    if (msg.selected.length < 1) {
        printToChat(msg.who, 'Please select a token to designate the center of the explosion.')
        return
    }
    objectsThrown = findDrawings(msg.selected[0])
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
