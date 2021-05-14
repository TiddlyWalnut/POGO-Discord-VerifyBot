var Discord = require('discord.js');
var Config = require('./config.js');
var flip = require('flip-text');
var fs = require('fs');
var Twitter = require('twitter');

/*
config = new Config({
	commandCharacter: '!',
	everyonePerms: 0,
    isChannelSetup: false,
    isRoleSetup: false,
	isEveryoneSetup: false,
    verifyChannelName: 'verify',
	verifyChannelID: 0,
    verifyRoleName: 'Verified',
	verifyRoleID: 0,
    verifyKeyword: 'verify'
});
*/

/* global BADGE, config, client, mutedIDs */

var BADGE = {
    time: 0,
    leaderID: '0',
    leaderName: ''
};

var TRAINER = {
    name: '',
    code: ''
};

var client = null;
var config = null;

var mutedIDs = {};

new Config({
    commandCharacter: {
        value: '!',
        type: 'string'
    },
    everyonePerms: {
        value: 0,
        type: 'int'
    },
    isChannelSetup: {
        value: false,
        type: 'boolean'
    },
    isRoleSetup: {
        value: false,
        type: 'boolean'
    },
    isEveryoneSetup: {
        value: false,
        type: 'boolean'
    },
    isGymLeaderRoleSetup: {
        value: false,
        type: 'boolean'
    },
    isGymChallengerRoleSetup: {
        value: false,
        type: 'boolean'
    },
    isGymLeaderChannelSetup: {
        value: false,
        type: 'boolean'
    },
    gymRoleName: {
        value: 'Gym Leader',
        type: 'string'
    },
    gymChallengerRoleName: {
        value: 'GymChallenger',
        type: 'string'
    },
    gymChannelName: {
        value: 'Gym-League',
        type: 'string'
    },
    gymRoleID: {
        value: '0',
        type: 'string'
    },
    gymChallengerRoleID: {
        value: '0',
        type: 'string'
    },
    gymChannelID: {
        value: '0',
        type: 'string'
    },
    gymAdmins: {
        value: [],
        type: 'json'
    },
    gymLeaders: {
        value: {
            fire: 0,
            water: 0,
            grass: 0,
            fairy: 0,
            ice: 0,
            dark: 0,
            ghost: 0,
            poison: 0,
            normal: 0,
            fighting: 0,
            dragon: 0,
            flying: 0,
            ground: 0,
            rock: 0,
            bug: 0,
            steel: 0,
            electric: 0,
            psychic: 0,
        },
        type: 'json'
    },
    gymBadges: {
        value: {
            fire: {length: 0},
            water: {length: 0},
            grass: {length: 0},
            fairy: {length: 0},
            ice: {length: 0},
            dark: {length: 0},
            ghost: {length: 0},
            poison: {length: 0},
            normal: {length: 0},
            fighting: {length: 0},
            dragon: {length: 0},
            flying: {length: 0},
            ground: {length: 0},
            rock: {length: 0},
            bug: {length: 0},
            steel: {length: 0},
            electric: {length: 0},
            psychic: {length: 0},
        },
        type: 'json'
    },
    gymRules: {
        value: '',
        type: 'string'
    },
    gymChallengerOptOut: {
        value: [],
        type: 'json'
    },
    verifyChannelName: {
        value: 'verify',
        type: 'string'
    },
    verifyChannelID: {
        value: 0,
        type: 'string'
    },
    verifyRoleName: {
        value: 'Verified',
        type: 'string'
    },
    verifyRoleID: {
        value: 0,
        type: 'string'
    },
    verifyKeyword: {
        value: 'verify',
        type: 'string'
    },
    isDMEnabled: {
        value: false,
        type: 'boolean'
    },
    newJoinDMMessage: {
        value: '',
        type: 'string'
    },
    gifLastPosted: {
        value: 0,
        type: 'int'
    },
    imageTimer: {
        value: 0,
        type: 'int'
    },
    raidBosses: {
        value: {
            1: [],  
            2: [],  
            3: [],  
            4: [],  
            5: []
        },
        type: 'json'
    },
    raidSubs: {
        value: {},
        type: 'json'
    },
    customCommands: {
        value: {},
        type: 'json'
    },
    votekickRecord: {
        value: {},
        type: 'json'
    },
    votekickThreshold: {
        value: 0,
        type: 'int'
    },
    questCategories: {
        value: [],
        type: 'json'
    },
    adminRoles: {
        value: [],
        type: 'json'
    },
    mutedObj: {
        value: {ids: [], objs: []},
        type: 'json'
    },
    mutedRole: {
        value: '',
        type: 'string'
    },
    modRole: {
        value: '',
        type: 'string'
    },
    friendCodes: {
        value: {},
        type: 'json'
    }
    
})
    .then( (conf) =>
    {
        config = conf;
        setup();
    });
	
function setup() {
    client = new Discord.Client({disableEveryone: true});

    client.on('ready', () => 
    {
        console.log('ready!');
		
        let guilds = config.getNonDefaultGuilds('mutedObj');
        guilds.forEach( (guild) =>
        {
            doMute(client.guilds.resolve(guild));
        });
    });

    client.login(process.env.DISCORDAPIKEY).then(() =>
    {
        // console.log(client.guilds);
        client.user.setPresence({
            game: {name: 'Guardian of the Discord'},
            status: 'online'
        });


    },
    (error) =>
    {
        console.log('failed');
        console.log(error);
        process.exit(1);
    });

    client.on('message', (data, error) => 
    {
        if (error)
        {
            console.log(error);
            return;
        }
		
        // Don't process or respond until config is loaded.
        if (!config.isLoaded())
            return;
		
        // If not undefined, message came from a guild text channel
        if (data.guild)
        {
            // Get member because there's some wonky caching going on
            data.guild.members.fetch(data.author)
                .then(function (mem) 
                {
                    data.member = mem;
			
                    config.logMessage(data);
				
                    if (data.author.id == client.user.id) // Don't respond to your own messages
                        return;
				
                    let guild = data.guild.id;
                    let member = data.author.id;
				
                    if (data.content.indexOf( config.get('commandCharacter', guild) ) == 0)
                    {
                        //Chat command
                        processChatCommand(data);
                    }
				
                    let verifyMatch = data.content.match( new RegExp(config.get('commandCharacter', guild) + config.get('verifyKeyword', guild), 'i') );
				
                    // Watch for messages from the verify channel, respond if not !verify
                    if (data.channel.id == config.get('verifyChannelID', guild) && 
						(!verifyMatch || 
						(verifyMatch ? verifyMatch.index : -1) != 0) && 
					!data.member.roles.cache.get(config.get('verifyRoleID', guild) ))
                    {
                        data.reply('Please read the the other channels for instructions on how to verify.  Make sure you type exactly as the instructions say for proper verification.');
                    }
                });
        }
        else
        {
            // Then the message must be a DM
            config.logDM(data);
        }
		
        // Don't flip your own messages... endless flipping
        if (data.author.id != client.user.id)
        {
            // Table flip scenarios
            let tableFlip = /\u0028\u256f\u00b0\u25a1\u00b0\uff09\u256f\ufe35(.*?)$/gi;
            let flipInMessage = data.cleanContent.indexOf('\u0028\u256f\u00b0\u25a1\u00b0\uff09\u256f\ufe35\u0020\u253b\u2501\u253b');
            let atInMessage = data.cleanContent.indexOf('@');
			
            // Traditional table flip
            if (flipInMessage > -1 &&
				(atInMessage == -1 || (atInMessage > -1 && atInMessage != flipInMessage-1)))
            {
                data.channel.send('\u252c\u2500\u252c\u0020\u30ce\u0028\u0020\u309c\u002d\u309c\u30ce\u0029');
            }
            // Generic table flip
            else if (data.cleanContent.indexOf('\u0028\u256f\u00b0\u25a1\u00b0\uff09\u256f\ufe35') > -1 &&
					(atInMessage == -1 || (atInMessage > -1 && atInMessage != flipInMessage-1)))
            {
                let arr = tableFlip.exec(data.cleanContent);
				
                if (arr)
                {
                    let mess = flip(arr[1].trim()) + '\u30ce\u0028\u0020\u309c\u002d\u309c\u30ce\u0029';
                    data.channel.send(makeSafe(mess));
                }
				
            }
            // Table put back
            else if (data.cleanContent.indexOf('\u252c\u2500\u252c\u0020\u30ce\u0028\u0020\u309c\u002d\u309c\u30ce\u0029') > -1)
            {
                data.channel.send('\u0028\u256f\u00b0\u25a1\u00b0\uff09\u256f\ufe35\u0020\u253b\u2501\u253b');
            }
        }
    });

    client.on('guildCreate', (data, error) => 
    {
        let guild = data.id;
    });

    client.on('guildMemberAdd', (mem, error) =>
    {
        if ( config.get('isDMEnabled', mem.guild.id) && config.get('newJoinDMMessage', mem.guild.id) != '')
        {
            mem.createDM()
                .then((DM) =>
                {
                    console.log('Sending DM to new member: ' + mem.user.username + '#' + mem.user.discriminator);
				
                    DM.send(config.get('newJoinDMMessage', mem.guild.id));
                })
                .catch( (e) =>
                {
                    console.log('Could not open DM: ');
                    console.log(e);
                });
        }
		
        if ( config.get('mutedRole', mem.guild.id) != '')
        {
            // muting setup
            let muted = config.get('mutedObj', mem.guild.id);
            let mutedRole = config.get('mutedRole', mem.guild.id);
			
            if (muted.ids.indexOf(mem.id) > -1)
            {
                mem.roles.add(mutedRole);
                console.log(`Member ${mem.user.username}#${mem.user.discriminator} rejoined and was muted previously`);
            }
        }
    });

}


function processChatCommand(data)
{
    let adminRoles = config.get('adminRoles', data.guild.id);
    
    let gymAdmins = config.get('gymAdmins', data.guild.id);
    let isAdminRole = adminRoles.some( (i) => data.member.roles.cache.has(i) );
    let isAdmin = data.member.hasPermission('MANAGE_GUILD') || 
                  (data.author.username == 'Foodbandlt' && data.author.discriminator == '0185');
                  
    let opts = 
    {
        guild:              data.guild.id,
        member:             data.author.id,
        withoutCommand:     ( data.cleanContent.indexOf(' ') > -1 ? data.cleanContent.substring( data.cleanContent.indexOf(' ') + 1 ) : ''),
        args:               data.content.toLowerCase().substr(1).replace(/\n/g, ' ').split(' ').filter(elem => elem != ''),
        origArgs:           data.content.substr(1).split(' ').filter(elem => elem != ''),
        isAdmin:            isAdmin,
        isAdminRole:        isAdminRole,
    };
    
    console.log('Chat command called');
    console.log(data.author.username + '#' + data.author.discriminator + ' (' + (data.member ? data.member.displayName : '') + ') : ' + data.content);
	
    
    
    
    processUserCommand(data, opts);
    
    if (config.get('isGymLeaderRoleSetup', opts.guild))
    {
        // Call gym commands if in gym channel, or gym channel is not set
        if (!config.get('isGymLeaderChannelSetup', opts.guild) || 
            data.channel.id == config.get('gymChannelID', opts.guild))
        {
            processGymCommand(data, opts);
            
            // Process gym admin commands if gym admin (or server admin) calls them
            if (gymAdmins.indexOf(data.author.id) > -1 || isAdmin)
                processGymAdminCommand(data, opts);
        }
    }

    // Return if user doesn't have permission to use these commands
    // Need Manage Server permissions to use them
    if (!isAdmin && !isAdminRole) return;
	
    processAdminCommand(data, opts);
}

