// const {spawn} = require("child_process");

// const pythonPath = __dirname + '/test.py';
// const ls = spawn('python', [pythonPath, 'abc']);
// ls.stdout.on('data', function (data) {
//     jsonValue = JSON.parse(data.toString());
//     console.log(jsonValue['id'][1]);
//     //console.log(jsonValue);
//     //console.log(typeof(data))
// });


// const { query } = require('../src/connect');

// async function addNewPost() {
//     for (var i = 0; i < 200; i++) {
//         const randomType = Math.floor(Math.random() * 2) + 1;
//         const postType = i+1;
//         const sql = "INSERT INTO post_settlement (post_id,settlement_type_id) Values (?,?)";
//         const values = [postType,randomType];
//         await query(sql,values);
//     }
//     console.log('done');
// }

// addNewPost();

// const { query } = require('../src/connect');

// async function addDistrict() {

//     const sql = "SELECT * FROM post_settlement";
//     const settlements = await query(sql, []);
//     for (var i = 0; i < settlements.length; i++) {
//         const postInsertNumber = Math.floor(Math.random() * 3) + 1;
//         if (settlements[i]['settlement_type_id'] == 1) {
//             for (var y = 0; y < postInsertNumber; y++) {
//                 const randomType = Math.floor(Math.random() * 18) + 1;
//                 const settlementSQL = "INSERT INTO post_settlement_place (district_id,settlement_id,status) Values (?,?,?)";
//                 const values = [randomType,settlements[i]['id'],1];
//                 await query(settlementSQL,values);
//             }
//         }
//     }
//     console.log('done');
// }

// addDistrict();

// const { query } = require('../src/connect');
// var fs = require('fs');
// const { url } = require('inspector');

// getPostImage = async () => {
//     const sql = "Select DISTINCT(url) from post_image WHERE post_id between 1 and 201";
//     const images = await query(sql, []);
//     let imageSet = new Set();
//     for (var i = 0; i < images.length; i++) {
//         imageSet.add(images[i]['url']);
//     }
//     console.log(imageSet);
//     const dir = await fs.promises.opendir("/Users/pikachu/NodeJs/fyp/web-server/file/post-image");
//     let number = 0;
//     for await (const image of imageSet) {
//         console.log(image);
//         fs.copyFile('/Users/pikachu/fyp/image/images/' + image, '/Users/pikachu/NodeJs/fyp/web-server/file/post-image/' +image, (err) => {
//             if (err) 
//                 throw err;
//             console.log('source.txt was copied to destination.txt');
//         });
//         //fs.unlinkSync("/Users/pikachu/NodeJs/fyp/web-server/file/post-image/" + dirent.name);


//     }


// };

// getPostImage()
