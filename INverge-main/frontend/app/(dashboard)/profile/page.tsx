'use client';

import { useEffect, useState } from 'react';
import { Briefcase, FileText, Pencil, Plus, Trash2, X } from 'lucide-react';
import { UserAvatar } from '@/components/user/UserAvatar';
import { userService } from '@/services/user.service';
import { startupService } from '@/services/startup.service';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Skeleton } from '@/components/ui/skeleton';
import { useAuthStore } from '@/store/authStore';
import { DOMAINS, FUNDING_STAGES } from '@/lib/utils';
import { getApiError } from '@/lib/api';
import {
  emptyExperienceForm,
  experienceToForm,
  formatExperienceDateRange,
  monthToIsoDate,
  type ExperienceFormState,
} from '@/lib/experience';
import type { Experience, Startup, User } from '@/types';

type ProfileForm = {
  name: string;
  bio: string;
  skills: string;
  investmentInterests: string;
  portfolioPreference: string;
};

type StartupForm = {
  startupName: string;
  description: string;
  pitch: string;
  domain: string;
  fundingStage: string;
  teamSize: number;
  pitchDeckUrl: string;
  websiteUrl: string;
};

const emptyStartupForm: StartupForm = {
  startupName: '',
  description: '',
  pitch: '',
  domain: 'SAAS',
  fundingStage: 'IDEA',
  teamSize: 1,
  pitchDeckUrl: '',
  websiteUrl: '',
};

function userToProfileForm(u: User): ProfileForm {
  return {
    name: u.name,
    bio: u.bio ?? '',
    skills: u.skills?.join(', ') ?? '',
    investmentInterests: u.investmentInterests?.join(', ') ?? '',
    portfolioPreference: u.portfolioPreference ?? '',
  };
}

function startupToForm(s: Startup): StartupForm {
  return {
    startupName: s.startupName,
    description: s.description,
    pitch: s.pitch,
    domain: s.domain,
    fundingStage: s.fundingStage,
    teamSize: s.teamSize,
    pitchDeckUrl: s.pitchDeckUrl ?? '',
    websiteUrl: s.websiteUrl ?? '',
  };
}

