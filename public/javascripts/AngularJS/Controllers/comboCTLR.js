/**
 * Created by charlie on 8/2/15.
 */

Da.controller('comboCTLR', function($scope, $location, $rootScope, hotelFactory, comboInfoFactory, userOrderFactory,$route){

    /*------------------------------ page control --------------------------------*/
    $scope.pageChange = function(destination){
        $scope.comboPage = destination;
        if(destination != 'comboInfo'){
            $scope.$parent.info.page = 'detail'
        }else{
            $scope.$parent.info.page = 'comboInfo'
        }
    }
    $scope.nextChange = function(afterConfirm){
        $scope.comboNext = afterConfirm;
    }
    $scope.confirmCombo = function(){
        $scope.cmb.filled = true;
        if($scope.comboNext == 'cartProducts' || $scope.comboNext == 'cartOrderInfo'){
            cartProductAction();
        }else if($scope.comboNext == 'cartAddCart'){
            cartAddCartAction();
        }
        $scope.pageChange('comboInfo');
    }

    function cartProductAction(){
        userOrderFactory.pushCart($scope.cmb);
        $scope.$parent.inCart.sumAmount = userOrderFactory.cartQuan();
        $scope.$parent.info.cartOpen = true;
        $route.reload();
    }


    function cartAddCartAction(){
        userOrderFactory.pushCart($scope.cmb);
        $scope.$parent.inCart.sumAmount = userOrderFactory.cartQuan();
        $route.reload();
    }
    /*------------------------------- watcher function -------------------------------*/
    // super hacky solution
    //$scope.$watch('$parent.info.nextPage',
    //    function(newValue, oldValue) {
    //        if(newValue == 'cartProducts'){
    //            $scope.nextChange('cartProducts');
    //            if(!userOrderFactory.inCart($scope.cmb.CMB_ID)){
    //                $scope.pageChange($scope.cmb.SRVC_TP_ID);
    //            }else{
    //                userOrderFactory.pushCart($scope.cmb);
    //                $scope.$parent.info.cartOpen = true;
    //                $scope.$parent.inCart.sumAmount = userOrderFactory.cartQuan();
    //            }
    //        }else if(newValue == 'cartAddCart'){
    //            if(!userOrderFactory.inCart($scope.cmb.CMB_ID)){
    //                $scope.pageChange($scope.cmb.SRVC_TP_ID);
    //                $scope.nextChange('cartAddCart');
    //            }else{
    //                $scope.nextChange('comboInfo');
    //            }
    //        }
    //        $scope.$parent.action.setNextPage('');  // reset to empty for next watch event
    //    },
    //    true
    //);

    $scope.$watch('$parent.info.nextPage',
        function(newValue, oldValue) {
            if(newValue == 'cartProducts'){
                $scope.nextChange('cartProducts');
                if($scope.cmb.filled){
                    cartProductAction();
                }else{
                    $scope.pageChange($scope.cmb.SRVC_TP_ID);
                }
            }else if(newValue == 'cartAddCart'){
                $scope.nextChange('cartAddCart');
                if($scope.cmb.filled){
                    cartAddCartAction();
                }else{
                    $scope.pageChange($scope.cmb.SRVC_TP_ID);
                }
            }else if(newValue == 'cartOrderInfo'){
                $scope.nextChange('cartOrderInfo');
                if($scope.cmb.filled){
                    cartProductAction();
                }else{
                    $scope.pageChange($scope.cmb.SRVC_TP_ID);
                }
            }
            $scope.$parent.action.setNextPage('');  // reset to empty for next watch event
        },
        true
    );

    /*------------------------------- init function -------------------------------*/
    function init(cmb){
        comboInfoFactory.getMerchantInfoByCmb(cmb.CMB_ID).success(function(data){
            $scope.Merchant =data[0];
        });
        comboInfoFactory.getTagsOfCmb('('+cmb.CMB_TAGS+')').success(function(data){
            $scope.Tags =data;
        });
        hotelFactory.getHotelInfo(2).success(function(data){
            $scope.hotel = data[0];
        });
        cmb.serviceDate = new Date(); //dateUtil.dateFormat(new Date());
        cmb.serviceTime = new Date(); //dateUtil.timeFormat(new Date());
        if(cmb.AMNT == null){
            cmb.AMNT = 1;
        }
        cmb.TKT_ID = cmb.CMB_ID.toString() + dateUtil.tstmpFormat(new Date());
    };
    /* -------------- init variable------------------- */
    if($scope.$parent.info.cmbSelected != null){
        $scope.cmb = JSON.parse(JSON.stringify($scope.$parent.info.cmbSelected));
        init($scope.cmb);
    }else{
        var pathArray = window.location.href.split("/:");
        var CMB_ID = pathArray[1];
        comboInfoFactory.getSelectedCombo(CMB_ID).success(function(data){
            if(Array.isArray(data)){
                $scope.cmb = JSON.parse(JSON.stringify(data[0]));
            }else{
                $scope.cmb = JSON.parse(JSON.stringify(data));
            }
            init($scope.cmb);
        });
    }
    $scope.comboPage = 'comboInfo';
    $scope.comboNext = 'comboInfo';
    $scope.limitArray = basicUtil.getTuple(1,51);
    $scope.$parent.info.page = 'comboInfo';  // to tell outer nav bar to dispatch

});

