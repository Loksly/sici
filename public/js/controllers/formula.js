(function (angular, $) {
	'use strict';
	angular.module('sici')
			.controller('FormulaCtrl', ['$http', '$q', '$rootScope', '$scope', '$routeParams', 'Objetivo', 'Operador', 'Indicador',
				function ($http, $q, $rootScope, $scope, $routeParams, Objetivo, Operador, Indicador) {

					$scope.draggableObjects = Operador.query(function () {
						$scope.operators = $scope.draggableObjects.slice();
					});

					$scope.indicadores = [];
					$scope.indicadoresObjeto = {};
					$scope.formulaObjects = [];

					var fn = function (defer) {
						return function (data) {
							$scope.indicadores.push({texto: data.nombre, valor: data._id, color: '#2A7FFF', indicador: true});
							$scope.indicadoresObjeto[data._id] = data;
							defer.resolve();
						};
					};
					var defers = [];
					$scope.objetivo = Objetivo.get({id: $routeParams.idobjetivo}, function () {
						$scope.formula = $scope.objetivo.formulas[$routeParams.index];
						for (var i = 0, j = $scope.formula.indicadores.length; i < j; i++) {
							var defer = $q.defer();
							defers.push(defer.promise);
							Indicador.get({id: $scope.formula.indicadores[i]}, fn(defer));
						}
						$q.all(defers).then(function () {
							$scope.parseFormula();
						});
					});

					$scope.parseFormula = function () {
						if (typeof $scope.formula.computer !== 'undefined' && $scope.formula.computer.trim() !== "") {
							var formula = JSON.parse($scope.formula.computer);
							formula.filter(function(elem) { if (elem.trim() !== '') { return elem; }}).forEach(function (elem) {
								var encontrado = false;
								for (var i = 0; i < $scope.formula.indicadores.length; i++) {
									var id = $scope.formula.indicadores[i];
									if (elem.indexOf(id) !== -1) {
										$scope.formulaObjects.push({texto: $scope.indicadoresObjeto[id].nombre, valor: elem, color: '#2A7FFF', indicador: true});
										encontrado = true;
										break;
									}
								}
								if (!encontrado) {
									$scope.formulaObjects.push({texto: elem, valor: elem, indicador: false});
								}
							});
						}
						for (var i = $scope.formulaObjects.length; i < 12; i++) {
							$scope.formulaObjects.push({texto: '', color: 'grey', indicador: false});
						}
					};

					$scope.onDropFormula = function (index, data, evt) {
						if (data._id) {
							$scope.formulaObjects[index] = {texto: data.texto, valor: data.valor, indicador: data.indicador};
						} else {
							var otherObj = $scope.formulaObjects[index];
							var otherIndex = $scope.formulaObjects.indexOf(data);
							$scope.formulaObjects[index] = data;
							$scope.formulaObjects[otherIndex] = otherObj;
						}

					};

					$scope.onDropEliminar = function (data) {
						var index = $scope.formulaObjects.indexOf(data);
						$scope.formulaObjects[index] = {texto: '', color: 'grey', indicador: false};
					};

					$scope.guardarFormula = function () {
						var formula = [];
						var fnFilter = function (elem) {
							if (elem.texto !== '') {
								return elem;
							}
						};

						$scope.formulaObjects.filter(fnFilter).forEach(function (elem) {
							if (elem.indicador) {
								formula.push("/indicador/" + elem.valor + "/valores/[anualidad]/[mes]");
							} else {
								formula.push(elem.valor);
							}
						});
						var parameters = {idobjetivo: $routeParams.idobjetivo, indiceformula: $routeParams.index, formula: JSON.stringify(formula)};
						$http.put('/api/v2/public/updateformula', parameters).then(function() {
							$rootScope.toaster('Fórmula actualizada correctamente', 'Éxito', 'success');
						}, function(err) {
							$rootScope.toaster('No se ha podido actualizar la fórmula', 'Error', 'error');
						});
						
					};

				}]);
})(angular, $);