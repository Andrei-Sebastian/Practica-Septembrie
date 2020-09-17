const config = require('./config'),
    express = require('express'),
    app = express();
const bodyParser = require("body-parser");
app.use(express.static(__dirname + '/public'));
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));
const users = require('./user/users')
const auth = require('./user/auth');
const article = require('./user/article');
const section = require('./user/section');
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

// login
app.get('/login',auth.login)


//=========== ARTICLE API ===============================================

app.post('/article/create',article.create);
app.post('/article/update/:_id',article.update);


//=========== SECTION API ===============================================

app.post('/section/create',section.create);
app.post('/section/update/:_id',section.update);



//=========== TEST API ===============================================
app.get('/test',(req,res,next)=>{
    res.send(req.headers["x-access-token"]);
  //  console.log("am ajuns");
   // next();
})


app.listen(config.web.port, config.web.host, function () {
    console.log('Listening on port ' + config.web.port + ' host ' + config.web.host);
});