/**
 * Created by charlie on 5/7/15.
 */

Da.controller('cartCTLR', function($scope, $http, $location, comboInfoFactory, userOrderFactory,orderDetailFactory,$timeout) {

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
        delete $scope.cart[cmb.CMB_ID];
        userOrderFactory.pullCart(cmb);
        $scope.orderInfo.payInDue = basicUtil.Limit($scope.calculatePay($scope.cart));
        $scope.$parent.inCart.sumAmount = userOrderFactory.cartQuan();
        //$scope.$parent.$parent.$parent.getSingleComboAvail(cmb.CMB_ID)
    }

    $scope.cleanup = function(){
        userOrderFactory.cleanCookies();
        $scope.$parent.inCart.sumAmount = userOrderFactory.cartQuan();
        //$scope.$parent.$parent.$parent.getCombosAvail();
    }

    $scope.submit = function(){
        if($scope.orderInfo.paymethodSelected.PAY_MTHD_NM=='酒店挂账' && ($scope.orderInfo.RM_ID == null || $scope.orderInfo.RM_ID == '')){
            alert('请填写房间号');
            return;
        }
        var allCMB = [];
        for(var key in $scope.cart){
            allCMB.push([key,
                $scope.cart[key].AMNT
                //$scope.cart[key].ORDR_TSTMP,
                //$scope.cart[key].RMRK,
                //$scope.cart[key].RCVR_NM,
                //$scope.cart[key].RCVR_PHN,
                //$scope.cart[key].RCVR_ADDRSS,
                //$scope.cart[key].HTL_ID
            ]);
        }
        var tran = {
            HTL_ID: '2',
            TSTMP: dateUtil.tstmpFormat(new Date()),
            CUS_PHN: null,
            CUS_NM: null,
            PYMNT_TTL:$scope.orderInfo.payInDue+$scope.orderInfo.transFee,
            STATUS: '未确认',
            RM_ID: $scope.orderInfo.RM_ID,
            PYMNT_MTHD: $scope.orderInfo.paymethodSelected.PAY_MTHD_NM
        };
        userOrderFactory.checkOTCart(tran,allCMB).success(function(data){
            $scope.success = true;
            $timeout(function(){
                $scope.cleanup();
                $scope.orderInfo.tran_id = data;
                $scope.orderInfo.payInTotal = $scope.orderInfo.payInDue+$scope.orderInfo.transFee;
                $scope.pageChange('cartConfirm');
            }, 1000);
        });
    }

    $scope.pageChange = function(nextPage){
        $scope.cartStage = nextPage;
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
        $scope.$parent.info.cmbSelected = cmb;
        comboInfoFactory.pushSelectedCombo(cmb);
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
    $scope.cartStage = 'cartProducts';
    $scope.recNoInfo = true;
    $scope.check = {
        province: null,
        city: null,
        area: null
    }
    $scope.orderInfo = {
        receiver:orderDetailFactory.getReceiverInfo(),
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