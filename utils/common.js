var common = {},
    mongo = require('mongoskin'),
    config = require('../config'),
    jsonwebtoken = require('jsonwebtoken');

(function (common) {
    common.db = mongo.db(config.mongo.connectionString, { database: config.mongo.db, safe: true });
    console.log('Mongo connected');

}(common));

module.exports = common;

module.exports.secretkey = "secret";

module.exports.verifyToken = (token, id) => {
    return jsonwebtoken.verify(token, common.secretkey, (err, decoded) => {
        if (err) {
            return res.status(401).send({
                message: "Unauthorized!"
            });
        }
        return decoded._id == id;
    })

}


//decode token and get user id
module.exports.getToken = (token) => {
    return jsonwebtoken.verify(token, common.secretkey, (err, decoded) => {
        if (err) {
            return { status: "error", message: err };
        }
        return { status: "success", id: decoded._id };
    })

}

//verify if in a string exists numbers
module.exports.hasNumbers = (param) => {
    var regex = /\d/g;
    return regex.test(param);
}

//return if in a table exists....
module.exports.findOneExist = (table, query) => {
    return new Promise((resolve, reject) => {
        table.findOne(query, (err, data) => {
            if (err || !data)
                resolve({ message: "Something wrong", status: false,object:data });
            else
                resolve({ message: "All good", status: true, object: data })
        });
    });
}

//Return a Promise for the Mongo Aggregate operation
module.exports.mongodbAggregatePromise = (table, queries) => {
    return new Promise((resolve, reject) => {
        common.db.collection(table).aggregate(queries, (error, result) => {
            if (error) { reject(error); } else { resolve(result); }
        });
    });
}