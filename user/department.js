const common = require("../utils/common.js");
const Department = common.db.collection("departments");
const User = common.db.collection("users");
const Role = common.db.collection("roles");

exports.create = async (req, res) => {
    var id = common.getToken(req.headers["x-access-token"]);

    if (id.status == "error")
        return res.status(403).send({ message: "Forbidden" })

    //verify if current user exists
    let findRespnsUser = await common.findOneExist(User, { _id: id.id });
    if (findRespnsUser.status == false)
        return res.status(400).send({ message: "Current user does not exists" })

    //verify if current user was activated
    if (findRespnsUser.object.active == false)
        return res.status(404).send({ message: "User is not activated." });

    //verify if current user is admin
    let accesRole = (await common.findOneExist(Role, { _id: findRespnsUser.object.role })).object.acces;
    if (accesRole.admin == false)
        return res.status(403).send({ message: "You do not have access to create a role." });

    const department = {
        _id: ((await common.mongodbAggregatePromise("departments", [{
            $group: {
                _id: null,
                maxQuantity: { $max: "$_id" }
            }
        }]))[0] || { maxQuantity: 0 }).maxQuantity + 1,
        name: req.body.name,
    }

    if (department.name != null && (common.hasNumbers(department.name) || department.name < 2)) {
        return res.status(400).send({ message: "Invalid name." });
    }
    if ((await common.findOneExist(Department, { name: department.name })).status == true) {
        return res.status(400).send({ message: "This department exists." });
    }

    Department.insert(department, (err, data) => {
        if (err)
            return res.status(400).send({ message: err });
        return res.status(200).send(data);
    })

}