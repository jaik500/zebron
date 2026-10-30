/**
 * Home page text in each supported language.
 *
 * Keys are grouped by section. To add a language, add an entry with
 * the same keys (TypeScript checks nothing is missing) and enable the
 * language in core/config/supported-languages.ts.
 */
const EN = {
  heroTitle: 'Everything you need to discover, explore, and move forward.',
  heroText: 'Connect with resources, organizations, services, opportunities, information, and more—all in one place.',
  exploreResources: 'Explore Resources',
  findOpportunities: 'Find Opportunities',
  donate: 'Donate',

  exploreEyebrow: 'Explore Zebron',
  exploreTitle: 'One platform, multiple ways to move forward.',
  exploreText: 'Start with what you need and explore the opportunities that connect to it.',

  resourcesTitle: 'Resources',
  resourcesText: 'Discover services, programs, organizations, and resources that can help you reach your next goal.',
  jobsTitle: 'Jobs',
  jobsText: 'Find employment opportunities and discover organizations looking for people with your skills.',
  jobsLink: 'Find Jobs',
  trainingTitle: 'Training',
  trainingText: 'Explore bootcamps, courses, educational programs, and other opportunities to build your skills.',
  trainingLink: 'Explore Training',
  testCenterTitle: 'Test Center',
  testCenterText: 'Challenge yourself today, and build the competitive edge you need to stand out tomorrow.',
  testCenterLink: 'Explore Test Center',
  communityTitle: 'Community',
  communityText: 'Connect with people, exchange experiences, ask questions and discover helpful resources.',
  communityLink: 'Explore Community',
  taxTitle: 'Tax & Pay Calculator',
  taxText: 'Crunch your numbers, clear your doubts, and keep more of your hard-earned money with a smarter tax calculator',
  taxLink: 'Try Tax Calculator',
  organizationTitle: 'Organization Application',
  organizationText: 'Apply to bring your organization onto Zebron and request access to the applications and tools your organization needs.',
  organizationLink: 'Apply for an Organization',

  howEyebrow: 'How Zebron works',
  howTitle: 'From discovery to opportunity.',
  discover: 'Discover',
  discoverText: 'Search for resources, organizations, jobs, and training that match your needs.',
  explore: 'Explore',
  exploreStepText: 'Learn more about the organizations, services, programs, and opportunities you discover.',
  connect: 'Connect',
  connectText: 'Take the next step by connecting directly with the organization or opportunity.',

  valueEyebrow: 'Built for discovery',
  valueTitle: 'Spend less time searching. Spend more time moving forward.',
  valueText: 'Zebron brings useful information together so you can spend less time searching across disconnected websites and more time exploring options that fit your goals.',
  startExploring: 'Start exploring',
  resourcesServices: 'Resources & Services',
  trainingEducation: 'Training & Education',
  jobsOpportunities: 'Jobs & Opportunities',

  forOrganizations: 'For organizations',
  forOrganizationsTitle: 'Share what your organization provides.',
  forOrganizationsText: 'Help people discover your resources, programs, services, and opportunities through Zebron.',
  addResource: 'Add a Resource',

  supportZebron: 'Support Zebron',
  supportTitle: 'Help make resources easier to find.',
  supportText: 'Your support helps Zebron connect people with trusted resources, organizations, services, and opportunities.',

  seoTitle: 'Zebron | Discover Resources, Jobs & Opportunities',
  seoDescription: 'Zebron helps you discover resources, organizations, jobs, training, and opportunities in one place. Explore what is available and find your next opportunity.',
} as const;

/** Every language must provide every key (checked at build time). */
export type HomeText = { readonly [K in keyof typeof EN]: string };

