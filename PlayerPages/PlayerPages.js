/**
 *  This is a script to allow players to move freely between GM pre-set pages
 *  with the use of an API command. The pages can only be set through chat commands
 *  and only by a GM. You can disallow movement at any time.
 *  
 *  TO-DO:
 *  Push all GM functions to !pp
 *  Format chat output with HTML/CSS
 *  Add function to add/remove a player from a playergroup
 *  Add function for GMs to move players to maps
 *  Add function to add/remove a map from a mapgroup
 *  Add function for GMs to move players to random map within a group
**/

var playerPages = playerPages || function () {

clearPlayerPages = function(id){
    state.playerPages = {};
    state.playerPages.allowedMove = true;
    sendChat("PlayerPages", `/w gm PlayerPages has been reset.`);
    log(state.playerPages);
},
    
handleInput = function(msg){
    
    if(msg.type !== "api"){
        return;
    }
    
    // Change this to increase or decrease the maps available   //
    // Back is a special command                                //
    
    var pageTypes = ["map","base","menu"]
    
    /*----------------------------------------------------------*/
    
    cInput = msg.content.toLowerCase().split(" "),
    cWho = msg.who.split(" ")[0],
    isGM = playerIsGM(msg.playerid) || false,
    playerPages = Campaign().get("playerspecificpages"),        // Where are all players? We call this variable again when pushing updates to Roll20    //
    playerLocation = playerPages[msg.playerid];                 // playerLocation is the id of the page where the player is at. Only for non-GM use     //
    
    if(cInput.length > 1) {                                     // If the player used the right syntax !go <location>   //
        selectedPage = cInput[1];                               // selectedPage = <location>                            //
    } else {
        selectedPage = "";                                      // Otherwise make it empty so everything doesn't crash. //
    }
    
    
    
    // START OF FUNCTIONS //
    
    switch(cInput[0]){
        
        case "!clear":
            if(cInput[1] == "playerpages" && isGM) {
                clearPlayerPages(cWho)
                return;
            }
        break;
        
        case "!report":
            if(cInput[1] == "playerpages" && isGM) {
                log(state.playerPages)
                return;
            }
        break;
        
        case "!set":
            if(!isGM){ // Disallow non-GMs from all !set functions //
                return;
            }
            if(selectedPage ==  "movement") {                       //!set movement toggles player movement.
                state.playerPages.allowedMove = !state.playerPages.allowedMove;
                sendChat("PlayerPages", `/w gm Allowed movement is now ${state.playerPages.allowedMove}.`);
                return;
                
            } else if(!(_.contains(pageTypes, selectedPage))) {     //If the command is not valid, end.
                sendChat("PlayerPages", `/w ${cWho} Please use a valid command. They are: ${pageTypes}.`)
                return;
            }
            
            allPlayers = findObjs({
                _type: 'player'
                });
            
            //targetPlayer should return the position of the player object (in the allPlayers array) that is typed in chat.
            targetPlayer = _.indexOf(allPlayers, _.find(allPlayers, function(players){
               if(_.contains(players.get("_displayname").toLowerCase().split(" "), cInput[2])){
                   return true;
               }}
            ));
            
            if(targetPlayer == -1) { //If typed player doesn't exist, notify the GM.
                sendChat("PlayerPages", `/w ${cWho} Please select a valid target. Use the first name of the player.`);
                return;
            }
            
            targetPlayerID = allPlayers[targetPlayer].get("_id");
            targetPlayerName = allPlayers[targetPlayer].get("_displayname")
            gm = getObj("player", msg.playerid);
            gmPage = gm.get("_lastpage");
            gmPageName = getObj("page", gmPage).get("name");
            
            // Do we have an object for this player yet? If not, make one.
            if(!state.playerPages[targetPlayerID]) {
                state.playerPages[targetPlayerID] = {
                    id: targetPlayerID,
                    old: "",
                    movedByAPI: false
                };
            }
            
            // Determine map to set, and set it //
            state.playerPages[targetPlayerID][selectedPage] = gmPage;
            sendChat("PlayerPages", `/w gm ${targetPlayerName}'s ${selectedPage} is now ${gmPageName}.`);
            return;
        break;
        
        // END GM FUNCTIONS //
        // START PLAYER FUNCTIONS //
        
        case "!go":
            if(!state.playerPages.allowedMove) {            //If they are not allowed to move, stop the script.
                return;
            }
            if(!(_.contains(pageTypes, selectedPage)) && selectedPage !== "back"){
                sendChat("PlayerPages", `/w ${cWho} The following pages are available to you: back,old,${pageTypes}.`)
                return;
            }
            
            //If their page does not exist, notify the player and note in console.
            if(!state.playerPages[msg.playerid][selectedPage] && selectedPage !== "back") {
                sendChat("PlayerPages", `/w ${cWho} Sorry! Your GM has not set your ${selectedPage} page yet.`);
                log(`${cWho} has attempted to access their ${selectedPage} page, but it was not available.`)
                return;
            }
            
            // If you are moving between pages but haven't moved back yet //
            if(state.playerPages[msg.playerid].movedByAPI == true 
                && playerLocation !== state.playerPages[msg.playerid][selectedPage]
                && selectedPage !== "back") {
                
                playerPages[msg.playerid] = state.playerPages[msg.playerid][selectedPage]
                
            // If you use back, old, or the same map name twice in a row, return back to the old location //
            } else if(selectedPage == "back" || selectedPage == "old" || playerLocation == state.playerPages[msg.playerid][selectedPage]) {
                if(state.playerPages[msg.playerid].old){
                    playerPages[msg.playerid] = state.playerPages[msg.playerid].old;
                    state.playerPages[msg.playerid].old = "";
                }
                state.playerPages[msg.playerid].movedByAPI = false;
                
            // Else we assume you haven't moved before //
            } else {
                state.playerPages[msg.playerid].old = playerPages[msg.playerid];            //Save old location
                playerPages[msg.playerid] = state.playerPages[msg.playerid][selectedPage];  //Set location to new
                state.playerPages[msg.playerid].movedByAPI = true;                          //Set movedByAPI to true
            }
        break;  // End of !go //
    }
    Campaign().set("playerspecificpages", false);
    Campaign().set("playerspecificpages", playerPages);
    return;
},

    registerEventHandlers = function() {
        on('chat:message', handleInput);
    };
    
    return {
        RegisterEventHandlers: registerEventHandlers
    };
    
}();

on('ready',function(){
    'use strict';
    log('playerPages v1.0')
    playerPages.RegisterEventHandlers();
    
});