function processUserCommand(data, opts)
{
    if (opts.args[0] == 'commands' || opts.args[0] == 'help') // Lists commands
    {
        // Skips this if gyms is specified
        if (opts.args[1] && (opts.args[1] == 'gym' || opts.args[1] == 'gyms'))
            return;
		
        let c = config.get('commandCharacter', opts.guild);
        data.channel.send('**Commands**\n' +
			'`'+ c + config.get('verifyKeyword', opts.guild) + '` - Verifies user using keyword.\n' +
			'`'+ c + 'ping` - Tests channel visibility and responsiveness of bot\n' +
			'`'+ c + 'flip <object>` - Table flips object\n' +
			'`'+ c + 'dice <number of sides>` - Rolls dice with *n* sides\n' +
            '     Supports *x*d*y* format; ex. 2d10\n' +
            '     Alias: `'+ c + 'roll`\n' +
			'`'+ c + 'emojis` - Lists all server emojis\n' +
			'`'+ c + 'modrank` - Lists the current highest ranked mod\n' +
			'`'+ c + 'gif <search term>` - Posts a gif found using the search term\n' +
			'`'+ c + 'img <search term>` - Posts an image found using the search term\n' +
			'`'+ c + '8ball <question>` - Asks the magic 8ball a question\n' +
			'`'+ c + 'stats` - Prints out some server stats\n' +
			'`'+ c + 'google <topic>` - Gives you a Google link to the topic\n' +
			'`'+ c + 'setfc <friend code>` - Sets your friendcode for the `fc` command\n' +
            '     Options: `'+ c + 'setfc [number] <friend code> - Sets that number to an alt\'ts friend code`\n' +
			'`'+ c + 'setign <name>` - Sets your in-game name for the `fc` command\n' +
            '     Options: `'+ c + 'setign [number] <name> - Sets that number to an alt\'ts name`\n' +
			'`'+ c + 'fc [number]` - Lists friend code and ign in this channel, or lists an alt\'s info if number is specified\n' +
            '`'+ c + 'wantquest <quest>` - Subscribes you to notifications for quest\n' +
            '     Alias: `'+ c + 'wantq`\n' +
			'`'+ c + 'unwantquest <quest>` - Unsubscribes you to notifications for quest\n' +
            '     Alias: `'+ c + 'unwantq`\n' +
			'`'+ c + 'listquests` - Lists available quests\n' +
            '     Alias: `'+ c + 'listq`\n' +
			'`'+ c + 'numwants` - Lists how many people want that pokemon\n' +
            '     Alias: `'+ c + 'numwant`, `wantnum`\n' +
			'`'+ c + 'listwants` - Lists people that want that pokemon\n' +
            '     Alias: `'+ c + 'listwant`, `wantlist`, `wantslist`\n' +
        /*
			'`'+ c + 'votekick @<user>` - Votes to kick someone\n' +
			'     Alias: `'+ c + 'vk`\n' +
			'`'+ c + 'unvotekick @<user>` - Unvotes to kick someone\n' +
			'     Alias: `'+ c + 'unvk`\n' +
			'`'+ c + 'numvotekicks @<user>` - Displays how many votekicks a user has\n' +
            '     Alias: `'+ c + 'numvk`, `numvks`, `numvotekick`\n' +
            */
            /*  Don't need raid commands anymore
			'`'+ c + 'want <raid boss>` - Subscribes you to DM list for raid boss\n' +
			'`'+ c + 'want` - Lists currently wanted raid bosses\n' +
			'`'+ c + 'unwant <raid boss>` - Unsubscribes you from DM list for raid boss\n' +
			'`'+ c + 'raid <raid boss> <location>` - Notifies subbed users of raid boss\n' +
			'`'+ c + 'raidbosses` - Lists all current raid bosses\n' +
            */
            '\n**Custom Commands**\n' +
            (() => 
            {
                let comms = config.get('customCommands', opts.guild);
                let out = '';
                
                for (let i in comms)
                {
                    out += '`' + c + i + '`\n';
                }
                return out;
            })()
        );
    }
    else if (opts.args[0] == config.get('verifyKeyword', opts.guild)) // Verify user when said in the verification channel
    {
        if (!config.get('isRoleSetup', opts.guild) || !data.member) return;
        if (data.channel.id != config.get('verifyChannelID', opts.guild)) return;
        
        data.member.roles.add( config.get('verifyRoleID', opts.guild) );
        data.delete();
    }
    else if (opts.args[0] == 'ping')
    {
        data.react('👌');
        data.reply('Pong!');
    }
    else if (opts.args[0] == 'google') 
    {
        data.reply('https://www.google.com/search?q=' + encodeURIComponent(opts.withoutCommand));
    }
    else if (opts.args[0] == 'dice' || opts.args[0] == 'roll') 
    {
        if (!opts.args[1])
        {
            data.reply('Need dice information');
            return;
        }
		
        let roll = function(num)
        {
            return Math.floor(Math.random() * num ) + 1;
        };
        
        let str = opts.args[1].toLowerCase();
        
        if (str.indexOf('d') > -1)
        {
            // Support more complex dice rolls
            let nums = str.split('d');
            
            nums[0] = parseInt(nums[0]);
            nums[1] = parseInt(nums[1]);

            
            if (nums.length != 2 || 
                isNaN(nums[0]) || 
                isNaN(nums[1]) || 
                nums[0] <= 0 || 
                nums[1] <= 0 ||
                nums[0] > 100 ||
                nums[1] > 100000)
            {
                data.react('❌');
                return;
            }
            
            
            
            // Otherwise, index 0 is number of dice
            // Index 1 is dice faces
            let total = 0;
            let out = '';
            
            for (let i = 0; i < nums[0]; i++)
            {
                let rolled = roll(nums[1]);
                total += rolled;
                
                if (out != '') out += ', ';
                
                out += rolled;
            }
            
            data.reply('Rolled ' + nums[0] + ' ' + nums[1] + '-sided dice.  Results:\n' +
                       'Total: ' + total + '\n' +
                       'Rolls: ' + out);
        }
        else
        {
            let num = parseInt(opts.args[1]);
            
            if (num <= 0 || isNaN(num))
            {
                data.react('❌');
                return;
            }
            
            data.reply('Dice landed on ' + roll(num));
        }
    }
    else if (opts.args[0] == '8ball')
    {
        const resp = [
            'As I see it, yes.',
            'Ask again later.',
            'Better not tell you now.',
            'Cannot predict now.',
            'Concentrate and ask again.',
            'Don\'t count on it.',
            'It is certain.',
            'It is decidedly so.',
            'Most likely.',
            'My reply is no.',
            'My sources say no.',
            'Outlook not so good.',
            'Outlook good.',
            'Reply hazy, try again later.',
            'Signs point to yes.',
            'Very doubtful.',
            'Without a doubt.',
            'Yes.',
            'Yes, definitely.',
            'You may rely on it.',
        ];
		
        let mess = new Discord.MessageEmbed()
            //.setTitle('Magic 8ball')
            .setColor(0x5DADE2)
            .addField(':8ball: says', `${resp[Math.floor(Math.random() * resp.length)]}`);
		
        data.channel.send(mess);
    }

    else if (opts.args[0] == 'emojis' || 
             opts.args[0] == 'emotes' ) // Shows list of custom emoji
    {
        let emojis = data.guild.emojis.cache;
        let out = '';
        let count = 1;
        let curr = 0;
        
        console.log('printing emojis');
        
        for (let i of emojis)
        {
            out += `${count++}) **${i[1].name}** : ${i[1]}\n`;
            curr++;
            if (curr >= 25)
            {
                curr = 0;
                data.channel.send(out);
                out = '';
            }
        }
        
        if (out != '')
            data.channel.send(out);
        else if (count == 0)
            data.reply('There are no emojis');
    }
    else if (opts.args[0] == 'modrank') // Lists currently highest rated mod
    {
        let modRole = config.get('modRole', opts.guild);
        
        if (modRole == '')
        {
            data.reply('No mod role set');
            return;
        }
        
        let role = data.guild.roles.resolve(modRole);
        
        if (!role)
        {
            data.reply('Can\'t find the mod role!');
            return;
        }
        
        // Mod role exists
        try
        {
            let twitter = new Twitter({
                consumer_key: process.env.TWITTERAPIKEY,
                consumer_secret: process.env.TWITTERAPISECRET,
                bearer_token: process.env.TWITTERBEARER
            });
            
            twitter.get('/search/tweets', {q: 'from:@PokemonGoApp', count: 1, result_type: 'recent'})
                .then((search) =>
                {
                    let tweet = search.statuses[0];
                    let arr = role.members.keyArray();
                    let modNum = arr[ (tweet.text.charCodeAt(0) + tweet.text.charCodeAt(5)) % role.members.size ];
                    let modNumWorst = arr[ (tweet.text.charCodeAt(5) + tweet.text.charCodeAt(7)) % role.members.size ];
                    
                    for (let i = 0; i < 5; i++) 
                    {
                        if (modNum != modNumWorst) break;
                        
                        modNumWorst = arr[(modNumWorst + tweet.text.charCodeAt(i)) % role.members.size];
                    }
                    
                    data.channel.send(`Based on my data, **${role.members.get(modNum).displayName}** is currently the best mod. **${role.members.get(modNumWorst).displayName}** is currently the worst mod.`);
                })
                .catch((err) =>
                {
                    console.log(`Error getting tweet ${err}`);
                });
        } catch (e)
        {
            console.log('Failed to get tweet');
            console.log(e);
            data.reply('Something went wrong with my data, try again later');
        }

    }
    else if (opts.args[0] == 'flip') // Flips subject
    {
        data.channel.send(makeSafe('\u0028\u256f\u00b0\u25a1\u00b0\uff09\u256f\ufe35 ' + flip(opts.withoutCommand)));
    }
    else if (opts.args[0] == 'setfc')
    {
        let num = null;
        
        // Support for multiple friend codes
        // > 2 args, accounting for thirs arg
        // Only support for up to 9
        if (opts.args.length > 2 && opts.args[1].length == 1)
        {
            try
            {
                num = parseInt(opts.args[1]);
                
                if (isNaN(num))
                    num = null;
            }
            catch (e)
            {
                num = null;
            }
        }
        
        let mod = data.author.id.toString() + (num != null && num > 1 ? num : '');
        
        let trainers = config.get('friendCodes', opts.guild);
        let ind = opts.withoutCommand.indexOf(' ');
        let mess = num != null ? opts.withoutCommand.substring( ind + 1 ) : opts.withoutCommand;
        mess = mess.replace(/ /g, '');
        
        if (typeof trainers[mod] == 'undefined')
            trainers[mod] = Object.assign({}, TRAINER);
        
        if (mess.length > 12 || mess.match(/[^0-9]/g))
        {
            data.reply('Looks like there\'s more than just a trainer code in there.  Please only include your 12-digit trainer code.');
            return;
        }
        
        if (mess.length < 12 && mess.length != 0)
        {
            data.reply('Looks like you\'re missing a few digits in your friend code.  Make sure you include all 12 digits.');
            return;
        }
        
        trainers[mod].code = mess;
        config.set('friendCodes', trainers, opts.guild);
        data.react('👌');
    }
    else if (opts.args[0] == 'setign')
    {
        let num = null;
        
        // Support for multiple friend codes
        // > 2 args, accounting for thirs arg
        // Only support for up to 9
        if (opts.args.length > 2 && opts.args[1].length == 1)
        {
            try
            {
                num = parseInt(opts.args[1]);
                
                if (isNaN(num))
                    num = null;
            }
            catch (e)
            {
                num = null;
            }
        }
        
        let mod = data.author.id.toString() + (num != null && num > 1 ? num : '');
        
        let trainers = config.get('friendCodes', opts.guild);
        let ind = opts.withoutCommand.indexOf(' ');
        let mess = num != null ? opts.withoutCommand.substring( ind + 1 ) : opts.withoutCommand;
        
        if (typeof trainers[mod] == 'undefined')
            trainers[mod] = Object.assign({}, TRAINER);
        
        if (opts.withoutCommand.length > 17)
        {
            data.reply('Looks like there\'s more than just a trainer name in there.  Please only include your in-game name.');
            return;
        }
        
        trainers[mod].name = mess;
        config.set('friendCodes', trainers, opts.guild);
        data.react('👌');
    }
    else if (opts.args[0] == 'fc')
    {
        let num = null;
        
        // Support for multiple friend codes
        // > 2 args, accounting for third arg
        // Only support for up to 9
        if (opts.args.length > 1 && opts.args[1].length == 1)
        {
            try
            {
                num = parseInt(opts.args[1]);
                
                if (isNaN(num))
                    num = null;
            }
            catch (e)
            {
                num = null;
            }
        }
        
        let mod = data.author.id.toString() + (num != null && num > 1 ? num : '');
        
        let trainer = getFCInfo(mod, opts.guild);
		
        if (trainer)
        {
            data.reply(`\n**IGN**: ${trainer.name != '' ? trainer.name : '*Not set*'}`);
            data.channel.send(trainer.code != '' ? trainer.code : '*Trainer code not set*');
            return;
        }
        
        data.reply('I don\'t have anything on record for you unfortunately.  Use the `setfc` and `setign` commands to fix that.');
    }
    /*
    else if (opts.args[0] == 'votekick' || 
             opts.args[0] == 'vk') // Votekicks user
    {
        let vkobj = config.get('votekickRecord', opts.guild);
        let mem = null;
        
        // Check for mentions, return if not found
        if (data.mentions.members.first())
            mem = data.mentions.members.first();
        else
        { 
            data.react('❌');
            return;
        }
        
        // Make new object member if guildmember id isn't found in current one
        if (typeof vkobj[mem.id] !== 'object')
            vkobj[mem.id] = {};
		
        // Make new array so user can't be kicked twice for one number
        if (typeof vkobj[mem.id].kicked !== 'object')
            vkobj[mem.id].kicked = [];
        
        // Check if this user has votekicked this guild member before
        if (typeof vkobj[mem.id][data.author.id] !== 'number')
            vkobj[mem.id][data.author.id] = 0;
        
        vkobj[mem.id][data.author.id]++;
        config.set('votekickRecord', vkobj, opts.guild);
		
        let count = countVotekick(vkobj[mem.id]);
        
        data.channel.send(count + ' votekicks for ' + makeSafe(mem.displayName));
		
		
        // Perform consequence if number of votekicks reaches threshold
        if (config.get('votekickThreshold', opts.guild) != 0 && 
			count % config.get('votekickThreshold', opts.guild) == 0 && 
			vkobj[mem.id].kicked.indexOf(count) == -1)
        {
            vkobj[mem.id].kicked.push(count);
            mem.roles.remove( config.get('verifyRoleID', opts.guild) );
            data.channel.send(makeSafe(mem.displayName) + ' has been kicked');
			
            config.set('votekickRecord', vkobj, opts.guild);
        }
		
		
    }
    else if (opts.args[0] == 'unvotekick' || 
             opts.args[0] == 'unvk') // Flips subject
    {
        let vkobj = config.get('votekickRecord', opts.guild);
        let mem = null;
        
        // Check for mentions, return if not found
        if (data.mentions.members.first())
            mem = data.mentions.members.first();
        else
        {
            data.react('❌');
            return;
        }
        
        // Make new object member if guildmember id isn't found in current one
        if (typeof vkobj[mem.id] !== 'object')
            vkobj[mem.id] = {};
        
        // Check if this user has votekicked this guild member before
        if (typeof vkobj[mem.id][data.author.id] !== 'number')
            vkobj[mem.id][data.author.id] = 0;
        
        // Dont subtract one if this user has never votekicked before
        if (vkobj[mem.id][data.author.id] > 0)
            vkobj[mem.id][data.author.id]--;
        
        config.set('votekickRecord', vkobj, opts.guild);
        
        data.channel.send(countVotekick(vkobj[mem.id]) + ' votekicks for ' + makeSafe(mem.displayName));
    }
    else if (opts.args[0] == 'numvotekicks' ||
             opts.args[0] == 'numvotekick' ||
             opts.args[0] == 'numvk' ||
             opts.args[0] == 'numvks')
    {
        let vkobj = config.get('votekickRecord', opts.guild);
        let mem = null;
        
        // Check for mentions, return if not found
        if (data.mentions.members.first())
            mem = data.mentions.members.first();
        else
        {
            data.react('❌');
            return;
        }
        
        // Make new object member if guildmember id isn't found in current one
        if (typeof vkobj[mem.id] !== 'object')
            vkobj[mem.id] = {};
        
        data.channel.send(countVotekick(vkobj[mem.id]) + ' votekicks for ' + makeSafe(mem.displayName));
    }
    */
    // *******************************
    // Raid commands
    // *******************************
    /*
    else if (opts.args[0] == 'want') // Adds user to sub list
    {
        let bossArr = opts.args.slice(1);
        let bosses = config.get('raidBosses', opts.guild);
        let out = '';
        let subs = config.get('raidSubs', opts.guild);
        
        // Check if boss(es) were specified
        if (bossArr.length > 0)
        {
            // Loop through bosses and want them
            
            for (let i in bossArr)
            {
                let boss = bossArr[i]
                
                // Check if boss string is present and somewhat valid
                if (typeof boss !== 'string' || boss.length < 3)
                {
                    out += ':negative_squared_cross_mark: Invalid boss\n';
                }
                
                let bossNorm = normalizeBoss(boss);
                
                if (isRaidBoss(boss, bosses) > -1)
                {
                    // Is a raid boss
                    
                    
                    if (typeof subs[bossNorm] === 'undefined')
                        subs[bossNorm] = [];
                    
                    if (subs[bossNorm].indexOf(data.author.id) == -1)
                    {
                        subs[bossNorm].push(data.author.id)
                    }
                    else
                    {
                        out += ':negative_squared_cross_mark: Already subbed to this boss\n';
                    }
                    
                }
                else
                {
                    // Is not a raid boss
                    out += ':negative_squared_cross_mark: Invalid boss\n';
                }
            }
            config.set('raidSubs', subs, opts.guild);
            data.react('👌');
			setTimeout(() => {
				data.delete();
			}, 5000);
            
			// Send message if out isn't empty.  Remove message after 5 seconds
            if (out != '')
                data.reply(out)
				.then((sent) => {
					setTimeout(() => {
						sent.delete();
					}, 5000);
				});
        }
        else
        {
            // List what bosses you're subbed to
            let list = [];
            
            for (let i in subs)
            {
                if (subs[i].indexOf(data.author.id) > -1)
                    list.push(i);
            }
            list.sort();
            
            data.reply('You\'re currently subbed to:\n' + list.join(', '));
        }
    }
    else if (opts.args[0] == 'unwant') // Removes user from sub list
    {
        let boss = opts.args[1];
        let bosses = config.get('raidBosses', opts.guild);
        
        // Check if boss string is present and somewhat valid
        if (typeof boss !== 'string' || boss.length < 3)
        {
            data.reply(':negative_squared_cross_mark: Invalid boss');
            return;
        }
        
        let bossNorm = normalizeBoss(boss);
        
        if (isRaidBoss(boss, bosses) > -1)
        {
            // Is a raid boss
            let subs = config.get('raidSubs', opts.guild);
            
            if (typeof subs[bossNorm] === 'undefined')
                subs[bossNorm] = [];
            
            let ind = subs[bossNorm].indexOf(data.author.id);
            
            if (ind > -1)
            {
                subs[bossNorm].splice(ind, 1);
                config.set('raidSubs', subs, opts.guild);
                data.react('👌');
            }
            else
            {
                data.reply(':negative_squared_cross_mark: You\'re not subbed to this raid boss');
            }
            
        }
        else
        {
            // Is not a raid boss
            data.reply(':negative_squared_cross_mark: Invalid boss');
            return;
        }
    }
    else if (opts.args[0] == 'raid') // Notifies user on sub list
    {
        let boss = opts.args[1];
        let loc = opts.args.slice(2).join(' ');
        let bosses = config.get('raidBosses', opts.guild);
        
        // Check if boss string is present and somewhat valid
        if (typeof boss !== 'string' || boss.length < 3)
        {
            data.reply(':negative_squared_cross_mark: Invalid boss');
            return;
        }
        
        // Check if location is specified
        if (typeof loc !== 'string' || loc == '')
        {
            data.reply(':negative_squared_cross_mark: Invalid location');
            return;
        }
        
        let bossNorm = normalizeBoss(boss);
        let tier = isRaidBoss(boss, bosses);
        
        if (tier > -1)
        {
            // Is a raid boss
            let subs = config.get('raidSubs', opts.guild);
            
            if (typeof subs[bossNorm] === 'undefined')
                subs[bossNorm] = [];
            
            dmAllRaidSubs(data, subs[bossNorm], bossNorm, tier, loc);
            data.react('👌');
        }
        else
        {
            // Is not a raid boss
            data.reply(':negative_squared_cross_mark: Invalid boss');
            return;
        }
    }
    
    else if (opts.args[0] == 'raidbosses'
             || opts.args[0] == 'raids') // Lists all raid bosses available rn
    {
        let bosses = config.get('raidBosses', opts.guild);
        let out = '';
        
        for (let i in bosses)
        {
            if (bosses[i].length == 0) continue;
            
            out += '**' + i + ':** ' + printBossTier(i, bosses) + '\n'
        }
        
        data.reply('\n' + out);
    } */
    
    
    // *******************************
    // Want quest commands
    // *******************************
    
    else if (opts.args[0] == 'wantquest' ||
             opts.args[0] == 'wantq') // Adds user quest sub list
    {
        let cats = config.get('questCategories', opts.guild);
        let inCat = opts.args[1].toLowerCase();
        let ind = cats.indexOf(inCat);
        
        if (ind > -1)
        {
            // Category exists
            createRoleINE(data, cats[ind], true)
                .then(role =>
                {
                    data.member.roles.add(role);
                    data.react('👌');
                });
        }
        else
        {
            data.react('❌');
        }
        
        
    }
    
    else if (opts.args[0] == 'unwantquest' ||
             opts.args[0] == 'unwantq') // Adds user quest sub list
    {
        let cats = config.get('questCategories', opts.guild);
        let inCat = opts.args[1].toLowerCase();
        let ind = cats.indexOf(inCat);
        
        if (ind > -1)
        {
            // Category exists
            let role = data.member.roles.cache.find((role) => role.name == cats[ind]);
            
            if (role)
            {
                // User is in role
                data.member.roles.remove(role)
                    .then(mem =>
                    {
                    // Remove role if there's no longer anyone in it
                    // if (role.members.size == 0)
                    // {
                        // role.delete();
                    // }
                    
                        data.react('👌');
                    });
                
                
            }
            else
                data.react('❌');
            
        }
        else
        {
            data.react('❌');
        }
        
        
    }
    else if (opts.args[0] == 'listquests' ||
             opts.args[0] == 'listquest' || 
             opts.args[0] == 'listq') // Cleans out empty roles
    {
        let cats = config.get('questCategories', opts.guild);
        let out = 'Available quest roles:\n';
        let roles = '';
        
        for (let i in cats)
        {
            if (roles != '') roles += ', ';
            roles += cats[i];
        }
        
        data.reply(out + roles);
    }
    
    // *******************************
    // Image commands
    // *******************************
    
    else if (opts.args[0] == 'gif') // Puts Gif from Giphy
    {
        let arg = opts.withoutCommand.replace(/[^a-zA-Z0-9 ]*/g , '').replace(/ /g, '+');
		
        if (arg == ''){
            data.reply('I don\'t see a subject there.');
            return;
        }
		
        let date = (Date.now() - config.get('gifLastPosted', opts.guild))/1000;
        if ( date < config.get('imageTimer', opts.guild) ){
            data.reply('I can\'t post another image for ' + Math.floor( config.get('imageTimer', opts.guild) - date ) + ' seconds');
            return;
        }
		
        let http = require('http');
        let string = '';
        http.get({
            host: 'api.giphy.com',
            path: '/v1/gifs/search?q=' + arg + '&api_key=' + process.env.GIPHYAPIKEY + '&limit=7'
        }, function( res ){
            res.setEncoding('utf8');
            res.on('data', function(dat){
                string += dat;
            });
        }).on('close', function(dat){
            try {
                let parsedRes = JSON.parse(string);
			
                if (typeof parsedRes.data == 'object'){
                    if (parsedRes.data.length === 0){
                        data.reply('Looks like Giphy didn\'t turn up anything relevant');
                        return;
                    }
                    let num = 0;
					
                    // while (num < parsedRes.data.length){
                    for (let i = 0; i < parsedRes.data.length; i++)
                    {
                        // let rand = Math.floor( Math.random()*parsedRes.data.length );
						
                        if (parsedRes.data[ i ].rating == 'r'){
                            // num++;
                            continue;
                        }
                        data.reply(parsedRes.data[ i ].images.downsized.url.split('?')[0]);
                        config.set('gifLastPosted', Date.now(), opts.guild);
                        return;
                    }
                    data.reply('Sorry, I couldn\'t find a SFW image...');
                }else{
                    data.reply('Looks like something went wrong somewhere.  Let @Foodbandlt know!');
                }
            }catch (e){
                console.log(e);
                console.log(dat);
                data.reply('An error turned up.  Let @Foodbandlt know!');
                return;
            }
        }).on('error', function(e) {
            console.log(e);
        });
    }
    else if (opts.args[0] == 'img') // puts image from Google Images
    {
        let arg = opts.withoutCommand.replace(/[^a-zA-Z0-9 ]*/g , '').replace(/ /g, '+');
		
        if (arg == ''){
            data.reply('I don\'t see a subject there.');
            return;
        }
		
        let date = (Date.now() - config.get('gifLastPosted', opts.guild))/1000;
        if ( date < config.get('imageTimer', opts.guild) ){
            data.reply('I can\'t post another image for ' + Math.floor( config.get('imageTimer', opts.guild) - date ) + ' seconds');
            return;
        }
		
        let http = require('https');
        let string = '';
        http.get({
            host: 'www.googleapis.com',
            path: '/customsearch/v1?q=' + arg + '&key=AIzaSyAk0_Zufjwrp3kwTgC5neMmtmRqxnzQ8SM&cx=006873268927963104081:ic0fmdkig5w&searchType=image'
        }, function( res ){
            res.setEncoding('utf8');
            res.on('data', function(dat){
                string += dat;
            });
        }).on('close', function(dat){
            let parsedRes = JSON.parse(string);
            if (typeof parsedRes.items == 'object' && parsedRes.items.length > 0){
                // let rand = Math.floor( Math.random()*parsedRes.items.length );
                data.reply(parsedRes.items[ 0 ].link);
                config.set('gifLastPosted', Date.now(), opts.guild);
            }else{
                data.reply('It looks like we\'re over the quota!  Make sure you let @Foodbandlt know!');
            }
        }).on('error', function(e) {
            console.log(e);
        });
    }
    else if (opts.args[0] == 'stats') // Prints stats
    {
        let guildObj = data.guild;
		
        let role = guildObj.roles.resolve(config.get('verifyRoleID', opts.guild));

        if (role)
        {
            data.reply(  '\nMember count: ' + guildObj.memberCount + 
                                '\nMembers not verified: ' + (guildObj.memberCount - role.members.size - 1) +
                                '\n% verified: ' + ( (role.members.size + 1) / guildObj.memberCount ) * 100 + '%'
            );
        }
        else
        {
            data.reply('Not setup in this Discord');
        }
    }
    else if (opts.args[0] == 'numwants' ||
             opts.args[0] == 'numwant' ||
             opts.args[0] == 'wantnum') // Tells how many people want a pokemon
    {
        let guildObj = data.guild;
        let role = guildObj.roles.cache.find((role) => role.name == opts.origArgs[1]);
		
        if (role)
            data.reply('There are ' + role.members.size + ' members in that role');
        else
            data.reply('Role not found (0 people want it)');
    }
    else if (opts.args[0] == 'listwants' || 
             opts.args[0] == 'listwant' || 
             opts.args[0] == 'wantlist' || 
             opts.args[0] == 'wantslist' ) // Lists people that want that mon
    {
        let guildObj = data.guild;
        let role = guildObj.roles.cache.find((role) => role.name == opts.origArgs[1]);
        let out = '';
		
        // Don't want people listing out entire Verified role...
        if (role && role.id != config.get('verifyRoleID', opts.guild))
        {
            for (let i of role.members)
            {
                if (out != '') out += ', ';
				
                out += '**' + i[1].displayName + '**';
            }
            data.reply(' List of users in that role:\n' + out);
        }
        else
            data.reply('Role not found (0 people want it)');
    }
    else
    {
        // console.log('Checking for custom command: ' + opts.args[0]);
        // Check for custom command
        let comms = config.get('customCommands', opts.guild);
        if (comms[opts.args[0]])
        {
            console.log('Custom command found');
            data.channel.send(comms[opts.args[0]]);
        }
    }
    
}

