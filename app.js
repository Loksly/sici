'use strict';
var memwatch = require('memwatch');
var express = require('express'),
        http = require('http'),
        Q = require('q'),
        path = require('path'),
        mongoose = require('mongoose'),
        app = module.exports = express(),
        expressJwt = require('express-jwt'),
        jwt = require('jsonwebtoken'),
        recalculate = require('./api/recalculate'),
        routes = require('./routes'),
        models = require('./api/models'),
        api = require('./api/api'),
        login = require('./api/login'),
        jerarquia = require('./api/jerarquia'),
        importador = require('./api/importador'),
        reglainconsistencia = require('./api/reglainconsistencia'),
        expediente = require('./api/expediente'),
        etiqueta = require('./api/etiqueta'),
        periodos = require('./api/periodos'),
        procedimiento = require('./api/procedimiento'),
        persona = require('./api/persona'),
        permiso = require('./api/permiso'),
        upload = require('./api/upload'),
        logincarm = require('./api/login.carm'),
        exportador = require('./api/exportador'),
        md5 = require('MD5'),
        path = require('path'),
        csvsici = require('./api/csvsici');

app.set('mongosrv', process.env.MONGOSVR || 'mongodb://mongosvr/sici');


//Inicialización mongoose
mongoose.connect(app.get('mongosrv'));
models.init(mongoose);
var ObjectId = mongoose.Types.ObjectId;


