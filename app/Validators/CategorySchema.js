const Joi = require('joi');

const CreateSchema = Joi.object({
    title: Joi.string().required(),
    description: Joi.string()
});

const UpdateSchema = Joi.object({
    title: Joi.string(),
    description: Joi.string()
});

module.exports = {
    create: CreateSchema,
    update: UpdateSchema
};