// Requiring our models and passport as we've configured it
var db = require("../models");
var passport = require("../config/passport");
var request = require("request");
var isAuthenticated = require("../config/middleware/isAuthenticated");

module.exports = function(app) {
  // Using the passport.authenticate middleware with our local strategy.
  // If the user has valid login credentials, send them to the members page.
  // Otherwise the user will be sent an error
  app.post("/api/login", passport.authenticate("local"), function(req, res) {
    // Since we're doing a POST with javascript, we can't actually redirect that post into a GET request
    // So we're sending the user back the route to the members page because the redirect will happen on the front end
    // They won't get this or even be able to access this page if they aren't authed
    res.json(req.user)
  });



//Route for sigining up a user
  app.post("/api/signup", function(req, res) {
    db.User.findOne({
      where: {email: req.body.email}
    }).then(function(result){
      if(result !== null) {
        res.json("exists");
      } else {
        db.User.create({
          firstName: req.body.first,
          lastName: req.body.last,
          email: req.body.email,
          password: req.body.password,
          initialCash: req.body.money,
          activeCash: req.body.money,
        }).then(function() {
          res.redirect(307, "/api/login");
        }).catch(function(err) {
          res.json(err);
          res.status(422).json(err.errors[0].message);
        });
      }
    });
  });

  // Route for logging user out
  app.get("/logout", function(req, res) {
    req.logout();
    res.redirect("/");
  });


  // Posting a new transaction
  app.post("/api/transaction", function(req, res) {
    //If they are not a user, they will hit a return
    if(!req.user){
      return
    }
    var currentCash;
    var afterTransaction;

    //Creating a trasaction of the object based on the information received from the front end
    var newTransaction = {
      userid: req.user.id,
      ticker: req.body.ticker,
      quantity: parseInt(req.body.quantity),
      price: parseFloat(req.body.price),
      total_price: parseFloat(req.body.total_price)
    }

    //This is validating the user has enough available money to pay for the stock
    //If they do, their "active cash" is updated
    db.User.findOne({
      where: {id: req.user.id}
    }).then(function(user){
      currentCash = parseInt(user.activeCash);
      afterTransaction = currentCash-newTransaction.total_price;
      if(parseInt(afterTransaction) > 0){
        db.Transactions.create(newTransaction);
        user.update({activeCash: parseInt(afterTransaction)}).then(function(){
          res.json(newTransaction)
        });
      }
      else{
        res.json("Not enough cash");
      }
    })
  });
};
