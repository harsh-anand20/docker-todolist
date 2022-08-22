const express = require("express");
const mongoose = require("mongoose");
const _ = require("lodash");
const app = express();
const session = require("express-session");
const passport = require("passport");
const passportLocalMongoose = require("passport-local-mongoose");

app.use(express.static("public"));
app.use(express.urlencoded({extended: true}));
app.set('view engine', 'ejs');

app.use(session({
    secret: "Our little secret.",
    resave: false,
    saveUninitialized: false
  }));

  app.use(passport.initialize());
  app.use(passport.session());

mongoose.connect("mongodb+srv://admin-harsh:Harsh1999@cluster0.9t7bu.mongodb.net/todoDB");

const itemsSchema = {
    item: String
};
const Item = mongoose.model("Item", itemsSchema);
const defaultItem = new Item({item: "Drink Enough Water!"});

const listSchema = {
    name: String,
    items: [itemsSchema]
}
const List = mongoose.model("List", listSchema);

const userSchema = new mongoose.Schema({
    username: String,
    password: String
});

userSchema.plugin(passportLocalMongoose);

const User = new mongoose.model("User", userSchema);

passport.use(User.createStrategy());
passport.serializeUser(function(user, done) {
    done(null, user);
});
passport.deserializeUser(function(user, done) {
    done(null, user);
});

app.get("/", function(req, res){
    res.render("home");
});

app.get("/register", function(req, res){
    res.render("register");
});

app.get("/login", function(req, res){
    res.render("login");
});

app.post("/logout", function(req, res){
    req.logout(function(err) {
        if (err) { 
            console.log(err);
        } else {
            res.redirect('/');
        }
    });
});

app.get("/:customListName", function(req, res){
    const customListName = _.capitalize(req.params.customListName);

    if(req.isAuthenticated()){ 
        List.findOne({name: customListName}, function(err, foundList){
            if(!err) {
                if(!foundList) {
                    // Create a new List
                    const list = new List({
                        name: customListName,
                        items: [defaultItem]
                    });
                    list.save(function(err, result){
                        if(!err) {
                            res.redirect("/"+customListName);
                        }           
                    }); 
    
                } else {
                    // Show existing List
                    res.render("list", {listTitle: foundList.name, newListItems: foundList.items});
                }
            }
        });
    } else {
        res.redirect("/login");
    }
});

app.post("/register", function(req, res){
    req.body.username = _.capitalize(req.body.username);
    User.register({username: req.body.username}, req.body.password, function(err, user){
        if(err) {
            console.log(err);
            res.redirect("/register");
        } else {
            passport.authenticate("local")(req, res, function(){
                res.redirect("/"+req.body.username);
            });
        }
    });
});

app.post("/login", function(req, res){
    req.body.username = _.capitalize(req.body.username);

    const user = new User({
        username: req.body.username,
        password: req.body.password
    })

    req.login(user, function(err){
        if (err) {
            console.log(err);
            res.redirect("/");
        } else {
            passport.authenticate("local")(req, res, function(){
                res.redirect("/"+req.body.username);
            });
        }
    })
});

app.get("/logout", function(req, res){
    req.logout(function(err) {
        if (err) { 
            console.log(err);
        } else {
            res.redirect('/');
        }
      });
});

// Application
app.post("/", function(req, res){
    
    const itemName  = req.body.newItem;
    const listName = req.body.list;

    const item = new Item({item: itemName});

    List.findOne({name: listName}, function(err, foundList){
        if(!err){
            foundList.items.push(item);
            foundList.save();
            res.redirect("/"+listName);
        }
    }); 
});

app.post("/delete", function(req, res){
    
    const checkedItemId = req.body.checkbox;
    const listName = req.body.listName;
    
    List.findOneAndUpdate({name: listName}, {$pull: {items: {_id: checkedItemId}}}, function(err, foundList){
        if(!err){
            res.redirect("/"+listName);
        }
    });
});
// Application

let port = process.env.PORT;
if (port == null || port == "") {
  port = 3000;
}

app.listen(3000, function(){
    console.log("Server is up and running successfully.");
});