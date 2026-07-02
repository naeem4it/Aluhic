import { CompanySettings } from '../CompanySettings';
import { Toaster } from '@/components/ui/toaster';

export default function CompanySettingsExample() {
  return (
    <div className="max-w-2xl">
      <CompanySettings />
      <Toaster />
    </div>
  );
}