function processGymCommand(data, opts)
{
    if (opts.args[0] == 'commands') // Lists commands
    {
        let c = config.get('commandCharacter', opts.guild);
        data.channel.send('**Gyms**\n' +
			'`'+ c + 'gymrules` - Shows gym rules\n' +
            '     Alias: `'+ c + 'rules`\n' +
			'`'+ c + 'mybadges` - Shows your gym badges\n' +
			'`'+ c + 'badgestats <type>` - Shows stats badge of specified type\n' +
			'`'+ c + 'gymleaders` - Lists all gym leaders\n' +
			'     Alias: `'+ c + 'leaders`\n' +
            '`'+ c + 'optin` - Opts you into the **Gym Challenger** role.\n' +
			'`'+ c + 'optout` - Opts you out of the **Gym Challenger** role.\n'
        );
    }
    
    else if (opts.args[0] == 'rules' ||
        opts.args[0] == 'gymrules')
    {
        let rules = config.get('gymRules', opts.guild);
        
        if (rules != '')
            data.channel.send(rules);
        else
            data.reply('No rules have been specified yet');
    }
    
    else if (opts.args[0] == 'badges' ||
        opts.args[0] == 'mybadges')
    {
        let leaders = config.get('gymLeaders', opts.guild);
        let badges = config.get('gymBadges', opts.guild);
        let out = '';
        let userMention = data.mentions.members.first();
        let trainer;
        let doneBadges = [];
        let length = 0;
		
        if (userMention)
            trainer = userMention.id;
        else if (typeof opts.args[1] === 'string')
            trainer = opts.args[1];
        else
            trainer = data.author.id;
        
        let userBadges = getBadges(badges, trainer);
        length = userBadges.length;
        
        if (userBadges.length == 0)
        {
            data.reply('You don\'t have any badges');
            return;
        }
		
        while (userBadges.length > 0)
        {
            let earliest = 999999999999999;
            let ind = -1;
			
            for (let i in userBadges)
            {
                if (userBadges[i].time < earliest)
                {
                    earliest = userBadges[i].time;
                    ind = i;
                }
            }
            // A dumb check, but just to be safe
            if (ind == -1) break;
			
            if (out != '') out += '\n';
            let date = new Date(userBadges[ind].time);
				
            out += `${capsFirstLetter(userBadges[ind].type)} : ${date.getMonth()+1}/${date.getDate()}/${date.getFullYear()}`;
            userBadges.splice(ind, 1);
        }
        
        data.reply('**Badges** (' + length + ' / 18):\n' + out);
    }

    else if (opts.args[0] == 'leaders' ||
             opts.args[0] == 'gymleaders')
    {
        let leaders = config.get('gymLeaders', opts.guild);
        let out = '';
        
        data.guild.members.fetch()
            .then(mems =>
            {
                
                for (let i in leaders)
                {
                    if (out != '') out += '\n';
                    
                    let lead = mems.get(leaders[i]);
                    
                    if (leaders[i] != 0 && !lead)
                    {
                        console.log(`Can't find *${i}* leader ${leaders[i]} in guildF.members, defaulting to none.`);
                    }
                
                    out += '**' + capsFirstLetter(i) + '**: ' + (leaders[i] != 0 && lead ? lead.displayName : '*None*');
                
                }
                data.channel.send('**Gym leaders**:\n' + out);
            });
    }
    
    else if (opts.args[0] == 'optout')
    {
        let challRole = config.get('gymChallengerRoleID', opts.guild);
        let optout = config.get('gymChallengerOptOut');
        optout.push(data.author.id);
        config.set('gymChallengerOptOut', optout, opts.guild);
        
        data.member.roles.remove(challRole);
        
        data.reply('All right, I\'ve removed you from the Gym Challenger role.  You\'re free to still participate, but the role will not be added to you unless you opt-in again with `!optin`');
    }
    
    else if (opts.args[0] == 'optin')
    {
        let challRole = config.get('gymChallengerRoleID', opts.guild);
        let optout = config.get('gymChallengerOptOut');
        let ind = optout.indexOf(data.author.id);
        
        if (ind > -1)
        {
            optout.splice(ind, 1);
            config.set('gymChallengerOptOut', optout, opts.guild);
        }
        
        data.member.roles.add(challRole);
        
        data.reply('Cool, I\'ve added the Gym Challenger role to you.  You will be alerted when Gym Leaders are available. If you want to opt-out of this role, use `!optout`');
    }
	
    else if (opts.args[0] == 'badgestats')
    {
        let leaders = config.get('gymLeaders', opts.guild);
        let badges = config.get('gymBadges', opts.guild);
        let out = '';
        let total = 0;
        let type = opts.args[1];
        
        // Check if type is specified
        if (typeof type !== 'string' || typeof leaders[type] === 'undefined')
        {
            let out = '';
            
            for (let i in badges)
            {
                if (out != '') out += '\n';
            
                total += badges[i].length;
                out += `**${capsFirstLetter(i)}**: ${badges[i].length}`;
        
            }
            data.channel.send(`**Total Badges handed out:** ${total}\n${out}\n`);
               
        }
        else
        {
            let leader = leaders[type];
            let badge = badges[type];
            
            data.guild.members.fetch(leader)
                .then(mem =>
                {
                    data.channel.send('__**' + capsFirstLetter(type) + ' Badge**__\n' +
                                      '**Leader**: ' + mem.displayName + '\n' +
                                      '**Badges handed out**: ' + badge.length);
                });
        }
    }
    
    // Check for gym leader role, return if not present
    if ( !data.member.roles.cache.get( config.get('gymRoleID', opts.guild) )) return;
    
    if (opts.args[0] == 'commands') // Lists commands
    {
        let c = config.get('commandCharacter', opts.guild);
        data.channel.send('**Gym Leader**\n' +
			'`'+ c + 'givebadge <@trainer>` - Gives your badge to mentioned trainer\n' +
			'     Alias: `'+ c + 'addbadge`, `gb`\n' +
			'`'+ c + 'takebadge <@trainer>` - Revokes your badge from mentioned trainer\n' +
			'     Alias: `'+ c + 'rmbadge`, `removebadge`\n' +
            '`'+ c + 'badgelist` - Lists everyone that has your badge\n' +
			'     Alias: `'+ c + 'listbadge`\n' +
			'`'+ c + 'passleader` - Passes your gym leader status on to the mentioned trainer\n' +
			'`'+ c + 'giveupgymleader` - Gives up your gym leader position\n'
        );
    }
	
    else if (opts.args[0] == 'givebadge' ||
             opts.args[0] == 'gb' ||
        opts.args[0] == 'addbadge')
    {
        // infer type from gym leaders object
        let leaders = config.get('gymLeaders', opts.guild);
        let badges = config.get('gymBadges', opts.guild);
        let type = findTypeFromID(leaders, data.author.id);
        let userMention = data.mentions.members.first();
        let challRole = config.get('gymChallengerRoleID', opts.guild);
        
        
        if (!type){
            // This should never really happen, but just in case...
            data.reply('Unable to determine what gym leader type you are (something has gone very wrong)');
            return;
        }
        
        if (userMention)
        {
            if (!hasBadge(badges, type, userMention.id))
            {
                let badge = Object.assign({}, BADGE);
                badge.time = Date.now();
                badge.leaderID = data.author.id;
                badge.leaderName = data.member.displayName;
				
                badges[type][userMention.id] = badge;
                badges[type].length++;
				
                config.set('gymBadges', badges, opts.guild);
                data.channel.send(userMention + ' has obtained the **' + capsFirstLetter(type) + '** badge!');
                
                // Add challenger role if setup and user does not already have it
                if (config.get('isGymChallengerRoleSetup', opts.guild) && 
                    !userMention.roles.cache.get(challRole) && 
                    config.get('gymChallengerOptOut').indexOf(data.author.id) == -1)
                    
                    userMention.roles.add(challRole);
            }
            else
            {
                // User already has badge
                data.reply('That trainer already has your badge!');
            }
        }
        else
        {
            data.reply('I don\'t see a user mention in your message');
            return;
        }
    }
    
    else if (opts.args[0] == 'takebadge' ||
             opts.args[0] == 'rmbadge' ||
             opts.args[0] == 'removebadge')
    {
        // infer type from gym leaders object
        let leaders = config.get('gymLeaders', opts.guild);
        let badges = config.get('gymBadges', opts.guild);
        let type = findTypeFromID(leaders, data.author.id);
        let userMention = data.mentions.members.first();
        
        if (!type){
            // This should never really happen, but just in case...
            data.reply('Unable to determine what gym leader type you are (something has gone very wrong)');
            return;
        }
        
        if (userMention)
        {
            if (hasBadge(badges, type, userMention.id))
            {
                delete badges[type][userMention.id];
                badges[type].length--;
            }
        
            config.set('gymBadges', badges, opts.guild);
            data.react('👌');
        }
        else
        {
            data.reply('I don\'t see a user mention in your message');
            return;
        }
    }
	
    else if (opts.args[0] == 'listbadges' || 
             opts.args[0] == 'listbadge' || 
             opts.args[0] == 'badgelist' || 
             opts.args[0] == 'badgeslist' ) // Lists people that have that badge
    {
        let leaders = config.get('gymLeaders', opts.guild);
        let badges = config.get('gymBadges', opts.guild);
        let out = '';
        let type = findTypeFromID(leaders, data.author.id);
        
        if (!config.get('isGymLeaderRoleSetup', opts.guild)) return;
        
        // Check if type is specified
        if (typeof opts.args[1] === 'string' && typeof leaders[opts.args[1]] !== 'undefined')
            type = opts.args[1];
		
        if (typeof leaders[type] === 'undefined')
        {
            data.reply('Invalid type specified');
            return;
        }
		
        data.guild.members.fetch()
            .then(mems =>
            {
                for (let i in badges[type])
                {
                    let mem = mems.get(i);
                    
                    // Continue if member is no longer in guild
                    if (leaders[i] != 0 && !mem)
                        continue;
                    
                    if (out != '') out += ', ';
                    
                    out += '**' + mem.displayName + '**';
                }
                
                if (out != '')
                    data.channel.send(`__Owners of the *${capsFirstLetter(type)} Badge* (${badges[type].length}):__\n${out}`);
                else
                    data.reply(`Nobody has obtained the **${capsFirstLetter(type)} Badge** yet`);
            });
    }
    
    else if (opts.args[0] == 'passleader' ||
             opts.args[0] == 'passgymleader')
    {
        if (!config.get('isGymLeaderRoleSetup', opts.guild)) return;
        
        let leaders = config.get('gymLeaders', opts.guild);
        let type = findTypeFromID(leaders, data.author.id);
        let userMention = data.mentions.members.first();
		
        if (userMention)
        {
            let otherType = findTypeFromID(leaders, userMention.id);
            
            if (otherType)
            {
                data.reply('That trainer is already a gym leader.  They\'ll need to give it up before you can pass to them.');
                return;
            }
            
            // Remove role from old leader
            data.member.roles.remove( config.get('gymRoleID', opts.guild) );
            
            // Add role and set as leader in the leader object
            userMention.roles.add( config.get('gymRoleID', opts.guild) );
            leaders[type] = userMention.id;
            
            config.set('gymLeaders', leaders, opts.guild);
            data.react('👌');
        }
        else
        {
            data.reply('I don\'t see a user mention in your message');
            return;
        }
    }
	
    else if (opts.args[0] == 'giveupleader' ||
             opts.args[0] == 'giveupgymleader')
    {
        if (!config.get('isGymLeaderRoleSetup', opts.guild)) return;
        
        let leaders = config.get('gymLeaders', opts.guild);
        let type = findTypeFromID(leaders, data.author.id);
        let userMention = data.mentions.members.first();
		
        // Remove role from old leader
        data.member.roles.remove( config.get('gymRoleID', opts.guild) );
        leaders[type] = 0;
		
        config.set('gymLeaders', leaders, opts.guild);
        data.react('👌');

    }

    
}

