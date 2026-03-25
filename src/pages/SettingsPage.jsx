import React, { useMemo } from 'react';
import { Link } from 'react-router-dom';
import {
  FiBell,
  FiChevronRight,
  FiClock,
  FiHelpCircle,
  FiLock,
  FiMonitor,
  FiShield,
  FiSliders,
  FiUser,
  FiVolume2,
  FiVolumeX,
} from 'react-icons/fi';
import { useAuth } from '../hooks/UseAuth';
import { useNotifications } from '../hooks/useNotifications';
import useVoiceNotifications from '../hooks/Usevoicenotifications';

const SettingCard = ({
  title,
  description,
  icon: Icon,
  to = '',
  actionLabel = 'Open',
  status = 'Available now',
  enabled = true,
}) => (
  <div className="rounded-3xl border border-gray-200 bg-white p-5 shadow-sm dark:border-gray-800 dark:bg-gray-900">
    <div className="flex items-start justify-between gap-4">
      <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-teal-50 text-teal-700 dark:bg-teal-950/40 dark:text-teal-300">
        <Icon className="text-xl" />
      </div>
      <span
        className={`rounded-full px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.14em] ${
          enabled
            ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-300'
            : 'bg-amber-50 text-amber-700 dark:bg-amber-950/40 dark:text-amber-300'
        }`}
      >
        {status}
      </span>
    </div>

    <div className="mt-4">
      <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">{title}</h3>
      <p className="mt-2 text-sm leading-6 text-gray-600 dark:text-gray-400">{description}</p>
    </div>

    {enabled ? (
      <Link
        to={to}
        className="mt-5 inline-flex items-center gap-2 text-sm font-semibold text-teal-700 transition hover:text-teal-800 dark:text-teal-300 dark:hover:text-teal-200"
      >
        {actionLabel}
        <FiChevronRight />
      </Link>
    ) : (
      <p className="mt-5 text-sm font-medium text-gray-400 dark:text-gray-500">
        This area is queued next in the settings roadmap.
      </p>
    )}
  </div>
);

