import { supabase } from '../lib/supabase';
import { he } from '../locales/he';
import Button from '../components/shared/Button';

// מסך "ברוך הבא" — ריק בכוונה בשלב זה. רק כותרת וברכה מגדרית.
export default function WelcomePage({ member }) {
  const template =
    member.gender === 'f' ? he.welcome.greetingFemale : he.welcome.greetingMale;
  const greeting = template.replace('{name}', member.full_name);

  async function handleLogout() {
    await supabase.auth.signOut();
  }

  return (
    <div className="flex min-h-full flex-col items-center justify-center p-4 text-center">
      <h1 className="text-5xl font-extrabold tracking-tight text-brand">
        {he.app.name}
      </h1>
      <p className="mt-4 text-2xl font-bold text-slate-800">{greeting}</p>

      <div className="mt-10 w-full max-w-xs">
        <Button variant="ghost" onClick={handleLogout}>
          {he.common.logout}
        </Button>
      </div>
    </div>
  );
}
