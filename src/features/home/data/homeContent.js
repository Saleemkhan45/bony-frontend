import {
  testimonialAlexJordan,
  testimonialAmeliaClark,
  testimonialEthanBrooks,
  testimonialMichaelLee,
  testimonialNinaRoberts,
  testimonialRichardOberfield,
} from '@/assets/images';

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

export const madeForYouContent = {
  id: 'features',
  title: 'We made it for you',
  description:
    'Conference ipsum dolor sit amet, consectetur adipiscing elit. Mi vestibulum vulputate nec sit velit viverra convallis pretium leooreet.',
  items: [
    {
      title: 'Online Meeting',
      description:
        'Online meeting ipsum dolor sit amet, consectetur adipiscing elit. Aliquam eget ut mattis ligula vitae.',
      icon: 'video',
      cardClassName: 'bg-[#efebff]',
      iconToneClassName: 'text-[#8f7dff]',
    },
    {
      title: 'Secure And Private',
      description:
        'Online meeting ipsum dolor sit amet, consectetur adipiscing elit. Aliquam eget ut mattis ligula vitae.',
      icon: 'shield',
      cardClassName: 'bg-[#e9fff7]',
      iconToneClassName: 'text-[#5bd8b6]',
    },
    {
      title: 'International Dial',
      description:
        'Online meeting ipsum dolor sit amet, consectetur adipiscing elit. Aliquam eget ut mattis ligula vitae.',
      icon: 'phone',
      cardClassName: 'bg-[#fff0f1]',
      iconToneClassName: 'text-[#f1a4ac]',
    },
  ],
};

export const startStepsContent = {
  id: 'start',
  title: '3 easy steps to start',
  description:
    'Conference ipsum dolor sit amet, consectetur adipiscing elit. Mi vestibulum vulputate nec sit velit viverra convallis pretium leooreet.',
  items: [
    {
      title: 'Create a room',
      description:
        'Online meeting ipsum dolor sit amet, consectetur adipiscing elit. Aliquam eget ut mattis.',
      icon: 'video',
      iconBoxClassName: 'bg-[#5f4df6] shadow-[0_18px_40px_-22px_rgba(95,77,246,0.75)]',
    },
    {
      title: 'Send an invitation',
      description:
        'Online meeting ipsum dolor sit amet, consectetur adipiscing elit. Aliquam eget ut mattis.',
      icon: 'send',
      iconBoxClassName: 'bg-[#19d58f] shadow-[0_18px_40px_-22px_rgba(25,213,143,0.72)]',
    },
    {
      title: 'Start the meeting',
      description:
        'Online meeting ipsum dolor sit amet, consectetur adipiscing elit. Aliquam eget ut mattis.',
      icon: 'play',
      iconBoxClassName: 'bg-[#ff6f73] shadow-[0_18px_40px_-22px_rgba(255,111,115,0.72)]',
    },
  ],
};

export const conferenceHighlightContent = {
  id: 'conference',
  title: 'Video conference is better & faster.',
  description:
    'Video conference is better & faster than ipsum dolor sit amet, consectetur adipiscing elit. Cras dui efficitur sodales sed. Mauris sit pulvinar nisl at varius diam enim. Simple quis massa tortor euismod gravida.',
  link: {
    label: 'Learn More',
    href: '#learn-more',
  },
  media: {
    mainAlt: 'Business presenter during a video conference',
  },
};

export const whyChooseUsContent = {
  id: 'why-choose-us',
  title: 'Why choose us?',
  description:
    'Our software ipsum dolor sit amet, consectetur adipiscing elit. Feugiat massa massa cras pulvinar faucibus posuere sed. Lacus id lacus, ipsum nulla convallis ut nunc.',
  features: [
    'HD video & audio',
    'Meeting controls',
    'Easy screen sharing',
    'Group messaging',
    'Calendar integrations',
    'Meeting recording',
  ],
  media: {
    mainAlt: 'Video meeting dashboard with presenter and participants',
  },
};

export const pricingContent = {
  id: 'pricing',
  title: 'Pricing & Plans',
  description:
    'Conference ipsum dolor sit amet, consectetur adipiscing elit. Mi vestibulum vulputate nec sit velit viverra convallis pretium eu laoreet.',
  defaultBillingCycle: 'monthly',
  yearlyDiscountPercent: 15,
  billingOptions: {
    monthlyLabel: 'Bill Monthly',
    yearlyLabel: 'Bill Annually',
    yearlyNote: 'Save 15%',
  },
  plans: [
    {
      id: 'standard',
      name: 'Standard',
      monthlyPrice: 39,
      description: 'All the basics for businesses that are just getting started.',
      features: ['Single project use', 'Basic dashboard', 'All components included'],
      action: {
        label: 'Get Started',
        href: '#contact',
      },
    },
    {
      id: 'essentials',
      name: 'Essentials',
      monthlyPrice: 99,
      description: 'All the basics for businesses that are just getting started.',
      features: [
        'Unlimited project use',
        'Advanced dashboard',
        'All components included',
        'Advanced insight',
      ],
      featured: true,
      action: {
        label: 'Get Started',
        href: '#contact',
      },
    },
    {
      id: 'premium',
      name: 'Premium',
      monthlyPrice: 339,
      description: 'All the basics for businesses that need a complete calling suite.',
      features: [
        'Unlimited project use',
        'Advanced dashboard',
        'All components included',
        'Priority support',
      ],
      action: {
        label: 'Get Started',
        href: '#contact',
      },
    },
  ],
};

