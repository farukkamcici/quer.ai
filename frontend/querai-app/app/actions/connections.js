"use server";

import { createClient } from "@/lib/supabase/server";
import { uploadFileToS3 } from "@/lib/s3/upload";

export async function addConnection(formData) {
  try {
    const supabase = createClient();

    const name = String(formData.get("name") || "").trim();
    const source_type = String(formData.get("source_type") || "").trim();
    if (!name || !source_type) {
      return { success: false, error: "Name and source type are required." };
    }

    const { data: { user } } = await supabase.auth.getUser();
    const withUser = (payload) => (user?.id ? { ...payload, user_id: user.id } : payload);

    // DB sources
    if (source_type === "PostgreSQL" || source_type === "MySQL") {
      const host = String(formData.get("host") || "").trim();
      const port = Number(formData.get("port"));
      const database = String(formData.get("database") || "").trim();
      const username = String(formData.get("username") || "").trim();
      const password = String(formData.get("password") || "").trim();

      if (!host || !database || !username || !password || !Number.isFinite(port)) {
        return { success: false, error: "Please fill all DB fields with valid values." };
      }

      const db_details = JSON.stringify({ host, port, database, username, password });
      const payload = withUser({ name, source_type, db_details, s3_uri: null });
      const { error } = await supabase.from("connections").insert(payload);
      if (error) return { success: false, error: error.message || "Failed to save connection." };
      return { success: true };
    }

    // File sources (CSV, Excel)
    if (!(source_type === "CSV" || source_type === "Excel")) {
      return { success: false, error: "Unsupported source type." };
    }
    const file = formData.get("file");
    if (!file || typeof file !== "object" || typeof file.size !== "number") {
      return { success: false, error: "Invalid file or none provided." };
    }
    const max = 50 * 1024 * 1024;
    if (file.size >= max) {
      return { success: false, error: "Invalid file or size exceeded." };
    }
    const s3Uri = await uploadFileToS3(file).catch(() => null);
    if (!s3Uri) {
      return { success: false, error: "S3 upload failed." };
    }
    const payload = withUser({ name, source_type, s3_uri: s3Uri, db_details: null });
    const { error } = await supabase.from("connections").insert(payload);
    if (error) return { success: false, error: error.message || "Failed to save connection." };
    return { success: true };
  } catch (e) {
    return { success: false, error: e?.message || "Unexpected error" };
  }
}

export async function deleteConnection(connectionId) {
  try {
    const supabase = createClient();
    const { error } = await supabase.from("connections").delete().eq("id", connectionId);
    if (error) return { success: false, error: error.message || "Failed to delete connection." };
    return { success: true };
  } catch (e) {
    return { success: false, error: e?.message || "Unexpected error" };
  }
}

export async function updateConnection(connectionId, formData) {
  try {
    const supabase = createClient();

    const name = String(formData.get("name") || "").trim();
    const source_type = String(formData.get("source_type") || "").trim();
    if (!name || !source_type) {
      return { success: false, error: "Name and source type are required." };
    }

    // DB sources
    if (source_type === "PostgreSQL" || source_type === "MySQL") {
      const host = String(formData.get("host") || "").trim();
      const port = Number(formData.get("port"));
      const database = String(formData.get("database") || "").trim();
      const username = String(formData.get("username") || "").trim();
      const password = String(formData.get("password") || "").trim();

      if (!host || !database || !username || !password || !Number.isFinite(port)) {
        return { success: false, error: "Please fill all DB fields with valid values." };
      }

      const db_details = JSON.stringify({ host, port, database, username, password });
      const { error } = await supabase
        .from("connections")
        .update({ name, source_type, db_details, s3_uri: null })
        .eq("id", connectionId);
      if (error) return { success: false, error: error.message || "Failed to update connection." };
      return { success: true };
    }

    // File sources (CSV, Excel)
    if (!(source_type === "CSV" || source_type === "Excel")) {
      return { success: false, error: "Unsupported source type." };
    }
    const maybeFile = formData.get("file");
    let s3_uri = null;
    if (maybeFile && typeof maybeFile === "object" && typeof maybeFile.size === "number") {
      if (maybeFile.size >= 50 * 1024 * 1024) {
        return { success: false, error: "Invalid file or size exceeded." };
      }
      s3_uri = await uploadFileToS3(maybeFile).catch(() => null);
      if (!s3_uri) return { success: false, error: "S3 upload failed." };
    }
    const { error } = await supabase
      .from("connections")
      .update({ name, source_type, s3_uri, db_details: null })
      .eq("id", connectionId);
    if (error) return { success: false, error: error.message || "Failed to update connection." };
    return { success: true };
  } catch (e) {
    return { success: false, error: e?.message || "Unexpected error" };
  }
}
