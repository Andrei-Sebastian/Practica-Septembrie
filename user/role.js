const common = require("../utils/common.js");
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

    const role = {
        _id: ((await common.mongodbAggregatePromise("roles", [{
            $group: {
                _id: null,
                maxQuantity: { $max: "$_id" }
            }
        }]))[0] || { maxQuantity: 0 }).maxQuantity + 1,
        name: req.body.name,
        acces: {
            admin: req.body.admin || false,

            createArticleOnDepartment: req.body.createArticleOnDepartment || false,
            createSectionDepartment: req.body.createSectionDepartment || false,
            createSectionOnOwnArticles: req.body.createSectionOnOwnArticles || false,
            createComments: req.body.createComments || true,

            editArticleOnDepartment: req.body.editArticleOnDepartment || false,
            editArticleOnOwnAticles: req.body.editArticleOnOwnAticles || false,
            editSectionDepartment: req.body.editSectionDepartment || false,
            editSectionOnOwnArticles: req.body.editSectionOnOwnArticles || false,


            deleteArticleOnDepartment: req.body.deleteArticleOnDepartment || false,
            deleteArticleOnOwnAticles: req.body.deleteArticleOnOwnAticles || false,
            deleteSectionDepartment: req.body.deleteSectionDepartment || false,
            deleteSectionOnOwnArticles: req.body.deleteSectionOnOwnArticles || false,
            deleteCommentsOnOwnDepartment: req.body.deleteCommentsOnOwnDepartment || false
        }
    }

    if (role.name != null && (common.hasNumbers(role.name) || role.name < 3)) {
        return res.status(400).send({ message: "Invalid first name." });
    }

    Role.insert(role, (err, data) => {
        if (err)
            return res.status(400).send({ message: err });
        return res.status(200).send(data);
    })

}