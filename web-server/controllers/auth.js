const bcrypt = require('bcryptjs');
const session = require('express-session');

const homeController = require('../controllers/home');
// const User = require('../models/user');

exports.getLogin = (req, res, next) => {
  // console.log(req.session.login);
  // if(req.session.login == '1'){
  //   res.redirect('/home');
  // }
  console.log(req.cookies['userID']);
  res.render('auth/login', {
    path: '/login',
    pageTitle: 'Login',
    errorMessage: "",
    username: "",
    password: "",
    //test = true,
  });
};

exports.getSignup = (req, res, next) => {
  let message = req.flash('error');
  if (message.length > 0) {
    message = message[0];
  } else {
    message = null;
  }
  res.render('auth/signup', {
    path: '/signup',
    pageTitle: 'Signup',
    errorMessage: message
  });
};

exports.postLogin = (req, res, next) => {
  const username = req.body.user.username;
  const password = req.body.user.password;
  const login = require('../src/utils/login');
  // let showUserNameError = ""

  login(username, password, (success) => {
    //console.log(success.status);
    const result = success.result;
    const userID = success.userID;
    if (result == 1) {
      // var cookie = req.cookies.cookieName;
      // // homeController.getHome;
      
      req.session.login = 1;
      req.session.userID = userID;
      req.session.type = success.type;
      console.log(req.session);
      res.cookie('userID', userID, { maxAge: 1000 * 60 * 60 * 24 });
      res.cookie('type',  req.session.type, { maxAge: 1000 * 60 * 60 * 24 });
      //console.log(req.cookies);
      res.redirect('/home');
    } else {
      let errorMessage = "";
      switch (result) {
        case -1:
          errorMessage = "Please make sure your username and password is correct";
          break;
        case 0:
          errorMessage = "Your account is pending for review, Please contact your supervisor if you have any question";
          break;
        case 2:
          errorMessage = "Your account has been suspended, Please contact your supervisor if you have any question";
          break;
      }
      res.render('auth/login', {
        path: '/login',
        pageTitle: 'Login',
        errorMessage: errorMessage,
        username: username,
        password: password,
      });
    }
  })
};

// exports.postSignup = (req, res, next) => {
//   const email = req.body.email;
//   const password = req.body.password;
//   const confirmPassword = req.body.confirmPassword;
//   User.findOne({ email: email })
//     .then(userDoc => {
//       if (userDoc) {
//         req.flash('error', 'E-Mail exists already, please pick a different one.');
//         return res.redirect('/signup');
//       }
//       return bcrypt
//         .hash(password, 12)
//         .then(hashedPassword => {
//           const user = new User({
//             email: email,
//             password: hashedPassword,
//             cart: { items: [] }
//           });
//           return user.save();
//         })
//         .then(result => {
//           res.redirect('/login');
//         });
//     })
//     .catch(err => {
//       console.log(err);
//     });
// };

// exports.postLogout = (req, res, next) => {
//   req.session.destroy(err => {
//     console.log(err);
//     res.redirect('/');
//   });
// };
