const fs = require('fs');
const tmi = require('tmi.js');
const async = require('async');
const request = require('request');
const api_url = 'http://localhost:3030'

const prefix = '!';
const handlers = {
    'cmds': cmds,
    'g': game,
    't': title
};
const commands = require(__dirname + '/commands.json');
const custom_commands = require(__dirname + '/custom_commands.json');
const oath_token = require(__dirname + '/auth_token.js');
const options = {
    options: {
        debug: true
    },
    connection: {
        reconnect: true
    },
    identity: {
        username: 'juicebot1',
        password: oath_token
    },
    channels: ['#iambaguette']
};
const client = new tmi.client(options);
client.connect();

function customapi(url, callback) {
    request(url, (error, response, body) => {
        callback(error, body);
    });
}

function getAccessLevel(userstate) {
    if (userstate.badges == undefined) return 0;
    if (userstate.badges.broadcaster != undefined) return 2;
    if (userstate.badges.moderator != undefined) return 1;
    return 0;
}

client.on('chat', function (channel, userstate, message, self) {
    if (self) return;

    // regular commands
    filter(channel, userstate, message);

    // custom commands
    filterSpecial(channel, userstate, message);
});

function filter(channel, userstate, message) {
    for (let key in commands) {
        if (!commands.hasOwnProperty(key)) continue;
        const args = message.split(' ');
        if (args[0] != (prefix + key)) continue;
        args.shift();
        const accesslevel = getAccessLevel(userstate);
        if (accesslevel >= commands[key].accesslevel) {
            handlers[key](channel, userstate, ...args);
        }
    }
}

function cmds(channel, userstate, action, command_name, ...args) {
    if (action == undefined) return;
    if (command_name == undefined) return;
    const command_response = args.join(' ');

    if (action == 'add') {
        if (command_response.length <= 0) return;
        custom_commands[command_name] = {
            "response": command_response,
            "accesslevel": 0
        };
        fs.writeFileSync(__dirname + '/custom_commands.json', JSON.stringify(custom_commands, null, 4));
    } else if (action == 'delete') {
        delete custom_commands[command_name];
        fs.writeFileSync(__dirname + '/custom_commands.json', JSON.stringify(custom_commands, null, 4));
    }
    //console.log(action, command_name, command_response);
}

function game(channel, userstate) {

}

function title(channel, userstate, ...args) {
    const new_title = args.join(' ');
    if (new_title <= 0) {
        request.get({ url: api_url + `/title/${channel.substring(1)}/` }, (error, response, body) => {
            //console.log(body);
            client.say(channel, body);
        });
    } else {
        request.put({ url: api_url + `/title/${channel.substring(1)}/`, json: { channel: { status: `${new_title}` } } }, (error, response, body) => {
            //console.log('summething', error);
        });
    }
}

function filterSpecial(channel, userstate, message) {
    for (let key in custom_commands) {
        if (!custom_commands.hasOwnProperty(key)) continue;
        if (message != key) continue;
        const accesslevel = getAccessLevel(userstate);
        if (accesslevel >= custom_commands[key].accesslevel) {
            let response = custom_commands[key].response;
            const custom = response.match(/@[a-zA-Z]+/g);
            const urls = [];
            const custom_urls = {};
            custom.forEach((value, index) => {
                let url = "";
                if (value == '@uptime') {
                    url = api_url + `/uptime/${channel.substring(1)}/`;

                } else if (value == '@broadcaster') {
                    url = api_url + `/name/${channel.substring(1)}/`;
                }
                urls.push(url);
                custom_urls[url] = index;
                response = response.replace(value, '@' + index);
            });
            // only async if there are any requests
            if (urls.length > 0) {
                async.map(urls, customapi, (err, res) => {
                    if (err) return console.log(err);
                    console.log(res)
                    res.forEach((value, index) => {
                        const index_id = custom_urls[urls[index]];
                        response = response.replace('@' + index_id, value);
                    })
                    client.say(channel, response);
                });
            }
        }
    }
}