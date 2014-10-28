
function PermisoCtrl($rootScope,$scope,$location,$window,Arbol,Session,PermisosList) {
	$rootScope.nav = 'permisos';
	$window.document.title ='SICI: Permisos';

	$scope.arbol = Arbol.query();
	$scope.oculto = false;	
	$scope.is_show_recursive_users = false;
	$scope.show_responsables = true;
	
	$scope.show_recursive_users = function(){
		$scope.is_show_recursive_users = true;
	}
	$scope.show_normal = function(){
		$scope.is_show_recursive_users = false;
	}
	

	$scope.jerarquia = Session.create().permisoscalculados.jerarquialectura;
	
	$scope.filtrojerarquia = function(item) {
		if ($scope.jerarquia.indexOf(item.id)!=-1 )
			return true;		
		for(var i=0;i<item.nodes.length;i++) 
			if ($scope.filtrojerarquia(item.nodes[i])) 
				return true;		
		return false;
	};

	$scope.filtrosocultos = false;
	$scope.setSeleccionado = function(seleccionad){
			if (seleccionad) {
				$scope.seleccionado = seleccionad;
				$rootScope.setTitle(seleccionad.title); 
				//$scope.procedimientos = ProcedimientoList.query({idjerarquia:seleccionad.id}); 
				$scope.permisostotales = PermisosList.query({idjerarquia:seleccionad.id}, function() {
					$scope.permisos = $scope.permisostotales.permisos;
					$scope.responsables = $scope.permisostotales.responsables;
				});
				console.log($scope.permisostotales);
				$scope.cumplimentados = 0;
				$scope.count = 1;
			}
		};

	$scope.colorText = $rootScope.colorText;
	
	$scope.isR = function(permiso) {
		return true;
	}
	$scope.isW = function(permiso) {
		return typeof $scope.seleccionado !== 'undefined' 
			&& typeof $scope.seleccionado.id !== 'undefined' 
			&& typeof permiso.jerarquiadirectaescritura !== 'undefined'
			&& Array.isArray(permiso.jerarquiadirectaescritura)
			&& permiso.jerarquiadirectaescritura.indexOf($scope.seleccionado.id)!==-1;
	}
	$scope.isP = function(permiso) {
		return typeof permiso.grantoption !== 'undefined' 
			&& permiso.grantoption > 0;
	}

	$scope.isFiltroSelected= function(filtro,key,fa){
		return (typeof filtro[key] != 'undefined' && fa.name==filtro[key]);
	}

    
	/*
	
	$scope.sparkline = function(){
		setTimeout( function(){	$('.sparkline').each(function(){
				var obj = $(this).html();
				try{
					var t = JSON.parse( obj );
					$(this).sparkline( t, {type: 'bar',barColor: '#a94442'}) ; 
				}catch(e){
					
				}
			});
		},1);
	}
	$scope.filtrotxtprocedimiento = {};
	$scope.$watch('filtrotxtprocedimiento.$',function(newValue,oldValue){ $scope.sparkline(); });
	$scope.$watch('procedimientosocultos',function(newValue,oldValue){ $scope.sparkline(); });
	//$scope.$watch('oculto', function(){setTimeout(function(){nv.utils.windowResize(); }, 10 ); });

	$scope.procedimientosfiltrados = [];
	$scope.$watch('filtro',function(newValue,oldValue){
		var result = [];
		$scope.procedimientos.forEach(function(p,j){
			var ok = true;
			for(var campofiltro in $scope.filtro){
				if ($scope.filtro[campofiltro]!='TODOS' && p[campofiltro] != $scope.filtro[campofiltro]){
					ok=false; break;
				}
			}
			if (ok)
				result.push(p);
			else
				console.info(p);
		});
		$scope.procedimientosfiltrados = result;

		$scope.setProcedimiento ( ($scope.procedimientosfiltrados.length>0) ?  $scope.procedimientosfiltrados[0] : false );
		$scope.sparkline();
		$scope.procedimientosocultos = false;
	}, true);


	$scope.xAxisTickValuesFunction = function(){ return function(d){ return [0,1,2,3,4,5,6,7,8,9,10,11]; };};
	$scope.xAxisTickFormatFunction = function(){ return function(d){ return $scope.meses[d]; } };
	$scope.colorFunction= function(){ return function(d,i){ 
		var color = $scope.colorText(i, 5, 60);
		var r = (color.red<16 ? '0': '')+color.red.toString(16), g = (color.green<16 ? '0': '')+color.green.toString(16), b = (color.blue<16 ? '0': '')+color.blue.toString(16);
	 	return '#'+r+g+b;
	}};

	$scope.graphs = false;
	$scope.$watch('procedimientoSeleccionado',function(newvalue,oldvalue){
		if (newvalue){
			
			var graphskeys = [
					{caption:'RESUMEN DE DATOS DE GESTIÓN',keys:['Solicitados','Iniciados','Pendientes','Total resueltos']},
					{caption:'RESUELTOS EN PLAZO',keys:['En plazo','Fuera de plazo']},
					{caption:'DESESTIMIENTOS/RENUNCIAS Y PRESCRITOS/CADUCADOS',keys:['Resueltos por Desistimiento/Renuncia/Caducidad (Resp_Ciudadano)',	'Resueltos por Prescripcion/Caducidad (Resp_Admon)']},
					{caption:'QUEJAS Y RECURSOS CONTRA EL PROCEDIMIENTO',keys:['Quejas presentadas en el mes','Recursos presentados en el mes']},
					{caption:'VARIACIÓN DE TRAMITACIÓN MENSUAL (DATOS ABSOLUTOS)',keys:['Tramitados 2013','Total resueltos']},
				];
			$scope.graphs = [];
			graphskeys.forEach(function(g, i){
				var maxvalue = 0;
				var data = [];
				var caption = g.caption;
				g.keys.forEach(function(key,indx){
					var values = [];
					if ($scope.procedimientoSeleccionado[key]){
						$scope.procedimientoSeleccionado[key].forEach(function (val,idx) {
							values.push( [ idx, val] ) ;
							if (maxvalue< val) maxvalue=val;
						});
						data.push(	{ "key": key,"values": values} );
					}
				})
				var forcey = [0, Math.ceil(maxvalue*1.3) ];
				if (maxvalue>0)
					$scope.graphs.push( { data : data, forcey : forcey, caption:caption} );
			})
		}else{
			$scope.graphs = false;
		}

	})
	$scope.cumplimentados = 0;
	$scope.count = 1;
	$scope.$watch('procedimientos.$resolved', function(newValue, oldValue) {

		$scope.setProcedimiento ( ($scope.procedimientos.length>0) ?  $scope.procedimientos[0] : false );
		$scope.procedimientosfiltrados = $scope.procedimientos;
		if (newValue && $scope.procedimientos.length>0)
		{
			$scope.responsables = {};
			$scope.filtros = {};
			$scope.filtro = {};
			$scope.cumplimentados = 0;
			$scope.count = $scope.procedimientos.length;
//console.log('50. procedimientos.length='+$scope.procedimientos.length+ ' procedimientosfiltrados.length='+$scope.procedimientosfiltrados.length)
			$scope.procedimientos.forEach(function(p){
				if (p.codigo < $scope.procedimientoSeleccionado.codigo)
					$scope.procedimientoSeleccionado = p;
				var cumplimentado = $scope.cumplimentado(p);
				cumplimentado && $scope.cumplimentados++;
				for(var i in $scope.camposfiltros){
					var campofiltro = $scope.camposfiltros[i], value = p[campofiltro], name  = p[campofiltro], count = 1;
					if (typeof $scope.filtros[campofiltro] === 'undefined')
						$scope.filtros[campofiltro] = {};
					if (typeof $scope.filtros[campofiltro][value] === 'undefined')
					{
						$scope.filtros[campofiltro][value] = { name: name, value:value, count:count, cumplimentados:cumplimentado ? 1 : 0}
					}else{
						$scope.filtros[campofiltro][value].count = $scope.filtros[campofiltro][value].count+1;
						if (cumplimentado)
							$scope.filtros[campofiltro][value].cumplimentados = $scope.filtros[campofiltro][value].cumplimentados+1;
					}
					$scope.filtros[campofiltro][value].name = $scope.filtros[campofiltro][value].value + ' ('+($scope.filtros[campofiltro][value].cumplimentados)+'/'+($scope.filtros[campofiltro][value].count)+')';
				}
			});
			
			for(var i in $scope.camposfiltros){
				var campofiltro = $scope.camposfiltros[i];
				if (Object.keys($scope.filtros[campofiltro]).length > 1)
				{
					$scope.filtros[campofiltro].TODOS = { name:'TODOS',value:'TODOS', count:0};
					$scope.filtro[campofiltro] = 'TODOS';
				}else{
					for(var a in $scope.filtros[campofiltro])
						$scope.filtro[campofiltro] = $scope.filtros[campofiltro][a].value;
					//console.log(campofiltro);
				}
			}

			if (Object.keys($scope.responsables).length > 1)
			{
				$scope.responsables.TODOS = { name:'TODOS',value:'TODOS', count:0};
				$scope.responsable = $scope.responsables.TODOS;
			}else{
				for(var a in $scope.responsables)
					$scope.responsable = $scope.responsables[a];
			}

			
			$scope.sparkline();
			
		}
	});
	$scope.anualidad = new Date().getFullYear();
	$scope.camposfiltros = ['Denominacion Nivel 3','Denominacion Nivel 2','Denominacion Nivel 1', 'Nombre responsable',];
	$scope.filtros = {};
	$scope.filtro = {};
	$scope.camporesponsable = 'Nombre responsable';
	$scope.responsables = {};
	$scope.procedimientosocultos = false;
	$scope.attrspar = [
		'codigo',
		'denominacion',
		'Codigo Nivel 1',
		'Denominacion Nivel 1',
		'Codigo Nivel 2',
		'Denominacion Nivel 2',
		'Codigo Nivel 3',
		'Denominacion Nivel 3',
		'Codigo plaza responsable',
		'Login responsable',
		'Nombre responsable',
		'Correo-e responsable',
		'Teléfono responsable',
		'Plazo maximo legal para resolver (dias naturales)',
		'Plazo maximo legal para responder (dias habiles)',
		'Plazo CS /ANS (dias naturales)',
		'Plazo CS /ANS (dias habiles)',
		'Pendientes iniciales (a 31-12)',
	];
	$scope.attrstabla = ['Tramitados 2013','Solicitados',
		'Iniciados',
		'Resueltos [1]',
		'Resueltos [5]',
		'Resueltos [10]',
		'Resueltos [15]',
		'Resueltos [30]',
		'Resueltos [45]',
		'Resueltos [>45]',
		'Resueltos por Desistimiento/Renuncia/Caducidad (Resp_Ciudadano)',
		'Resueltos por Prescripcion/Caducidad (Resp_Admon)',
		'T_ medio dias naturales',
		'T_ medio dias habiles descontando T_ de suspensiones',
		'En plazo',
		'Quejas presentadas en el mes',
		'Recursos presentados en el mes',
		'Total resueltos',
		'Fuera de plazo',
		'Pendientes',
		];
	$scope.meses = $rootScope.meses;*/
}
PermisoCtrl.$inject = ['$rootScope','$scope','$location','$window','Arbol','Session','PermisosList'];
