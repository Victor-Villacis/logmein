//Declares the node modules I need for this app.
var express = require('express');
var expressHandleBars = require ('express-handlebars');
var mysql = require('mysql');
var bodyParser = require('body-parser');
var session = require('express-session');
//Declares the app
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
  extended:false
}));

//Using the session here first.
loginapp.use(session({   //you are calling the variable session to be used by express.
    secret: 'for i 11lsdqwerty',
    cookie: {
      maxAge: 1000 * 60 * 60 * 24 * 365 
    }, 
    saveUninitialized:true,
    resave:false
}));





//Using mysql.createConnection to creare a connecction to the mysql database.
var connection = mysql.createConnection ({
  port: 3306,
  host:'localhost',
  user:'root',
  password:'password',
  database:'logmein_authentication'
});
//Connecting to mysql.
connection.connect();

//This is creating a route and passing the html
loginapp.get('/', function(req, res){
  res.render('home', {
    msg:req.query.msg    //You need this here in order to make the session work since you are checking if they are authenthicated.
  });
});


/******* Start Regestration Code *******/

//This is creating a post route, that is taking in the users name and password and storing it into a variable.
loginapp.post('/register', function (req, res) {
  var email = res.body.email;
  var password = res.body.password;
//This is a registering query command and a query that checks if your account already exist.
//Checks if users email is already in the database and then escapes.
  var insertQuery = "INSERT INTO users(email, password) VALUES(?, ?)";
  var checkQuery = "SELECT * FROM users WHERE email=?" + connection.escape(email);

//Then we must execute the query command.Thus we do the following.
  connection.query(checkQuery, function(err, results) {
    if(err){
      throw err;
    }
    //If the user already exist then redirect to a page that tells them they already exist.
    else if (results.length > 0){
      res.redirect('/?msg=Already exists');
      //else they are redirected to a success page.
    } else { connection.query(insertQuery, [email, password], function(err){
      if(err) {
        throw err;
      }
      //before being redirected
      req.session.authenticated = true;
      //If no error than redirect to success page as you succeded in registering.
      res.redirect('/success');
    });
    }
  });//End connection.Query(checkQuery)
});

/******* End Regestration Code *******/

/******* Start Log In Code *******/

//Runnig the login request. Storing users information in a variable.
  loginapp.post('/login', function (req, res) {
    var email = res.body.email;
    var password = res.body.password;
//Declaring and running the mysql query. ? is a place holder for users input
    var checkQuery = "SELECT * FROM users WHERE email=? AND password=?";
    //Run the query.
    connection.Query(checkQuery, function (err, results) {
      if(err){
        throw err;
      } else if (results.length > 0){
        //before being redirected
        req.session.authenticated = true;
        res.redirect('success')
      } else {
        res.redirect('/?msg = You failed at life');
      }
    });//End connection.Query(checkQuery)

    //login succesful
  loginapp.get('/success', function (req, res, next) {
    if(req.session.authenticated === true) {
      next();
    } else {
      res.redirect("/?msg=You need to be authenticated");
    }
  }, function(req, res) {
    res.send('You did it my main man')
  });
});

/******* End Log In Code *******/





//This sets the loginapp to listen on port 3000
loginapp.listen(PORT, function(){
  console.log("Listening!!")
});