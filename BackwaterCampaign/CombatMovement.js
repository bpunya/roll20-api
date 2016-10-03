// Github: https://github.com/bpunya/roll20-api/blob/master/BackwaterCampaign/CombatMovement.js
// Author: PaprikaCC (Bodin Punyaprateep)
/******************************************************************************/

var CombatMovement = CombatMovement || (function(){

    /* This script is made to track the movement of tokens while the turn order
    ** window is active. Tokens can move as long as they do not exceed the total
    ** movement available to them. Allowed movement is reset at the top of the
    ** turn order.
    **
    ** The turnorder object holds the allowed movement of each
    ** token in an array. The first number in the array is the remaining movement
    ** and the second number is the token's total movement. This script ignores
    ** all tokens that do not have a character sheet attached. Example below:
    **
    ** Assuming obj.id = '-Ksdf9234jfs9'
    **
    ** turnorder[obj.id] = {'-Ksdf9234jfs9':[30,30]}
    **
    ** The token with ID '-Ksdf9234jfs9' has 30 units of movement per combat
    ** round. As it moves, the first number decrements by the amount of movement
    ** until it hits 0. When it hits 0, the script will disallow all movement
    ** until the token's next turn.
    */

    var
    version = '1.0',
    lastUpdate = 1475531908,

    // Update the following line to your character sheet attribute for movement speed
    movementattribute = 'speed',

    turnorder = {},
    turncounter = 1,
    initialtoken = false,
    toGM = {'who':'gm'}

    Chat_Formatting_START = '<div style="background-color:#ffffff; padding:5px; border-width:2px; border-style:solid;">'+
                            '<div style="border-width:2px; border-style:dotted; padding:5px">',

    Chat_Formatting_END = '</div>'+
                          '</div>';

/******************************************************************************/

    checkVersion = function() {
        if(!state.CombatMovement) { state.CombatMovement = {'active':false, 'autoreset':true}; }
        s = state.CombatMovement;
        if(!Campaign().get('initiativepage') && s.autoreset) {
            log('Resetting Combat Movement data...')
            clearData();
        }
        log('-- Combat Movement v'+version+' -- ['+(new Date(lastUpdate*1000))+']');
    },

    // When the turnorder page closes, call this function.
    checkCombatStatus = function() {
        if(!Campaign().get('initiativepage') && s.autoreset) {
            clearData();
        }
    },

    // Call this when we advance the turn order.
    checkCurrentRound = function() {
        if(!s.active || Campaign().get('turnorder') == '') { return; }
        var currentTokenID = JSON.parse(Campaign().get('turnorder'))[0]['id'];
        // Is it the top of the round yet? If yes...
        if(currentTokenID == initialtoken) {
            for(var token in turnorder) {
                turnorder[token][0] = 0;
            }
            turncounter++;
            printToChat(toGM, `Round ${turncounter} has started.`)
        }
        // Give the current token its movement for the turn...
        if(turnorder.hasOwnProperty(currentTokenID)) {
            turnorder[currentTokenID][0] = turnorder[currentTokenID][1];
        }
    },

    changeOptions = function(msg, option) {
        var actionTaken = false;
        switch(option) {
            case 'start':
            if(!s.active && !(initialtoken == false) && _.keys(turnorder).length > 0 ) {
                s.active = true;
                actionTaken = 'is now ACTIVE';
            } else {
                if(freezeTurnOrder() == 'failed') { return; }
                s.active = true;
                actionTaken = `is now ACTIVE. Round ${turncounter} has begun.`;
            }
            break;

            case 'pause':
            if(s.active && Campaign().get('initiativepage')) {
                s.active = false;
                actionTaken = 'has been paused'
            }
            break;

            case 'toggle':
            if(Campaign().get('initiativepage')) {
                s.active = !s.active;
                actionTaken = s.active ? 'is now ACTIVE' : 'has been paused';
            }
            break;

            case 'auto-reset':
            s.autoreset = !s.autoreset;
            actionTaken = s.autoreset ? 'automatically stops when the initiative window is closed'
                                      : 'continues running when the initiative window is closed';
            break;

            case 'reset':
            if(!(initialtoken == false)) {
                if(freezeTurnOrder() == 'failed') { return; }
                actionTaken = 'has reset the stored turnorder'
            }
            break;

            case 'stop':
            actionTaken = 'has cleared all stored information';
            clearData();
            break;
        }
        if(actionTaken) {
            output = `${Chat_Formatting_START} Combat Movement ${actionTaken}${Chat_Formatting_END}`
            printToChat(msg, output)
        }
    },

    clearData = function() {
        s.active = false;
        turnorder = {};
        initialtoken = false;
        turncounter = 1;
    };

    freezeTurnOrder = function() {
        var tokenID, characterID, character, movement,
        current_turn_order = JSON.parse(Campaign().get('turnorder'));
        if(current_turn_order == '') {
            printToChat(toGM, "You haven't rolled initiative yet!");
            return 'failed';
        }

        // initialtoken will be used to determine if a turn has passed.
        initialtoken = current_turn_order[0]['id'];

        // Set turnorder and movements
        for(i = 0; i < current_turn_order.length; i++) {
            tokenID = current_turn_order[i]['id'];
            characterObj = getObj('character', getObj('graphic', tokenID).get('represents'));
            if(characterObj == undefined) { continue; }
            if(characterObj.get('controlledby') == '') { continue; }
            else {
                movement = parseInt(getAttrByName(characterID, movementattribute), 10) || 0;
                if(!isNaN(movement)) {
                    if(tokenID == initialtoken) {
                        turnorder[tokenID] = [movement, movement];
                    } else {
                        turnorder[tokenID] = [0, movement];
                    }
                }
            }
        }
        if(_.keys(turnorder).length == 0) {
            printToChat({'who':'gm'}, 'No player tokens were found.');
            return 'failed';
        }
    },

    handleChatInput = function(msg) {
        if(!playerIsGM(msg.playerid)) { return; }
        var args = msg.content.split(/\s/)
        switch(args[0]) {
            case '!combatmovement':
            case '!CombatMovement':
            case '!CM':

                // If something is selected, give it extra movement
                if(msg.selected) {
                    if(!s.active) {
                        printToChat(msg, 'Please deselect all tokens and '+
                        'start the script before attempting to add extra movement');
                        return;
                    }
                    var selectedtokenID,
                    selectedtokenNameArray = [];

                    for(i=0; i < msg.selected.length; i++) {
                        selectedtokenID = msg.selected[i]._id;
                        if(turnorder[selectedtokenID]) {
                            turnorder[selectedtokenID][0] += turnorder[selectedtokenID][1];
                            selectedtokenNameArray.push(getObj('graphic', selectedtokenID).get('name'));
                        }
                    }
                    output = `You have given extra dash movement to ${selectedtokenNameArray.join(', ')}`;
                    printToChat(msg, output);
                    return;
                }

                switch(args[1]) {
                    case 'start':
                    changeOptions(msg, 'start')
                    break;

                    case 'pause':
                    changeOptions(msg, 'pause')
                    break;

                    case 'toggle':

                        switch(args[2]) {
                            case 'auto-reset':
                            changeOptions(msg, 'auto-reset');
                            break;

                            default:
                            changeOptions(msg, 'toggle');
                            break;
                        }
                    break;

                    case 'stop':
                    changeOptions(msg, 'stop');
                    break;

                    case 'reset':
                    changeOptions(msg, 'reset')
                    break;

                    case 'help':
                    showHelp(msg)
                    break;

                    case 'debug':

                        switch(args[2]) {
                            case 'log':
                            log(`Combat Movement v${version}`)
                            log(`Is the script on? ${s.active}.`)
                            log(initialtoken)
                            log(turnorder)
                            break;

                            case 'clear':
                            state.CombatMovement = {'active':false, 'autoreset':true};
                            turnorder = {};
                            initialtoken = false;
                            break;
                        }
                    break;

                    default:
                    showHelp(msg);
                    break;
                }
        }
    },

    printToChat = function(msg, content) {
        sendChat('Combat Movement', `/w ${msg.who} <br>`+
                content,
                null, {noarchive:true} );
    },

    showHelp = function(msg) {
        var
        currentState = s.active ? 'RUNNING' : 'OFFLINE',
        currentStateColour = s.active ? '#57961B' : '#991616',
        currentAutoResetState = s.autoreset ? ' automatically stop ' : ' continue to run ',
        helpContent = Chat_Formatting_START+
                '<div style="background-color: #282828;">'+
                '<h3 style="color: #FFFFFF; text-align: center;">Combat Movement help</h3><br></div>'+
                '<br>'+
                '<strong>!CM or !combatmovement or !CombatMovement</strong><br>'+
                '<i>// If units are selected, grant them double movement. Otherwise open this help box.</i><br><br>'+
                '<b>start</b><br>'+
                '<i>// Begins tracking token movement.</i><br>'+
                '<b>pause</b><br>'+
                '<i>// Disables the script temporarily.</i><br>'+
                '<b>toggle</b><br>'+
                '<i>// Toggles the current state.</i><br>'+
                '<b>toggle auto-reset</b><br>'+
                '<i>// Controls whether the script will stop after the initiative window is closed.</i><br>'+
                '<b>reset</b><br>'+
                '<i>// Changes the character considered the top of the initiative order to the current one.</i><br>'+
                '<b>stop</b><br>'+
                '<i>// Completely clears all tracked data and stops the script</i><br><br>'+
                'The script is currently <b><span style="color: #FFFFFF; background-color:'+
                currentStateColour+
                '">'+
                currentState+
                '</b></span>, and will'+
                currentAutoResetState+
                'when the turn order window is closed.'+
                '</div>'+
                Chat_Formatting_END;
        printToChat(msg, helpContent);
    };

    handleTokenMovement = function(obj, prev) {
        if( !s.active
            || !turnorder.hasOwnProperty(obj.id)
            || !Campaign().get('initiativepage')
            || JSON.parse(Campaign().get('turnorder')).length == 1
            ) { return; }

        if(turnorder[obj.id][0] <= 0) {
            obj.set({left: prev.left, top: prev.top, rotation: prev.rotation});
        }

        // Get page properties
        var movementX, movementY, lastmove, evencoords, oddcoords,
        currentPage = getObj('page', obj.get('_pageid')),
        currentPageDiagonalType = currentPage.get('diagonaltype'),
        currentPageScale = currentPage.get('scale_number'),
        currentPageGridSize = currentPage.get('snapping_increment'),
        totaldistance = 0;

        // If the page is weird, just don't bother
        if(currentPage.get('grid_type') != 'square') { return; }

        // Get movement coordinates and check if it was a simple move or waypoint
        rawlastmove = obj.get('lastmove').split(',')
        evenstrcoords = rawlastmove.filter(function(value, index) { return parseInt(index) % 2 == 0; });
        evenintcoords = _.map(evenstrcoords, function(value) { return parseInt(value) });
        oddstrcoords = rawlastmove.filter(function(value, index) { return parseInt(index) % 2 == 1; });
        oddintcoords = _.map(oddstrcoords, function(value) { return parseInt(value) });
        lastmove = _.zip(evenintcoords, oddintcoords);

        //FOR EACH JUMP, CALCULATE DISTANCE AND ADD IT TO A TOTAL.
        for(i=0; i + 1 < lastmove.length; i++) {
            movementX = Math.abs(lastmove[i][0] - lastmove[i+1][0])*currentPageScale*currentPageGridSize/70;
            movementY = Math.abs(lastmove[i][1] - lastmove[i+1][1])*currentPageScale*currentPageGridSize/70;
            totaldistance += determineDistanceMoved(movementX, movementY, currentPageDiagonalType, currentPageScale);
        }

        // Did the player actually end at their last waypoint? If not, calculate ending movement.
        lastcoords = _.last(lastmove);
        if(obj.get('left') != lastcoords[0] || obj.get('top') != lastcoords[1]) {
            movementX = Math.abs(obj.get('left') - lastcoords[0])*currentPageScale*currentPageGridSize/70;
            movementY = Math.abs(obj.get('top') - lastcoords[1])*currentPageScale*currentPageGridSize/70;
            totaldistance += determineDistanceMoved(movementX, movementY, currentPageDiagonalType, currentPageScale);
        }

        // Can we move this distance? If no, stop.
        if(turnorder[obj.id][0] < totaldistance) {
            obj.set({left: prev.left, top: prev.top, rotation: prev.rotation});
        } else {
            turnorder[obj.id][0] = turnorder[obj.id][0] - totaldistance;
        }
    },

    determineDistanceMoved = function(x, y, diagonaltype, scale) {
        var distanceMoved;
        if(diagonaltype == 'foure')            { distanceMoved = get4eDistance(x, y, scale); }
        else if(diagonaltype == 'threefive')   { distanceMoved = getThreeFiveDistance(x, y, scale); }
        else if(diagonaltype == 'pythagorean') { distanceMoved = getEuclideanDistance(x, y, scale); }
        else if(diagonaltype == 'manhattan')   { distanceMoved = getManhattanDistance(x, y, scale); }
        else { distanceMoved = get4eDistance(x, y, scale); }
        return distanceMoved;
    },

    get4eDistance = function(x, y, scale) {
        var totalmovement = x > y ? x : y;
        return totalmovement;
    },
    getThreeFiveDistance = function(x, y, scale) {
        var higher = x > y ? x : y,
        lower = x < y ? x : y,
        totalmovement = higher + (Math.floor(lower/10)*scale);
        return totalmovement;
    },
    getEuclideanDistance = function(x, y, scale) {
        var totalmovement = Math.sqrt(x^2 + y^2)
        return totalmovement;
    },
    getManhattanDistance = function(x, y, scale) {
        var totalmovement = x + y;
        return totalmovement
    },

    registerEventHandlers = function(){
        on('chat:message', handleChatInput);
        on('change:graphic', handleTokenMovement);
        on('change:campaign:turnorder', checkCurrentRound);
        on('change:campaign:initiativepage', checkCombatStatus);
    };

    return {
        CheckVersion: checkVersion,
        RegisterEventHandlers: registerEventHandlers
    };
}());

on('ready', function(){
    'use strict'
    CombatMovement.CheckVersion()
    CombatMovement.RegisterEventHandlers()
});
