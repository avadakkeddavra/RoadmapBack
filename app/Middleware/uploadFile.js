const fs = require('fs');
const User = require('./../Models/index').users;
const UploadFileMiddleware = {
    upload: async function(Request,Response,next){
        var img = new Buffer(Request.body.avatar, 'base64');
        var matches = Request.body.avatar.match(/^data:([A-Za-z-+\/]+);base64,(.+)$/), response = {};
        if (matches.length !== 3) {
            Response.send({message: 'invalid request'})
        }
        else{
            let user = await User.findById(Request.body.userId);
            var filename = this.generateFileName()+'.png';
            if(user.avatar) {
             filename = user.avatar;
            }
            response.type = matches[1];
            response.data = new Buffer(matches[2], 'base64');
            var saveFileAs = 'assets/images/'+ filename;
            fs.unlink(saveFileAs, function() {
                fs.writeFile(saveFileAs, response.data, function(err) {if(err) { /* error saving image */}});
            });
            Request.file = {};
            Request.file = {
                filename:filename
            };
            next();
        }
    },
    generateFileName: function() {
        return Math.random().toString(36).slice(-8);
    }
}

module.exports = UploadFileMiddleware;
