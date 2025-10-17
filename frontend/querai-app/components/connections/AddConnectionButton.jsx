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
  FormMessage,
} from "@/components/ui/form";
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from "@/components/ui/select";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { addConnection, updateConnection } from "@/app/actions/connections";
import { toast } from "sonner";
import { useRouter } from "next/navigation";

const ConnectionSchema = z.object({
  name: z.string().min(1, "Name is required"),
  source_type: z.enum(["PostgreSQL", "MySQL"], { required_error: "Source type is required" }),
  host: z.string().min(1, "Host is required"),
  port: z.coerce.number({ invalid_type_error: "Port must be a number" }),
  database: z.string().min(1, "Database is required"),
  username: z.string().min(1, "Username is required"),
  password: z.string().min(1, "Password is required"),
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

  async function onSubmit(values) {
    setError("");
    setSaving(true);
    try {
      const fd = new FormData();
      Object.entries(values).forEach(([k, v]) => fd.append(k, String(v)));
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
                  <Select value={field.value} onValueChange={field.onChange}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Select a source" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="PostgreSQL">PostgreSQL</SelectItem>
                      <SelectItem value="MySQL">MySQL</SelectItem>
                    </SelectContent>
                  </Select>
                  <FormMessage>{fieldState.error?.message}</FormMessage>
                </FormItem>
              )}
            />
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
