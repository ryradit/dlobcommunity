import ProfileSettingsExperimental from '@/components/ProfileSettingsExperimental';

export const metadata = {
  title: 'Elite Profile Settings - Experimentation',
  description: 'New experimental profile settings UI with elite member features',
};

export default function SettingsExperimentalPage() {
  return (
    <div className="w-full">
      <ProfileSettingsExperimental />
    </div>
  );
}
