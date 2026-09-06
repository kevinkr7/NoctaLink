from supabase import create_client, Client
from app.core.config import settings

# Standard client using the anon key (safe for most operations if RLS is setup, 
# but usually in backend we use service role or impersonate user)
supabase: Client = create_client(settings.SUPABASE_URL, settings.SUPABASE_KEY)

# Admin client using the service role key (bypasses RLS, used for backend-only operations)
supabase_admin: Client = create_client(settings.SUPABASE_URL, settings.SUPABASE_SERVICE_ROLE_KEY)
