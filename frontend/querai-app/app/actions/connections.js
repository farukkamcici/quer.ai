"use server";

import { createClient } from "@/lib/supabase/server";

export async function addConnection(formData) {
  try {
    const supabase = createClient();

    const name = String(formData.get("name") || "").trim();
    const source_type = String(formData.get("source_type") || "").trim();
    const host = String(formData.get("host") || "").trim();
    const portRaw = formData.get("port");
    const database = String(formData.get("database") || "").trim();
    const username = String(formData.get("username") || "").trim();
    const password = String(formData.get("password") || "").trim();

    const port = Number(portRaw);

    if (!name || !source_type || !host || !database || !username || !password || !Number.isFinite(port)) {
      return { success: false, error: "Please fill all fields with valid values." };
    }

    const db_details = JSON.stringify({ host, port, database, username, password });

    const {
      data: { user },
    } = await supabase.auth.getUser();

    const payload = { name, source_type, db_details };
    if (user?.id) payload.user_id = user.id;

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
    const host = String(formData.get("host") || "").trim();
    const portRaw = formData.get("port");
    const database = String(formData.get("database") || "").trim();
    const username = String(formData.get("username") || "").trim();
    const password = String(formData.get("password") || "").trim();
    const port = Number(portRaw);

    if (!name || !source_type || !host || !database || !username || !password || !Number.isFinite(port)) {
      return { success: false, error: "Please fill all fields with valid values." };
    }

    const db_details = JSON.stringify({ host, port, database, username, password });

    const { error } = await supabase
      .from("connections")
      .update({ name, source_type, db_details })
      .eq("id", connectionId);

    if (error) return { success: false, error: error.message || "Failed to update connection." };
    return { success: true };
  } catch (e) {
    return { success: false, error: e?.message || "Unexpected error" };
  }
}
