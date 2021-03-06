//express setup
var express = require('express');
var app = express();
//Checks the environment port if not use 3000.
var PORT = process.env.NODE_ENV || 3000;
//Sequelize database setup
var Sequelize = require('sequelize');
var connection = new Sequelize('user_authentication_db', 'root', 'password');
//requiring passport last
var passport = require('passport');
var passportLocal = require('passport-local');
//requiring bcrypt, hashes passwords
var bcrypt = require("bcryptjs");
//reguiring conect-flash
var flash = require('connect-flash');
//requiring bodyParser an initializing for use
var bodyParser = require('body-parser');
app.use(bodyParser.urlencoded({
    extended: false
}));
//Initializing and requiring middleware express-session, enabaling cookies
app.use(require('express-session')({
      secret:'HELLO WORLD',
      resave: true,
      saveUninitialized: true,
      cookie: {secure: false, maxAge : (1000 * 60 * 60 * 2)},
}));
//Setting up and requring Handlebars
var exphb = require('express-handlebars');
app.engine('handlebars', exphb({defaultLayout:'main'}));
app.set('view engine', 'handlebars');

//Initializing flash
// app.use(flash());
/************* PASSPORT CODE START *************/
//Initializing passport.
app.use(passport.initialize());
app.use(passport.session());
//passport use method as callback when being authenticated
passport.use(new passportLocal.Strategy(function(username, password, done) {
    //check password in db
    User.findOne({
        where: {
            username:username,
        }
    }).then(function(user) {
        //check password against hash
        if(user){
            bcrypt.compare(password, user.dataValues.password, function(err, user) {
                if (user) {
                  //if password is correct authenticate the user with cookie
                  done(null, { id: username, username: username });
                } else{
                  done(null, null);
                }
            });
        } else {
            done(null, null);
        }
    });
}));
//change the object used to authenticate to a smaller token, and protects the server from attacks.
passport.serializeUser(function(user, done) {
  done(null, user.id);
});
passport.deserializeUser(function(id, done){
  done(null, {id: id, username: id})
});
/************* PASSPORT CODE END*************/

/************* SEQUELIZE CODE START*************/
//sequelize modal
var User = connection.define('user', {
    username: {
      type:Sequelize.STRING,
      allowNull: false,
      unique: true
    },
    password: {
      type:Sequelize.STRING,
      allowNull: false,
      validate: {
        len: {
            args: [4, 12],
            msg: ", or password must be between 4-12 characters"
        }
      }
    },
    firstName: {
      type:Sequelize.STRING,
    },
    lastName:{
      type:Sequelize.STRING,
    },
    TA: {
      type:Sequelize.STRING,
      allowNull: true,
    },
    student: {
      type:Sequelize.STRING,
      allowNull: true,
    },
    key:{
      type:Sequelize.STRING
    },
    instructor: {
      type:Sequelize.STRING,
      allowNull: true,
    },
},{
  hooks: {
    beforeCreate: function(input){
      input.password = bcrypt.hashSync(input.password, 10);
    }
  }
});

// database connection via sequelize
connection.sync().then(function() {
  app.listen(PORT, function() {
      console.log("Listening on!!:" + PORT)
  });
});
/************* SEQUELIZE CODE END *************/

/************* EXPRESS HANDLEBARS CODE START *************/
//Initialize local300host/ page. Once on that path it loads 'index'
app.get('/', function(req, res) {
    res.render('index', {msg: req.query.msg});
});

app.get('/login', function(req, res) {
  res.render('login', {msg: req.query.msg});
});

app.get('/register', function(req, res) {
  res.render('register', {msg: req.query.msg});
});


//Account creation via sequelize
app.post('/register', function(req, res){
    User.create(req.body).then(function(result){
      //redirects to '/' with the msg, you could redirect to diffrent hb or external link
      res.redirect('/register?msg=Account has been created');
    }).catch(function(err) {
      console.log(err);
      res.redirect('/register?msg='+ "E-mail " + err.errors[0].message); //? is a new parameter and not a new route
    });
});

//Once login in passports checks login credential with db to make sure user is authenticated.
app.post('/login', passport.authenticate('local', {
    //checks if your log in credentials are valid and it redirects you to the home page
    successRedirect: '/home',
    //if invalid it redirects to the "/" index page with the msg
    failureRedirect: '/login?msg=Login Credentials are not valid'
}));

//Routes and paths, must be created in order to redirect
app.get('/home', function(req, res){
    res.render('home', {
      user:req.user,
      isAuthenticated: req.isAuthenticated()
    });
});

app.get("/happy", function(req, res){
    res.render('happy', {
    user: req.user,
    isAuthenticated: req.isAuthenticated()
  });
})

app.get("/created", function(req, res){
    res.render('created',{
    msg: req.query.msg,
    user: req.user,
    isAuthenticated: req.isAuthenticated()
  });
});

/************* EXPRESS HANDLEBARS CODE END *************/
 //error handlers must go after exphb code
app.use(function(req, res, next) {
  var err = new Error('Not Found');
  err.status = 404;
  next(err);
});
//catch 404 and forward to error handler
if (app.get('env') === 'development') {
  app.use(function(err, req, res, next) {
    res.status(err.status || 500);
    res.render('error', {
      message: err.message,
      error: err
    });
  });
}
