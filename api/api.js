(function(module){
'use strict';

module.exports.log = function(models){
  return function(req, res, next){
	var Registroactividad = models.registroactividad();
	var data = {
		usr: req.user.login,
		fecha: new Date(),
		url: req.url,
		req: {
			headers: req.headers,
			body: req.body
		}
	};
	(new Registroactividad(data)).save();
	next();
  };
};

module.exports.arbol = function(Q, models){
	return function(req, res){

		var Jerarquia = models.jerarquia();
		var returnValue = [];
		var hijos = [];
		var filterfn;
		if (typeof req.params.withemptynodes === 'undefined'){
			filterfn = function(jerarquia){ return jerarquia.numprocedimientos + jerarquia.numcartas; };
		}
		else{
			filterfn = function(){ return true; };
		}

		Jerarquia.find({}, function(err, jerarquias)
		{
			if (err){
				res.status(500).send(err); console.error(err); return;
			}
			var mappingXid = [];
			var idsraiz = [];
			jerarquias.forEach(function(jerarquia){
				mappingXid [ jerarquia.id ] = jerarquia;
				if (jerarquia.ancestros.length === 0){
					idsraiz.push(jerarquia.id);
				}
				if (jerarquia.ancestrodirecto){
					if (!hijos[ jerarquia.ancestrodirecto ]){
						hijos [ jerarquia.ancestrodirecto ] = [];
					}
					hijos [ jerarquia.ancestrodirecto ].push(jerarquia);
				}
			});

			var getHijos = function ( idjerarquia ){
				if (!hijos[ idjerarquia ]){ return null; }
				var returnval = [];
				for(var i = 0, j = hijos[ idjerarquia ].length; i < j; i++){
					var nodo = hijos[ idjerarquia ][i];
					if (filterfn(nodo)){
						returnval.push({_id: nodo._id, id: nodo.id, title: nodo.nombrelargo, nodes: getHijos( nodo.id ), numprocedimientos: nodo.numprocedimientos, numcartas: nodo.numcartas});
					}
				}
				return returnval;
			};

			idsraiz.forEach(function(idraiz){
				var nodo = mappingXid[idraiz];
				if (filterfn(nodo)){
					returnValue.push({_id: nodo._id, id: nodo.id, title: nodo.nombrelargo, nodes: getHijos(nodo.id), numprocedimientos: nodo.numprocedimientos, numcartas: nodo.numcartas });
				}
			});
			res.json(returnValue);
		});
	};
};

module.exports.raw = function(models){
	return function(req, res){
		var modelname = req.params.modelname;
		var fields = req.query.fields;
		var permitidas = ['reglasinconsistencias', 'crawled'];
		if (typeof models[modelname] !== 'function' || permitidas.indexOf(modelname) === -1)
		{
			console.error(modelname + ' doesn\'t exists in model'); res.status(500).end(); return ;
		}
		var Loader = models[modelname]();
		var restricciones = {'oculto': {'$ne': true}, 'eliminado': {'$ne': true}};
		if (modelname === 'crawled'){
			var ids = [];
			var procedimientos = req.user.permisoscalculados.procedimientoslectura.concat(req.user.permisoscalculados.procedimientosescritura);
			for(var i in procedimientos){
				if (!isNaN( parseInt( procedimientos[i]) ) ){
					ids.push( parseInt( procedimientos[i] ) );
				}
			}
			restricciones.id = { '$in': ids };
		}

		var query = Loader.find(restricciones);

		if (typeof fields !== 'undefined'){
			query.select(fields);
		}
		query.exec(function(err, data){
			if (err) { console.error(err); res.status(500); res.end(); return ; }
			res.json(data);
		});
	};
};

module.exports.aggregate = function(cfg, models){
	return function(req, res){
		var Procedimiento = models.procedimiento();
		var connection = Procedimiento.collection;
		var campostr = req.params.campo;
		var anualidad = req.params.anualidad ? parseInt(req.params.anualidad) : cfg.anyo;
		var group = [];
		var groupfield = {};

			try{
				groupfield._id = JSON.parse(campostr);
			}catch(e){
				groupfield._id = '$' + campostr;
			}

			var match = {};
			var jerarquia = {'idjerarquia': {'$in': req.user.permisoscalculados.jerarquialectura.concat(req.user.permisoscalculados.jerarquiaescritura)}};
			var oculto = {'$or': [
					{'oculto': {$exists: false}},
					{'$and': [
							{'oculto': {$exists: true}},
							{'oculto': false}
						]}
				]
			};
			var eliminado = {'$or': [
					{'eliminado': {$exists: false}},
					{'$and': [
							{'eliminado': {$exists: true}},
							{'eliminado': false}
						]}
				]
			};
			var blancos = {};
			blancos[campostr] = {$ne: ''};
			var matchstr = req.params.match;
			if (typeof matchstr === 'string'){
				try{ //probar
					match = JSON.parse(matchstr);
				}catch(e){
					var condiciones = matchstr.split('|');
					condiciones.forEach(function(condicion){
						var partes = condicion.split(':');
						var campomatch = partes[0];
						var valor = typeof partes[1] !== 'undefined' ? (partes[1]) : '';
						if(/^(\-|\+)?([0-9]+|Infinity)$/.test(valor)){
							valor = parseInt(valor);
						}
						match[campomatch] = valor;
					});
				}
				match = {'$and': [ match, blancos, jerarquia, oculto, eliminado ]};
//				match.idjerarquia = {'$in':req.user.permisoscalculados.jerarquialectura.concat(req.user.permisoscalculados.jerarquiaescritura)};
			} else {
				match = {'$and': [ blancos, jerarquia, oculto, eliminado ]};
			}
			group.push({ '$match': match });
			groupfield.count = {'$sum': 1};
			groupfield.porcumplimentar = { '$sum': {'$cond': [ { '$eq': [0, '$periodos.a' + anualidad + '.totalsolicitudes']}, 1, 0 ] } };

			/*group.push({'$unwind':'$ancestros'});*/
			group.push({'$group': groupfield});
			group.push({'$sort': { 'count': -1 } });
			//console.log(JSON.stringify(group));
			connection.aggregate(group, function(err, data){
				if (err) { console.error(err); res.status(500); res.end(); return ; }
				res.json(data);
			});
	};
};

})(module);
