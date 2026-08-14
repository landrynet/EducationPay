import { createClient } from "@supabase/supabase-js";
import WebSocket from "ws";

const supabaseUrl = process.env.SUPABASE_URL?.trim();
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY?.trim();

export const supabaseConfig = {
  isConfigured: Boolean(supabaseUrl && serviceRoleKey),
};

// Keep the API process alive when the optional Supabase connection has not
// been configured yet. Business routes are guarded and return a clear 503;
// health checks and the public landing page remain available.
export const supabaseAdmin = createClient(
  supabaseUrl ?? "https://placeholder.supabase.co",
  serviceRoleKey ?? "educpay-server-placeholder-key",
  {
  auth: {
    autoRefreshToken: false,
    persistSession: false,
  },
  realtime: {
    transport: WebSocket as any,
  },
  },
);
