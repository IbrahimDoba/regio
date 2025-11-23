export type CategoryColor = 'green' | 'red' | 'blue' | 'orange' | 'purple' | 'turquoise' | 'yellow';

export interface User {
  name: string;
  loc: string;
  img: string;
}

export interface Content {
  title: string;
  desc: string;
}

export interface Post {
  id: number;
  color: CategoryColor;
  catIcon: string;
  hasDocs: boolean;
  tags: string[];
  user: User;
  meta: { region: number };
  time: { [key: string]: string };
  content: { [key: string]: Content };
  price: string;
}

export interface LangTexts {
  filter: string;
  offers: string;
  scroll: string;
  contact: string;
  readmore: string;
  searchPh: string;
  region: string;
  country: string;
  city: string;
  createTitle: string;
  catLabel: string;
  titleLabel: string;
  titlePh: string;
  descLabel: string;
  descPh: string;
  imagesLabel: string;
  radiusLabel: string;
  tagsLabel: string;
  cancel: string;
  save: string;
  hintCat: string;
  hintTitle: string;
  hintDesc: string;
  hintImg: string;
  hintRad: string;
  hintTags: string;
  hintTF: string;
  hintPI: string;
  hintAmt: string;
  hintRoute: string;
  hintWP: string;
  hintFreq: string;
  hintLog: string;
  catOptions: { [key: string]: string };
  timeFactor: string;
  priceInfo: string;
  priceInfoPh: string;
  amountRegio: string;
  amountTime: string;
  start: string;
  dest: string;
  dateTime: string;
  costShare: string;
  loc: string;
  fee: string;
  budget: string;
  nationwide: string;
  duration: string;
  waypoints: string;
  frequency: string;
  oneTime: string;
  recurring: string;
  days: string;
  time: string;
  addWaypoint: string;
  transportGoods: string;
  maxDim: string;

  // Auth
  subtitle: string;
  welcome: string;
  email: string;
  pass: string;
  forgot: string;
  btnLogin: string;
  noAcc: string;
  useInvite: string;
  join: string;
  invReq: string;
  noCode: string;
  realTitle: string;
  realMsg: string;
  fname: string;
  lname: string;
  createPass: string;
  terms: string;
  btnCreate: string;
  hasAcc: string;
  btnLoginLink: string;
  mTitle: string;
  mText: string;
  mAlt: string;
  opt1T: string;
  opt1D: string;
  opt2T: string;
  opt2D: string;
  motivation: string;
  sendApp: string;
}