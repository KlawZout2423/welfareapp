import { createClient } from "./client";

const BUCKET = "claim-documents";

/**
 * Upload a file to Supabase Storage under claim-documents/{claimId}/{fileName}
 * Returns { url, error }
 */
export async function uploadClaimFile(claimId, file) {
  const supabase = createClient();
  const safeName = file.name.replace(/[^a-zA-Z0-9._-]/g, "_");
  const path = `${claimId}/${Date.now()}_${safeName}`;

  const { data, error } = await supabase.storage
    .from(BUCKET)
    .upload(path, file, {
      cacheControl: "3600",
      upsert: false,
      contentType: file.type,
    });

  if (error) return { url: null, error: error.message };

  const { data: urlData } = supabase.storage.from(BUCKET).getPublicUrl(path);
  return { url: urlData.publicUrl, error: null };
}
