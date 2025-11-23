export const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

export const FormatZodError = (error: any) => {
  const formattedErrors: { [key: string]: string } = {};

  // Zod 4.x verzióban az issues tömböt használjuk
  error.issues.forEach((issue: any) => {
    const fieldName = issue.path[0] as string;
    if (fieldName && !formattedErrors[fieldName]) {
      // Csak akkor írjuk felül, ha még nincs hiba erre a mezőre
      formattedErrors[fieldName] = issue.message;
    }
  });

  return formattedErrors;
};

export const getClientDevicePayload = () => {
  // User agent alapból mindent tartalmaz
  const userAgent = navigator.userAgent;

  // Browser meghatározása
  let browser = 'Unknown';
  if (userAgent.includes('Chrome')) browser = 'Chrome';
  else if (userAgent.includes('Firefox')) browser = 'Firefox';
  else if (userAgent.includes('Safari') && !userAgent.includes('Chrome')) browser = 'Safari';
  else if (userAgent.includes('Edg')) browser = 'Edge';
  else if (userAgent.includes('OPR') || userAgent.includes('Opera')) browser = 'Opera';

  // OS meghatározása
  let os = 'Unknown';
  if (userAgent.includes('Win')) os = 'Windows';
  else if (userAgent.includes('Mac')) os = 'macOS';
  else if (userAgent.includes('Linux')) os = 'Linux';
  else if (/Android/.test(userAgent)) os = 'Android';
  else if (/iPhone|iPad|iPod/.test(userAgent)) os = 'iOS';

  // Device type
  let deviceType: 'desktop' | 'mobile' | 'tablet' | 'other' = 'other';

  if (/iPad/.test(userAgent)) {
    deviceType = 'tablet';
  } else if (/Android/.test(userAgent) && !/Mobile/.test(userAgent)) {
    deviceType = 'tablet'; // Android tablet
  } else if (/Android|iPhone|iPod/.test(userAgent)) {
    deviceType = 'mobile';
  } else if (/Windows|Mac|Linux/.test(userAgent)) {
    deviceType = 'desktop';
  }

  // Egyszerű device_name
  const deviceName = `${browser} on ${os}`;

  return {
    device_name: deviceName || 'Unknown Device',
    user_agent: userAgent || 'Unknown User Agent',
    device_type: deviceType || 'other',
  };
};