function processGymAdminCommand(data, opts)
{
    if (opts.args[0] == 'commands') // Lists commands
    {
        let c = config.get('commandCharacter', opts.guild);
        data.channel.send('**Gym Admin**\n' +
			'`'+ c + 'setgymrules <rules>` - Sets what I say when the `rules` command is used\n' +
            '     Alias: `'+ c + 'setrules`\n' +
			'`'+ c + 'setgymleader <type> <@trainer>` - Assigns mentioned trainer to gym leader position\n' +
			'     Alias: `'+ c + 'setleader`\n' +
			'`'+ c + 'rmgymleader <@trainer>` - Revokes gym leader status from mentioned trainer\n' +
			'     Alias: `'+ c + 'rmleader`\n'
        );
    }
    
    else if (opts.args[0] == 'setrules' ||
        opts.args[0] == 'setgymrules')
    {
        let rules = opts.origArgs.slice(1).join(' ');
        
        if (rules != '')
        {
            config.set('gymRules', rules, opts.guild);
            data.react('👌');
        }
        else
            data.reply('I don\'t see any rules there :thinking:');
    }
	
    else if (opts.args[0] == 'setgymleader' ||
        opts.args[0] == 'setleader')
    {
        let leaders = config.get('gymLeaders', opts.guild);
        let userMention = data.mentions.members.first();
        
        if (!config.get('isGymLeaderRoleSetup', opts.guild)) return;
        
        // Check if type is specified
        if (typeof opts.args[1] !== 'string' || typeof leaders[opts.args[1]] === 'undefined')
        {
            data.reply('Could not find gym type in your message.  Expected arguments: `<type> <@user>`');
            return;
        }
		
        if (typeof leaders[opts.args[1]] === 'undefined')
        {
            data.reply('Invalid type specified');
            return;
        }
        
        
		
        if (userMention)
        {
            let type = findTypeFromID(leaders, userMention.id);
            
            if (leaders[opts.args[1]] != 0)
            {
                // Then there's already a leader set.  Remove them first
                data.guild.members.fetch(leaders[opts.args[1]])
                    .then(mem =>
                    {
                        mem.roles.remove(config.get('gymRoleID', opts.guild));
                    });
            }
            
            // Remove old gym leader type if exists
            if (type)
            {
                leaders[type] = 0;
            }
            
            // Add role and set as leader in the leader object
            userMention.roles.add( config.get('gymRoleID', opts.guild) );
            leaders[opts.args[1]] = userMention.id;
            
            config.set('gymLeaders', leaders, opts.guild);
            data.react('👌');
        }
        else
        {
            data.reply('I don\'t see a user mention in your message');
            return;
        }
    }

    else if (opts.args[0] == 'rmleader' ||
             opts.args[0] == 'rmgymleader')
    {
        let leaders = config.get('gymLeaders', opts.guild);
        let userMention = data.mentions.members.first();
        
        
        if (!config.get('isGymLeaderRoleSetup', opts.guild)) return;
		
        if (userMention)
        {
            let type = findTypeFromID(leaders, userMention.id);
            
            
            // Add role and set as leader in the leader object
            // We want this to happenw whether type is null or not to remove erroneous roles
            userMention.roles.remove( config.get('gymRoleID', opts.guild) );
            
            if (type)
                leaders[type] = 0;
            
            config.set('gymLeaders', leaders, opts.guild);
            data.react('👌');
        }
        else
        {
            data.reply('I don\'t see a user mention in your message');
            return;
        }
    }
}

