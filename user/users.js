const common = require("../utils/common.js");
const User = common.db.collection("users");
const regexEmail = /^[^\s@]+@[^\s@]+.[^\s@]+$/;
const bcrypt = require("bcryptjs");

function hasNumbers(t) {
    var regex = /\d/g;
    return regex.test(t);
}

exports.create = (req, res) => {

    let f_name = req.body.first_name;
    let l_name = req.body.last_name;
    let email = req.body.email;
    let password = req.body.password;
    let confirm_password = req.body.confirm_password;
    let role = req.body.role;
    let department = req.body.department;
    let profile_image = req.body.profile_image;
    let active = false;

    //validation for all data
    if (f_name != null && (hasNumbers(f_name) || f_name.length < 3)) {
        return res.status(400).send({ message: "Invalid first name." });
    }
    if (l_name != null && (hasNumbers(l_name) || l_name.length < 3)) {
        return res.status(400).send({ message: "Invalid last name." });
    }
    if (password == null) {
        return res.status(404).send({ message: "Password not found." });
    }
    if (confirm_password == null) {
        return res.status(404).send({ message: "Password not found." });
    }
    if (confirm_password != password) {
        return res.status(406).send({ message: "Password not acceptable." });
    }
    if (!regexEmail.test(email)) {
        return res.status(400).send({ message: "Invalid email" });
    }

    //check if the email exists
    User.findOne({
        email: email
    }, async (err, user) => {
        //if the email is found means email is already in use
        if (user) {
            res.status(400).send({
                message: "Failed! Email is already in use!"
            }
            );
            return;
        }
        //if the email is not fount means we can create a new user
        else {
            const user = {
                _id: (await common.mongodbAggregatePromise("users", [{
                    $group: {
                        _id: null,
                        maxQuantity: { $max: "$_id" }
                    }
                }]))[0].maxQuantity + 1,
                first_name: f_name,
                last_name: l_name,
                email: email,
                password: bcrypt.hashSync(password, 8),
                role: role,
                department: department,
                profile_image: profile_image,
                active: active
            };

            User.insert(user, (err, data) => {
                return res.status(200).send(data);
            })
        }
    })
};