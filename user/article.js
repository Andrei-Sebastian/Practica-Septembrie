const common = require("../utils/common.js");
const Article = common.db.collection("articles");
const User = common.db.collection("users");
const Section = common.db.collection("sections");
const Role = common.db.collection("roles");
const Comment = common.db.collection("comments");
const Vote = common.db.collection("votes");


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

    if (accesRole.createArticleOnDepartment == false) {
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
            department: req.body.department || findRespnsUser.object.department,
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
    let array = [common.removeFromTable(Article, { _id: idArticle })];
    var arraySectionId = await common.findAllIDToArray(Section, { article: idArticle });
    var arrayCommentId = await common.findAllIDToArray(Comment, { article: idArticle });
    var arrayVoteId = await common.findAllIDToArray(Vote, { comment: { $in: arrayCommentId } });
    if (Array.isArray(arraySectionId) && arraySectionId.length > 0)
        array.push(common.removeFromTable(Section, { _id: { $in: arraySectionId } }));
    if (Array.isArray(arrayCommentId) && arrayCommentId.length > 0)
        array.push(common.removeFromTable(Comment, { _id: { $in: arrayCommentId } }));
    if (Array.isArray(arrayVoteId) && arrayVoteId.length > 0)
        array.push(common.removeFromTable(Vote, { _id: { $in: arrayVoteId } }));
    let respons = await Promise.all(array);

    for (i = 0; i < array.length; i++) {
        if (respons[i].status == -1)
            return res.status(400).send({ message: "Something wrong" });
    }
    return res.status(200).send({ message: "Article was deleted" });
}
//get details about one article
exports.getOneArticle = async (req, res) => {
    article_id = parseInt(req.params._id);
    articleResult = await common.findOneExist(Article, { _id: article_id });
    let comments = [];
    if (articleResult.status == false)
        res.status(400).send("Article does not exist");
    sectionsArray = await common.findAllToArray(Section, { article: article_id });
    commentsArray = await common.findAllToArray(Comment, { article: article_id });
    if (commentsArray.length != 0)
        for (i = 0; i < commentsArray.length; i++) {
            approvesArray = await common.findAllToArray(Vote, { comment: commentsArray[i]._id, approve: true });
            disapprovesArray = await common.findAllToArray(Vote, { comment: commentsArray[i]._id, approve: false });
            let arrayComments = {
                _id: commentsArray[i]._id,
                author: commentsArray[i].author,
                article: commentsArray[i].article,
                text: commentsArray[i].text,
                approves: approvesArray.length,
                disapproves: disapprovesArray.length
            }
            comments.push(arrayComments)
        }
    const result = {
        _id: articleResult.object._id,
        title: articleResult.object.title,
        author: articleResult.object.author,
        department: articleResult.object.tags.department,
        programming_language: articleResult.object.tags.programming_language,
        framework: articleResult.object.tags.framework,
        sections: sectionsArray,
        comments: comments
    }
    res.status(200).send(result);

}

//get details about articles belongs to a departent
exports.getAllArticlesFromDepartment = async (req, res) => {
    let department = req.body.department;
    let respons = [];
    articleResult = await common.findAllToArray(Article, { 'tags.department': department });
    if (articleResult.length == 0)
        res.status(400).send("In this department does not exists articles");
    for (i = 0; i < articleResult.length; i++) {
        sectionsArray = await common.findAllToArray(Section, { article: articleResult[i]._id });
        let arrayArticles = {
            _id: articleResult[i]._id,
            title: articleResult[i].title,
            author: articleResult[i].author,
            department: articleResult[i].tags.department,
            programming_language: articleResult[i].tags.programming_language,
            framework: articleResult[i].tags.framework,
            sections: sectionsArray
        }
        respons.push(arrayArticles)
    }
    res.status(200).send(respons);

}