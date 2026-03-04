// Maps Hebrew and English item keywords → department ID
// Checked against the longest match first
export const ITEM_DEPARTMENT_MAP: Array<{ keywords: string[]; departmentId: string }> = [
  // Produce
  {
    keywords: [
      'עגבניה', 'עגבניות', 'מלפפון', 'מלפפונים', 'גזר', 'בצל', 'שום', 'פלפל', 'חסה',
      'תפוח אדמה', 'תפוחי אדמה', 'בטטה', 'קישוא', 'חציל', 'ברוקולי', 'כרוב', 'תרד',
      'פטרוזיליה', 'כוסברה', 'נענע', 'בזיליקום', 'אבוקדו', 'לימון', 'תפוח', 'תפוחים',
      'בננה', 'בננות', 'תות', 'תותים', 'ענב', 'ענבים', 'אבטיח', 'מלון', 'אפרסק',
      'שזיף', 'אגס', 'קיווי', 'מנגו', 'אננס', 'תפוז', 'תפוזים', 'מנדרינה', 'פומלה',
      'tomato', 'cucumber', 'carrot', 'onion', 'garlic', 'pepper', 'lettuce', 'potato',
      'apple', 'banana', 'grape', 'orange', 'lemon', 'avocado', 'strawberry', 'mango',
    ],
    departmentId: 'produce',
  },
  // Dairy
  {
    keywords: [
      'חלב', 'יוגורט', 'גבינה', 'גבינות', 'קוטג', 'שמנת', 'חמאה', 'מרגרינה',
      'ביצה', 'ביצים', 'לבן', 'קפיר', 'בולגרית', 'פרמזן', 'ריקוטה', 'מוצרלה',
      'milk', 'yogurt', 'cheese', 'butter', 'egg', 'eggs', 'cream', 'cottage',
    ],
    departmentId: 'dairy',
  },
  // Meat
  {
    keywords: [
      'עוף', 'חזה עוף', 'כנפיים', 'שוקיים', 'פרגית', 'בשר', 'בקר', 'טחון', 'אנטריקוט',
      'פילה', 'צלעות', 'כבד', 'נקניק', 'נקניקייה', 'שניצל', 'קבב', 'המבורגר',
      'chicken', 'beef', 'meat', 'sausage', 'steak', 'schnitzel', 'turkey',
      'הודו',
    ],
    departmentId: 'meat',
  },
  // Fish
  {
    keywords: [
      'סלמון', 'טונה', 'דג', 'דגים', 'בקלה', 'מוסר', 'לוקוס', 'שרימפס', 'קלמארי',
      'fish', 'salmon', 'tuna', 'shrimp',
    ],
    departmentId: 'fish',
  },
  // Bakery
  {
    keywords: [
      'לחם', 'פיתה', 'לחמניה', 'לחמניות', 'בגט', 'חלה', 'עוגה', 'עוגיות', 'קרואסון',
      'מאפה', 'מאפים', 'טורט', 'דונאט',
      'bread', 'pita', 'baguette', 'cake', 'cookie', 'croissant',
    ],
    departmentId: 'bakery',
  },
  // Deli
  {
    keywords: [
      'גבינה צהובה', 'אמנטל', 'גאודה', 'קממבר', 'פסטרמה', 'הם', 'סלמי', 'טחינה',
      'חומוס', 'סלט', 'ממרח', 'מעדן',
      'deli', 'hummus', 'tahini',
    ],
    departmentId: 'deli',
  },
  // Frozen
  {
    keywords: [
      'קפוא', 'קפואים', 'גלידה', 'פיצה קפואה', 'ירקות קפואים', 'בשר קפוא',
      'frozen', 'ice cream', 'gelato',
      'גלידה',
    ],
    departmentId: 'frozen',
  },
  // Canned & Dry
  {
    keywords: [
      'שימור', 'שימורים', 'אורז', 'פסטה', 'ספגטי', 'מקרוני', 'קמח', 'סוכר', 'מלח',
      'שמן', 'חומץ', 'רוטב', 'קטשופ', 'מיונז', 'חרדל', 'שעועית', 'עדשים', 'גרגרים',
      'דגנים', 'שיבולת שועל', 'קורנפלקס', 'מצות', 'קרקר',
      'rice', 'pasta', 'flour', 'sugar', 'salt', 'oil', 'sauce', 'ketchup',
      'mayo', 'mustard', 'beans', 'lentils', 'oats', 'cereal',
    ],
    departmentId: 'canned',
  },
  // Snacks
  {
    keywords: [
      'חטיף', 'חטיפים', 'שוקולד', 'סוכריות', 'גומי', 'ביסלי', 'במבה', 'פופקורן',
      'אגוזים', 'שקדים', 'גרעינים', 'חלבה', 'וופל', 'קרמבו',
      'chocolate', 'candy', 'chips', 'popcorn', 'nuts', 'almonds',
    ],
    departmentId: 'snacks',
  },
  // Beverages
  {
    keywords: [
      'מיץ', 'מים', 'קולה', 'ספרייט', 'פנטה', 'בירה', 'יין', 'וודקה', 'וויסקי',
      'קפה', 'תה', 'שוקו', 'נס קפה', 'כוס',
      'juice', 'water', 'cola', 'beer', 'wine', 'coffee', 'tea', 'soda',
    ],
    departmentId: 'beverages',
  },
  // Cleaning
  {
    keywords: [
      'סבון כלים', 'אקונומיקה', 'מרכך', 'אבקת כביסה', 'נוזל כביסה', 'סקוטש ברייט',
      'ניקוי', 'שקיות אשפה', 'מגבון', 'מגבונים', 'נייר טואלט', 'נייר מטבח',
      'dish soap', 'laundry', 'cleaning', 'trash bags', 'toilet paper', 'paper towel',
    ],
    departmentId: 'cleaning',
  },
  // Hygiene
  {
    keywords: [
      'שמפו', 'מרכך שיער', 'סבון גוף', 'קרם', 'דאודורנט', 'משחת שיניים', 'מברשת שיניים',
      'ניקוי פנים', 'לוסיון', 'ספוג', 'גילוח',
      'shampoo', 'conditioner', 'body wash', 'cream', 'deodorant', 'toothpaste',
      'toothbrush', 'lotion', 'razor',
    ],
    departmentId: 'hygiene',
  },
  // Baby
  {
    keywords: [
      'חיתול', 'חיתולים', 'פורמולה', 'תרכובת מזון לתינוק', 'מגבוני תינוקות',
      'diapers', 'formula', 'baby wipes', 'baby food',
    ],
    departmentId: 'baby',
  },
  // Pharma
  {
    keywords: [
      'אקמול', 'ויטמין', 'תוסף', 'כדור', 'תרופה', 'קרם הגנה', 'משחה',
      'vitamin', 'supplement', 'medicine', 'sunscreen',
    ],
    departmentId: 'pharma',
  },
];

export function guessDepartment(itemName: string): string {
  const lower = itemName.toLowerCase();
  for (const entry of ITEM_DEPARTMENT_MAP) {
    for (const keyword of entry.keywords) {
      if (lower.includes(keyword.toLowerCase())) {
        return entry.departmentId;
      }
    }
  }
  return 'other';
}
