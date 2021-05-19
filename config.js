var fs = require('fs');
var util = require('util');
var mysql = require('mysql');

var that = null;


var Config = function(defaultConfig){
    that = this;
	
    return new Promise((resolve, reject) => 
    {
        if (typeof defaultConfig !== 'object'){
            console.log('No default config specified');
            return false;
        }
		
        this.loadedConfig = null;
        this.defaultConfig = defaultConfig;
		
        this.mysqlPool  = mysql.createPool({
            connectionLimit : 10,
            host            : 'holly.connectthesongs.com',
            user            : 'EnteiBot',
            password        : 'EntEiPoGoUCF',
            database        : 'EnteiBot',
            charset         : 'utf8mb4_unicode_ci'
        });
		
        this.mysqlPool.getConnection(function(err, connection) {
            if (err)
            {
                console.log(err);
                process.exit(1);
                return;
            }
            console.log('Database connection success');
            that.load()
                .then( () => 
                {
                    resolve(that);
                });
        });
		
		
		
		
		
        /*
		fs.readFile(path, {encoding: 'utf8'}, function(err, data){
			if (err){
				that.loadedConfig = util._extend( {}, defaultConfig );
				that.save();
				console.log("Returning default");
				return;
			}
			
			that.loadedConfig = JSON.parse(data);
			console.log('Config loaded from file');
		});
		*/
    });
};

Config.prototype.isLoaded = function()
{
    if (this.loadedConfig === null)
        return false;
    else
        return true;
    
};
// Updates config in the database, if no key specified updates all
Config.prototype.save = function(guild){
    return new Promise( (resolve, reject) =>
    {

        for (var i in this.loadedConfig[guild]){
            //query += 'Update `config` set `value` = "' + this.loadedConfig[i] + '" where `key`="' + i + '";';
            this.mysqlPool.query( this.makeUpdateQuery(i, this.loadedConfig[guild][i], guild) , function(err, rows){
                if (err) 
                {
                    console.log(err);
                    reject();
                }
				
                resolve();
            });
        }

        /*
		fs.writeFile(path, JSON.stringify(this.loadedConfig), function(err){
			if (err){
				console.log("Problem saving config");
				return;
			}
			
			console.log("Config saved!");
		});
		*/
    });
};

Config.prototype.makeUpdateQuery = function(key, value, guild){
    if (this.defaultConfig[key].type == 'json'){
        value = JSON.stringify(value);
    }
    return 'Update `config` set `value` = ' + this.mysqlPool.escape(value) + ' where `key`="' + key + '" and `guild`="' + guild + '"';
};

Config.prototype.insertNewKey = function(key, value, guild){
    return new Promise( (resolve, reject) =>
    {
        if (this.defaultConfig[key].type == 'json') value = JSON.stringify(value);
		
        this.mysqlPool.query('insert into `config` (`key`, `value`, `guild`) VALUES ("' + key + '", ' + this.mysqlPool.escape(value) + ', "' + guild + '")', function(err, rows){
            if (err) 
            {
                console.log(err);
                reject();
            }
            resolve();
        });
    });
};

Config.prototype.getDefault = function(key){
    if (typeof this.defaultConfig[key] != 'undefined')
    {
        return this.defaultConfig[key].value;
    }
    
    console.log('Config value ' + key + 'not found in default object');
    return false;
};

Config.prototype.reset = function(key, guild){
    if (this.get(key, guild) !== 'undefined')
    {
        this.loadedConfig[guild][key] = this.defaultConfig[key].value;
        this.save(guild);
        return true;
    }
    
    console.log('Config value ' + key + 'not found in default object');
    return false;
};

Config.prototype.set = function(key, value, guild){
    return new Promise( (resolve, reject) => 
    {
        if (typeof key !== 'string' || typeof value === undefined || typeof guild === undefined)
        {
            console.log('Attempting to set config with undefined values');
            console.log(`${key}  ${value}   ${guild}`);
            reject();
        }
		
        // Key exists, just set and save
        else if (typeof that.loadedConfig[guild] !== 'undefined' && typeof that.loadedConfig[guild][key] !== 'undefined'){
            that.loadedConfig[guild][key] = value;
            that.save(guild);
            resolve();
        }
		
        // Key doesn't exist in current config, but a default exists
        else if (typeof that.defaultConfig[key] !== 'undefined'){
            console.log('Inserting new key ' + key + ' into database');
            if (typeof that.loadedConfig[guild] !== 'object') 
                that.loadedConfig[guild] = {};
			
            that.loadedConfig[guild][key] = value;
            that.insertNewKey(key, value, guild)
                .then( () =>
                {
                    resolve();
                });
        }
        else
        {
		
            console.log('Config value ' + key + 'not found in default object');
            reject();
        }
    });
};

