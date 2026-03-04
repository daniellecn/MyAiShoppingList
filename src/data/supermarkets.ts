import { Supermarket } from '../types';

export const DEFAULT_SUPERMARKETS: Supermarket[] = [
  {
    id: 'shufersal',
    name: 'שופרסל',
    promotionUrl: 'http://prices.shufersal.co.il/',
    departmentOrder: ['produce','dairy','meat','fish','bakery','deli','frozen','canned','snacks','beverages','cleaning','hygiene','baby','pharma','other'],
  },
  {
    id: 'rami-levy',
    name: 'רמי לוי',
    promotionUrl: 'https://url.publishedprices.co.il/rami-levy/',
    departmentOrder: ['produce','dairy','meat','fish','bakery','deli','frozen','canned','snacks','beverages','cleaning','hygiene','baby','pharma','other'],
  },
  {
    id: 'victory',
    name: 'ויקטורי',
    promotionUrl: 'http://prices.victory.co.il/',
    departmentOrder: ['produce','dairy','meat','fish','bakery','deli','frozen','canned','snacks','beverages','cleaning','hygiene','baby','pharma','other'],
  },
  {
    id: 'mega',
    name: 'מגה',
    promotionUrl: 'http://publishedprices.co.il/mega/',
    departmentOrder: ['produce','dairy','meat','fish','bakery','deli','frozen','canned','snacks','beverages','cleaning','hygiene','baby','pharma','other'],
  },
  {
    id: 'yochananof',
    name: 'יוחננוף',
    promotionUrl: undefined,
    departmentOrder: ['produce','dairy','meat','fish','bakery','deli','frozen','canned','snacks','beverages','cleaning','hygiene','baby','pharma','other'],
  },
  {
    id: 'other',
    name: 'אחר',
    promotionUrl: undefined,
    departmentOrder: ['produce','dairy','meat','fish','bakery','deli','frozen','canned','snacks','beverages','cleaning','hygiene','baby','pharma','other'],
  },
];
