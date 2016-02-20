//Declares the node modules I need for this app.
var express = require('express');
var mysql = require('mysql');
var expressHandleBars = require ('express-handlebars');
var bodyParser = require('body-parser');
var session = require('express-session');
var Sequelize = require('sequelize');
//Declares the app with express
var loginapp = express();
//Checks the environment port if not use 3000.
var PORT = process.env.NODE_ENV || 3000;
//This sets the handlebars layout themes
loginapp.engine('handlebars', expressHandleBars({
  defaultLayout:'main'
}));
loginapp.set('view engine', 'handlebars');
//This sets the body parser which url encodes the url.
loginapp.use(bodyParser.urlencoded ({
  extended: false
}));
//This is creating a route and passing the html
loginapp.get('/', function(req, res){
  res.render('home', {
    msg:req.query.msg    //You need this here in order to make the session work since you are checking if they are authenthicated.
  });
});
//Using the session here first.
loginapp.use(session({   //you are calling the variable session to be used by express.
    secret: 'for i 11lsdqwerty',
    cookie: {
      maxAge: 1000 * 60 * 60 * 24 * 365
    },
    saveUninitialized:true,
    resave:false
}));
//New connection to mysql databse
var connection = new Sequelize('logmein_authentication', 'root', 'password');
//Model-representation of data.
var User = connection.define('User', {
    email:Sequelize.STRING,
    password:Sequelize.STRING,
    firstName:Sequelize.STRING,
    lastname:Sequelize.STRING
});

/******* Start Regestration Code *******/

//This is creating a post route, that is taking in the users name and password and storing it into a variable.
loginapp.post('/register', function (req, res) {
  var email = req.body.email;
  var password = req.body.password;

  User.create({
    email: email,
    password: password
  }).then(function(result) {
    res.session.authenticated = user;
    res.redirect('/success');
  }).catch(function (err) {
    throw err;
  });
});

/******* End Regestration Code *******/



/******* Start Log In Code *******/

//Runnig the login request. Storing users information in a variable.
  loginapp.post('/login', function (req, res) {
    //Get the email and password from the body and storing it into a variable.
    var email = req.body.email;
    var password = req.body.password;
    //Find a user.
    User.findOne({
      WHERE: {
    //Using the variable  stored information and passing it into mysql.
        email: email,
        password: password
      }
    }).then(function(user) {
      if(user) {
        res.redirect('/success');
        res.session.authenticated = true;
      } else {
        res.redirect('/?msg=You failed at life');
      }
    }).catch(function(err) {
      throw err;
    });
  });

/******* End Log In Code *******/

   //login succesful
  loginapp.get('/success', function (req, res, next) {
    if(req.session.authenticated === true) {
      next();
    } else {
      res.redirect("/?msg=You need to be authenticated");
    }
  }, function(req, res) {
    res.send('You did it my main man');
  });

 connection.sync({force:true}).then(function() {
    //This sets the loginapp to listen on port 3000
    loginapp.listen(PORT, function(){
      console.log("Listening!!!");
    });
  });

