"use client";

import { useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Dialog,
  DialogTrigger,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import {
  Form,
  FormField,
  FormItem,
  FormLabel,
  FormControl,
  FormDescription,
  FormMessage,
} from "@/components/ui/form";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { addConnection, updateConnection } from "@/app/actions/connections";
import { toast } from "sonner";
import { useRouter } from "next/navigation";
import { Database, FileSpreadsheet } from "lucide-react";

const ConnectionSchema = z
  .object({
    name: z.string().min(1, "Name is required"),
    source_type: z.enum(["PostgreSQL", "MySQL", "CSV", "Excel"], { required_error: "Source type is required" }),
    host: z.string().optional().or(z.literal("")).transform((v) => (v === "" ? undefined : v)),
    port: z.union([z.coerce.number({ invalid_type_error: "Port must be a number" }), z.string(), z.undefined()]).transform((v) => (v === "" || v === undefined ? undefined : Number(v))),
    database: z.string().optional().or(z.literal("")).transform((v) => (v === "" ? undefined : v)),
    username: z.string().optional().or(z.literal("")).transform((v) => (v === "" ? undefined : v)),
    password: z.string().optional().or(z.literal("")).transform((v) => (v === "" ? undefined : v)),
    file: z.any().optional(),
  })
  .superRefine((val, ctx) => {
    const needsDb = val.source_type === "PostgreSQL" || val.source_type === "MySQL";
    const needsFile = val.source_type === "CSV" || val.source_type === "Excel";

    if (needsDb) {
      const missing = [];
      if (!val.host) missing.push("host");
      if (val.port === undefined || Number.isNaN(val.port)) missing.push("port");
      if (!val.database) missing.push("database");
      if (!val.username) missing.push("username");
      if (!val.password) missing.push("password");
      missing.forEach((f) => ctx.addIssue({ code: z.ZodIssueCode.custom, path: [f], message: "Required" }));
    }

    if (needsFile) {
      const file = val.file;
      if (!file || !(typeof File !== "undefined" && file instanceof File)) {
        ctx.addIssue({ code: z.ZodIssueCode.custom, path: ["file"], message: "A file is required" });
      } else {
        const maxSize = 20 * 1024 * 1024;
        if (file.size > maxSize) {
          ctx.addIssue({ code: z.ZodIssueCode.custom, path: ["file"], message: "File too large (max 20MB)" });
        }
      }
    }
  });

export default function AddConnectionButton({ connection = null, children = null }) {
  const [open, setOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const router = useRouter();

  // Derive defaults from edit connection if provided
  const defaults = useMemo(() => {
    if (!connection) {
      return {
        name: "",
        source_type: "PostgreSQL",
        host: "",
        port: 5432,
        database: "",
        username: "",
        password: "",
      }
    }
    let details = {};
    try {
      details = typeof connection.db_details === 'string' ? JSON.parse(connection.db_details) : (connection.db_details || {});
    } catch {}
    return {
      name: connection.name || "",
      source_type: connection.source_type || "PostgreSQL",
      host: details.host || "",
      port: details.port ?? 5432,
      database: details.database || "",
      username: details.username || "",
      password: details.password || "",
    }
  }, [connection]);

  const form = useForm({
    resolver: zodResolver(ConnectionSchema),
    defaultValues: defaults,
    mode: "onSubmit",
  });
  const source = form.watch("source_type");

  async function onSubmit(values) {
    setError("");
    setSaving(true);
    try {
      const fd = new FormData();
      Object.entries(values).forEach(([k, v]) => {
        if (k === "file") {
          if (v instanceof File) fd.append(k, v);
        } else {
          fd.append(k, String(v ?? ""));
        }
      });
      const result = connection?.id
        ? await updateConnection(connection.id, fd)
        : await addConnection(fd);

      if (result?.success) {
        toast.success("Connection saved successfully!");
        setOpen(false);
        form.reset();
        router.refresh();
      } else {
        const msg = result?.error || "Failed to save connection";
        setError(msg);
        toast.error(msg);
      }
    } catch (e) {
      setError(e?.message || "Failed to save connection");
      toast.error(e?.message || "Failed to save connection");
    } finally {
      setSaving(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {children ? children : <Button className="w-full">Add Connection</Button>}
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{connection ? 'Edit Connection' : 'Add Connection'}</DialogTitle>
          <DialogDescription>{connection ? 'Update your database credentials.' : 'Enter your database credentials.'}</DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="name"
              render={({ field, fieldState }) => (
                <FormItem>
                  <FormLabel>Name</FormLabel>
                  <FormControl>
                    <Input placeholder="Prod DB" {...field} />
                  </FormControl>
                  <FormMessage>{fieldState.error?.message}</FormMessage>
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="source_type"
              render={({ field, fieldState }) => (
                <FormItem>
                  <FormLabel>Source Type</FormLabel>
                  <RadioGroup className="grid grid-cols-2 gap-3 sm:grid-cols-3" value={field.value} onValueChange={field.onChange}>
                    {[
                      { value: "PostgreSQL", label: "PostgreSQL", icon: <Database className="h-4 w-4" /> },
                      { value: "MySQL", label: "MySQL", icon: <Database className="h-4 w-4" /> },
                      { value: "CSV", label: "CSV", icon: <FileSpreadsheet className="h-4 w-4" /> },
                      { value: "Excel", label: "Excel", icon: <FileSpreadsheet className="h-4 w-4" /> },
                    ].map((opt) => (
                      <label
                        key={opt.value}
                        className={`flex cursor-pointer items-center gap-2 rounded-md border p-3 text-sm transition-colors ${
                          field.value === opt.value
                            ? 'border-neutral-900 bg-neutral-100 dark:border-neutral-100 dark:bg-neutral-800'
                            : 'border-neutral-200 hover:bg-neutral-50 dark:border-neutral-800 dark:hover:bg-neutral-900'
                        }`}
                      >
                        <RadioGroupItem value={opt.value} className="mt-0.5" />
                        {opt.icon}
                        <span>{opt.label}</span>
                      </label>
                    ))}
                  </RadioGroup>
                  <FormMessage>{fieldState.error?.message}</FormMessage>
                </FormItem>
              )}
            />
            {source === "PostgreSQL" || source === "MySQL" ? (
              <>
                <FormField
                  control={form.control}
                  name="host"
                  render={({ field, fieldState }) => (
                    <FormItem>
                      <FormLabel>Host</FormLabel>
                      <FormControl>
                        <Input placeholder="db.example.com" {...field} />
                      </FormControl>
                      <FormMessage>{fieldState.error?.message}</FormMessage>
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="port"
                  render={({ field, fieldState }) => (
                    <FormItem>
                      <FormLabel>Port</FormLabel>
                      <FormControl>
                        <Input type="number" placeholder="5432" {...field} />
                      </FormControl>
                      <FormMessage>{fieldState.error?.message}</FormMessage>
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="database"
                  render={({ field, fieldState }) => (
                    <FormItem>
                      <FormLabel>Database</FormLabel>
                      <FormControl>
                        <Input placeholder="my_database" {...field} />
                      </FormControl>
                      <FormMessage>{fieldState.error?.message}</FormMessage>
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="username"
                  render={({ field, fieldState }) => (
                    <FormItem>
                      <FormLabel>Username</FormLabel>
                      <FormControl>
                        <Input placeholder="db_user" {...field} />
                      </FormControl>
                      <FormMessage>{fieldState.error?.message}</FormMessage>
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="password"
                  render={({ field, fieldState }) => (
                    <FormItem>
                      <FormLabel>Password</FormLabel>
                      <FormControl>
                        <Input type="password" placeholder="••••••••" {...field} />
                      </FormControl>
                      <FormMessage>{fieldState.error?.message}</FormMessage>
                    </FormItem>
                  )}
                />
              </>
            ) : (
              <FormField
                control={form.control}
                name="file"
                render={({ field, fieldState }) => (
                  <FormItem>
                    <FormLabel>Upload File</FormLabel>
                    <FormControl>
                      <input
                        type="file"
                        accept=".csv,.xlsx,.xls"
                        onChange={(e) => field.onChange(e.target.files?.[0])}
                        className="block w-full cursor-pointer rounded-md border border-neutral-200 bg-white px-3 py-2 text-sm file:mr-3 file:cursor-pointer file:rounded file:border-0 file:bg-neutral-100 file:px-3 file:py-1.5 file:text-sm hover:file:bg-neutral-200 dark:border-neutral-800 dark:bg-neutral-900 dark:file:bg-neutral-800"
                      />
                    </FormControl>
                    <FormDescription>
                      Upload CSV or Excel (.xlsx, .xls) file. Max 50MB.
                    </FormDescription>
                    {field.value?.name ? (
                      <p className="text-xs text-neutral-500">Selected: {field.value.name}</p>
                    ) : null}
                    <FormMessage>{fieldState.error?.message}</FormMessage>
                  </FormItem>
                )}
              />
            )}

            {error ? (
              <p className="text-sm text-red-500" role="alert">{error}</p>
            ) : null}

            <div className="flex gap-2 pt-2">
              <Button type="button" variant="outline" className="w-1/3" onClick={() => setOpen(false)}>
                Cancel
              </Button>
              <Button type="submit" className="flex-1" disabled={saving}>
                {saving ? "Saving..." : "Save Connection"}
              </Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