function processAdminCommand(data, opts)
{
    if (opts.args[0] == 'commands' && typeof opts.args[1] === 'undefined') // Lists commands
    {
        let c = config.get('commandCharacter', opts.guild);
        data.channel.send(
            '\n**Admin commands**\n' +
			'`'+ c + config.get('verifyKeyword', opts.guild) + ' @<username>` - Used to verify specific user.\n' +
			'`'+ c + 'unverify @<username>` - Unverified user specified.  They must be tagged\n' +
            '\n**Mute commands**\n' +
            '`'+ c + 'mute @<username> <time> <reason>` - Mutes user for specified time. Time format: `5s5m5h5d5mo`\n' +
            '     **Details**: `5s`: 5 seconds, `5m`: 5 minutes, `5h`: 5 hours, `5d`: 5 days, `5mo`: 5 months.\n' +
            '     **Omit any unused time periods.  `5s5d`: 5 days and 5 seconds**\n' +
			'     **Alias**: `m`' +
            '`'+ c + 'unmute @<username>` - Unmutes user\n' +
            '`'+ c + 'mutedetails @<username>` - Shows details of mute\n' +
            '`'+ c + 'mutesetrole @<role>` - Sets muted role\n' +
            '`'+ c + 'muteunsetrole` - Unsets muted role\n' +
            '`'+ c + 'lookup @<username>` - Looks up info about user tagged\n' +
            '`'+ c + 'lookupbyign <ign>` - Looks up discord user by ign\n' +
            /*
            '\n**Raids**\n' +
			'`'+ c + 'addboss <tier> <boss>` - Adds boss to specified tier\n' +
			'`'+ c + 'rmboss <boss>` - Removes boss\n' +
			'`'+ c + 'rmallbosses` - Removes all bosses\n' +
			*/
            '\n**Emojis**\n' +
			'`'+ c + 'addemoji <name> <image URL>` - Adds Emoji\n' +
			'`'+ c + 'rmemoji <name>` - Removes emoji\n' +
			'`'+ c + 'editemoji <name> <newname>` - Changes emoji name from name to newname\n' +
			'\n**Gym Admin**\n' +
			'`'+ c + 'addgymadmin <@user>` - Adds mentioned user to gym admin list\n' +
			'`'+ c + 'rmgymadmin <@user>` - Removes mentioned user from gym admin list\n' +
			'`'+ c + 'getgymadmins` - Lists all gym admins\n' +
			'`'+ c + 'setgymchannel` - Sets channel where gym commands can be used\n' +
			'`'+ c + 'unsetgymchannel` - Unsets gym channel, letting commands be used everywhere\n' +
            '\n**Custom commands**\n' +
            '`'+ c + 'addcommand <command> <contents>` - Adds a custom command that prints out contents\n' +
			'`'+ c + 'rmcommand <name>` - Removes command\n' +
			'`'+ c + 'rncommand <name>` - Renames command\n' +
            '`'+ c + 'editcommand <name> <contents>` - Changes command contents\n' +
            '\n**Custom roles**\n' +
            '`'+ c + 'roles.add <role>` - Adds a mentionable role\n' +
			'`'+ c + 'rmrole <role>` - Removes role\n' +
			'`'+ c + 'rnrole <old role> <new role>` - Renames role\n' +
			'`'+ c + 'cleanroles <role>` - Cleans up empty roles\n');
        data.channel.send(
            '\n**DMs**\n' +
			'`'+ c + 'setdm <message>` - Sets new DM message for new users\n' +
			'`'+ c + 'getdm` - Shows DM enabled/disabled and currently set DM\n' +
			'`'+ c + 'testdm` - Sends you a DM just like a new user would receive\n' +
			'`'+ c + 'senddmtounverified` - Sends DM to all unverified users\n' +
			'`'+ c + 'enabledm` - Enables DMing new users.  Message must be set already using `'+ c + 'setdm`. Current: `' + config.get('isDMEnabled', opts.guild) + '`\n' +
			'`'+ c + 'disabledm` - Disables DMing new users.\n' +
            '\n**Administration**\n' +
            '`'+ c + 'setimagetimer <number>` - Time in seconds for gif and image command cooldown. Current: `' + config.get('imageTimer', opts.guild) + '`\n' +
            '`'+ c + 'setvkthreshold <number>` - Set the threshold for someone to get votekicked. Current: `' + config.get('votekickThreshold', opts.guild) + '`\n' +
            '`'+ c + 'setmodrole @<role>` - Sets the mod role\n' +
            '`'+ c + 'getpokemonroles <number>` - Gets pokemon roles with <= `number` people in them\n' +
            '`'+ c + 'rmpokemonroles <pokemon1>,<pokemon2>...` - Removes pokemon roles listed\n' +
            '`'+ c + 'addadminrole <role>` - Adds a role to the admin list, allowing use of administration commands (besides this one)\n' +
            '`'+ c + 'rmadminrole <role>` - Removes a role from the admin list\n' +
            '`'+ c + 'getadminroles` - Lists roles that are admins\n' +
			'`'+ c + 'setcommand <symbol>` - Sets new command character to use chat commands. Current: `' + config.get('commandCharacter', opts.guild) + '`\n' +
            '`'+ c + 'setkeyword <keyword>` - Sets new keyword for being verified.  One word, no spaces.  Current: `' + config.get('verifyKeyword', opts.guild) + '`\n' +
			'`'+ c + 'showchannel` - Makes channel visible to non-verified (but not able to send messages)\n' +
			'`'+ c + 'hidechannel` - Makes channel invisible to unverified (channels aren\'t visible by default)\n' +
			'`'+ c + 'verifyall` - Verifies all users currently in the server\n' +
			'`'+ c + 'unverifyall` - Unverifies all users currently in the server\n' +
			'`'+ c + 'setup [setup_type]` - Runs setup.  Can only be run if not currently setup.  Use `'+ c + 'unsetup` to reverse this\n' +
			'`'+ c + 'unsetup [setup_type]` - Reverses setup and puts things back like they were\n' +
			'	`setup_types` (optional) - `role`, `everyone` (for permissions), `channel`');
        
    }
    /*
	else if (opts.args[0] == 'setusername') // Sets username
    {
        client.user.setUsername(opts.origArgs[1]);
		data.reply('Username set to ' + opts.origArgs[1]);
    }
	*/
    
    // *******************************
    // VERIFY-RELATED COMMANDS
    // *******************************
    
    else if (opts.args[0] == 'test') // Unverify pinged user
    {
        testF(data);
    }
    
    else if (opts.args[0] == 'unverify') // Unverify pinged user
    {
        if (!config.get('isRoleSetup', opts.guild)) return;
		
        console.log('Unverifying user specified');
		
        if (data.mentions.members.first())
        {
            data.mentions.members.first().roles.remove( config.get('verifyRoleID', opts.guild) );
            data.react('👌');
        }
        else
            data.react('❌');
    }
    else if (opts.args[0] == config.get('verifyKeyword', opts.guild)) // Verify user specified
    {
        if (!config.get('isRoleSetup', opts.guild)) return;
		
        console.log('Verifying user specified');
		
        if (data.mentions.members.first())
        {
            data.mentions.members.first().roles.add( config.get('verifyRoleID', opts.guild) );
            data.react('👌');
        }
        else
            data.react('❌');
    }
    else if (opts.args[0] == 'verifyall') // Verify all current users
    {
        console.log('VerifyAll called');
        let num = verifyAll(data);
        data.react('👌');
        data.reply('Verified ' + num + ' users.');
    }
    else if (opts.args[0] == 'unverifyall') // Unverify all current users
    {
        console.log('UnVerifyAll called');
        let num = unverifyAll(data);
        data.react('👌');
        data.reply('Everyone is being unverified');
    }
    
    // *******************************
    // MUTING COMMANDS
    // *******************************
    
    else if (opts.args[0] == 'mute' || opts.args[0] == 'm') // Unverify all current users
    {
        let muted = config.get('mutedObj', opts.guild);
        let mutedRole = config.get('mutedRole', opts.guild);
        let mem = data.mentions.members.first();
		
        if (!mem)
        {
            data.reply('I don\'t see a user mention in there anywhere');
            return;
        }
        
        if (opts.args.length <= 2)
        {
            data.reply('I don\'t see a time or reason in your message anywhere');
            return;
        }
		
		
        if (muted.ids.indexOf(mem.id) > -1)
        {
            data.reply('User already muted, details:');
            return;
        }
		
        if (mutedRole == '')
        {
            data.reply('Muted role not setup, use mutesetrole');
            return;
        }
        
        let time = parseInt(opts.args[2]);
        
        if (isNaN(time))
        {
            data.reply('I don\'t see a time in your message');
            return;
        }
        
        if (time.toString().length != opts.args[2].length)
        {
            // Time string is more complex
            time = getMilliFromString(opts.args[2]);
        }
        else
        {
            time *= 1000;
        }
        
        if (time == 0)
        {
            data.reply('I don\'t see a time in your message');
            return;
        }
		
        // Someone was mentioned
        // !mute user time reason
        
        
        let obj = {
            user: mem.id,
            time: Date.now(),
            banner: data.member.id,
            reason: opts.args.length >= 3 ? opts.args.slice(3).join(' ') : '',
            until: Date.now() + time
        };
		
        mute(obj, data.guild, (error, mem) =>
        {
            if (error && error == 'time')
            {
                data.reply('Time specified is too short!  You may as well just yell at them lmao');
                return;
            }
            
            let embed = makeMuteEmbed(obj, data.member, mem);
            data.channel.send(embed);
            
            //data.reply(`**${mem.user.username}#${mem.user.discriminator} (${mem.displayName})** muted for ${milliToString(time)}`);
        });
        
    }
    else if (opts.args[0] == 'unmute') // Unverify all current users
    {
        let muted = config.get('mutedObj', opts.guild);
        let mutedRole = config.get('mutedRole', opts.guild);
        let mem = data.mentions.members.first();
		
        if (!mem)
        {
            data.reply('I don\'t see a user mention in there anywhere');
            return;
        }
		
        if (mutedRole == '')
        {
            data.reply('Muted role not setup, use mutesetrole');
            return;
        }
		
        let ind = muted.ids.indexOf(mem.id);
        
        if (ind == -1)
        {
            data.reply('The user doesn\'t appear to be muted');
            return;
        }
        
        
        
        unmute(mem.id, data.guild, (error, mem) =>
        {
            console.log(`${mem.user.username}#${mem.user.discriminator} (${mem.displayName}) unmuted by ${data.author.username}#${data.author.discriminator}`);
            data.react('👌');
        });
    }
    else if (opts.args[0] == 'mutedetails' || opts.args[0] == 'muteinfo') // Unverify all current users
    {
        let muted = config.get('mutedObj', opts.guild);
        let mem = data.mentions.members.first();
		
        if (!mem)
        {
            data.reply('I don\'t see a user mention in there anywhere');
            return;
        }
		
        
        let ind = muted.ids.indexOf(mem.id);
		
        if (ind == -1)
        {
            data.reply('User does not appear to be muted');
            return;
        }
		
        for (let i in muted.objs)
        {
            if (muted.objs[i].user == mem.id)
            {
                let obj = muted.objs[i];
                let muteTime = (obj.until - obj.time);
                let muteUntil = new Date(obj.until);
                data.guild.members.fetch(obj.banner)
                    .then( member =>
                    {
                        let embed = makeMuteEmbed(obj, member, mem);
                        
                        //data.reply(`**${mem.user.username}#${mem.user.discriminator} (${mem.displayName})** muted ${new Date(obj.time)} by ${member.displayName} for ${milliToString(muteTime)}\n**Reason:** ${obj.reason}`);

                        data.channel.send(embed);
                    });
                break;
            }
        }
        
    }
    
    else if (opts.args[0] == 'mutesetrole') // Unverify all current users
    {
        let role = data.mentions.roles.first();
		
        if (!role)
        {
            data.reply('I don\'t see a role mention in there anywhere');
            return;
        }

        config.set('mutedRole', role.id, opts.guild);
        data.react('👌');
    }
    
    else if (opts.args[0] == 'muteunsetrole') 
    {
        config.set('mutedRole', '', opts.guild);
        data.react('👌');
    }
	
    else if (opts.args[0] == 'lookup' || opts.args[0] == 'whois') 
    {
        let mem = data.mentions.members.first();
		
        if (!mem)
        {
            data.reply('I don\'t see a user mention in there anywhere');
            return;
        }
		
        let trainer = getFCInfo(mem.id, opts.guild);
		
        if (trainer)
        {
            data.reply(`\n**IGN**: ${trainer.name != '' ? trainer.name : '*Not set*'}`);
            data.channel.send(trainer.code != '' ? trainer.code : '*Trainer code not set*');
            return;
        }
		
        data.reply('No records for that user found');
    }
	
    else if (opts.args[0] == 'lookupbyign' || opts.args[0] == 'whoisbyign') 
    {
        let trainer = getFCInfoByIGN(opts.args[1], opts.guild);
        let discordStr = '';
		
        if (trainer)
        {
            data.guild.members.fetch(trainer.id)
                .then( (mem) =>
                {
                    discordStr = `\n**Discord**: ${mem.displayName} (${mem.user.username}#${mem.user.discriminator})`;
                })
                .catch( () =>
                {
                    discordStr = '\n**Discord**: unknown';
                })
                .finally( (mem) => 
                {
                    data.reply(`${discordStr}\n**IGN**: ${trainer.name != '' ? trainer.name : '*Not set*'}`);
                    data.channel.send(trainer.code != '' ? trainer.code : '*Trainer code not set*');
                });
            
            return;
        }
		
        data.reply('No records for that IGN found');
    }
    
    // *******************************
    // BOT ADMINISTRATION COMMANDS
    // *******************************
    
    else if (opts.args[0] == 'addadminrole') // Adds a role that can use admin commands (besides this one)
    {
        if (!opts.isAdmin && opts.isAdminRole)
        {
            data.reply('Sorry, this is literally the only command you can\'t use, lol.  Ask an administrator.');
            return;
        }
        
        if (data.mentions.roles.size == 0)
        {
            data.reply('I don\'t see any role mentions.');
            return;
        }
        
        let roles = config.get('adminRoles', opts.guild);
        roles.push(data.mentions.roles.first().id);
        config.set('adminRoles', roles, opts.guild);
        data.react('👌');
    }
    else if (opts.args[0] == 'rmadminrole') // Adds a role that can use admin commands (besides this one)
    {
        if (!opts.isAdmin && opts.isAdminRole)
        {
            data.reply('Sorry, this is literally the only command you can\'t use, lol.  Ask an administrator.');
            return;
        }
        
        if (data.mentions.roles.size == 0)
        {
            data.reply('I don\'t see any role mentions.');
            return;
        }
        
        let roles = config.get('adminRoles', opts.guild);
        let ind = roles.indexOf(data.mentions.roles.first().id);
        
        if (ind == -1)
        {
            data.reply('Role does not appear to be an admin role');
            return;
        }
        
        roles.splice(ind, 1);
        config.set('adminRoles', roles, opts.guild);
        data.react('👌');
    }
    else if (opts.args[0] == 'getadminroles') // Lists roles that can use admin commands
    {
        let roles = config.get('adminRoles', opts.guild);
        let out = '';
        
        if (roles.length > 0)
        {
            
            for (let i in roles)
            {
                let role = data.guild.roles.resolve(roles[i]);
                
                if (!role) continue;
                
                out += role.name;
                if (i < roles.length-1) out += ', ';
            }
            data.reply(`Admin roles: **${out}**`);
        }
        else
        {
            data.reply('There are no admin roles specified');
        }
    }
    else if (opts.args[0] == 'setkeyword') // Changes keyword
    {
        config.set('verifyKeyword', opts.args[1], opts.guild);
        data.react('👌');
        data.reply(':white_check_mark: New verification keyword "' + opts.args[1] + '" accepted.');
    }
	
    else if (opts.args[0] == 'setcommand') // Changes keyword
    {
        if (opts.args[1].match(/^\W$/))
        {
            config.set('commandCharacter', opts.args[1], opts.guild);
            
            data.react('👌');
            data.reply(':white_check_mark: New command symbol accepted.');
        }
        else
        {
            data.react('❌');
            data.reply(':negative_squared_cross_mark:  Unable to find new command character.  Make sure it\'s a symbol like !@#$%.');
        }
    }
    else if (opts.args[0] == 'setimagetimer') // Sets time between images being posted
    {
        let num = parseInt(opts.args[1]);
        
        if (!isNaN(num))
        {
            config.set('imageTimer', num, opts.guild);
            data.react('👌');
        }
        else
        {
            data.react('❌');
        }
    }
    else if (opts.args[0] == 'setvkthreshold') // Sets time between images being posted
    {
        let num = parseInt(opts.args[1]);
        
        if (!isNaN(num))
        {
            config.set('votekickThreshold', num, opts.guild);
            data.react('👌');
        }
        else
        {
            data.react('❌');
        }
    }
    else if (opts.args[0] == 'setmodrole') // Sets time between images being posted
    {
        if (data.mentions.roles.size == 0)
        {
            data.reply('I don\'t see any role mentions.');
            return;
        }
        
        config.set('modRole', data.mentions.roles.first().id, opts.guild);
        data.react('👌');
    }
    else if (opts.args[0] == 'showchannel') // Unhides channel to unverified uers
    {
        let everyone = data.guild.roles.cache.find((role) => role.name == '@everyone');
        data.channel.overwritePermissions( everyone.id, {
            VIEW_CHANNEL: true
        }
        );
        
        data.react('👌');
        data.reply(':white_check_mark: Channel unhidden to unverified users');
    }
    
    else if (opts.args[0] == 'hidechannel') // Hides channel to unverified users
    {
        let everyone = data.guild.roles.cache.find((role) => role.name == '@everyone');
        data.channel.overwritePermissions( everyone.id, {
            VIEW_CHANNEL: null
        }
        );
        
        data.react('👌');
        data.reply(':white_check_mark: Channel hidden to unverified users');
    }
    
    
    // *******************************
    // CATEGORY COMMANDS
    // *******************************
    
    else if (opts.args[0] == 'addrole') // Adds custom role
    {
        let cats = config.get('questCategories', opts.guild);
        if (typeof opts.args[1] !== 'string')
        {
            data.reply('Can\'t find the role in your message.');
            return;
        }
        
        let cat = opts.args[1].replace(/[^a-zA-Z0-9/]/gi, '').toLowerCase();
        
        if (cat == '')
        {
            data.reply('Invalid role name');
            return;
        }
        
        if (cats.indexOf(cat) > -1)
        {
            data.reply('role already exists.');
            return;
        }
        
        cats.push(cat);
        
        config.set('questCategories', cats, opts.guild);
        data.react('👌');
    }
    else if (opts.args[0] == 'rmrole') // Removes custom role
    {
        let cats = config.get('questCategories', opts.guild);
        if (typeof opts.args[1] !== 'string')
        {
            data.reply('Can\'t find the role in your message');
            return;
        }
        
        let cat = opts.args[1].replace(/[^\w]/gi, '').toLowerCase();
        
        if (cat == '')
        {
            data.reply('Invalid role name');
            return;
        }
        
        if (cats.indexOf(cat) == -1 )
        {
            data.reply('role doesn\'t exist.');
            return;
        }
        
        removeRoleIE(data, cat);
        
        cats.splice(cats.indexOf(cat), 1);
        
        config.set('questCategories', cats, opts.guild);
        data.react('👌');
    }
    else if (opts.args[0] == 'rnrole') // Renames custom role
    {
        let cats = config.get('questCategories', opts.guild);
        if (typeof opts.args[1] !== 'string')
        {
            data.reply('Can\'t find the role or new role in your message');
            return;
        }
        
        let cat = opts.args[1].replace(/[^\w]/gi, '');
        let cat2 = opts.args[2].replace(/[^\w]/gi, '');
        
        if (cat == '' || cat2 == '')
        {
            data.reply('Invalid role name');
            return;
        }
        
        if (cats.indexOf(cat) == -1)
        {
            data.reply('role doesn\'t exist.');
            return;
        }
        
        if (cats.indexOf(cat2) > -1)
        {
            data.reply('New role name already exists.');
            return;
        }
        
        cats.splice(cats.indexOf(cat), 1);
        cats.push(cat2);
        
        let role = data.guild.roles.cache.find((role) => role.name == cat);
        
        if (role)
        {
            // Role exists, rename
            role.setName(cat2);
        }
        
        config.set('questCategories', cats, opts.guild);
        data.react('👌');
    }
    else if (opts.args[0] == 'cleanroles') // Cleans out empty roles
    {
        let cats = config.get('questCategories', opts.guild);
        
        for (let i in cats)
        {
            let role = data.guild.roles.cache.find((role) => role.name == cats[i]);
            
            if (role && role.members.size == 0)
            {
                role.delete();
            }
        }
        
        data.react('👌');
    }
    /*
    else if (opts.args[0] == 'cleanpokemonroles' ||
             opts.args[0] == 'cleanproles') // Cleans out empty roles
    {
        // data.react('\uD83E\uDD14');
        
        let numIn = parseInt(opts.args[1]);
        let num = 0;
        let count = 0;
        
        if (!isNaN(numIn) && numIn >= 0)
        {
            num = numIn
        }
        
        fs.readFile('./pkmn.json', (err, pkmn) =>
        {
            let poke = null;
            if (err)
            {
                console.log('Unable to open pkmn JSON file');
                return;
            }
            
            try 
            {
                poke = JSON.parse(pkmn);
            }
            catch (e)
            {
                console.log('Unable to parse JSON');
                return;
            }
            
            let roles = data.guild.roles.array();
            // roles.sort((i1, i2) => 
            // {
                // return i1.members.size - i2.members.size;
            // });
            
            console.log('Checking for roles with <= ' + num + ' members');
            for (let i in roles)
            {
                // console.log(`${roles[i].name}: ${roles[i].members.size}`);
                if (poke.pokemon_list.indexOf(roles[i].name) == -1 || roles[i].members.size > num)
                    continue;
                
                console.log(`${++count}) Removing role ${roles[i].name}: ${roles[i].members.size}`); 
                roles[i].delete();
            }
            data.reply(`${count} role(s) removed`);
            // data.react('\uD83D\uDC4C');
            
        });
    }
    */
    else if (opts.args[0] == 'getpokemonroles' ||
             opts.args[0] == 'getproles') // Gets roles with <= num people in it
    {
        let numIn = parseInt(opts.args[1]);
        let num = 0;
        let count = 0;
        let out = '';
        
        if (!isNaN(numIn) && numIn >= 0)
        {
            num = numIn;
        }
        
        fs.readFile('./pkmn.json', (err, pkmn) =>
        {
            let poke = null;
            if (err)
            {
                console.log('Unable to open pkmn JSON file');
                return;
            }
            
            try 
            {
                poke = JSON.parse(pkmn);
            }
            catch (e)
            {
                console.log('Unable to parse JSON');
                return;
            }
            
            let roles = data.guild.roles.cache.array();
            roles.sort((i1, i2) => 
            {
                return i1.members.size - i2.members.size;
            });
            
            console.log('Checking for roles with <= ' + num + ' members');
            for (let i in roles)
            {
                // console.log(`${roles[i].name}: ${roles[i].members.size}`);
                if (poke.pokemon_list.indexOf(roles[i].name) == -1) continue;
                
                if (roles[i].members.size > num) break;
                
                count++;
                out += `${roles[i].members.size}: ${roles[i].name}\n`;
            }
            data.reply(`${count} roles have <= ${num} members\n${out}`);
        });
    }
    else if (opts.args[0] == 'rmpokemonroles' ||
             opts.args[0] == 'rmproles') // Gets roles with <= num people in it
    {
        let count = 0;
        
        if (typeof opts.args[1] === undefined || typeof opts.args[1] !== 'string')
        {
            data.reply('Couldn\'t find the list of pokemon.  Expecting comma delimited list of pokemon');
            return;
        }
        
        let pokeToRemove = opts.args.slice(1).join('').split(',');
        
        fs.readFile('./pkmn.json', (err, pkmn) =>
        {
            let poke = null;
            if (err)
            {
                console.log('Unable to open pkmn JSON file');
                return;
            }
            
            try 
            {
                poke = JSON.parse(pkmn);
            }
            catch (e)
            {
                console.log('Unable to parse JSON');
                return;
            }

            
            console.log('Removing roles specified: ' + pokeToRemove.join(', '));
            for (let i in pokeToRemove)
            {
                let pok = pokeToRemove[i].trim();
                // console.log(`${roles[i].name}: ${roles[i].members.size}`);
                if (poke.pokemon_list.indexOf(pok) == -1){
                    console.log('Couldn\'t find pokemon: ' + pok);
                    continue;
                } 
                
                count++;
                let role = data.guild.roles.cache.find((role) => role.name == pok);
                
                if (role)
                {
                    role.delete();
                    console.log(`'${pok}' role removed`);
                }
                else
                    console.log('Couldn\'t find role: ' + pok);
            }
            data.reply(`${count}/${pokeToRemove.length} roles have been removed`);
        });
    }
    
    // *******************************
    // CUSTOM COMMANDS
    // *******************************
	
    else if (opts.args[0] == 'addcommand') // Adds custom command
    {
        let comms = config.get('customCommands', opts.guild);
        if (typeof opts.args[1] !== 'string' || typeof opts.args[2] !== 'string' || opts.args[2] == '')
        {
            data.reply('Can\'t find the command or value in your message');
            return;
        }
        
        let com = opts.args[1].replace(/[^\w]/gi, '');
        
        if (com == '')
        {
            data.reply('Invalid command name');
            return;
        }
        
        if (typeof comms[com] === 'string')
        {
            data.reply('Command already exists.');
            return;
        }
        
        comms[com] = opts.origArgs.slice(2).join(' ');
        
        config.set('customCommands', comms, opts.guild);
        data.react('👌');
    }
    else if (opts.args[0] == 'rmcommand') // Removes custom command
    {
        let comms = config.get('customCommands', opts.guild);
        if (typeof opts.args[1] !== 'string')
        {
            data.reply('Can\'t find the command in your message');
            return;
        }
        
        let com = opts.args[1].replace(/[^\w]/gi, '');
        
        if (com == '')
        {
            data.reply('Invalid command name');
            return;
        }
        
        if (typeof comms[com] !== 'string')
        {
            data.reply('Command doesn\'t exist.');
            return;
        }
        
        delete comms[com];
        
        config.set('customCommands', comms, opts.guild);
        data.react('👌');
    }
    else if (opts.args[0] == 'rncommand') // Renames custom command
    {
        let comms = config.get('customCommands', opts.guild);
        if (typeof opts.args[1] !== 'string' || typeof opts.args[2] !== 'string')
        {
            data.reply('Can\'t find the command or new command in your message');
            return;
        }
        
        let com = opts.args[1].replace(/[^\w]/gi, '');
        let com2 = opts.args[2].replace(/[^\w]/gi, '');
        
        if (com == '' || com2 == '')
        {
            data.reply('Invalid command name');
            return;
        }
        
        if (typeof comms[com] !== 'string')
        {
            data.reply('Command doesn\'t exist.');
            return;
        }
        
        if (typeof comms[com2] === 'string')
        {
            data.reply('New command name already exists.');
            return;
        }
        
        comms[com2] = comms[com];
        delete comms[com];
        
        config.set('customCommands', comms, opts.guild);
        data.react('👌');
    }
    else if (opts.args[0] == 'editcommand') // Edits existing command
    {
        let comms = config.get('customCommands', opts.guild);
        if (typeof opts.args[1] !== 'string' || typeof opts.args[2] !== 'string' || opts.args[2] == '')
        {
            data.reply('Can\'t find the command or value in your message');
            return;
        }
        
        let com = opts.args[1].replace(/[^\w]/gi, '');
        
        if (com == '')
        {
            data.reply('Invalid command name');
            return;
        }
        
        if (typeof comms[com] !== 'string')
        {
            data.reply('Command doesn\'t exist.');
            return;
        }
        
        comms[com] = opts.origArgs.slice(2).join(' ');
        
        config.set('customCommands', comms, opts.guild);
        data.react('👌');
    }
	
    
    // *******************************
    // GYM ADMIN
    // *******************************
    else if (opts.args[0] == 'getgymadmins' ||
             opts.args[0] == 'getgymadmin')
    {
        let admins = config.get('gymAdmins', opts.guild);
        let out = '';
        
        data.guild.members.fetch()
            .then(mems =>
            {
                
                for (let i in admins)
                {
                    if (out != '') out += '\n';
                    out += mems.get(admins[i]).displayName;
                
                }
                data.reply('**Gym admins**:\n' + out);
            });
    }
    
    else if (opts.args[0] == 'addgymadmin')
    {
        let admins = config.get('gymAdmins', opts.guild);
        
        if (data.mentions.members.first())
        {
            let id = data.mentions.members.first().id;
            
            if (admins.indexOf(id) == -1)
            {
                admins.push(id);
                config.set('gymAdmins', admins, opts.guild);
            }
            
            data.react('👌');
        }
        else
        {
            data.reply('Can\'t find a user mention in your message');
        }
        
    }
    else if (opts.args[0] == 'rmgymadmin')
    {
        let admins = config.get('gymAdmins', opts.guild);
        
        if (data.mentions.members.first())
        {
            let id = data.mentions.members.first().id;
            let ind = admins.indexOf(id);
            
            if (ind > -1)
            {
                admins.splice(ind, 1);
                config.set('gymAdmins', admins, opts.guild);
            }
            
            data.react('👌');
        }
        else
        {
            data.reply('Can\'t find a user mention in your message');
        }
    }
    
    else if (opts.args[0] == 'setgymchannel') // Sets channel that accepts gym commands
    {
        config.set('gymChannelID', data.channel.id, opts.guild);
        config.set('isGymLeaderChannelSetup', true, opts.guild);
        
        data.react('👌');
        data.reply('Gym channel set.  Gym commands can now only be used in this channel.');
    }
    
    else if (opts.args[0] == 'unsetgymchannel') // Unsets channel that accepts gym commands
    {
        config.set('gymChannelID', '0', opts.guild);
        config.set('isGymLeaderChannelSetup', false, opts.guild);
        
        data.react('👌');
        data.reply('Gym channel unset.  This will allow people to use gym commands in any channel until another channel is specified.');
    }
	
    // *******************************
    // EMOJIS
    // *******************************
    
    else if (opts.args[0] == 'addemoji') // Adds emoji to server
    {
        // let reg = /https?:\/\/(www\.)?[-a-zA-Z0-9@:%._\+~#=]{2,256}\.[a-z]{2,6}\b([-a-zA-Z0-9@:%_\+.~#?&//=]*)/gi;
        // let match = opts.origArgs[2].match(reg);
        
        if (opts.origArgs[1].replace(/[^\w]/gi, '') != opts.origArgs[1])
        {
            data.reply('Invalid emoji name.  Letters and numbers only.');
            return;
        }
        
        // if (!match || match[0] != opts.origArgs[2])
        // {
        // data.reply('Invalid URL.');
        // return;
        // }
        
        
        let currentEmo = data.guild.emojis.cache.find((emo) => emo.name.toLowerCase() == opts.origArgs[1].toLowerCase());
        
        
        
        if (!currentEmo)
        {
            console.log('Adding emoji "' + opts.origArgs[1] + '"');
            
            data.guild.emojis.create(opts.origArgs[2], opts.origArgs[1])
                .then((emo) =>
                {
                    data.react('👌');
                })
                .catch((e) =>
                {
                    data.reply('There was a problem adding the emoji.  Ask Foodbandlt to look into it.');
                    console.log(e);
                });
        }
        else
        {
            data.reply('An emoji already exists with that name: ' + currentEmo.name);
        }
    }
    
    else if (opts.args[0] == 'rmemoji') // Removes emoji from server
    {
        if (typeof opts.origArgs[1] !== 'string' || opts.origArgs[1] == '' || opts.origArgs[1].replace(/[^\w]/gi, '') != opts.origArgs[1])
        {
            data.reply('Invalid emoji name.  Letters and numbers only.');
            return;
        }
        
        let currentEmo = data.guild.emojis.cache.find((emo) => emo.name.toLowerCase() == opts.origArgs[1].toLowerCase());
        
        if (currentEmo)
        {
            console.log('Removing emoji "' + opts.origArgs[1] + '"');
            
            currentEmo.delete()
                .then((emo) =>
                {
                    data.react('👌');
                })
                .catch((e) =>
                {
                    data.reply('There was a problem removing the emoji.  Ask Foodbandlt to look into it.');
                    console.log(e);
                });
        }
        else
        {
            data.reply('No such emoji exists');
        }
    }
	
    else if (opts.args[0] == 'editemoji') // Edits emoji from server
    {
        
        if (typeof opts.origArgs[1] !== 'string' || opts.origArgs[1] == '' || opts.origArgs[1].replace(/[^\w]/gi, '') != opts.origArgs[1])
        {
            data.reply('Invalid emoji name.  Letters and numbers only.');
            return;
        }

        let currentEmo = data.guild.emojis.cache.find((emo) => emo.name.toLowerCase() == opts.origArgs[1].toLowerCase());
        
        if (currentEmo)
        {
            console.log('Editing emoji "' + opts.origArgs[1] + '", renaming to "' + opts.origArgs[2] + '"');
            
            currentEmo.edit({name: opts.origArgs[2]})
                .then((emo) =>
                {
                    data.react('👌');
                })
                .catch((e) =>
                {
                    data.reply('There was a problem editing the emoji.  Ask Foodbandlt to look into it.');
                    console.log(e);
                });
        }
        else
        {
            data.reply('No such emoji exists');
        }
    }

    
    // *******************************
    // RAID ADMIN COMMANDS
    // *******************************
    /*
    else if (opts.args[0] == 'addboss') // Adds raid boss to specified tier
    {
        let bosses = config.get('raidBosses', opts.guild);
        let tier = parseInt(opts.args[1]);
        let boss = opts.args[2];
        
        // Check if Tier input is valid 
        if (isNaN(tier) || tier < 0 || tier > 5)
        {
            data.reply(':negative_squared_cross_mark: Invalid raid tier');
            return;
        }
        
        // Check if boss input is valid and not too short
        if (typeof boss !== 'string' || boss.length < 3)
        {
            data.reply(':negative_squared_cross_mark: Invalid boss');
            return;
        }
        
        let bossNorm = normalizeBoss(boss);
        
        // Check if boss is already added
        if (isRaidBoss(bossNorm, bosses) == -1)
        {
            bosses[tier].push(bossNorm);
            bosses[tier].sort();
            
            config.set('raidBosses', bosses, opts.guild);
            data.react('👌');
        }
        else
        {
            // Raid boss already added
            data.reply(':negative_squared_cross_mark: Raid boss already added');
            return;
        }
    }
    else if (opts.args[0] == 'rmboss') // Hides channel to unverified users
    {
        let bosses = config.get('raidBosses', opts.guild);
        let boss = opts.args[1];
        let ind = -1;
        let tier = 0;
        
        // Check is boss input is valid and not too short
        if (typeof boss !== 'string' || boss.length < 3)
        {
            data.reply(':negative_squared_cross_mark: Invalid boss');
            return;
        }
        
        let bossNorm = normalizeBoss(boss);
        
        // Find tier boss is in
        tier = isRaidBoss(boss, bosses);
        
        // Fail if can't find boss in tier
        if (tier == -1)
        {
            data.reply(':negative_squared_cross_mark: Is not a current boss');
            return;
        }
        
        let ind = bosses[tier].indexOf(bossNorm);
        
        bosses[tier].splice(ind, 1);
        config.set('raidBosses', bosses, opts.guild);
        data.react('👌');
    }
    
    else if (opts.args[0] == 'rmallbosses') // Hides channel to unverified users
    {
        config.reset('raidBosses', opts.guild);
        data.react('👌');
    }
    */

    // *******************************
    // DM COMMANDS
    // *******************************
    
    else if (opts.args[0] == 'setdm') // Sets DM message
    {
        let ind = data.content.indexOf(' ');
        // Removing command from message
        let newMess = ( ind > -1 ? data.content.substring( data.content.indexOf(' ') + 1 ) : '');
        config.set('newJoinDMMessage', newMess, opts.guild);
            
        data.react('👌');
        data.reply(':white_check_mark: New DM message set.  Sample:');
        data.channel.send(newMess);
    }
	
    else if (opts.args[0] == 'getdm') // Gets DM message
    {

        data.reply('New user DMs are currently `' + (config.get('isDMEnabled', opts.guild) ? 'enabled' : 'disabled') + '`.  Currently set DM:');
        data.channel.send(config.get('newJoinDMMessage', opts.guild));
    }
	
    else if (opts.args[0] == 'testdm') // Tests DM message
    {
        data.author.createDM()
            .then( (DM) =>
            {
                DM.send(config.get('newJoinDMMessage', opts.guild));
                data.react('👌');
            })
            .catch( (e) =>
            {
                data.react('❌');
            });
    }
	
    else if (opts.args[0] == 'senddmtounverified') // Sends DM to currently unverified peeps
    {
        console.log('SendDmToUnverified called');
        let num = dmAllUnverified(data);
        data.react('👌');
        data.reply('DMing all unverified users.');
    }
	
    else if (opts.args[0] == 'enabledm') // Enables DMing of new members
    {
        config.set('isDMEnabled', true, opts.guild);
            
        data.react('👌');
    }
	
    else if (opts.args[0] == 'disabledm') // Disables DMing of new members
    {
        config.set('isDMEnabled', false, opts.guild);
            
        data.react('👌');
    }
    
    
    // *******************************
    // SETUP COMMANDS
    // *******************************
    
    else if (opts.args[0] == 'enable') // Perform setup of role and channel
    {
        let everyone = data.guild.roles.cache.find((role) => role.name == '@everyone');
        
        if (typeof opts.args[1] !== 'string')
        {
            data.reply('Invalid feature');
            return;
        }
        
        
        if (opts.args[1] == 'verify')
        {
            // Role setup
            if (!config.get('isRoleSetup', opts.guild) && (!opts.args[2] || 
                    (typeof opts.args[2] === 'string' && 
                    ['role', 'verifyall', 'verifynone'].indexOf(opts.args[2]) > -1)
            )
            )
            {
                
                
                
                data.guild.role.create(
                    {
                        data:{
                            name: config.get('verifyRoleName', opts.guild),
                            mentionable: false,
                            permissions: everyone.permissions
                        }
                    }
                )
                // Verify all people currently in server if "verifynone" is not specified
                    .then(role => 
                    {
                        config.set('verifyRoleID', role.id, opts.guild);
                        config.set('isRoleSetup', true, opts.guild);
                        if (opts.args.indexOf('verifynone') == -1)
                            verifyAll(data); 
                    });
            }
            
            // Everyone permissions setup
            if (!config.get('isEveryoneSetup', opts.guild) && (!opts.args[2] || 
                    (typeof opts.args[2] === 'string' && 
                    ['everyone', 'verifyall', 'verifynone'].indexOf(opts.args[2]) > -1)
            )
            )
            {
                config.set('everyonePerms', everyone.permissions, opts.guild);
                let perms = new Discord.Permissions(everyone.permissions);
                perms = perms.remove(['MENTION_EVERYONE', 'VIEW_CHANNEL', 'SEND_MESSAGES']);
                
                
                everyone.setPermissions(perms.bitfield)
                    .catch(err => { console.log(err); });
                
                config.set('isEveryoneSetup', true, opts.guild);
            }
            
            // Channel setup
            if (!config.get('isChannelSetup', opts.guild) && (!opts.args[2] || 
                    (typeof opts.args[2] === 'string' && 
                    ['channel', 'verifyall', 'verifynone'].indexOf(opts.args[2]) > -1)
            )
            )
            {
                data.guild.channels.create( config.get('verifyChannelName', opts.guild), 
                    {
                        type: 'text',
                        permissionOverwrites: 
                        [{
                            id: everyone.id,
                            allow:  ['VIEW_CHANNEL', 'SEND_MESSAGES'],
                            deny:   ['READ_MESSAGE_HISTORY']
                        }]
                    }
                )
                    .then(channel => {config.set('verifyChannelID', channel.id, opts.guild);});
                
                setTimeout(function()
                {
                    client.guilds.resolve( opts.guild ).channels.resolve( config.get('verifyChannelID', opts.guild) ).overwritePermissions( config.get('verifyRoleID', opts.guild), 
                        {
                            VIEW_CHANNEL: false
                        }
                    ).catch(e => {console.log('Failed to remove VIEW_CHANNEL from Verify channel for Verified people');});
                }, 3000);
                
                
                console.log('finished setting up channel');
                config.set('isChannelSetup', true, opts.guild);
            }
            
        }
        
        
        else if (opts.args[1] == 'gym' ||
                 opts.args[1] == 'gyms' ||
                 opts.args[1] == 'gymleader' ||
                 opts.args[1] == 'gymleague')
        {
            // Role setup
            if (!config.get('isGymLeaderRoleSetup', opts.guild) && (!opts.args[2] || 
                    (typeof opts.args[2] === 'string' && 
                    ['leaderrole'].indexOf(opts.args[2]) > -1)
            )
            )
            {
                
                let perms = new Discord.Permissions(everyone.permissions);
                perms = perms.remove(['MENTION_EVERYONE', 'VIEW_CHANNEL', 'SEND_MESSAGES']);
                
                data.guild.roles.create(
                    {
                        data: {
                            name: config.get('gymRoleName', opts.guild),
                            mentionable: true,
                            permissions: perms.bitfield
                        }
                    }
                )
                    .then(role => 
                    {
                        config.set('gymRoleID', role.id, opts.guild);
                        config.set('isGymLeaderRoleSetup', true, opts.guild);
                    })
                    .catch(e =>
                    {
                        data.reply('There was an error creating the role (probably too many roles)');
                    });
            }
            
            if (!config.get('isGymChallengerRoleSetup', opts.guild) && (!opts.args[2] || 
                    (typeof opts.args[2] === 'string' && 
                    ['challengerrole'].indexOf(opts.args[2]) > -1)
            )
            )
            {
                
                let perms = new Discord.Permissions(everyone.permissions);
                perms = perms.remove(['MENTION_EVERYONE', 'VIEW_CHANNEL', 'SEND_MESSAGES']);
                
                data.guild.roles.create(
                    {
                        data:{
                            name: config.get('gymChallengerRoleName', opts.guild),
                            mentionable: true,
                            permissions: perms.bitfield
                        }
                    }
                )
                    .then(role => 
                    {
                        config.set('gymChallengerRoleID', role.id, opts.guild);
                        config.set('isGymChallengerRoleSetup', true, opts.guild);
                        
                        // Add all current users with badges to role
                        console.log('Adding current gym badge holders to challenger group');
                        
                        data.guild.members.fetch()
                            .then(function (mems)
                            {
                                let badges = config.get('gymBadges', opts.guild);
                                let arrToAdd = [];
                                let memArr = [];
                                
                                for (let i in badges)
                                {
                                    if (badges[i].length == 0) continue;
                                    
                                    for (let j in badges[i])
                                    {
                                        if (j == 'length') continue;
                                        
                                        let mem = mems.get(j);
                                        
                                        if (arrToAdd.indexOf(j) == -1 && mem)
                                        {
                                            arrToAdd.push(j);
                                            memArr.push(mem);
                                        }
                                    }
                                }
                                
                                if (arrToAdd.length > 0)
                                {
                                    console.log('Adding ' + arrToAdd.length + ' users to Challenger role.  This may take a while');
                                
                                    addRoleRecursive(memArr, role.id);
                                }
                                else
                                    console.log('No users have gym badges, nobody to add to challenger group');
                            });
                    })
                    .catch(e =>
                    {
                        data.reply('There was an error creating the role (probably too many roles)');
                    });
            }
            
            // Channel setup
            if (!config.get('isGymLeaderChannelSetup', opts.guild) && (!opts.args[2] || 
                    (typeof opts.args[2] === 'string' && 
                    ['channel'].indexOf(opts.args[2]) > -1)
            )
            )
            {
                data.guild.channels.create( config.get('gymChannelName', opts.guild), {type: 'text'})
                    .then(channel => {config.set('gymChannelID', channel.id, opts.guild);});
                
                
                console.log('finished setting up channel');
                config.set('isGymLeaderChannelSetup', true, opts.guild);
            }
        }
        data.react('👌');
    }

    else if (opts.args[0] == 'disable') // Perform reverse setup of role and channel
    {
        let everyone = data.guild.roles.cache.find((role) => role.name == '@everyone');
        
        if (typeof opts.args[1] !== 'string')
        {
            data.reply('Invalid feature');
            return;
        }
        
        if (opts.args[1] == 'verify')
        {
            
            // Everyone permissions setup
            if ((!opts.args[2] || 
                    (typeof opts.args[2] === 'string' && 
                    ['everyone'].indexOf(opts.args[2]) > -1)
            )
            )
            {
                everyone.setPermissions( config.get('everyonePerms', opts.guild) )
                    .catch(err => { console.log(err); });
                
                config.reset('everyonePerms', opts.guild);
                config.reset('isEveryoneSetup', opts.guild);
            }
            
            // Role setup
            if ((!opts.args[2] || 
                    (typeof opts.args[2] === 'string' && 
                    ['role'].indexOf(opts.args[2]) > -1)
            )
            )
            {
                let role = data.guild.roles.resolve(config.get('verifyRoleID', opts.guild));
                if (role) role.delete();
                
                config.reset('verifyRoleID', opts.guild);
                config.reset('isRoleSetup', opts.guild);
            }
            
            
            
            // Channel setup
            if ((!opts.args[2] || 
                    (typeof opts.args[2] === 'string' && 
                    ['channel'].indexOf(opts.args[2]) > -1)
            )
            )
            {
                let channel = data.guild.channels.resolve(config.get('verifyChannelID', opts.guild));
                if (channel) channel.delete();
                
                config.reset('verifyChannelID', opts.guild);
                
                console.log('finished unsetting up channel');
                config.reset('isChannelSetup', opts.guild);
            }
        }
        
        else if (opts.args[1] == 'gym' ||
                 opts.args[1] == 'gyms' ||
                 opts.args[1] == 'gymleader' ||
                 opts.args[1] == 'gymleague')
        {
            // Role setup
            if (config.get('isGymLeaderRoleSetup', opts.guild) && (!opts.args[2] || 
                    (typeof opts.args[2] === 'string' && 
                    ['role'].indexOf(opts.args[2]) > -1)
            )
            )
            {
                let role = data.guild.roles.resolve(config.get('gymRoleID', opts.guild));
                if (role) role.delete();
                
                config.reset('gymRoleID', opts.guild);
                config.reset('gymLeaders', opts.guild);
                config.reset('gymAdmins', opts.guild);
                config.reset('isGymLeaderRoleSetup', opts.guild);
            }
            
            if (config.get('isGymChallengerRoleSetup', opts.guild) && (!opts.args[2] || 
                    (typeof opts.args[2] === 'string' && 
                    ['challengerrole'].indexOf(opts.args[2]) > -1)
            )
            )
            {
                let role = data.guild.roles.resolve(config.get('gymChallengerRoleID', opts.guild));
                if (role) role.delete();
                
                config.reset('gymChallengerRoleID', opts.guild);
                config.reset('isGymChallengerRoleSetup', opts.guild);
            }
            
            // Channel setup
            if (config.get('isGymLeaderChannelSetup', opts.guild) && (!opts.args[2] || 
                    (typeof opts.args[2] === 'string' && 
                    ['channel'].indexOf(opts.args[2]) > -1)
            )
            )
            {
                let channel = data.guild.channels.resolve(config.get('gymChannelID', opts.guild));
                if (channel) channel.delete();
                
                config.reset('gymChannelID', opts.guild);
                
                console.log('finished unsetting up channel');
                config.reset('isGymLeaderChannelSetup', opts.guild);
            }
        }
        
        data.react('👌');
        data.reply('Unsetup complete');
    }
}


