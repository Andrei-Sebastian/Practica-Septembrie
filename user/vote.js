const common = require('../utils/common');
const Comment = common.db.collection("comments");
const Article = common.db.collection("articles");
const User = common.db.collection("users");
const Role = common.db.collection("roles");
const Vote = common.db.collection("votes");

exports.vote = async (req, res) => {
    let comment_id =parseInt(req.params._id);
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

    //verify if current user is the auhor of comment
    let findRespnsComment = (await common.findOneExist(Comment, { _id: comment_id }));
    if (findRespnsComment.object.author == id.id)
        return res.status(403).send({ message: "You can not to vote your comment." });
console.log("all good");
    //verify if current user belongs to current department
    let findRespnsArticle = (await common.findOneExist(Article, { _id: findRespnsComment.object.article }));
    if (findRespnsUser.object.department != findRespnsArticle.object.tags.department)
        return res.status(403).send({ message: "You do not have access to vote this comment." });

    //verify if current user voted this comment
    let findRespnsVote = (await common.findOneExist(Vote, { comment: comment_id, author: id.id }));
    if (findRespnsVote.status == true) {
        Vote.update({ comment: comment_id, author: id.id }, {
            $set: {
                approve: req.body.approve
            }
        }, (err, data) => {
            if (err)
                return res.status(400).send({ message: err });
            if (data.result.nModified == 0)
                return res.status(400).send({ message: "Not changed" });
            return res.status(200).send({ message: "Updated" });
        });
    }
    else {
        let vote = {
            _id: ((await common.mongodbAggregatePromise("votes", [{
                $group: {
                    _id: null,
                    maxQuantity: { $max: "$_id" }
                }
            }]))[0] || { maxQuantity: 0 }).maxQuantity + 1,
            comment: comment_id,
            author: id.id,
            approve: req.body.approve
        }
        Vote.insert(vote, (err, data) => {
            if (err)
                return res.status(400).send({ message: err });
            if (data.result.nModified == 0)
                return res.status(400).send({ message: "Something wrong" });
            return res.status(200).send(data);
        })
    }


}

