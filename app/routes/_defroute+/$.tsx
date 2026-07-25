import { Link } from 'react-router';
import { motion } from 'motion/react';
import { CircleAlert } from 'lucide-react';
import { useLanguage } from '~/utils/service/language/context';

export default function NotFoundPage() {
  const { t } = useLanguage();
  return (
    <div className="relative flex items-center justify-center overflow-hidden  px-6">
      <div className="relative z-10 w-full max-w-2xl">
        <div>
          <motion.div
            animate={{
              rotate: [0, 10, -10, 0],
            }}
            transition={{
              repeat: Infinity,
              duration: 5,
            }}
            className="mx-auto mb-6 flex h-20 w-20 items-center justify-center rounded-2xl bg-indigo-500/15 text-indigo-400"
          >
            <CircleAlert size={48} />
          </motion.div>

          <h1 className="mb-2 text-center text-7xl font-black tracking-tight text-slate-100">{t('error.notfound.title')}</h1>

          <h2 className="mb-4 text-center text-2xl font-semibold text-slate-200">{t('error.notfound.headline')}</h2>

          <p className="mx-auto mb-8 max-w-lg text-center text-slate-400">{t('error.notfound.description')}</p>

          <div className="flex flex-col justify-center gap-4 sm:flex-row">
            <Link
              to="/"
              className="flex items-center justify-center gap-2 rounded-xl bg-indigo-500/40 hover:bg-indigo-500/50 disabled:bg-indigo-800/60 px-5 py-3 font-medium text-white transition"
            >
              {t('error.notfound.button')}
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
