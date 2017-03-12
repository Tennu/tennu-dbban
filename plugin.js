var path = require("path");

const _getNotice = function(message) {
    return {
        'intent': 'notice',
        'query': true,
        'message': message
    };
};

var TennuDBBan = {
    configDefaults: {
        "dbban": {

        }
    },
    requiresRoles: ['ban', 'dbcore', 'admin'],
    init: function(client, imports) {

        var banConfig = client.config('dbban');

        const knex = imports.dbcore.knex;

        const ban = imports.ban;

        var dbBanPromise = knex.migrate.latest({
            tableName: 'tennu_dbban_knex_migrations',
            directory: path.join(__dirname, 'migrations')
        }).then(function() {
            return require('./lib/dbban')(ban, knex);
        });

        function respondRouter() {
            return function(IRCMessage) {
                
                return imports.admin.requiresAdmin(router)(IRCMessage);

                function router(privmsg) {
                    
                // TODO
                // '!tempban !tban'
                // '!unban !uban'
                // '!listbans !lban'
                // '!clearbans'

                    switch (privmsg.args[0]) {
                        case 'add':
                            return addBan(privmsg);
                        default:
                            return _getNotice('Subcommand for respond not found. See !help respond and check your PMs.')
                    }
                }
            }
        }

        function addBan(privmsg) {
            return dbBanPromise.then(function(dbban) {
                return dbban.addBans(privmsg.args[1]);
            });
        }

        return {
            handlers: {
                '!ban': respondRouter(),
            },

            help: require('./help.json'),

            commands: ['ban', 'tempban', 'unban', 'listbans', 'clearbans']
        }
    }
};

module.exports = TennuDBBan;
