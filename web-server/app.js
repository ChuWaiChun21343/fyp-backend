const path = require('path');
const express = require('express');
var session = require('express-session');
const cookieParser = require("cookie-parser");
const firebaseApp = require('firebase/app');
const firebaseAnalytics = require('firebase/analytics');
const firebaseConfig = require('./src/config.json').firebaseConfig;
const wss = require('./src/socket');
var cors = require('cors')

const publicDirectoryPath = path.join(__dirname, './public')
const fileDirectoryPath = path.join(__dirname, './file');
const viewsPath = path.join(__dirname, './templates/views')

const authRoutes = require('./routes/auth');
const homeRoutes = require('./routes/home');
const userRoutes = require('./routes/user');
const articleRoutes = require('./routes/article');
const postRoutes = require('./routes/post');
const notificationRoutes = require('./routes/notification');
const typeRoutes = require('./routes/type');
const tagRoutes = require('./routes/tag');

const articleAPIRoutes = require('./routes/api/article');
const userAPIRoutes = require('./routes/api/user');
const postAPIRoutes = require('./routes/api/post');
const placeAPIRoutes = require('./routes/api/place');
const messageAPIRoutes = require('./routes/api/meesage');
const notificationAPIRoutes = require('./routes/api/notification');

firebaseApp.initializeApp(firebaseConfig);

const app = express();

const oneDay = 1000 * 60 * 60 * 24;


app.set('view engine', 'ejs');
app.set('views', viewsPath)
app.set('trust proxy', 1) 

app.use(cookieParser());

app.use(session({
  secret: 'sessionKey2132131',
  resave : false,
  saveUninitialized : false,
}))

app.use(cors())
app.use(express.json());
app.use(express.urlencoded({
  extended: true
}));

app.use(express.static(publicDirectoryPath));
app.use('/file', express.static(fileDirectoryPath));



app.use('/', authRoutes);
app.use(homeRoutes);
app.use(userRoutes);
app.use(articleRoutes);
app.use(postRoutes);
app.use(notificationRoutes);
app.use(typeRoutes);
app.use(tagRoutes);

app.use(articleAPIRoutes);
app.use(userAPIRoutes);
app.use(postAPIRoutes);
app.use(placeAPIRoutes);
app.use(messageAPIRoutes);
app.use(notificationAPIRoutes);




// app.use(errorController.get404);

// app.use(authController.getLogin)

const PORT = 8080;
const HOST = '127.0.0.1';

app.listen(PORT, HOST);
