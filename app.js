const roomRoutes = require('./routes/roomRoutes');
const broadcastRoutes = require('./routes/broadcastRoutes');
const viewbroadcastRoutes = require('./routes/viewbroadcastRoutes');
const { app, server } = require('./server');

//start server

server.listen(process.env.PORT || 3000, () => {
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

//login

app.use('/hoststream', (req, res) => {
    res.render('hoststream', { title: 'Mentor' });
});

app.use('/viewstream', (req, res) => {
    res.render('viewstream', { title: 'Mentee' });
});

//viewbroadcast route

app.use('/viewbroadcast', viewbroadcastRoutes);

// broadcast

app.use('/broadcast', broadcastRoutes);


// invalid route

app.use((req, res) => {
    res.status(404).render('404', { title: 'ERROR' });
})


