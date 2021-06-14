const express = require('express');

//express app
const app = express();

//register view engine
app.set('view engine', 'ejs');

//listen for requests
app.listen(3000, () => {
    console.log('listening at 3000');
})

app.get('/', (req, res) => {
    //res.send('<p>yoyo</p>');
    res.render('index', { title: 'HOME' });
})

app.get('/about', (req, res) => {
    //res.send('<p>yoyo</p>');
    res.render('about', { title: 'ABOUT' });
})

app.use((req, res) => {
    res.status(404).render('404', { title: 'ERROR' });
})
