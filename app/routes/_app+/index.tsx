import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { LuArrowDown, LuBox, LuCode, LuExternalLink, LuGithub, LuMail, LuShield, LuZap } from 'react-icons/lu';
import { data, Form, useActionData, useNavigation, type ActionFunction } from 'react-router';
import Spinner from '~/components/common/Spinner';
import { getLanguage } from '~/utils/i18n/i18n';
import createI18nInstance from '~/utils/i18n/i18next.server';
import { FlutryMail } from '~/utils/service/FlutryMail.service';
import { FormatZodError } from '~/utils/service/function.service';
import { dataWithToast } from '~/utils/service/session.service';
import { contactSchema } from '~/utils/zod/contact.zod';

export default function Index() {
  const { t } = useTranslation();
  const scrollToSection = (id: string) => {
    const element = document.getElementById(id);
    if (element) {
      element.scrollIntoView({ behavior: 'smooth' });
    }
  };

  const focusAreas = [
    {
      icon: LuCode,
      title: t(`about.cleanCode`),
      description: t(`about.cleanCodeDesc`),
    },
    {
      icon: LuBox,
      title: t(`about.systemDesign`),
      description: t(`about.systemDesignDesc`),
    },
    {
      icon: LuShield,
      title: t(`about.security`),
      description: t(`about.securityDesc`),
    },
    {
      icon: LuZap,
      title: t(`about.performance`),
      description: t(`about.performanceDesc`),
    },
  ];

  const skillCategories = [
    {
      title: t(`skills.frontend`),
      skills: ['React', 'Remix', 'Angular', 'TypeScript', 'JavaScript', 'HTML5', 'CSS3', 'React Router V7'],
      color: 'blue',
    },
    {
      title: t(`skills.backend`),
      skills: ['Node.js', 'Express', 'Fastify', 'PHP', 'TypeScript', 'JavaScript', 'C#'],
      color: 'green',
    },
    {
      title: t(`skills.database`),
      skills: ['Sequelize', 'MongoDB', 'MariaDB', 'MySQL'],
      color: 'purple',
    },
    {
      title: t(`skills.devops`),
      skills: ['Git', 'Linux', 'Debian', 'Nginx', 'Apache', 'Python'],
      color: 'orange',
    },
  ];

  const getColorClasses = (color: string) => {
    const colors: Record<string, { bg: string; border: string; text: string }> = {
      blue: { bg: 'bg-blue-500/10', border: 'border-blue-500/30', text: 'text-blue-400' },
      green: { bg: 'bg-green-500/10', border: 'border-green-500/30', text: 'text-green-400' },
      purple: { bg: 'bg-violet-500/10', border: 'border-violet-500/30', text: 'text-violet-400' },
      orange: { bg: 'bg-orange-500/10', border: 'border-orange-500/30', text: 'text-orange-400' },
    };
    return colors[color] || colors.blue;
  };

  const projects = [
    {
      title: t(`projects.flutry.title`),
      description: t(`projects.flutry.description`),
      highlights: t(`projects.flutry.highlights`, { returnObjects: true }),
      technologies: ['Node.js', 'TypeScript', 'REST API', 'Security', 'Performance'],
      liveUrl: '',
      githubUrl: 'https://github.com/Flutry/Flutry',
      isPersonal: true,
    },
    {
      title: t(`projects.dev.title`),
      description: t(`projects.dev.description`),
      highlights: t(`projects.dev.highlights`, { returnObjects: true }),
      technologies: ['React Router V7', 'TypeScript', 'Tailwind CSS', 'i18n', 'Email Service'],
      liveUrl: 'https://dev.otamoon.hu',
      githubUrl: 'https://github.com/hh3di/dev.otamoon.hu',
      isPersonal: true,
    },
  ];

  const [error, setError] = useState<Record<string, string> | null>(null);
  const navigation = useNavigation();
  const isRunning = navigation.formMethod != null;
  const actionData = useActionData();
  useEffect(() => {
    if (actionData && actionData.error) {
      setError(actionData.error);
    }
  }, [actionData]);
  return (
    <>
      <section id="hero" className="flex items-center justify-center h-screen pt-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20">
          <div className="text-center">
            <div className="mb-6">
              <p className="text-blue-400 text-lg mb-2 animate-fade-in">{t(`hero.greeting`)}</p>
              <h2 className="text-2xl md:text-3xl text-gray-300 mb-6 animate-fade-in-up animation-delay-200">{t(`hero.role`)}</h2>
            </div>

            <p className="text-xl text-gray-400 mb-12 max-w-2xl mx-auto animate-fade-in-up animation-delay-300">{t(`hero.experience`)}</p>

            <div className="flex flex-col sm:flex-row gap-4 justify-center items-center animate-fade-in-up animation-delay-400">
              <button
                onClick={() => scrollToSection('projects')}
                className="px-8 py-3 bg-blue-500 text-white rounded-lg font-medium hover:bg-blue-600 transition-all transform hover:scale-105 flex items-center gap-2"
              >
                {t(`hero.cta`)}
                <LuArrowDown size={20} />
              </button>
              <button
                onClick={() => scrollToSection('contact')}
                className="px-8 py-3 bg-slate-700 text-white rounded-lg font-medium hover:bg-gray-700 transition-all transform hover:scale-105 flex items-center gap-2 border border-gray-700"
              >
                <LuMail size={20} />
                {t(`hero.contact`)}
              </button>
            </div>

            <div className="mt-20 animate-bounce">
              <button
                onClick={() => scrollToSection('about')}
                className="text-gray-500 hover:text-gray-300 transition-colors"
                aria-label="Scroll to about section"
              >
                <LuArrowDown size={32} />
              </button>
            </div>
          </div>
        </div>
      </section>
      <section id="about" className="py-20 ">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="text-4xl font-bold text-white mb-8 text-center">{t(`about.title`)}</h2>

          <div className="max-w-3xl mx-auto mb-16">
            <p className="text-lg text-gray-300 leading-relaxed">{t(`about.description`)}</p>
          </div>

          <div className="mb-8">
            <h3 className="text-2xl font-semibold text-white mb-8 text-center">{t(`about.focus`)}</h3>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {focusAreas.map((area, index) => {
              const Icon = area.icon;
              return (
                <div
                  key={index}
                  className="bg-slate-800 rounded-lg p-6 border border-gray-700 hover:border-blue-500 transition-all hover:transform hover:scale-105"
                >
                  <div className="flex items-center justify-center w-12 h-12 bg-blue-500/10 rounded-lg mb-4">
                    <Icon className="text-blue-400" size={24} />
                  </div>
                  <h4 className="text-xl font-semibold text-white mb-2">{area.title}</h4>
                  <p className="text-gray-400 text-sm leading-relaxed">{area.description}</p>
                </div>
              );
            })}
          </div>
        </div>
      </section>
      <section id="skills" className="py-20 bg-slate-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="text-4xl font-bold text-white mb-12 text-center">{t(`skills.title`)}</h2>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {skillCategories.map((category, index) => {
              const colors = getColorClasses(category.color);
              return (
                <div key={index} className="bg-slate-700 rounded-lg p-6 border border-gray-700 hover:border-gray-600 transition-all">
                  <h3 className="text-2xl font-semibold text-white mb-6">{category.title}</h3>
                  <div className="flex flex-wrap gap-3">
                    {category.skills.map((skill, skillIndex) => (
                      <span
                        key={skillIndex}
                        className={`px-4 py-2 ${colors.bg} ${colors.text} rounded-lg border ${colors.border} font-medium text-sm transition-all hover:scale-105`}
                      >
                        {skill}
                      </span>
                    ))}
                  </div>
                </div>
              );
            })}
          </div>

          <div className="mt-12 text-center">
            <p className="text-gray-400 text-lg">
              <span className="font-semibold text-white">{t(`skills.experienceYears`)}</span> {t(`skills.experienceDescription`)}
            </p>
            <p className="text-gray-500 mt-2">{t(`skills.levelDescription`)}</p>
          </div>
        </div>
      </section>
      <section id="projects" className="py-20 0">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="text-4xl font-bold text-white mb-12 text-center">{t(`projects.title`)}</h2>

          <div className="grid grid-cols-1 gap-8">
            {projects.map((project, index) => (
              <div key={index} className="bg-slate-800 rounded-lg border border-gray-700 overflow-hidden hover:border-blue-500 transition-all">
                <div className="p-8">
                  <div className="flex items-start justify-between mb-4">
                    <div>
                      <h3 className="text-2xl font-bold text-white mb-2">{project.title}</h3>
                      {project.isPersonal && (
                        <span className="inline-block px-3 py-1 bg-blue-500/10 text-blue-400 rounded-full text-sm font-medium border border-blue-500/30">
                          {t(`projects.personalProject`)}
                        </span>
                      )}
                    </div>
                  </div>

                  <p className="text-gray-300 mb-6 leading-relaxed">{project.description}</p>

                  <div className="mb-6">
                    <h4 className="text-lg font-semibold text-white mb-3">{t(`projects.keyHighlights`)}</h4>
                    <div className="flex items-center gap-6 flex-wrap">
                      {(Array.isArray(project.highlights) ? project.highlights : [project.highlights]).map((highlight, idx) => (
                        <div key={idx} className="flex items-start gap-2">
                          <span className="text-gray-400 text-sm">{highlight}</span>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div className="mb-6">
                    <div className="flex flex-wrap gap-2">
                      {project.technologies.map((tech, idx) => (
                        <span key={idx} className="px-3 py-1 bg-slate-700 text-gray-300 rounded-lg text-sm border border-gray-700">
                          {tech}
                        </span>
                      ))}
                    </div>
                  </div>

                  <div className="flex flex-wrap gap-4">
                    {project.liveUrl && (
                      <a
                        href={project.liveUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center gap-2 px-5 py-2 bg-blue-500 text-white rounded-lg font-medium hover:bg-blue-600 transition-all"
                      >
                        <LuExternalLink size={18} />
                        {t(`projects.viewDemo`)}
                      </a>
                    )}
                    {project.githubUrl && (
                      <a
                        href={project.githubUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center gap-2 px-5 py-2 bg-slate-700 text-white rounded-lg font-medium hover:bg-gray-700 transition-all border border-gray-700"
                      >
                        <LuGithub size={18} />
                        {t(`projects.viewCode`)}
                      </a>
                    )}
                    {!project.liveUrl && !project.githubUrl && <div className="text-gray-500 text-sm italic py-2">Links available upon request</div>}
                  </div>
                </div>
              </div>
            ))}
          </div>

          <div className="mt-12 text-center">
            <p className="text-gray-400">{t(`projects.moreProjects`)}</p>
          </div>
        </div>
      </section>
      <section id="contact" className="py-20 ">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="max-w-3xl mx-auto">
            <div className="text-center mb-12">
              <h2 className="text-4xl font-bold text-white mb-4">{t(`contact.title`)}</h2>
              <p className="text-gray-400 text-lg">{t(`contact.description`)}</p>
            </div>

            <div className="bg-slate-800 rounded-lg border border-gray-700 p-8">
              <Form method="post" className="space-y-6">
                <div>
                  <label htmlFor="name" className="block text-gray-300 font-medium mb-2">
                    <span>
                      {t(`contact.name`)} <span className="text-rose-400">{error?.name ? t(`contact.error.name.${error.name}`) : '*'}</span>
                    </span>
                  </label>
                  <input
                    type="text"
                    id="name"
                    name="name"
                    className="w-full px-4 py-3 bg-slate-700 border border-gray-700 rounded-lg text-white focus:outline-none focus:border-blue-500 transition-colors"
                    disabled={isRunning}
                    onChange={() => {
                      setError((prev) => ({ ...prev, name: '' }));
                    }}
                  />
                </div>

                <div>
                  <label htmlFor="email" className="block text-gray-300 font-medium mb-2">
                    <span>
                      {t(`contact.email`)} <span className="text-rose-400">{error?.email ? t(`contact.error.email.${error.email}`) : '*'}</span>
                    </span>
                  </label>
                  <input
                    type="text"
                    id="email"
                    name="email"
                    className="w-full px-4 py-3 bg-slate-700 border border-gray-700 rounded-lg text-white focus:outline-none focus:border-blue-500 transition-colors"
                    disabled={isRunning}
                    onChange={() => {
                      setError((prev) => ({ ...prev, email: '' }));
                    }}
                  />
                </div>

                <div>
                  <label htmlFor="message" className="block text-gray-300 font-medium mb-2">
                    <span>
                      {t(`contact.message`)}{' '}
                      <span className="text-rose-400">{error?.message ? t(`contact.error.message.${error.message}`) : '*'}</span>
                    </span>
                  </label>
                  <textarea
                    id="message"
                    name="message"
                    rows={6}
                    maxLength={2000}
                    className="w-full px-4 py-3 bg-slate-700 border border-gray-700 rounded-lg text-white focus:outline-none focus:border-blue-500 transition-colors resize-none"
                    disabled={isRunning}
                    onChange={() => {
                      setError((prev) => ({ ...prev, message: '' }));
                    }}
                  />
                </div>
                <button
                  onClick={() => setError(null)}
                  type="submit"
                  disabled={isRunning}
                  className="disabled:bg-sky-900 w-full flex items-center justify-center gap-2 px-6 py-3 bg-sky-700 text-white rounded-lg font-medium hover:bg-sky-600 transition-all "
                >
                  {isRunning ? <Spinner size="1.5rem" /> : t(`contact.send`)}
                </button>
              </Form>
            </div>

            <div className="mt-12 flex justify-center gap-6">
              <a
                href="mailto:dev@otamoon.hu"
                className="flex items-center gap-2 text-gray-400 hover:text-sky-500 transition-colors"
                aria-label="Email"
              >
                <LuMail size={24} />
                dev@otamoon.hu
              </a>
              <a
                href="https://github.com/hh3di"
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-2 text-gray-400 hover:text-sky-500 transition-colors"
                aria-label="GitHub"
              >
                <LuGithub size={24} />
                hh3di
              </a>
            </div>
          </div>
        </div>
      </section>
    </>
  );
}

export const action: ActionFunction = async ({ request }) => {
  const formData = await request.formData();
  const validate = await contactSchema.safeParseAsync(Object.fromEntries(formData));
  if (!validate.success) {
    return data({ error: FormatZodError(validate.error) });
  }

  const { locale } = getLanguage(request);
  const { t } = await createI18nInstance(locale);

  try {
    const { name, email, message } = validate.data;

    // Email sablon HTML-ben
    const emailHtml = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
        <h2 style="color: #1e40af; border-bottom: 2px solid #3b82f6; padding-bottom: 10px;">
          ${t('contact.newMessage')} - dev.otamoon.hu
        </h2>
        
        <div style="background-color: #f8fafc; padding: 20px; border-radius: 8px; margin: 20px 0;">
          <p><strong>${t('contact.name')}:</strong> ${name}</p>
          <p><strong>${t('contact.email')}:</strong> ${email}</p>
        </div>
        
        <div style="background-color: #ffffff; padding: 20px; border: 1px solid #e5e7eb; border-radius: 8px;">
          <h3 style="color: #374151; margin-top: 0;">${t('contact.message')}:</h3>
          <p style="line-height: 1.6; color: #4b5563;">${message.replace(/\n/g, '<br>')}</p>
        </div>
        
        <div style="margin-top: 20px; padding: 15px; background-color: #eff6ff; border-radius: 8px; font-size: 12px; color: #6b7280;">
          <p style="margin: 0;">${t('contact.emailSentAt')}: ${new Date().toLocaleString(locale)}</p>
          <p style="margin: 5px 0 0 0;">${t('contact.fromWebsite')}: dev.otamoon.hu</p>
        </div>
      </div>
    `;

    // Email küldése
    await FlutryMail.sendMail('dev@otamoon.hu', 'dev@otamoon.hu', `${t('contact.emailSubject')} - ${name}`, emailHtml, email);

    return dataWithToast(null, { type: 'success', message: t('contact.messageSentSuccessfully') });
  } catch (error) {
    console.error('Email sending error:', error);
    return dataWithToast(null, {
      type: 'error',
      message: t('contact.messageSendError'),
    });
  }
};
