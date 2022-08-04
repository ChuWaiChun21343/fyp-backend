exports.success = (res, result, succesType = null) => {
    res.setHeader('Content-Type', 'application/json');
    if (succesType != null) {
        res.status(200);
        return res.json({ status: 1, result: result, succesType: succesType });
    } else {
        res.status(200);
        return res.json({ status: 1, result: result });
    }
}

exports.fail = (res, result, failType = null) => {
    res.setHeader('Content-Type', 'application/json');
    if (failType != null) {
        res.status(400);
        return res.json({ status: 0, result: result, failType: failType });
    } else {
        res.status(400);
        return res.json({ status: 0, result: result });
    }
}