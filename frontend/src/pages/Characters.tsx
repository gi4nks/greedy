import { useState, useEffect, useRef } from 'react';
import axios from 'axios';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import Page from '../components/Page';
import { useAdventures } from '../contexts/AdventureContext';
import { Character, CharacterForm, CharacterItem, MagicItem } from '@greedy/shared';

function Chip({ label, onRemove }: { label: string; onRemove: () => void }) {
  return (
    <span className="inline-flex items-center bg-gray-200 text-gray-800 px-2 py-1 rounded mr-2 mb-2">
      {label}
      <button onClick={onRemove} className="ml-2 text-red-500">×</button>
    </span>
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
    <Page title="Characters" toolbar={<button onClick={() => setShowCreateForm(true)} className="bg-orange-600 text-white px-3 py-1 rounded">+</button>}>
      <div className="mb-4">
        <form onSubmit={(e) => { e.preventDefault(); doSearch(searchTerm); }}>
          <input
            type="text"
            placeholder="Search Characters..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full p-2 border rounded"
          />
        </form>
      </div>

      {(showCreateForm || editingId) && (
        <form onSubmit={handleSubmit} className="mb-6 p-6 bg-white rounded-lg shadow-lg border">
          <h3 className="text-xl font-bold mb-6 text-center">{editingId ? 'Edit Character' : 'Create New Character'}</h3>

          {/* Tab Navigation */}
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
                    ? 'border-b-2 border-orange-600 text-orange-600'
                    : 'text-gray-500 hover:text-gray-700'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>

          {/* Tab Content */}
          {activeTab === 'basic' && (
            <div className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-1">Character Name</label>
                  <input
                    type="text"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    className="w-full p-2 border rounded"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Race</label>
                  <input
                    type="text"
                    value={formData.race || ''}
                    onChange={(e) => setFormData({ ...formData, race: e.target.value })}
                    className="w-full p-2 border rounded"
                    placeholder="e.g., Human, Elf, Dwarf"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Background</label>
                  <input
                    type="text"
                    value={formData.background || ''}
                    onChange={(e) => setFormData({ ...formData, background: e.target.value })}
                    className="w-full p-2 border rounded"
                    placeholder="e.g., Noble, Criminal, Entertainer"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Alignment</label>
                  <select
                    value={formData.alignment || ''}
                    onChange={(e) => setFormData({ ...formData, alignment: e.target.value })}
                    className="w-full p-2 border rounded"
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
                  <label className="block text-sm font-medium mb-1">Experience Points</label>
                  <input
                    type="number"
                    min="0"
                    value={formData.experience || 0}
                    onChange={(e) => setFormData({ ...formData, experience: parseInt(e.target.value) || 0 })}
                    className="w-full p-2 border rounded"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Adventure</label>
                  <select
                    value={formData.adventure_id || ''}
                    onChange={(e) => setFormData({ ...formData, adventure_id: e.target.value ? parseInt(e.target.value) : undefined })}
                    className="w-full p-2 border rounded"
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
            <div className="space-y-6">
              <div>
                <h4 className="text-lg font-semibold mb-3">Classes</h4>
                <p className="text-sm text-gray-600 mb-3">
                  Add and manage your character's classes. Each class can have its own level and experience points.
                </p>
                {(formData.classes || []).map((classInfo, index) => (
                  <div key={index} className="flex items-center gap-2 mb-2 p-3 bg-gray-50 rounded border">
                    <input
                      type="text"
                      placeholder="Class name (e.g., Fighter, Wizard)"
                      value={classInfo.className}
                      onChange={(e) => {
                        const newClasses = [...(formData.classes || [])];
                        newClasses[index] = { ...newClasses[index], className: e.target.value };
                        setFormData({ ...formData, classes: newClasses });
                      }}
                      className="flex-1 p-2 border rounded"
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
                      className="w-20 p-2 border rounded"
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
                      className="w-28 p-2 border rounded"
                      title="Experience points earned specifically for this class"
                    />
                    <button
                      type="button"
                      onClick={() => {
                        const newClasses = (formData.classes || []).filter((_, i) => i !== index);
                        setFormData({ ...formData, classes: newClasses });
                      }}
                      className="bg-red-500 text-white px-3 py-2 rounded hover:bg-red-600"
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
                  className="bg-green-600 text-white px-4 py-2 rounded hover:bg-green-700"
                >
                  Add Class
                </button>
              </div>
            </div>
          )}

          {activeTab === 'abilities' && (
            <div className="space-y-6">
              <h4 className="text-lg font-semibold mb-3">Ability Scores</h4>
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
                <div className="text-center">
                  <label className="block text-sm font-medium mb-1">STR</label>
                  <input
                    type="number"
                    min="1"
                    max="30"
                    value={formData.strength || 10}
                    onChange={(e) => setFormData({ ...formData, strength: parseInt(e.target.value) || 10 })}
                    className="w-full p-2 border rounded text-center font-bold"
                  />
                  <div className="text-xs text-gray-600 mt-1">+{Math.floor(((formData.strength || 10) - 10) / 2)}</div>
                </div>
                <div className="text-center">
                  <label className="block text-sm font-medium mb-1">DEX</label>
                  <input
                    type="number"
                    min="1"
                    max="30"
                    value={formData.dexterity || 10}
                    onChange={(e) => setFormData({ ...formData, dexterity: parseInt(e.target.value) || 10 })}
                    className="w-full p-2 border rounded text-center font-bold"
                  />
                  <div className="text-xs text-gray-600 mt-1">+{Math.floor(((formData.dexterity || 10) - 10) / 2)}</div>
                </div>
                <div className="text-center">
                  <label className="block text-sm font-medium mb-1">CON</label>
                  <input
                    type="number"
                    min="1"
                    max="30"
                    value={formData.constitution || 10}
                    onChange={(e) => setFormData({ ...formData, constitution: parseInt(e.target.value) || 10 })}
                    className="w-full p-2 border rounded text-center font-bold"
                  />
                  <div className="text-xs text-gray-600 mt-1">+{Math.floor(((formData.constitution || 10) - 10) / 2)}</div>
                </div>
                <div className="text-center">
                  <label className="block text-sm font-medium mb-1">INT</label>
                  <input
                    type="number"
                    min="1"
                    max="30"
                    value={formData.intelligence || 10}
                    onChange={(e) => setFormData({ ...formData, intelligence: parseInt(e.target.value) || 10 })}
                    className="w-full p-2 border rounded text-center font-bold"
                  />
                  <div className="text-xs text-gray-600 mt-1">+{Math.floor(((formData.intelligence || 10) - 10) / 2)}</div>
                </div>
                <div className="text-center">
                  <label className="block text-sm font-medium mb-1">WIS</label>
                  <input
                    type="number"
                    min="1"
                    max="30"
                    value={formData.wisdom || 10}
                    onChange={(e) => setFormData({ ...formData, wisdom: parseInt(e.target.value) || 10 })}
                    className="w-full p-2 border rounded text-center font-bold"
                  />
                  <div className="text-xs text-gray-600 mt-1">+{Math.floor(((formData.wisdom || 10) - 10) / 2)}</div>
                </div>
                <div className="text-center">
                  <label className="block text-sm font-medium mb-1">CHA</label>
                  <input
                    type="number"
                    min="1"
                    max="30"
                    value={formData.charisma || 10}
                    onChange={(e) => setFormData({ ...formData, charisma: parseInt(e.target.value) || 10 })}
                    className="w-full p-2 border rounded text-center font-bold"
                  />
                  <div className="text-xs text-gray-600 mt-1">+{Math.floor(((formData.charisma || 10) - 10) / 2)}</div>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'combat' && (
            <div className="space-y-6">
              <h4 className="text-lg font-semibold mb-3">Combat Statistics</h4>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-1">Hit Points</label>
                  <input
                    type="number"
                    min="0"
                    value={formData.hitPoints || 0}
                    onChange={(e) => setFormData({ ...formData, hitPoints: parseInt(e.target.value) || 0 })}
                    className="w-full p-2 border rounded"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Max Hit Points</label>
                  <input
                    type="number"
                    min="0"
                    value={formData.maxHitPoints || 0}
                    onChange={(e) => setFormData({ ...formData, maxHitPoints: parseInt(e.target.value) || 0 })}
                    className="w-full p-2 border rounded"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Armor Class</label>
                  <input
                    type="number"
                    min="0"
                    value={formData.armorClass || 10}
                    onChange={(e) => setFormData({ ...formData, armorClass: parseInt(e.target.value) || 10 })}
                    className="w-full p-2 border rounded"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Speed</label>
                  <input
                    type="number"
                    min="0"
                    value={formData.speed || 30}
                    onChange={(e) => setFormData({ ...formData, speed: parseInt(e.target.value) || 30 })}
                    className="w-full p-2 border rounded"
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-1">Initiative</label>
                  <input
                    type="number"
                    value={formData.initiative || 0}
                    onChange={(e) => setFormData({ ...formData, initiative: parseInt(e.target.value) || 0 })}
                    className="w-full p-2 border rounded"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Proficiency Bonus</label>
                  <input
                    type="number"
                    min="0"
                    max="6"
                    value={formData.proficiencyBonus || 2}
                    onChange={(e) => setFormData({ ...formData, proficiencyBonus: parseInt(e.target.value) || 2 })}
                    className="w-full p-2 border rounded"
                  />
                </div>
              </div>
            </div>
          )}

          {activeTab === 'items' && (
            <div className="space-y-6">
              <h4 className="text-lg font-semibold mb-3">Magical Items</h4>

              {/* Magical Items Section */}
              <div className="mb-6">
                <h5 className="text-md font-medium mb-3 flex items-center gap-2">
                  <span className="text-purple-600">✨</span>
                  Magical Items
                </h5>
                <div className="mb-4">
                  <h6 className="text-sm font-medium text-gray-700 mb-2">Assigned Magical Items</h6>
                  <div className="space-y-2">
                    {magicItems
                      .filter(item => item.owners?.some(owner => owner.id === editingId))
                      .map(item => (
                        <div key={item.id} className="flex items-center justify-between bg-purple-50 p-3 rounded border border-purple-200">
                          <div className="flex-1">
                            <div className="flex items-center gap-2">
                              <span className="font-semibold text-purple-800">{item.name}</span>
                              {item.rarity && (
                                <span className="text-xs bg-purple-100 text-purple-700 px-2 py-1 rounded">
                                  {item.rarity}
                                </span>
                              )}
                              {item.type && (
                                <span className="text-xs bg-blue-100 text-blue-700 px-2 py-1 rounded">
                                  {item.type}
                                </span>
                              )}
                            </div>
                            {item.description && (
                              <p className="text-sm text-gray-600 mt-1">{item.description}</p>
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
                            className="bg-red-500 text-white px-3 py-1 rounded text-sm hover:bg-red-600"
                          >
                            Remove
                          </button>
                        </div>
                      ))}
                    {magicItems.filter(item => item.owners?.some(owner => owner.id === editingId)).length === 0 && (
                      <div className="text-gray-500 italic text-sm p-3 bg-gray-50 rounded">
                        No magical items assigned
                      </div>
                    )}
                  </div>
                </div>

                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={() => setShowAssignModal(true)}
                    className="bg-purple-600 text-white px-4 py-2 rounded hover:bg-purple-700"
                  >
                    Assign a Magical Item
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
                    className="bg-purple-600 text-white px-4 py-2 rounded hover:bg-purple-700"
                  >
                    Create & Assign Magical Item
                  </button>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'spells' && (
            <div className="space-y-6">
              <h4 className="text-lg font-semibold mb-3">Spellcasting</h4>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
                <div>
                  <label className="block text-sm font-medium mb-1">Spellcasting Ability</label>
                  <select
                    value={formData.spellcastingAbility || ''}
                    onChange={(e) => setFormData({ ...formData, spellcastingAbility: e.target.value })}
                    className="w-full p-2 border rounded"
                  >
                    <option value="">None</option>
                    <option value="Intelligence">Intelligence</option>
                    <option value="Wisdom">Wisdom</option>
                    <option value="Charisma">Charisma</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Spell Save DC</label>
                  <input
                    type="number"
                    min="0"
                    value={formData.spellSaveDC || 0}
                    onChange={(e) => setFormData({ ...formData, spellSaveDC: parseInt(e.target.value) || 0 })}
                    className="w-full p-2 border rounded"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Spell Attack Bonus</label>
                  <input
                    type="number"
                    value={formData.spellAttackBonus || 0}
                    onChange={(e) => setFormData({ ...formData, spellAttackBonus: parseInt(e.target.value) || 0 })}
                    className="w-full p-2 border rounded"
                  />
                </div>
              </div>
              <div>
                <h5 className="text-md font-medium mb-2">Known Spells</h5>
                {(formData.spells || []).map((spell, index) => (
                  <div key={index} className="flex items-center gap-2 mb-2 p-2 bg-gray-50 rounded">
                    <select
                      value={spell.level}
                      onChange={(e) => {
                        const newSpells = [...(formData.spells || [])];
                        newSpells[index] = { ...newSpells[index], level: parseInt(e.target.value) as 0 | 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9 };
                        setFormData({ ...formData, spells: newSpells });
                      }}
                      className="p-2 border rounded"
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
                      className="flex-1 p-2 border rounded"
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
                      className="bg-red-500 text-white px-3 py-2 rounded"
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
                  className="bg-green-600 text-white px-4 py-2 rounded"
                >
                  Add Spell
                </button>
              </div>
            </div>
          )}

          {activeTab === 'background' && (
            <div className="space-y-6">
              <h4 className="text-lg font-semibold mb-3">Background & Personality</h4>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-1">Personality Traits</label>
                  <textarea
                    value={formData.personalityTraits || ''}
                    onChange={(e) => setFormData({ ...formData, personalityTraits: e.target.value })}
                    className="w-full p-2 border rounded h-24"
                    placeholder="Describe your character's personality traits..."
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Ideals</label>
                  <textarea
                    value={formData.ideals || ''}
                    onChange={(e) => setFormData({ ...formData, ideals: e.target.value })}
                    className="w-full p-2 border rounded h-24"
                    placeholder="What does your character believe in..."
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Bonds</label>
                  <textarea
                    value={formData.bonds || ''}
                    onChange={(e) => setFormData({ ...formData, bonds: e.target.value })}
                    className="w-full p-2 border rounded h-24"
                    placeholder="What ties does your character have..."
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Flaws</label>
                  <textarea
                    value={formData.flaws || ''}
                    onChange={(e) => setFormData({ ...formData, flaws: e.target.value })}
                    className="w-full p-2 border rounded h-24"
                    placeholder="What are your character's weaknesses..."
                  />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Backstory</label>
                <textarea
                  value={formData.backstory || ''}
                  onChange={(e) => setFormData({ ...formData, backstory: e.target.value })}
                  className="w-full p-2 border rounded h-32"
                  placeholder="Tell your character's story..."
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Legacy Description</label>
                <textarea
                  placeholder="Character description (Markdown supported)"
                  value={formData.description || ''}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  className="w-full p-2 border rounded h-32"
                />
              </div>
              <div>
                <h5 className="text-md font-medium mb-2">Tags</h5>
                <div className="flex items-center mb-2">
                  <input ref={tagInputRef} type="text" placeholder="Add tag" className="p-2 border rounded mr-2 flex-1" />
                  <button type="button" onClick={handleAddTag} className="bg-gray-700 text-white px-3 py-2 rounded">Add Tag</button>
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
          <div className="flex justify-end space-x-2 mt-6 pt-4 border-t">
            <button type="submit" className="bg-orange-600 text-white px-6 py-2 rounded font-semibold">
              {editingId ? 'Update Character' : 'Create Character'}
            </button>
            <button
              type="button"
              onClick={() => {
                setFormData(resetForm());
                setEditingId(null);
                setShowCreateForm(false);
                setActiveTab('basic');
              }}
              className="bg-gray-500 text-white px-6 py-2 rounded"
            >
              Cancel
            </button>
          </div>
        </form>
      )}

      {/* Assign Magical Item Modal */}
      {showAssignModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4 max-h-96 overflow-y-auto">
            <h3 className="text-lg font-bold mb-4">Assign Magical Item</h3>
            <div className="space-y-2">
              {magicItems
                .filter(item => !item.owners?.some(owner => owner.id === editingId))
                .map(item => (
                  <div key={item.id} className="flex items-center justify-between p-3 border rounded hover:bg-gray-50">
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <span className="font-medium">{item.name}</span>
                        {item.rarity && (
                          <span className="text-xs bg-purple-100 text-purple-700 px-2 py-1 rounded">
                            {item.rarity}
                          </span>
                        )}
                        {item.type && (
                          <span className="text-xs bg-blue-100 text-blue-700 px-2 py-1 rounded">
                            {item.type}
                          </span>
                        )}
                      </div>
                      {item.description && (
                        <p className="text-sm text-gray-600 mt-1">{item.description}</p>
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
                      className="bg-green-600 text-white px-3 py-1 rounded text-sm hover:bg-green-700 ml-2"
                    >
                      Assign
                    </button>
                  </div>
                ))}
              {magicItems.filter(item => !item.owners?.some(owner => owner.id === editingId)).length === 0 && (
                <div className="text-gray-500 italic text-sm p-4 text-center">
                  No available magical items to assign
                </div>
              )}
            </div>
            <div className="flex justify-end mt-4">
              <button
                type="button"
                onClick={() => setShowAssignModal(false)}
                className="bg-gray-500 text-white px-4 py-2 rounded hover:bg-gray-600"
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
            <div key={character.id} className="bg-white rounded-xl shadow-lg border border-gray-200 overflow-hidden hover:shadow-xl transition-shadow duration-300">
              <div className="p-6 border-b border-gray-100">
                <div className="flex justify-between items-center">
                  <div className="flex items-center gap-3">
                    <button
                      onClick={() => toggleCollapse(character.id)}
                      className="w-8 h-8 flex items-center justify-center border-2 border-orange-200 rounded-full bg-orange-50 hover:bg-orange-100 hover:border-orange-300 transition-colors duration-200"
                      aria-label={isCollapsed ? 'Expand' : 'Collapse'}
                    >
                      <span className="text-lg font-bold text-orange-600">{isCollapsed ? '+' : '−'}</span>
                    </button>
                    <div>
                      <h3 className="text-2xl font-bold text-gray-900">{character.name}</h3>
                      <div className="flex items-center gap-4 mt-1 text-sm text-gray-600">
                        {character.race && <span className="flex items-center gap-1">
                          <span className="w-2 h-2 bg-blue-400 rounded-full"></span>
                          {character.race}
                        </span>}
                        {character.background && <span className="flex items-center gap-1">
                          <span className="w-2 h-2 bg-green-400 rounded-full"></span>
                          {character.background}
                        </span>}
                        {character.alignment && <span className="flex items-center gap-1">
                          <span className="w-2 h-2 bg-purple-400 rounded-full"></span>
                          {character.alignment}
                        </span>}
                      </div>
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <button
                      onClick={() => handleEdit(character as Character & { id: number })}
                      className="bg-amber-500 hover:bg-amber-600 text-white px-4 py-2 rounded-lg font-medium transition-colors duration-200 flex items-center gap-2"
                    >
                      <span>✏️</span>
                      Edit
                    </button>
                    <button
                      onClick={() => handleDelete(character.id)}
                      className="bg-red-500 hover:bg-red-600 text-white px-4 py-2 rounded-lg font-medium transition-colors duration-200 flex items-center gap-2"
                    >
                      <span>🗑️</span>
                      Delete
                    </button>
                  </div>
                </div>
              </div>

              {!isCollapsed && (
                <div className="p-6 space-y-6">
                  {/* Enhanced Recap Panel */}
                  <div className="bg-gradient-to-r from-orange-50 to-amber-50 rounded-xl p-6 border border-orange-200">
                    <h4 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
                      <span className="text-2xl">📊</span>
                      Character Recap
                    </h4>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
                      <div className="bg-white rounded-lg p-4 shadow-sm border border-gray-100">
                        <div className="text-sm font-medium text-gray-600 mb-1">Total Level</div>
                        <div className="text-2xl font-bold text-orange-600">
                          {character.classes && character.classes.length > 0
                            ? (character.classes as any[]).reduce((sum, c) => sum + (c.level || 0), 0)
                            : (character.level || 0)}
                        </div>
                      </div>
                      <div className="bg-white rounded-lg p-4 shadow-sm border border-gray-100">
                        <div className="text-sm font-medium text-gray-600 mb-1">Total XP</div>
                        <div className="text-2xl font-bold text-green-600">
                          {character.experience !== undefined && character.experience !== null ? character.experience.toLocaleString() : '—'}
                        </div>
                      </div>
                      <div className="bg-white rounded-lg p-4 shadow-sm border border-gray-100">
                        <div className="text-sm font-medium text-gray-600 mb-1">Hit Points</div>
                        <div className="text-2xl font-bold text-red-600">
                          {character.hitPoints !== undefined ? `${character.hitPoints}/${character.maxHitPoints || character.hitPoints}` : '—'}
                        </div>
                      </div>
                      <div className="bg-white rounded-lg p-4 shadow-sm border border-gray-100">
                        <div className="text-sm font-medium text-gray-600 mb-1">Armor Class</div>
                        <div className="text-2xl font-bold text-blue-600">
                          {character.armorClass !== undefined ? character.armorClass : '—'}
                        </div>
                      </div>
                    </div>
                    <div className="bg-white rounded-lg p-4 shadow-sm border border-gray-100">
                      <div className="text-sm font-medium text-gray-600 mb-2">Class Breakdown</div>
                      {character.classes && character.classes.length > 0 ? (
                        <div className="space-y-2">
                          {(character.classes as any[]).map((c, idx) => {
                            const classExp = c.experience ?? c.exp ?? c.xp ?? null;
                            return (
                              <div key={idx} className="flex items-center justify-between bg-gray-50 rounded-lg p-3">
                                <div className="flex items-center gap-3">
                                  <span className="w-3 h-3 bg-orange-400 rounded-full"></span>
                                  <span className="font-semibold text-gray-900">{c.className || 'Unknown'}</span>
                                  <span className="text-sm text-gray-600">Level {c.level || 0}</span>
                                </div>
                                {classExp && (
                                  <span className="text-sm font-medium text-green-600 bg-green-50 px-2 py-1 rounded">
                                    {classExp.toLocaleString()} XP
                                  </span>
                                )}
                              </div>
                            );
                          })}
                        </div>
                      ) : (
                        <div className="text-gray-500 italic">
                          {character.class ? `${character.class} — Level ${character.level || 0}` : 'No class information'}
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Ability Scores Section */}
                  {(character.strength || character.dexterity || character.constitution || character.intelligence || character.wisdom || character.charisma) && (
                    <div className="bg-gray-50 rounded-xl p-6">
                      <h4 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
                        <span className="text-2xl">💪</span>
                        Ability Scores
                      </h4>
                      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
                        {[
                          { name: 'STR', value: character.strength, color: 'bg-red-500' },
                          { name: 'DEX', value: character.dexterity, color: 'bg-green-500' },
                          { name: 'CON', value: character.constitution, color: 'bg-yellow-500' },
                          { name: 'INT', value: character.intelligence, color: 'bg-blue-500' },
                          { name: 'WIS', value: character.wisdom, color: 'bg-purple-500' },
                          { name: 'CHA', value: character.charisma, color: 'bg-pink-500' }
                        ].map(({ name, value, color }) => value && (
                          <div key={name} className="bg-white rounded-lg p-4 shadow-sm border border-gray-100 text-center">
                            <div className="text-sm font-medium text-gray-600 mb-2">{name}</div>
                            <div className="text-2xl font-bold text-gray-900 mb-1">{value}</div>
                            <div className={`text-sm font-medium ${color.replace('bg-', 'text-').replace('-500', '-600')}`}>
                              +{Math.floor((value - 10) / 2)}
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Combat Stats Section */}
                  {(character.hitPoints !== undefined || character.armorClass !== undefined || character.speed !== undefined || character.proficiencyBonus !== undefined) && (
                    <div className="bg-gray-50 rounded-xl p-6">
                      <h4 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
                        <span className="text-2xl">⚔️</span>
                        Combat Statistics
                      </h4>
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                        {character.hitPoints !== undefined && (
                          <div className="bg-white rounded-lg p-4 shadow-sm border border-gray-100">
                            <div className="text-sm font-medium text-gray-600 mb-1">Hit Points</div>
                            <div className="text-xl font-bold text-red-600">{character.hitPoints}/{character.maxHitPoints || character.hitPoints}</div>
                          </div>
                        )}
                        {character.armorClass !== undefined && (
                          <div className="bg-white rounded-lg p-4 shadow-sm border border-gray-100">
                            <div className="text-sm font-medium text-gray-600 mb-1">Armor Class</div>
                            <div className="text-xl font-bold text-blue-600">{character.armorClass}</div>
                          </div>
                        )}
                        {character.speed !== undefined && (
                          <div className="bg-white rounded-lg p-4 shadow-sm border border-gray-100">
                            <div className="text-sm font-medium text-gray-600 mb-1">Speed</div>
                            <div className="text-xl font-bold text-green-600">{character.speed} ft.</div>
                          </div>
                        )}
                        {character.proficiencyBonus !== undefined && (
                          <div className="bg-white rounded-lg p-4 shadow-sm border border-gray-100">
                            <div className="text-sm font-medium text-gray-600 mb-1">Proficiency</div>
                            <div className="text-xl font-bold text-purple-600">+{character.proficiencyBonus}</div>
                          </div>
                        )}
                      </div>
                    </div>
                  )}

                  {/* Items Section */}
                  {character.items && character.items.length > 0 && (
                    <div className="bg-gray-50 rounded-xl p-6">
                      <h4 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
                        <span className="text-2xl">🎒</span>
                        Items & Equipment ({character.items.length})
                      </h4>
                      <div className="space-y-3">
                        {character.items.slice(0, 5).map((item, idx) => (
                          <div key={idx} className="bg-white rounded-lg p-4 shadow-sm border border-gray-100">
                            <div className="flex items-start justify-between">
                              <div className="flex-1">
                                <div className="flex items-center gap-2 mb-1">
                                  <span className={`font-semibold ${item.equipped ? 'text-green-700' : 'text-gray-900'}`}>
                                    {item.name}
                                  </span>
                                  {item.equipped && <span className="text-xs bg-green-100 text-green-700 px-2 py-1 rounded-full">Equipped</span>}
                                  {item.quantity && item.quantity > 1 && (
                                    <span className="text-xs bg-blue-100 text-blue-700 px-2 py-1 rounded-full">
                                      Qty: {item.quantity}
                                    </span>
                                  )}
                                </div>
                                {item.description && (
                                  <p className="text-sm text-gray-600 mt-1">{item.description}</p>
                                )}
                              </div>
                            </div>
                          </div>
                        ))}
                        {character.items.length > 5 && (
                          <div className="text-center text-gray-500 text-sm">
                            ...and {character.items.length - 5} more items
                          </div>
                        )}
                      </div>
                    </div>
                  )}

                  {/* Spells Section */}
                  {character.spells && character.spells.length > 0 && (
                    <div className="bg-gray-50 rounded-xl p-6">
                      <h4 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
                        <span className="text-2xl">🔮</span>
                        Spells ({character.spells.length})
                      </h4>
                      <div className="space-y-3">
                        {character.spells.slice(0, 8).map((spell, idx) => (
                          <div key={idx} className="bg-white rounded-lg p-4 shadow-sm border border-gray-100">
                            <div className="flex items-center justify-between">
                              <div className="flex items-center gap-3">
                                <span className={`text-xs px-2 py-1 rounded-full font-medium ${
                                  spell.level === 0
                                    ? 'bg-yellow-100 text-yellow-700'
                                    : 'bg-blue-100 text-blue-700'
                                }`}>
                                  {spell.level === 0 ? 'Cantrip' : `Level ${spell.level}`}
                                </span>
                                <span className="font-semibold text-gray-900">{spell.name}</span>
                              </div>
                              {spell.prepared && (
                                <span className="text-xs bg-green-100 text-green-700 px-2 py-1 rounded-full">
                                  Prepared
                                </span>
                              )}
                            </div>
                          </div>
                        ))}
                        {character.spells.length > 8 && (
                          <div className="text-center text-gray-500 text-sm">
                            ...and {character.spells.length - 8} more spells
                          </div>
                        )}
                      </div>
                    </div>
                  )}

                  {/* Description Section */}
                  {character.description && (
                    <div className="bg-gray-50 rounded-xl p-6">
                      <h4 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
                        <span className="text-2xl">📖</span>
                        Description
                      </h4>
                      <div className="bg-white rounded-lg p-4 shadow-sm border border-gray-100">
                        <div className="prose prose-sm max-w-none">
                          <ReactMarkdown children={character.description} />
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Background Section */}
                  {(character.personalityTraits || character.ideals || character.bonds || character.flaws || character.backstory) && (
                    <div className="bg-gray-50 rounded-xl p-6">
                      <h4 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
                        <span className="text-2xl">🎭</span>
                        Background & Personality
                      </h4>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {character.personalityTraits && (
                          <div className="bg-white rounded-lg p-4 shadow-sm border border-gray-100">
                            <div className="text-sm font-medium text-gray-600 mb-2">Personality Traits</div>
                            <p className="text-sm text-gray-900">{character.personalityTraits}</p>
                          </div>
                        )}
                        {character.ideals && (
                          <div className="bg-white rounded-lg p-4 shadow-sm border border-gray-100">
                            <div className="text-sm font-medium text-gray-600 mb-2">Ideals</div>
                            <p className="text-sm text-gray-900">{character.ideals}</p>
                          </div>
                        )}
                        {character.bonds && (
                          <div className="bg-white rounded-lg p-4 shadow-sm border border-gray-100">
                            <div className="text-sm font-medium text-gray-600 mb-2">Bonds</div>
                            <p className="text-sm text-gray-900">{character.bonds}</p>
                          </div>
                        )}
                        {character.flaws && (
                          <div className="bg-white rounded-lg p-4 shadow-sm border border-gray-100">
                            <div className="text-sm font-medium text-gray-600 mb-2">Flaws</div>
                            <p className="text-sm text-gray-900">{character.flaws}</p>
                          </div>
                        )}
                      </div>
                      {character.backstory && (
                        <div className="bg-white rounded-lg p-4 shadow-sm border border-gray-100 mt-4">
                          <div className="text-sm font-medium text-gray-600 mb-2">Backstory</div>
                          <p className="text-sm text-gray-900">{character.backstory}</p>
                        </div>
                      )}
                    </div>
                  )}

                  {/* Tags Section */}
                  {character.tags && character.tags.length > 0 && (
                    <div className="bg-gray-50 rounded-xl p-6">
                      <h4 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
                        <span className="text-2xl">🏷️</span>
                        Tags
                      </h4>
                      <div className="flex flex-wrap gap-2">
                        {(character.tags).map(tag => (
                          <span key={tag} className="bg-orange-100 text-orange-800 px-3 py-1 rounded-full text-sm font-medium">
                            {tag}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Adventure Link */}
                  {character.adventure_id && (
                    <div className="bg-blue-50 rounded-xl p-4 border border-blue-200">
                      <div className="flex items-center gap-2 text-blue-700">
                        <span className="text-lg">🗺️</span>
                        <span className="font-medium">Adventure:</span>
                        <span>{adv.adventures.find(a => a.id === character.adventure_id)?.title || 'Unknown'}</span>
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </Page>
  );
}
