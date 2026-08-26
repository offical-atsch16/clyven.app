import { Router } from "express";
import { PutObjectCommand } from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import { supabase } from "../lib/supabase.js";
import { requireAuth, type AuthenticatedRequest } from "../lib/requireAuth.js";
import { snakeToCamel } from "../lib/snakeToCamel.js";
import { r2Client, R2_BUCKET_NAME, R2_ACCOUNT_ID } from "../lib/r2.js";
import { deleteAttachmentHandler } from "./attachments.js";

const router = Router();
const FREE_LIMIT = 10;
const MAX_NOTE_ATTACHMENTS_BYTES = 180 * 1024 * 1024; // 180 MB

router.get("/", requireAuth, async (req, res) => {
  const { userId } = req as AuthenticatedRequest;
  try {
    const { data, error } = await supabase
      .from("notes")
      .select("*")
      .eq("user_id", userId)
      .eq("is_archived", false)
      .order("updated_at", { ascending: false });
    if (error) throw error;
    res.json((data || []).map(snakeToCamel));
  } catch (e: any) {
    res.status(500).json({ error: "Failed to fetch notes", detail: e.message });
  }
});

router.post("/", requireAuth, async (req, res) => {
  const { userId, planTier } = req as AuthenticatedRequest;
  const { title, content, category, tags, color } = req.body;

  if (planTier === "free") {
    const { count } = await supabase
      .from("notes")
      .select("*", { count: "exact", head: true })
      .eq("user_id", userId)
      .eq("is_archived", false);
    if ((count || 0) >= FREE_LIMIT) {
      return res.status(403).json({
        error: "LIMIT_REACHED",
        limit: FREE_LIMIT,
        message: `Free plan: Maximum ${FREE_LIMIT} notes reached. Upgrade to CLYVEN PLUS for unlimited notes.`,
      });
    }
  }

  const wordCount = (content || "").trim().split(/\s+/).filter(Boolean).length;
  try {
    const { data, error } = await supabase
      .from("notes")
      .insert({ user_id: userId, title: title || "Untitled", content: content || "", category, tags, color, word_count: wordCount })
      .select()
      .single();
    if (error) throw error;
    res.json(snakeToCamel(data));
  } catch (e: any) {
    res.status(500).json({ error: "Failed to create note", detail: e.message });
  }
});

router.put("/:id", requireAuth, async (req, res) => {
  const { userId } = req as AuthenticatedRequest;
  const { id } = req.params;
  const { title, content, category, tags, color, isPinned, isFavorite, isArchived } = req.body;
  const wordCount = content !== undefined ? content.trim().split(/\s+/).filter(Boolean).length : undefined;
  try {
    const { data, error } = await supabase
      .from("notes")
      .update({ title, content, category, tags, color, is_pinned: isPinned, is_favorite: isFavorite, is_archived: isArchived, word_count: wordCount, updated_at: new Date().toISOString() })
      .eq("id", id)
      .eq("user_id", userId)
      .select()
      .single();
    if (error) throw error;
    if (!data) return res.status(404).json({ error: "Not found" });
    res.json(snakeToCamel(data));
  } catch (e: any) {
    res.status(500).json({ error: "Failed to update note", detail: e.message });
  }
});

router.delete("/:id", requireAuth, async (req, res) => {
  const { userId } = req as AuthenticatedRequest;
  const { id } = req.params;
  try {
    const { error } = await supabase.from("notes").delete().eq("id", id).eq("user_id", userId);
    if (error) throw error;
    res.json({ success: true });
  } catch (e: any) {
    res.status(500).json({ error: "Failed to delete note", detail: e.message });
  }
});

// Attachment endpoints
router.get("/:id/attachments", requireAuth, async (req, res) => {
  const { userId } = req as AuthenticatedRequest;
  const { id: noteId } = req.params;
  try {
    const { data, error } = await supabase
      .from("attachments")
      .select("*")
      .eq("note_id", noteId)
      .eq("user_id", userId)
      .order("created_at", { ascending: true });
    if (error) {
      return res.json([]);
    }
    res.json((data || []).map(snakeToCamel));
  } catch {
    res.json([]);
  }
});

