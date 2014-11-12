
function intersect_safe(a, b)
{
  var ai=0, bi=0;
  var result = new Array();

  while( ai < a.length && bi < b.length )
  {
     if      (a[ai] < b[bi] ){ ai++; }
     else if (a[ai] > b[bi] ){ bi++; }
     else /* they're equal */
     {
       result.push(a[ai]);
       ai++;
       bi++;
     }
  }

  return result;
}

function PermisoCtrl($rootScope,$scope,$location,$window,Arbol,Session,PermisosList,PersonasSearchList,ProcedimientoList,PermisosProcedimientoList,PermisosDirectosProcedimientoList, Jerarquia, Permiso, PersonasByPuesto, PersonasByLogin, PersonasByRegexp, Persona, $q) {
	$rootScope.nav = 'permisos';
	$window.document.title ='SICI: Permisos';

	$scope.arbol = Arbol.query();
	$scope.oculto = false;	
	$scope.is_show_recursive_users = false;
	$scope.is_show_inherited_users = false;
	$scope.show_responsables = true;
	$scope.show_form_add_permiso = false;
	$scope.personas_plazas = [];
	$scope.persona_o_plaza = null;
	$scope.show_details_permiso = false;
	$scope.logincarm = "";
	$scope.procedimiento_seleccionado;
	$scope.seleccionado_organica = false;	
	$scope.nodo_jerarquia = null;
	$scope.usuarioencontrado = false;
	$scope.nuevousuario = {};
	$scope.is_nuevousuario = false;
	$scope.psuperuser = false;
	
	$scope.clearFormNuevoPermiso = function(){
		$scope.grantoption = false;
		$scope.psuperuser = false;
		$scope.w_option = false;
	};

	$scope.addPermiso = function() {
		if ($scope.seleccionado !== 'undefined') {
			//delete $scope.usuarioseleccionado ;
			$scope.nuevousuario = {};
			$scope.show_form_add_permiso = true;
		}
	}	

	$scope.show_recursive_users = function(){
		$scope.is_show_recursive_users = true;
		$scope.is_show_inherited_users = false;
		
		if ($scope.seleccionado_organica) $scope.setSeleccionado($scope.seleccionado);		
		else $scope.setProcSeleccionado($scope.procedimiento_seleccionado);		
	}

	$scope.getPersonas = function(viewValue) {
		var regex = ""+viewValue
		if (viewValue.length>2) {
			var p = PersonasByRegexp.query({"regex":viewValue}).$promise;
			return p;
		}
		else return [];
	};	
	
	$scope.show_inherited_users	 = function(){
		$scope.is_show_inherited_users = true;
		$scope.is_show_recursive_users = false;
		
		if ($scope.seleccionado_organica) $scope.setSeleccionado($scope.seleccionado);		
		else $scope.setProcSeleccionado($scope.procedimiento_seleccionado);		
	}
	
	$scope.show_normal = function(){
		$scope.is_show_recursive_users = false;
		$scope.is_show_inherited_users = false;

		if ($scope.seleccionado_organica) $scope.setSeleccionado($scope.seleccionado);		
		else $scope.setProcSeleccionado($scope.procedimiento_seleccionado);
	}
		
	$scope.$watch('usuarioseleccionado', function(old, _new){
		if ($scope.usuarioseleccionado) {			
			$scope.usuarioencontrado = true;
			$scope.nuevousuario = {};
		} else {
			$scope.usuarioencontrado = false;
		}
	});	
	
	$scope.crearnuevousuario = function() {
		$scope.usuarioencontrado = false;
		delete $scope.usuarioseleccionado ;
		$scope.is_nuevousuario = true;
	
	}
	
	$scope._crearnuevousuario = function(){
		if ( ($scope.nuevousuario.login || $scope.nuevousuario.plaza) && $scope.is_nuevousuario) {			
			Persona.save(nuevousuario, function() {				
				$scope.usuarioseleccionado = nuevousuario;
				$scope.nuevousuario = {};				
				alert('Creado nuevo usuario');
			});
			$scope.usuarioseleccionado = $scope.showPersona(nuevousuario);
			$scope.nuevousuario = {};
			alert('Supuesta creacion persona '+JSON.stringify($scope.usuarioseleccionado));
		}
	}

	$scope.cancelarnuevousuario = function(){
		$scope.nuevousuario = {};
		$scope.is_nuevousuario = false;
	}

	$scope.onseleccionadaPersona = function(item,model,label){
		alert(JSON.stringify(item));
		alert(JSON.stringify(model));
		alert(JSON.stringify(label));
	}
	
	$scope.$watch('nuevousuario', function(old, _new){
		if ($scope.nuevousuario.login) {
			delete $scope.usuarioseleccionado ;
		} else {
			$scope.is_nuevousuario = false;
		}
	});
	
	
	$scope.crearpermiso2 = function(spersona) {
		var partes = spersona.split("-");
		if (partes.length<1)
		{
			alert('No se ha podido crear el permiso');
			return;
		}
		var loginpersona = partes[0];
		var permiso;
		var deferred = $q.defer();
		var promise = deferred.promise;
		var persona ;
		
		if (loginpersona!='')
			persona = PersonasByLogin.query({"login":partes[0]},function(){
				if (persona.length>0) deferred.resolve(persona[0]);
				else deferred.reject();
			});
		else if (partes.length>1 && partes[1]!="")
			persona = PersonasByPuesto.query({"cod_plaza":partes[1]},function(){
				if (persona.length>0) deferred.resolve(persona[0]);
				else deferred.reject();				
			});
			
		promise.then(function(persona){		
			console.log(persona);
			permiso = {};
			permiso.codplaza = persona.codplaza;
			permiso.login= persona.login;
			if ($scope.grantoption) permiso.grantoption = true;
			permiso.superuser = !!$scope.psuperuser;
			
			if ($scope.seleccionado_organica && $scope.seleccionado) {				
				permiso.jerarquiadirectalectura = [ $scope.seleccionado.id ];
				if ($scope.w_option) permiso.jerarquiadirectaescritura = [ $scope.seleccionado.id ];
				permiso.procedimientodirectalectura = [];
				permiso.procedimientodirectaescritura = [];
			} else if ($procedimiento_seleccionado) {
				permiso.jerarquiadirectaescritura = [ ];
				permiso.jerarquiadirectalectura = [ ];
				permiso.procedimientodirectalectura = [ $scope.procedimiento_seleccionado.codigo ];
				if ($scope.w_option) permiso.procedimientodirectaescritura = [ $scope.procedimiento_seleccionado.codigo ];
			}
			
			alert('Salvando permiso '+JSON.stringify(permiso));
						
			Permiso.save(permiso,function(){
				delete $scope.usuarioseleccionado ;
				$scope.nuevousuario = {};
			});	
			$scope.clearFormNuevoPermiso();
			
		}, function(err){
			alert('Error asignando permisos');
		});
	}
	
	$scope.crearpermiso = function(usuarioseleccionado) {
		if (usuarioseleccionado)
		{		
			$scope.crearpermiso2(usuarioseleccionado);
		} else {
			alert('No ha seleccionado ninguna persona');
		}
	};
	
	$scope.eliminarPermiso = function() {
		alert('No implementado');
	};
	
	$scope.searchUser = function(){
		alert('No implementado');
	}
	
	$scope.eliminarResponable = function(procedimiento, responsable) {
		alert('Función no implementada');
	};
	
	$scope.showDetailsPermiso = function(){
		$scope.show_details_permiso = true;
		$scope.seleccionado = false;		
	}
	
	$scope.jerarquia = [];
	$scope.jerarquia = $scope.jerarquia.concat($rootScope.session.permisoscalculados.jerarquialectura);
	$scope.jerarquia = $scope.jerarquia.concat($rootScope.session.permisoscalculados.jerarquiaescritura);
	$scope.superuser = $rootScope.session.permisoscalculados.superuser;
	

	$scope.filtrojerarquia = function(item) {
		if ($scope.jerarquia.indexOf(item.id)!=-1 )
			return true;		
		if (item.nodes) for(var i=0;i<item.nodes.length;i++) 
			if ($scope.filtrojerarquia(item.nodes[i])) 
				return true;		
		return false;
	};

	$scope.cacheobjetos = {
		fecha : new Date()
	};
	
	$scope.getObjetoPermiso = function(permiso) {
		if ($scope.seleccionado_organica){ 
			if ($scope.seleccionado && $scope.nodo_jerarquia) {				
				var objeto = -1;
				var distancia = 1000000;
				var s_array_busqueda = "";
				
				if ($scope.is_show_inherited_users)
					s_array_busqueda = "ancestros";
				else if ($scope.is_show_recursive_users)
					s_array_busqueda = "descendientes";
							
				if ( permiso.jerarquiadirectalectura.indexOf( $scope.seleccionado.id ) !== -1 
					|| permiso.jerarquiadirectaescritura.indexOf( $scope.seleccionado.id ) !== -1
					)
					return $scope.seleccionado;
					
				var objs = [];
				if (Array.isArray(permiso.jerarquiadirectalectura) && 
					Array.isArray(permiso.jerarquiadirectaescritura) &&
					Array.isArray($scope.nodo_jerarquia[s_array_busqueda]))
						objs = intersect_safe(permiso.jerarquiadirectalectura.concat(permiso.jerarquiadirectaescritura),$scope.nodo_jerarquia[s_array_busqueda]);
				else  {
					console.error("Error, alguno de los arrays no es tal");
					return objs;
				}
				
				var resultado = [];
				for(var i=0;i<objs.length;i++){
					resultado[i] = Jerarquia.query({"idjerarquia":objs[i]}, function(){
						console.log(resultado[i]);
					});
				}				
				return resultado;
			} 		
		} 
	};
	
	
	$scope.filtrosocultos = false;
	
	$scope.setSeleccionado = function(seleccionad){
		if (seleccionad) {
			$scope.setSeleccionGenerico();			
			$scope.seleccionado = seleccionad;
			$scope.seleccionado_organica = true;
			$rootScope.setTitle(seleccionad.title); 
			//$scope.procedimientos = ProcedimientoList.query({idjerarquia:seleccionad.id}); 
			console.log("recursivo: "+$scope.is_show_recursive_users+" ; heredado: "+$scope.is_show_inherited_users);
			$scope.permisostotales = PermisosList.query({"idjerarquia":seleccionad.id, 'recursivo':($scope.is_show_recursive_users?1:($scope.is_show_inherited_users?2:0))}, function() {
				$scope.permisos = $scope.permisostotales.permisos;
				$scope.procedimientos = $scope.permisostotales.procedimientos;
			});		
			$scope.nodo_jerarquia = Jerarquia.query({"idjerarquia":$scope.seleccionado.id});
			// si no están cargados los procedimientos del nodo actual, los cargamos
			if (!$scope.seleccionado.procedimientos) for(var i=0;i<$scope.arbol.length;i++) {
				$scope.loadProcedimientos($scope.seleccionado, $scope.arbol[i]);
			}
		}
	};
	
	$scope.setProcSeleccionado = function(procedimiento)
	{
		if (procedimiento) {
			$scope.setSeleccionGenerico();			
			$scope.procedimiento_seleccionado = procedimiento;
			$scope.seleccionado_organica = false;
			$rootScope.setTitle('['+procedimiento.codigo+'] '+procedimiento.description);
			var procesar_permisos_procedimiento = function(){
				$scope.permisos = $scope.permisostotales;
				$scope.procedimientos = [procedimiento];
			} ;
			if ($scope.is_show_inherited_users) {
				console.log("Recuperando permisos hacia arriba");
				$scope.permisostotales = PermisosProcedimientoList.query({'codigoprocedimiento':$scope.procedimiento_seleccionado.codigo}, procesar_permisos_procedimiento);			
			} else {
				console.log("Recuperando permisos directos");
				$scope.permisostotales = PermisosDirectosProcedimientoList.query({'codigoprocedimiento':$scope.procedimiento_seleccionado.codigo}, procesar_permisos_procedimiento );			
			}
		}
	}
	
	$scope.setSeleccionGenerico = function(){
		$scope.show_form_add_permiso = false;
		$scope.cumplimentados = 0;
		$scope.count = 1;
		$scope.persona_o_plaza = '';
		$scope.show_details_permiso=false;
		/*** formulario de nuevo usuario limpio**/
		$scope.usuarioencontrado = false;		
		$scope.nuevousuario = {};
		$scope.is_nuevousuario = false;			
		/*** ***/
	}
		
	$scope.loadProcedimientos = function(seleccionado, nodo){
		if (!seleccionado.procedimientos) {
			if (seleccionado.id == nodo.id) {
				// cargamos los procedimientos directamente asignados a este nodo. No recursivamente.
				console.log("Asignando procedimientos");
				seleccionado.procedimientos = ProcedimientoList.query({"idjerarquia":seleccionado.id,"recursivo":0}, function(ps){
					console.log("Recuperados "+ps.length);
					console.log(ps);
				});				
			} else {
				if (nodo.nodes) for(var i=0;i<nodo.nodes.length;i++)
				{
					$scope.loadProcedimientos(seleccionado, nodo.nodes[i]);
				}
			}
		} else console.log("Ya están cargados");
	}

	$scope.colorText = $rootScope.colorText;
	
	$scope.isR = function(permiso) {
		return true;
	}
	
	$scope.isW = function(permiso) {
	
		if ($scope.seleccionado_organica)
			return typeof $scope.seleccionado !== 'undefined' 
				&& typeof $scope.seleccionado.id !== 'undefined' 
				&& typeof permiso.jerarquiadirectaescritura !== 'undefined'
				&& Array.isArray(permiso.jerarquiaescritura)
				&& permiso.jerarquiaescritura.indexOf($scope.seleccionado.id)!==-1;
		else {
				
			return typeof $scope.procedimiento_seleccionado !== 'undefined'
				&& $scope.procedimiento_seleccionado.codigo !== 'undefined'
				&& permiso.procedimientosescritura !== 'undefined'
				&& Array.isArray(permiso.procedimientosescritura) 
				&& permiso.procedimientosescritura.indexOf($scope.procedimiento_seleccionado.codigo)!==-1;			
		}
	}

	$scope.isP = function(permiso) {
		return typeof permiso.grantoption !== 'undefined' 
			&& permiso.grantoption > 0;
	}

	$scope.clickHandler = function(e){
	   e.preventDefault();
	}	
	
	$scope.changeW = function(permiso) {
		if ($scope.isW(permiso)) {
			switch ($scope.seleccionado_organica) {
				case true:
						if (Array.isArray(permiso.jerarquiadirectaescritura))
							permiso.jerarquiadirectaescritura.splice(permiso.jerarquiadirectaescritura.indexOf($scope.seleccionado.id),1);
					break;
				case false:
						if (Array.isArray(permiso.procedimientodirectaescritura))
							permiso.procedimientodirectaescritura.splice(permiso.procedimientodirectaescritura.indexOf($scope.procedimiento_seleccionado.codigo),1);
					break;			
			}
		} else {
			switch ($scope.seleccionado_organica) {
				case true:
						if (Array.isArray(permiso.jerarquiadirectaescritura))
							permiso.jerarquiadirectaescritura.push($scope.seleccionado.id);
						else permiso.jerarquiadirectaescritura = [ $scope.seleccionado.id ];
					break;
				case false:
						if (Array.isArray(permiso.procedimientodirectaescritura))
							permiso.procedimientodirectaescritura.push($scope.procedimiento_seleccionado.codigo);
						else permiso.procedimientodirectaescritura = [$scope.procedimiento_seleccionado.codigo];
					break;			
			}
		}		
		alert('No salvado. por implementar');
	}
	
	$scope.changeP = function(permiso) {
		permiso.grantoption = !permiso.grantoption;
		alert('No salvado. por implementar');
	}
	
	$scope.isFiltroSelected= function(filtro,key,fa){
		return (typeof filtro[key] != 'undefined' && fa.name==filtro[key]);
	};
	
	var personas_plazas_aux = PersonasSearchList.query({},function(err,data){
		$scope.personas_plazas=[];
		for(var i=0;i<personas_plazas_aux.length;i++)
		{
			$scope.personas_plazas.push(personas_plazas_aux[i].data);
		}
	});
	
	$scope.getPersonas = function(viewValue) {
		var regex = ""+viewValue
		if (viewValue.length>2) {
			var p = PersonasByRegexp.query({"regex":viewValue}).$promise;
			return p;
		}
		else return [];
	};

	
	$scope.showPersona = function (persona){
		if (persona && persona.login && persona.codplaza && persona.nombre && persona.apellidos)
			return persona.login + "-" + persona.codplaza + "-" + persona.nombre+ " " + persona.apellidos;
		else return "";
	}	
	
    
	
}
PermisoCtrl.$inject = ['$rootScope','$scope','$location','$window','Arbol','Session','PermisosList','PersonasSearchList','ProcedimientoList','PermisosProcedimientoList','PermisosDirectosProcedimientoList','Jerarquia','Permiso', 'PersonasByPuesto', 'PersonasByLogin', 'PersonasByRegexp','Persona','$q'];
