const common = require("../utils/common.js");
const Article = common.db.collection("articles");
const User = common.db.collection("users");
const Section = common.db.collection("sections");
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

    const article = {
        _id: ((await common.mongodbAggregatePromise("articles", [{
            $group: {
                _id: null,
                maxQuantity: { $max: "$_id" }
            }
        }]))[0] || { maxQuantity: 0 }).maxQuantity + 1,
        title: req.body.title,
        author: id.id,
        tags: {
            department: req.body.department || findRespnsUser.object.department,
            programming_language: req.body.programming_language,
            framework: req.body.framework
        }
    }

    //verify if department exists
    let findResponsUserD = (await common.findOneExist(User, { department: article.tags.department }))
    if (findResponsUserD.status == false) {
        return res.status(400).send({ message: "Department does not exist" })
    }

    let findRole = (await common.findOneExist(Role, { _id: findRespnsUser.object.role }));
    let accesRole = findRole.object.acces;
    if (
        accesRole.admin == false ||
        accesRole.createArticleOnDepartment == false
    ) {
        return res.status(400).send({ message: "You do not have access to create an article" });
    }

    if (article.title != null && article.title.length < 3) {
        return res.status(400).send({ message: "Invalid title." });
    }
    if (!common.hasNumbers(article.author)) {
        return res.status(400).send({ message: "Invalid author." });
    }
    if (article.tags.department != null && article.tags.department.length < 3) {
        return res.status(400).send({ message: "Invalid department." });
    }

    if (article.tags.programming_language == null) {
        return res.status(400).send({ message: "Invalid programming language." });
    }
    if (article.tags.framework != null && article.tags.framework.length < 2) {
        return res.status(400).send({ message: "Invalid framework." });
    }

    Article.insert(article, (err, data) => {
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

    //verify if current user exists
    let findRespnsUser = await common.findOneExist(User, { _id: id.id });
    if (findRespnsUser.status == false)
        return res.status(400).send({ message: "Current user does not exists" })

    //verify if current user was activated
    if (findRespnsUser.object.active == false)
        return res.status(404).send({ message: "User is not activated." });

    const article = {
        author: id.id,
        title: req.body.title,
        tags: {
            department: req.body.department||findRespnsUser.object.department,
            programming_language: req.body.programming_language,
            framework: req.body.framework
        }
    }

    //verify if article exists
    let findRespnsArticle = await common.findOneExist(Article, { _id: parseInt(req.params._id) });
    if (findRespnsArticle.status == false)
        return res.status(400).send({ message: "Article does not exists" })

    let findRole = (await common.findOneExist(Role, { _id: findRespnsUser.object.role }));
    let accesRole = findRole.object.acces;

    if (accesRole.admin == true) {
        //verify if department exists
        let findResponsUserD = (await common.findOneExist(User, { department: article.tags.department }))
        if (findResponsUserD.status == false) {
            return res.status(400).send({ message: "Department does not exist" })
        }
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
        return res.status(400).send({ message: "You do not have access to edit an article" });
    }

    if (article.title != null && article.title.length < 3) {
        return res.status(400).send({ message: "Invalid title." });
    }
    if (article.tags.department != null && article.tags.department.length < 3) {
        return res.status(400).send({ message: "Invalid department." });
    }
    if (article.tags.programming_language == null) {
        return res.status(400).send({ message: "Invalid programming language." });
    }
    if (article.tags.framework != null && article.tags.framework.length < 2) {
        return res.status(400).send({ message: "Invalid framework." });
    }

    Article.update({ _id: parseInt(req.params._id), author: id.id }, article, (err, data) => {
        if (err)
            return res.status(400).send({ message: err });
        if (data.result.nModified == 0)
            return res.status(400).send({ message: "Something wrong" });
        return res.status(200).send(data);
    });
}

exports.delete = async (req, res) => {
    let idArticle = parseInt(req.params._id);
    let id = common.getToken(req.headers["x-access-token"]);

    if (id.status == "error")
        return res.status(403).send({ message: "Forbidden" })

    //verify if current user exists
    let findRespnsUser = await common.findOneExist(User, { _id: id.id });
    if (findRespnsUser.status == false)
        return res.status(400).send({ message: "Current user does not exists" })

    //verify if current user was activated
    if (findRespnsUser.object.active == false)
        return res.status(404).send({ message: "User is not activated." });

    //???verify if article exists
    let findRespnsArticle = await common.findOneExist(Article, { _id: parseInt(req.params._id) });
    if (findRespnsArticle.status == false)
        return res.status(400).send({ message: "Article does not exists" })

    let findRole = (await common.findOneExist(Role, { _id: findRespnsUser.object.role }));
    let accesRole = findRole.object.acces;

    if (accesRole.admin == true) {
      // continue
    }
    else if (accesRole.deleteArticleOnDepartment == true) {
        //verify if current user belong to this department
        if (findRespnsUser.object.department != findRespnsArticle.object.tags.department)
            return res.status(400).send({ message: "You do not belong to this department" })
    }
    else if (accesRole.deleteArticleOnOwnArticles == true) {
        //verify if the article was created by current user
        if (findRespnsUser.object._id != findRespnsArticle.object.author)
            return res.status(400).send({ message: "You are not the author of this article" })
    }
    else {
        return res.status(400).send({ message: "You do not have access to delete an article" });
    }

    var arrayId = await common.findAllToArray(Section, { article: idArticle });
    let respons = await Promise.all([common.removeFromTable(Section, { _id: { $in: arrayId } }), common.removeFromTable(Article, { _id: idArticle })]);
    if (respons[0].result.ok == 0 || respons[1].result.ok == 0)
        return res.status(400).send({ message: "Something wrong" });

    return res.status(200).send({ message: "All good" });

}