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
    version = "1.0",
    lastUpdate = 1475429873,
    movementattribute = 'speed',
    turnorder = {},
    turncounter = 1,
    initialtoken = false,

    Chat_Formatting_START = '<div style="background-color:#ffffff; padding:5px; border-width:2px; border-style:solid;">'+
                            '<div style="border-width:2px; border-style:dotted; padding:5px">',

    Chat_Formatting_END = '</div>'+
                          '</div>';

/******************************************************************************/

    checkVersion = function() {
        if(!state.CombatMovement) { state.CombatMovement = {'active':false, 'autoreset':true}; }
        s = state.CombatMovement;
        if(!Campaign().get('initiativepage')) {
            log('Resetting Combat Movement data...')
            clearData();
        }
        log('-- Combat Movement v'+version+' -- ['+(new Date(lastUpdate*1000))+']');
    },

    // When the turnorder page closes, call this function and clear data.
    checkCombatStatus = function() {
        if(!Campaign().get('initiativepage') && s.autoreset) {
            clearData();
        }
    },

    // Call this when we advance the turn order.
    checkCurrentRound = function() {
        if(!s.active) { return; }
        var currentTokenID = JSON.parse(Campaign().get('turnorder'))[0]['id'];
        if(currentTokenID == initialtoken) {
            for(var token in turnorder) {
                turnorder[token][0] = 0;
            }
            turncounter++;
            printToChat({'who':'gm'}, `Round ${turncounter} has started.`)
        }
        turnorder[currentTokenID][0] = turnorder[currentTokenID][1];
    },

    changeOptions = function(msg, option) {
        var actionTaken = false;
        switch(option) {
            case 'start':
            if(!s.active && Campaign().get('initiativepage')) {
                s.active = true;
                freezeTurnOrder();
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
            if(s.active) {
                initialtoken = false;
                freezeTurnOrder();
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
        var tokenID, characterID, movement,
        current_turn_order = JSON.parse(Campaign().get('turnorder'));
        if(current_turn_order.length < 1) {
            printToChat({'who':'gm'}, "You haven't rolled initiative yet!")
            return;
        }
        // initialtoken will be used to determine if a turn has passed.
        initialtoken = current_turn_order[0]['id']

        // Set turnorder and movements
        for(i = 0; i < current_turn_order.length; i++) {
            tokenID = current_turn_order[i]['id'];
            characterID = getObj('graphic', tokenID).get('represents') || false;
            if( characterID && !(getObj('character', characterID).get('represents') == '') ) {
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
    },

    handleChatInput = function(msg) {
        if(!playerIsGM(msg.playerid)) { return; }
        var args = msg.content.split(/\s/)
        switch(args[0]) {
            case '!combatmovement':
            case '!CombatMovement':
            case '!CM':

                if(msg.selected && args.length == 1) {
                    if(!s.active) { return; }
                    var selectedtokenID,
                    selectedtokenNameArray = [];

                    for(i=0; i < msg.selected.length; i++) {
                        selectedtokenID = msg.selected[i]._id;
                        if(turnorder[selectedtokenID]) {
                            turnorder[selectedtokenID][0] += turnorder[selectedtokenID][1]
                            selectedtokenNameArray.push(getObj('graphic', selectedtokenID).get('name'))
                        }
                    }
                    output = `You have given dash movement to ${selectedtokenNameArray.join(', ')}`
                    printToChat(msg, output);
                    return;
                }

                switch(args[1]) {
                    case '--start':
                    changeOptions(msg, 'start')
                    break;

                    case '--pause':
                    changeOptions(msg, 'pause')
                    break;

                    case '--toggle':

                        switch(args[2]) {
                            case 'auto-reset':
                            changeOptions(msg, 'auto-reset');
                            break;

                            default:
                            changeOptions(msg, 'toggle');
                            break;
                        }
                    break;

                    case '--stop':
                    changeOptions(msg, 'stop');
                    break;

                    case '--reset':
                    changeOptions(msg, 'reset')
                    break;

                    case '--help':
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
                            initialtoken = {};
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
                content
                );
    },

    showHelp = function(msg) {
        var
        currentState = s.active ? 'ACTIVE' : 'INACTIVE',
        currentAutoResetState = s.autoreset ? ' automatically stop ' : ' continue to run ',
        helpContent = Chat_Formatting_START+
                '<h3>Combat Movement help</h3><br>'+
                '<strong>Available Options:</strong><br>'+
                '--start <i>// Begins tracking token movement.</i><br>'+
                '--pause <i>// Disables the script temporarily.</i><br>'+
                '--toggle <i>// Toggles the current state.</i><br>'+
                '--toggle auto-reset <i>// Controls whether the script will stop after the initiative window is closed.</i><br>'+
                '--reset <i>// Resets all tracking (Use after a fight)</i><br>'+
                '--stop <i>// Completely clears all tracked data and stops the script</i><br>'+
                '<br>The script is currently <b>'+
                currentState+
                '</b>, and will'+
                currentAutoResetState+
                'when the turn order window is closed.'+
                Chat_Formatting_END;
        printToChat(msg, helpContent);
    };

    handleTokenMovement = function(obj, prev) {
        if( !s.active
           || (!Campaign().get('initiativepage'))
           || (obj.get('represents') == '')
            ) { return; }

        if(turnorder[obj.id][0] <= 0) {
            obj.set({left: prev.left, top: prev.top, rotation: prev.rotation});
        }

        // Get page properties
        var movementX, movementY, higher, lower, totalmovement,
        currentPage = getObj('page', obj.get('_pageid')),
        currentPageDiagonal = currentPage.get('diagonaltype'),
        currentPageScaleNumber = currentPage.get('scale_number'),
        currentPageGridType = currentPage.get('grid_type');

        // If the page is weird, just don't bother
        if( !(currentPageGridType == 'square')
            ) { return; }

        // Check change in position
        movementX = Math.abs((obj.get('left') - prev['left']))*currentPageScaleNumber/70;
        movementY = Math.abs((obj.get('top') - prev['top']))*currentPageScaleNumber/70;

        if(currentPageDiagonal == 'foure') {
            totalmovement = movementX > movementY ? movementX : movementY;
        } else if(currentPageDiagonal == 'threefive') {
            higher = movementX > movementY ? movementX : movementY;
            lower = movementX < movementY ? movementX : movementY;
            totalmovement = higher + (Math.floor(lower/10)*currentPageScaleNumber);
        } else if(currentPageDiagonal == 'pythagorean') {
            totalmovement = Math.sqrt(movementX^2 + movementY^2)
        } else if(currentPageDiagonal == 'manhattan') {
            totalmovement = movementX + movementY;
        }

        // Can we move this distance? If no, stop.
        if(turnorder[obj.id][0] < totalmovement) {
            obj.set({left: prev.left, top: prev.top, rotation: prev.rotation});
        } else {
            turnorder[obj.id][0] = turnorder[obj.id][0] - totalmovement;
        }
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
    s.active = false;
});
