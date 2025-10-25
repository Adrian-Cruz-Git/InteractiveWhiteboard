const express = require("express")
const router = express.Router();
const supabase = require("../config/supabase");

// the helper function for deletion
// recursive function that goes through if there are any folders within the folder 
async function deleteRecursively(fileId) {
  // find children
  const { data: children, error: childrenError } = await supabase.from("files").select("id, type").eq("parent_id", fileId);

  if (childrenError) {
    throw childrenError;
  }

  for (const child of (children || [])) {
    await deleteRecursively(child.id);
  }

  const { data: fileRow, error: fileError } = await supabase.from("files").select("type").eq("id", fileId).single();

  if (fileError) {
    throw fileError;
  }

  if (fileRow?.type === "whiteboards") {
    await supabase.from("whiteboards").delete().eq("file_id", fileId);
    await supabase.from("sticky_notes").delete().eq("file_id", fileId);
  }

  const { error } = await supabase.from("files").delete().eq("id", fileId);
  if (error) {
    throw error;
  }
}

// get parentid / uuid
router.get("/", async (req, res) => {
  //parent id for finding files through user
  const parent_id = req.query.parent_id ?? null;
  console.log(parent_id);
  //query to find files
  const query = supabase.from("files").select("*").order("type", { ascending: true }).order("name", { ascending: true });

  let result;

  if (parent_id === null || parent_id === "null") {
    result = await query.is("parent_id", null);
  } else {
    result = await query.eq("parent_id", parent_id);
  }

  const { data, error } = result;

  if (error) {
    console.log(error.message);
    return res.status(400).json({ error: error.message });
  }
  res.json(data || []);
});

// get breadcrumbs
router.get("/breadcrumb/:id", async (req, res) => {
  const id = req.params.id;
  const trail = [];
  let current = id;

  while (current) {
    // supabase call to find the files inside thats eq to the file id of the user
    const { data, error } = await supabase.from("files").select("id,name,parent_id").eq("id", current).single();

    if (error) {
      console.log(error.message);
      return res.status(400).json({ error: error.message });
    }

    trail.unshift({ id: data.id, name: data.name });
    current = data.parent_id;
  }
  res.json(trail);
});

// post folders
router.post("/folders", async (req, res) => {
  const { name, parent_id, owner } = req.body;

  if (!name || !owner){
    return res.status(400).json({error: "name and owner required"});
  }

  const { data, error } = await supabase.from("files").insert({ name, parent_id, type: "folder" }).select().single();
  if (error) {
    console.log(error.message);
    return res.status(400).json({ error: error.message });
  }
  res.status(201).json(data);
});

// post whiteboards
router.post("/whiteboards", async (req, res) => {
  const { name, parent_id, owner } = req.body;

  const { data: file, error: filError } = await supabase.from("files").insert({ name, parent_id, type: "whiteboards", owner }).select().single();

  if (filError) {
    console.log(filError.message);
    return res.status(400).json({ error: filError.message });
  }

  const { error: wbError } = await supabase.from("whiteboards").insert({ file_id: file.id, content: [] });

  if (wbError) {
    console.log(wbError.message);
    return res.status(400).json({ error: wbError.message });
  }

  res.status(201).json(file);
});

// patch files
router.patch("/:id", async (req, res) => {
  const { name } = req.body;
  const { data, error } = await supabase.from("files").update({ name }).eq("id", req.params.id).select().single();
  if (error) {
    console.log(error.message);
    return res.status(400).json({ error: error.message });
  }
  res.status(201).json(data);
});


// delete files
router.delete("/:id", async (req, res) => {
  try {
    await deleteRecursively(req.params.id);
    res.json({ ok: true })

  } catch (errors) {
    res.status(400).json({ error: errors.message });
  }
});

module.exports = router;