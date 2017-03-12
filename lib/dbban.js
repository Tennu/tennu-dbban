function doesBanExist(hostname) {
    var self = this;
    return self.knex('dbban')
        .where({
            'hostname': hostname
        })
        .count()
        .then(function(count) {
            return count > 0;
        });
}

function addBans(hostname) {
    var self = this;
    return self.doesBanExist(hostname)
        .then(function(exists) {
            if (!exists) {
                return self.ban.addBans(hostname);
            }
            else {
                throw Error(hostname + ' is already banned.');
            }
        })
        .then(function(newBans) {
            return self.knex('dbban').insert({
                Hostname: hostname
            })
        });
}

module.exports = function(ban, knex) {
    return {
        ban: ban,
        knex: knex,
        doesBanExist: doesBanExist,

        addBans: addBans
    };
}
