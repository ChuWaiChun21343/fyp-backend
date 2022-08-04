const connection = require('../src/connect');
const { query } = require('../src/connect');
const { encrypt } = require('../src/helper/password-helper');
const url = require('url');
const stringHelper = require('../src/helper/string-helper');
const internal = require('stream');
const e = require('express');

let adminTypeChecks = [true, true];
let statusTypeChecks = [true, true, true];
let sortType = '0';
let orderType = 'ASC';

function modifyAdmin(admins) {
  var status = "";
  var type = "";
  admins = admins.map(item => {
    switch (item['type']) {
      case 1:
        type = 'Super Admin';
        break;
      case 2:
        type = 'Admin';
        break;
    }
    delete item['type'];

    return {
      id: item.id,
      username: item.username,
      password: item.password,
      email: item.email,
      status: item.status,
      type: type,
      create_date: item.create_date,
      cookies: req.cookie

    }
  });
  // console.log(admins);
  return admins;
}

exports.getHome = async (req, res, next) => {
  const sql = "SELECT * FROM admin";
  const values = [];
  let admins = await query(sql, values)
  admins.forEach(admin => {
    const timeAndDate = stringHelper.getTimeAndDateFromTimestamp(admin['create_date']);
    const time = timeAndDate.time;
    const date = timeAndDate.date;
    admin['create_date'] = date;
    admin['create_time'] = time;
    admin['type'] = admin['type'] == 1 ? 'Super Admin' : 'Admin';
  });
  res.render('home/home', {
    path: '/home',
    pageTitle: 'Admin',
    admins: admins,
    adminTypeChecks: adminTypeChecks,
    statusTypeChecks: statusTypeChecks,
    sortType: sortType,
    orderType: orderType,
    cookies: req.cookies
  });
}

exports.addAdminAdd = async (req, res) => {
  const userNameError = "";
  const emailError = "";
  let new_admin = { name: '', password: '', email: '', type: 1, status: 1 };
  res.render('home/admin_add', {
    path: '/home',
    pageTitle: 'Add Admin',
    admin: new_admin,
    cookies: req.cookies,
    userNameError: userNameError,
    emailError: emailError
  });
}

exports.addNewAdmin = async (req, res) => {
  const username = req.body.user.username;
  const password = req.body.user.password;
  const email = req.body.user.email;
  const status = req.body.user.status;
  const type = req.body.user.type;

  const checkUserNameSQL = "SELECT id FROM admin WHERE username = ?";
  const userNameResult = await query(checkUserNameSQL, [username]);

  const checEmailSQL = "SELECT id FROM admin WHERE email = ?";
  const emailResult = await query(checEmailSQL, [email]);

  if (userNameResult.length > 0) {
    const userNameError = "There is an existing user name";
    const emailError = "";
    await res.render('home/admin_add', {
      path: '/home',
      pageTitle: 'Add Admin',
      admin: req.body.user,
      cookies: req.cookies,
      userNameError: userNameError,
      emailError: emailError
    });
  }
  else if (emailResult.length > 0) {
    const userNameError = "";
    const emailError = "There is an existing email";
    res.render('home/admin_add', {
      path: '/home',
      pageTitle: 'Edit Admin',
      admin: req.body.user,
      cookies: req.cookies,
      userNameError: userNameError,
      emailError: emailError
    });
  } else {
    var encryptPassword = await encrypt(password);
    const sql = "INSERT INTO admin (username,password,email,status,type) VALUES (?,?,?,?,?)";
    const values = [username, encryptPassword, email, status, type];
    await query(sql, values);
  }

  res.redirect('../home');
}


exports.getAdminEdit = async (req, res, next) => {
  const userNameError = "";
  const emailError = "";
  const adminID = req.query.id;
  // console.log(adminID);
  const sql = "SELECT * FROM admin WHERE id = ?";
  const values = [adminID];
  admin = await query(sql, values);
  // console.log(admin);
  res.render('home/admin_edit', {
    path: '/home',
    pageTitle: 'Edit Admin',
    admin: admin[0],
    cookies: req.cookies,
    userNameError: userNameError,
    emailError: emailError
  });
}