function normalizeWebsiteUrl(url: string) {
  const trimmed = url.trim();
  if (!trimmed) return '';
  if (/^https?:\/\//i.test(trimmed)) return trimmed;
  return `https://${trimmed}`;
}

function websiteDisplayLabel(url: string) {
  try {
    return new URL(url).hostname.replace(/^www\./, '');
  } catch {
    return url;
  }
}

function buildStartupPayload(form: StartupForm, fallbackDeckUrl?: string | null) {
  const payload: Record<string, unknown> = {
    startupName: form.startupName.trim(),
    description: form.description.trim(),
    pitch: form.pitch.trim(),
    domain: form.domain,
    fundingStage: form.fundingStage,
    teamSize: Number(form.teamSize) || 1,
  };
  const deck = form.pitchDeckUrl?.trim() || fallbackDeckUrl?.trim();
  if (deck) payload.pitchDeckUrl = deck;
  const website = normalizeWebsiteUrl(form.websiteUrl);
  if (website) payload.websiteUrl = website;
  return payload as Partial<Startup>;
}

function pitchDeckLabel(url: string, fileName?: string) {
  if (fileName) return fileName;
  try {
    const part = url.split('/').pop() || '';
    return decodeURIComponent(part).replace(/^\w+-/, '').replace(/^\d+-/, '') || 'pitch-deck.pdf';
  } catch {
    return 'pitch-deck.pdf';
  }
}

function labelForDomain(value: string) {
  return DOMAINS.find((d) => d.value === value)?.label ?? value;
}

function labelForStage(value: string) {
  return FUNDING_STAGES.find((s) => s.value === value)?.label ?? value;
}

function DetailRow({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div className="border-b border-zinc-100 py-3 last:border-0 dark:border-zinc-800">
      <p className="text-xs font-medium uppercase tracking-wide text-zinc-500">{label}</p>
      <div className="mt-1 text-sm text-zinc-900 dark:text-zinc-100">{value}</div>
    </div>
  );
}

function EmptyValue() {
  return <span className="text-zinc-400 italic">Not set</span>;
}

export default function ProfilePage() {
  const { user, setUser } = useAuthStore();
  const [form, setForm] = useState<ProfileForm>({
    name: '',
    bio: '',
    skills: '',
    investmentInterests: '',
    portfolioPreference: '',
  });
  const [startupForm, setStartupForm] = useState<StartupForm>(emptyStartupForm);
  const [savedProfile, setSavedProfile] = useState<User | null>(null);
  const [savedStartup, setSavedStartup] = useState<Startup | null>(null);
  const [editingProfile, setEditingProfile] = useState(false);
  const [editingStartup, setEditingStartup] = useState(false);
  const [loadingProfile, setLoadingProfile] = useState(true);
  const [loadingStartup, setLoadingStartup] = useState(false);
  const [completeness, setCompleteness] = useState(0);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [savingProfile, setSavingProfile] = useState(false);
  const [savingStartup, setSavingStartup] = useState(false);
  const [uploadingDeck, setUploadingDeck] = useState(false);
  const [uploadingAvatar, setUploadingAvatar] = useState(false);
  const [pitchDeckFileName, setPitchDeckFileName] = useState<string | null>(null);
  const [experiences, setExperiences] = useState<Experience[]>([]);
  const [loadingExperience, setLoadingExperience] = useState(true);
  const [editingExperienceId, setEditingExperienceId] = useState<string | null>(null);
  const [showExperienceForm, setShowExperienceForm] = useState(false);
  const [experienceForm, setExperienceForm] = useState<ExperienceFormState>(emptyExperienceForm);
  const [savingExperience, setSavingExperience] = useState(false);
  const [deletingExperienceId, setDeletingExperienceId] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    setLoadingProfile(true);
    setLoadingExperience(true);
    const isFounder = user?.role === 'FOUNDER';
    if (isFounder) setLoadingStartup(true);

    const profilePromise = userService.getMe().then(({ data }) => data.data!);
    const experiencePromise = userService.getExperience().then(({ data }) => data.data ?? []);
    const startupPromise =
      isFounder ?
        startupService.getMine().then(({ data }) => data.data ?? null)
      : Promise.resolve(null);

    Promise.all([profilePromise, experiencePromise, startupPromise])
      .then(([u, expList, startup]) => {
        if (cancelled) return;

        setSavedProfile(u);
        setForm(userToProfileForm(u));
        setCompleteness(u.profileCompletenessPercent ?? u.profileCompleteness ?? 0);
        setUser(u);
        setEditingProfile(false);

        setExperiences(expList);

        if (isFounder) {
          setSavedStartup(startup);
          if (startup) {
            setStartupForm(startupToForm(startup));
            setPitchDeckFileName(
              startup.pitchDeckUrl ? pitchDeckLabel(startup.pitchDeckUrl) : null
            );
            setEditingStartup(false);
          } else {
            setEditingStartup(true);
          }
        }
      })
      .catch(() => {
        if (!cancelled) setEditingProfile(true);
      })
      .finally(() => {
        if (cancelled) return;
        setLoadingProfile(false);
        setLoadingExperience(false);
        if (isFounder) setLoadingStartup(false);
      });

    return () => {
      cancelled = true;
    };
  }, [setUser, user?.role]);

  const startEditProfile = () => {
    if (savedProfile) setForm(userToProfileForm(savedProfile));
    setEditingProfile(true);
    setMessage('');
    setError('');
  };

  const cancelEditProfile = () => {
    if (savedProfile) setForm(userToProfileForm(savedProfile));
    setEditingProfile(false);
  };

  const startEditStartup = () => {
    if (savedStartup) setStartupForm(startupToForm(savedStartup));
    else setStartupForm(emptyStartupForm);
    setEditingStartup(true);
    setMessage('');
    setError('');
  };

  const cancelEditStartup = () => {
    if (savedStartup) setStartupForm(startupToForm(savedStartup));
    setEditingStartup(false);
  };

  const saveProfile = async () => {
    setSavingProfile(true);
    setError('');
    setMessage('');
    try {
      const payload: Partial<User> = {
        name: form.name.trim(),
        bio: form.bio.trim() || undefined,
        skills: form.skills
          .split(',')
          .map((s) => s.trim())
          .filter(Boolean),
      };

      if (user?.role === 'INVESTOR') {
        payload.investmentInterests = form.investmentInterests
          .split(',')
          .map((s) => s.trim())
          .filter(Boolean);
        payload.portfolioPreference = form.portfolioPreference.trim() || null;
      }

      const { data } = await userService.updateProfile(payload);
      const updated = data.data!.user as User;
      setSavedProfile(updated);
      setForm(userToProfileForm(updated));
      setUser(updated);
      setCompleteness(
        updated.profileCompletenessPercent ?? updated.profileCompleteness ?? completeness
      );
      setEditingProfile(false);
      setMessage('Profile saved');
    } catch (err) {
      setError(getApiError(err));
    } finally {
      setSavingProfile(false);
    }
  };

  const saveStartup = async () => {
    setSavingStartup(true);
    setError('');
    setMessage('');
    try {
      const { data } = await startupService.save(
        buildStartupPayload(startupForm, savedStartup?.pitchDeckUrl)
      );
      const s = data.data!;
      setSavedStartup(s);
      setStartupForm(startupToForm(s));
      setPitchDeckFileName(s.pitchDeckUrl ? pitchDeckLabel(s.pitchDeckUrl) : null);
      setEditingStartup(false);
      setMessage('Startup profile saved');
    } catch (err) {
      setError(getApiError(err));
    } finally {
      setSavingStartup(false);
    }
  };

  const uploadAvatar = async (file: File) => {
    setUploadingAvatar(true);
    setError('');
    setMessage('');
    try {
      const { data } = await userService.uploadProfilePicture(file);
      const url = data.data!.url;
      const updated = { ...(savedProfile ?? user!), profilePicture: url } as User;
      setSavedProfile(updated);
      setUser(updated);
      setCompleteness(
        updated.profileCompletenessPercent ?? updated.profileCompleteness ?? completeness
      );
      setMessage('Profile picture updated');
    } catch (err) {
      setError(getApiError(err));
    } finally {
      setUploadingAvatar(false);
    }
  };

  const resetExperienceForm = () => {
    setExperienceForm(emptyExperienceForm);
    setEditingExperienceId(null);
    setShowExperienceForm(false);
  };

  const startAddExperience = () => {
    setExperienceForm(emptyExperienceForm);
    setEditingExperienceId(null);
    setShowExperienceForm(true);
    setMessage('');
    setError('');
  };

  const startEditExperience = (exp: Experience) => {
    setExperienceForm(experienceToForm(exp));
    setEditingExperienceId(exp.id);
    setShowExperienceForm(true);
    setMessage('');
    setError('');
  };

  const saveExperience = async () => {
    if (!experienceForm.title.trim() || !experienceForm.company.trim() || !experienceForm.startMonth) {
      setError('Title, company, and start date are required');
      return;
    }

    setSavingExperience(true);
    setError('');
    setMessage('');
    try {
      const payload = {
        title: experienceForm.title.trim(),
        company: experienceForm.company.trim(),
        location: experienceForm.location.trim() || null,
        startDate: monthToIsoDate(experienceForm.startMonth),
        endDate: experienceForm.isCurrent
          ? null
          : experienceForm.endMonth
            ? monthToIsoDate(experienceForm.endMonth)
            : null,
        description: experienceForm.description.trim() || null,
      };

      if (editingExperienceId) {
        const { data } = await userService.updateExperience(editingExperienceId, payload);
        const updated = data.data!;
        setExperiences((prev) =>
          prev.map((e) => (e.id === updated.id ? updated : e))
        );
        setMessage('Experience updated');
      } else {
        const { data } = await userService.createExperience(payload);
        const created = data.data!;
        setExperiences((prev) => [created, ...prev]);
        setMessage('Experience added');
      }

      resetExperienceForm();
      const refreshed = await userService.getMe();
      const u = refreshed.data.data!;
      setSavedProfile(u);
      setUser(u);
      setCompleteness(u.profileCompletenessPercent ?? u.profileCompleteness ?? completeness);
    } catch (err) {
      setError(getApiError(err));
    } finally {
      setSavingExperience(false);
    }
  };

  const removeExperience = async (id: string) => {
    if (!window.confirm('Remove this experience entry?')) return;

    setDeletingExperienceId(id);
    setError('');
    setMessage('');
    try {
      await userService.deleteExperience(id);
      setExperiences((prev) => prev.filter((e) => e.id !== id));
      if (editingExperienceId === id) resetExperienceForm();
      setMessage('Experience removed');

      const refreshed = await userService.getMe();
      const u = refreshed.data.data!;
      setSavedProfile(u);
      setUser(u);
      setCompleteness(u.profileCompletenessPercent ?? u.profileCompleteness ?? completeness);
    } catch (err) {
      setError(getApiError(err));
    } finally {
      setDeletingExperienceId(null);
    }
  };

  const uploadDeck = async (file: File) => {
    setUploadingDeck(true);
    setError('');
    setMessage('');
    try {
      const { data } = await startupService.uploadPitchDeck(file);
      const { url, fileName, savedToProfile } = data.data!;
      setStartupForm((f) => ({ ...f, pitchDeckUrl: url }));
      setPitchDeckFileName(fileName || file.name);

      if (savedToProfile) {
        const refreshed = await startupService.getMine();
        const s = refreshed.data.data!;
        setSavedStartup(s);
        setStartupForm(startupToForm(s));
        setMessage('Pitch deck uploaded and saved to your startup profile');
      } else {
        setMessage('Pitch deck uploaded — click Save startup to attach it to your profile');
      }
    } catch (err) {
      setError(getApiError(err));
    } finally {
      setUploadingDeck(false);
    }
  };

  const skillsList = savedProfile?.skills?.filter(Boolean) ?? [];
  const interestsList = savedProfile?.investmentInterests?.filter(Boolean) ?? [];

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Profile</h1>
        <p className="text-zinc-500">Your saved details appear below. Use Edit to make changes.</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Profile completion</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="mb-2 flex justify-between text-sm">
            <span>{completeness}% complete</span>
          </div>
          <Progress value={completeness} />
        </CardContent>
      </Card>

      {(message || error) && (
        <p className={error ? 'text-red-600' : 'text-emerald-600'}>{error || message}</p>
      )}

      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0">
          <CardTitle>Personal info</CardTitle>
          {!loadingProfile && !editingProfile && (
            <Button variant="outline" size="sm" onClick={startEditProfile}>
              <Pencil className="mr-1.5 h-3.5 w-3.5" />
              Edit
            </Button>
          )}
        </CardHeader>
        <CardContent>
          {loadingProfile ? (
            <div className="space-y-3">
              <Skeleton className="h-12 w-full" />
              <Skeleton className="h-12 w-full" />
              <Skeleton className="h-20 w-full" />
            </div>
          ) : (
            <>
              <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center">
                <UserAvatar
                  name={savedProfile?.name ?? user?.name ?? 'User'}
                  profilePicture={savedProfile?.profilePicture}
                  className="h-20 w-20"
                />
                <div className="space-y-2">
                  <Label htmlFor="profilePicture">Profile picture</Label>
                  <Input
                    id="profilePicture"
                    type="file"
                    accept="image/jpeg,image/png,image/webp"
                    disabled={uploadingAvatar}
                    onChange={(e) => {
                      const f = e.target.files?.[0];
                      if (f) uploadAvatar(f);
                      e.target.value = '';
                    }}
                  />
                  {uploadingAvatar && (
                    <p className="text-sm text-zinc-500">Uploading photo…</p>
                  )}
                  <p className="text-xs text-zinc-500">JPEG, PNG, or WebP · max 5 MB</p>
                </div>
              </div>

          {editingProfile ? (
            <div className="space-y-4">
              <div>
                <Label>Name</Label>
                <Input
                  value={form.name}
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
                />
              </div>
              <div>
                <Label>Bio</Label>
                <Textarea
                  value={form.bio}
                  onChange={(e) => setForm({ ...form, bio: e.target.value })}
                />
              </div>
              <div>
                <Label>Skills (comma-separated)</Label>
                <Input
                  value={form.skills}
                  onChange={(e) => setForm({ ...form, skills: e.target.value })}
                />
              </div>
              {user?.role === 'INVESTOR' && (
                <>
                  <div>
                    <Label>Investment interests</Label>
                    <Input
                      value={form.investmentInterests}
                      onChange={(e) =>
                        setForm({ ...form, investmentInterests: e.target.value })
                      }
                    />
                  </div>
                  <div>
                    <Label>Portfolio preference</Label>
                    <Textarea
                      value={form.portfolioPreference}
                      onChange={(e) =>
                        setForm({ ...form, portfolioPreference: e.target.value })
                      }
                    />
                  </div>
                </>
              )}
              <div className="flex gap-2">
                <Button onClick={saveProfile} disabled={savingProfile}>
                  {savingProfile ? 'Saving…' : 'Save'}
                </Button>
                {savedProfile && (
                  <Button variant="ghost" onClick={cancelEditProfile} disabled={savingProfile}>
                    <X className="mr-1.5 h-3.5 w-3.5" />
                    Cancel
                  </Button>
                )}
              </div>
            </div>
          ) : savedProfile ? (
            <div>
              <DetailRow label="Name" value={savedProfile.name} />
              <DetailRow
                label="Email"
                value={<span className="text-zinc-500">{savedProfile.email}</span>}
              />
              <DetailRow
                label="Role"
                value={
                  <Badge variant="secondary" className="capitalize">
                    {savedProfile.role.toLowerCase()}
                  </Badge>
                }
              />
              <DetailRow
                label="Bio"
                value={savedProfile.bio ? (
                  <p className="whitespace-pre-wrap">{savedProfile.bio}</p>
                ) : (
                  <EmptyValue />
                )}
              />
              <DetailRow
                label="Skills"
                value={
                  skillsList.length > 0 ? (
                    <div className="flex flex-wrap gap-1.5">
                      {skillsList.map((skill) => (
                        <Badge key={skill} variant="secondary">
                          {skill}
                        </Badge>
                      ))}
                    </div>
                  ) : (
                    <EmptyValue />
                  )
                }
              />
              {user?.role === 'INVESTOR' && (
                <>
                  <DetailRow
                    label="Investment interests"
                    value={
                      interestsList.length > 0 ? (
                        <div className="flex flex-wrap gap-1.5">
                          {interestsList.map((item) => (
                            <Badge key={item} variant="default">
                              {item}
                            </Badge>
                          ))}
                        </div>
                      ) : (
                        <EmptyValue />
                      )
                    }
                  />
                  <DetailRow
                    label="Portfolio preference"
                    value={
                      savedProfile.portfolioPreference ? (
                        <p className="whitespace-pre-wrap">{savedProfile.portfolioPreference}</p>
                      ) : (
                        <EmptyValue />
                      )
                    }
                  />
                </>
              )}
            </div>
          ) : null}
            </>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0">
          <CardTitle>Experience</CardTitle>
          {!loadingExperience && !showExperienceForm && (
            <Button variant="outline" size="sm" onClick={startAddExperience}>
              <Plus className="mr-1.5 h-3.5 w-3.5" />
              Add
            </Button>
          )}
        </CardHeader>
        <CardContent>
          {loadingExperience ? (
            <div className="space-y-3">
              <Skeleton className="h-16 w-full" />
              <Skeleton className="h-16 w-full" />
            </div>
          ) : showExperienceForm ? (
            <div className="space-y-4">
              <div>
                <Label>Job title</Label>
                <Input
                  value={experienceForm.title}
                  onChange={(e) =>
                    setExperienceForm({ ...experienceForm, title: e.target.value })
                  }
                  placeholder="e.g. Product Manager"
                />
              </div>
              <div>
                <Label>Company</Label>
                <Input
                  value={experienceForm.company}
                  onChange={(e) =>
                    setExperienceForm({ ...experienceForm, company: e.target.value })
                  }
                  placeholder="e.g. Acme Inc."
                />
              </div>
              <div>
                <Label>Location (optional)</Label>
                <Input
                  value={experienceForm.location}
                  onChange={(e) =>
                    setExperienceForm({ ...experienceForm, location: e.target.value })
                  }
                  placeholder="e.g. San Francisco, CA"
                />
              </div>
              <div className="grid gap-4 sm:grid-cols-2">
                <div>
                  <Label>Start date</Label>
                  <Input
                    type="month"
                    value={experienceForm.startMonth}
                    onChange={(e) =>
                      setExperienceForm({ ...experienceForm, startMonth: e.target.value })
                    }
                  />
                </div>
                <div>
                  <Label>End date</Label>
                  <Input
                    type="month"
                    value={experienceForm.endMonth}
                    disabled={experienceForm.isCurrent}
                    onChange={(e) =>
                      setExperienceForm({ ...experienceForm, endMonth: e.target.value })
                    }
                  />
                </div>
              </div>
              <label className="flex items-center gap-2 text-sm">
                <input
                  type="checkbox"
                  checked={experienceForm.isCurrent}
                  onChange={(e) =>
                    setExperienceForm({
                      ...experienceForm,
                      isCurrent: e.target.checked,
                      endMonth: e.target.checked ? '' : experienceForm.endMonth,
                    })
                  }
                />
                I currently work here
              </label>
              <div>
                <Label>Description (optional)</Label>
                <Textarea
                  value={experienceForm.description}
                  onChange={(e) =>
                    setExperienceForm({ ...experienceForm, description: e.target.value })
                  }
                  placeholder="Key responsibilities and achievements"
                />
              </div>
              <div className="flex gap-2">
                <Button onClick={saveExperience} disabled={savingExperience}>
                  {savingExperience ? 'Saving…' : editingExperienceId ? 'Save changes' : 'Add experience'}
                </Button>
                <Button variant="ghost" onClick={resetExperienceForm} disabled={savingExperience}>
                  <X className="mr-1.5 h-3.5 w-3.5" />
                  Cancel
                </Button>
              </div>
            </div>
          ) : experiences.length > 0 ? (
            <div className="space-y-4">
              {experiences.map((exp) => (
                <div
                  key={exp.id}
                  className="rounded-lg border border-zinc-200 p-4 dark:border-zinc-800"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex gap-3">
                      <Briefcase className="mt-0.5 h-4 w-4 shrink-0 text-zinc-400" />
                      <div>
                        <p className="font-medium">{exp.title}</p>
                        <p className="text-sm text-zinc-600 dark:text-zinc-400">{exp.company}</p>
                        <p className="text-xs text-zinc-500">
                          {formatExperienceDateRange(exp.startDate, exp.endDate)}
                          {exp.location ? ` · ${exp.location}` : ''}
                        </p>
                        {exp.description && (
                          <p className="mt-2 whitespace-pre-wrap text-sm text-zinc-700 dark:text-zinc-300">
                            {exp.description}
                          </p>
                        )}
                      </div>
                    </div>
                    <div className="flex shrink-0 gap-1">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => startEditExperience(exp)}
                        disabled={deletingExperienceId === exp.id}
                      >
                        <Pencil className="h-3.5 w-3.5" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="text-red-600 hover:text-red-700 dark:text-red-400"
                        onClick={() => removeExperience(exp.id)}
                        disabled={deletingExperienceId === exp.id}
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </Button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="py-4 text-center">
              <p className="mb-4 text-sm text-zinc-500">
                Add your work history to help others understand your background.
              </p>
              <Button onClick={startAddExperience}>
                <Plus className="mr-1.5 h-4 w-4" />
                Add experience
              </Button>
            </div>
          )}
        </CardContent>
      </Card>

      {user?.role === 'FOUNDER' && (
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0">
            <CardTitle>Startup profile</CardTitle>
            {!loadingStartup && !editingStartup && savedStartup && (
              <Button variant="outline" size="sm" onClick={startEditStartup}>
                <Pencil className="mr-1.5 h-3.5 w-3.5" />
                Edit
              </Button>
            )}
          </CardHeader>
          <CardContent>
            {loadingStartup ? (
              <div className="space-y-3">
                <Skeleton className="h-12 w-full" />
                <Skeleton className="h-20 w-full" />
                <Skeleton className="h-20 w-full" />
              </div>
            ) : editingStartup ? (
              <div className="space-y-4">
                {!savedStartup && (
                  <p className="text-sm text-zinc-500">
                    Add your startup details. Description and pitch need at least 10 characters
                    each.
                  </p>
                )}
                <Input
                  placeholder="Startup name"
                  value={startupForm.startupName}
                  onChange={(e) =>
                    setStartupForm({ ...startupForm, startupName: e.target.value })
                  }
                />
                <Textarea
                  placeholder="Description (min 10 characters)"
                  value={startupForm.description}
                  onChange={(e) =>
                    setStartupForm({ ...startupForm, description: e.target.value })
                  }
                />
                <Textarea
                  placeholder="Pitch (min 10 characters)"
                  value={startupForm.pitch}
                  onChange={(e) => setStartupForm({ ...startupForm, pitch: e.target.value })}
                />
                <div>
                  <Label>Domain</Label>
                  <select
                    className="mt-1 h-10 w-full rounded-lg border px-3 dark:border-zinc-700 dark:bg-zinc-900"
                    value={startupForm.domain}
                    onChange={(e) =>
                      setStartupForm({ ...startupForm, domain: e.target.value })
                    }
                  >
                    {DOMAINS.map((d) => (
                      <option key={d.value} value={d.value}>
                        {d.label}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <Label>Funding stage</Label>
                  <select
                    className="mt-1 h-10 w-full rounded-lg border px-3 dark:border-zinc-700 dark:bg-zinc-900"
                    value={startupForm.fundingStage}
                    onChange={(e) =>
                      setStartupForm({ ...startupForm, fundingStage: e.target.value })
                    }
                  >
                    {FUNDING_STAGES.map((s) => (
                      <option key={s.value} value={s.value}>
                        {s.label}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <Label>Team size</Label>
                  <Input
                    type="number"
                    className="mt-1"
                    value={startupForm.teamSize}
                    onChange={(e) =>
                      setStartupForm({
                        ...startupForm,
                        teamSize: Number(e.target.value) || 1,
                      })
                    }
                  />
                </div>
                <div>
                  <Label>Website</Label>
                  <Input
                    type="url"
                    className="mt-1"
                    placeholder="https://yourstartup.com"
                    value={startupForm.websiteUrl}
                    onChange={(e) =>
                      setStartupForm({ ...startupForm, websiteUrl: e.target.value })
                    }
                  />
                </div>
                <div>
                  <Label>Pitch deck (PDF)</Label>
                  <Input
                    type="file"
                    className="mt-1"
                    accept="application/pdf"
                    disabled={uploadingDeck}
                    onChange={(e) => {
                      const f = e.target.files?.[0];
                      if (f) uploadDeck(f);
                      e.target.value = '';
                    }}
                  />
                  {uploadingDeck && (
                    <p className="mt-2 text-sm text-zinc-500">Uploading PDF…</p>
                  )}
                  {startupForm.pitchDeckUrl && !uploadingDeck && (
                    <a
                      href={startupForm.pitchDeckUrl}
                      className="mt-2 inline-flex items-center gap-1.5 text-sm font-medium text-violet-600 hover:underline"
                      target="_blank"
                      rel="noreferrer"
                    >
                      <FileText className="h-4 w-4" />
                      {pitchDeckFileName || 'View uploaded deck'}
                    </a>
                  )}
                </div>
                <div className="flex gap-2">
                  <Button onClick={saveStartup} disabled={savingStartup}>
                    {savingStartup ? 'Saving…' : savedStartup ? 'Save changes' : 'Save startup'}
                  </Button>
                  {savedStartup && (
                    <Button variant="ghost" onClick={cancelEditStartup} disabled={savingStartup}>
                      <X className="mr-1.5 h-3.5 w-3.5" />
                      Cancel
                    </Button>
                  )}
                </div>
              </div>
            ) : savedStartup ? (
              <div>
                <DetailRow label="Startup name" value={savedStartup.startupName} />
                <DetailRow
                  label="Description"
                  value={<p className="whitespace-pre-wrap">{savedStartup.description}</p>}
                />
                <DetailRow
                  label="Pitch"
                  value={<p className="whitespace-pre-wrap">{savedStartup.pitch}</p>}
                />
                <DetailRow
                  label="Domain"
                  value={
                    <Badge variant="default">{labelForDomain(savedStartup.domain)}</Badge>
                  }
                />
                <DetailRow
                  label="Funding stage"
                  value={
                    <Badge variant="secondary">
                      {labelForStage(savedStartup.fundingStage)}
                    </Badge>
                  }
                />
                <DetailRow label="Team size" value={savedStartup.teamSize} />
                <DetailRow
                  label="Website"
                  value={
                    savedStartup.websiteUrl ? (
                      <a
                        href={savedStartup.websiteUrl}
                        className="inline-flex items-center gap-1.5 font-medium text-violet-600 hover:underline"
                        target="_blank"
                        rel="noreferrer"
                      >
                        {websiteDisplayLabel(savedStartup.websiteUrl)}
                      </a>
                    ) : (
                      <EmptyValue />
                    )
                  }
                />
                <DetailRow
                  label="Pitch deck"
                  value={
                    savedStartup.pitchDeckUrl ? (
                      <div className="space-y-2">
                        <a
                          href={savedStartup.pitchDeckUrl}
                          className="inline-flex items-center gap-2 font-medium text-violet-600 hover:underline"
                          target="_blank"
                          rel="noreferrer"
                        >
                          <FileText className="h-4 w-4 shrink-0" />
                          {pitchDeckFileName ||
                            pitchDeckLabel(savedStartup.pitchDeckUrl)}
                        </a>
                        <p className="text-xs text-zinc-500">Opens in a new tab</p>
                      </div>
                    ) : (
                      <EmptyValue />
                    )
                  }
                />
              </div>
            ) : (
              <div className="text-center py-4">
                <p className="text-sm text-zinc-500 mb-4">No startup profile yet.</p>
                <Button onClick={startEditStartup}>Add startup profile</Button>
              </div>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
}
