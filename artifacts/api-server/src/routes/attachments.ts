import { Router } from "express";
import { DeleteObjectCommand } from "@aws-sdk/client-s3";
import { supabase } from "../lib/supabase.js";
import { requireAuth, type AuthenticatedRequest } from "../lib/requireAuth.js";
import { r2Client, R2_BUCKET_NAME } from "../lib/r2.js";

const router = Router();

export async function deleteAttachmentHandler(attachmentId: string, userId: string) {
  const { data: att } = await supabase
    .from("attachments")
    .select("*")
    .eq("id", attachmentId)
    .eq("user_id", userId)
    .maybeSingle();

  if (att && att.file_url) {
    try {
      let key = att.file_url;
      if (att.file_url.startsWith("http://") || att.file_url.startsWith("https://")) {
        const urlObj = new URL(att.file_url);
        key = urlObj.pathname.replace(/^\/+/, "");
      }
      if (key && !key.startsWith("#")) {
        await r2Client.send(
          new DeleteObjectCommand({
            Bucket: R2_BUCKET_NAME,
            Key: key,
          })
        );
      }
    } catch (err) {
      console.error("[R2 DELETE ERROR]", err);
    }
  }

  const { error } = await supabase
    .from("attachments")
    .delete()
    .eq("id", attachmentId)
    .eq("user_id", userId);

  if (error) {
    console.error("[DB DELETE ERROR]", error);
  }

  return { success: true };
}

router.delete("/:id", requireAuth, async (req, res) => {
  const { userId } = req as AuthenticatedRequest;
  const idStr = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
  try {
    const result = await deleteAttachmentHandler(idStr, userId);
    res.json(result);
  } catch (e: any) {
    res.status(500).json({ error: "Failed to delete attachment", detail: e.message });
  }
});

export default router;
