exports.up = function(knex, Promise) {
    return knex.schema.createTableIfNotExists("dbban", function(table) {
        table.increments("Id").primary();
        table.string("Nickname", 255);
        table.string("Username", 255);
        table.string("Hostname", 255).unique();
        table.string("IdentifiedAs", 255);
        table.timestamp("Expires");
        table.timestamps();
    });
};

exports.down = function(knex, Promise) {
    return knex.schema.dropTableIfExists("dbban");
};