// Initialize express;
require('dotenv').config({path: './.env'})
const express = require('express');
const app = express();
const bodyParser = require('body-parser');

require('./app/Models/connection');


app.use(function (req, res, next)
{
    // console.log('-=-=q-e=q-e=qw-e=qw-e=qw-e=qw-ec=qw-ec=qw-ec=qw-ce=qw-ec=qw-ce=qw-ec=qw-ce=qw-')
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS, PUT, PATCH, DELETE');
    res.setHeader('Access-Control-Allow-Headers', '*');
    res.setHeader('Access-Control-Allow-Credentials', true);
    next();
});

app.use(bodyParser.urlencoded({ extended: true, limit: '5mb' }));
app.use(bodyParser.json());
app.use(bodyParser.raw());


app.use('/assets/images',express.static('assets/images'));
// Create routes;
app.use('/api',require('./routes/web'));

app.listen(3010, function () {
    console.log('running');
});

