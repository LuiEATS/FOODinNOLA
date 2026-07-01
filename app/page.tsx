import { createClient } from "@/lib/supabase/server";

export default async function Home() {
  const supabase = await createClient();
  const { count, error } = await supabase
    .from("locations")
    .select("*", { count: "exact", head: true })
    .eq("site", "foodinnola");

  return (
    <div className="flex min-h-screen flex-col items-center justify-center gap-4 bg-zinc-50 p-8 font-sans">
      <h1 className="text-2xl font-semibold">FOODinNOLA — Supabase connection check</h1>
      {error ? (
        <pre className="max-w-xl whitespace-pre-wrap rounded bg-red-100 p-4 text-sm text-red-800">
          Connection failed: {error.message}
        </pre>
      ) : (
        <p className="rounded bg-green-100 p-4 text-green-800">
          Connected. Found {count ?? 0} published rows in `locations` where site = &apos;foodinnola&apos;.
        </p>
      )}
    </div>
  );
}
