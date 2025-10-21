# Open5e API Integration - Quick Start Guide

## 🎯 What Changed?

The wiki import system for **D&D 5e campaigns** now uses the **Open5e API** instead of local 5e.tools data files.

**Important:** AD&D 2.0 campaigns are **unchanged** and continue to use the Fandom Wiki.

---

## 🚀 Quick Start

### For D&D 5e Campaigns

1. **Go to Wiki Import**
   - Navigate to `/wiki`
   - Select a D&D 5e campaign

2. **Search for Content**
   - Choose a category (Magic Items, Spells, Monsters, etc.)
   - Enter search query
   - Results appear with "**D&D 5e (Open5e API)**" badge

3. **Import Items**
   - Click on a result to see details
   - Click "Import" to save to your campaign
   - Assign to character or campaign as needed

### For AD&D 2e Campaigns

Use the wiki import exactly as before - everything works the same:
- Results show "**AD&D 2e (Fandom Wiki)**" badge
- Content sourced from Fandom Wiki
- No changes to workflow

---

## ✨ Key Features

### Search
- ✅ Real-time search from Open5e API
- ✅ All D&D 5e content categories
- ✅ Instant results

### Import
- ✅ Save items to your campaign database
- ✅ Assign to specific characters
- ✅ Full details preserved
- ✅ Works offline after import

### Assignment
- ✅ Link to campaigns
- ✅ Link to characters
- ✅ Add custom notes
- ✅ Manage relationships

---

## 📊 Search Categories

### Available for D&D 5e (Open5e API)
- 🐲 **Monsters & Creatures**
- ✨ **Spells & Magic**
- 🗡️ **Magic Items**
- 👥 **Races & Species**
- ⚔️ **Classes & Professions**

### Available for AD&D 2e (Fandom Wiki)
- Same categories, sourced from Fandom

---

## 🧪 Example Searches

### Magic Items
- "Belt of Dwarvenkind" → Rare item, dwarf-related
- "Ring of Invisibility" → Rare item, invisibility
- "Bag of Holding" → Wondrous item

### Spells
- "Fireball" → Level 3, Evocation
- "Magic Missile" → Level 1, Evocation
- "Cure Wounds" → Level 1, Abjuration

### Monsters
- "Ankheg" → Large Monstrosity, CR 3
- "Goblin" → Small Humanoid, CR 1/8
- "Dragon" → Search for dragon types

### Races
- "Elf" → Includes subraces
- "Dwarf" → Includes subraces
- "Human" → Basic human race

### Classes
- "Wizard" → Full class details
- "Barbarian" → Full class details
- "Cleric" → Full class details

---

## 🔄 How It Works

### D&D 5e Campaign Flow
```
You search "Fireball"
    ↓
System detects D&D 5e campaign
    ↓
Queries Open5e API in real-time
    ↓
Returns D&D 5e spell data
    ↓
Displays with "Open5e API" badge
    ↓
You import it
    ↓
Saved to your campaign database
```

### AD&D 2e Campaign Flow
```
You search "Magic Missile"
    ↓
System detects AD&D 2e campaign
    ↓
Queries Fandom Wiki
    ↓
Returns AD&D 2e spell data
    ↓
Displays with "Fandom Wiki" badge
    ↓
You import it
    ↓
Saved to your campaign database
```

---

## ⚙️ Technical Details

### API Endpoint
- **Service:** Open5e
- **URL:** https://api.open5e.com/
- **Available 24/7** for D&D 5e content

### Data Sources
- **D&D 5e:** Open5e API (real-time)
- **AD&D 2e:** Fandom Wiki (unchanged)

### Campaign Detection
Automatically detects edition from:
- Campaign settings
- Edition name (e.g., "5th Edition", "AD&D 2e")
- Defaults to D&D 5e if unclear

---

## 🆘 Troubleshooting

### "No results found"
- Try alternative search terms
- Check spelling
- Verify campaign edition is correct
- Open5e API might be temporarily unavailable

### Results show wrong source
- Check that campaign edition is set correctly
- Go to campaign settings and verify
- Switch campaigns and try again

### Import fails
- Check internet connection
- Verify campaign is selected
- Try again in a few moments
- Check browser console for error messages

### Search is slow
- Open5e API is sometimes slower during peak hours
- Wait a few seconds for results
- Try a more specific search

---

## 📱 Browser Support

Works on:
- ✅ Chrome (latest)
- ✅ Firefox (latest)
- ✅ Safari (latest)
- ✅ Edge (latest)

Requires JavaScript enabled.

---

## 🔗 Resources

- **Open5e:** https://open5e.com/
- **Open5e API Docs:** https://api.open5e.com/schema/swagger-ui/
- **Campaign Management:** See your campaign settings

---

## ❓ FAQ

**Q: Will my imported items from 5e.tools still work?**  
A: Yes! All previously imported items remain in your database. This change only affects new searches.

**Q: Can I use this offline?**  
A: Searches require internet. Once imported, items are available offline.

**Q: Does this affect AD&D campaigns?**  
A: No! AD&D 2.0 continues to use Fandom Wiki exactly as before.

**Q: How often is Open5e content updated?**  
A: Open5e is kept current with official D&D 5e updates. You always get the latest content.

**Q: Can I suggest new content?**  
A: Open5e is community-driven. Visit https://github.com/eepMoose/open5e for contributions.

**Q: What if Open5e API goes down?**  
A: The app gracefully handles downtime. You can still use previously imported content.

---

## 💡 Tips & Tricks

### Best Search Practices
- Use exact item names when possible
- Try singular forms ("Elf" not "Elves")
- Use common names before exotic ones
- Spell names are case-insensitive

### Organization Tips
- Import to campaign first, then assign to characters
- Add notes during assignment for custom tracking
- Use consistent naming for easy searching

### Performance Tips
- Specific searches are faster than broad ones
- Avoid very common terms like "magic"
- Search for category-specific content

---

## 📞 Support

For issues:
1. Check the Troubleshooting section above
2. Verify your internet connection
3. Verify campaign edition is set correctly
4. Check the browser console (F12) for error messages
5. Try searching in a different campaign

---

**Last Updated:** October 21, 2025  
**Status:** ✅ Live and Operational
