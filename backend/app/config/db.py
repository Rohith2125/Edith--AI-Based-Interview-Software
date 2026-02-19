from supabase import create_client
from config.db import SUPABASE_URL, SUPABASE_KEY

supabase= create_client(SUPABASE_URL, SUPABASE_KEY)