const SettingsPage = () => {
  const { user } = useAuth();
  const { notificationSettings, pushSupported, notificationPermission } = useNotifications();
  const {
    isIOS,
    isSpeaking,
    supportsSpeech,
    voices,
    selectedVoiceName,
    setSelectedVoiceName,
    speakText,
    stopSpeaking,
  } = useVoiceNotifications();

  const englishVoices = useMemo(
    () =>
      (voices || [])
        .filter((voice) => String(voice.lang || '').toLowerCase().startsWith('en'))
        .sort((left, right) => left.name.localeCompare(right.name)),
    [voices],
  );

  const selectedVoiceLabel = useMemo(() => {
    if (!selectedVoiceName) return 'Auto';
    const matchedVoice = englishVoices.find((voice) => voice.name === selectedVoiceName);
    return matchedVoice ? matchedVoice.name : 'Auto';
  }, [englishVoices, selectedVoiceName]);

  const projectSettings = [
    {
      title: 'Notifications and sounds',
      description:
        'Control push alerts, email delivery, reminder timing, ringtone selection, and sound volume.',
      icon: FiBell,
      to: '/notifications',
      actionLabel: 'Open notifications',
      enabled: true,
      status: 'Available now',
    },
    {
      title: 'Account and identity',
      description:
        'Review profile details, login settings, and personal account information in one place.',
      icon: FiUser,
      to: '/account',
      actionLabel: 'Open account',
      enabled: true,
      status: 'Available now',
    },
    {
      title: 'Appearance',
      description:
        'Theme presets, layout density, and visual personalization are the next settings area to flesh out.',
      icon: FiMonitor,
      enabled: false,
      status: 'Coming soon',
    },
    {
      title: 'Privacy and security',
      description:
        'Data controls, device trust, and privacy-specific preferences are planned to live here next.',
      icon: FiShield,
      enabled: false,
      status: 'Coming soon',
    },
    {
      title: 'Help and support',
      description:
        'Support pathways, troubleshooting notes, and guided help content will be surfaced from here.',
      icon: FiHelpCircle,
      enabled: false,
      status: 'Coming soon',
    },
  ];

  const summaryItems = [
    {
      label: 'Push notifications',
      value: notificationSettings?.pushNotifications
        ? 'Enabled'
        : pushSupported
        ? 'Off'
        : 'Unsupported',
    },
    {
      label: 'Email notifications',
      value: notificationSettings?.emailNotifications ? 'Enabled' : 'Off',
    },
    {
      label: 'Notification sounds',
      value: notificationSettings?.soundEnabled === false ? 'Muted' : 'On',
    },
    {
      label: 'Selected voice',
      value: selectedVoiceLabel,
    },
  ];

  const previewVoice = () => {
    if (isSpeaking) {
      stopSpeaking();
      return;
    }

    speakText(
      `Hello ${user?.firstName || user?.name || 'there'}, this is how Noxa will sound when reading your smart briefings and reminder alerts.`,
      { auto: false },
    );
  };

  return (
    <div className="min-h-screen bg-gray-50 px-4 py-6 dark:bg-gray-950 sm:px-6">
      <div className="mx-auto max-w-6xl">
        <div className="overflow-hidden rounded-[2rem] border border-teal-200 bg-gradient-to-br from-teal-600 via-teal-600 to-cyan-600 text-white shadow-xl shadow-teal-900/20 dark:border-teal-900/60">
          <div className="grid gap-6 px-6 py-8 sm:px-8 lg:grid-cols-[1.5fr_0.9fr] lg:items-end">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.32em] text-white/75">
                Project Settings
              </p>
              <h1 className="mt-3 text-3xl font-semibold tracking-tight sm:text-4xl">
                Tune how Noxa looks, sounds, and keeps you on track.
              </h1>
              <p className="mt-4 max-w-2xl text-sm leading-7 text-white/85 sm:text-base">
                This hub now brings the most important controls into one place, with a dedicated
                voice selector for spoken briefings and reminder readouts.
              </p>
            </div>

            <div className="rounded-[1.75rem] bg-white/10 p-5 backdrop-blur">
              <p className="text-sm font-semibold text-white/90">Active profile</p>
              <p className="mt-2 text-lg font-semibold">
                {user?.name || user?.firstName || user?.email || 'Noxa user'}
              </p>
              <p className="mt-1 text-sm text-white/75">{user?.email || 'Signed in on this device'}</p>

              <div className="mt-5 grid grid-cols-2 gap-3">
                {summaryItems.map((item) => (
                  <div key={item.label} className="rounded-2xl bg-black/10 px-3 py-3">
                    <p className="text-[11px] uppercase tracking-[0.14em] text-white/60">{item.label}</p>
                    <p className="mt-2 text-sm font-semibold text-white">{item.value}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>

        <div className="mt-8 grid gap-6 xl:grid-cols-[1.15fr_0.85fr]">
          <section className="rounded-[2rem] border border-gray-200 bg-white p-6 shadow-sm dark:border-gray-800 dark:bg-gray-900">
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.22em] text-teal-600 dark:text-teal-300">
                  Voice and Briefings
                </p>
                <h2 className="mt-2 text-2xl font-semibold text-gray-900 dark:text-gray-100">
                  Choose the voice for spoken reminders
                </h2>
                <p className="mt-3 max-w-2xl text-sm leading-6 text-gray-600 dark:text-gray-400">
                  Noxa uses this voice for startup briefings and reminder readouts. Browser voices
                  vary by device, so if your selected voice is unavailable later, Noxa will fall
                  back to the best available English voice automatically.
                </p>
              </div>

              <div className="hidden rounded-2xl bg-teal-50 p-3 text-teal-700 dark:bg-teal-950/40 dark:text-teal-300 sm:block">
                <FiSliders className="text-xl" />
              </div>
            </div>

            <div className="mt-6 grid gap-4 lg:grid-cols-[1.2fr_0.8fr]">
              <div className="rounded-3xl border border-gray-200 bg-gray-50 p-5 dark:border-gray-800 dark:bg-gray-950/60">
                <label className="block">
                  <span className="text-sm font-semibold text-gray-900 dark:text-gray-100">
                    Auto-speech voice
                  </span>
                  <span className="mt-1 block text-xs leading-5 text-gray-500 dark:text-gray-400">
                    Pick a specific browser voice, or leave this on Auto to let Noxa choose the
                    most natural English voice it can find.
                  </span>
                  <select
                    value={selectedVoiceName}
                    onChange={(event) => setSelectedVoiceName(event.target.value)}
                    disabled={!supportsSpeech || englishVoices.length === 0}
                    className="mt-3 block w-full rounded-2xl border border-gray-300 bg-white px-4 py-3 text-sm text-gray-900 shadow-sm focus:border-teal-500 focus:outline-none focus:ring-2 focus:ring-teal-200 disabled:cursor-not-allowed disabled:opacity-60 dark:border-gray-700 dark:bg-gray-900 dark:text-gray-100 dark:focus:ring-teal-900"
                  >
                    <option value="">Auto (recommended)</option>
                    {englishVoices.map((voice) => (
                      <option key={`${voice.name}-${voice.lang}`} value={voice.name}>
                        {voice.name} {voice.localService ? '(offline)' : '(online)'}
                      </option>
                    ))}
                  </select>
                </label>

                <div className="mt-4 flex flex-wrap gap-3">
                  <button
                    type="button"
                    onClick={previewVoice}
                    disabled={!supportsSpeech}
                    className="inline-flex items-center gap-2 rounded-2xl bg-teal-600 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-teal-700 disabled:cursor-not-allowed disabled:opacity-60"
                  >
                    {isSpeaking ? <FiVolumeX /> : <FiVolume2 />}
                    {isSpeaking ? 'Stop preview' : 'Preview voice'}
                  </button>

                  <Link
                    to="/notifications"
                    className="inline-flex items-center gap-2 rounded-2xl border border-gray-300 px-4 py-2.5 text-sm font-semibold text-gray-700 transition hover:border-teal-400 hover:text-teal-700 dark:border-gray-700 dark:text-gray-200 dark:hover:border-teal-600 dark:hover:text-teal-300"
                  >
                    <FiBell />
                    Open notification settings
                  </Link>
                </div>
              </div>

              <div className="space-y-4">
                <div className="rounded-3xl border border-gray-200 bg-white p-5 dark:border-gray-800 dark:bg-gray-950/60">
                  <p className="text-sm font-semibold text-gray-900 dark:text-gray-100">Voice status</p>
                  <div className="mt-4 space-y-3 text-sm text-gray-600 dark:text-gray-400">
                    <div className="flex items-start gap-3">
                      <FiClock className="mt-0.5 text-teal-600 dark:text-teal-300" />
                      <span>Selected voice: <strong className="text-gray-900 dark:text-gray-100">{selectedVoiceLabel}</strong></span>
                    </div>
                    <div className="flex items-start gap-3">
                      <FiLock className="mt-0.5 text-teal-600 dark:text-teal-300" />
                      <span>
                        Browser permission status:{' '}
                        <strong className="text-gray-900 dark:text-gray-100">
                          {notificationPermission || 'unknown'}
                        </strong>
                      </span>
                    </div>
                    <div className="flex items-start gap-3">
                      <FiSliders className="mt-0.5 text-teal-600 dark:text-teal-300" />
                      <span>{isIOS ? 'iOS requires a tap before speech can play.' : 'Auto-speech is available on this device.'}</span>
                    </div>
                  </div>
                </div>

                <div className="rounded-3xl border border-dashed border-teal-300 bg-teal-50/70 p-5 dark:border-teal-800 dark:bg-teal-950/20">
                  <p className="text-sm font-semibold text-teal-900 dark:text-teal-200">
                    {supportsSpeech
                      ? `${englishVoices.length} English voices detected on this device`
                      : 'Speech synthesis is unavailable in this browser'}
                  </p>
                  <p className="mt-2 text-sm leading-6 text-teal-800/80 dark:text-teal-200/80">
                    If the preview stays silent, click the button once more after a user gesture.
                    Browsers often block autoplay speech until the page is interacted with.
                  </p>
                </div>
              </div>
            </div>
          </section>

          <section className="rounded-[2rem] border border-gray-200 bg-white p-6 shadow-sm dark:border-gray-800 dark:bg-gray-900">
            <p className="text-xs font-semibold uppercase tracking-[0.22em] text-teal-600 dark:text-teal-300">
              Current Defaults
            </p>
            <h2 className="mt-2 text-2xl font-semibold text-gray-900 dark:text-gray-100">
              Your notification baseline
            </h2>
            <p className="mt-3 text-sm leading-6 text-gray-600 dark:text-gray-400">
              These are the active settings Noxa is already using today. Use them as a quick check
              before diving into the detailed notifications screen.
            </p>

            <div className="mt-6 space-y-3">
              {summaryItems.map((item) => (
                <div
                  key={item.label}
                  className="flex items-center justify-between rounded-2xl border border-gray-200 px-4 py-3 dark:border-gray-800"
                >
                  <span className="text-sm text-gray-600 dark:text-gray-400">{item.label}</span>
                  <span className="text-sm font-semibold text-gray-900 dark:text-gray-100">{item.value}</span>
                </div>
              ))}
            </div>
          </section>
        </div>

        <section className="mt-8">
          <div className="flex items-end justify-between gap-4">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.22em] text-teal-600 dark:text-teal-300">
                Settings Map
              </p>
              <h2 className="mt-2 text-2xl font-semibold text-gray-900 dark:text-gray-100">
                Where each control lives
              </h2>
            </div>
          </div>

          <div className="mt-6 grid gap-5 md:grid-cols-2 xl:grid-cols-3">
            {projectSettings.map((item) => (
              <SettingCard key={item.title} {...item} />
            ))}
          </div>
        </section>
      </div>
    </div>
  );
};

export default SettingsPage;
