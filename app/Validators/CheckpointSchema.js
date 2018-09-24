const Joi = require('joi');

const CreateSchema = Joi.object().keys({
    name: Joi.string().min(3).max(255).required(),
    skill_id: Joi.number().min(1).required(),
    roadmap_id: Joi.number().min(1).required(),
    description: Joi.string(),
    creator_id: Joi.number().min(1).required()
});

const AssignSchema = Joi.object().keys({
    user_id: Joi.number().min(1).required(),
    checkpoint_id: Joi.number().min(1).required(),
    roadmap_id: Joi.number().min(1).required(),

});

const SwapSchema = Joi.object().keys({
   index: Joi.number().min(1).required()
});

module.exports = {
    create: CreateSchema,
    assign: AssignSchema,
    swap: SwapSchema
};