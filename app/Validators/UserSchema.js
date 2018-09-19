const Joi = require('joi');

const LoginSchema = Joi.object().keys({
    password: Joi.string().regex(/^[a-zA-Z0-9]{3,30}$/).required(),
    email: Joi.string().email().required()
});

const RegisterSchema = Joi.object().keys({
	name: Joi.string().min(3).max(30).required(),
    email: Joi.string().email(),
    password: Joi.string().regex(/^[a-zA-Z0-9]{3,30}$/)
});

const UpdateSchema =  Joi.object().keys({
    name: Joi.string().min(3).max(30),
    email: Joi.string().email(),
    invitation_date: Joi.date(),
    occupation: Joi.number().min(0).max(2)
});

module.exports = {
	login: LoginSchema,
	register: RegisterSchema,
    update: UpdateSchema
};