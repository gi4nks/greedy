import Joi from 'joi';
import { Request, Response, NextFunction } from 'express';

// Character validation schemas
export const characterSchema = Joi.object({
  name: Joi.string().required().min(1).max(100).trim(),
  character_type: Joi.string().valid('pc', 'npc', 'monster').default('pc'),
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

// Character update validation schema (allows partial updates)
export const characterUpdateSchema = Joi.object({
  name: Joi.string().max(100).trim().allow('').optional(),
  character_type: Joi.string().valid('pc', 'npc', 'monster').optional(),
  race: Joi.string().max(50).trim().allow(null, '').optional(),
  class: Joi.string().max(50).trim().allow(null, '').optional(),
  level: Joi.number().integer().min(1).max(20).optional(),
  background: Joi.string().max(100).trim().allow(null, '').optional(),
  alignment: Joi.string().max(50).trim().allow(null, '').optional(),
  experience: Joi.number().integer().min(0).optional(),
  adventure_id: Joi.number().integer().positive().allow(null).optional(),

  // Ability scores
  strength: Joi.number().integer().min(1).max(30).optional(),
  dexterity: Joi.number().integer().min(1).max(30).optional(),
  constitution: Joi.number().integer().min(1).max(30).optional(),
  intelligence: Joi.number().integer().min(1).max(30).optional(),
  wisdom: Joi.number().integer().min(1).max(30).optional(),
  charisma: Joi.number().integer().min(1).max(30).optional(),

  // Combat stats
  hitPoints: Joi.number().integer().min(0).optional(),
  maxHitPoints: Joi.number().integer().min(0).optional(),
  armorClass: Joi.number().integer().min(0).max(50).optional(),
  initiative: Joi.number().integer().min(-10).max(10).optional(),
  speed: Joi.number().integer().min(0).max(200).optional(),
  proficiencyBonus: Joi.number().integer().min(0).max(10).optional(),

  // Complex objects
  savingThrows: Joi.object().pattern(Joi.string(), Joi.boolean()).allow(null).optional(),
  skills: Joi.object().pattern(Joi.string(), Joi.boolean()).allow(null).optional(),
  equipment: Joi.array().items(Joi.string()).allow(null).optional(),
  weapons: Joi.array().items(Joi.object()).allow(null).optional(),
  spells: Joi.array().items(Joi.object()).allow(null).optional(),

  // Spellcasting
  spellcastingAbility: Joi.string().valid('strength', 'dexterity', 'constitution', 'intelligence', 'wisdom', 'charisma').allow(null).optional(),
  spellSaveDC: Joi.number().integer().min(0).max(30).allow(null).optional(),
  spellAttackBonus: Joi.number().integer().min(-10).max(20).allow(null).optional(),

  // Background & personality
  personalityTraits: Joi.string().max(1000).allow(null, '').optional(),
  ideals: Joi.string().max(1000).allow(null, '').optional(),
  bonds: Joi.string().max(1000).allow(null, '').optional(),
  flaws: Joi.string().max(1000).allow(null, '').optional(),
  backstory: Joi.string().max(5000).allow(null, '').optional(),

  // Legacy fields (for backward compatibility)
  role: Joi.string().max(100).trim().allow(null, '').optional(),
  description: Joi.string().max(2000).allow(null, '').optional(),
  tags: Joi.array().items(Joi.string().max(50)).allow(null).optional(),

  // Additional fields
  classes: Joi.array().items(Joi.object()).allow(null).optional()
}).min(0);

// Quest validation schema
export const questSchema = Joi.object({
  title: Joi.string().required().min(1).max(200).trim(),
  description: Joi.string().max(2000).allow(null, ''),
  status: Joi.string().valid('active', 'completed', 'cancelled', 'on-hold').default('active'),
  priority: Joi.string().valid('low', 'medium', 'high', 'urgent').default('medium'),
  type: Joi.string().valid('main', 'side', 'personal', 'guild').default('main'),
  due_date: Joi.string().pattern(/^\d{4}-\d{2}-\d{2}$/).allow(null, ''),
  assigned_to: Joi.number().integer().positive().allow(null),
  tags: Joi.array().items(Joi.string().max(50)).allow(null),
  adventure_id: Joi.number().integer().positive().allow(null)
});

// Quest update validation schema (allows partial updates)
export const questUpdateSchema = Joi.object({
  title: Joi.string().max(200).trim().allow('').optional(),
  description: Joi.string().max(2000).allow(null, '').optional(),
  status: Joi.string().valid('active', 'completed', 'cancelled', 'on-hold').optional(),
  priority: Joi.string().valid('low', 'medium', 'high', 'urgent').optional(),
  type: Joi.string().valid('main', 'side', 'personal', 'guild').optional(),
  due_date: Joi.string().pattern(/^\d{4}-\d{2}-\d{2}$/).allow(null, '').optional(),
  assigned_to: Joi.number().integer().positive().allow(null).optional(),
  tags: Joi.array().items(Joi.string().max(50)).allow(null).optional(),
  adventure_id: Joi.number().integer().positive().allow(null).optional()
}).min(0);

// Magic item validation schema
export const magicItemSchema = Joi.object({
  name: Joi.string().required().min(1).max(200).trim(),
  rarity: Joi.string().valid('Common', 'Uncommon', 'Rare', 'Very Rare', 'Legendary', 'Artifact').allow(null, ''),
  type: Joi.string().max(100).trim().allow(null, ''),
  description: Joi.string().max(2000).allow(null, ''),
  properties: Joi.object().allow(null),
  attunement_required: Joi.boolean().default(false)
});

// Magic item update validation schema (allows partial updates)
export const magicItemUpdateSchema = Joi.object({
  name: Joi.string().max(200).trim().allow('').optional(),
  rarity: Joi.string().valid('Common', 'Uncommon', 'Rare', 'Very Rare', 'Legendary', 'Artifact').allow(null, '').optional(),
  type: Joi.string().max(100).trim().allow(null, '').optional(),
  description: Joi.string().max(2000).allow(null, '').optional(),
  properties: Joi.object().allow(null).optional(),
  attunement_required: Joi.boolean().optional()
}).min(0);
export const sessionSchema = Joi.object({
  title: Joi.string().required().min(1).max(200).trim(),
  date: Joi.string().required().pattern(/^\d{4}-\d{2}-\d{2}$/),
  text: Joi.string().required().min(1).max(50000),
  adventure_id: Joi.number().integer().positive().allow(null)
});

// Session update validation schema (allows partial updates)
export const sessionUpdateSchema = Joi.object({
  title: Joi.string().max(200).trim().allow('').optional(),
  date: Joi.string().pattern(/^\d{4}-\d{2}-\d{2}$/).optional(),
  text: Joi.string().max(50000).allow('').optional(),
  adventure_id: Joi.number().integer().positive().allow(null).optional()
}).min(0);

// Location validation schema
export const locationSchema = Joi.object({
  name: Joi.string().required().min(1).max(200).trim(),
  description: Joi.string().max(2000).allow(null, ''),
  notes: Joi.string().max(10000).allow(null, ''),
  tags: Joi.array().items(Joi.string().max(50)).allow(null),
  adventure_id: Joi.number().integer().positive().allow(null)
});

// Location update validation schema (allows partial updates)
export const locationUpdateSchema = Joi.object({
  name: Joi.string().max(200).trim().allow('').optional(),
  description: Joi.string().max(2000).allow(null, '').optional(),
  notes: Joi.string().max(10000).allow(null, '').optional(),
  tags: Joi.array().items(Joi.string().max(50)).allow(null).optional(),
  adventure_id: Joi.number().integer().positive().allow(null).optional()
}).min(0);

// NPC validation schema
export const npcSchema = Joi.object({
  name: Joi.string().required().min(1).max(200).trim(),
  role: Joi.string().max(100).trim().allow(null, ''),
  description: Joi.string().max(2000).allow(null, ''),
  tags: Joi.array().items(Joi.string().max(50)).allow(null),
  adventure_id: Joi.number().integer().positive().allow(null)
});

// NPC update validation schema (allows partial updates)
export const npcUpdateSchema = Joi.object({
  name: Joi.string().max(200).trim().allow('').optional(),
  role: Joi.string().max(100).trim().allow(null, '').optional(),
  description: Joi.string().max(2000).allow(null, '').optional(),
  tags: Joi.array().items(Joi.string().max(50)).allow(null).optional(),
  adventure_id: Joi.number().integer().positive().allow(null).optional()
}).min(0);

// Campaign validation schema
export const campaignSchema = Joi.object({
  title: Joi.string().required().min(1).max(200).trim(),
  description: Joi.string().max(2000).allow(null, ''),
  status: Joi.string().valid('active', 'completed', 'on-hold', 'cancelled').default('active'),
  start_date: Joi.string().pattern(/^\d{4}-\d{2}-\d{2}$/).allow(null, ''),
  end_date: Joi.string().pattern(/^\d{4}-\d{2}-\d{2}$/).allow(null, ''),
  tags: Joi.array().items(Joi.string().max(50)).allow(null)
});

// Adventure validation schema
export const adventureSchema = Joi.object({
  slug: Joi.string().max(100).trim().allow(null, ''),
  title: Joi.string().required().min(1).max(200).trim(),
  description: Joi.string().max(2000).allow(null, ''),
  campaign_id: Joi.number().integer().positive().allow(null)
});

// Adventure update validation schema (allows partial updates)
export const adventureUpdateSchema = Joi.object({
  slug: Joi.string().max(100).trim().allow('').optional(),
  title: Joi.string().max(200).trim().allow('').optional(),
  description: Joi.string().max(2000).allow(null).optional(),
  campaign_id: Joi.number().integer().positive().allow(null).optional()
}).min(0);

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