var createError = require('http-errors');
var express = require('express');
var path = require('path');
var cookieParser = require('cookie-parser');
var logger = require('morgan');

var adminRouter = require('./routes/admin');
// var usersRouter = require('./routes/users');

var hbs=require('express-handlebars')
var fileUpload=require('express-fileupload')  
var app = express();
var db=require('./Config/connection')
var session=require('express-session') 


app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'hbs');
app.engine('hbs', hbs.engine({
    extname: 'hbs',
    defaultLayout: 'layout',
    layoutsDir: __dirname + '/views/layout/',
    partialsDir: __dirname + '/views/partials/',
    
  //   helpers: {   
  //     eq: function (a, b) {  //
  //         return a === b;
  //     } ,
  //     isBookmarked: function(artId, bookmarks) {
  //       // Check if the article is in the user's bookmarks
  //       return bookmarks.some(bookmark => bookmark._id.toString() === artId.toString());
  //     }
  // },
    
  runtimeOptions: {
        allowProtoPropertiesByDefault: true,
        allowProtoMethodsByDefault: true
    }
}));

app.use(logger('dev'));
// app.use(express.json());
// app.use(express.urlencoded({ extended: false }));
app.use(express.json({ limit: '100mb' }));
app.use(express.urlencoded({ limit: '100mb', extended: true }));
app.use(cookieParser());
app.use(express.static(path.join(__dirname, 'public')));
//app.use(fileUpload());

app.use(fileUpload({
  limits: { fileSize: 100 * 1024 * 1024 }, // upload limit to 100MB
  abortOnLimit: true,
  responseOnLimit: 'File size limit has been reached.'
}));

app.use(session({
  secret: 'your-secret-key',            
  resave: false,                        
  saveUninitialized: false,             
  cookie: { secure: false }            
}));


db.connect((err) => {
  if (err) {
      console.error('Connection error:', err);
  } else {
      console.log('Database connected');
  }
});


//cache problem

// Disable caching on authenticated pages
app.use((req, res, next) => {
  res.set('Cache-Control', 'no-store');
  next();
});

app.use('/', adminRouter);
// app.use('/users', usersRouter);

// catch 404 and forward to error handler
app.use(function(req, res, next) {
  next(createError(404));
});

// error handler
app.use(function(err, req, res, next) {
  // set locals, only providing error in development
  res.locals.message = err.message;
  res.locals.error = req.app.get('env') === 'development' ? err : {};

  // render the error page
  res.status(err.status || 500);
  res.render('error');
});





module.exports = app;
