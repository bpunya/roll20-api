// Github: https://github.com/bpunya/roll20-api/blob/master/TruePageCopy/TruePageCopy.js
// Author: PaprikaCC (Bodin Punyaprateep)

var TruePageCopy = TruePageCopy || (function () {
  const version = '1.0'
  const lastUpdate = 1489608161
  const defaultState = {
    active: false,
    secureStr: false,
    destinationPage: false,
    sourcePage: false,
    workQueue: []
  }

  var checkVersion = function () {
    if (!state.PageCopy) clearState()
    log(`-- True Page Copy v${version} -- [${new Date(lastUpdate * 1000)}]`)
    log(state.PageCopy)
  }

  var checkExistingWork = function () {
    if (state.PageCopy.workQueue.length) {
      printToChat('gm', `Continuing interrupted copying of ${getObj('page', state.PageCopy.sourcePage).get('name')}`)
      if(copyObjectsToDestination() == 'success') {
        state.PageCopy = defaultState
      }
    }
    if (state.PageCopy.active && !state.PageCopy.workQueue.length) {
      state.PageCopy = defaultState
    }
  }

  var changeDestinationPage = function (source, destination) {
    destination.set({
      name: `Copy of ${source.get('name')}`,
      showgrid: source.get('showgrid'),
      showdarkness: source.get('showdarkness'),
      width: source.get('width'),
      height: source.get('height'),
      snapping_increment: source.get('snapping_increment'),
      grid_opacity: source.get('grid_opacity'),
      fog_opacity: source.get('fog_opacity'),
      background_color: source.get('background_color'),
      gridcolor: source.get('gridcolor'),
      grid_type: source.get('grid_type'),
      scale_number: source.get('scale_number'),
      gridlabels: source.get('gridlabels'),
      diagonaltype: source.get('diagonaltype'),
      lightupdatedrop: source.get('lightupdatedrop'),
      lightenforcelos: source.get('lightenforcelos'),
      lightrestrictmove: source.get('lightrestrictmove'),
      lightglobalillum: source.get('lightglobalillum')
    })
  }

  var clearState = function () {
    state.PageCopy = defaultState
  }

  var createSecureButton = function (target) {
    var randStr = getRandomString(32)
    state.PageCopy.secureStr = randStr
    var output = `Are you sure you want to copy ${getObj('page', state.PageCopy.sourcePage).get('name')} ` +
                 `to ${getObj('page', state.PageCopy.destinationPage).get('name')}? <br>` +
                 `This will override all existing graphics and modify the current page to fit the source. <br>` +
                 `[Yes](!pagecopy ${randStr})` +
                 `[No](!pagecopy decline)`
    printToChat(target, output)
  }

  var copyObjectsToDestination = function () {
    var workQueue = () => {
      if (state.PageCopy.workQueue.length) {
        var part = state.PageCopy.workQueue.shift()
        createObj(part.type, part.data)
        _.delay(workQueue, 10)
      } else {
        printToChat('gm', `Finished copying the ${getObj('page', state.PageCopy.sourcePage).get('name')} page.`)
        return 'success'
      }
    }
    workQueue()
  }

  var handleChatInput = function (msg) {
    if (msg.type !== 'api' || !playerIsGM(msg.playerid)) return
    var args = msg.content.split(/\s/)
    var target = msg.who.slice(0, -5)
    switch (args[0]) {

      case '!pagecopy':
        if (!args[1]) {
          if (!state.PageCopy.sourcePage) {
            state.PageCopy.sourcePage = getGmPage(target)
            printToChat(target, `Setting the source page to ${state.PageCopy.sourcePage}`)
          } else if (state.PageCopy.sourcePage === state.PageCopy.destinationPage) {
            printToChat(target, 'You must select a different source and destination page.')
          } else if (!state.PageCopy.active) {
            state.PageCopy.destinationPage = getGmPage(target)
            createSecureButton(target)
          } else printToChat(target, `Script is currently active. Please use !pagecopy reset if you want to stop.`)
        }
        else {
          switch (args[1]) {

            case state.PageCopy.secureStr:
              printToChat(target, 'Verifying...')
              preparePageCopy(state.PageCopy.sourcePage, state.PageCopy.destinationPage)
              state.PageCopy.secureStr = false
              break

            case 'decline':
              if (state.PageCopy.secureStr) {
                state.PageCopy.secureStr = false
                state.PageCopy.destinationPage = false
                printToChat(target, `Copying declined. Please choose another destination.`)
              }
              break

            case 'source':
              state.PageCopy.sourcePage = getGmPage(target)
              printToChat(target, `Setting the source page to ${state.PageCopy.sourcePage}`)
              break

            case 'help':
              showHelp()
              break

            case 'reset':
              printToChat(target, 'Resetting internal state.')
              clearState()
              break
          }
        }
    }
  }

  var getGmPage = function(playerName) {
    return findObjs({
      _type: 'player',
      _displayname: playerName
      })[0].get('_lastpage')
  }

  var getGraphicData = function (obj, pageid) {
    var safeimgsrc = obj.get('imgsrc').replace(/\/max\./g, `/thumb.`).replace(/\/med\./g, `/thumb.`)
    return {
      _pageid: pageid,
      imgsrc: safeimgsrc,
      bar1_link: obj.get('bar1_link'),
      bar2_link: obj.get('bar2_link'),
      bar3_link: obj.get('bar3_link'),
      represents: obj.get('represents'),
      left: obj.get('left'),
      top: obj.get('top'),
      width: obj.get('width'),
      height: obj.get('height'),
      rotation: obj.get('rotation'),
      layer: obj.get('layer'),
      isdrawing: obj.get('isdrawing'),
      flipv: obj.get('flipv'),
      fliph: obj.get('fliph'),
      name: obj.get('name'),
      gmnotes: obj.get('gmnotes'),
      controlledby: obj.get('controlledby'),
      bar1_value: obj.get('bar1_value'),
      bar2_value: obj.get('bar2_value'),
      bar3_value: obj.get('bar3_value'),
      bar1_max: obj.get('bar1_max'),
      bar2_max: obj.get('bar2_max'),
      bar3_max: obj.get('bar3_max'),
      aura1_radius: obj.get('aura1_radius'),
      aura2_radius: obj.get('aura2_radius'),
      aura1_color: obj.get('aura1_color'),
      aura2_color: obj.get('aura2_color'),
      aura1_square: obj.get('aura1_square'),
      aura2_square: obj.get('aura2_square'),
      tint_color: obj.get('tint_color'),
      statusmarkers: obj.get('statusmarkers'),
      showname: obj.get('showname'),
      showplayers_name: obj.get('showplayers_name'),
      showplayers_bar1: obj.get('showplayers_bar1'),
      showplayers_bar2: obj.get('showplayers_bar2'),
      showplayers_bar3: obj.get('showplayers_bar3'),
      showplayers_aura1: obj.get('showplayers_aura1'),
      showplayers_aura2: obj.get('showplayers_aura2'),
      playersedit_name: obj.get('playersedit_name'),
      playersedit_bar1: obj.get('playersedit_bar1'),
      playersedit_bar2: obj.get('playersedit_bar2'),
      playersedit_bar3: obj.get('playersedit_bar3'),
      playersedit_aura1: obj.get('playersedit_aura1'),
      playersedit_aura2: obj.get('playersedit_aura2'),
      light_radius: obj.get('light_radius'),
      light_dimradius: obj.get('light_dimradius'),
      light_otherplayers: obj.get('light_otherplayers'),
      light_hassight: obj.get('light_hassight'),
      light_angle: obj.get('light_angle'),
      light_losangle: obj.get('light_losangle'),
      light_multiplier: obj.get('light_multiplier')
    }
  }

  var getPathData = function (obj, pageid) {
    return {
      _pageid: pageid,
      path: obj.get('path'),
      fill: obj.get('fill'),
      stroke: obj.get('stroke'),
      rotation: obj.get('rotation'),
      layer: obj.get('layer'),
      stroke_width: obj.get('stroke_width'),
      width: obj.get('width'),
      height: obj.get('height'),
      top: obj.get('top'),
      left: obj.get('left'),
      scaleX: obj.get('scaleX'),
      scaleY: obj.get('scaleY'),
      controlledby: obj.get('controlledby')
    }
  }

  var getRandomString = function (length) {
    return Math.round((Math.pow(36, length + 1) - Math.random() * Math.pow(36, length))).toString(36).slice(1)
  }

  var getTextData = function (obj, pageid) {
    return {
      _pageid: pageid,
      top: obj.get('top'),
      left: obj.get('left'),
      width: obj.get('width'),
      height: obj.get('height'),
      text: obj.get('text'),
      font_size: obj.get('font_size'),
      rotation: obj.get('rotation'),
      color: obj.get('color'),
      font_family: obj.get('font_family'),
      layer: obj.get('layer'),
      controlledby: obj.get('controlledby')
    }
  }

  var prepareObjects = function (objArr, pageid) {
    var preparedObjs = _.map(objArr, function (obj) {
      var type = obj.get('_type')
      if (type === 'graphic') return {type: 'graphic', data: getGraphicData(obj, pageid)}
      else if (type === 'path') return {type: 'path', data: getPathData(obj, pageid)}
      else if (type === 'text') return {type: 'text', data: getTextData(obj, pageid)}
    })
    return preparedObjs
  }

// This is the exposed function
// @param1 is the id of the page to be copied
// @param2 is the id of the destination page
  var preparePageCopy = function (pageid1, pageid2) {
    var originalPage = getObj('page', pageid1)
    var destinationPage = getObj('page', pageid2)
    if (state.PageCopy.active) {
      log(`True Page Copy - Script is currently copying the ${getObj('page',state.PageCopy.sourcePage).get('name')} page.`)
      return
    } else if (!originalPage || !destinationPage) {
      log('True Page Copy - One or both of the supplied page ids do not exist.')
      return
    } else {
      state.PageCopy.active = true
      printToChat('gm', `Script is now active and copying objects from the ${originalPage.get('name')} page.`)
    }
    changeDestinationPage(originalPage, destinationPage)
    var objsToCopy = findObjs({_pageid: pageid1})
    var objsToCopyIds = _.map(objsToCopy, (obj) => obj.id)
    var orderedObjs = originalPage.get('_zorder').split(',')
    var rawSortedObjs = []
    _.each(orderedObjs, function (id) {
      rawSortedObjs.push(objsToCopy[_.indexOf(objsToCopyIds, id)])
    })
    var sortedObjs = rawSortedObjs.filter((o) => o)
    state.PageCopy.workQueue = prepareObjects(sortedObjs, pageid2)
    if (copyObjectsToDestination() === 'success') {
      _.delay(clearState(), 10)
    }
  }

  var showHelp = function () {
    var content = 'This is a placeholder' +
                  'This is too' +
                  'And this as well.'
    printToChat('gm', content)
  }

  var printToChat = function (target, content) {
    sendChat('True Page Copy', `/w ${target} <br>` +
            content,
            null, {noarchive: true})
  }

  var registerEventHandlers = function () {
    on('chat:message', handleChatInput)
  }

  return {
    Copy: preparePageCopy,
    CheckWork: checkExistingWork,
    CheckInstall: checkVersion,
    RegisterEventHandlers: registerEventHandlers
  }
}())

on('ready', function () {
  'use strict'
  TruePageCopy.CheckWork()
  TruePageCopy.CheckInstall()
  TruePageCopy.RegisterEventHandlers()
})
