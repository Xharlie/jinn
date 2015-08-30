/**
 * Created by charlie on 5/7/15.
 */

Da.controller('cartCTLR', function($scope, $http, $location, comboInfoFactory, userOrderFactory,orderDetailFactory,$timeout,$route) {

    /********************************************     validation     ***************************************************/
    $scope.hasError = function(btnPass){
        if(eval("$scope."+btnPass)==null) eval("$scope."+btnPass+"=0");
        eval("$scope."+btnPass+"++");
    }
    $scope.noError = function(btnPass){
        eval("$scope."+btnPass+"--");
    }
    /******************************-------------- logic control------------------- *************************************/

    $scope.Limit = function(num){
        return Number(parseFloat(num).toFixed(2));
    }
    $scope.selectPayMethod = function(pre,paymethod){
        pre.buttonClass = "btn-disabled";
        $scope.orderInfo.paymethodSelected = paymethod;
        $scope.orderInfo.paymethodSelected = paymethod;
    }

    $scope.calculatePay = function(obj){
        var pay = 0;
        for( var key in obj) {
            var amountValid = parseInt(obj[key].AMNT);
            if (isNaN(amountValid) || amountValid == null || amountValid <= 0 || amountValid > 100) {
                continue;
            }
            pay = pay + amountValid * Number(obj[key].CMB_PRC);
        }
        return pay;
    }

    $scope.updatePayInDue = function(){
        $scope.orderInfo.payInDue = $scope.calculatePay($scope.cart);
        $scope.transFeeEstimate();
    }

    $scope.removeCmb = function(cmb){
        userOrderFactory.pullCart(cmb);
        $scope.orderInfo.payInDue = basicUtil.Limit($scope.calculatePay($scope.cart));
        $scope.$parent.inCart.sumAmount = userOrderFactory.cartQuan();
        delete $scope.cart[cmb.TKT_ID];
    }

    $scope.cleanup = function(){
        userOrderFactory.cleanCookies();
        $scope.$parent.inCart.sumAmount = userOrderFactory.cartQuan();
    }

    $scope.submit = function(){
        if(($scope.orderInfo.RM_ID == null || $scope.orderInfo.RM_ID == '')){
            alert('请填写房间号');
            return;
        }
        var allCMB = [];
        for(var key in $scope.cart){
            if($scope.cart[key].SRVC_TP_ID != '3'){
                allCMB.push([
                    $scope.cart[key].CMB_ID, //CMB_ID
                    $scope.cart[key].AMNT, //AMNT
                    $scope.cart[key].datePartString + ' ' + $scope.cart[key].timePartString, //ORDR_TSTMP,
                    $scope.cart[key].RMRK, //RMRK,
                    null, //RCVR_NM,
                    null, //RCVR_PHN,
                    null, //RCVR_ADDRSS,
                    '2', // HTL_ID
                    $scope.orderInfo.RM_ID, // RM_ID,
                    $scope.cart[key].TKT_ID, //TKT_ID
                    '已下单', // STATUS
                    null // ORDR_TAKEN_TSTMP
                ]);
            }else if($scope.cart[key].SRVC_TP_ID == '3'){
                allCMB.push([
                    $scope.cart[key].CMB_ID, //CMB_ID
                    $scope.cart[key].AMNT, //AMNT
                    null, //ORDR_TSTMP,
                    null, //RMRK,
                    $scope.receiver.RCVR_NM, //RCVR_NM,
                    $scope.receiver.RCVR_PHN, //RCVR_PHN,
                    $scope.receiver.province + $scope.receiver.city + $scope.receiver.area + $scope.receiver.blockAddress, //RCVR_ADDRSS,
                    '2', // HTL_ID
                    $scope.orderInfo.RM_ID, // RM_ID
                    $scope.cart[key].TKT_ID, //TKT_ID
                    '已下单', // STATUS
                    null // ORDR_TAKEN_TSTMP
                ]);
            }
        }
        var tran = {
            HTL_ID: '2',
            TSTMP: dateUtil.tstmpFormat(new Date()),
            CUS_PHN: null,
            CUS_NM: null,
            PYMNT_TTL:$scope.orderInfo.payInDue+$scope.orderInfo.transFee,
            STATUS: '已下单',
            RM_ID: $scope.orderInfo.RM_ID,
            PYMNT_MTHD: $scope.orderInfo.paymethodSelected.PAY_MTHD_NM
        };
        userOrderFactory.checkOTCart(tran,allCMB).success(function(data){
            $scope.success = true;
            $timeout(function(){
                $scope.cleanup();
                $scope.orderInfo.tran_id =data[0].TRN_ID;
                $scope.orderInfo.payInTotal = $scope.orderInfo.payInDue+$scope.orderInfo.transFee;
                //append Order Id
                appendOrderId(data,$scope.cart);
                $scope.pageChange('cartConfirm');
            }, 0);
        });
    }

    function appendOrderId(order,cart){
        for(var i =0 ; i < order.length; i++){
            cart[order[i].TKT_ID].ORDR_ID = order[i].ORDR_ID;
        }
    }

    $scope.pageChange = function(nextPage){
        $scope.cartStage = nextPage;
        $scope.action.putAnalytics({
            ANLYTCS_TSTMP:dateUtil.tstmpFormat(new Date()),
            ANLYTCS_PG_NM:nextPage,
            ANLYTCS_EVNT:'get in page'
        });
    }

    $scope.$watch('orderInfo.paymethodSelected',
        function(newValue, oldValue) {
            if(newValue == oldValue) return;
            paymethodsClass($scope.paymethods);
        },
        true
    );

    // very important
    $scope.$watch('$parent.info.cartOpen',
        function(newValue, oldValue) {
            $scope.updatePayInDue();
            $scope.cartStage =  $scope.$parent.info.cartPage;
            $scope.$parent.action.selectAnalytics($scope.cartStage);
        },
        true
    );

    function paymethodsClass(paymethods){
        for(var i =0; i < paymethods.length; i++){
            if($scope.orderInfo.paymethodSelected.PAY_MTHD_ID == paymethods[i].PAY_MTHD_ID ){
                paymethods[i].buttonClass = 'btn-primary';
            }else{
                paymethods[i].buttonClass = 'btn-disabled';
            }
        }
    }

    $scope.transFeeEstimate = function(){
        $scope.orderInfo.transFee = 0;
        for(var key in $scope.cart){
            $scope.orderInfo.transFee = $scope.orderInfo.transFee +
            parseFloat($scope.cart[key].CMB_TRANS_PRC)*$scope.cart[key].AMNT;
        }
    }

    /*********************** -------------- page control------------------- ***********************/
    $scope.cartDown = function(){
        $scope.$parent.info.cartOpen = false;
        //window.location.reload();
    }
    $scope.nowEmpty = function(cart){
        return (cart == null ||Object.keys(cart).length == 0);
    }

    $scope.toComboInfo = function (cmb){
        $scope.$parent.info.cmbSelected = null;
        comboInfoFactory.pushSelectedCombo(null);
        $route.reload();
        $location.path('/combo/combo/:'+cmb.CMB_ID.toString());
        $scope.cartDown();
    }
    /******************************-------------- init  function------------------- *************************************/
    function getPaymentMethods(HTL_ID){
        orderDetailFactory.getAllPayMethods(HTL_ID).success(function(data){
            if(data.length ==0) return;
            $scope.paymethods = data;
            $scope.orderInfo.paymethodSelected = $scope.paymethods[0];
            paymethodsClass($scope.paymethods);
        });
    }
    function getCart(){
        $scope.cart = basicUtil.objDecode(userOrderFactory.getCart());
    }
    /***************************** -------------- init variable------------------- *******************/
    $scope.paymethods = [];
    $scope.success = false;
    $scope.cartStage =  $scope.$parent.info.nextPage;
    //$scope.cartStage = 'cartProducts';
    $scope.receiver = orderDetailFactory.getReceiverInfo();
    $scope.orderInfo = {
        tran_id:"",
        paymethodSelected:"",
        RM_ID:"",
        transFee:0,
        payInDue: basicUtil.Limit($scope.calculatePay($scope.cart)),
        payInTotal: 0
    }
    getPaymentMethods(2);
    getCart();
    $scope.transFeeEstimate();
})

/************************                       single Master Pay sub controller                      ***********************/
//.controller('cmbInCartCtrl', function ($scope,userOrderFactory) {
//    $scope.$watch('cmb.amount',
//        function(newValue, oldValue) {
//            if(newValue==oldValue) return;
//            if($scope.cmb.amount == null || isNaN($scope.cmb.amount) || $scope.cmb.amount <= 0 ){
//                $scope.$parent.cart[$scope.cmb.CMB_ID].amountColor = ["redBorder"];
//            }else{
//                $scope.$parent.cart[$scope.cmb.CMB_ID].amountColor = null;
//            }
//            userOrderFactory.replaceCart($scope.cmb.CMB_ID,$scope.cmb);
//            $scope.$parent.$parent.inCart.sumAmount = userOrderFactory.cartQuan();
//            $scope.$parent.updatePayInDue();
//
//        },
//        true
//    );
//});