/**
 * Created by charlie on 4/2/15.
 */

Da.controller('comboListCTLR', function($scope, $location, serviceTypeFactory, userOrderFactory,comboInfoFactory){

    /*------------------------------ page control --------------------------------*/
    //$scope.addCombo =function(cmb){
    //    userOrderFactory.pushCart(cmb);
    //    cmb.selected = 'T';
    //    $scope.$parent.inCart.sumAmount = userOrderFactory.cartQuan();
    //}
    //
    //$scope.removeCombo =function(cmb){
    //    userOrderFactory.pullCart(cmb);
    //    cmb.selected = 'F';
    //    $scope.$parent.inCart.sumAmount = userOrderFactory.cartQuan();
    //}

    $scope.toComboInfo = function(cmb){
        $scope.$parent.info.cmbSelected = cmb;
        comboInfoFactory.pushSelectedCombo(cmb);
        $location.path('/combo/combo/:'+cmb.CMB_ID.toString());
    }
    /*------------------------------- init function -------------------------------*/



    /* -------------- init variable------------------- */
    $scope.animationStyle = 'slide';
    var pathArray = window.location.href.split("/:");
    var SRVC_TP_ID = pathArray[1];
    $scope.$parent.init(2,SRVC_TP_ID);
    $scope.$parent.info.page = 'comboList';
});

