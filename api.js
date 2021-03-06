const config = require('./config'),
    express = require('express'),
    app = express();
const bodyParser = require("body-parser");
app.use(express.static(__dirname + '/public'));
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));
const users = require('./user/users');
const auth = require('./user/auth');
const article = require('./user/article');
const section = require('./user/section');
const role = require('./user/role');
const comment=require('./user/comment');
const vote=require('./user/vote');
const department=require('./user/department');
const common = require('./utils/common');
app.use( (req, res, next)=> {
    res.header(
      "Access-Control-Allow-Headers",
      "x-access-token, Origin, Content-Type, Accept"
    );
    next();
  });

//=========== USERS API =============================================

//create a new user
app.post('/user/create', users.create);


//=========== AUTH API ===============================================

app.get('/login',auth.login)
app.post('/register',auth.register)


//=========== ARTICLE API ===============================================

app.post('/article/create',article.create);
app.post('/article/update/:_id',article.update);
app.post('/article/delete/:_id',article.delete);
app.get('/article/one/:_id',article.getOneArticle);
app.get('/article/all',article.getAllArticlesFromDepartment);


//=========== SECTION API ===============================================

app.post('/section/create',section.create);
app.post('/section/update/:_id',section.update);


//=========== ROLE API ===============================================

app.post('/role/create',role.create);


//=========== COMMENT API ===============================================
app.post('/comment/create/:_id',comment.create);
app.post('/comment/update/:_id',comment.update);
app.post('/comment/delete/:_id',comment.delete);


//=========== VOTE API ===============================================
app.post('/vote/:_id',vote.vote);


//=========== DEPARTMENT API ===============================================
app.post('/department/create',department.create);
app.post('/department/delete/:_id',department.delete);


app.listen(config.web.port, config.web.host, function () {
    console.log('Listening on port ' + config.web.port + ' host ' + config.web.host);
});