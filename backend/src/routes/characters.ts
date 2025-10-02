 import express, { Request, Response } from 'express';
import { db } from '../../db';
import { parseTags, stringifyTags } from '../utils';
import { validateBody, validateId, characterSchema, characterUpdateSchema } from '../middleware/validation';
import { asyncHandler, APIError } from '../middleware/errorHandler';
import { Character } from '@greedy/shared';

const router = express.Router();

router.get('/', (req: Request, res: Response) => {
  const adventure = req.query.adventure || null;
  let rows;
  if (adventure) rows = db.prepare('SELECT * FROM characters WHERE adventure_id = ?').all(adventure as any);
  else rows = db.prepare('SELECT * FROM characters').all();
  rows.forEach((r: any) => {
    r.tags = parseTags(r.tags);
    // Parse JSON fields
    if (r.classes) r.classes = JSON.parse(r.classes);
    if (r.saving_throws) r.saving_throws = JSON.parse(r.saving_throws);
    if (r.skills) r.skills = JSON.parse(r.skills);
    if (r.equipment) r.equipment = JSON.parse(r.equipment);
    if (r.weapons) r.weapons = JSON.parse(r.weapons);
    if (r.spells) r.spells = JSON.parse(r.spells);

    // Add images
    r.images = db.prepare(`
      SELECT id, image_path, display_order
      FROM entity_images
      WHERE entity_type = 'characters' AND entity_id = ?
      ORDER BY display_order ASC
    `).all(r.id);
  });
  res.json(rows);
});

router.get('/:id', validateId, (req: Request, res: Response) => {
  const row = db.prepare('SELECT * FROM characters WHERE id = ?').get(req.params.id as any) as any;
  if (!row) {
    throw new APIError('Character not found', 404);
  }

  // Parse JSON fields
  row.tags = parseTags(row.tags);
  if (row.classes) row.classes = JSON.parse(row.classes);
  if (row.saving_throws) row.saving_throws = JSON.parse(row.saving_throws);
  if (row.skills) row.skills = JSON.parse(row.skills);
  if (row.equipment) row.equipment = JSON.parse(row.equipment);
  if (row.weapons) row.weapons = JSON.parse(row.weapons);
  if (row.spells) row.spells = JSON.parse(row.spells);

  // Add images
  row.images = db.prepare(`
    SELECT id, image_path, display_order
    FROM entity_images
    WHERE entity_type = 'characters' AND entity_id = ?
    ORDER BY display_order ASC
  `).all(row.id);

  res.json(row);
});

router.post('/', validateBody(characterSchema), asyncHandler(async (req: Request, res: Response) => {
  const {
    adventure_id, name, character_type, race, class: charClass, level, background, alignment, experience,
    classes,
    strength, dexterity, constitution, intelligence, wisdom, charisma,
    hitPoints, maxHitPoints, armorClass, initiative, speed, proficiencyBonus,
    savingThrows, skills, equipment, weapons, spells,
    spellcastingAbility, spellSaveDC, spellAttackBonus,
    personalityTraits, ideals, bonds, flaws, backstory,
    role, description, tags
  } = req.body;

  const info = db.prepare(`
    INSERT INTO characters (
      id, adventure_id, character_type, name, race, class, level, background, alignment, experience,
      strength, dexterity, constitution, intelligence, wisdom, charisma,
      hit_points, max_hit_points, armor_class, initiative, speed, proficiency_bonus,
      saving_throws, skills, equipment, weapons, spells,
      spellcasting_ability, spell_save_dc, spell_attack_bonus,
      personality_traits, ideals, bonds, flaws, backstory,
      role, description, tags, classes
    ) VALUES (
      $id, $adventure_id, $character_type, $name, $race, $class, $level, $background, $alignment, $experience,
      $strength, $dexterity, $constitution, $intelligence, $wisdom, $charisma,
      $hit_points, $max_hit_points, $armor_class, $initiative, $speed, $proficiency_bonus,
      $saving_throws, $skills, $equipment, $weapons, $spells,
      $spellcasting_ability, $spell_save_dc, $spell_attack_bonus,
      $personality_traits, $ideals, $bonds, $flaws, $backstory,
      $role, $description, $tags, $classes
    )
  `).run({
    id: null,
    adventure_id: adventure_id || null,
    character_type: character_type || 'pc',
    name: name,
    race: race || null,
    class: charClass || null,
    level: level || 1,
    background: background || null,
    alignment: alignment || null,
    experience: experience || 0,
    strength: strength || 10,
    dexterity: dexterity || 10,
    constitution: constitution || 10,
    intelligence: intelligence || 10,
    wisdom: wisdom || 10,
    charisma: charisma || 10,
    hit_points: hitPoints || 0,
    max_hit_points: maxHitPoints || 0,
    armor_class: armorClass || 10,
    initiative: initiative || 0,
    speed: speed || 30,
    proficiency_bonus: proficiencyBonus || 2,
    saving_throws: savingThrows ? JSON.stringify(savingThrows) : null,
    skills: skills ? JSON.stringify(skills) : null,
    equipment: equipment ? JSON.stringify(equipment) : null,
    weapons: weapons ? JSON.stringify(weapons) : null,
    spells: spells ? JSON.stringify(spells) : null,
    spellcasting_ability: spellcastingAbility || null,
    spell_save_dc: spellSaveDC || null,
    spell_attack_bonus: spellAttackBonus || null,
    personality_traits: personalityTraits || null,
    ideals: ideals || null,
    bonds: bonds || null,
    flaws: flaws || null,
    backstory: backstory || null,
    role: role || null,
    description: description || null,
    tags: stringifyTags(tags),
    classes: classes ? JSON.stringify(classes) : null
  });

  const row = db.prepare('SELECT * FROM characters WHERE id = ?').get(info.lastInsertRowid) as any;
  // Parse JSON fields for response
  row.tags = parseTags(row.tags);
  if (row.classes) row.classes = JSON.parse(row.classes);
  if (row.saving_throws) row.saving_throws = JSON.parse(row.saving_throws);
  if (row.skills) row.skills = JSON.parse(row.skills);
  if (row.equipment) row.equipment = JSON.parse(row.equipment);
  if (row.weapons) row.weapons = JSON.parse(row.weapons);
  if (row.spells) row.spells = JSON.parse(row.spells);

  // Add images (should be empty for new character)
  row.images = [];

  res.json(row);
}));