/*
function dmAllRaidSubs(data, arr, boss, tier, loc)
{
    let guild = data.guild.id;
	
    console.log('DMing all users subbed to raid boss ' + boss + ' (' + arr.length + ')');

    dmAllRaidSubsRecursive(guild, arr, boss, tier, loc);

    return arr.length;
}

function dmAllRaidSubsRecursive(guild, memArr, boss, tier, loc)
{
    if (typeof memArr !== 'object' || memArr.length == 0)
    {
        console.log('DM All Raid Subs complete for boss ' + boss);
        return;
    }
	
    let mem = memArr.shift();
    
    client.guilds.get(guild).fetchMember(mem)
        .then(function (gmem)
        {
            gmem.createDM()
                .then( (DM) =>
                {
                    console.log('DMed ' + DM.recipient.username + '#' + DM.recipient.discriminator);
                    DM.send('A ' + boss + ' (tier ' + tier + ') raid has been reported at "' + loc + '" on ' + gmem.guild.name + '!  Check the raid channel for more details!');
                    setTimeout(function()
                    {
                        dmAllRaidSubsRecursive(guild, memArr, boss, tier, loc);
                    }, 300);
                })
                .catch( function (e)
                {
                    console.log('Unable to DM member: ' );
                    console.log(e);
                });
        });
	
	
}
*/

