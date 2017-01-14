// Github: https://github.com/bpunya/roll20-api/blob/master/BackwaterCampaign/CharacterCounter.js
// Author: PaprikaCC (Bodin Punyaprateep)

var CharacterCount = CharacterCount || (function(){
    // Created to count character sheets
    // For the Backwater Living Campaign
    var
    currentversion = '1.1',
    lastUpdate = 1476944262,

    maxClassesToCount = 2,
    alignmentdictionary = {},
    racedictionary = {},
    storedalignmentdictionary = {
        LG: ['LAWFUL GOOD','LAWFULGOOD','L G','LG'],
        NG: ['NEUTRAL GOOD','NEUTRALGOOD','N G','NG'],
        CG: ['CHAOTIC GOOD','CHAOTICGOOD','C G','CG'],
        LN: ['LAWFUL NEUTRAL','LAWFULNEUTRAL','L N','LN'],
        N:  ['NEUTRAL','TRUE NEUTRAL','TRUENEUTRAL','T N','N','TN'],
        CN: ['CHAOTIC NEUTRAL','CHAOTICNEUTRAL','C N','CN'],
        LE: ['LAWFUL EVIL','LAWFULEVIL','L E','LE'],
        NE: ['NEUTRAL EVIL','NEUTRALEVIL','N E','NE'],
        CE: ['CHAOTIC EVIL','CHAOTICEVIL','C E','CE']
        },
    storedracedictionary = {
        'Aarakocra': ['aarakocra','aarakokra','aaracokra','aarakrocra','aarakoca'],
        'Aasimar': ['aasimar'],
        'Dragonborn': ['dragonborn'], // NEED TO EXTEND THIS FURTHER
        'Hill Dwarf': ['hill dwarf', 'hilldwarf','dwarf hill','dwarf, hill','dwarf (hill)','(hill) dwarf'],
        'Mountain Dwarf': ['mountain dwarf','mountaindwarf','dwarf mountain','dwarf, mountain','dwarf (mountain)','(mountain) dwarf'],
        'Dark Elf': ['dark elf','darkelf','elf dark','elf, dark','elf (dark)','(dark) elf','drow','dark-elf'],
        'High Elf': ['high elf','highelf','elf high','elf, high','elf (high)','(high) elf','high-elf'],
        'Wood Elf': ['wood elf','woodelf','elf wood','elf, wood','elf (wood)','(wood) elf','wood-elf'],
        'Genasi': ['genasi'], // NEED TO EXTEND THIS FURTHER
        'Deep Gnome': ['deep gnome','deepgnome','gnome deep','gnome, deep','gnome (deep)','(deep) gnome','svirbneblin','deep-gnome'],
        'Forest Gnome': ['forest gnome','forestgnome','gnome forest','gnome, forest','gnome (forest)','(forest) gnome','forest-gnome'],
        'Rock Gnome': ['rock gnome','rockgnome','gnome rock','gnome, rock','gnome (rock)','(rock) gnome','rock-gnome'],
        'Goliath': ['goliath'],
        'Lightfoot Halfling': ['lightfoot halfling','lightfoothalfling','halfling lightfoot',
                                'halfling, lightfoot','halfling (lightfoot)','(lightfoot) halfling'],
        'Stout Halfling': ['stout halfling','stouthalfling','halfling stout','halfling, stout','halfling (stout)','(stout) halfling'],
        'Half-elf': ['half elf','halfelf','half-elf'],
        'Half-orc': ['half orc','halforc','half-orc'],
        'Human': ['human'],
        'Variant Human': ['variant human','human, variant','human (variant)'],
        'Tiefling': ['tiefling','teifling']
        },
    characterClassNames = ['barbarian','bard','cleric','druid','fighter','paladin','ranger','rogue','sorcerer','warlock','wizard']

    characterlist = [];

    checkVersion = function(){
        if(!state.CharacterCount){ state.CharacterCount = {}; }
        s = state.CharacterCount;
        s.active = true;
        if(s.version !== currentversion){
            switch(currentversion){
                case '1.0':
                    log("Setting Up Dictionaries")
                    s.alignmentdictionary = storedalignmentdictionary
                    s.racedictionary = storedracedictionary
                    s.version = currentversion
                break;

                case '1.1':
                    log('Updating to v1.1')
                    s.active = false;
                    s.alignmentdictionary = storedalignmentdictionary
                    s.racedictionary = storedracedictionary
                    s.version = currentversion
                break;
            }
        }
        alignmentdictionary = s.alignmentdictionary
        racedictionary = s.racedictionary
        log('Building Character Count character lists')
        characterlist = getCharacters()
        log('-- Character Count v'+s.version+' -- ['+(new Date(lastUpdate*1000))+']');
        s.active = false;
    },

    countCharacterAlignments = function(msg){
        state.CharacterCount.active = true;
        sendChat('Character Count', `/w ${msg.who}<br> Checking Alignments now!`, null, {noarchive:true})
        var alignments = {
            'LG':0,'NG':0,'CG':0,'LN':0,'N':0,'CN':0,'LE':0,'NE':0,'CE':0,'Unable to parse':[]
            };
        for(character in characterlist){
            characterAlignment = getAttrByName(characterlist[character].id, 'alignment').toUpperCase()
            var isUnknown = true;
            for(alignmentname in alignmentdictionary){
                if(!isUnknown){ break; }
                for(word in alignmentdictionary[alignmentname]){
                    if(!isUnknown){ break; }
                    if(characterAlignment == alignmentdictionary[alignmentname][word]){
                        alignments[alignmentname] ++;
                        isUnknown = false;
                    }
                }
            }
            if(isUnknown){
                if(characterAlignment.length > 0){
                    alignments['Unable to parse'].push(characterlist[character].get('name')+'=>'+characterAlignment)
                }
            }
        }
        if(alignments['Unable to parse'].length < 1){ alignments['Unable to parse'] = 'None' }
        printOutput(alignments,'Character alignments', msg);
    },

    countCharacterClasses = function(msg, namearray){
        state.CharacterCount.active = true;
        sendChat('Character Count', `/w ${msg.who}<br> Checking Classes now!`, null, {noarchive:true})
        var classes = {};
        for(var i = 0; i < namearray.length; i++) { classes[namearray[i]] = 0; }
        for(character in characterlist){
            for(var i = 0; i < namearray.length; i++){
                classes[namearray[i]] += getAttrByName(characterlist[character].id, namearray[i]+'_level')
            }
        }
        printOutput(classes,'Combined Class levels', msg);
    },

    countCharacterLevels  = function(msg){
        state.CharacterCount.active = true;
        sendChat('Character Count', `/w ${msg.who}<br> Checking Character levels now!`, null, {noarchive:true})
        var levels = {
            '1':0,'2':0,'3':0,'4':0,'5':0,'6':0,'7':0,'8':0,'9':0,'10':0,
            '11':0,'12':0,'13':0,'14':0,'15':0,'16':0,'17':0,'18':0,'19':0,'20':0
            };
        for(character in characterlist){
            characterlevel = getAttrByName(characterlist[character].id, 'level');
            if(characterlevel) {
                levels[characterlevel] ++;
            }

        }
        printOutput(levels,'Character levels', msg);
    },

    countCharacterRaces = function(msg){
        state.CharacterCount.active = true;
        sendChat('Character Count', `/w ${msg.who}<br> Checking Races now!`, null, {noarchive:true})
        var races = {
            'Aarakocra':0,
            'Aasimar':0,
            'Dragonborn':0,
            'Hill Dwarf':0,
            'Mountain Dwarf':0,
            'Dark Elf':0,
            'High Elf':0,
            'Wood Elf':0,
            'Genasi':0,
            'Deep Gnome':0,
            'Forest Gnome':0,
            'Rock Gnome':0,
            'Goliath':0,
            'Lightfoot Halfling':0,
            'Stout Halfling':0,
            'Half-elf':0,
            'Half-orc':0,
            'Human':0,
            'Variant Human':0,
            'Tiefling':0,
            'Unable to parse':[]
            };
        for(character in characterlist){
            characterRace = getAttrByName(characterlist[character].id, 'race').toLowerCase()
            var isUnknown = true;
            for(racename in racedictionary){
                if(!isUnknown){ break; }
                for(word in racedictionary[racename]){
                    if(!isUnknown){ break; }
                    if(characterRace == racedictionary[racename][word]){
                        races[racename] ++;
                        isUnknown = false;
                    }
                }
            }
            if(isUnknown){
                if(characterRace.length > 0){
                    races['Unable to parse'].push(characterlist[character].get('name')+'=>'+characterRace)
                }
            }
        }
        if(races['Unable to parse'].length < 1){ races['Unable to parse'] = 'None' }
        printOutput(races,'Counted Player Races', msg);
    },

    handleChatInput = function(msg){
        if(msg.type !== 'api' || !playerIsGM(msg.playerid) || state.CharacterCount.active ){ return; }
        var args = msg.content.split(/\s/)
        switch(args[0]){
            case "!cc":
            case "!CC":
                switch(args[1]){
                    case 'alignments':
                    case 'alignment':
                        countCharacterAlignments(msg);
                    break;

                    case 'classes':
                    case 'class':
                        if(args[2].toLowerCase() == 'all') {
                            countCharacterClasses(msg, characterClassNames)
                        }
                        rawArgs = args.slice(2);
                        cleanArgs = [];
                        for(var i = 0; i < rawArgs.length; i++) {
                            if(cleanArgs.length >= maxClassesToCount) { break; }
                            if(_.contains(characterClassNames, rawArgs[i].toLowerCase())) {
                                cleanArgs.push(rawArgs[i].toLowerCase());
                            }
                        }
                        if(cleanArgs.length !== 0) {
                            countCharacterClasses(msg, cleanArgs)
                        } else {
                            sendChat('Character Count', `/w ${msg.who}<br> Please enter valid classnames`, null, {noarchive:true})
                        }
                    break;

                    case 'levels':
                    case 'level':
                        countCharacterLevels(msg);
                    break;

                    case 'races':
                    case 'race':
                        countCharacterRaces(msg);
                    break;

                    default:
                        showHelp(msg)
                    break;
                }
        }
    },

    getCharacters = function(){
        return filterObjs(function(obj) {
            if(obj.get('_type') != 'character'
                || obj.get('archived') == true)
                { return false; }
            else if(getAttrByName(obj.id, 'is_npc') == 1
                || obj.get('name').split(' ')[0] == '(NPC)'
                || obj.get('name').split(' ')[0] == '(RCNPC)'
                || obj.get('name').split(' ')[0] == '[NPC]'
                || obj.get('name').split(' ')[0] == '[RCNPC]')
                { return false; }
            else { return true; }
        })
    },

    showHelp = function(msg){
        sendChat("CC",
            `/w ${msg.who} `
            +'<br>'
            +'<div style="background-color:#ffffff; padding:5px; border-style:solid; border-width:2px;">'
            +'<h3 style="border-style:dotted; border-width:2px; padding:5px">Character Count Help</h3>'
            +'<p style="padding:5px">'
            +'To access Character Count, use the following chat message format:<br>'
            +'<h4>!CC <command></h4>'
            +'<br>'
            +'<h4>Commands Available:</h4>'
            +'<em>Not case-sensitive. Script ignores all sheets listed as NPC.</em><br><br>'
            +'<strong>Alignment(s)</strong> ----<br> Counts all listed alignments. Alignments unable to be parsed are listed in a seperate line.<br>'
            +'<strong>Class(es)</strong> ---- <br>Counts the combined total of all class levels. You need to enter the classes to check manually.<br>'
            +'<strong>Level(s)</strong> ---- <br>Counts the amount of players at each level.<br>'
            +'<strong>Race(s)</strong> ---- <br>Counts all listed player races. Races unable to be parsed are listed in a seperate line.<br>'
            +'</p></div>',
            null, {noarchive:true});
    }

    printOutput = function(totals, outputtype, msg){

        var rawOutput = [ // Header formatting
            `/w ${msg.who} `
            +'<br>'
            +'<div style="background-color:#ffffff; padding:5px; border-width:2px; border-style:solid;">'
            +'<div style="border-width:2px; border-style:dotted;"><h3 style="padding:5px;">'+outputtype+'.</h3></div><br>'];
        _.each(totals, function(linevalue, linekey){ // For each output, add a line to the chat output
            if(typeof linevalue === 'object'){ // Treat arrays differently
                rawOutput.push('<p style="font-family:sans-serif;"><strong>'+linekey+':</strong> '+linevalue.join(", ")+'</p>');
            } else {
                rawOutput.push('<p style="font-family:sans-serif;"><strong>'+linekey+':</strong> '+linevalue+'</p>');
            }
        })
        rawOutput.push('<em>Generated on '+new Date(Date.now())+'</em></div>'); //ending formatting goes here
        formattedOutput = rawOutput.join('');
        sendChat("CC", formattedOutput, null, {noarchive:true});
        state.CharacterCount.active = false;
    }

    registerEventHandlers = function(){
        on('chat:message', handleChatInput)
    };

    return {
        CheckVersion: checkVersion,
        RegisterEventHandlers: registerEventHandlers
    };
}());

on('ready', function(){
    'use strict'
    CharacterCount.CheckVersion()
    CharacterCount.RegisterEventHandlers()
});