router.put('/:id', validateId, validateBody(characterUpdateSchema), asyncHandler(async (req: Request, res: Response) => {
  const {
    name, character_type, race, class: charClass, level, background, alignment, experience,
    classes,
    strength, dexterity, constitution, intelligence, wisdom, charisma,
    hitPoints, maxHitPoints, armorClass, initiative, speed, proficiencyBonus,
    savingThrows, skills, equipment, weapons, spells,
    spellcastingAbility, spellSaveDC, spellAttackBonus,
    personalityTraits, ideals, bonds, flaws, backstory,
    adventure_id, role, description, tags
  } = req.body;

  // Check if character exists
  const existingCharacter = db.prepare('SELECT id FROM characters WHERE id = ?').get(req.params.id as any);
  if (!existingCharacter) {
    throw new APIError('Character not found', 404);
  }

  // Build dynamic update query based on provided fields
  const updateFields: string[] = [];
  const updateValues: any[] = [];

  // Helper function to add field to update if provided
  const addField = (fieldName: string, value: any, dbFieldName?: string) => {
    if (value !== undefined) {
      updateFields.push(`${dbFieldName || fieldName} = ?`);
      updateValues.push(value);
    }
  };

  // Add fields that were provided in the request
  addField('adventure_id', adventure_id);
  addField('character_type', character_type);
  addField('name', name);
  addField('race', race);
  addField('class', charClass);
  addField('level', level);
  addField('background', background);
  addField('alignment', alignment);
  addField('experience', experience);
  addField('strength', strength);
  addField('dexterity', dexterity);
  addField('constitution', constitution);
  addField('intelligence', intelligence);
  addField('wisdom', wisdom);
  addField('charisma', charisma);
  addField('hit_points', hitPoints);
  addField('max_hit_points', maxHitPoints);
  addField('armor_class', armorClass);
  addField('initiative', initiative);
  addField('speed', speed);
  addField('proficiency_bonus', proficiencyBonus);
  addField('saving_throws', savingThrows ? JSON.stringify(savingThrows) : savingThrows);
  addField('skills', skills ? JSON.stringify(skills) : skills);
  addField('equipment', equipment ? JSON.stringify(equipment) : equipment);
  addField('weapons', weapons ? JSON.stringify(weapons) : weapons);
  addField('spells', spells ? JSON.stringify(spells) : spells);
  addField('spellcasting_ability', spellcastingAbility);
  addField('spell_save_dc', spellSaveDC);
  addField('spell_attack_bonus', spellAttackBonus);
  addField('personality_traits', personalityTraits);
  addField('ideals', ideals);
  addField('bonds', bonds);
  addField('flaws', flaws);
  addField('backstory', backstory);
  addField('role', role);
  addField('description', description);
  addField('tags', stringifyTags(tags));
  addField('classes', classes ? JSON.stringify(classes) : classes);

  if (updateFields.length === 0) {
    // No fields to update, return current character
    const row = db.prepare('SELECT * FROM characters WHERE id = ?').get(req.params.id as any) as any;
    // Parse JSON fields for response
    row.tags = parseTags(row.tags);
    if (row.classes) row.classes = JSON.parse(row.classes);
    if (row.saving_throws) row.saving_throws = JSON.parse(row.saving_throws);
    if (row.skills) row.skills = JSON.parse(row.skills);
    if (row.equipment) row.equipment = JSON.parse(row.equipment);
    if (row.weapons) row.weapons = JSON.parse(row.weapons);
    if (row.spells) row.spells = JSON.parse(row.spells);
    // Add images
    row.images = db.prepare(`
      SELECT id, image_path, display_order
      FROM entity_images
      WHERE entity_type = 'characters' AND entity_id = ?
      ORDER BY display_order ASC
    `).all(row.id);
    return res.json(row);
  }

  // Execute the update
  const updateQuery = `UPDATE characters SET ${updateFields.join(', ')} WHERE id = ?`;
  updateValues.push(req.params.id);
  db.prepare(updateQuery).run(...updateValues);

  // Fetch and return the updated character
  const row = db.prepare('SELECT * FROM characters WHERE id = ?').get(req.params.id as any) as any;
  // Parse JSON fields for response
  row.tags = parseTags(row.tags);
  if (row.classes) row.classes = JSON.parse(row.classes);
  if (row.saving_throws) row.saving_throws = JSON.parse(row.saving_throws);
  if (row.skills) row.skills = JSON.parse(row.skills);
  if (row.equipment) row.equipment = JSON.parse(row.equipment);
  if (row.weapons) row.weapons = JSON.parse(row.weapons);
  if (row.spells) row.spells = JSON.parse(row.spells);

  // Add images
  row.images = db.prepare(`
    SELECT id, image_path, display_order
    FROM entity_images
    WHERE entity_type = 'characters' AND entity_id = ?
    ORDER BY display_order ASC
  `).all(row.id);

  res.json(row);
}));

router.delete('/:id', validateId, asyncHandler(async (req: Request, res: Response) => {
  db.prepare('DELETE FROM characters WHERE id = ?').run(req.params.id as any);
  res.json({ message: 'Character deleted' });
}));

export default router;