export const newsletterContent = {
  id: 'newsletter',
  title: 'Join Our Newsletter',
  description:
    'Just insert your email in the field below. And you will get the updates about features & styles from us.',
  form: {
    placeholder: 'Enter Your Email',
    buttonLabel: 'Subscribe',
  },
};

export const footerContent = {
  id: 'contact',
  brand: {
    name: 'Bonfy.',
    description:
      'Your ultimate email solution for CRM business and engaging with future customers and sales.',
    action: {
      label: 'Ask Question',
      href: '#contact',
    },
  },
  columns: [
    {
      title: 'Community',
      links: [
        { label: 'For Talents', href: '#community' },
        { label: 'For Companies', href: '#community' },
        { label: 'Facebook Group', href: '#community' },
        { label: 'FAQ', href: '#community' },
      ],
    },
    {
      title: 'About us',
      links: [
        { label: 'About Us Here', href: '#about' },
        { label: 'Our Story', href: '#about' },
        { label: 'Career', href: '#about' },
      ],
    },
  ],
  contacts: {
    title: 'Contacts',
    description: 'Feel free to get in touch with via phone or send us a message.',
    items: [
      {
        icon: 'phone',
        label: '+1 408 267 7344',
        href: 'tel:+14082677344',
      },
      {
        icon: 'mail',
        label: 'support@bonfy.com',
        href: 'mailto:support@bonfy.com',
      },
    ],
  },
  socials: [
    { icon: 'send', href: '#social' },
    { icon: 'at', href: '#social' },
    { icon: 'globe', href: '#social' },
  ],
  copyright: '© Bonfy 2024. All Rights Reserved.',
};

export const testimonialsContent = {
  id: 'testimonials',
  title: "See what our client's say",
  description:
    'Conference ipsum dolor sit amet, consectetur adipiscing elit. Mi vestibulum vulputate nec sit velit viverra convallis pretium leo laoreet.',
  initialReviewId: 'richard-oberfield',
  reviews: [
    {
      id: 'richard-oberfield',
      name: 'Richard Oberfield',
      role: 'Product Designer',
      image: testimonialRichardOberfield,
      imagePosition: 'center 18%',
      positionClassName: 'left-[10%] top-[18%] sm:left-[12%] sm:top-[18%]',
      quote:
        'Lorem ipsum dolor sit amet, consectetur adipiscing mauris fermentum sit phareturum donec. Convallis fermentum nam pharetra id vel et.',
      rating: 5,
    },
    {
      id: 'nina-roberts',
      name: 'Nina Roberts',
      role: 'Growth Manager',
      image: testimonialNinaRoberts,
      imagePosition: 'center 18%',
      positionClassName: 'left-[1%] top-[54%] -translate-y-1/2 sm:left-[4%] sm:top-[52%]',
      quote:
        'Our remote standups became much easier after switching. The calls feel stable, and inviting new clients takes only a few taps.',
      rating: 5,
    },
    {
      id: 'alex-jordan',
      name: 'Alex Jordan',
      role: 'Startup Founder',
      image: testimonialAlexJordan,
      imagePosition: 'center 18%',
      positionClassName: 'left-[28%] top-[8%] sm:left-[32%] sm:top-[8%]',
      quote:
        'The interface is clean, the controls are simple, and my team picked it up immediately. It feels polished without being complicated.',
      rating: 4,
    },
    {
      id: 'sophie-meyer',
      name: 'Ethan Brooks',
      role: 'Operations Lead',
      image: testimonialEthanBrooks,
      imagePosition: 'center 18%',
      positionClassName: 'right-[10%] top-[18%] sm:right-[12%] sm:top-[18%]',
      quote:
        'The meeting quality is consistently strong, even during campaign launches. It saves us time every single week.',
      rating: 5,
    },
    {
      id: 'michael-lee',
      name: 'Michael Lee',
      role: 'Sales Consultant',
      image: testimonialMichaelLee,
      imagePosition: 'center 20%',
      positionClassName: 'left-[12%] bottom-[10%] sm:left-[16%] sm:bottom-[12%]',
      quote:
        'Sharing screens, following up with prospects, and recording meetings all happen in one place. That simplicity matters a lot.',
      rating: 5,
    },
    {
      id: 'amelia-clark',
      name: 'Amelia Clark',
      role: 'Customer Success',
      image: testimonialAmeliaClark,
      imagePosition: 'center 15%',
      positionClassName: 'right-[6%] bottom-[12%] sm:right-[10%] sm:bottom-[14%]',
      quote:
        'Our support calls feel more personal now. Clients appreciate the smooth connection and the more modern overall experience.',
      rating: 4,
    },
  ],
};
