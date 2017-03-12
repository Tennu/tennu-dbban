var format = require('util').format;
var tennu = require('tennu');
var should = require('should');
var _ = require("lodash");
var banModule, adminModule;

if (process.env.NODE_ENV === 'development') {

    console.log('NODE_ENV=development.\n');

    console.log('Using tennu-ban locally. (useful if youre not using the npm registry version)');
    banModule = require('../../tennu-ban/plugin.js');

    console.log('Using tennu-admin locally. (useful if youre not using the npm registry version)');
    adminModule = require("../../tennu-admin/plugin.js");

}
else {
    banModule = require('tennu-ban');
    adminModule = require("tennu-admin");
}

var dbbanConfig = {
    admins: [{
        hostname: 'admin'
    }],
    'ban': {
        'denied-response': {
            message: "denied."
        }
    }
};

var client = {
    config: function(val) {
        return dbbanConfig[val];
    },
    'notice': _.noop,
    'debug': _.noop,
    'note': _.noop,
    'error': _.noop
};

var knexConfig = {
    client: 'sqlite3',
    connection: {
        filename: "./tennu-dbban-tests.sqlite"
    }
};

var adminImports = {
    'user': {
        'isIdentifiedAs': function() {
            return undefined;
        }
    }
};

var imports = {
    dbcore: {
        knex: require("knex")(knexConfig)
    },
    admin: adminModule.init(client, adminImports).exports
};

imports.ban = banModule.init(client, {
    admin: imports.admin
}).exports;

var mockCommandRunnerBuilder = function(plugin) {
    return function(command) {
        var rawArgs = command.split(' ');
        var routerArg = rawArgs.shift();
        var privmsg = {
            args: rawArgs,
            hostmask: {
                hostname: 'admin'
            }
        };
        return plugin.handlers[routerArg](privmsg);
    }
};

describe('tennu-dbban integration tests', function() {

    var plugin;
    var commander;

    before(function(done) {
        plugin = require("../plugin.js").init(client, imports);
        commander = mockCommandRunnerBuilder(plugin);

        imports.dbcore.knex('dbban').del()
            .then(function() {
                imports.ban.clearBans();
                done();
            });

    });

    it('Should add a ban.', function(done) {

        var hostname = 'test.hostname.1';

        commander('!ban add ' + hostname).then(function(res) {

            imports.dbcore.knex.first().from('dbban').where({
                Hostname: hostname
            }).should.eventually.containEql({
                Hostname: hostname
            });

            _.find(imports.ban.banned, function(o) {
                return String(hostname).match(new RegExp(o.hostname));
            }).should.not.be.undefined();

            done();
        });

    });


    it('Should add a temp ban.', function(done) {

        var hostname = 'test.hostname.2';

        commander(format('!ban addtemp %s 1 day', hostname)).then(function(res) {

            imports.dbcore.knex.first().from('dbban').where({
                    Hostname: hostname
                })
                .then(function(bannedHost) {
                    bannedHost.Hostname.should.equal = hostname;
                    bannedHost.Expires.should.not.be.undefined();
                    bannedHost.Expires.should.not.be.null();
                });

            var APIBan = _.find(imports.ban.banned, function(o) {
                return String(hostname).match(new RegExp(o.hostname));
            });
            
            APIBan.should.not.be.undefined();
            APIBan.expires.should.not.be.undefined();

            done();
        });

    });


});
