var common = {},
    mongo = require('mongoskin'),
    config = require('../config');

(function (common) {
    common.db = mongo.db(config.mongo.connectionString, { database: config.mongo.db, safe: true });
    console.log('Mongo connected');

}(common));

module.exports = common;

//Return a Promise for the Mongo Aggregate operation
module.exports.mongodbAggregatePromise = (table, queries) => {
    return new Promise((resolve, reject) => {
        common.db.collection(table).aggregate(queries, (error, result) => {
            if (error) { reject(error); } else { resolve(result); }
        });
    });
}