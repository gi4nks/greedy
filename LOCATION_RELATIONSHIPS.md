# Location Relationships Feature

## Overview

The Location Relationships feature allows you to create meaningful connections between locations and other entities in your campaign:

- **Characters and Locations**: Track where characters live, work, own property, frequently visit, or actively avoid
- **Quests and Locations**: Connect quests to their relevant locations with specific relationship types

## Character-Location Relationships

### Relationship Types

- **🏠 Lives At**: Character's primary residence
- **💼 Works At**: Character's workplace or professional location  
- **👑 Owns**: Character owns this property or location
- **🔄 Frequents**: Character regularly visits this location
- **👋 Visits**: Character occasionally visits this location
- **❌ Avoids**: Character actively avoids this location

### Special Properties

- **Current Location**: Mark a location as the character's current position
- **Notes**: Add contextual information about the relationship

## Quest-Location Relationships

### Relationship Types

- **📍 Takes Place At**: Primary location where quest events occur
- **🚀 Starts At**: Quest begins at this location
- **🏁 Ends At**: Quest concludes at this location  
- **➡️ Leads To**: Quest progression leads to this location
- **🔗 Involves**: Quest involves this location in some way

### Special Properties

- **Primary Location**: Mark the most important location for the quest
- **Notes**: Add details about how the location relates to the quest

## How to Use

### Adding Relationships

1. **From Location Page**: 
   - Navigate to Locations in the Campaign menu
   - Expand a location card to see its details
   - Use the "Relationships" section at the bottom
   - Switch between Characters and Quests tabs
   - Fill in the form and click "Add"

2. **From Character/Quest Pages**:
   - Location relationships are displayed as badges
   - Shows the relationship type with appropriate icons
   - Current/Primary locations are highlighted

### Managing Relationships

- **View**: Relationships appear as colored badges with icons
- **Remove**: Click the "Remove" button next to any relationship
- **Update**: Remove the old relationship and add a new one

## Database Schema

The feature uses two junction tables:

### `character_locations`
- `character_id`, `location_id`, `relationship_type`
- `notes`, `is_current` (boolean flag)
- Unique constraint on character + location + relationship type

### `quest_locations`  
- `quest_id`, `location_id`, `relationship_type`
- `notes`, `is_primary` (boolean flag)
- Unique constraint on quest + location + relationship type

## API Endpoints

### Location Relationships
- `POST /api/locations/:id/characters` - Add character relationship
- `DELETE /api/locations/:id/characters/:characterId` - Remove character relationship
- `POST /api/locations/:id/quests` - Add quest relationship  
- `DELETE /api/locations/:id/quests/:questId` - Remove quest relationship

### Enhanced Entity Endpoints
- `GET /api/locations` - Now includes `characters[]` and `quests[]` arrays
- `GET /api/locations/:id` - Includes full relationship data with entity names
- `GET /api/characters/:id` - Now includes `locations[]` array
- `GET /api/quests/:id` - Now includes `locations[]` array

## Examples

### Character Examples
- "Evrym **lives at** Waterdeep Inn"
- "Marcus **works at** The Forge (Current location)"  
- "Thief **avoids** City Guard Barracks"

### Quest Examples
- "Rescue Mission **starts at** Tavern"
- "Dragon Hunt **takes place at** Mountain Cave (Primary)"
- "Investigation **leads to** Noble's Manor"

## Benefits

1. **Spatial Awareness**: Track where characters and quests are in your world
2. **Story Connections**: See how locations tie into character backgrounds and quest narratives  
3. **Campaign Continuity**: Remember important location relationships across sessions
4. **Network Visualization**: Location relationships appear in the network diagram
5. **Quick Reference**: Easily see all entities associated with each location

This feature enhances the spatial dimension of your campaign management, making it easier to track the complex web of relationships between characters, quests, and the locations that define your world.