function EtiquetaCtrl($rootScope,$scope,$routeParams,Etiqueta) {
	$rootScope.nav = 'etiqueta';
	$scope.cambios = [];
	$scope.etiquetas =  Etiqueta.query();
	$scope.nuevo =  new Etiqueta();
	$scope.actualizar = function(regla){
		regla.$update(function(){
			$scope.cambios = [];
		});
	};
	$scope.eliminar = function(regla){
		if (confirm('¿Está seguro? Esta operación no es reversible.'))
		regla.$delete(function(){
			$scope.cambios = [];
			$scope.etiquetas =  Etiqueta.query();
		});
	};
	$scope.guardar = function(regla){
		Etiqueta.save($scope.nuevo, function() {
			$scope.etiquetas = Etiqueta.query();
			$scope.nuevo = new Etiqueta();
		});
	}
}

ReglasInconsistenciasCtrl.$inject = ['$rootScope','$scope','$routeParams','Etiqueta'];