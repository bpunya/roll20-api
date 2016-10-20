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
    version = '1.1',
    lastUpdate = 1476996144,

    // Update the following line to your character sheet attribute for movement speed
    movementattribute = 'speed',

    toGM = {'who':'gm'},
    defaultState = {'active': false, 'autoreset': true, 'ignoreGMmovement': true, 'turnorder': {}, 'turncounter': 1, 'initialtoken': false},

    Chat_Formatting_START = '<div style="background-color:#ffffff; padding:5px; border-width:2px; border-style:solid;">'+
                            '<div style="border-width:2px; border-style:dotted; padding:5px">',

    Chat_Formatting_END = '</div>'+
                          '</div>';

    if(!state.CombatMovement) { state.CombatMovement = defaultState; }
    s = state.CombatMovement;

/******************************************************************************/

    checkVersion = function() {
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
        if(currentTokenID == s.initialtoken) {
            for(var token in s.turnorder) {
                s.turnorder[token][0] = 0;
            }
            s.turncounter += 1;
            printToChat(toGM, `Round ${s.turncounter} has started.`)
        }
        // Either way, give the current token its movement for the turn...
        if(s.turnorder.hasOwnProperty(currentTokenID)) {
            s.turnorder[currentTokenID][0] = s.turnorder[currentTokenID][1];
        }
    },

    changeOptions = function(msg, option) {
        var actionTaken = false;
        switch(option) {
            case 'start':
            if(!s.active && !(s.initialtoken == false) && _.keys(s.turnorder).length > 0 ) {
                s.active = true;
                actionTaken = 'is now ACTIVE';
            } else if(!s.active) {
                if(freezeTurnOrder() == 'failed') { return; }
                s.active = true;
                actionTaken = `is now ACTIVE. Round ${s.turncounter} has begun.`;
            }
            break;

            case 'pause':
            if(s.active && Campaign().get('initiativepage')) {
                s.active = false;
                actionTaken = 'has been paused'
            }
            break;

            case 'toggle':
            if(Campaign().get('initiativepage') && _.keys(s.turnorder).length > 0) {
                s.active = !s.active;
                actionTaken = s.active ? 'is now ACTIVE' : 'has been paused';
            }
            break;

            case 'auto-reset':
            s.autoreset = !s.autoreset;
            actionTaken = s.autoreset ? 'automatically stops when the initiative window is closed'
                                      : 'continues running when the initiative window is closed';
            break;

            case 'gm-movement':
            s.ignoreGMmovement = !s.ignoreGMmovement;
            actionTaken = s.ignoreGMmovement ? 'grants NPCs free movement'
                                             : 'treats NPCs the same as PCs'
            break;

            case 'reset':
            if(!(s.initialtoken == false)) {
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
        s.turnorder = {};
        s.initialtoken = false;
        s.turncounter = 1;
    };

    freezeTurnOrder = function() {
        var tokenID, characterID, character, movement,
        current_turn_order = JSON.parse(Campaign().get('turnorder'));
        if(current_turn_order == '') {
            printToChat(toGM, "You haven't rolled initiative yet!");
            return 'failed';
        }

        // initialtoken will be used to determine if a turn has passed.
        s.initialtoken = current_turn_order[0]['id'];

        // Main loop to add tokenIDs to the turnorder object ==>
        for(i = 0; i < current_turn_order.length; i++) {
            tokenID = current_turn_order[i]['id'];

            // Ignore all invalid tokens
            if(getObj('graphic', tokenID) == undefined) {
                printToChat(toGM, "You need to clear the turn list using the initiative window.");
                continue;
            }
            characterID = getObj('graphic', tokenID).get('represents');
            if(characterID == '') { continue; }
            playerID = getObj('character', characterID).get('controlledby');
            if(playerID == '' && s.ignoreGMmovement) { continue; }

            // All good? Go ahead...
            movement = parseInt(getAttrByName(characterID, movementattribute), 10);
            if(!isNaN(movement)) {
                if(tokenID == s.initialtoken) {
                    s.turnorder[tokenID] = [movement, movement];
                } else {
                    s.turnorder[tokenID] = [0, movement];
                }
            // Unless something is formatted improperly...
            } else {
                characterName = getObj('character', characterID).get('name');
                printToChat(toGM, `${characterName} has an incorrectly formatted movement speed.`);
            }
        } // End Main loop <==
        if(_.keys(s.turnorder).length == 0) {
            printToChat(toGM, 'No player tokens were found.');
            return 'failed';
        }
    },

    handleChatInput = function(msg) {
        if(msg.type !== 'api' || !playerIsGM(msg.playerid)) { return; }
        var args = msg.content.split(/\s/)
        switch(args[0]) {
            case '!combatmovement':
            case '!CombatMovement':
            case '!CM':

                switch(args[1]) {
                    case 'start':
                    changeOptions(msg, 'start')
                    return;
                    break;

                    case 'pause':
                    changeOptions(msg, 'pause')
                    return;
                    break;

                    case 'toggle':

                        switch(args[2]) {
                            case 'auto-reset':
                            changeOptions(msg, 'auto-reset');
                            break;

                            case 'gm-movement':
                            changeOptions(msg, 'gm-movement')
                            break;

                            default:
                            changeOptions(msg, 'toggle');
                            break;
                        }
                    return;
                    break;

                    case 'stop':
                    changeOptions(msg, 'stop');
                    return;
                    break;

                    case 'reset':
                    changeOptions(msg, 'reset')
                    return;
                    break;

                    case 'help':
                    showHelp(msg)
                    return;
                    break;

                    case 'debug':

                        switch(args[2]) {
                            case 'log':
                            log(`Combat Movement v${version}`)
                            log(`Is the script on? ${s.active ? 'Yes' : 'No'}.`)
                            log(s.initialtoken)
                            log(s.turnorder)
                            printToChat(msg, 'Logs sent to console.');
                            break;

                            case 'clear':
                            state.CombatMovement = defaultState;
                            printToChat(msg, 'All data has been reset');
                            break;
                        }
                    return;
                    break;

                    default:
                    if(msg.selected) {
                        if(!s.active) {
                            printToChat(msg, 'Please start the script first.')
                        } else if(args.length >= 2) {
                            changeCharacterMovementSpeed(msg, args[1])
                        } else if(args.length === 1) {
                            giveDashMovement(msg)
                        }
                    } else {
                        showHelp(msg)
                    }
                    break;
                }
        }
    },

    changeCharacterMovementSpeed = function(msg, speedString) {
        var selectedTokenID, newMovementSpeed, isAdded,
        selectedTokenNameArray = [],
        speed = parseInt(speedString, 10);
        if(isNaN(speed)) {
            printToChat(msg, 'Please enter a valid number');
            return;
        }
        if(speedString[0] === '+' || speedString[0] === '-') isAdded = true;
        else isAdded = false;

        // Main loop to alter character sheets
        for(i = 0; i < msg.selected.length; i++){
            selectedTokenID = msg.selected[i]._id;
            characterID = getObj('graphic', selectedTokenID).get('represents')
            // Ignore selected tokens without character sheets
            if(characterID == '') { continue; }

            var speedAttribute = findObjs({
                _type: "attribute",
                _characterid: characterID,
                name: movementattribute
                });

            if(isAdded) newMovementSpeed = speedAttribute[0].get('current') + speed
            else        newMovementSpeed = speed

            speedAttribute[0].set('current', newMovementSpeed);
            selectedTokenNameArray.push(getObj('character', characterID).get('name'));

            // Update the turnorder object as well
            if(s.turnorder.hasOwnProperty(selectedTokenID)) {
                s.turnorder[selectedTokenID][1] = newMovementSpeed;
                if(s.turnorder[selectedTokenID][0] > s.turnorder[selectedTokenID][1]) {
                    s.turnorder[selectedTokenID][0] = s.turnorder[selectedTokenID][1]
                }
            }
        } // End main loop to alter character sheets
        output = isAdded  ? `You have changed the movement speed(s) of ${selectedTokenNameArray.join(', ')} by ${speed}.`
                        : `You have set the movement speed(s) of ${selectedTokenNameArray.join(', ')} to ${speed}.`;
        printToChat(msg, output)
    },

    giveDashMovement = function(msg) {
        var selectedTokenID,
        selectedTokenNameArray = [];
        for(i = 0; i < msg.selected.length; i++) {
            selectedTokenID = msg.selected[i]._id;
            if(s.turnorder.hasOwnProperty(selectedTokenID)) {
                s.turnorder[selectedTokenID][0] += s.turnorder[selectedTokenID][1];
                selectedTokenNameArray.push(getObj('graphic', selectedTokenID).get('name'));
            }
        }
        output = `You have given dash movement to ${selectedTokenNameArray.join(', ')}`
        printToChat(msg, output)
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
        currentAutoResetState = s.autoreset ? ' automatically stops ' : ' continues to run ',
        currentGMmovementState = s.ignoreGMmovement ? ' grants NPCs unlimited movement.' : ' treats NPCs like PCs.'
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
                '<i>// Controls whether the script will stop after the initiative window is closed (defaults to stop).</i><br>'+
                '<b>toggle gm-movement</b><br>'+
                '<i>// Controls whether NPCs should be granted free movement or treated like PCs (defaults to free movement).</i><br>'+
                '<b>reset</b><br>'+
                '<i>// Changes the character considered the top of the initiative order to the current one.</i><br>'+
                '<b>stop</b><br>'+
                '<i>// Completely clears all tracked data and stops the script</i><br><br>'+
                'The script is currently <b><span style="color: #FFFFFF; background-color:'+
                currentStateColour+
                '">'+
                currentState+
                '</b></span>,'+
                currentAutoResetState+
                'when the turn order window is closed, and'+
                currentGMmovementState+
                '</div>'+
                Chat_Formatting_END;
        printToChat(msg, helpContent);
    },

    handleTokenMovement = function(obj, prev) {
        if( !s.active
            || !s.turnorder.hasOwnProperty(obj.id)
            || !Campaign().get('initiativepage')
            || JSON.parse(Campaign().get('turnorder')).length == 1
            ) { return; }

        if(s.turnorder[obj.id][0] <= 0) {
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

        // Get movement coordinates and split em into an actually nice array
        rawlastmove = obj.get('lastmove').split(',')
        integerlastmove = _.map(rawlastmove, function(value) { return parseInt(value) });
        Xcoords = integerlastmove.filter(function(value, index) { return index % 2 == 0; });
        Ycoords = integerlastmove.filter(function(value, index) { return index % 2 == 1; });
        movearray = _.zip(Xcoords, Ycoords);

        //FOR EACH JUMP, CALCULATE DISTANCE AND ADD IT TO A TOTAL.
        for(i=0; i + 1 < movearray.length; i++) {
            movementX = Math.abs(movearray[i][0] - movearray[i+1][0])*currentPageScale*currentPageGridSize/70;
            movementY = Math.abs(movearray[i][1] - movearray[i+1][1])*currentPageScale*currentPageGridSize/70;
            totaldistance += determineDistanceMoved(movementX, movementY, currentPageDiagonalType, currentPageScale);
        }

        // Did the player actually end at their last waypoint? If not, calculate ending movement.
        lastcoords = _.last(movearray);
        if(obj.get('left') != lastcoords[0] || obj.get('top') != lastcoords[1]) {
            movementX = Math.abs(obj.get('left') - lastcoords[0])*currentPageScale*currentPageGridSize/70;
            movementY = Math.abs(obj.get('top') - lastcoords[1])*currentPageScale*currentPageGridSize/70;
            totaldistance += determineDistanceMoved(movementX, movementY, currentPageDiagonalType, currentPageScale);
        }

        // Can we move this distance? If no, stop.
        if(s.turnorder[obj.id][0] < totaldistance) {
            obj.set({left: prev.left, top: prev.top, rotation: prev.rotation});
        } else {
            s.turnorder[obj.id][0] -= totaldistance;
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