exports.fitlerAdmin = async (req, res, next) => {
  const submittedValues = req.body.admin;
  adminTypeChecks = [false, false];
  statusTypeChecks = [false, false, false];
  let statusTypes = typeof (submittedValues['statusTypes']) == "string" ? submittedValues['statusTypes'].split() : submittedValues['statusTypes'];
  let adminTypes = typeof (submittedValues['adminTypes']) == "string" ? submittedValues['adminTypes'].split() : submittedValues['adminTypes'];
  let statusTypesWhereSQL = "";
  let adminTypeWhereSQL = "";
  let orderSQL = "";
  sortType = submittedValues['sortingType'];
  orderType = submittedValues['orderBy'];
  if (submittedValues['statusTypes'] != null) {
    statusTypesWhereSQL = "WHERE admin.status IN (";
    let sqlTypes = "";
    for (const type in statusTypes) {
      sqlTypes += statusTypes[type] + ",";
      statusTypeChecks[statusTypes[type]] = true;
    }
    sqlTypes = sqlTypes.slice(0, -1);
    statusTypesWhereSQL += sqlTypes + ") ";
  }
  if (submittedValues['adminTypes'] != null) {
    if (submittedValues['statusTypes'] == null) {
      adminTypeWhereSQL = "WHERE admin.type IN (";
    } else {
      adminTypeWhereSQL = "AND admin.type IN (";
    }
    let sqladminType = "";
    for (const type in adminTypes) {
      sqladminType += adminTypes[type] + ",";
      adminTypeChecks[parseInt(adminTypes[type]) - 1] = true;
    }
    sqladminType = sqladminType.slice(0, -1);
    adminTypeWhereSQL += sqladminType + ") ";
  }
  if (submittedValues['sortingType'] != '0') {
    switch (submittedValues['sortingType']) {
      case '1':
        orderSQL = "ORDER BY username " + submittedValues['orderBy'];
        break;
      case '2':
        orderSQL = "ORDER BY type " + submittedValues['orderBy'];
        break;
      case '3':
        orderSQL = "ORDER BY create_date " + submittedValues['orderBy'];
        break;
    }
  }
  const sql = `SELECT * FROM admin ${statusTypesWhereSQL} ${adminTypeWhereSQL} ${orderSQL}`;
  // console.log(sql);
  const values = [];
  let admins = await query(sql, values)
  admins.forEach(admin => {
    const timeAndDate = stringHelper.getTimeAndDateFromTimestamp(admin['create_date']);
    const time = timeAndDate.time;
    const date = timeAndDate.date;
    admin['create_date'] = date;
    admin['create_time'] = time;
    admin['type'] = admin['type'] == 1 ? 'Super Admin' : 'Admin';
  });
  res.render('home/home', {
    path: '/home',
    pageTitle: 'Admin',
    admins: admins,
    adminTypeChecks: adminTypeChecks,
    statusTypeChecks: statusTypeChecks,
    sortType: sortType,
    orderType: orderType,
    cookies: req.cookies
  });
}

exports.updateAdminInfo = async (req, res, next) => {
  const userID = req.body.user.id;
  const username = req.body.user.username;
  const password = req.body.user.password;
  const email = req.body.user.email;
  const status = req.body.user.status;
  const type = req.body.user.type;


  const checkUserNameSQL = "SELECT id FROM admin WHERE username = ?";
  const userNameResult = await query(checkUserNameSQL, [username]);

  const checEmailSQL = "SELECT id FROM admin WHERE email = ?";
  const emailResult = await query(checEmailSQL, [email]);

  if (userNameResult.length > 0 && userNameResult[0]['id'] != userID) {
    const userNameError = "There is an existing user name";
    const emailError = "";
    await res.render('home/admin_edit', {
      path: '/home',
      pageTitle: 'Edit Admin',
      admin: req.body.user,
      cookies: req.cookies,
      userNameError: userNameError,
      emailError: emailError
    });
  }
  else if (emailResult.length > 0 && emailResult[0]['id'] != userID) {
    const userNameError = "";
    const emailError = "There is an existing email";
    res.render('home/admin_edit', {
      path: '/home',
      pageTitle: 'Edit Admin',
      admin: req.body.user,
      cookies: req.cookies,
      userNameError: userNameError,
      emailError: emailError
    });
  } else {
    var encryptPassword = await encrypt(password);
    const sql = "UPDATE admin SET username = ?, password = ?,email = ? ,status = ?, type = ? WHERE id = ?";
    const values = [username, encryptPassword, email, status, type, userID];
    await query(sql, values);
    res.redirect('../home');
  }



}