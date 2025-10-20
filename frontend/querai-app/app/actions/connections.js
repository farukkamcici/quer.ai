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

    // Map UI source types to backend types
    const st = source_type.toLowerCase();
    const mapType = {
      postgresql: "postgresql",
      mysql: "mysql",
      csv: "csv",
      excel: "excel",
    };
    const backendType = mapType[st] || (source_type === "PostgreSQL" ? "postgresql" : source_type === "MySQL" ? "mysql" : source_type === "CSV" ? "csv" : source_type === "Excel" ? "excel" : null);

    if (!backendType) {
      return { success: false, error: "Unsupported source type." };
    }

    // Build payload for Python backend
    let backendPayload = { name, source_type: backendType };

    if (backendType === "postgresql" || backendType === "mysql") {
      const host = String(formData.get("host") || "").trim();
      const port = Number(formData.get("port"));
      const database = String(formData.get("database") || "").trim();
      const username = String(formData.get("username") || "").trim();
      const password = String(formData.get("password") || "").trim();
      if (!host || !database || !username || !password || !Number.isFinite(port)) {
        return { success: false, error: "Please fill all DB fields with valid values." };
      }
      backendPayload = withUser({ ...backendPayload, db_details: { host, port, database, username, password } });
    } else {
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
      backendPayload = withUser({ ...backendPayload, s3_uri: s3Uri });
    }

    const backendUrl = `${process.env.PYTHON_BACKEND_URL}/api/connections`;
    const res = await fetch(backendUrl, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(backendPayload) });
    if (!res.ok) {
      const err = await res.text();
      return { success: false, error: err || 'Failed to save connection.' };
    }
    return { success: true };
  } catch (e) {
    return { success: false, error: e?.message || "Unexpected error" };
  }
}

export async function deleteConnection(connectionId) {
  try {
    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();
    const backendUrl = `${process.env.PYTHON_BACKEND_URL}/api/connections/${connectionId}?user_id=${encodeURIComponent(user?.id || '')}`;
    const res = await fetch(backendUrl, { method: 'DELETE' });
    if (!res.ok) {
      const err = await res.text();
      return { success: false, error: err || 'Failed to delete connection.' };
    }
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

export async function refreshConnection(connectionId) {
  try {
    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();
    const backendUrl = `${process.env.PYTHON_BACKEND_URL}/api/connections/${connectionId}/refresh?user_id=${encodeURIComponent(user?.id || '')}`;
    const res = await fetch(backendUrl, { method: 'PUT' });
    if (!res.ok) {
      const errText = await res.text();
      return { success: false, error: errText || 'Failed to refresh schema.' };
    }
    return { success: true };
  } catch (e) {
    return { success: false, error: e?.message || 'Unexpected error' };
  }
}
