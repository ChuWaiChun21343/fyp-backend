function getTimeAndDateFromTimestamp(timestamp) {
    unix_timestamp = timestamp.getTime();
    const date = new Date(unix_timestamp);
    formattedTime = getTimeFromTimestamp(date);
    formattedDate = getDateFromTimestamp(date);
    return { time: formattedTime, date: formattedDate };


}

function getTimeFromTimestamp(date) {
    var hours = date.getHours();
    var minutes = "0" + date.getMinutes();
    var clock = 'AM'
    if (hours >= 12) {
        clock = 'PM';
        hours = hours - 12;
    }
    var formattedTime = hours + ':' + minutes.slice(-2) + ' ' + clock;
    return formattedTime;
}


function getDateFromTimestamp(date) {
    const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    const year = date.getFullYear();
    const month = MONTHS[date.getMonth()];
    const cDate = date.getDate();
    const formattedDate = month + ' ' + cDate + ', ' + year;
    return formattedDate;
}

function getTimeAndDateFromTimestampInApp(timestamp) {
    unix_timestamp = timestamp.getTime();
    const date = new Date(unix_timestamp);
    formattedTime = getTimeInApp(date);
    formattedDate = getDateInApp(date);
    return { time: formattedTime, date: formattedDate };
}

function getTimeAndDateFromUnixTimestampInApp(unix_timestamp) {
    const date = new Date(unix_timestamp);
    formattedTime = getTimeInApp(date);
    formattedDate = getDateInApp(date);
    return { time: formattedTime, date: formattedDate };
}



function getDisplayTimeInApp(timestamp) {
    unix_timestamp = timestamp.getTime();
    const date = new Date(unix_timestamp);
    const currentDate = new Date();
    const differentInTime = currentDate.getTime() - unix_timestamp;
    const differentInDate = Math.floor(differentInTime / (1000 * 3600 * 24));
    const differentInHour = Math.floor(differentInTime / (1000 * 3600));
    const differentInMin = Math.floor(differentInTime / (1000 * 60));
    const differentInSec = Math.floor(differentInTime / (1000));

    if (differentInSec < 60) {
        if (differentInSec == 1) {
            return differentInSec + " second ago";
        }
        return differentInSec + " seconds ago";
    }
    else if (differentInMin < 60) {
        if (differentInMin == 1) {
            return differentInMin + " minute ago";
        }
        return differentInMin + " minutes ago";
    }
    else if (differentInHour < 24 || differentInMin == 60) {
        if (differentInHour == 1 || differentInMin == 60) {
            return differentInHour + " hour ago";
        }
        return differentInHour + " hours ago";
    }
    else if (differentInDate < 7) {
        if (differentInDate == 1) {
            return differentInDate + " day ago";
        }
        return differentInDate + " days ago";
    } else {
        var year = date.getFullYear();
        var month = date.getMonth() + 1;
        var cDate = date.getDate();
        if (month < 10) {
            month = "0" + month
        }
        if (cDate < 10) {
            cDate = "0" + cDate;
        }
        return cDate + "." + month + "." + year;
    }
}

function getTimeInApp(date) {
    var hours = date.getHours();
    var minutes = date.getMinutes();
    var second = date.getSeconds();
    if (hours < 10) {
        hours = "0" + hours;
    }
    if (minutes < 10) {
        minutes = "0" + minutes;
    }
    if (second < 10) {
        second = "0" + second;
    }
    return hours + ":" + minutes + ":" + second;
}


function getDateInApp(date) {
    var year = date.getFullYear();
    var month = date.getMonth() + 1;
    var cDate = date.getDate();
    if (month < 10) {
        month = "0" + month
    }
    if (cDate < 10) {
        cDate = "0" + cDate;
    }
    return year + '-' + month + '-' + cDate
}

function getDateBefore(n) {
    var nDay = new Date();
    nDay.setDate(nDay.getDate() - n);
    formattedDate = getDateInApp(nDay)
    return formattedDate;
}

module.exports = {
    getTimeAndDateFromTimestamp: getTimeAndDateFromTimestamp,
    getTimeAndDateFromTimestampInApp: getTimeAndDateFromTimestampInApp,
    getTimeAndDateFromUnixTimestampInApp: getTimeAndDateFromUnixTimestampInApp,
    getDisplayTimeInApp: getDisplayTimeInApp,
    getDateBefore : getDateBefore
};