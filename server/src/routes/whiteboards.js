const express = require('express');
const router = express.Router();
const { supabase } = require('../config/supabase');

// GET /api/whiteboards/:fileId
router.get('/:fileId', async (req,res) => {
  const { fileId } = req.params;
  const { data, error } = await supabase.from('whiteboards').select('content').eq('file_id', fileId).single();
  if (error) return res.status(400).json({ error: error.message });
  res.json(data || { content: [] });
});

// PUT /api/whiteboards/:fileId  body: { content }
router.put('/:fileId', async (req,res) => {
  const { fileId } = req.params;
  const { content } = req.body;
  const { data, error } = await supabase.from('whiteboards').update({ content }).eq('file_id', fileId).select().single();
  if (error) return res.status(400).json({ error: error.message });
  res.json(data);
});

module.exports = router;
