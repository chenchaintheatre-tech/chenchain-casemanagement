import { createClient } from "@supabase/supabase-js";

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  // eslint-disable-next-line no-console
  console.warn(
    "尚未設定 Supabase 連線資訊，請在 .env 檔案中設定 VITE_SUPABASE_URL 與 VITE_SUPABASE_ANON_KEY（可參考 .env.example）。"
  );
}

export const supabase = createClient(supabaseUrl || "", supabaseAnonKey || "");
