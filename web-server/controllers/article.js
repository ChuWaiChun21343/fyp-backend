const { query } = require('../src/connect');

const stringHelper = require('../src/helper/string-helper');
var currentUserPage = 1;

var files = [];
var filesName = [];

let new_article = { title: '', content: '', status: 0 };
let checked_tags = [];
let statusTypeChecks = [true, true, true];
let sortType = '0';
let orderType = 'ASC';
let statusTypesWhereSQL = "";
let orderSQL = "";

exports.getArticle = async (req, res, next) => {
  var changePage = req.body.changePage;
  var submittedValues = req.body.article;
  // console.log(submittedValues);
  if (changePage != null) {
    if (changePage.arrow == null) {
      var buttonValue = parseInt(changePage.button);
      currentUserPage = buttonValue;
    } else {
      var arrowValue = parseInt(changePage.arrow);
      currentUserPage = currentUserPage + arrowValue;
    }
  } else if (submittedValues != null) {
    currentUserPage = 1;
    statusTypeChecks = [false, false, false];
    let statusTypes = typeof (submittedValues['statusTypes']) == "string" ? submittedValues['statusTypes'].split() : submittedValues['statusTypes'];
    sortType = submittedValues['sortingType'];
    orderType = submittedValues['orderBy'];
    if (submittedValues['statusTypes'] != null) {
      statusTypesWhereSQL = "WHERE article.status IN (";
      let sqlTypes = "";
      for (const type in statusTypes) {
        sqlTypes += statusTypes[type] + ",";
        statusTypeChecks[statusTypes[type]] = true;
      }
      sqlTypes = sqlTypes.slice(0, -1);
      statusTypesWhereSQL += sqlTypes + ") ";
    }
    if (submittedValues['sortingType'] != '0') {
      switch (submittedValues['sortingType']) {
        case '1':
          orderSQL = "ORDER BY name " + submittedValues['orderBy'];
          break;
        case '2':
          orderSQL = "ORDER BY create_date " + submittedValues['orderBy'];
          break;
      }

    }

  }
  const serachRange = 25;
  const currentPageNumber = (currentUserPage - 1) * serachRange;
  const sql = `SELECT * FROM article ${statusTypesWhereSQL} ${orderSQL} limit ?,?`;
  const values = [currentPageNumber, serachRange];
  let articles = await query(sql, values);
  const countSQL = `SELECT COUNT(*) as totalNumber FROM article  ${statusTypesWhereSQL} ${orderSQL}`;
  let totalNumber = await query(countSQL, []);
  totalNumber = totalNumber[0]['totalNumber'];
  articles.forEach(element => {
    const timeAndDate = stringHelper.getTimeAndDateFromTimestamp(element['create_date']);
    const time = timeAndDate.time;
    const date = timeAndDate.date;
    element['create_date'] = date;
    element['create_time'] = time;
  });

  const maxPage = totalNumber < 25 ? totalNumber : currentUserPage * 25;
  const minPage = totalNumber == 0 ? 0 : ((currentUserPage - 1) * 25) + 1;


  res.render('article/article', {
    path: '/article',
    pageTitle: 'Article',
    articles: articles,
    totalNumber: totalNumber,
    minPage: minPage,
    maxPage: maxPage,
    currentUserPage: currentUserPage,
    statusTypeChecks: statusTypeChecks,
    sortType: sortType,
    orderType: orderType,
  });
}

exports.getAddArticle = async (_, res, __) => {
  const tagSQL = "SELECT * FROM article_tag";
  let tags = await query(tagSQL, []);
  checked_tags = tags.map(v => false);
  res.render('article/article_add', {
    path: '/article_add',
    pageTitle: 'Add Article',
    files: files,
    filesName: filesName,
    article: new_article,
    tags: tags,
    checked_tags: checked_tags,
  });
}

exports.addNewArticle = async (req, res, _) => {
  // console.log(req.body.article);
  // console.log(req.files);
  const tagSQL = "SELECT * FROM article_tag";
  let tags = await query(tagSQL, []);
  const requestArticle = req.body.article;
  const files = req.files;
  new_article['title'] = requestArticle.title;
  new_article['content'] = requestArticle.content;
  let currentTagsIndex = 0;
  if (requestArticle.tags != null) {
    for (let i = 0; i < checked_tags.length; i++) {
      if (requestArticle.tags[currentTagsIndex] == i) {
        checked_tags[i] = true;
        currentTagsIndex++;
      } else {
        checked_tags[i] = false;
      }
    }
  }
  const insertArticleSQL = "INSERT INTO article (title,content,created_by,status) VALUES (?,?,?,?) ";
  const insertArticlesValues = [requestArticle.title, requestArticle.content, 1, 1];
  let result = await query(insertArticleSQL, insertArticlesValues);
  // console.log(result.insertId);

  const insertedArticleID = result.insertId;

  for (let i = 0; i < requestArticle.tags.length; i++) {
    const insertArticleTagsSQL = "INSERT INTO article_saving_tag (article_id,tag_id,status) VALUES(?,?,?)";
    const insertArticleTagsValues = [insertedArticleID, requestArticle.tags[i], 1];
    await query(insertArticleTagsSQL, insertArticleTagsValues);
  }

  for (let i = 0; i < files.length; i++) {
    const insertArticleImageSQL = "INSERT INTO article_image (url,name,article_id,status) VALUES(?,?,?,?)";
    const insertArticleImageValues = [files[i].filename, files[i].originalname, insertedArticleID, 1];
    await query(insertArticleImageSQL, insertArticleImageValues);
  }


  res.redirect('../article')



  // res.render('article/article_add', {
  //   path: '/article_add',
  //   pageTitle: 'Add Article',
  //   files: files,
  //   filesName: filesName,
  //   article: new_article,
  //   tags: tags,
  //   checked_tags: checked_tags,
  //   //   admins: admins,
  // });
  // const content = req.body.content;
  // console.log(content);
  // const sql = "INSERT INTO article (content)  VALUES (?)";
  // const values = [content];
  // await query(sql, values);
  // res.render('article/article', {
  //   path: '/article',
  //   pageTitle: 'Admin',
  //   //   admins: admins,
  // });
}

exports.uploadImage = async (req, res, next) => {
  files = req.files
  filesName = files.map(file => ({ fileName: file.originalname }));
  res.redirect('./article_add');
};