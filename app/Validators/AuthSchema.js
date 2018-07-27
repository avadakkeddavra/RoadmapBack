const Joi = require('joi');

const AuthSchema = Joi.object({
	id: Joi.number().min(1).required(),
	name: Joi.string().min(3).max(30).required(),
    email: Joi.string().email().required(),
    role: Joi.number().required(),
    created_at: Joi.date().timestamp(),
    updated_at: Joi.date().timestamp()
});


module.exports = AuthSchema