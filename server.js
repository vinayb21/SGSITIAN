var express = require('express');
var MongoClient = require('mongodb').MongoClient;
var ObjectId = require('mongodb').ObjectId;
var assert = require('assert');
var bodyParser = require('body-parser');
var jwt = require('jwt-simple');
var bcrypt = require('bcryptjs');
var app = express();

//constant variable
var JWT_SECRET = 'sgsitian';

var db = null;
var url = 'mongodb://localhost:27017/sgsitian';

MongoClient.connect(process.env.MONGODB_URI || url, function(err, dbconn) {
  assert.equal(null, err);
  console.log("Connected correctly to server.");
  db = dbconn;
  
});

app.use(bodyParser.json());

app.use(express.static('public'));

app.get('/sgsitian', function(req, res, next) {
    
    db.collection('feeds', function(err, feedsCollection) {
        feedsCollection.find().toArray(function(err, feeds) {
           console.log(feeds);
           return res.json(feeds); 
        });
    });
    
});

app.get('/usersList', function(req, res, next){
    
    db.collection('users', function(err, usersCollection) {
        usersCollection.find({},{username: 1, _id: 0}).sort({"_id":-1}).toArray(function(err, usersList) {
            return res.json(usersList);
        });
    });
});


app.post('/sgsitian', function(req, res, next) {
    
    var token = req.headers['authorization'];
    var user = jwt.decode(token, JWT_SECRET);
    
    console.log(token);
    
    db.collection('feeds', function(err, feedsCollection) {
        var newFeed = {
            text: req.body.newFeed,
            user: user._id,
            username: user.username
        };
        
        feedsCollection.insert(newFeed, {w:1}, function(err) {
           return res.send(); 
        });
    });
    
    res.send();
});

app.put('/sgsitian/remove', function(req, res, next) {
    
    var token = req.headers['authorization'];
    var user = jwt.decode(token, JWT_SECRET);
    
    db.collection('feeds', function(err, feedsCollection) {
        var feedId = req.body.feed._id;
        console.log(user._id);
        feedsCollection.remove({_id: ObjectId(feedId), user: user._id}, {w:1}, function(err) {
           return res.send(); 
        });
    });
    
    res.send();
});

app.post('/users', function(req, res, next) {
    
    db.collection('users', function(err, usersCollection) {
        
        bcrypt.genSalt(10, function(err, salt) {
            bcrypt.hash(req.body.password, salt, function(err, hash){
                
                console.log(hash);
                var newUser = {
                    username: req.body.username,
                    password: hash,
                    fullName: req.body.fullName,
                    department: req.body.department,
                    profession: req.body.profession
                };
        
                usersCollection.insert(newUser, {w:1}, function(err) {
                   return res.send(); 
                });
                
            });
        });
        
        
    });
    
});

app.put('/users/signin', function(req, res, next) {
    
    console.log(req.body);
    db.collection('users', function(err, usersCollection) {
        
        usersCollection.findOne({username: req.body.username}, function(err, user) {
           
            bcrypt.compare(req.body.password, user.password, function(err, result) {
               if (result) {
                   var token = jwt.encode(user, JWT_SECRET);
                   return res.json({token: token});
               } else {
                   return res.status(400).send();
               }
            });
        });
        
        bcrypt.genSalt(10, function(err, salt) {
            bcrypt.hash(req.body.password, salt, function(err, hash){
                
                console.log(hash);
                var newUser = {
                    username: req.body.username,
                    password: hash
                };
        
                usersCollection.insert(newUser, {w:1}, function(err) {
                   return res.send(); 
                });
                
            });
        });
        
        
    });
    
});

app.listen(process.env.PORT, function() {
    console.log('sample');
});
