'use strict';

exports.getPeriodo = function(models){
	return function(req,res){
		var periodo = models.periodo();
		var _id = req.params._id;
		if (_id)
		{
			etiqueta.findOne({'_id':id},function(err,data){
				if (err) { console.error(err); res.status(500); res.end(); return ; }
				res.json (data);
			});
		}
		periodo.find({},function(err,data){
			if (err) { console.error(err); res.status(500); res.end(); return ; }
			res.json (data);
		});
	}
}


exports.updatePeriodo = function(models){
	return function(req, res) {
		var periodo = models.periodo();
	    var id = req.params.id;

	    var content = req.body;
	    periodo.update({'_id':id}, content, { upsert: true }, function(e){
			if (e){
				 res.send({'error':'An error has occurred'});
			}else{
				res.send(content);
			}
		});
	}
}

exports.newPeriodo = function(models){
	return function(req, res) {
		var periodo = models.periodo();
	    var content = req.body;
	    new periodo(content).save( function(e){
		//etiqueta.update({'_id':id}, content, { upsert: true }, function(e){
			if (e){
				 res.send({'error':'An error has occurred'});
			}else{
				res.send(content);
			}
		});
	}
}

exports.removePeriodo = function(models){
	return function(req, res) {
		var periodo = models.periodo();
	    var id = req.params.id;
	    var content = req.body;
	    periodo.remove({'_id':id}, function(e){
			if (e){
				 res.send({'error':'An error has occurred'});
			}else{
				res.send(content);
			}
		});
	}
}