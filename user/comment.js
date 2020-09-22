const common = require('../utils/common');
const Comment = common.db.collection("comments");
const Article = common.db.collection("articles");
const User = common.db.collection("users");
const Role = common.db.collection("roles");
const Vote = common.db.collection("votes");


exports.create = async (req, res) => {
    let id = common.getToken(req.headers["x-access-token"]);
    let article = parseInt(req.params._id);
    if (id.status == "error")
        return res.status(403).send({ message: "Forbidden" })

    //verify if current user exists
    let findRespnsUser = await common.findOneExist(User, { _id: id.id });
    if (findRespnsUser.status == false)
        return res.status(400).send({ message: "Current user does not exists" })

    //verify if current user was activated
    if (findRespnsUser.object.active == false)
        return res.status(404).send({ message: "User is not activated." });

    //verify if current user have acces to comment
    let accesRole = (await common.findOneExist(Role, { _id: findRespnsUser.object.role })).object.acces;
    if (accesRole.createComments == false)
        return res.status(403).send({ message: "You do not have access to create a comment." });

    //verify if article exists
    let findRespnsArticle = await common.findOneExist(Article, { _id: article });
    if (findRespnsArticle.status == false)
        return res.status(400).send({ message: "Article does not exists" })

    const comment = {
        _id: ((await common.mongodbAggregatePromise("comments", [{
            $group: {
                _id: null,
                maxQuantity: { $max: "$_id" }
            }
        }]))[0] || { maxQuantity: 0 }).maxQuantity + 1,
        author: id.id,
        article: article,
        text: req.body.text
    }
    Comment.insert(comment, (err, data) => {
        if (err)
            return res.status(400).send({ message: err });
        if (data.result.nModified == 0)
            return res.status(400).send({ message: "Something wrong" });
        return res.status(200).send(data);
    })

}

exports.update = async (req, res) => {
    let id = common.getToken(req.headers["x-access-token"]);
    let comment_id = parseInt(req.params._id);
    if (id.status == "error")
        return res.status(403).send({ message: "Forbidden" })

    //verify if current user exists
    let findRespnsUser = await common.findOneExist(User, { _id: id.id });
    if (findRespnsUser.status == false)
        return res.status(400).send({ message: "Current user does not exists" })

    //verify if current user was activated
    if (findRespnsUser.object.active == false)
        return res.status(404).send({ message: "User is not activated." });


    Comment.update({ _id: comment_id, author: id.id }, {
        $set: {
            text: req.body.text
        }
    }, (err, data) => {
        if (err)
            return res.status(400).send({ message: err });
        if (data.result.nModified == 0)
            return res.status(400).send({ message: "You do not have access to edit this comment or article was deleted." });
        return res.status(200).send(data);
    });

}

exports.delete = async (req, res) => {
    let id = common.getToken(req.headers["x-access-token"]);
    let comment_id = parseInt(req.params._id);
    if (id.status == "error")
        return res.status(403).send({ message: "Forbidden" })

    //verify if current user exists
    let findRespnsUser = await common.findOneExist(User, { _id: id.id });
    if (findRespnsUser.status == false)
        return res.status(400).send({ message: "Current user does not exists" })

    //verify if current user was activated
    if (findRespnsUser.object.active == false)
        return res.status(404).send({ message: "User is not activated." });

    //verify if comment exists
    let findRespnsComment = (await common.findOneExist(Comment, { _id: comment_id }))
    if (findRespnsComment.status == false)
        return res.status(400).send({ message: "Comment does not exists" })


    // verify if article exists
    let findRespnsArticle = await common.findOneExist(Article, { _id: findRespnsComment.article });
    if (findRespnsArticle.status == false)
        return res.status(400).send({ message: "Article does not exists" })

    // verify if current user have acces to delete a comment
    let accesRole = (await common.findOneExist(Role, { _id: findRespnsUser.object.role })).object.acces;
    if (!(accesRole.admin == true ||
        (accesRole.deleteCommentsOnOwnDepartment == true && findRespnsUser.object.department == findRespnsArticle.object.tags.department) ||
        id.id == findRespnsComment.author)) {
        return res.status(403).send({ message: "You do not have access to delete this comment." });
    }

    var arrayVoteId = await common.findAllIDToArray(Vote, { comment: comment_id });
    let respons = await Promise.all([common.removeFromTable(Comment, { _id: comment_id }), common.removeFromTable(Vote, { _id: { $in: arrayVoteId } })]);
    if (respons[0].status == -1)
        return res.status(400).send({ message: "Something wrong in comment" });
    if (respons[0].status == -1)
        return res.status(400).send({ message: "Something wrong in vote" });
    return res.status(200).send({ message: "Comment was deleted" });


}


