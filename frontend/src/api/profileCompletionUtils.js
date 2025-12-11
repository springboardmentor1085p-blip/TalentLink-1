export const calculateProfileCompletion = (user, freelancerProfile) => {
  if (!freelancerProfile) {
    return { percentage: 0, completedCount: 0, totalCount: 11, missingItems: [], sectionChecks: {} };
  }

  const p = freelancerProfile;
  const socials = p.social_links || {};
  const socialFilled = Boolean(
    socials.linkedin || socials.github || socials.website || socials.other
  );
  const portfolioFiles = p.portfolio_files || [];

  const checks = [
    {
      key: 'avatar',
      complete: Boolean(user?.avatar),
      label: 'Profile photo',
      section: 'basic'
    },
    {
      key: 'bio',
      complete: Boolean(user?.bio && user.bio.length >= 50),
      label: 'Bio (50+ chars)',
      section: 'basic'
    },
    {
      key: 'location',
      complete: Boolean(user?.location),
      label: 'Location',
      section: 'basic'
    },
    {
      key: 'phone',
      complete: Boolean(user?.phone),
      label: 'Phone number',
      section: 'basic'
    },
    {
      key: 'role_title',
      complete: Boolean(p.role_title),
      label: 'Professional title',
      section: 'professional'
    },
    {
      key: 'hourly_rate',
      complete: Number(p.hourly_rate) > 0,
      label: 'Hourly rate',
      section: 'professional'
    },
    {
      key: 'skills',
      complete: (p.skills || []).length >= 3,
      label: 'At least 3 skills',
      section: 'professional'
    },
    {
      key: 'portfolio',
      complete: Boolean(p.portfolio),
      label: 'Portfolio description',
      section: 'professional'
    },
    {
      key: 'languages',
      complete: (p.languages || []).length > 0,
      label: 'Languages',
      section: 'additional'
    },
    {
      key: 'experiences',
      complete: (p.experiences || []).length > 0,
      label: 'Work experience',
      section: 'additional'
    },
    {
      key: 'education',
      complete: (p.education || []).length > 0,
      label: 'Education',
      section: 'additional'
    },
    {
      key: 'social_links',
      complete: socialFilled,
      label: 'Social links',
      section: 'additional'
    },
    {
      key: 'portfolio_files',
      complete: (portfolioFiles || []).length > 0,
      label: 'Portfolio files',
      section: 'additional'
    }
  ];

  const totalCount = checks.length;
  const completedCount = checks.filter(c => c.complete).length;
  const percentage = Math.round((completedCount / totalCount) * 100);

  // Get missing items
  const missingItems = checks
    .filter(c => !c.complete)
    .map(c => c.label);

  // Section-based checks for FreelancerProfile compatibility
  const sectionChecks = {
    basic: checks.filter(c => c.section === 'basic').every(c => c.complete),
    professional: checks.filter(c => c.section === 'professional').every(c => c.complete),
    additional: checks.filter(c => c.section === 'additional').some(c => c.complete),
    portfolio: checks.find(c => c.key === 'portfolio_files')?.complete || false,
    experience: checks.find(c => c.key === 'experiences')?.complete || false,
    education: checks.find(c => c.key === 'education')?.complete || false,
    languages: checks.find(c => c.key === 'languages')?.complete || false
  };

  return {
    percentage,
    completedCount,
    totalCount,
    missingItems,
    sectionChecks,
    checks: checks.reduce((acc, check) => {
      acc[check.key] = check.complete;
      return acc;
    }, {})
  };
};

/**
 * Get profile completion status color
 */
export const getCompletionColor = (percentage) => {
  if (percentage >= 80) return 'green';
  if (percentage >= 50) return 'yellow';
  return 'red';
};

/**
 * Get profile completion status message
 */
export const getCompletionMessage = (percentage) => {
  if (percentage === 100) return 'Your profile is complete! 🎉';
  if (percentage >= 80) return 'Almost there! Just a few more details';
  if (percentage >= 50) return 'Good progress! Keep going';
  return 'Let\'s complete your profile';
};