const FR: HomeText = {
  heroTitle: 'Tout ce dont vous avez besoin pour découvrir, explorer et aller de l’avant.',
  heroText: 'Accédez à des ressources, des organisations, des services, des opportunités, des informations et plus encore, le tout au même endroit.',
  exploreResources: 'Explorer les ressources',
  findOpportunities: 'Trouver des opportunités',
  donate: 'Faire un don',

  exploreEyebrow: 'Découvrir Zebron',
  exploreTitle: 'Une plateforme, de nombreuses façons d’avancer.',
  exploreText: 'Partez de vos besoins et explorez les opportunités qui y sont liées.',

  resourcesTitle: 'Ressources',
  resourcesText: 'Découvrez des services, des programmes, des organisations et des ressources pour vous aider à atteindre votre prochain objectif.',
  jobsTitle: 'Emplois',
  jobsText: 'Trouvez des offres d’emploi et découvrez des organisations qui recherchent des personnes ayant vos compétences.',
  jobsLink: 'Trouver un emploi',
  trainingTitle: 'Formation',
  trainingText: 'Explorez des bootcamps, des cours, des programmes éducatifs et d’autres possibilités pour développer vos compétences.',
  trainingLink: 'Explorer les formations',
  testCenterTitle: 'Centre d’évaluation',
  testCenterText: 'Mettez-vous au défi dès aujourd’hui et développez l’avantage concurrentiel qui vous fera sortir du lot demain.',
  testCenterLink: 'Explorer le centre d’évaluation',
  communityTitle: 'Communauté',
  communityText: 'Rencontrez des gens, partagez vos expériences, posez vos questions et découvrez des ressources utiles.',
  communityLink: 'Explorer la communauté',
  taxTitle: 'Calculateur d’impôts et de salaire',
  taxText: 'Faites vos calculs, dissipez vos doutes et gardez une plus grande part de l’argent que vous avez durement gagné grâce à un calculateur d’impôts plus intelligent.',
  taxLink: 'Essayer le calculateur',
  organizationTitle: 'Inscription d’une organisation',
  organizationText: 'Demandez à intégrer votre organisation à Zebron et à accéder aux applications et aux outils dont elle a besoin.',
  organizationLink: 'Inscrire une organisation',

  howEyebrow: 'Comment fonctionne Zebron',
  howTitle: 'De la découverte à l’opportunité.',
  discover: 'Découvrir',
  discoverText: 'Recherchez des ressources, des organisations, des emplois et des formations adaptés à vos besoins.',
  explore: 'Explorer',
  exploreStepText: 'Apprenez-en davantage sur les organisations, les services, les programmes et les opportunités que vous découvrez.',
  connect: 'Agir',
  connectText: 'Passez à l’étape suivante en contactant directement l’organisation ou l’opportunité qui vous intéresse.',

  valueEyebrow: 'Conçu pour la découverte',
  valueTitle: 'Passez moins de temps à chercher et plus de temps à avancer.',
  valueText: 'Zebron rassemble des informations utiles pour que vous passiez moins de temps à chercher sur des sites dispersés et plus de temps à explorer les options qui correspondent à vos objectifs.',
  startExploring: 'Commencer à explorer',
  resourcesServices: 'Ressources et services',
  trainingEducation: 'Formation et éducation',
  jobsOpportunities: 'Emplois et opportunités',

  forOrganizations: 'Pour les organisations',
  forOrganizationsTitle: 'Faites connaître ce que propose votre organisation.',
  forOrganizationsText: 'Aidez les gens à découvrir vos ressources, programmes, services et opportunités grâce à Zebron.',
  addResource: 'Ajouter une ressource',

  supportZebron: 'Soutenir Zebron',
  supportTitle: 'Aidez-nous à rendre les ressources plus faciles à trouver.',
  supportText: 'Votre soutien aide Zebron à mettre les gens en relation avec des ressources, des organisations, des services et des opportunités de confiance.',

  seoTitle: 'Zebron | Ressources, emplois et opportunités',
  seoDescription: 'Zebron vous aide à découvrir des ressources, des organisations, des emplois, des formations et des opportunités au même endroit. Explorez ce qui est disponible et trouvez votre prochaine opportunité.',
};

export const HOME_TEXT: Record<string, HomeText> = {
  en: EN,
  fr: FR,
};

/** Picks the home page text for a language code such as "fr" or "en-US". */
export function homeText(languageCode: string | null | undefined): HomeText {
  const base = (languageCode ?? 'en').split('-')[0].toLowerCase();
  return HOME_TEXT[base] ?? EN;
}
