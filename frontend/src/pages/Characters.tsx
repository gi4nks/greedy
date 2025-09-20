import { useState, useEffect, useRef } from 'react';
import axios from 'axios';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import Page from '../components/Page';
import { useAdventures } from '../contexts/AdventureContext';
import { Character, CharacterForm, CharacterItem, MagicItem } from '@greedy/shared';

function Chip({ label, onRemove }: { label: string; onRemove: () => void }) {
  return (
    <div className="badge badge-primary gap-2">
      {label}
      <button onClick={onRemove} className="btn btn-circle btn-xs btn-ghost">×</button>
    </div>
  );
}

export default function Characters(): JSX.Element {
  const [characters, setCharacters] = useState<Character[]>([]);
  const [magicItems, setMagicItems] = useState<MagicItem[]>([]);
  const [showAssignModal, setShowAssignModal] = useState(false);
  const [selectedItemId, setSelectedItemId] = useState<number | null>(null);
  const [formData, setFormData] = useState<CharacterForm>({
    name: '',
    race: '',
    classes: [],
    class: '',
    level: 1,
    background: '',
    alignment: '',
    experience: 0,
    adventure_id: undefined,
    strength: 10,
    dexterity: 10,
    constitution: 10,
    intelligence: 10,
    wisdom: 10,
    charisma: 10,
    hitPoints: 0,
    maxHitPoints: 0,
    armorClass: 10,
    initiative: 0,
    speed: 30,
    proficiencyBonus: 2,
    savingThrows: {
      strength: false,
      dexterity: false,
      constitution: false,
      intelligence: false,
      wisdom: false,
      charisma: false,
    },
    skills: {
      acrobatics: false,
      animalHandling: false,
      arcana: false,
      athletics: false,
      deception: false,
      history: false,
      insight: false,
      intimidation: false,
      investigation: false,
      medicine: false,
      nature: false,
      perception: false,
      performance: false,
      persuasion: false,
      religion: false,
      sleightOfHand: false,
      stealth: false,
      survival: false,
    },
    equipment: [],
    weapons: [],
    spells: [],
    personalityTraits: '',
    ideals: '',
    bonds: '',
    flaws: '',
    backstory: '',
    // Legacy fields
    role: '',
    description: '',
    tags: []
  });

  const resetForm = () => ({
    name: '',
    race: '',
    classes: [],
    class: '',
    level: 1,
    background: '',
    alignment: '',
    experience: 0,
    adventure_id: undefined,
    strength: 10,
    dexterity: 10,
    constitution: 10,
    intelligence: 10,
    wisdom: 10,
    charisma: 10,
    hitPoints: 0,
    maxHitPoints: 0,
    armorClass: 10,
    initiative: 0,
    speed: 30,
    proficiencyBonus: 2,
    savingThrows: {
      strength: false,
      dexterity: false,
      constitution: false,
      intelligence: false,
      wisdom: false,
      charisma: false,
    },
    skills: {
      acrobatics: false,
      animalHandling: false,
      arcana: false,
      athletics: false,
      deception: false,
      history: false,
      insight: false,
      intimidation: false,
      investigation: false,
      medicine: false,
      nature: false,
      perception: false,
      performance: false,
      persuasion: false,
      religion: false,
      sleightOfHand: false,
      stealth: false,
      survival: false,
    },
    equipment: [],
    weapons: [],
    spells: [],
    personalityTraits: '',
    ideals: '',
    bonds: '',
    flaws: '',
    backstory: '',
    role: '',
    description: '',
    tags: []
  });
  const [activeTab, setActiveTab] = useState<'basic' | 'classes' | 'abilities' | 'combat' | 'items' | 'spells' | 'background'>('basic');
  const [searchTerm, setSearchTerm] = useState('');
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  // Collapsed state for each NPC
  const [collapsed, setCollapsed] = useState<{ [id: number]: boolean }>({});
  const tagInputRef = useRef<HTMLInputElement | null>(null);
  const adv = useAdventures();

  // Toggle collapse for an NPC
  const toggleCollapse = (id?: number) => {
    if (!id) return;
    setCollapsed(prev => ({ ...prev, [id]: ! (prev[id] ?? true) }));
  };

  useEffect(() => {
    fetchCharacters();
    fetchMagicItems();
  }, []);

  const fetchCharacters = () => {
    axios.get('/api/characters').then(res => setCharacters(res.data));
  };

  const fetchMagicItems = () => {
    axios.get('/api/magic-items').then(res => setMagicItems(res.data));
  };

  const handleAddTag = () => {
    const v = (tagInputRef.current?.value || '').trim();
    if (!v) return;
    if (!formData.tags?.includes(v)) {
      setFormData({ ...formData, tags: [...(formData.tags || []), v] });
    }
    if (tagInputRef.current) tagInputRef.current.value = '';
  };

  const handleRemoveTag = (tag: string) => {
    setFormData({ ...formData, tags: (formData.tags || []).filter(t => t !== tag) });
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const data = { ...formData };
    if (editingId) {
      axios.put(`/api/characters/${editingId}`, data).then(() => {
        fetchCharacters();
        setFormData(resetForm());
        setEditingId(null);
        setShowCreateForm(false);
      });
    } else {
      axios.post('/api/characters', data).then(() => {
        fetchCharacters();
        setFormData(resetForm());
        setShowCreateForm(false);
      });
    }
  };

  const handleEdit = (character: Character & { id: number }) => {
    setFormData({
      ...character,
      // Ensure all required fields have defaults
      classes: character.classes || [],
      savingThrows: character.savingThrows || {
        strength: false,
        dexterity: false,
        constitution: false,
        intelligence: false,
        wisdom: false,
        charisma: false,
      },
      skills: character.skills || {
        acrobatics: false,
        animalHandling: false,
        arcana: false,
        athletics: false,
        deception: false,
        history: false,
        insight: false,
        intimidation: false,
        investigation: false,
        medicine: false,
        nature: false,
        perception: false,
        performance: false,
        persuasion: false,
        religion: false,
        sleightOfHand: false,
        stealth: false,
        survival: false,
      },
      equipment: character.equipment || [],
      weapons: character.weapons || [],
      spells: character.spells || [],
      tags: character.tags || []
    });
    setEditingId(character.id);
    setShowCreateForm(true);
  };

  const handleDelete = (id?: number) => {
    if (!id) return;
    if (window.confirm('Are you sure you want to delete this character?')) {
      axios.delete(`/api/characters/${id}`).then(() => {
        fetchCharacters();
      });
    }
  };

  const doSearch = async (term: string) => {
    const params = new URLSearchParams();
    params.set('q', term);
    if (adv.selectedId) params.set('adventure', String(adv.selectedId));
    const res = await axios.get(`/api/search?${params.toString()}`);
    setCharacters(res.data.characters || []);
  };

  return (
    <Page title="Characters" toolbar={<button onClick={() => setShowCreateForm(true)} className="btn btn-primary btn-sm">Add</button>}>
      <div className="mb-6">
        <form onSubmit={(e) => { e.preventDefault(); doSearch(searchTerm); }}>
          <input
            type="text"
            placeholder="Search Characters..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="input input-bordered input-primary w-full h-9"
          />
        </form>
      </div>

      {(showCreateForm || editingId) && (
        <form onSubmit={handleSubmit} className="card bg-base-100 shadow-xl border border-base-300 mb-6">
          <div className="card-body">
            <h3 className="card-title text-xl justify-center">{editingId ? 'Edit Character' : 'Create New Character'}</h3>
          <div className="flex flex-wrap border-b mb-6">
            {[
              { key: 'basic', label: 'Basic Info' },
              { key: 'classes', label: 'Classes' },
              { key: 'abilities', label: 'Abilities' },
              { key: 'combat', label: 'Combat' },
              { key: 'items', label: 'Items' },
              { key: 'spells', label: 'Spells' },
              { key: 'background', label: 'Background' }
            ].map(tab => (
              <button
                key={tab.key}
                type="button"
                onClick={() => setActiveTab(tab.key as typeof activeTab)}
                className={`px-4 py-2 font-medium text-sm ${
                  activeTab === tab.key
                    ? 'border-b-2 border-primary text-primary'
                    : 'text-base-content/60 hover:text-base-content'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>

          {/* Tab Content */}
          {activeTab === 'basic' && (
            <div className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm font-medium text-base-content mb-2">Character Name</label>
                  <input
                    type="text"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    className="input input-bordered w-full"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-base-content mb-2">Race</label>
                  <input
                    type="text"
                    value={formData.race || ''}
                    onChange={(e) => setFormData({ ...formData, race: e.target.value })}
                    className="input input-bordered w-full"
                    placeholder="e.g., Human, Elf, Dwarf"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-base-content mb-2">Background</label>
                  <input
                    type="text"
                    value={formData.background || ''}
                    onChange={(e) => setFormData({ ...formData, background: e.target.value })}
                    className="input input-bordered w-full"
                    placeholder="e.g., Noble, Criminal, Entertainer"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-base-content mb-2">Alignment</label>
                  <select
                    value={formData.alignment || ''}
                    onChange={(e) => setFormData({ ...formData, alignment: e.target.value })}
                    className="select select-bordered w-full"
                  >
                    <option value="">Select Alignment</option>
                    <option value="Lawful Good">Lawful Good</option>
                    <option value="Neutral Good">Neutral Good</option>
                    <option value="Chaotic Good">Chaotic Good</option>
                    <option value="Lawful Neutral">Lawful Neutral</option>
                    <option value="True Neutral">True Neutral</option>
                    <option value="Chaotic Neutral">Chaotic Neutral</option>
                    <option value="Lawful Evil">Lawful Evil</option>
                    <option value="Neutral Evil">Neutral Evil</option>
                    <option value="Chaotic Evil">Chaotic Evil</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-base-content mb-2">Experience Points</label>
                  <input
                    type="number"
                    min="0"
                    value={formData.experience || 0}
                    onChange={(e) => setFormData({ ...formData, experience: parseInt(e.target.value) || 0 })}
                    className="input input-bordered w-full"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-base-content mb-2">Adventure</label>
                  <select
                    value={formData.adventure_id || ''}
                    onChange={(e) => setFormData({ ...formData, adventure_id: e.target.value ? parseInt(e.target.value) : undefined })}
                    className="select select-bordered w-full"
                  >
                    <option value="">No Adventure Assigned</option>
                    {adv.adventures.map(adventure => (
                      <option key={adventure.id} value={adventure.id}>
                        {adventure.title}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'classes' && (
            <div className="space-y-4">
              <div>
                <h4 className="text-lg font-semibold mb-3">Classes</h4>
                <p className="text-sm text-base-content/70 mb-3">
                  Add and manage your character's classes. Each class can have its own level and experience points.
                </p>
                {(formData.classes || []).map((classInfo, index) => (
                  <div key={index} className="flex items-center gap-2 mb-2 p-3 bg-base-200 rounded border border-base-300">
                    <input
                      type="text"
                      placeholder="Class name (e.g., Fighter, Wizard)"
                      value={classInfo.className}
                      onChange={(e) => {
                        const newClasses = [...(formData.classes || [])];
                        newClasses[index] = { ...newClasses[index], className: e.target.value };
                        setFormData({ ...formData, classes: newClasses });
                      }}
                      className="input input-bordered flex-1"
                      title="Enter the name of the class, e.g., Fighter, Wizard, Rogue"
                    />
                    <input
                      type="number"
                      min="1"
                      max="20"
                      placeholder="Level (1-20)"
                      value={classInfo.level}
                      onChange={(e) => {
                        const newClasses = [...(formData.classes || [])];
                        newClasses[index] = { ...newClasses[index], level: parseInt(e.target.value) || 1 };
                        setFormData({ ...formData, classes: newClasses });
                      }}
                      className="input input-bordered w-20"
                      title="Enter the level for this class (1-20)"
                    />
                    <input
                      type="number"
                      min="0"
                      placeholder="XP (experience points)"
                      value={classInfo.experience ?? 0}
                      onChange={(e) => {
                        const newClasses = [...(formData.classes || [])];
                        newClasses[index] = { ...newClasses[index], experience: parseInt(e.target.value) || 0 };
                        setFormData({ ...formData, classes: newClasses });
                      }}
                      className="input input-bordered w-28"
                      title="Experience points earned specifically for this class"
                    />
                    <button
                      type="button"
                      onClick={() => {
                        const newClasses = (formData.classes || []).filter((_, i) => i !== index);
                        setFormData({ ...formData, classes: newClasses });
                      }}
                      className="btn btn-error btn-sm"
                    >
                      Remove
                    </button>
                  </div>
                ))}
                <button
                  type="button"
                  onClick={() => {
                    const newClasses = [...(formData.classes || []), { className: '', level: 1, experience: 0 }];
                    setFormData({ ...formData, classes: newClasses });
                  }}
                  className="btn btn-success btn-sm"
                >
                  Add
                </button>
              </div>
            </div>
          )}

          {activeTab === 'abilities' && (
            <div className="space-y-4">
              <h4 className="text-lg font-semibold mb-3">Ability Scores</h4>
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
                <div className="text-center">
                  <label className="block text-sm font-medium text-base-content mb-2">STR</label>
                  <input
                    type="number"
                    min="1"
                    max="30"
                    value={formData.strength || 10}
                    onChange={(e) => setFormData({ ...formData, strength: parseInt(e.target.value) || 10 })}
                    className="input input-bordered w-full text-center font-bold"
                  />
                  <div className="text-xs text-base-content/70 mt-1">+{Math.floor(((formData.strength || 10) - 10) / 2)}</div>
                </div>
                <div className="text-center">
                  <label className="block text-sm font-medium text-base-content mb-2">DEX</label>
                  <input
                    type="number"
                    min="1"
                    max="30"
                    value={formData.dexterity || 10}
                    onChange={(e) => setFormData({ ...formData, dexterity: parseInt(e.target.value) || 10 })}
                    className="input input-bordered w-full text-center font-bold"
                  />
                  <div className="text-xs text-base-content/70 mt-1">+{Math.floor(((formData.dexterity || 10) - 10) / 2)}</div>
                </div>
                <div className="text-center">
                  <label className="block text-sm font-medium text-base-content mb-2">CON</label>
                  <input
                    type="number"
                    min="1"
                    max="30"
                    value={formData.constitution || 10}
                    onChange={(e) => setFormData({ ...formData, constitution: parseInt(e.target.value) || 10 })}
                    className="input input-bordered w-full text-center font-bold"
                  />
                  <div className="text-xs text-base-content/70 mt-1">+{Math.floor(((formData.constitution || 10) - 10) / 2)}</div>
                </div>
                <div className="text-center">
                  <label className="block text-sm font-medium text-base-content mb-2">INT</label>
                  <input
                    type="number"
                    min="1"
                    max="30"
                    value={formData.intelligence || 10}
                    onChange={(e) => setFormData({ ...formData, intelligence: parseInt(e.target.value) || 10 })}
                    className="input input-bordered w-full text-center font-bold"
                  />
                  <div className="text-xs text-base-content/70 mt-1">+{Math.floor(((formData.intelligence || 10) - 10) / 2)}</div>
                </div>
                <div className="text-center">
                  <label className="block text-sm font-medium text-base-content mb-2">WIS</label>
                  <input
                    type="number"
                    min="1"
                    max="30"
                    value={formData.wisdom || 10}
                    onChange={(e) => setFormData({ ...formData, wisdom: parseInt(e.target.value) || 10 })}
                    className="input input-bordered w-full text-center font-bold"
                  />
                  <div className="text-xs text-base-content/70 mt-1">+{Math.floor(((formData.wisdom || 10) - 10) / 2)}</div>
                </div>
                <div className="text-center">
                  <label className="block text-sm font-medium text-base-content mb-2">CHA</label>
                  <input
                    type="number"
                    min="1"
                    max="30"
                    value={formData.charisma || 10}
                    onChange={(e) => setFormData({ ...formData, charisma: parseInt(e.target.value) || 10 })}
                    className="input input-bordered w-full text-center font-bold"
                  />
                  <div className="text-xs text-base-content/70 mt-1">+{Math.floor(((formData.charisma || 10) - 10) / 2)}</div>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'combat' && (
            <div className="space-y-4">
              <h4 className="text-lg font-semibold mb-3">Combat Statistics</h4>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div>
                  <label className="block text-sm font-medium text-base-content mb-2">Hit Points</label>
                  <input
                    type="number"
                    min="0"
                    value={formData.hitPoints || 0}
                    onChange={(e) => setFormData({ ...formData, hitPoints: parseInt(e.target.value) || 0 })}
                    className="input input-bordered w-full"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-base-content mb-2">Max Hit Points</label>
                  <input
                    type="number"
                    min="0"
                    value={formData.maxHitPoints || 0}
                    onChange={(e) => setFormData({ ...formData, maxHitPoints: parseInt(e.target.value) || 0 })}
                    className="input input-bordered w-full"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-base-content mb-2">Armor Class</label>
                  <input
                    type="number"
                    min="0"
                    value={formData.armorClass || 10}
                    onChange={(e) => setFormData({ ...formData, armorClass: parseInt(e.target.value) || 10 })}
                    className="input input-bordered w-full"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-base-content mb-2">Speed</label>
                  <input
                    type="number"
                    min="0"
                    value={formData.speed || 30}
                    onChange={(e) => setFormData({ ...formData, speed: parseInt(e.target.value) || 30 })}
                    className="input input-bordered w-full"
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div>
                  <label className="block text-sm font-medium text-base-content mb-2">Initiative</label>
                  <input
                    type="number"
                    value={formData.initiative || 0}
                    onChange={(e) => setFormData({ ...formData, initiative: parseInt(e.target.value) || 0 })}
                    className="input input-bordered w-full"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-base-content mb-2">Proficiency Bonus</label>
                  <input
                    type="number"
                    min="0"
                    max="6"
                    value={formData.proficiencyBonus || 2}
                    onChange={(e) => setFormData({ ...formData, proficiencyBonus: parseInt(e.target.value) || 2 })}
                    className="input input-bordered w-full"
                  />
                </div>
              </div>
            </div>
          )}

          {activeTab === 'items' && (
            <div className="space-y-4">
              <h4 className="text-lg font-semibold mb-3">Magical Items</h4>

              {/* Magical Items Section */}
              <div className="mb-6">
                <h5 className="text-md font-medium mb-3 flex items-center gap-2">
                  <span className="text-secondary">✨</span>
                  Magical Items
                </h5>
                <div className="mb-4">
                  <h6 className="text-sm font-medium text-base-content/70 mb-2">Assigned Magical Items</h6>
                  <div className="space-y-2">
                    {magicItems
                      .filter(item => item.owners?.some(owner => owner.id === editingId))
                      .map(item => (
                        <div key={item.id} className="flex items-center justify-between bg-secondary/10 p-3 rounded border border-secondary/20">
                          <div className="flex-1">
                            <div className="flex items-center gap-2">
                              <span className="font-semibold text-base-content">{item.name}</span>
                              {item.rarity && (
                                <span className="text-xs bg-secondary/20 text-secondary px-2 py-1 rounded">
                                  {item.rarity}
                                </span>
                              )}
                              {item.type && (
                                <span className="text-xs bg-info/20 text-info px-2 py-1 rounded">
                                  {item.type}
                                </span>
                              )}
                            </div>
                            {item.description && (
                              <p className="text-sm text-base-content/70 mt-1">{item.description}</p>
                            )}
                          </div>
                          <button
                            type="button"
                            onClick={() => {
                              if (item.id && editingId) {
                                axios.post(`/api/magic-items/${item.id}/unassign`, { characterId: editingId })
                                  .then(() => {
                                    fetchMagicItems();
                                    fetchCharacters();
                                  });
                              }
                            }}
                            className="btn btn-error btn-sm"
                          >
                            Remove
                          </button>
                        </div>
                      ))}
                    {magicItems.filter(item => item.owners?.some(owner => owner.id === editingId)).length === 0 && (
                      <div className="text-base-content/50 italic text-sm p-3 bg-base-200 rounded">
                        No magical items assigned
                      </div>
                    )}
                  </div>
                </div>

                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={() => setShowAssignModal(true)}
                    className="btn btn-primary btn-sm"
                  >
                    Assign
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      // Create a new magical item and assign it to the character
                      const itemName = prompt('Enter magical item name:');
                      if (itemName && editingId) {
                        axios.post('/api/magic-items', {
                          name: itemName,
                          description: 'New magical item',
                          rarity: 'common',
                          type: 'Wondrous item',
                          attunement_required: false
                        }).then((response) => {
                          const newItemId = response.data.id;
                          return axios.post(`/api/magic-items/${newItemId}/assign`, { characterId: editingId });
                        }).then(() => {
                          fetchMagicItems();
                          fetchCharacters();
                        });
                      }
                    }}
                    className="btn btn-secondary btn-sm"
                  >
                    Create
                  </button>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'spells' && (
            <div className="space-y-4">
              <h4 className="text-lg font-semibold mb-3">Spellcasting</h4>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
                <div>
                  <label className="block text-sm font-medium text-base-content mb-2">Spellcasting Ability</label>
                  <select
                    value={formData.spellcastingAbility || ''}
                    onChange={(e) => setFormData({ ...formData, spellcastingAbility: e.target.value })}
                    className="select select-bordered w-full"
                  >
                    <option value="">None</option>
                    <option value="Intelligence">Intelligence</option>
                    <option value="Wisdom">Wisdom</option>
                    <option value="Charisma">Charisma</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-base-content mb-2">Spell Save DC</label>
                  <input
                    type="number"
                    min="0"
                    value={formData.spellSaveDC || 0}
                    onChange={(e) => setFormData({ ...formData, spellSaveDC: parseInt(e.target.value) || 0 })}
                    className="input input-bordered w-full"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-base-content mb-2">Spell Attack Bonus</label>
                  <input
                    type="number"
                    value={formData.spellAttackBonus || 0}
                    onChange={(e) => setFormData({ ...formData, spellAttackBonus: parseInt(e.target.value) || 0 })}
                    className="input input-bordered w-full"
                  />
                </div>
              </div>
              <div>
                <h5 className="text-md font-medium mb-2">Known Spells</h5>
                {(formData.spells || []).map((spell, index) => (
                  <div key={index} className="flex items-center gap-2 mb-2 p-2 bg-base-200 rounded">
                    <select
                      value={spell.level}
                      onChange={(e) => {
                        const newSpells = [...(formData.spells || [])];
                        newSpells[index] = { ...newSpells[index], level: parseInt(e.target.value) as 0 | 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9 };
                        setFormData({ ...formData, spells: newSpells });
                      }}
                      className="select select-bordered"
                    >
                      {[0, 1, 2, 3, 4, 5, 6, 7, 8, 9].map(level => (
                        <option key={level} value={level}>
                          {level === 0 ? 'Cantrip' : `Level ${level}`}
                        </option>
                      ))}
                    </select>
                    <input
                      type="text"
                      placeholder="Spell name"
                      value={spell.name}
                      onChange={(e) => {
                        const newSpells = [...(formData.spells || [])];
                        newSpells[index] = { ...newSpells[index], name: e.target.value };
                        setFormData({ ...formData, spells: newSpells });
                      }}
                      className="input input-bordered flex-1"
                    />
                    <label className="flex items-center">
                      <input
                        type="checkbox"
                        checked={spell.prepared}
                        onChange={(e) => {
                          const newSpells = [...(formData.spells || [])];
                          newSpells[index] = { ...newSpells[index], prepared: e.target.checked };
                          setFormData({ ...formData, spells: newSpells });
                        }}
                        className="mr-2"
                      />
                      Prepared
                    </label>
                    <button
                      type="button"
                      onClick={() => {
                        const newSpells = (formData.spells || []).filter((_, i) => i !== index);
                        setFormData({ ...formData, spells: newSpells });
                      }}
                      className="btn btn-error btn-sm"
                    >
                      Remove
                    </button>
                  </div>
                ))}
                <button
                  type="button"
                  onClick={() => {
                    const newSpells = [...(formData.spells || []), { level: 0, name: '', prepared: false }];
                    setFormData({ ...formData, spells: newSpells });
                  }}
                  className="btn btn-success btn-sm"
                >
                  Add
                </button>
              </div>
            </div>
          )}

          {activeTab === 'background' && (
            <div className="space-y-4">
              <h4 className="text-lg font-semibold mb-3">Background & Personality</h4>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-base-content mb-2">Personality Traits</label>
                  <textarea
                    value={formData.personalityTraits || ''}
                    onChange={(e) => setFormData({ ...formData, personalityTraits: e.target.value })}
                    className="textarea textarea-bordered w-full h-24"
                    placeholder="Describe your character's personality traits..."
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-base-content mb-2">Ideals</label>
                  <textarea
                    value={formData.ideals || ''}
                    onChange={(e) => setFormData({ ...formData, ideals: e.target.value })}
                    className="textarea textarea-bordered w-full h-24"
                    placeholder="What does your character believe in..."
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-base-content mb-2">Bonds</label>
                  <textarea
                    value={formData.bonds || ''}
                    onChange={(e) => setFormData({ ...formData, bonds: e.target.value })}
                    className="textarea textarea-bordered w-full h-24"
                    placeholder="What ties does your character have..."
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-base-content mb-2">Flaws</label>
                  <textarea
                    value={formData.flaws || ''}
                    onChange={(e) => setFormData({ ...formData, flaws: e.target.value })}
                    className="textarea textarea-bordered w-full h-24"
                    placeholder="What are your character's weaknesses..."
                  />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-base-content mb-2">Backstory</label>
                <textarea
                  value={formData.backstory || ''}
                  onChange={(e) => setFormData({ ...formData, backstory: e.target.value })}
                  className="textarea textarea-bordered w-full h-32"
                  placeholder="Tell your character's story..."
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-base-content mb-2">Legacy Description</label>
                <textarea
                  placeholder="Character description (Markdown supported)"
                  value={formData.description || ''}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  className="textarea textarea-bordered w-full h-32"
                />
              </div>
              <div>
                <h5 className="text-md font-medium mb-2">Tags</h5>
                <div className="flex items-center mb-2">
                  <input ref={tagInputRef} type="text" placeholder="Add tag" className="input input-bordered mr-2 flex-1" />
                  <button type="button" onClick={handleAddTag} className="btn btn-secondary btn-sm">Add</button>
                </div>
                <div className="mt-2">
                  {(formData.tags || []).map(tag => (
                    <Chip key={tag} label={tag} onRemove={() => handleRemoveTag(tag)} />
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* Form Actions */}
          <div className="card-actions justify-end">
            <button type="submit" className="btn btn-primary btn-sm">
              {editingId ? 'Update' : 'Create'}
            </button>
            <button
              type="button"
              onClick={() => {
                setFormData(resetForm());
                setEditingId(null);
                setShowCreateForm(false);
                setActiveTab('basic');
              }}
              className="btn btn-ghost btn-sm"
            >
              Cancel
            </button>
          </div>
        </div>
      </form>
    )}

      {/* Assign Magical Item Modal */}
      {showAssignModal && (
        <div className="modal modal-open">
          <div className="modal-box max-w-md">
            <h3 className="font-bold text-lg mb-4">Assign Magical Item</h3>
            <div className="space-y-2">
              {magicItems
                .filter(item => !item.owners?.some(owner => owner.id === editingId))
                .map(item => (
                  <div key={item.id} className="flex items-center justify-between p-3 border rounded hover:bg-base-200">
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <span className="font-medium">{item.name}</span>
                        {item.rarity && (
                          <div className="badge badge-primary badge-sm">
                            {item.rarity}
                          </div>
                        )}
                        {item.type && (
                          <div className="badge badge-secondary badge-sm">
                            {item.type}
                          </div>
                        )}
                      </div>
                      {item.description && (
                        <p className="text-sm text-base-content/70 mt-1">{item.description}</p>
                      )}
                    </div>
                    <button
                      type="button"
                      onClick={() => {
                        if (item.id && editingId) {
                          axios.post(`/api/magic-items/${item.id}/assign`, { characterId: editingId })
                            .then(() => {
                              fetchMagicItems();
                              fetchCharacters();
                              setShowAssignModal(false);
                            });
                        }
                      }}
                      className="btn btn-success btn-sm"
                    >
                      Assign
                    </button>
                  </div>
                ))}
              {magicItems.filter(item => !item.owners?.some(owner => owner.id === editingId)).length === 0 && (
                <div className="text-base-content/50 italic text-sm p-4 text-center">
                  No available magical items to assign
                </div>
              )}
            </div>
            <div className="modal-action">
              <button
                type="button"
                onClick={() => setShowAssignModal(false)}
                className="btn btn-ghost btn-sm"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      <div className="space-y-6">
        {characters.map(character => {
          const isCollapsed = character.id ? collapsed[character.id] ?? true : false;
          return (
            <div key={character.id} className="card bg-base-100 shadow-xl hover:shadow-2xl transition-shadow">
              <div className="card-body">
                <div className="flex justify-between items-center">
                  <div className="flex items-center gap-3">
                    <button
                      onClick={() => toggleCollapse(character.id)}
                      className="btn btn-outline btn-primary btn-sm"
                      aria-label={isCollapsed ? 'Expand' : 'Collapse'}
                    >
                      {isCollapsed ? '+' : '−'}
                    </button>
                    <div>
                      <h3 className="card-title text-xl">{character.name}</h3>
                      <div className="flex items-center gap-4 mt-1 text-sm text-base-content/70">
                        {character.race && <span className="flex items-center gap-1">
                          <div className="w-2 h-2 bg-primary rounded-full"></div>
                          {character.race}
                        </span>}
                        {character.background && <span className="flex items-center gap-1">
                          <div className="w-2 h-2 bg-success rounded-full"></div>
                          {character.background}
                        </span>}
                        {character.alignment && <span className="flex items-center gap-1">
                          <div className="w-2 h-2 bg-accent rounded-full"></div>
                          {character.alignment}
                        </span>}
                      </div>
                    </div>
                  </div>
                  <div className="card-actions">
                    <button
                      onClick={() => handleEdit(character as Character & { id: number })}
                      className="btn btn-secondary btn-sm"
                    >
                      Edit
                    </button>
                    <button
                      onClick={() => handleDelete(character.id)}
                      className="btn btn-neutral btn-sm"
                    >
                      Delete
                    </button>
                  </div>
                </div>

                {!isCollapsed && (
                  <div className="space-y-6 mt-6">
                  {/* Enhanced Recap Panel */}
                  <div className="bg-gradient-to-r from-primary/10 to-secondary/10 rounded-xl p-6 border border-primary/20">
                    <h4 className="text-lg font-bold text-base-content mb-4 flex items-center gap-2">
                      <span className="text-2xl">📊</span>
                      Character Recap
                    </h4>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
                      <div className="bg-base-100 rounded-lg p-4 shadow-sm border border-base-300">
                        <div className="text-sm font-medium text-base-content/70 mb-1">Total Level</div>
                        <div className="text-2xl font-bold text-primary">
                          {character.classes && character.classes.length > 0
                            ? (character.classes as any[]).reduce((sum, c) => sum + (c.level || 0), 0)
                            : (character.level || 0)}
                        </div>
                      </div>
                      <div className="bg-base-100 rounded-lg p-4 shadow-sm border border-base-300">
                        <div className="text-sm font-medium text-base-content/70 mb-1">Total XP</div>
                        <div className="text-2xl font-bold text-success">
                          {character.experience !== undefined && character.experience !== null ? character.experience.toLocaleString() : '—'}
                        </div>
                      </div>
                      <div className="bg-base-100 rounded-lg p-4 shadow-sm border border-base-300">
                        <div className="text-sm font-medium text-base-content/70 mb-1">Hit Points</div>
                        <div className="text-2xl font-bold text-error">
                          {character.hitPoints !== undefined ? `${character.hitPoints}/${character.maxHitPoints || character.hitPoints}` : '—'}
                        </div>
                      </div>
                      <div className="bg-base-100 rounded-lg p-4 shadow-sm border border-base-300">
                        <div className="text-sm font-medium text-base-content/70 mb-1">Armor Class</div>
                        <div className="text-2xl font-bold text-info">
                          {character.armorClass !== undefined ? character.armorClass : '—'}
                        </div>
                      </div>
                    </div>
                    <div className="bg-base-100 rounded-lg p-4 shadow-sm border border-base-300">
                      <div className="text-sm font-medium text-base-content/70 mb-2">Class Breakdown</div>
                      {character.classes && character.classes.length > 0 ? (
                        <div className="space-y-2">
                          {(character.classes as any[]).map((c, idx) => {
                            const classExp = c.experience ?? c.exp ?? c.xp ?? null;
                            return (
                              <div key={idx} className="flex items-center justify-between bg-base-200 rounded-lg p-3">
                                <div className="flex items-center gap-3">
                                  <span className="w-3 h-3 bg-primary rounded-full"></span>
                                  <span className="font-semibold text-base-content">{c.className || 'Unknown'}</span>
                                  <span className="text-sm text-base-content/70">Level {c.level || 0}</span>
                                </div>
                                {classExp && (
                                  <span className="text-sm font-medium text-success bg-success/10 px-2 py-1 rounded">
                                    {classExp.toLocaleString()} XP
                                  </span>
                                )}
                              </div>
                            );
                          })}
                        </div>
                      ) : (
                        <div className="text-base-content/50 italic">
                          {character.class ? `${character.class} — Level ${character.level || 0}` : 'No class information'}
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Ability Scores Section */}
                  {(character.strength || character.dexterity || character.constitution || character.intelligence || character.wisdom || character.charisma) && (
                    <div className="bg-base-200 rounded-box p-6">
                      <h4 className="text-lg font-bold text-base-content mb-4 flex items-center gap-2">
                        <span className="text-2xl">💪</span>
                        Ability Scores
                      </h4>
                      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
                        {[
                          { name: 'STR', value: character.strength, color: 'text-primary' },
                          { name: 'DEX', value: character.dexterity, color: 'text-primary' },
                          { name: 'CON', value: character.constitution, color: 'text-primary' },
                          { name: 'INT', value: character.intelligence, color: 'text-primary' },
                          { name: 'WIS', value: character.wisdom, color: 'text-primary' },
                          { name: 'CHA', value: character.charisma, color: 'text-primary' }
                        ].map(({ name, value, color }) => value && (
                          <div key={name} className="bg-base-100 rounded-box p-4 shadow-sm border border-base-300 text-center">
                            <div className="text-sm font-medium text-base-content/70 mb-2">{name}</div>
                            <div className="text-2xl font-bold text-base-content mb-1">{value}</div>
                            <div className={`text-sm font-medium ${color}`}>
                              +{Math.floor((value - 10) / 2)}
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Combat Stats Section */}
                  {(character.hitPoints !== undefined || character.armorClass !== undefined || character.speed !== undefined || character.proficiencyBonus !== undefined) && (
                    <div className="bg-base-200 rounded-box p-6">
                      <h4 className="text-lg font-bold text-base-content mb-4 flex items-center gap-2">
                        <span className="text-2xl">⚔️</span>
                        Combat Statistics
                      </h4>
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                        {character.hitPoints !== undefined && (
                          <div className="bg-base-100 rounded-box p-4 shadow-sm border border-base-300">
                            <div className="text-sm font-medium text-base-content/70 mb-1">Hit Points</div>
                            <div className="text-xl font-bold text-primary">{character.hitPoints}/{character.maxHitPoints || character.hitPoints}</div>
                          </div>
                        )}
                        {character.armorClass !== undefined && (
                          <div className="bg-base-100 rounded-box p-4 shadow-sm border border-base-300">
                            <div className="text-sm font-medium text-base-content/70 mb-1">Armor Class</div>
                            <div className="text-xl font-bold text-primary">{character.armorClass}</div>
                          </div>
                        )}
                        {character.speed !== undefined && (
                          <div className="bg-base-100 rounded-box p-4 shadow-sm border border-base-300">
                            <div className="text-sm font-medium text-base-content/70 mb-1">Speed</div>
                            <div className="text-xl font-bold text-primary">{character.speed} ft.</div>
                          </div>
                        )}
                        {character.proficiencyBonus !== undefined && (
                          <div className="bg-base-100 rounded-box p-4 shadow-sm border border-base-300">
                            <div className="text-sm font-medium text-base-content/70 mb-1">Proficiency</div>
                            <div className="text-xl font-bold text-primary">+{character.proficiencyBonus}</div>
                          </div>
                        )}
                      </div>
                    </div>
                  )}

                  {/* Spells Section */}
                  {character.spells && character.spells.length > 0 && (
                    <div className="bg-base-200 rounded-box p-6">
                      <h4 className="text-lg font-bold text-base-content mb-4 flex items-center gap-2">
                        <span className="text-2xl">🔮</span>
                        Spells ({character.spells.length})
                      </h4>
                      <div className="space-y-3">
                        {character.spells.slice(0, 8).map((spell, idx) => (
                          <div key={idx} className="bg-base-100 rounded-box p-4 shadow-sm border border-base-300">
                            <div className="flex items-center justify-between">
                              <div className="flex items-center gap-3">
                                <span className={`badge badge-sm ${
                                  spell.level === 0
                                    ? 'badge-warning'
                                    : 'badge-info'
                                }`}>
                                  {spell.level === 0 ? 'Cantrip' : `Level ${spell.level}`}
                                </span>
                                <span className="font-semibold text-base-content">{spell.name}</span>
                              </div>
                              {spell.prepared && (
                                <span className="badge badge-success badge-sm">
                                  Prepared
                                </span>
                              )}
                            </div>
                          </div>
                        ))}
                        {character.spells.length > 8 && (
                          <div className="text-center text-base-content/60 text-sm">
                            ...and {character.spells.length - 8} more spells
                          </div>
                        )}
                      </div>
                    </div>
                  )}

                  {/* Description Section */}
                  {character.description && (
                    <div className="bg-base-200 rounded-box p-6">
                      <h4 className="text-lg font-bold text-base-content mb-4 flex items-center gap-2">
                        <span className="text-2xl">📖</span>
                        Description
                      </h4>
                      <div className="bg-base-100 rounded-box p-4 shadow-sm border border-base-300">
                        <div className="prose prose-sm max-w-none">
                          <ReactMarkdown children={character.description} />
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Background Section */}
                  {(character.personalityTraits || character.ideals || character.bonds || character.flaws || character.backstory) && (
                    <div className="bg-base-200 rounded-box p-6">
                      <h4 className="text-lg font-bold text-base-content mb-4 flex items-center gap-2">
                        <span className="text-2xl">🎭</span>
                        Background & Personality
                      </h4>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {character.personalityTraits && (
                          <div className="bg-base-100 rounded-box p-4 shadow-sm border border-base-300">
                            <div className="text-sm font-medium text-base-content/70 mb-2">Personality Traits</div>
                            <p className="text-sm text-base-content">{character.personalityTraits}</p>
                          </div>
                        )}
                        {character.ideals && (
                          <div className="bg-base-100 rounded-box p-4 shadow-sm border border-base-300">
                            <div className="text-sm font-medium text-base-content/70 mb-2">Ideals</div>
                            <p className="text-sm text-base-content">{character.ideals}</p>
                          </div>
                        )}
                        {character.bonds && (
                          <div className="bg-base-100 rounded-box p-4 shadow-sm border border-base-300">
                            <div className="text-sm font-medium text-base-content/70 mb-2">Bonds</div>
                            <p className="text-sm text-base-content">{character.bonds}</p>
                          </div>
                        )}
                        {character.flaws && (
                          <div className="bg-base-100 rounded-box p-4 shadow-sm border border-base-300">
                            <div className="text-sm font-medium text-base-content/70 mb-2">Flaws</div>
                            <p className="text-sm text-base-content">{character.flaws}</p>
                          </div>
                        )}
                      </div>
                      {character.backstory && (
                        <div className="bg-base-100 rounded-box p-4 shadow-sm border border-base-300 mt-4">
                          <div className="text-sm font-medium text-base-content/70 mb-2">Backstory</div>
                          <p className="text-sm text-base-content">{character.backstory}</p>
                        </div>
                      )}
                    </div>
                  )}

                  {/* Tags Section */}
                  {character.tags && character.tags.length > 0 && (
                    <div className="bg-base-200 rounded-box p-6">
                      <h4 className="text-lg font-bold text-base-content mb-4 flex items-center gap-2">
                        <span className="text-2xl">🏷️</span>
                        Tags
                      </h4>
                      <div className="flex flex-wrap gap-2">
                        {(character.tags).map(tag => (
                          <span key={tag} className="badge badge-primary badge-outline">
                            {tag}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Adventure Link */}
                  {character.adventure_id && (
                    <div className="bg-primary/10 rounded-box p-4 border border-primary/20">
                      <div className="flex items-center gap-2 text-primary">
                        <span className="text-lg">🗺️</span>
                        <span className="font-medium">Adventure:</span>
                        <span>{adv.adventures.find(a => a.id === character.adventure_id)?.title || 'Unknown'}</span>
                      </div>
                    </div>
                  )}
                </div>
              )}
              </div>
            </div>
          );
        })}
      </div>
    </Page>
  );
}