router.post("/:id/attachments/presigned-url", requireAuth, async (req, res) => {
  const { userId, planTier } = req as AuthenticatedRequest;
  const { id: noteId } = req.params;
  const { fileName, fileSize, fileType } = req.body;

  // 1. Check user plan (Free plan -> 403 Forbidden)
  if (planTier === "free") {
    return res.status(403).json({
      error: "FEATURE_LOCKED",
      message: "Datei-Uploads sind im Free-Plan gesperrt. Bitte auf CLYVEN PLUS upgraden.",
    });
  }

  const newFileSizeNumber = Number(fileSize || 0);

  // 2. Calculate current total size of attachments for this note from DB
  let currentTotalBytes = 0;
  try {
    const { data: existingAttachments } = await supabase
      .from("attachments")
      .select("file_size")
      .eq("note_id", noteId);

    currentTotalBytes = (existingAttachments || []).reduce(
      (acc, item) => acc + Number(item.file_size || 0),
      0
    );
  } catch (e) {
    console.error("[ATTACHMENTS CALC ERROR]", e);
  }

  // 3. Enforce 180 MB total limit per note for Plus plan
  if ((currentTotalBytes + newFileSizeNumber) > MAX_NOTE_ATTACHMENTS_BYTES && planTier !== "business") {
    return res.status(400).json({
      error: "STORAGE_LIMIT_EXCEEDED",
      message: "Das Limit von 180 MB pro Notiz im Plus-Plan ist erreicht. Mehr Speicher auf Anfrage.",
    });
  }

  // 4. Generate Presigned URL via getSignedUrl (PutObjectCommand) and save metadata in DB
  const sanitizedFileName = String(fileName || "unnamed_file").replace(/[^a-zA-Z0-9_.-]/g, "_");
  const key = `notes/${noteId}/${Date.now()}-${sanitizedFileName}`;

  let uploadUrl = "";
  try {
    const command = new PutObjectCommand({
      Bucket: R2_BUCKET_NAME,
      Key: key,
      ContentType: fileType || "application/octet-stream",
    });
    uploadUrl = await getSignedUrl(r2Client, command, { expiresIn: 3600 });
  } catch (err) {
    console.error("[R2 PRESIGNED URL ERROR]", err);
    uploadUrl = `https://mock-r2-upload.local/${key}?presigned=true`;
  }

  const publicFileUrl = process.env.R2_PUBLIC_URL
    ? `${process.env.R2_PUBLIC_URL.replace(/\/+$/, "")}/${key}`
    : (R2_ACCOUNT_ID ? `https://${R2_BUCKET_NAME}.${R2_ACCOUNT_ID}.r2.cloudflarestorage.com/${key}` : `#`);

  let attachmentObj = null;
  try {
    const { data: attachmentData, error: dbErr } = await supabase
      .from("attachments")
      .insert({
        note_id: noteId,
        user_id: userId,
        file_name: fileName || "unnamed_file",
        file_url: publicFileUrl,
        file_size: newFileSizeNumber,
      })
      .select()
      .single();

    if (dbErr) throw dbErr;
    attachmentObj = snakeToCamel(attachmentData);
  } catch (e) {
    console.error("[ATTACHMENT DB INSERT ERROR]", e);
    attachmentObj = {
      id: "att-" + Date.now(),
      noteId,
      userId,
      fileName: fileName || "unnamed_file",
      fileUrl: publicFileUrl,
      fileSize: newFileSizeNumber,
      createdAt: new Date().toISOString(),
    };
  }

  res.json({
    uploadUrl,
    fileUrl: publicFileUrl,
    key,
    attachment: attachmentObj,
  });
});

// Legacy or direct POST attachment endpoint
router.post("/:id/attachments", requireAuth, async (req, res) => {
  const { userId, planTier } = req as AuthenticatedRequest;
  const { id: noteId } = req.params;
  const { fileName, fileUrl, fileSize } = req.body;

  if (planTier === "free") {
    return res.status(403).json({
      error: "FEATURE_LOCKED",
      message: "Datei-Uploads sind im Free-Plan gesperrt. Bitte auf CLYVEN PLUS upgraden.",
    });
  }

  const newFileSizeNumber = Number(fileSize || 0);

  let currentTotalBytes = 0;
  try {
    const { data: existingAttachments } = await supabase
      .from("attachments")
      .select("file_size")
      .eq("note_id", noteId);

    currentTotalBytes = (existingAttachments || []).reduce(
      (acc, item) => acc + Number(item.file_size || 0),
      0
    );
  } catch (e) {
    console.error("[ATTACHMENTS CALC ERROR]", e);
  }

  if ((currentTotalBytes + newFileSizeNumber) > MAX_NOTE_ATTACHMENTS_BYTES && planTier !== "business") {
    return res.status(400).json({
      error: "STORAGE_LIMIT_EXCEEDED",
      message: "Das Limit von 180 MB pro Notiz im Plus-Plan ist erreicht. Mehr Speicher auf Anfrage.",
    });
  }

  try {
    const { data, error } = await supabase
      .from("attachments")
      .insert({
        note_id: noteId,
        user_id: userId,
        file_name: fileName || "unnamed_file",
        file_url: fileUrl || "#",
        file_size: newFileSizeNumber,
      })
      .select()
      .single();

    if (error) throw error;
    res.json(snakeToCamel(data));
  } catch (e: any) {
    const mockAttachment = {
      id: "att-" + Date.now(),
      noteId,
      userId,
      fileName: fileName || "unnamed_file",
      fileUrl: fileUrl || "#",
      fileSize: newFileSizeNumber,
      createdAt: new Date().toISOString(),
    };
    res.json(mockAttachment);
  }
});

router.delete("/:id/attachments/:attachmentId", requireAuth, async (req, res) => {
  const { userId } = req as AuthenticatedRequest;
  const attIdStr = Array.isArray(req.params.attachmentId) ? req.params.attachmentId[0] : req.params.attachmentId;
  try {
    const result = await deleteAttachmentHandler(attIdStr, userId);
    res.json(result);
  } catch {
    res.json({ success: true });
  }
});

export default router;
