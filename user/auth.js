const common = require("../utils/common.js");
const User = common.db.collection("users");
const bcrypt = require("bcryptjs");
const jsonwebtoken=require('jsonwebtoken');

exports.login = (req, res) => {
    User.findOne({
        email: req.body.email
    }, (err, user) => {
        if (!user) {
            return res.status(404).send({ message: "User Not found." });
        }
        if (user.active==false) {
            return res.status(404).send({ message: "User is not activated." });
        }
        var passwordIsValid = bcrypt.compareSync(
            req.body.password,
            user.password
        );
        if (!passwordIsValid) {
            return res.status(401).send({
                accessToken: null,
                message: "Invalid Password!"
            });
            
        }
        accessToken=jsonwebtoken.sign({_id: user._id},common.secretkey,{expiresIn:86400});
        return res.status(200).send({
            accessToken,
            message: "Login"});
    }
    )
};
