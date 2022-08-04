const { query } = require('../src/connect');
const stringHelper = require('../src/helper/string-helper');

let userTypeChecks = [true, true, true];
let statusTypeChecks = [true, true, true];
let sortType = '3';
let orderType = 'DESC';

var currentUserPage = 1;

exports.getUser = async (req, res, next) => {
  var changePage = req.body.changePage;
  var submittedValues = req.body.user;
  let statusTypesWhereSQL = "";
  let userTypeWhereSQL = "";
  let orderSQL = "";
  if (changePage != null && submittedValues == null) {
    if (changePage.arrow == null) {
      var buttonValue = parseInt(changePage.button);
      currentUserPage = buttonValue;
    } else {
      var arrowValue = parseInt(changePage.arrow);
      currentUserPage = currentUserPage + arrowValue;
    }
    orderSQL = "ORDER BY create_date " + orderType;
  } else if (submittedValues != null) {
    currentUserPage = 1;
    userTypeChecks = [false, false, false];
    statusTypeChecks = [false, false, false];
    let statusTypes = typeof (submittedValues['statusTypes']) == "string" ? submittedValues['statusTypes'].split() : submittedValues['statusTypes'];
    let userTypes = typeof (submittedValues['userTypes']) == "string" ? submittedValues['userTypes'].split() : submittedValues['userTypes'];
    sortType = submittedValues['sortingType'];
    orderType = submittedValues['orderBy'];
    if (submittedValues['statusTypes'] != null) {
      statusTypesWhereSQL = "WHERE user.status IN (";
      let sqlTypes = "";
      for (const type in statusTypes) {
        sqlTypes += statusTypes[type] + ",";
        statusTypeChecks[statusTypes[type]] = true;
      }
      sqlTypes = sqlTypes.slice(0, -1);
      statusTypesWhereSQL += sqlTypes + ") ";
    }
    if (submittedValues['userTypes'] != null) {
      if (submittedValues['statusTypes'] == null) {
        userTypeWhereSQL = "WHERE user.login_type IN (";
      } else {
        userTypeWhereSQL = "AND user.login_type IN (";
      }
      let sqlUserType = "";
      for (const type in userTypes) {
        sqlUserType += userTypes[type] + ",";
        userTypeChecks[parseInt(userTypes[type]) - 1] = true;
      }
      console.log(userTypeChecks);
      sqlUserType = sqlUserType.slice(0, -1);
      userTypeWhereSQL += sqlUserType + ") ";
    }
    if (submittedValues['sortingType'] != '0') {
      switch (submittedValues['sortingType']) {
        case '1':
          orderSQL = "ORDER BY user.name " + submittedValues['orderBy'];
          break;
        case '2':
          orderSQL = "ORDER BY user.login_type " + submittedValues['orderBy'];
          break;
        case '3':
          orderSQL = "ORDER BY user.create_date " + submittedValues['orderBy'];
          break;
      }
    }
  } else {
    orderSQL = "ORDER BY create_date " + orderType;
  }
  const serachRange = 25;
  const currentPageNumber = (currentUserPage - 1) * serachRange;
  const sql = `SELECT * FROM user ${statusTypesWhereSQL} ${userTypeWhereSQL} ${orderSQL}  limit ?,?`;
  const values = [currentPageNumber, serachRange];
  let users = await query(sql, values);
  const countSQL = `SELECT COUNT(*) as totalNumber FROM user ${statusTypesWhereSQL} ${userTypeWhereSQL}`;
  let totalNumber = await query(countSQL, values);
  totalNumber = totalNumber[0]['totalNumber'];
  const maxPage = totalNumber < currentUserPage * 25 ? totalNumber : currentUserPage * 25;
  const minPage = totalNumber == 0 ? 0 : ((currentUserPage - 1) * 25) + 1;
  users.forEach(element => {
    const timeAndDate = stringHelper.getTimeAndDateFromTimestamp(element['create_date']);
    const time = timeAndDate.time;
    const date = timeAndDate.date;
    element['create_date'] = date;
    element['create_time'] = time;
    if (element['phone'] == "" || element['phone'] == null) {
      element['phone'] = "N/A"
    }
  });
  res.render('user/user', {
    path: '/user',
    pageTitle: 'User',
    users: users,
    totalNumber: totalNumber,
    minPage: minPage,
    maxPage: maxPage,
    currentUserPage: currentUserPage,
    userTypeChecks: userTypeChecks,
    statusTypeChecks: statusTypeChecks,
    sortType: sortType,
    orderType: orderType,
  });
}


exports.getUserEdit = async (req, res, next) => {
  const userID = req.query.id;
  const sql = "SELECT * FROM user WHERE id = ?";
  const values = [userID];
  user = await query(sql, values);
  console.log(user);
  res.render('user/user_edit', {
    path: '/user',
    pageTitle: 'User Edit',
    user: user[0],
    session: req.session
  });
}


exports.updateUserInfo = async (req, res, next) => {
  const userID = req.body.user.id;
  const name = req.body.user.name;
  const email = req.body.user.email;
  const status = req.body.user.status;

  console.log('userID', userID);
  console.log('status ', status);

  const updaeSQL = 'UPDATE user SET name = ?, email = ?, status = ? WHERE id = ?';
  const updateSQLValues = [name, email, status, userID];
  await query(updaeSQL, updateSQLValues);

  const minPage = (currentUserPage - 1) * 25;
  const maxPage = currentUserPage * 25;
  const sql = "SELECT * FROM user limit ?,?";
  const values = [minPage, 25];
  let users = await query(sql, values);
  const countSQL = "SELECT COUNT(*) as totalNumber FROM user";
  let totalNumber = await query(countSQL, values);
  totalNumber = totalNumber[0]['totalNumber'];
  users.forEach(element => {
    const timeAndDate = stringHelper.getTimeAndDateFromTimestamp(element['create_date']);
    const time = timeAndDate.time;
    const date = timeAndDate.date;
    element['create_date'] = date;
    element['create_time'] = time;
  });

  res.redirect('/user');
}

