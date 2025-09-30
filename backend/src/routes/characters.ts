 import express, { Request, Response } from 'express';
import { db } from '../../db';
import { parseTags, stringifyTags } from '../utils';
import { validateBody, validateId, characterSchema } from '../middleware/validation';
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
  });
  res.json(rows);
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

  res.json(row);
}));

router.put('/:id', validateId, validateBody(characterSchema), asyncHandler(async (req: Request, res: Response) => {
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

  db.prepare(`
    UPDATE characters SET
      adventure_id = $adventure_id, character_type = $character_type, name = $name, race = $race, class = $class, level = $level, background = $background, alignment = $alignment, experience = $experience,
      strength = $strength, dexterity = $dexterity, constitution = $constitution, intelligence = $intelligence, wisdom = $wisdom, charisma = $charisma,
      hit_points = $hit_points, max_hit_points = $max_hit_points, armor_class = $armor_class, initiative = $initiative, speed = $speed, proficiency_bonus = $proficiency_bonus,
      saving_throws = $saving_throws, skills = $skills, equipment = $equipment, weapons = $weapons, spells = $spells,
      spellcasting_ability = $spellcasting_ability, spell_save_dc = $spell_save_dc, spell_attack_bonus = $spell_attack_bonus,
      personality_traits = $personality_traits, ideals = $ideals, bonds = $bonds, flaws = $flaws, backstory = $backstory,
      role = $role, description = $description, tags = $tags, classes = $classes
    WHERE id = $id
  `).run({
    id: req.params.id as any,
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

  const row = db.prepare('SELECT * FROM characters WHERE id = ?').get(req.params.id as any) as any;
  // Parse JSON fields for response
  row.tags = parseTags(row.tags);
  if (row.classes) row.classes = JSON.parse(row.classes);
  if (row.saving_throws) row.saving_throws = JSON.parse(row.saving_throws);
  if (row.skills) row.skills = JSON.parse(row.skills);
  if (row.equipment) row.equipment = JSON.parse(row.equipment);
  if (row.weapons) row.weapons = JSON.parse(row.weapons);
  if (row.spells) row.spells = JSON.parse(row.spells);

  res.json(row);
}));

router.delete('/:id', validateId, asyncHandler(async (req: Request, res: Response) => {
  db.prepare('DELETE FROM characters WHERE id = ?').run(req.params.id as any);
  res.json({ message: 'Character deleted' });
}));

export default router;
