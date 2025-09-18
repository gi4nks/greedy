import Joi from 'joi';
import { Request, Response, NextFunction } from 'express';

// Character validation schemas
export const characterSchema = Joi.object({
  name: Joi.string().required().min(1).max(100).trim(),
  race: Joi.string().max(50).trim().allow(null, ''),
  class: Joi.string().max(50).trim().allow(null, ''),
  level: Joi.number().integer().min(1).max(20).default(1),
  background: Joi.string().max(100).trim().allow(null, ''),
  alignment: Joi.string().max(50).trim().allow(null, ''),
  experience: Joi.number().integer().min(0).default(0),
  adventure_id: Joi.number().integer().positive().allow(null),

  // Ability scores
  strength: Joi.number().integer().min(1).max(30).default(10),
  dexterity: Joi.number().integer().min(1).max(30).default(10),
  constitution: Joi.number().integer().min(1).max(30).default(10),
  intelligence: Joi.number().integer().min(1).max(30).default(10),
  wisdom: Joi.number().integer().min(1).max(30).default(10),
  charisma: Joi.number().integer().min(1).max(30).default(10),

  // Combat stats
  hitPoints: Joi.number().integer().min(0).default(0),
  maxHitPoints: Joi.number().integer().min(0).default(0),
  armorClass: Joi.number().integer().min(0).max(50).default(10),
  initiative: Joi.number().integer().min(-10).max(10).default(0),
  speed: Joi.number().integer().min(0).max(200).default(30),
  proficiencyBonus: Joi.number().integer().min(0).max(10).default(2),

  // Complex objects
  savingThrows: Joi.object().pattern(Joi.string(), Joi.boolean()).allow(null),
  skills: Joi.object().pattern(Joi.string(), Joi.boolean()).allow(null),
  equipment: Joi.array().items(Joi.string()).allow(null),
  weapons: Joi.array().items(Joi.object()).allow(null),
  spells: Joi.array().items(Joi.object()).allow(null),

  // Spellcasting
  spellcastingAbility: Joi.string().valid('strength', 'dexterity', 'constitution', 'intelligence', 'wisdom', 'charisma').allow(null),
  spellSaveDC: Joi.number().integer().min(0).max(30).allow(null),
  spellAttackBonus: Joi.number().integer().min(-10).max(20).allow(null),

  // Background & personality
  personalityTraits: Joi.string().max(1000).allow(null, ''),
  ideals: Joi.string().max(1000).allow(null, ''),
  bonds: Joi.string().max(1000).allow(null, ''),
  flaws: Joi.string().max(1000).allow(null, ''),
  backstory: Joi.string().max(5000).allow(null, ''),

  // Legacy fields (for backward compatibility)
  role: Joi.string().max(100).trim().allow(null, ''),
  description: Joi.string().max(2000).allow(null, ''),
  tags: Joi.array().items(Joi.string().max(50)).allow(null),

  // Additional fields
  classes: Joi.array().items(Joi.object()).allow(null)
});

// Magic item validation schema
export const magicItemSchema = Joi.object({
  name: Joi.string().required().min(1).max(200).trim(),
  rarity: Joi.string().valid('Common', 'Uncommon', 'Rare', 'Very Rare', 'Legendary', 'Artifact').allow(null, ''),
  type: Joi.string().max(100).trim().allow(null, ''),
  description: Joi.string().max(2000).allow(null, ''),
  properties: Joi.object().allow(null),
  attunement_required: Joi.boolean().default(false)
});

// Session validation schema
export const sessionSchema = Joi.object({
  title: Joi.string().required().min(1).max(200).trim(),
  date: Joi.string().required().pattern(/^\d{4}-\d{2}-\d{2}$/),
  text: Joi.string().required().min(1).max(50000),
  adventure_id: Joi.number().integer().positive().allow(null)
});

// Location validation schema
export const locationSchema = Joi.object({
  name: Joi.string().required().min(1).max(200).trim(),
  description: Joi.string().max(2000).allow(null, ''),
  notes: Joi.string().max(10000).allow(null, ''),
  tags: Joi.array().items(Joi.string().max(50)).allow(null),
  adventure_id: Joi.number().integer().positive().allow(null)
});

// NPC validation schema
export const npcSchema = Joi.object({
  name: Joi.string().required().min(1).max(200).trim(),
  role: Joi.string().max(100).trim().allow(null, ''),
  description: Joi.string().max(2000).allow(null, ''),
  tags: Joi.array().items(Joi.string().max(50)).allow(null),
  adventure_id: Joi.number().integer().positive().allow(null)
});

// Validation middleware factory
export function validateBody(schema: Joi.ObjectSchema) {
  return (req: Request, res: Response, next: NextFunction) => {
    const { error, value } = schema.validate(req.body, { abortEarly: false, stripUnknown: true });

    if (error) {
      const errors = error.details.map((detail: Joi.ValidationErrorItem) => ({
        field: detail.path.join('.'),
        message: detail.message
      }));

      return res.status(400).json({
        error: 'Validation failed',
        details: errors
      });
    }

    // Replace req.body with validated and sanitized data
    req.body = value;
    next();
  };
}

// ID parameter validation
export function validateId(req: Request, res: Response, next: NextFunction) {
  const id = parseInt(req.params.id);
  if (isNaN(id) || id <= 0) {
    return res.status(400).json({ error: 'Invalid ID parameter' });
  }
  req.params.id = id.toString();
  next();
}

// Query parameter validation for pagination
export function validatePagination(req: Request, res: Response, next: NextFunction) {
  const page = parseInt(req.query.page as string) || 1;
  const limit = parseInt(req.query.limit as string) || 20;

  if (page < 1 || limit < 1 || limit > 100) {
    return res.status(400).json({ error: 'Invalid pagination parameters' });
  }

  req.query.page = page.toString();
  req.query.limit = limit.toString();
  next();
}