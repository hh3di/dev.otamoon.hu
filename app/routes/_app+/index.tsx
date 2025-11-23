import config from 'config';
import { useTranslation } from 'react-i18next';

export default function Index() {
  const { t } = useTranslation();
  return (
    <div className="flex flex-col gap-4 items-center justify-center">
      <h1 className="text-2xl font-bold">{t('welcome', { appName: config.TITLE })}</h1>
    </div>
  );
}
