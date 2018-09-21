const Joi = require('joi');

const CreateSchema = Joi.object().keys({
    name: Joi.string().min(3).max(255).required(),
    checkpoint_id: Joi.number().min(1).required(),
    description: Joi.string()
});

const AssignSchema = Joi.object().keys({
    user_id: Joi.number().min(1).required(),
    todo_id: Joi.number().min(1).required()
});

module.exports = {
    create: CreateSchema,
    assign: AssignSchema
};