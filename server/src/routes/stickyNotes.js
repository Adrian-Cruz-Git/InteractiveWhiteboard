const express = require('express');
const router = express.Router();
const { supabase } = require('../config/supabase');

// GET /api/sticky-notes?fileId=...
router.get('/', async (req,res) => {
  const { fileId } = req.query;
  const { data, error } = await supabase.from('sticky_notes').select('*').eq('file_id', fileId);
  if (error) return res.status(400).json({ error: error.message });
  res.json(data || []);
});

// POST /api/sticky-notes
router.post('/', async (req,res) => {
  const note = req.body;
  const { data, error } = await supabase.from('sticky_notes').insert(note).select().single();
  if (error) return res.status(400).json({ error: error.message });
  res.status(201).json(data);
});

// PATCH /api/sticky-notes/:id
router.patch('/:id', async (req,res) => {
  const patch = req.body;
  const { data, error } = await supabase.from('sticky_notes').update(patch).eq('id', req.params.id).select().single();
  if (error) return res.status(400).json({ error: error.message });
  res.json(data);
});

// DELETE /api/sticky-notes/:id
router.delete('/:id', async (req,res) => {
  const { error } = await supabase.from('sticky_notes').delete().eq('id', req.params.id);
  if (error) return res.status(400).json({ error: error.message });
  res.json({ ok: true });
});

module.exports = router;
