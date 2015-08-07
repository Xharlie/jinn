/**
 * Created by charlie on 4/29/15.
 * for url of:    /controllers+
 */

var express = require('express');
var router = express.Router();
var mysql = require('mysql');
var pool = require('../bin/database.js');
var mysqlPool = pool.mysqlPool;
var fs = require('fs');
var msg = require('../msg/pianyunApi.js');

/* GET home page. */

 function mysqlPoolValue(sql,callback){
     mysqlPool.getConnection(function(err, connection) {
         // Use the connection
         connection.query( sql, function(err, rows) {
             // And done with the connection.
             if (err) throw err;
             else{
                 connection.release();
                 callback(rows);
             }
         });
     });
 }

function mysqlPoolSubmit(req,callback){
    var lastInsertId =null;
    mysqlPool.getConnection(function(err, connection) {
        // Use the connection transactionMode
        connection.beginTransaction(function(err) {
            if (err) { throw err; }else{
                if (err) connection.rollback(function() {
                    throw err;
                });
                connection.query( 'INSERT INTO Transaction_Info SET ?', req.body.tran, function(err, rows) {
                    lastInsertId = rows.insertId;
                    req.body.allCMB.forEach(function (arr) {
                        arr.unshift(rows.insertId);
                    });
                    connection.query( "INSERT INTO OrderInfo (`TRN_ID`,`CMB_ID`,`AMNT`,`ORDR_TSTMP`,`RMRK`," +
                        "`RCVR_NM`,`RCVR_PHN`,`RCVR_ADDRSS`,`HTL_ID`,`RM_ID`,`TKT_ID`) VALUES ?",
                        [req.body.allCMB], function(err, rows) {
                        if (err){
                            connection.rollback(function() {
                                throw err;
                            });
                        }else{
                            connection.commit(function(err) {
                                if(err){
                                    connection.rollback(function() {
                                        throw err;
                                    });
                                }else{
                                    // get all inserted rows!
                                    var returnee = null;
                                    mysqlPoolValue('SELECT * FROM OrderInfo where TRN_ID =' + lastInsertId +' ;',
                                        function(rows) {
                                            returnee = rows;
                                            connection.release();
                                            callback(returnee);
                                    });
                                }
                            });
                        }
                    });
                });
            }
        });
    });
}


router
    .get('/ServiceType/getAllCombos/:HTL_ID', function(req, res, next) {
        mysqlPoolValue('select * from Hotel_Combo_Mapping map '
                        + 'inner join Combo_Info com on map.HTL_ID = '
                        + req.params.HTL_ID.toString() + ' and map.CMB_ID=com.CMB_ID '
                        + 'inner join Service_Type_Info ser on com.SRVC_TP_ID = ser.SRVC_TP_ID;'
            ,function(rows) {
                res.send(rows);
            }
        );
    })
    .post('/UserOrder/getAllPayMethods', function(req, res, next) {
        mysqlPoolValue('select * from PayMethod pay '
            + 'left outer join Hotel_PayMethod_Mapping map on map.HTL_ID = '
            + req.body.HTL_ID.toString() + ' and map.PAY_MTHD_ID = pay.PAY_MTHD_ID;'
            ,function(rows) {
                res.send(rows);
            }
        );
    })
    .get('/UserOrder/getProvinceNcity', function(req, res, next) {
        fs.readFile('public/src/provinceNcity.json', function(err, buf) {
            res.send(buf.toString());
        });
    })
    .get('/comboInfo/getMerchantInfoByCmb/:CMB_ID', function(req, res, next) {
        mysqlPoolValue('select * from Merchant_Combo_Mapping map '
            + 'inner join Merchant_Info Mer on map.CMB_ID = '
            + req.params.CMB_ID.toString() + ' and map.MRCHNT_ID = Mer.MRCHNT_ID'
            ,function(rows) {
                res.send(rows);
            }
        );
    })
    .get('/comboInfo/getTagsOfCmb/:TagString', function(req, res, next) {
        mysqlPoolValue('select * from Tags '
            + 'where TAG_ID in '+ req.params.TagString.toString()+' ;'
            ,function(rows) {
                res.send(rows);
            }
        );
    })
    .get('/comboInfo/getComboByID/:CMB_ID', function(req, res, next) {
        mysqlPoolValue('select * from Combo_Info com '
            + 'inner join  Hotel_Combo_Mapping map on com.CMB_ID = '
            + req.params.CMB_ID.toString() + ' and map.CMB_ID=com.CMB_ID '
            + 'inner join Service_Type_Info ser on com.SRVC_TP_ID = ser.SRVC_TP_ID;'
            ,function(rows) {
                res.send(rows);
            }
        );
    })
    .get('/hotel/getHotelInfo/:HTL_ID', function(req, res, next) {
        mysqlPoolValue('select * from Hotel_Info '
            + 'where HTL_ID = ' + req.params.HTL_ID.toString() +' ;'
            ,function(rows) {
                res.send(rows);
            }
        );
    })
    .post('/UserOrder/checkOTCart', function(req, res, next) {
        mysqlPoolSubmit(req,function(info) {
                console.log(JSON.stringify(info));
                //msg.yunpianMsg("恭喜,购买请求已发送,您的订单号是"+info.TRN_ID.toString()
                //    +"希望您能继续关注" + "http://182.92.189.254:3000"+"    更多优品,更多惊喜:)"
                //    ,info.CUS_PHN);
                res.send(info);
            }
        );
    });
module.exports = router;

//
//恭喜,购买请求已发送,您的订单号是#TRN_ID#
//希望您能继续关注#url#,更多优品,更多惊喜:)