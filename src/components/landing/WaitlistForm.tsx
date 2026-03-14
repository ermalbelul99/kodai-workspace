import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Mail } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

export const WaitlistForm = () => {
  const { t } = useTranslation();
  const { toast } = useToast();
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const trimmed = email.trim().toLowerCase();
    if (!trimmed || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(trimmed)) {
      toast({ title: t('waitlist.invalid'), variant: 'destructive' });
      return;
    }

    setLoading(true);
    const { error } = await supabase
      .from('waitlist_leads')
      .insert({ email: trimmed });

    setLoading(false);

    if (error) {
      if (error.code === '23505') {
        toast({ title: t('waitlist.duplicate') });
      } else {
        toast({ title: t('waitlist.invalid'), variant: 'destructive' });
      }
      return;
    }

    toast({ title: t('waitlist.success') });
    setEmail('');
  };

  return (
    <section className="border-t border-border py-24 sm:py-32">
      <div className="mx-auto max-w-xl px-4 text-center sm:px-6">
        <Mail className="mx-auto mb-4 h-8 w-8 text-primary" />
        <h2 className="text-2xl font-bold sm:text-3xl">{t('waitlist.title')}</h2>
        <p className="mt-2 text-muted-foreground">{t('waitlist.subtitle')}</p>
        <form onSubmit={handleSubmit} className="mt-6 flex gap-2">
          <Input
            type="email"
            placeholder={t('waitlist.placeholder')}
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="flex-1 bg-black/30 border-white/10"
            maxLength={254}
            required
          />
          <Button type="submit" disabled={loading}>
            {t('waitlist.button')}
          </Button>
        </form>
      </div>
    </section>
  );
};
