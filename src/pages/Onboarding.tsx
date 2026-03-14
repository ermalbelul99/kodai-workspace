import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { supabase } from '@/integrations/supabase/client';
import { useAppStore } from '@/store/useAppStore';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { toast } from 'sonner';
import { User, Code, Zap, ArrowRight, ArrowLeft } from 'lucide-react';

const STEPS = 3;

const PROGRAMMING_LANGUAGES = [
  { value: 'javascript', label: 'JavaScript' },
  { value: 'python', label: 'Python' },
  { value: 'java', label: 'Java' },
  { value: 'csharp', label: 'C#' },
  { value: 'cpp', label: 'C++' },
  { value: 'go', label: 'Go' },
  { value: 'rust', label: 'Rust' },
  { value: 'typescript', label: 'TypeScript' },
];

const Onboarding = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { userId, setProfile } = useAppStore();

  const [step, setStep] = useState(0);
  const [age, setAge] = useState('');
  const [skillLevel, setSkillLevel] = useState<string>('');
  const [targetLanguage, setTargetLanguage] = useState('');
  const [saving, setSaving] = useState(false);

  const canProceed = () => {
    if (step === 0) return age !== '' && Number(age) >= 6 && Number(age) <= 120;
    if (step === 1) return targetLanguage !== '';
    if (step === 2) return skillLevel !== '';
    return false;
  };

  const handleFinish = async () => {
    if (!userId) return;
    setSaving(true);
    try {
      const { data, error } = await supabase
        .from('profiles')
        .update({
          age: Number(age),
          skill_level: skillLevel,
          target_programming_language: targetLanguage,
          onboarding_completed: true,
        } as any)
        .eq('id', userId)
        .select()
        .single();

      if (error) throw error;
      if (data) setProfile(data as any);

      toast.success(t('onboarding.success'));
      navigate('/', { replace: true });
    } catch (err: any) {
      toast.error(err.message || t('onboarding.error'));
    } finally {
      setSaving(false);
    }
  };

  const stepIcons = [
    <User key="u" className="h-5 w-5" />,
    <Code key="c" className="h-5 w-5" />,
    <Zap key="z" className="h-5 w-5" />,
  ];

  return (
    <div className="flex min-h-screen items-center justify-center bg-background p-4">
      <div className="w-full max-w-md space-y-8">
        {/* Progress */}
        <div className="flex items-center justify-center gap-2">
          {Array.from({ length: STEPS }).map((_, i) => (
            <div
              key={i}
              className={`flex h-10 w-10 items-center justify-center rounded-full border-2 transition-colors ${
                i === step
                  ? 'border-primary bg-primary text-primary-foreground'
                  : i < step
                    ? 'border-accent bg-accent text-accent-foreground'
                    : 'border-border bg-secondary text-muted-foreground'
              }`}
            >
              {stepIcons[i]}
            </div>
          ))}
        </div>

        <div className="rounded-xl glass-card p-6 shadow-lg space-y-6">
          {/* Step 0 — Age */}
          {step === 0 && (
            <div className="space-y-4">
              <h2 className="font-display text-xl font-bold text-foreground">
                {t('onboarding.ageTitle')}
              </h2>
              <p className="text-sm text-muted-foreground">
                {t('onboarding.ageDescription')}
              </p>
              <div className="space-y-2">
                <Label htmlFor="age">{t('onboarding.ageLabel')}</Label>
                <Input
                  id="age"
                  type="number"
                  min={6}
                  max={120}
                  value={age}
                  onChange={(e) => setAge(e.target.value)}
                  placeholder="e.g. 16"
                  className="font-mono bg-black/30 border-white/10"
                />
              </div>
            </div>
          )}

          {/* Step 1 — Programming Language */}
          {step === 1 && (
            <div className="space-y-4">
              <h2 className="font-display text-xl font-bold text-foreground">
                {t('onboarding.languageTitle')}
              </h2>
              <p className="text-sm text-muted-foreground">
                {t('onboarding.languageDescription')}
              </p>
              <div className="space-y-2">
                <Label>{t('onboarding.languageLabel')}</Label>
                <Select value={targetLanguage} onValueChange={setTargetLanguage}>
                  <SelectTrigger>
                    <SelectValue placeholder={t('onboarding.languagePlaceholder')} />
                  </SelectTrigger>
                  <SelectContent>
                    {PROGRAMMING_LANGUAGES.map((lang) => (
                      <SelectItem key={lang.value} value={lang.value}>
                        {lang.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
          )}

          {/* Step 2 — Skill Level */}
          {step === 2 && (
            <div className="space-y-4">
              <h2 className="font-display text-xl font-bold text-foreground">
                {t('onboarding.skillTitle')}
              </h2>
              <p className="text-sm text-muted-foreground">
                {t('onboarding.skillDescription')}
              </p>
              <RadioGroup value={skillLevel} onValueChange={setSkillLevel} className="space-y-3">
                {(['beginner', 'intermediate', 'master'] as const).map((level) => (
                  <div
                    key={level}
                    className={`flex items-center gap-3 rounded-lg border p-4 transition-colors cursor-pointer ${
                      skillLevel === level
                        ? 'border-primary bg-primary/10'
                        : 'border-white/5 bg-secondary/50 hover:border-muted-foreground/30'
                    }`}
                    onClick={() => setSkillLevel(level)}
                  >
                    <RadioGroupItem value={level} id={level} />
                    <Label htmlFor={level} className="cursor-pointer flex-1">
                      <span className="font-semibold text-foreground">
                        {t(`onboarding.skill_${level}`)}
                      </span>
                      <span className="block text-xs text-muted-foreground mt-0.5">
                        {t(`onboarding.skill_${level}_desc`)}
                      </span>
                    </Label>
                  </div>
                ))}
              </RadioGroup>
            </div>
          )}

          {/* Navigation */}
          <div className="flex justify-between pt-2">
            <Button
              variant="ghost"
              onClick={() => setStep((s) => s - 1)}
              disabled={step === 0}
              className="gap-1"
            >
              <ArrowLeft className="h-4 w-4" />
              {t('common.back')}
            </Button>

            {step < STEPS - 1 ? (
              <Button onClick={() => setStep((s) => s + 1)} disabled={!canProceed()} className="gap-1">
                {t('onboarding.next')}
                <ArrowRight className="h-4 w-4" />
              </Button>
            ) : (
              <Button onClick={handleFinish} disabled={!canProceed() || saving} className="gap-1">
                {saving ? t('auth.processing') : t('onboarding.finish')}
                <Zap className="h-4 w-4" />
              </Button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Onboarding;
