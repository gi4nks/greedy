import { Router } from 'express';
import multer from 'multer';
import path from 'path';
import fs from 'fs';
import { db } from '../../db';

const router = Router();

// Configure multer for file uploads
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const { category } = req.params;
    const uploadPath = path.join(__dirname, '../../data/images', category);

    // Ensure directory exists
    if (!fs.existsSync(uploadPath)) {
      fs.mkdirSync(uploadPath, { recursive: true });
    }

    cb(null, uploadPath);
  },
  filename: (req, file, cb) => {
    const { id } = req.params;
    const extension = path.extname(file.originalname);
    const filename = `${id}_${Date.now()}${extension}`;
    cb(null, filename);
  }
});

const upload = multer({
  storage,
  limits: {
    fileSize: 5 * 1024 * 1024, // 5MB limit
  },
  fileFilter: (req, file, cb) => {
    // Allow only image files
    if (file.mimetype.startsWith('image/')) {
      cb(null, true);
    } else {
      cb(new Error('Only image files are allowed'));
    }
  }
});

// Upload image for a specific entity
router.post('/:category/:id', upload.single('image'), (req, res) => {
  try {
    const { category, id } = req.params;

    if (!req.file) {
      return res.status(400).json({ error: 'No image file provided' });
    }

    // Validate category
    const validCategories = ['adventures', 'sessions', 'quests', 'characters', 'magic_items', 'npcs'];
    if (!validCategories.includes(category)) {
      return res.status(400).json({ error: 'Invalid category' });
    }

    // Generate relative path for database storage
    const relativePath = `images/${category}/${req.file.filename}`;

    // Insert into entity_images table
    const insertQuery = `
      INSERT INTO entity_images (entity_type, entity_id, image_path, display_order)
      VALUES (?, ?, ?, (SELECT COALESCE(MAX(display_order), 0) + 1 FROM entity_images WHERE entity_type = ? AND entity_id = ?))
    `;
    const result = db.prepare(insertQuery).run(category, id, relativePath, category, id);

    res.json({
      message: 'Image uploaded successfully',
      image_id: result.lastInsertRowid,
      image_path: relativePath,
      filename: req.file.filename
    });

  } catch (error) {
    console.error('Error uploading image:', error);
    res.status(500).json({ error: 'Failed to upload image' });
  }
});

// Delete specific image for a specific entity
router.delete('/:category/:id/:imageId', (req, res) => {
  try {
    const { category, id, imageId } = req.params;

    // Validate category
    const validCategories = ['adventures', 'sessions', 'quests', 'characters', 'magic_items', 'npcs'];
    if (!validCategories.includes(category)) {
      return res.status(400).json({ error: 'Invalid category' });
    }

    // Get image path from entity_images table
    const selectQuery = `
      SELECT image_path FROM entity_images
      WHERE id = ? AND entity_type = ? AND entity_id = ?
    `;
    const image = db.prepare(selectQuery).get(imageId, category, id) as { image_path?: string };

    if (!image || !image.image_path) {
      return res.status(404).json({ error: 'Image not found' });
    }

    // Delete file from filesystem
    const fullPath = path.join(__dirname, '../../data', image.image_path);
    if (fs.existsSync(fullPath)) {
      fs.unlinkSync(fullPath);
    }

    // Delete from entity_images table
    const deleteQuery = `
      DELETE FROM entity_images
      WHERE id = ? AND entity_type = ? AND entity_id = ?
    `;
    const result = db.prepare(deleteQuery).run(imageId, category, id);

    if (result.changes === 0) {
      return res.status(404).json({ error: 'Image not found' });
    }

    res.json({ message: 'Image deleted successfully' });

  } catch (error) {
    console.error('Error deleting image:', error);
    res.status(500).json({ error: 'Failed to delete image' });
  }
});

// Reorder images for a specific entity
router.put('/:category/:id/reorder', (req, res) => {
  try {
    const { category, id } = req.params;
    const { imageIds } = req.body; // Array of image IDs in new order

    if (!Array.isArray(imageIds)) {
      return res.status(400).json({ error: 'imageIds must be an array' });
    }

    // Validate category
    const validCategories = ['adventures', 'sessions', 'quests', 'characters', 'magic_items', 'npcs'];
    if (!validCategories.includes(category)) {
      return res.status(400).json({ error: 'Invalid category' });
    }

    // Update display_order for each image
    const updateQuery = `
      UPDATE entity_images
      SET display_order = ?
      WHERE id = ? AND entity_type = ? AND entity_id = ?
    `;

    const updateStmt = db.prepare(updateQuery);

    // Use a transaction for atomicity
    const transaction = db.transaction(() => {
      imageIds.forEach((imageId: number, index: number) => {
        updateStmt.run(index + 1, imageId, category, id);
      });
    });

    transaction();

    res.json({ message: 'Images reordered successfully' });

  } catch (error) {
    console.error('Error reordering images:', error);
    res.status(500).json({ error: 'Failed to reorder images' });
  }
});

// Get all images for a specific entity
router.get('/:category/:id(\\d+)', (req, res) => {
  try {
    const { category, id } = req.params;

    // Validate category
    const validCategories = ['adventures', 'sessions', 'quests', 'characters', 'magic_items', 'npcs'];
    if (!validCategories.includes(category)) {
      return res.status(400).json({ error: 'Invalid category' });
    }

    // Get all images for this entity
    const selectQuery = `
      SELECT id, image_path, display_order
      FROM entity_images
      WHERE entity_type = ? AND entity_id = ?
      ORDER BY display_order ASC
    `;
    const images = db.prepare(selectQuery).all(category, id);

    res.json(images);

  } catch (error) {
    console.error('Error fetching images:', error);
    res.status(500).json({ error: 'Failed to fetch images' });
  }
});

// Serve images statically
router.get('/:category/:filename', (req, res) => {
  try {
    const { category, filename } = req.params;
    const filePath = path.join(__dirname, '../../data/images', category, filename);

    if (!fs.existsSync(filePath)) {
      return res.status(404).json({ error: 'Image not found' });
    }

    // Set appropriate headers
    res.setHeader('Cache-Control', 'public, max-age=31536000'); // Cache for 1 year
    res.sendFile(filePath);

  } catch (error) {
    console.error('Error serving image:', error);
    res.status(500).json({ error: 'Failed to serve image' });
  }
});

export default router;