Da.controller('serviceDetailCTLR', function($scope,orderDetailFactory,userOrderFactory) {
    $scope.confirmCombo = function(){
        $scope.cmb.datePartChineseString = dateUtil.dateChineseFormat($scope.cmb.serviceDate);
        $scope.cmb.timePartChineseString = dateUtil.timeChineseFormat($scope.cmb.serviceTime);
        $scope.cmb.datePartString = dateUtil.dateFormat($scope.cmb.serviceTime);
        $scope.cmb.timePartString = dateUtil.timeFormat($scope.cmb.serviceTime);
        $scope.$parent.confirmCombo();
    }
});
Da.controller('shipDetailCTLR', function($scope,orderDetailFactory,userOrderFactory){
    /********************************************     validation     ***************************************************/
    $scope.hasError = function(btnPass){
        if(eval("$scope."+btnPass)==null) eval("$scope."+btnPass+"=0");
        eval("$scope."+btnPass+"++");
    }
    $scope.noError = function(btnPass){
        eval("$scope."+btnPass+"--");
    }

    /****************************** ------------------- utility ------------------- *************************************/

    $scope.confirmCombo = function(){
        if($scope.receiverError == 0 || $scope.receiverError == null ){
            orderDetailFactory.pushReceiverInfo($scope.receiver);
            $scope.$parent.confirmCombo();
        }
    }

    $scope.updateProvince = function(updater){
        $scope.receiver.province =updater.name;
        $scope.receiver.provinceIndex =$scope.provinceNcity.province.indexOf(updater);
        $scope.check.city = updater.city[0];
        $scope.updateCity($scope.check.city);
    }

    $scope.updateCity = function(updater){
        $scope.receiver.city =updater.name;
        $scope.receiver.cityIndex = $scope.check.province.city.indexOf(updater);
        $scope.check.area = updater.area[0];
        $scope.updateArea($scope.check.area);
    }

    $scope.updateArea = function(updater){
        $scope.receiver.area = updater.name;
        $scope.receiver.areaIndex = $scope.check.city.area.indexOf(updater);
    }

    /******************************-------------- init  function------------------- *************************************/

    function getProvinceNcity(){
        orderDetailFactory.getProvinceNcity().success(function(data){
            $scope.provinceNcity = data;
            $scope.receiver = orderDetailFactory.getReceiverInfo();
            if($scope.receiver.province =='' || $scope.receiver.province == null){
                $scope.check.province = $scope.provinceNcity.province[0];
                $scope.check.city = $scope.check.province.city[0];
                $scope.check.area = $scope.check.city.area[0];
            }else{
                $scope.check.province = $scope.provinceNcity.province[$scope.receiver.provinceIndex];
                $scope.check.city = $scope.check.province.city[$scope.receiver.cityIndex];
                $scope.check.area = $scope.check.city.area[$scope.receiver.areaIndex];
            }
        });
    }
    /******************************-------------- init  variables------------------- *************************************/
    $scope.provinceNcity = null;

    $scope.check ={
        province:null,
        city:null,
        area:null
    }

    getProvinceNcity();
});