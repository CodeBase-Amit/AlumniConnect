export const USER_ROLES = {
  STUDENT: 'student',
  ALUMNI: 'alumni',
  ADMIN: 'admin',
  COMMUNITY_ADMIN: 'community_admin',
  BATCH_ADMIN: 'batch_admin',
};

export const COMMUNITY_CATEGORIES = [
  { value: 'technology', label: 'Technology' },
  { value: 'career', label: 'Career' },
  { value: 'hobby', label: 'Hobby' },
  { value: 'academic', label: 'Academic' },
  { value: 'sports', label: 'Sports' },
  { value: 'arts', label: 'Arts' },
  { value: 'other', label: 'Other' },
];

export const BLOG_CATEGORIES = [
  { value: 'technology', label: 'Technology' },
  { value: 'career', label: 'Career' },
  { value: 'education', label: 'Education' },
  { value: 'lifestyle', label: 'Lifestyle' },
  { value: 'other', label: 'Other' },
];

export const QUESTION_CATEGORIES = [
  { value: 'technical', label: 'Technical' },
  { value: 'career', label: 'Career' },
  { value: 'academic', label: 'Academic' },
  { value: 'general', label: 'General' },
  { value: 'other', label: 'Other' },
];

export const EVENT_TYPES = [
  { value: 'workshop', label: 'Workshop' },
  { value: 'webinar', label: 'Webinar' },
  { value: 'meetup', label: 'Meetup' },
  { value: 'conference', label: 'Conference' },
  { value: 'social', label: 'Social' },
  { value: 'other', label: 'Other' },
];

export const resolveMediaUrl = (value) => {
  if (!value) {
    return '';
  }

  const normalized = String(value).trim().replace(/\\/g, '/');

  if (/^https?:\/\//i.test(normalized)) {
    return normalized;
  }

  const apiBase = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';
  const origin = apiBase.replace(/\/api\/?$/, '');
  return `${origin}${normalized.startsWith('/') ? normalized : `/${normalized}`}`;
};