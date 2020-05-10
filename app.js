const express = require('express');
const awsServerlessExpressMiddleware = require('aws-serverless-express/middleware');
const routes = require('./api/routes');
const bodyParser = require('body-parser');
const app = new express();

app.use(awsServerlessExpressMiddleware.eventContext());
app.set('view engine', 'html');

app.use(bodyParser.json())
app.use(bodyParser.urlencoded({ extended: true }))

app.use('/api', routes);
app.use("/", express.static('./build', {index: false}));

app.get("/", (req,res) => {
    res.sendFile('index.html', { root:  './build'});
    // res.sendFile('index.html', { root:  './public'});
});


// Final catch-all route, if 404 then redirect to index.html (How React works)
app.use(function(req, res) {
    // res.send('404: Page not Found', 404);
    res.sendFile('index.html', { root:  './build'});
});

// Handle 500
app.use(function(error, req, res, next) {
    console.log(error)
    res.send('500: Internal Server Error, pls check logs', 500);
});
module.exports = app;