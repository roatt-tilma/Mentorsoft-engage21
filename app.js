const express = require('express');
const morgan = require('morgan');
const roomRoutes = require('./routes/roomRoutes');
const broadcastRoutes = require('./routes/broadcastRoutes')



//server config

const app = express();
const server = require('http').Server(app);
const io = require('socket.io')(server);


//set view engine, static folder and use morgan to see status in console

app.set('view engine', 'ejs');
app.use(express.static('public'));
app.use(morgan('dev'));
app.use(express.json());


server.listen(3000, () => {
    console.log("Listening at 3000");
})


//routes

app.get('/', (req, res) => {
    res.render('index', { title: 'HOME' });
})

app.get('/about', (req, res) => {
    res.render('about', { title: 'ABOUT' });
})


//room routes

app.use('/room', roomRoutes);


// broadcast

app.use('/broadcast', broadcastRoutes);


// invalid route

app.use((req, res) => {
    res.status(404).render('404', { title: 'ERROR' });
})


//socket.io events

io.on('connection', socket => {
   console.log('connected via web sockets');
})