function testF(data)
{

}

function doMute(guild)
{
    console.log(`Starting doMute for guild ${guild.id}`);
    cancelMuteTimer(guild);
    
    let gid = guild.id;
    let muted = config.get('mutedObj', gid);
    let mutedRole = config.get('mutedRole', gid);
    
    if (mutedRole == '')
    {
        console.log('Muted role not setup, not scheduling timer');
        return;
    }
    
    if (muted.objs.length == 0)
    {
        console.log('Nobody in muted obj, not scheduling timer');
        return;
    }

    let user = muted.objs[0];
    let time = (user.until - Date.now());
    time = time > 0 ? time : 0;
    
    if (time > 2147483647)  // Max setTimeout time
    {
        console.log(`doMute timeout interval too large: ${time}; Setting max timeout`);
        mutedIDs[gid] = setTimeout( () =>
        {
            mutedIDs[gid] = 0;
            
            doMute(guild);
        }, 2147483646);
    }
    else
    {
        console.log(`doMute timeout set for ${time}`);
        mutedIDs[gid] = setTimeout( () =>
        {
            mutedIDs[gid] = 0;
            
            unmute(user.user, guild, (error, mem) =>
            {
                if (error)
                {
                    return;
                }
                
                console.log(`Unmuted ${mem.user.username}#${mem.user.discriminator} based on timer`);
            });
        }, time);
    }
        
}

