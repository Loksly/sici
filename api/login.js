exports.authenticate = function(config){



	var jwt = config.jwt;
	var secret = config.secret;
	var Persona = config.models.persona();
	var Permisos = config.models.permiso();

	if (!jwt || !secret || !Persona || ! Permisos)
		throw new Error('bad config for authenticate method');

	return function(req, res){

		//should delegate 
		//if is invalid, return 401
		//for testing this should be enough
		if (req.body.password !== 'password') {
		  res.send(401, 'Wrong user or password');		  
		  return;
		}

		Persona.find( { login: req.body.username, habilitado:true },
			function(err,persona){			
				if (err ||persona.length===0)
				{
					res.send(401, 'Wrong user or password');					
					return;
				}

				var token = jwt.sign(persona[0], secret, { expiresInMinutes: 60*5 });
				res.json({ profile: persona[0], token: token });
			}
		);
  }
}
