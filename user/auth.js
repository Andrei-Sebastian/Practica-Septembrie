const common = require("../utils/common.js");
const User = common.db.collection("users");
const bcrypt = require("bcryptjs");
const jsonwebtoken = require('jsonwebtoken');

exports.login = (req, res) => {
    User.findOne({
        email: req.body.email
    }, (err, user) => {
        if (!user) {
            return res.status(404).send({ message: "User Not found." });
        }
        if (user.active == false) {
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
        accessToken = jsonwebtoken.sign({ _id: user._id }, common.secretkey, { expiresIn: 86400 });
        return res.status(200).send({
            accessToken,
            message: "Login"
        });
    }
    )
};

exports.register = async (req, res) => {
    let f_name = req.body.first_name;
    let l_name = req.body.last_name;
    let _email = req.body.email;
    let _password = req.body.password;
    let _confirm_password = req.body.confirm_password;
    let role = 4;

    if (f_name != null && (common.hasNumbers(f_name) || f_name.length < 3)) {
        return res.status(400).send({ message: "Invalid first name." });
    }
    if (l_name != null && (common.hasNumbers(l_name) || l_name.length < 3)) {
        return res.status(400).send({ message: "Invalid last name." });
    }
    if (_password == null) {
        return res.status(404).send({ message: "Password not found." });
    }
    if (_confirm_password == null) {
        return res.status(404).send({ message: "Password not found." });
    }
    if (_confirm_password != _password) {
        return res.status(406).send({ message: "Password not acceptable." });
    }
    if (!common.regexEmail.test(_email)) {
        return res.status(400).send({ message: "Invalid email" });
    }
    //check if the email exists
    let findRespnsUser = await common.findOneExist(User, { email: _email });
    if (findRespnsUser.status == true)
        return res.status(400).send({ message: "Email already exists" })

    const user = {
        _id: ((await common.mongodbAggregatePromise("users", [{
            $group: {
                _id: null,
                maxQuantity: { $max: "$_id" }
            }
        }]))[0] || { maxQuantity: 0 }).maxQuantity + 1,
        first_name: f_name,
        last_name: l_name,
        email: _email,
        password: bcrypt.hashSync(_password, 8),
        role: role,
        department: null,
        profile_image: null,
        active: false
    }

    User.insert(user, (err, data) => {
        if (err)
            return res.status(400).send({ message: err });
        return res.status(200).send(data);
    })
}