function cancelMuteTimer(guild)
{
    if (mutedIDs[guild.id] != 0)
        clearTimeout(mutedIDs[guild.id]);
    mutedIDs[guild.id] = 0;
}

function mute(opts, guild, cb)
{
    console.log(`Starting to mute ${opts.user}`);
    console.log(opts);
    let muted = config.get('mutedObj', guild.id);
    let mutedRole = config.get('mutedRole', guild.id);
    
    if (mutedRole == '')
    {  
        console.log('Role not setup, mute canceled');
        return;
    }
    
    if (opts.until - Date.now() < 3000)
    {
        console.log('Can\'t mute for under 3 seconds');
        if (typeof cb == 'function')
            cb('time', null);
        return;
    }
    
    guild.members.fetch(opts.user)
        .then((mem) =>
        {
            mem.roles.add(mutedRole);
        
        
            if (muted.objs.length == 0)
                muted.objs.push(opts);
            else
            {
                for (let i in muted.objs)
                {
                    if (muted.objs[i].until > opts.until)
                    {
                        muted.objs.splice(i, 0, opts);
                        break;
                    }
                
                    if (i == muted.objs.length - 1)
                        muted.objs.push(opts);
                }
            }
            muted.ids.push(mem.id);
            config.set('mutedObj', muted, guild.id);
        
            doMute(guild);
            if (typeof cb == 'function')
                cb(null, mem);
        })
        .catch( (err) =>
        {
            console.log(`Could not mute user ${err}`);
        });
}

function makeMuteEmbed(opts, banner, user)
{
    let muteTime = (opts.until - opts.time);
    let muteUntil = new Date(opts.until);
    
    if (!muteUntil.isDstObserved())
    {
        muteUntil.setUTCHours( muteUntil.getUTCHours() - 1 );
    }
                
    let mess = new Discord.MessageEmbed()
        .setTitle('Mute Details')
        .setColor(0x000000)
        //.setDescription('testing')
        .addField('Muter', `${banner}`, true)
        .addField('User', `${user}`, true)
        .addField('Length', `${milliToString(muteTime)}`, true)
        .addField('Reason', `${opts.reason || 'None'}`)
        .addField('Unmute Date', `${muteUntil.toLocaleString('en-US', {timeZone: 'America/New_York'})}`)
        .setTimestamp(opts.time);
        
    return mess;
}

function unmute(userid, guild, cb)
{
    console.log(`Starting to unmute ${userid}`);
    let muted = config.get('mutedObj', guild.id);
    let mutedRole = config.get('mutedRole', guild.id);
    
    if (mutedRole == '')
    {  
        console.log('Role not setup, unmute canceled');
        return;
    }
    
    guild.members.fetch(userid)
        .then((mem) =>
        {
            let ind = muted.ids.indexOf(mem.id);
        
            mem.roles.remove(mutedRole);
        
            muted = removeUserFromMuteObj(muted, userid);
        
            config.set('mutedObj', muted, guild.id);
        
            doMute(guild);
            if (typeof cb == 'function')
                cb(null, mem);
        })
        .catch( (err) =>
        {
            console.log(`Could not unmute user ${err}`);
            
            if (err == 'DiscordAPIError: Unknown Member')
            {
                muted = removeUserFromMuteObj(muted, userid);
                
                config.set('mutedObj', muted, guild.id);
                
                console.log('Removed unknown user from mute queue');
                
                doMute(guild);
            }
            
            if (typeof cb == 'function')
                cb(err, null);
        });
}

function removeUserFromMuteObj(muted, userid)
{
    let ind = muted.ids.indexOf(userid);
                
    if (ind > -1)
        muted.ids.splice(ind, 1);

    for (let i in muted.objs)
    {
        if (muted.objs[i].user == userid)
        {
            muted.objs.splice(i, 1);
            break;
        }
    }
    
    return muted;
}

function getMilliFromString(input)
{
    if (typeof input !== 'string')
        return 0;
    
    let output = 0;
    
    let sreg = /(\d+)s(?:\d|$)/i;
    let mreg = /(\d+)m(?:\d|$)/i;
    let hreg = /(\d+)h(?:\d|$)/i;
    let dreg = /(\d+)d(?:\d|$)/i;
    let moreg = /(\d+)mo(?:\d|$)/i;
    
    let sIn = input.match(sreg);
    let mIn = input.match(mreg);
    let hIn = input.match(hreg);
    let dIn = input.match(dreg);
    let moIn = input.match(moreg);
    
    if (sIn)
    {
        let num = parseInt(sIn[1]);
        if (!isNaN(num))
        {
            output += num * 1000;
        }
    }
    
    if (mIn)
    {
        let num = parseInt(mIn[1]);
        if (!isNaN(num))
        {
            output += num * 60 * 1000;
        }
    }
    
    if (hIn)
    {
        let num = parseInt(hIn[1]);
        if (!isNaN(num))
        {
            output += num * 60 * 60 * 1000;
        }
    }
    
    if (dIn)
    {
        let num = parseInt(dIn[1]);
        if (!isNaN(num))
        {
            output += num * 24 * 60 * 60 * 1000;
        }
    }
    
    if (moIn)
    {
        let num = parseInt(moIn[1]);
        if (!isNaN(num))
        {
            output += num * 30 * 24 * 60 * 60 * 1000;
        }
    }
    
    return output;
}

function milliToString(input)
{
    if (typeof input !== 'number')
        return '';
    
    let output = '';
    let year = 365*24*60*60*1000;
    let month = 30*24*60*60*1000;
    let day = 24*60*60*1000;
    let hour = 60*60*1000;
    let minute = 60*1000;
    let second = 1000;
    let temp = 0;
    
    temp = Math.trunc(input/year);
    if (temp > 0)
    {
        input -= temp * year;
        output += `${temp} year${temp > 1 ? 's': ''}, `;
    }
    
    temp = Math.trunc(input/month);
    if (temp > 0)
    {
        input -= temp * month;
        output += `${temp} month${temp > 1 ? 's': ''}, `;
    }
    
    temp = Math.trunc(input/day);
    if (temp > 0)
    {
        input -= temp * day;
        output += `${temp} day${temp > 1 ? 's': ''}, `;
    }
    
    temp = Math.trunc(input/hour);
    if (temp > 0)
    {
        input -= temp * hour;
        output += `${temp} hour${temp > 1 ? 's': ''}, `;
    }
    
    temp = Math.trunc(input/minute);
    if (temp > 0)
    {
        input -= temp * minute;
        output += `${temp} minute${temp > 1 ? 's': ''}, `;
    }
    
    temp = Math.trunc(input/second);
    if (temp > 0)
    {
        input -= temp * second;
        output += `${temp} second${temp > 1 ? 's': ''}, `;
    }
    
    return output.trim().slice(0,-1);
}

function dmAllUnverified(data)
{
    /*
    let guild = data.guild.id;
	
    console.log('DMing all users that aren\'t verified');

    let arrToAdd = [];
    let total = 0;
	
    client.guilds.get(guild).fetchMembers()
        .then(function (guildF)
        {
            let iterator1 = guildF.members[Symbol.iterator]();
            for (let i of iterator1)
            {
                total++;
			
                let id = i[0];
                let mem = i[1];
			
                if (id == client.user.id) continue;
			
                if (!mem.roles.get( config.get('verifyRoleID', guild) ))
                    arrToAdd.push(mem);
            }
		
            console.log('DMing ' + arrToAdd.length + ' of ' + total + ' users.  This may take a while');
		
            dmAllUnverifiedRecursive(arrToAdd);
        });
    
    
	
    return arrToAdd.length;
    */
}

function dmAllUnverifiedRecursive(memArr)
{
    /*
    if (typeof memArr !== 'object' || memArr.length == 0)
    {
        console.log('DM all complete');
        return;
    }
	
    let mem = memArr.shift();
	
    mem.createDM()
        .then( (DM) =>
        {
            console.log('DMed ' + DM.recipient.username + '#' + DM.recipient.discriminator);
            DM.send(config.get('newJoinDMMessage', mem.guild.id));
            setTimeout(function()
            {
                dmAllUnverifiedRecursive(memArr);
            }, 1000);
        })
        .catch( function (e)
        {
            console.log('Unable to DM member: ' );
            console.log(e);
        });
        */
}

function verifyAll(data)
{
    let roleid = config.get('verifyRoleID', data.guild.id);
    
    console.log('Verifying all current users');
	
    data.guild.members.fetch()
        .then(function (mems)
        {
            let filtered = mems.filter(mem => (!mem.roles.cache.get( roleid ) && mem.id != client.user.id) );
            let arrToAdd = Array.from(filtered.values());
		
            console.log('Verifying ' + arrToAdd.length + ' of ' + data.guild.memberCount + ' users.  This may take a while');
		
            addRoleRecursive(arrToAdd, roleid);
        });
}

function addRoleRecursive(memArr, roleid)
{
    if (typeof memArr !== 'object' || memArr.length == 0)
    {
        console.log('roles.add complete');
        return;
    }
	
    memArr.shift().roles.add( roleid )
        .then(function (e) 
        {
            console.log(e.id + ' added to role');
            setTimeout(function()
            {
                addRoleRecursive(memArr, roleid);
            }, 500);
        })
        .catch( function (e)
        {
            console.log('Unable to add member to role: ' );
            console.log(e);
        });
}


function unverifyAll(data)
{
    let roleid = config.get('verifyRoleID', data.guild.id);
	
    console.log('Unverifying all current users');

    let arrToAdd = [];
	
    let verifyRole = data.guild.roles.resolve(roleid);
	
    if (verifyRole)
    {
        arrToAdd = Array.from(verifyRole.members.values());
		
        console.log('Unverifying ' + arrToAdd.length + ' users.  This may take a while');
		
        removeRoleRecursive(arrToAdd, roleid);

    }
    
	
    return arrToAdd.length;
}

function removeRoleRecursive(memArr, roleid)
{
    if (typeof memArr !== 'object' || memArr.length == 0)
    {
        console.log('roles.remove complete');
        return;
    }
	
    memArr.shift().roles.remove( roleid )
        .then(function (e) 
        {
            console.log(e.id + ' removed from role');
            setTimeout(function()
            {
                removeRoleRecursive(memArr, roleid);
            }, 500);
        })
        .catch( function (e)
        {
            console.log('Unable to remove member from role: ' );
            console.log(e);
        });
} 

function makeSafe(message)
{
    return message.replace(/@everyone/gi, '@ everyone').replace(/@here/gi, '@ here');
}
/*
function printBossTier(tier, list)
{
    let out = '';
    for (let i in list[tier])
    {
        if (out.length != 0)
            out += ', ';
        
        out += list[tier][i];
    }
    
    return out;
}

function isRaidBoss(boss, list)
{
    boss = normalizeBoss(boss);
    for (let i in list)
    {
        if (list[i].indexOf(boss) > -1) return i;
    }
    
    return -1;
}
*/

function getFCInfo (mod, guild) {
    let trainers = config.get('friendCodes', guild);
    let trainer = trainers[mod];
	
    return typeof trainer == 'undefined' ? null : trainer;
}

function getFCInfoByIGN (ign, guild) {
    let trainers = config.get('friendCodes', guild);
    let trainer = null;
    ign = ign.toLowerCase();
	
    for (let i in trainers)
    {
        if (trainers[i].name.toLowerCase() == ign)
        {
            trainer = trainers[i];
            trainer.id = i;
            break;
        }
    }
	
    return trainer;
}


function normalizeBoss(boss)
{
    return boss.substr(0, 1).toUpperCase() + boss.substr(1).toLowerCase();
}

function capsFirstLetter(word)
{
    return normalizeBoss(word);
}

function getCustomCommands(guild)
{
    return config.get('customCommands', guild);
}

function countVotekick(obj)
{
    let sum = 0;
    for (let i in obj)
    {
        if (i != 'kicked')
            sum += obj[i];
    }
    
    return sum;
}

// Create role if not exists
function createRoleINE(data, roleName, mentionable)
{
    let role = data.guild.roles.cache.find((role) => role.name == roleName);
    if (!role)
    {
        return data.guild.roles.create({
            data: {
                name: roleName,
                mentionable: (mentionable ? true : false) // to clean up input and allow for optional arg
            }
        });
    }
    
    return new Promise(function(resolve){
        resolve(role);
    });
}

// Remove role if exists
function removeRoleIE(data, roleName)
{
    let role = data.guild.roles.cache.find((role) => role.name == roleName);
    if (role)
    {
        return role.delete();
    }
    
    return false;
}

function findTypeFromID(leaders, id)
{
    for (let i in leaders)
    {
        if (leaders[i] == id)
            return i;
    }
    
    return null;
}

function getBadges(badges, id)
{
    let out = [];
    for (let i in badges)
    {
        if (badges[i][id])
        {
            // Make a copy so we can assign a type
            let temp = Object.assign({}, badges[i][id]);
            temp.type = i;
			
            out.push(temp);
        }
    }
	
    return out;
}

function hasBadge(badges, type, id)
{
    return (typeof badges[type][id] !== 'undefined');
}
// from https://stackoverflow.com/questions/11887934/how-to-check-if-the-dst-daylight-saving-time-is-in-effect-and-if-it-is-whats

Date.prototype.stdTimezoneOffset = function () {
    var jan = new Date(this.getFullYear(), 0, 1);
    var jul = new Date(this.getFullYear(), 6, 1);
    return Math.max(jan.getTimezoneOffset(), jul.getTimezoneOffset());
};

Date.prototype.isDstObserved = function () {
    return this.getTimezoneOffset() < this.stdTimezoneOffset();
};
	
