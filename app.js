const { urlencoded } = require('express');
const express = require('express');
const morgan = require('morgan');
//express app
const app = express();

//register view engine
app.set('view engine', 'ejs');

//listen for requests
app.listen(3000, () => {
    console.log('listening at 3000');
})

//serve static files
app.use(express.static('public'));

//encode incoming requests
app.use(urlencoded({ extended = true }));

//console ouput request detail using morgan 
app.use(morgan('dev'));

app.get('/', (req, res) => {
    res.render('index', { title: 'HOME' });
})

app.get('/about', (req, res) => {
    res.render('about', { title: 'ABOUT' });
})

app.use((req, res) => {
    res.status(404).render('404', { title: 'ERROR' });
})
