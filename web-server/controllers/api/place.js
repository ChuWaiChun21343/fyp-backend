const { query } = require('../../src/connect');

const stringHelper = require('../../src/helper/string-helper');

const Api = require('../../src/api');



exports.getDistrict = async (req, res) => {
    const lang = req.params.lang;
    if (lang == '0') {
        const sql = "SELECT id,region_id,district_eng as name FROM district";
        const values = [0, 25];
        let districts = await query(sql, values);
        return Api.success(res, districts);
    } else if (lang == '1') {
        const sql = "SELECT id,region_id,district_chi as name FROM district";
        const values = [0, 25];
        let districts = await query(sql, values);
        return Api.success(res, districts);
    }

    return Api.fail(res,[]);


}
