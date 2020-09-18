const common = require("../utils/common.js");
const Section = common.db.collection("sections");
const Article = common.db.collection("articles");
const User = common.db.collection("users");
const Role = common.db.collection("roles");


exports.create = async (req, res) => {
    var id = common.getToken(req.headers["x-access-token"]);
    const section = {
        _id: ((await common.mongodbAggregatePromise("sections", [{
            $group: {
                _id: null,
                maxQuantity: { $max: "$_id" }
            }
        }]))[0] || { maxQuantity: 0 }).maxQuantity + 1,
        type: req.body.type,
        body: req.body.body,
        article: req.body.article
    }

    if (section.type == null || (section.type).length < 1) {
        return res.status(400).send({ message: "Type can not be null." });
    }

    if (section.body == null || (section.body).length < 1) {
        return res.status(400).send({ message: "Body can not be null." });
    }

    if (section.article == null || !Number.isInteger(section.article)) {
        return res.status(400).send({ message: "Article can not be null and must to be an integer." });
    }

    if (id.status == "error")
        return res.status(403).send({ message: "Forbidden" })

    //verify if current user exists
    let findRespnsUser = await common.findOneExist(User, { _id: id.id });
    if (findRespnsUser.status == false)
        return res.status(400).send({ message: "Current user does not exist" })

    //verify if current user was activated
    if (findRespnsUser.object.active == false)
        return res.status(404).send({ message: "User is not activated." });

    //verify if article exists
    let findRespnsArticle = await common.findOneExist(Article, { _id: section.article });
    if (findRespnsArticle.status == false)
        return res.status(400).send({ message: "Article does not exists" })

    //ROLE VALIDATIONS
    let findRole = (await common.findOneExist(Role, { _id: findRespnsUser.object.role }));
    let accesRole = findRole.object.acces;
    if (accesRole.admin == true) {
        //continue
    }
    else if (accesRole.createSectionDepartment == true) {
        //verify if current user belong to this department
        if (findRespnsUser.object.department != findRespnsArticle.object.tags.department)
            return res.status(400).send({ message: "You do not belong to this department" })
    }
    else if (accesRole.createSectiononOwnArticles == true) {
        //verify if current user is the author for this article
        if (findRespnsUser.object._id != findRespnsArticle.object.author)
            return res.status(400).send({ message: "You are not the author" })
    }
    else{
        return res.status(400).send({ message: "You do not have access to create a section" })
    }

    Section.insert(section, (err, data) => {
        if (err)
            return res.status(400).send({ message: err });
        if (data.result.nModified == 0)
            return res.status(400).send({ message: "Something wrong" });
        return res.status(200).send(data);
    });
}

exports.update = async (req, res) => {
    var id = common.getToken(req.headers["x-access-token"]);
    if (id.status == "error")
        return res.status(403).send({ message: "Forbidden" })

    const section = {
        type: req.body.type,
        body: req.body.body,
        article: req.body.article
    }

    if (section.type == null || (section.type).length < 1) {
        return res.status(400).send({ message: "Type can not be null." });
    }

    if (section.body == null || (section.body).length < 1) {
        return res.status(400).send({ message: "Body can not be null." });
    }

    if (section.article == null || !Number.isInteger(section.article)) {
        return res.status(400).send({ message: "Article can not be null and must to be an integer." });
    }

    //verify if current user exists
    let findRespnsUser = await common.findOneExist(User, { _id: id.id });
    if (findRespnsUser.status == false)
        return res.status(400).send({ message: "Current user does not exist" })

    //verify if current user was activated
    if (findRespnsUser.object.active == false)
        return res.status(404).send({ message: "User is not activated." });

    //verify if article exists
    let findRespnsArticle = await common.findOneExist(Article, { _id: section.article });
    if (findRespnsArticle.status == false)
        return res.status(400).send({ message: "Article does not exists" })

    //ROLE VALIDATIONS
    let findRole = (await common.findOneExist(Role, { _id: findRespnsUser.object.role }));
    let accesRole = findRole.object.acces;

    if (accesRole.admin == true) {
       // continue
    }
    else if (accesRole.editArticleOnDepartment == true) {
        //verify if current user belong to this department
        if (findRespnsUser.object.department != findRespnsArticle.object.tags.department)
            return res.status(400).send({ message: "You do not belong to this department" })
    }
    else if (accesRole.editArticleOnOwnArticles == true) {
        //verify if the article was created by current user
        if (findRespnsUser.object._id != findRespnsArticle.object.author)
            return res.status(400).send({ message: "You are not the author of this article" })
    }
    else {
        return res.status(400).send({ message: "You do not have access to edit a section" });
    }

    Section.update({ _id: parseInt(req.params._id), article: section.article }, section, (err, data) => {
        if (err)
            return res.status(400).send({ message: err });
        if (data.result.nModified == 0)
            return res.status(400).send({ message: "Something wrong" });
        return res.status(200).send({ message: "Updated" });
    });
}