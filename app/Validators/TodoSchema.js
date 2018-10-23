const Joi = require('joi');

const CreateSchema = Joi.object().keys({
    name: Joi.string().min(3).max(255).required(),
    checkpoint_id: Joi.number().min(1).required(),
    description: Joi.string(),
    creator_id: Joi.number().min(1).required(),
});

const AssignSchema = Joi.object().keys({
    user_id: Joi.number().min(1).required(),
    todo_id: Joi.number().min(1).required()
});

const UpdateSchema = Joi.object().keys({
    name: Joi.string().min(3).max(255),
    description: Joi.string(),
});

module.exports = {
    create: CreateSchema,
    assign: AssignSchema,
    update: UpdateSchema
};
