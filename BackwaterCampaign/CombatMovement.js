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
    lastUpdate = "1475209152",

    Chat_Formatting_START = '<div style="background-color:#ffffff; padding:5px; border-width:2px; border-style:solid;">'+
                            '<div style="border-width:2px; border-style:dotted; padding:5px">',

    Chat_Formatting_END = '</div>'+
                          '</div>';

    checkVersion = function() {
        if(!state.CombatMovement) { state.CombatMovement = {'active':true}; }
        s = state.CombatMovement;
        log('-- Combat Movement v'+version+' -- ['+(new Date(lastUpdate*1000))+']');
    },

    changeOptions = function(msg, option) {
        switch(option) {
            case 'on':
            s.active = true;
            actionTaken = 'is now ACTIVE';
            break;

            case 'off':
            s.active = false;
            actionTaken = 'is INACTIVE';
            break;

            case 'toggle':
            s.active = !s.active;
            actionTaken = s.active ? 'is now ACTIVE' : 'is INACTIVE';
            break;
        }
        output = `Combat Movement ${actionTaken}`
        printToChat(msg, output)
    },

    printToChat = function(msg, content) {
        sendChat('Combat Movement', `/w ${msg.who} <br>`+
                content
                );
    },

    handleChatInput = function(msg) {
        if(!playerIsGM(msg.playerid)) { return; }
        args = msg.content.split(/\s/)
        switch(args[0]) {
            case '!combatmovement':
            case '!CombatMovement':
            case '!CM':

                switch(args[1]) {
                    case '--on':
                    changeOptions(msg, 'on')
                    break;

                    case '--off':
                    changeOptions(msg, 'off')
                    break;

                    case '--toggle':
                    changeOptions(msg, 'toggle');
                    break;

                    case '--help':
                    showHelp(msg)
                    break;

                    default:
                    showHelp(msg);
                    break;
                }
        }
    },

    handleTokenMovement = function(obj, prev) {
        if( !s.active || !(Campaign().get('initiativepage')) ) { return; }

    },

    showHelp = function(msg) {
        currentState = s.active ? 'ACTIVE' : 'INACTIVE';
        helpContent = Chat_Formatting_START+
                '<h3>Combat Movement help</h3><br>'+
                '<strong>Available Options:</strong><br>'+
                '--on <i>// Activates the script.</i><br>'+
                '--off <i>// Disables the script.</i><br>'+
                '--toggle <i>// Toggles the current state.</i><br>'+
                '<br>The script is currently <b>' + currentState + '</b>.' +
                Chat_Formatting_END;
        printToChat(msg, helpContent);
    };

    registerEventHandlers = function(){
        on('chat:message', handleChatInput);
        on("change:graphic", handleTokenMovement);
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
