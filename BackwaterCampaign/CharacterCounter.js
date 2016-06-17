// Github: https://github.com/bpunya/roll20-api/blob/master/BackwaterCampaign/CharacterCounter.js
// Author: PaprikaCC (Bodin Punyaprateep)

var CharacterCount = CharacterCount || (function(){
    // Created to count character sheets
    // For the Backwater Living Campaign
    var
    version = '1.0',
    lastUpdate = 1466118362,
    
    alignmentdictionary = {
        LG: ['LAWFUL GOOD','LAWFULGOOD','L G','LG'],
        NG: ['NEUTRAL GOOD','NEUTRALGOOD','N G','NG'],
        CG: ['CHAOTIC GOOD','CHAOTICGOOD','C G','CG'],
        LN: ['LAWFUL NEUTRAL','LAWFULNEUTRAL','L N','LN'],
        N:  ['NEUTRAL','TRUE NEUTRAL','TRUENEUTRAL','T N','N'],
        CN: ['CHAOTIC NEUTRAL','CHAOTICNEUTRAL','C N','CN'],
        LE: ['LAWFUL EVIL','LAWFULEVIL','L E','LE'],
        NE: ['NEUTRAL EVIL','NEUTRALEVIL','N E','NE'],
        CE: ['CHAOTIC EVIL','CHAOTICEVIL','C E','CE']
        },
    
    racedictionary = {
        Aarakocra: ['aarakocra','aarakokra','aaracokra','aarakrocra','aarakoca'],
        Aasimar: ['aasimar'],
        Dragonborn: ['dragonborn'], // NEED TO EXTEND THIS FURTHER
        HillDwarf: ['hill dwarf', 'hilldwarf','dwarf hill','dwarf, hill','dwarf (hill)','(hill) dwarf'],
        MountainDwarf: ['mountain dwarf','mountaindwarf','dwarf mountain','dwarf, mountain','dwarf (mountain)','(mountain) dwarf'],
        DarkElf: ['dark elf','darkelf','elf dark','elf, dark','elf (dark)','(dark) elf','drow'],
        HighElf: ['high elf','highelf','elf high','elf, high','elf (high)','(high) elf'],
        WoodElf: ['wood elf','woodelf','elf wood','elf, wood','elf (wood)','(wood) elf'],
        Genasi: ['genasi'], // NEED TO EXTEND THIS FURTHER
        DeepGnome: ['deep gnome','deepgnome','gnome deep','gnome, deep','gnome (deep)','(deep) gnome','svirbneblin'],
        ForestGnome: ['forest gnome','forestgnome','gnome forest','gnome, forest','gnome (forest)','(forest) gnome'],
        RockGnome: ['rock gnome','rockgnome','gnome rock','gnome, rock','gnome (rock)','(rock) gnome'],
        Goliath: ['goliath'],
        LightfootHalfling: ['lightfoot halfling','lightfoothalfling','halfling lightfoot','halfling, lightfoot','halfling (lightfoot)','(lightfoot) halfling'],
        StoutHalfling: ['stout halfling','stouthalfling','halfling stout','halfling, stout','halfling (stout)','(stout) halfling'],
        Halfelf: ['half elf','halfelf','half-elf'],
        Halforc: ['half orc','halforc','half-orc'],
        Human: ['human'],
        VariantHuman: ['variant human','human, variant','human (variant)'],
        Tiefling: ['tiefling','teifling']
        };
    
    checkVersion = function(){
        s = state.CharacterCount || false;
        if(s.version !== version){
            switch(version){
                case '1.0':
                    s={version:'1.0'}
                    s.racedictionary=racedictionary
                    s.alignmentdictionary=alignmentdictionary
                break;
            }
            s.version = version
        }
        log('-- Character Count v'+s.version+' -- ['+(new Date(lastUpdate*1000))+']');
    },
    
    countCharacterAlignments = function(characterlist){
        var alignments = {
            'LG':0,'NG':0,'CG':0,'LN':0,'N':0,'CN':0,'LE':0,'NE':0,'CE':0,'Unable to parse':[]
            };
        _.each(characterlist, function(character){
            if(getAttrByName(character.id, 'is_npc') == 1){ return; }
            characterAlignment = getAttrByName(character.id, 'alignment')
            var isunknown = true;
            _.each(alignmentdictionary, function(namelist, alignmentname){
                if(_.find(namelist, function(alignment){
                    return characterAlignment.toUpperCase() == alignment
                    })){
                    alignments[alignmentname] ++;
                    isunknown = false;
                }
            })
            if(isunknown){
                alignments['Unable to parse'].push(characterAlignment)
            }
        })
        if(alignments['Unable to parse'].length < 1){ alignments['Unable to parse'] = 'None' }
        printOutput(alignments,'Character alignments');
    },
    
    countCharacterClasses = function(characterlist){
        var classes = {
            'barbarian':0,'bard':0,'druid':0,'cleric':0,'fighter':0,'monk':0,'paladin':0,'ranger':0,'rogue':0,'sorcerer':0,'warlock':0,'wizard':0
            };
        _.each(characterlist, function(character){
            if(getAttrByName(character.id, 'is_npc') == 1){ return; }
            _.each(classes, function(value, classname){
                classes[classname] += getAttrByName(character.id, classname+'_level')
            })
        })
        printOutput(classes,'Combined Class levels');
    },
    
    countCharacterLevels  = function(characterlist){
        var levels = {
            '1':0,'2':0,'3':0,'4':0,'5':0,'6':0,'7':0,'8':0,'9':0,'10':0,'11':0,'12':0,'13':0,'14':0,'15':0,'16':0,'17':0,'18':0,'19':0,'20':0
            };
        _.each(characterlist, function(character){
            if(getAttrByName(character.id, 'is_npc') == 1){ return; }
            characterlevel = getAttrByName(character.id, 'level');
            levels[characterlevel] ++;
        })
        printOutput(levels,'Character levels');
    },
    
    countCharacterRaces = function(characterlist){
        var races = {
            'Aarakocra':0,
            'Aasimar':0,
            'Dragonborn':0,
            'HillDwarf':0,
            'Mountain Dwarf':0,
            'DarkElf':0,
            'HighElf':0,
            'WoodElf':0,
            'Genasi':0,
            'DeepGnome':0,
            'ForestGnome':0,
            'RockGnome':0,
            'Goliath':0,
            'LightfootHalfling':0,
            'StoutHalfling':0,
            'Halfelf':0,
            'Halforc':0,
            'Human':0,
            'VariantHuman':0,
            'Tiefling':0,
            'Unable to parse':[]
            };
        _.each(characterlist, function(character){
            if(getAttrByName(character.id, 'is_npc') == 1){ return; }
            characterRace = getAttrByName(character.id, 'race');
            var isunknown = true;
            _.each(racedictionary, function(namelist, racename){
                if(_.find(namelist, function(race){
                    return characterRace.toLowerCase() == race
                    })){
                    races[racename] ++;
                    isunknown = false;
                }
            })
            if(isunknown){
                races['Unable to parse'].push(characterRace)
            }
        })
        if(races['Unable to parse'].length < 1){ races['Unable to parse'] = 'None' }
        printOutput(races,'Counted Player Races');
    },
    
    handleCountType = function(mContent){
        if(mContent.length<2){
            showHelp()
            return
        }
        characterlist = getCharacters();
        arg = mContent[1].toLowerCase();
        switch(arg){
            case 'all':
                countCharacterClasses(characterlist);
                countCharacterLevels(characterlist);
                countCharacterAlignments(characterlist);
                countCharacterRaces(characterlist);
            break;
            
            case 'everything':
                countCharacterClasses(characterlist);
                countCharacterLevels(characterlist);
                countCharacterAlignments(characterlist);
                countCharacterRaces(characterlist);
            break;
            
            case 'alignments':
                countCharacterAlignments(characterlist);
            break;
            
            case 'alignment':
                countCharacterAlignments(characterlist);
            break
            
            case 'classes':
                countCharacterClasses(characterlist);
            break;
            
            case 'class':
                countCharacterClasses(characterlist);
            break
            
            case 'levels':
                countCharacterLevels(characterlist);
            break;
            
            case 'level':
                countCharacterLevels(characterlist);
            break;
            
            case 'races':
                countCharacterRaces(characterlist);
            break;
            
            case 'race':
                countCharacterRaces(characterlist);
            break;
            
            default:
                showHelp()
            break;
        }
    },
    
    handleChatInput = function(msg){
        if(msg.type !== 'api' || !playerIsGM(msg.playerid)){ return; }
        mContent = msg.content.split(/\s/);
        switch(mContent[0]){
            case "!CC":
                handleCountType(mContent)
            break;
            
            case "!cc":
                handleCountType(mContent)
            break;
        }
    },
    
    getCharacters = function(){
        return findObjs({
            _type: 'character',
            archived: false
        })
    },
    
    showHelp = function(){
        sendChat("CC",
            '/w gm '
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
            +'<strong>All or Everything</strong> ---- <br>Does all of the above.<br>'
            +'</p></div>'
        );
    }
    
    printOutput = function(totals, outputtype){
        
        var rawOutput = [ // Header formatting
            '/w gm '
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
        sendChat("CC", formattedOutput);
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
