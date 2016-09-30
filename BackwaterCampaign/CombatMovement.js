// Github: https://github.com/bpunya/roll20-api/blob/master/BackwaterCampaign/CombatMovement.js
// Author: PaprikaCC (Bodin Punyaprateep)

var CombatMovement = CombatMovement || (function(){

    /* This script is made to track the movement of tokens while the turn order
    ** window is active. Tokens can move as long as they do not exceed the total
    ** movement available to them. Allowed movement is reset at the top of the
    ** turn order.
    */

    var
    version = "1.0",
    lastUpdate = "",
    TrackingArray = {'turnorder':{},'initialtoken':false};


    Chat_Formatting_START = '<div style="background-color:#ffffff; padding:5px; border-width:2px; border-style:solid;">'+
                            '<div style="border-width:2px; border-style:dotted; padding:5px">',

    Chat_Formatting_END = '</div>'+
                          '</div>';

    checkVersion = function() {
        if(!state.CombatMovement) { state.CombatMovement = {'active':false, 'autoreset':true}; }
        s = state.CombatMovement;

        if(!Campaign().get('initiativepage')) {
            log('Resetting Combat Movement data...')
            clearData();
        }

        log('-- Combat Movement v'+version+' -- ['+(new Date(lastUpdate*1000))+']');
    },

    checkCombatStatus = function() {
        if(!Campaign().get('initiativepage') && s.autoreset) {
            clearData();
        }
    },

    checkCurrentRound = function() {
        //Checks if a full combat round has passed.
        //If yes, for every object in TrackingArray[turnorder]
        //set TrackingArray[turnorder][object][remainingmovement] == TrackingArray[turnorder][object][totalmovement];
    },

    clearData = function() {
        s.active = false;
        TrackingArray = {'turnorder':{},'initialtoken':false};
    };

    changeOptions = function(msg, option) {
        var actionTaken = false;
        switch(option) {
            case 'start':
            if(!s.active && Campaign().get('initiativepage')) {
                s.active = true;
                freezeTurnOrder();
                actionTaken = 'is now ACTIVE';
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

            case 'reset':
            if(TrackingArray['turnorder'].length > 0) {
                clearData();
                s.active = true;
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

    freezeTurnOrder = function() {
        var tokenID, characterID,
        current_turn_order = JSON.parse(Campaign().get('turnorder'));

        // Set initial token
        TrackingArray.initialtoken = current_turn_order[0]['id']

        // Set turnorder and movements
        for(i = 0; i < current_turn_order.length; i++) {
            tokenID = current_turn_order[i]['id'];
            characterID = getObj('graphic', tokenID).get('represents') || false;
            if(characterID) {
                movement = getAttrByName(characterID, 'speed');
                TrackingArray.turnorder[tokenID] = [movement, movement];
            }
        }
    },

    handleChatInput = function(msg) {
        if(!playerIsGM(msg.playerid)) { return; }
        args = msg.content.split(/\s/)
        switch(args[0]) {
            case '!combatmovement':
            case '!CombatMovement':
            case '!CM':

                switch(args[1]) {
                    case '--start':
                    changeOptions(msg, 'start')
                    break;

                    case '--pause':
                    changeOptions(msg, 'pause')
                    break;

                    case '--toggle':
                    changeOptions(msg, 'toggle');
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
                    state.CombatMovement = {'active':false, 'autoreset':true};
                    TrackingArray = {'turnorder':{},'initialtoken':false};
                    break;

                    default:
                    showHelp(msg);
                    break;
                }
        }
    },

    handleTokenMovement = function(obj, prev) {
        if( !s.active || !(Campaign().get('initiativepage')) ) { return; }
        //check token ID against TrackingArray[turnorder][tokenid][remainingmovement]
    },

    showHelp = function(msg) {
        currentState = s.active ? 'ACTIVE' : 'INACTIVE';
        helpContent = Chat_Formatting_START+
                '<h3>Combat Movement help</h3><br>'+
                '<strong>Available Options:</strong><br>'+
                '--on <i>// Activates the script.</i><br>'+
                '--off <i>// Disables the script.</i><br>'+
                '--toggle <i>// Toggles the current state.</i><br>'+
                '--reset <i>// Resets all tracking (Use after a fight)</i><br>'+
                '<br>The script is currently <b>' + currentState + '</b>.' +
                Chat_Formatting_END;
        printToChat(msg, helpContent);
    };

    printToChat = function(msg, content) {
        sendChat('Combat Movement', `/w ${msg.who} <br>`+
                content
                );
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
