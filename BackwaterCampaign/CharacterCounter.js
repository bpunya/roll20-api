// Github: https://github.com/bpunya/roll20-api/blob/master/BackwaterCampaign/CharacterCounter.js
// Author: PaprikaCC (Bodin Punyaprateep)

var CharacterCount = CharacterCount || (function(){
    // Created to count character sheets
    // For the Backwater Living Campaign
    var
    currentversion = '1.0',
    lastUpdate = 1475552233,

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
        };

    checkVersion = function(){
        if(!state.CharacterCount){ state.CharacterCount = {}; }
        s = state.CharacterCount;
        if(s.version !== currentversion){
            switch(currentversion){
                case '1.0':
                    log("Setting Up Dictionaries")
                    s.alignmentdictionary = storedalignmentdictionary
                    s.racedictionary = storedracedictionary
                    s.version = currentversion
                break;
            }
        }
        alignmentdictionary = s.alignmentdictionary
        racedictionary = s.racedictionary
        log('-- Character Count v'+s.version+' -- ['+(new Date(lastUpdate*1000))+']');
    },

    countCharacterAlignments = function(characterlist, msg){
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

    countCharacterClasses = function(characterlist, msg){
        var classes = {
            'barbarian':0,'bard':0,'cleric':0,'druid':0,'fighter':0,'monk':0,
            'paladin':0,'ranger':0,'rogue':0,'sorcerer':0,'warlock':0,'wizard':0
            };
        for(character in characterlist){
            for(classname in classes){
                classes[classname] += getAttrByName(characterlist[character].id, classname+'_level')
            }
        }
        printOutput(classes,'Combined Class levels', msg);
    },

    countCharacterLevels  = function(characterlist, msg){
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

    countCharacterRaces = function(characterlist, msg){
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

    handleCountType = function(mContent, msg){
        if(mContent.length<2){
            showHelp(msg)
            return
        }
        characterlist = getCharacters();
        arg = mContent[1].toLowerCase();
        switch(arg){
            case 'alignments':
                countCharacterAlignments(characterlist, msg);
            break;

            case 'alignment':
                countCharacterAlignments(characterlist, msg);
            break

            case 'classes':
                countCharacterClasses(characterlist, msg);
            break;

            case 'class':
                countCharacterClasses(characterlist, msg);
            break

            case 'levels':
                countCharacterLevels(characterlist, msg);
            break;

            case 'level':
                countCharacterLevels(characterlist, msg);
            break;

            case 'races':
                countCharacterRaces(characterlist, msg);
            break;

            case 'race':
                countCharacterRaces(characterlist, msg);
            break;

            default:
                showHelp(msg)
            break;
        }
    },

    handleChatInput = function(msg){
        if(msg.type !== 'api' || !playerIsGM(msg.playerid)){ return; }
        mContent = msg.content.split(/\s/);
        switch(mContent[0]){
            case "!CC":
                handleCountType(mContent, msg)
            break;

            case "!cc":
                handleCountType(mContent, msg)
            break;
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
            +'<strong>Class(es)</strong> ---- <br>Counts the combined total of all class levels.<br>'
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
