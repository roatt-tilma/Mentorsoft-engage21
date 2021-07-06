const roomRoutes = require('./routes/roomRoutes');
const { app, server } = require('./server');


//start server
server.listen(process.env.PORT || 3000, () => {
    console.log("Listening at 3000");
})


//routes

app.get('/', (req, res) => {
    res.render('index', { title: 'HOME' });
});

app.use('/room', roomRoutes);

app.use('/host', (req, res) => {
    res.render('createroomform', { title: 'Host' });
});

app.use('/guest', (req, res) => {
    res.render('joinroomform', { title: 'Guest' });
});

// invalid route
app.use((req, res) => {
    res.render('index', { title: 'HOME' });
})


