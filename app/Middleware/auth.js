// Initialize firebase;
const firebase = require('firebase-admin');

// Initialize response helper;
const responseHelper = require('./../../helpers/response');
const globalModel =  require('./../Models/index');
const User = globalModel.users;

const Admins = globalModel.admins;
const jwt = require('jsonwebtoken');

const authMiddleware = {
    // Method handler for intercept request with auth;
    auth: function (request, response, next)
    {
        if (!request.headers.authorization || request.headers.authorization === '')
        {
            response.status(400);
            responseHelper.setResponseError('Token does not exist!');
            responseHelper.sendResponse(response);
        }
        else
        {
            let  token = request.headers.authorization;
            token = token.replace('Bearer ','');
            jwt.verify(token,process.env.JWT_KEY, async function(Error,Decoded){
                if(!Error)
                {   
                    let user = await User.findOne({
                        where:{
                            name:Decoded.name,
                            email:Decoded.email
                        }
                    });

                    if(user)
                    {
                        request.auth = user;
                        next();
                    }else{
                        response.status(400);
                        response.send({success:false,error:'There are no such user founded'});
                    }
                    
                    

                }else{
                    response.status(400);
                    response.send({success:false,error:Error});
                }
            });
            
        }
    },

    admin:async function (request, response, next)
    {
        if(request.auth && request.auth.role == 1)
        {
            next();
        }else{
            
            response.status(400);
            response.send({success:false,error:"You are not admin",user:request.body.auth});
        
        }
    }

};


// Export auth interceptor handler;
module.exports = authMiddleware;