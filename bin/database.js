/**
 * Created by charlie on 4/28/15.
 */
var mysql = require('mysql');
var mysqlPool  = mysql.createPool({
    connectionLimit : 10,
    host            : '182.92.189.254',
    port            : '3306',
    user            : 'coder',
    password        : '^coder$',
    database        : 'GuestRoom',
    charset         : 'utf8_general_ci',
    timezone        : 'local'
});

exports.mysqlPool = mysqlPool;
