const express = require('express');
//const morgan = require('morgan');

//server config

const app = express();
const server = require('http').Server(app);
const io = require('socket.io')(server);

//set view engine, static folder and use morgan to see status in console

app.set('view engine', 'ejs');
app.use(express.static('public'));
//app.use(morgan('dev'));
app.use(express.json());

module.exports = {
    app,
    server,
    io
}