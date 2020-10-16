var sqlite3 = require('sqlite3').verbose();
var express = require('express');
var http = require('http');
var path = require("path");
var bodyParser = require('body-parser');
var helmet = require('helmet');
var rateLimit = require("express-rate-limit");


var app = express();
var server = http.createServer(app);
var io = require('socket.io')(server);   //new

const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100 // limit each IP to 100 requests per windowMs
});


var db = new sqlite3.Database('./database/employees.db');


app.use(bodyParser.urlencoded({extended: false}));
app.use(express.static(path.join(__dirname,'./public')));
app.use(helmet());
app.use(limiter);

db.run('CREATE TABLE IF NOT EXISTS emp(id TEXT, name TEXT)');
db.run('CREATE TABLE IF NOT EXISTS msg(name TEXT, tele TEXT, email TEXT, message TEXT)');  //new

app.get('/', function(req,res){
  res.sendFile(path.join(__dirname,'./public/index.html'));
});


// Add
app.post('/add', function(req,res){
  db.serialize(()=>{
    db.run('INSERT INTO emp(id,name) VALUES(?,?)', [req.body.empid, req.body.empname], function(err) {
      if (err) {
        console.log(err.message);
        io.emit('result', 'An error occurred');
      }
      console.log("New employee has been added");
      io.emit('result', 'Employee added successfully');
    });

  });

});


// View
app.post('/view', function(req,res){
  db.serialize(()=>{
    db.each('SELECT id ID, name NAME FROM emp WHERE id =?', [req.body.empid], function(err,row){     //db.each() is only one which is funtioning while reading data from the DB
      if(err){
        io.emit('result', 'An error occurred');
        console.error(err.message);
      }
      io.emit('result',` ID: ${row.ID},    Name: ${row.NAME}`);
      console.log("Entry displayed successfully");
    });
  });
});


//Update
app.post('/update', function(req,res){
  db.serialize(()=>{
    db.run('UPDATE emp SET name = ? WHERE id = ?', [req.body.empname,req.body.empid], function(err){
      if(err){
        io.emit('result', 'An error occurred');
        console.error(err.message);
      }
      io.emit('result', 'Employee modified successfully');
      console.log("Entry updated successfully");
    });
  });
});

// Delete
app.post('/delete', function(req,res){
  db.serialize(()=>{
    db.run('DELETE FROM emp WHERE id = ?', req.body.empid, function(err) {
      if (err) {
        io.emit('result', 'An error occurred');
        console.error(err.message);
      }
      io.emit('result', 'Employee has been removed');
      console.log("Entry deleted");
    });
  });

});

//new
app.post('/message', function(req, res){
  db.serialize(()=>{
    db.run('INSERT INTO msg(name,tele,email,message) VALUES(?,?,?,?)', [req.body.name, req.body.telnum, req.body.emailid, req.body.message], function(err) {
      if (err) {
        console.log(err.message);
        io.emit('result', 'An error occurred');
      }
      console.log("Message recorded");
      io.emit('result', 'Message sent successfully');
    });

  });
});


// Closing the database connection.
app.get('/close', function(req,res){
  db.close((err) => {
    if (err) {
      res.send('There is some error in closing the database');
      return console.error(err.message);
    }
    console.log('Closing the database connection.');
    res.send('Database connection successfully closed');
  });

});



server.listen(3000, function(){
  console.log("server is listening on port: 3000");
});