var Settings = models.settings();
Settings.find().sort({'version': -1}).limit(1).exec(function (err, cfgs) {
    if (err)
        throw err;

    var cfg = cfgs[0];

    app.disable('x-powered-by');
    app.set('port', process.env.PORT || cfg.port || 6000);
    app.set('prefixtmp', __dirname + path.sep + 'tmp' + path.sep);

    app.use(express.json());
    app.use(express.urlencoded());
    app.use(express.bodyParser());
    app.use(express.static(path.join(__dirname, 'public')));
    app.use(express.multipart({uploadDir: '/tmp/sici'}));

    app.use(express.errorHandler());
    mongoose.set('debug', false);

    app.use('/api', expressJwt({secret: cfg.secret}));
    app.use('/api', login.setpermisoscalculados({models: models}));
    app.use('/api', api.log(models));

    if (cfg.logincarm)
        app.post('/authenticate', logincarm.uncrypt(cfg.urlbasedecrypt), login.authenticate({secret: cfg.secret, jwt: jwt, models: models}));
    else
        app.post('/authenticate', login.authenticate({secret: cfg.secret, jwt: jwt, models: models}));

    app.get('/', routes.index);

    app.post('/api/pretend/:username', login.pretend({secret: cfg.secret, jwt: jwt, models: models}));

    app.get('/api/arbol', api.arbol(Q, models));
	app.get('/api/arbol/:withemptynodes', api.arbol(Q, models));

    app.get('/api/raw/:modelname', api.raw(models));
    app.get('/api/aggregate/:anualidad/:campo', api.aggregate(cfg, models));
    app.get('/api/aggregate/:anualidad/:campo/:match', api.aggregate(cfg, models));


    app.get('/api/gs/:id', importador.parseGS());
    app.get('/api/cr/:id', importador.parseCr(Q, models));
    app.get('/api/exportador/informe/:year', exportador.exportarInforme(models, app, md5, Q));
    app.get('/api/exportador/procedimiento/:codigo/:year', exportador.tablaResultadosProcedimiento(models, app, md5, Q));
    app.get('/api/exportador/jerarquia/:jerarquia', exportador.tablaResultadosJerarquia(models, app, md5, Q));


    app.get('/api/personasByPuesto/:cod_plaza', persona.personasByPuesto(models));
    app.get('/api/personasByLogin/:login', persona.personasByLogin(models));
    app.get('/api/PersonasByRegexp/:regex', persona.personasByRegex(models, Q));
    app.get('/api/searchpersonas', persona.personassearchlist(models, Q));
    app.post('/api/persona', persona.newPersona(models));
    app.put('/api/persona/:id', persona.updatePersona(models));
    app.get('/persona/infoByLogin/:login', persona.infoByLogin2(cfg));
    app.get('/persona/infoByPlaza/:codplaza', persona.infoByPlaza2(cfg));


//  app.get('/api/periodos', procedimiento.setPeriodosCerrados(models));

    app.get('/api/periodos', periodos.getPeriodo(models));
    app.get('/api/periodos/:id', periodos.getPeriodo(models));
    app.put('/api/periodos/:id', periodos.updatePeriodo(models));
    app.post('/api/periodos/:id', periodos.newPeriodo(models));
    app.delete('/api/periodos/:id', periodos.removePeriodo(models));
    app.get('/api/createanualidad/:anyo', periodos.nuevaAnualidad(models));

    app.get('/api/procedimiento', procedimiento.procedimiento(models));
    app.get('/api/procedimientoList/:idjerarquia/:recursivo', procedimiento.procedimientoList(models, Q));
    app.get('/api/procedimientoList/:idjerarquia', procedimiento.procedimientoList(models, Q));

    app.get('/api/procedimiento/:codigo', procedimiento.procedimiento(models));
    app.delete('/api/procedimiento/:codigo', procedimiento.deleteProcedimiento(Q, models, recalculate));
    app.put('/api/procedimiento/:codigo', procedimiento.updateProcedimiento(Q, models, recalculate, persona));
    //app.post('/api/procedimiento', procedimiento.createProcedimiento(Q, models, recalculate) );
    app.post('/api/procedimiento/:codigo', procedimiento.createProcedimiento(Q, models, recalculate));
    
    app.get('/api/procedimientosSinExpedientes', procedimiento.procedimientosSinExpedientes(cfg,models));
    app.get('/api/procedimientosSinExpedientes/:anualidad', procedimiento.procedimientosSinExpedientes(cfg,models));
    app.get('/api/procedimientoHasChildren/:codigo', procedimiento.hasChildred(models));
	app.get('/api/procedimientosByResponsable/:codplaza', procedimiento.procedimientosByResponsable(models,Q));

    app.get('/api/procedimientoCount', procedimiento.totalProcedimientos(models));
    app.get('/api/tramiteCount', procedimiento.totalTramites(cfg, models));
    app.get('/api/ratioResueltos', procedimiento.ratioResueltos(cfg, models));
    app.get('/api/tramitesMediaMes', procedimiento.mediaMesTramites(cfg, models));
    app.get('/api/tramiteCount/:anualidad', procedimiento.totalTramites(cfg, models));
    app.get('/api/ratioResueltos/:anualidad', procedimiento.ratioResueltos(cfg, models));
    app.get('/api/tramitesMediaMes/:anualidad', procedimiento.mediaMesTramites(cfg, models));


    app.get('/api/jerarquia/:idjerarquia', jerarquia.getNodoJerarquia(models));
	app.get('/api/jerarquiaacestros/:idjerarquia',jerarquia.getAncestros(models));
	app.get('/api/jerarquia/resumen/:idjerarquia', jerarquia.getResumenJerarquia(models,Q,exportador));

    app.get('/api/reglasinconsistencias', reglainconsistencia.getReglaInconsistencia(models));
    app.post('/api/reglasinconsistencias', reglainconsistencia.newReglaInconsistencia(models));
    app.put('/api/reglasinconsistencias/:id', reglainconsistencia.updateReglaInconsistencia(models));
    app.delete('/api/reglasinconsistencias/:id', reglainconsistencia.removeReglaInconsistencia(models));


    app.post('/api/v1/expediente/:procedimiento', expediente.initExpediente(models));
    app.put('/api/v1/expediente/:procedimiento/:id', expediente.updateExpediente(models));
    app.get('/api/v1/expediente/:procedimiento/:id', expediente.expediente(models));
    app.delete('/api/v1/expediente/:procedimiento/:id', expediente.deleteExpediente(models));

    app.get('/api/etiqueta', etiqueta.getEtiqueta(models));
    app.put('/api/etiqueta/:id', etiqueta.updateEtiqueta(models));
    app.post('/api/etiqueta/:id', etiqueta.newEtiqueta(models));
    app.delete('/api/etiqueta/:id', etiqueta.removeEtiqueta(models));

    app.get('/api/fprocedimiento', recalculate.fprocedimiento(Q, models, procedimiento));
    app.get('/api/fjerarquia', recalculate.fjerarquia(Q, models));
    app.get('/api/fpermiso', recalculate.fpermiso(Q, models));

    app.get('/api/permisosList/:idjerarquia/:recursivo', permiso.permisosList(models, Q));
    app.get('/api/permisosList', permiso.permisosList(models, Q));
    app.get('/api/permisosByLoginPlaza/:login/:cod_plaza', permiso.permisosByLoginPlaza(models, Q));
    app.get('/api/permisosDirectosProcedimientoList/:codigoprocedimiento', permiso.permisosDirectosProcedimientoList(models, Q));
    app.get('/api/permisosProcedimientoList/:codigoprocedimiento', permiso.permisosProcedimientoList(models, Q));
    //app.get('/api/permisosCalculados', login.permisoscalculados(models)); 
    app.get('/api/permisos/delete-jerarquia/:idpermiso/:idjerarquia', permiso.removePermisoJerarquia(models, Q, recalculate));
    app.get('/api/permisos/delete-procedimiento/:idpermiso/:idprocedimiento', permiso.removePermisoJerarquia(models, Q, recalculate));
    app.put('/api/permisos/:id', permiso.update(models,recalculate,Q));
    app.get('/api/permisos/:id', permiso.get(models));
    app.delete('/api/permisos/:id', permiso.removePermiso(models, Q, recalculate, ObjectId));
    app.post('/api/permisos', permiso.create(models, Q, recalculate));
    app.get('/api/permisoscalculados', login.getpermisoscalculados(models));
    app.get('/api/permisosdelegar/:login/:cod_plaza', permiso.delegarpermisos(models, Q, recalculate));
    app.get('/api/permisosdelegar/:login/:cod_plaza/:procedimiento', permiso.delegarpermisosProcedimiento(models, Q));

	app.get('/api/exportador/jerarquia/:jerarquia', exportador.tablaResultadosJerarquia(models, app, md5, Q));
	
    app.get('/api/excelgesper', persona.importarGesper(models, Q));


    app.get('/api/importacion', importador.importacionesprocedimiento(models));
    app.post('/api/importacion/:_id', importador.applyImportacionProcedimiento(models, Q, recalculate, procedimiento));
    app.delete('/api/importacion/:_id', importador.removeImportacionProcedimiento(models));


    app.post('/api/updateByFile', upload.update(), csvsici.parse(models));
    app.post('/api/updateByFileIE', upload.update(), csvsici.parse(models));

    app.get('/personas/actualizarGesper', persona.updateCodPlazaByLogin(models, Q));

    app.get('/tipologin.js', function (req, res) {
        var r = (cfg.logincarm) ?
                '$("body").append("<script src=\'/js/logincarm.util.js\'></script>");' :
                '$("body").append("<script src=\'/js/login.util.js\'></script>");';

        res.status(200).type('application/javascript').send(r);
    });

    app.get('/test/testImportadorExcel', importador.testImportadorExcel(Q, models, recalculate));
    app.get('/test/testImportadorExcel/:firstrow/:maxrows', importador.testImportadorExcel(Q, models, recalculate));


    app.get('/download/:token/:hash', function (req, res, next) {
        var fs = require('fs');
        var filename = req.params.token + '.xlsx', ruta = app.get('prefixtmp'), rutaefectiva = path.resolve(ruta, filename);
        if (md5('sicidownload7364_' + req.params.token) === req.params.hash) {
            fs.exists(ruta + filename, function (exists) {
                if (exists) {
                    if (path.dirname(rutaefectiva) + path.sep === ruta) {
                        res.download(ruta + filename, filename, function (err) {
                            if (err) {
                                console.error(err);
                            } else {
                                console.log('Fichero ' + ruta + filename + '.xlsx descargado');
                                fs.unlink(ruta + filename, function (err) {
                                    if (err) {
                                        console.error('No se ha podido borrar el fichero ' + ruta + filename);
                                    } else {
                                        console.log('Fichero ' + ruta + filename + ' borrado');
                                    }
                                });
                            }
                        });
                    } else {
                        console.error('Acceso denegado:' + ruta + filename);
                        res.status(404).send('Acceso denegado');
                    }
                } else {
                    console.error('Fichero no válido' + ruta + filename);
                    res.status(404).send('Fichero no válido');
                }
            });
        } else {
            res.status(404).send('Hash no válido');
        }
    });

    var previousinvoke =  new memwatch.HeapDiff();
    app.get('/memory', function(req,res){
        if (global && global.gc) global.gc();
        var diff = previousinvoke.end();
        previousinvoke = new memwatch.HeapDiff();
        diff.change.details.sort(function(a,b){ return (b.size_bytes - a.size_bytes); });
        res.json(diff);
    })

    // redirect all others to the index (HTML5 history)
    app.get('*', routes.index);//devolver el index.html del raiz

    var server = http.createServer(app);
    server.listen(app.get('port'), function () {
        require('./api/socketioconsole')(server);
        console.log('Express server listening on port ' + app.get('port'));
    });
});