Config.prototype.get = function(key, guild){
    if (typeof this.loadedConfig[guild] !== 'undefined' && typeof this.loadedConfig[guild][key] !== 'undefined'){
        return this.loadedConfig[guild][key];
    }
    
    if (typeof this.defaultConfig[key] !== 'undefined'){
        this.set(key, this.defaultConfig[key].value, guild);
        return this.loadedConfig[guild][key];
    }
    console.log('Config key ' + key + ' not found in loaded or default object');
    return 'undefined';
};

Config.prototype.getNonDefaultGuilds = function(key){
    let output = [];
    
    if (typeof this.defaultConfig[key] !== 'undefined'){
        for (let i in this.loadedConfig)
        {
            let val = this.get(key, i);
            let def = this.defaultConfig[key].value;
            if (this.defaultConfig[key].type == 'json')
            {
                val = JSON.stringify(val);
                def = JSON.stringify(def);
            }
            
            if (val != def)
                output.push(i);
        }
        
        return output;
    }
    console.log('Config key ' + key + ' not found in loaded or default object');
    return null;
};

Config.prototype.load = function(){
    return new Promise( (resolve, reject) =>
    {
        this.loadedConfig = null;
		
        this.mysqlPool.query('select * from `config`', function(err, rows, fields){
            if (err)
            {
                console.log(err);
                process.exit(1);
                return;
            }
            var temp = {};
            for (var i in rows){
                //Create new object for guild if not already exist
                if (typeof temp[rows[i].guild] !== 'object') 
                    temp[rows[i].guild] = {};
				
                // Skip rows that are no longer in default config
                if (typeof that.defaultConfig[rows[i].key] === 'undefined') 
                    continue;
				
                var type = that.defaultConfig[rows[i].key].type;
				
                if ( type == 'boolean' ){
                    rows[i].value = (rows[i].value == 1 ? true : false);
                }else if ( type == 'int' ){
                    rows[i].value = parseInt(rows[i].value);
                }else if ( type == 'float' ){
                    rows[i].value = parseFloat(rows[i].value);
                }else if ( type == 'json' ){
                    let parsed = JSON.parse(rows[i].value);
					
                    if (!Array.isArray(parsed))
                    {
                        // Merge parsed JSON with defaultConfig value to accommodate adding values to objects
                        rows[i].value = Object.assign( {}, that.defaultConfig[rows[i].key].value, parsed );
                    }
                    else
                    {
                        // Don't merge if it's an array, no reason to.
                        rows[i].value = parsed;
                    }
                }
			
                temp[ rows[i].guild ][ rows[i].key ] = rows[i].value;
            }
            that.loadedConfig = temp;
			
            console.log('Config loaded');
            resolve();
        });
    });
};

Config.prototype.logMessage = function(data){
    this.mysqlPool.query('insert into `chatlog` ' +
                      '(mid, guild, channel, channel_name, author, author_name, author_descrim, nick, raw_message, message, time) ' + 
                      'VALUES (' + 
                      '"' + data.id + '", ' +                   //mid
                      '"' + data.channel.guild.id + '", ' +     //guild
                      '"' + data.channel.id + '", ' +           //channel
                      '"' + data.channel.name + '", ' +         //channel_name
                      '"' + data.author.id + '", ' +            //author
                      '"' + data.author.username + '", ' +      //author_name
                      '"' + data.author.discriminator + '", ' + //author_descrim
                      '"' + (data.member ? data.member.nickname : '') + '", ' +      //nick
                      '"' + data.content + '", ' +              //raw_message
                      '"' + data.cleanContent + '", ' +         //message
                      data.createdTimestamp +                   //time
                      ')');
};

Config.prototype.logDM = function(data){
    this.mysqlPool.query('insert into `chatlog` ' +
                      '(mid, channel, author, author_name, author_descrim, raw_message, message, time, recipient, recipient_name, recipient_descrim) ' + 
                      'VALUES (' + 
                      '"' + data.id + '", ' +                   //mid
                      '"' + data.channel.id + '", ' +           //channel
                      '"' + data.author.id + '", ' +            //author
                      '"' + data.author.username + '", ' +      //author_name
                      '"' + data.author.discriminator + '", ' + //author_descrim
                      '"' + data.content + '", ' +              //raw_message
                      '"' + data.cleanContent + '", ' +         //message
                      data.createdTimestamp +  ', ' +                 //time
                      '"' + data.channel.recipient.id + '", ' +            //recipient
                      '"' + data.channel.recipient.username + '", ' +      //recipient_name
                      '"' + data.channel.recipient.discriminator + '"' + //recipient_descrim
                      ')');
};



module.exports = Config;