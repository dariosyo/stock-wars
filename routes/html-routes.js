// Requiring path to so we can use relative routes to our HTML files
var path = require("path");
var express = require("express");
var db = require("../models/index");


// Requiring our custom middleware for checking if a user is logged in
var isAuthenticated = require("../config/middleware/isAuthenticated");

module.exports = function(app) {

  app.get("/", function(req, res) {
    if (req.user) {
      console.log('signed in');

      res.render("dashboard", {
        msg: "Let's get started, ",
        name: req.user.firstName,
        total: req.user.initialCash,
        available: req.user.activeCash,
        user: req.user,
      });
    }
    else{
      console.log('index');
      res.render("index")
    }
  });

  app.get("/login", isAuthenticated, function(req, res) {    
    if (req.user) {
      res.render("dashboard")
    }
    // res.sendFile(path.join(__dirname, "../public/login.html"));
  });

  app.get("/logout", function(req, res) {
    req.logout();
    res.redirect("/")
  })

  // Here we've add our isAuthenticated middleware to this route.
  // If a user who is not logged in tries to access this route they will be redirected to the signup page
  app.get("/members", isAuthenticated, function(req, res) {
    res.render("members");
  });

  app.get("/transaction", isAuthenticated, function(req, res) {
    res.render("transaction");
  });


  //  Let anyone who is not signed in see this page
  app.get("/stock", function(req, res) {
    if (req.user) {
      // res.render("stock", {
      //   user: req.user,
      //   name: req.user.firstName
      // });
      res.render("stock", req.query)

    }
  })

  app.get("/dashboard", function(req, res) {
    if(!req.user){res.render("index"); return;}
    db.Transactions.findAll({
          where: {userid: req.user.id}
        }).then(function(transactions){
          var tickerTally = {}

          transactions.forEach(tran => {
            var obj = tran.dataValues; // all the keys in a transaction
            var sym = obj.ticker;
            if(tickerTally[sym]==undefined){
              tickerTally[sym] = 
              {
                'ticker': sym,
                'quantity': parseInt(obj.quantity),
                'total': parseFloat(obj.total_price),
              }
            }
            else{
              tickerTally[sym].quantity += parseInt(obj.quantity);
              tickerTally[sym].total += parseFloat(obj.total_price);
            }
       
          })
            var stocks = [];
            for(key in tickerTally){
              stocks.push(tickerTally[key]);
            }
            console.log(stocks);
       
            res.render("dashboard", {
              msg: "Welcome back",
              name: req.user.firstName,
              total: req.user.initialCash,
              available: req.user.activeCash,
              user: req.user,
              stock: stocks
            }); 
        
         
    });
  })

  app.get("/*",function(req,res){
    res.render("404",{
      msg: "Page doesn't not exist",
      error: "404"
    });
  })

};
