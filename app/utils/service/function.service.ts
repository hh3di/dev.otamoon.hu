//! Slepp timer
export const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

//! Formated Zod error
export const FormatZodError = (error: any) => {
  const formattedErrors: { [key: string]: string } = {};
  error.issues.forEach((issue: any) => {
    const fieldName = issue.path[0] as string;
    if (fieldName && !formattedErrors[fieldName]) {
      formattedErrors[fieldName] = issue.message;
    }
  });
  return formattedErrors;
};

//! Automatic block all interaction is loading site
export function blockUserInteraction() {
  const prevent = (e: Event) => {
    e.preventDefault();
    e.stopPropagation();
    if (document.activeElement instanceof HTMLElement) {
      document.activeElement.blur();
    }
    return false;
  };

  document.addEventListener('click', prevent, true);
  document.addEventListener('submit', prevent, true);
  document.addEventListener('pointerdown', prevent, true);
  document.addEventListener('keydown', prevent, true);

  const links = Array.from(document.querySelectorAll('a'));
  links.forEach((link) => {
    (link as HTMLAnchorElement).addEventListener('click', prevent, true);
  });

  return function unblock() {
    document.removeEventListener('click', prevent, true);
    document.removeEventListener('submit', prevent, true);
    document.removeEventListener('pointerdown', prevent, true);
    document.removeEventListener('keydown', prevent, true);
    links.forEach((link) => {
      (link as HTMLAnchorElement).removeEventListener('click', prevent, true);
    });
  };
}
