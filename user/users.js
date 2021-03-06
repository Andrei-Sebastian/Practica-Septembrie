const common = require("../utils/common.js");
const User = common.db.collection("users");
const Role = common.db.collection("roles");
const Department = common.db.collection("departments");
const bcrypt = require("bcryptjs");

exports.create = async (req, res) => {

    let f_name = req.body.first_name;
    let l_name = req.body.last_name;
    let email = req.body.email;
    let password = req.body.password;
    let confirm_password = req.body.confirm_password;
    let role = req.body.role;
    let department = req.body.department;
    let profile_image = req.body.profile_image;
    let active = true;

    //validation for all data
    if (f_name != null && (common.hasNumbers(f_name) || f_name.length < 3)) {
        return res.status(400).send({ message: "Invalid first name." });
    }
    if (l_name != null && (common.hasNumbers(l_name) || l_name.length < 3)) {
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
    if (!common.regexEmail.test(email)) {
        return res.status(400).send({ message: "Invalid email" });
    }
    if ((await common.findOneExist(Role, { _id: role })).status==false) {
        return res.status(400).send({ message: "Invalid role" });
    }
    if (department != null && department < 2) {
        return res.status(400).send({ message: "Invalid department." });
    }

    //check if the email exists
    let findRespnsUser = await common.findOneExist(User, { email: email });
    if (findRespnsUser.status == true)
        return res.status(400).send({ message: "Email already exists" })

    //check if the department exists
    let findRespnsDepartment = await common.findOneExist(Department, { _id: department });
    if (findRespnsDepartment.status == false)
        return res.status(400).send({ message: "Department does not exists" })
    
    const user = {
        _id: ((await common.mongodbAggregatePromise("users", [{
            $group: {
                _id: null,
                maxQuantity: { $max: "$_id" }
            }
        }]))[0] || { maxQuantity: 0 }).maxQuantity + 1,
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
        if (err)
            return res.status(400).send({ message: err });
        return res.status(200).send(data);
    })
};