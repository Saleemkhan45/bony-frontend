export const navigationLinks = [
  { label: 'Home', href: '#' },
  { label: 'Features', href: '#features' },
  { label: 'Pricing', href: '#pricing' },
  { label: 'Blog', href: '#blog' },
  { label: 'Contact', href: '#contact' },
];

export const navbarAction = {
  label: 'Download Now',
  href: '#download',
};

export const heroContent = {
  badge: 'Modern team call',
  title: 'Connect everyone, from anywhere',
  description:
    'Free conference ipsum dolor sit amet, consectetur adipiscing elit. Vivamus mauris sed faucibus sed justo vulputate.',
  actions: [
    {
      actionId: 'join-meeting',
      label: 'Join Meeting',
      href: '#conference',
      variant: 'solid',
    },
    {
      actionId: 'start-meeting',
      label: 'Start Meeting',
      href: '#start',
      variant: 'outline',
    },
  ],
  media: {
    alt: 'Video conference call interface',
  },
  socialProof: {
    heading: 'Also featured in',
    stats: [
      {
        value: '10k',
        label: 'Active Downloads',
        starColor: '#ff6a3d',
      },
      {
        value: '4.7',
        label: '1250 Rating',
        starColor: '#f7b623',
      },
    ],
    brands: [
      { id: 'slack', label: 'slack' },
      { id: 'microsoft', label: 'Microsoft' },
      { id: 'facebook', label: 'facebook' },
      { id: 'amazon', label: 'amazon' },
    ],
  },
};
