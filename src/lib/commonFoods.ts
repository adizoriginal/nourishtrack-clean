// Everyday foods with nutrition per 100 g and typical portion sizes.
// Values come from USDA FoodData Central (FNDDS / SR Legacy), so the simple words people type
// ("egg", "rice", "toast") match a sensible food instead of whatever the database ranks first.
import type { FoodOption } from "./foodSearch";
import type { NutrientKey, Nutrients } from "./nutrients";

// [name, other names, kcal, protein, carbs, fat (per 100 g), portions "label=grams|..."]
// The first portion is used when someone gives a count without a unit ("2 eggs").
type Row = [string, string, number, number, number, number, string];

const ROWS: Row[] = [
  // Eggs
  ["Egg, boiled", "egg|boiled egg|hard boiled egg|soft boiled egg|poached egg", 143, 12.4, 0.96, 9.96, "1 egg=50|1 cup chopped=135"],
  ["Egg, fried", "fried egg", 192, 11.56, 0.9, 15.81, "1 egg=55"],
  ["Scrambled eggs", "scrambled egg|omelette|omelet", 192, 11.56, 0.9, 15.81, "1 egg=55|1 serving=110|1 cup=135"],

  // Grains, bread, starches
  ["White rice, cooked", "rice|white rice|boiled rice|steamed rice|plain rice", 129, 2.67, 27.99, 0.28, "1 serving=118|1 cup=158"],
  ["Brown rice, cooked", "brown rice", 123, 2.43, 25.76, 1.11, "1 serving=147|1 cup=195"],
  ["Rice cooked with oil", "rice with oil|oily rice", 151, 2.6, 27.19, 3.12, "1 serving=122|1 cup=163"],
  ["Fried rice", "fried rice", 174, 3.84, 32.5, 3.19, "1 cup=198"],
  ["White bread", "bread|white bread|sliced bread|sandwich bread", 267, 9.43, 49.2, 3.59, "1 slice=28|1 thin slice=24|1 thick slice=43"],
  ["Toast, white", "toast|white toast|toasted bread", 293, 10.36, 54.07, 3.94, "1 slice=25|1 thick slice=39"],
  ["Whole wheat bread", "whole wheat bread|wholemeal bread|brown bread|wheat bread|whole grain bread", 254, 12.3, 43.1, 3.55, "1 slice=36|1 thin slice=24|1 thick slice=43"],
  ["Whole wheat toast", "whole wheat toast|wholemeal toast|brown toast|wheat toast", 279, 13.52, 47.36, 3.9, "1 slice=33|1 thick slice=39"],
  ["Flour tortilla", "tortilla|flour tortilla|wrap", 306, 8.2, 49.38, 7.99, "1 medium=45|1 small=33|1 large=71"],
  ["Corn tortilla", "corn tortilla", 218, 5.7, 44.64, 2.85, "1 medium=28|1 small=18|1 large=44"],
  ["Bagel", "bagel", 264, 10.56, 52.38, 1.32, "1 regular=105|1 small=69|1 large=131"],
  ["Croissant", "croissant", 406, 8.2, 45.8, 21, "1 medium=57|1 small=42|1 large=73"],
  ["Pancakes", "pancake|pancakes", 282, 7.41, 35.32, 12.07, "1 medium pancake=50|1 small pancake=20|1 large pancake=90"],
  ["Naan bread", "naan|nan|naan bread", 311, 11.09, 50.23, 7.28, "1 naan=177|1 quarter naan=44"],
  ["Chapati / roti", "chapati|chapatti|roti", 299, 7.85, 46.13, 9.2, "1 medium=40|1 small=27|1 large=52"],
  ["Pasta, cooked", "pasta|spaghetti|macaroni|penne|fusilli", 157, 5.76, 30.68, 0.92, "1 cup=140"],
  ["Noodles, cooked", "noodles|egg noodles", 137, 4.51, 25.01, 2.06, "1 cup=160"],
  ["Rice noodles, cooked", "rice noodles", 107, 1.78, 23.87, 0.2, "1 cup=175"],
  ["Couscous, cooked", "couscous", 111, 3.77, 23.11, 0.16, "1 cup=160"],
  ["Quinoa, cooked", "quinoa", 120, 4.38, 21.21, 1.91, "1 cup=170"],
  ["Oatmeal / porridge", "oatmeal|oats|porridge|oat porridge", 76, 2.18, 11.17, 2.63, "1 cup=240"],
  ["Corn flakes", "corn flakes|cornflakes|cereal", 365, 6.4, 79.52, 1.6, "1 cup=30"],
  ["Potato, boiled", "potato|potatoes|boiled potato|boiled potatoes", 126, 1.87, 20.45, 4.25, "1 medium=170|1 small=130|1 large=300|1 cup=160"],
  ["Baked potato", "baked potato|jacket potato", 93, 1.95, 21.45, 0.1, "1 medium=285|1 small=230|1 large=400"],
  ["French fries", "fries|french fries|chips|hot chips", 225, 2.5, 23.23, 14.07, "1 serving=110|1 cup=60"],
  ["Mashed potato", "mash|mashed potato|mashed potatoes", 114, 2.15, 17.6, 4.07, "1 serving=125|1 cup=250"],
  ["Sweet potato", "sweet potato|sweet potatoes", 82, 1.64, 17.98, 0.39, "1 medium=150|1 small=80|1 large=235|1 cup mashed=250"],
  ["Cassava, cooked", "cassava|yuca|manioc", 191, 1.42, 39.62, 3.03, "1 serving=80|1 cup=160"],
  ["Plantain, fried", "plantain|plantains|fried plantain|dodo", 144, 1.26, 30.87, 3.24, "1 slice=25|1 cup=170|1 whole plantain=225"],
  ["Plantain, boiled", "boiled plantain", 122, 1.3, 31.8, 0.35, "1 whole plantain=235|1 cup=200|1 slice=25"],
  ["Corn on the cob", "corn|sweetcorn|sweet corn|maize|corn on the cob", 86, 3.26, 18.64, 1.35, "1 ear=105|1 cup=165"],

  // Meat, fish, protein
  ["Chicken breast, roasted", "chicken|chicken breast|grilled chicken|roast chicken|baked chicken", 161, 30.22, 0, 3.52, "1 medium breast=120|1 small breast=105|1 large breast=135|1 cup diced=135|1 slice=60"],
  ["Chicken thigh, roasted", "chicken thigh|thigh", 231, 23.12, 0, 14.62, "1 medium thigh=80|1 small thigh=75|1 large thigh=105"],
  ["Fried chicken drumstick", "fried chicken|drumstick|chicken drumstick|chicken leg", 241, 19.08, 5.98, 15.07, "1 medium drumstick=85|1 small drumstick=65|1 large drumstick=110"],
  ["Chicken wings, fried", "wings|chicken wings|chicken wing", 289, 19.39, 5.96, 20.24, "1 wing=55"],
  ["Chicken nuggets", "nuggets|chicken nuggets", 307, 15.92, 14.93, 20.36, "1 nugget=16"],
  ["Ground beef, cooked", "ground beef|minced beef|mince|beef mince", 261, 25.55, 0, 16.82, "1 serving=85|1 cup=125"],
  ["Beef steak", "steak|beef steak|beef", 229, 27, 0, 12.88, "1 regular steak=160|1 thin steak=120|1 thick steak=240"],
  ["Beef stew", "stew|beef stew", 107, 8.76, 6.29, 5.07, "1 cup=255"],
  ["Pork chop", "pork chop|pork", 171, 28.03, 0, 5.94, "1 regular=120|1 thin=90|1 thick=180"],
  ["Bacon", "bacon|bacon rasher", 468, 33.92, 1.7, 35.09, "1 slice=8|1 thick slice=12"],
  ["Sausage", "sausage|sausages", 325, 18.53, 1.42, 27.25, "1 link=75|1 breakfast link=20|1 patty=35"],
  ["Hot dog (frankfurter)", "hot dog|hotdog|frankfurter|frank", 310, 11.7, 2.89, 28, "1 regular=57"],
  ["Salmon, baked", "salmon", 274, 25.4, 0.01, 18.4, "1 fillet=140|1 large fillet=210"],
  ["Tuna, canned", "tuna|canned tuna|tinned tuna", 85, 19, 0.08, 0.94, "1 small can=75|1 standard can=115|1 large can=255"],
  ["Tilapia, baked", "tilapia", 160, 24.95, 0.01, 6.65, "1 fillet=90|1 whole fish=270"],
  ["Fish, cooked", "fish|fried fish", 238, 19.32, 6.64, 14.52, "1 fillet=90|1 large fillet=135"],
  ["Shrimp / prawns, cooked", "shrimp|shrimps|prawn|prawns", 90, 17.19, 1.15, 1.28, "1 large shrimp=15|1 cup=135"],
  ["Tofu, firm", "tofu|bean curd", 144, 17.27, 2.78, 8.72, "1 serving=85|1 half cup=126"],
  ["Black beans", "black beans", 134, 8.87, 24.34, 0.43, "1 cup=180"],
  ["Kidney beans", "beans|kidney beans|red beans", 135, 8.7, 24.72, 0.6, "1 cup=180"],
  ["Baked beans", "baked beans", 105, 4.52, 21.57, 0.89, "1 serving=130|1 cup=260"],
  ["Lentils, cooked", "lentils|lentil|dal|dhal|daal", 115, 8.97, 20.01, 0.38, "1 cup=180"],
  ["Chickpeas", "chickpeas|chickpea|garbanzo beans", 146, 8.19, 22.45, 3.24, "1 cup=180"],
  ["Hummus", "hummus|houmous", 243, 7.35, 14.9, 17.1, "1 tablespoon=15|1 serving=60"],
  ["Peanut butter", "peanut butter", 598, 22.21, 22.31, 51.36, "1 tablespoon=16|1 serving=32"],
  ["Whey protein powder", "protein shake|protein powder|whey|whey protein", 352, 78.13, 6.25, 1.56, "1 scoop=26"],

  // Dairy and alternatives
  ["Milk, whole", "milk|whole milk|full cream milk|full fat milk", 61, 3.27, 4.63, 3.2, "1 cup=244|1 fl oz=30.5"],
  ["Milk, 2% (semi-skimmed)", "semi skimmed milk|2% milk|reduced fat milk", 50, 3.36, 4.9, 1.9, "1 cup=244|1 fl oz=30.5"],
  ["Milk, 1% (low fat)", "1% milk|low fat milk", 43, 3.38, 5.18, 0.95, "1 cup=244|1 fl oz=30.5"],
  ["Milk, skim", "skim milk|skimmed milk|fat free milk|nonfat milk", 34, 3.43, 4.92, 0.08, "1 cup=244|1 fl oz=30.5"],
  ["Soy milk, unsweetened", "soy milk|soya milk", 38, 3.55, 1.29, 2.12, "1 cup=244"],
  ["Oat milk", "oat milk", 45, 0.66, 5.37, 2.33, "1 cup=244"],
  ["Almond milk, unsweetened", "almond milk", 15, 0.55, 0.34, 1.22, "1 cup=244"],
  ["Chocolate milk", "chocolate milk", 65, 3.44, 10.98, 0.83, "1 cup=248"],
  ["Yogurt, plain", "yogurt|yoghurt|natural yogurt|plain yogurt", 78, 3.82, 5.57, 4.48, "1 container=170|1 cup=245"],
  ["Greek yogurt, nonfat", "greek yogurt|greek yoghurt", 59, 10.3, 3.64, 0.37, "1 container=150|1 cup=245"],
  ["Cheddar cheese", "cheese|cheddar|cheddar cheese", 409, 23.3, 2.44, 34, "1 slice=21|1 cup shredded=113|1 stick=28"],
  ["Mozzarella", "mozzarella", 296, 23.7, 4.44, 20.4, "1 slice=21|1 cup shredded=113"],
  ["Cream cheese", "cream cheese", 343, 5.79, 4.56, 33.49, "1 tablespoon=15"],
  ["Butter", "butter", 743, 0.85, 0.06, 82.2, "1 pat=7|1 tablespoon=14"],
  ["Ice cream, vanilla", "ice cream", 207, 3.5, 23.6, 11, "1 scoop=120|1 cup=135"],

  // Fruit
  ["Banana", "banana|bananas", 97, 0.74, 22.71, 0.28, "1 banana=126|1 cup sliced=150"],
  ["Apple", "apple|apples", 61, 0.17, 14.8, 0.15, "1 medium=200|1 small=165|1 large=242|1 slice=25"],
  ["Orange", "orange|oranges", 50, 0.92, 11.78, 0.14, "1 orange=154|1 cup=180"],
  ["Mango", "mango|mangoes|mangos", 60, 0.82, 14.98, 0.38, "1 mango=210|1 cup=165"],
  ["Grapes", "grapes|grape", 83, 0.9, 19.4, 0.2, "1 cup=150|1 grape=7"],
  ["Strawberries", "strawberries|strawberry", 36, 0.64, 7.96, 0.22, "1 cup=150|1 strawberry=18"],
  ["Blueberries", "blueberries|blueberry", 64, 0.7, 14.57, 0.31, "1 cup=150"],
  ["Watermelon", "watermelon", 30, 0.61, 7.55, 0.15, "1 medium slice=325|1 cup=155"],
  ["Pineapple", "pineapple", 60, 0.46, 14.09, 0.21, "1 cup=165|1 slice=56"],
  ["Avocado", "avocado|avocados|avo", 160, 2, 8.53, 14.66, "1 avocado=150|1 slice=15"],
  ["Pear", "pear|pears", 59, 0.37, 15.18, 0.15, "1 pear=180"],
  ["Papaya / pawpaw", "papaya|pawpaw", 43, 0.47, 10.82, 0.26, "1 cup=165|1 papaya=330"],
  ["Peach", "peach|peaches", 46, 0.91, 10.1, 0.27, "1 peach=150"],

  // Vegetables
  ["Tomato", "tomato|tomatoes", 20, 0.82, 4.04, 0.31, "1 tomato=125|1 slice=20|1 cherry tomato=17"],
  ["Cucumber", "cucumber", 16, 0.62, 2.95, 0.18, "1 cucumber=200|1 slice=10|1 cup=120"],
  ["Carrot", "carrot|carrots", 44, 0.87, 9.68, 0.24, "1 carrot=60|1 cup=120"],
  ["Broccoli, cooked", "broccoli", 41, 2.67, 6.51, 0.35, "1 cup=155"],
  ["Spinach, raw", "spinach", 27, 2.85, 2.41, 0.62, "1 cup=25"],
  ["Lettuce", "lettuce", 20, 0.92, 3.69, 0.1, "1 cup=35|1 leaf=8"],
  ["Green salad (no dressing)", "salad|side salad|green salad|mixed greens|salad greens", 21, 1.31, 3.43, 0.21, "1 bowl=70|1 cup=35"],
  ["Onion", "onion|onions", 38, 0.86, 8.46, 0.08, "1 onion=148|1 cup=160"],

  // Drinks
  ["Coffee, black", "coffee|black coffee", 1, 0.12, 0, 0.02, "1 cup=240|1 mug=360"],
  ["Tea", "tea|black tea|cup of tea", 1, 0, 0.3, 0, "1 cup=240|1 mug=360"],
  ["Cappuccino", "cappuccino", 27, 1.71, 2.75, 0.99, "1 cup=240|1 small=360|1 medium=480|1 large=600"],
  ["Latte (skim milk)", "latte|cafe latte", 30, 2.87, 4.37, 0.1, "1 cup=240|1 small=360|1 medium=480|1 large=600"],
  ["Orange juice", "orange juice|juice|oj", 47, 0.77, 10.17, 0.34, "1 cup=248"],
  ["Cola", "cola|coke|soda|soft drink|fizzy drink", 42, 0, 10.36, 0.25, "1 can=372|1 bottle (500 ml)=524"],
  ["Beer", "beer|lager", 43, 0.46, 3.55, 0, "1 can or bottle=360|1 pint=480"],
  ["Red wine", "wine|red wine", 85, 0.07, 2.61, 0, "1 glass=180"],

  // Fats, sweeteners, sauces
  ["Olive oil", "olive oil", 900, 0, 0, 100, "1 tablespoon=14|1 teaspoon=4.5"],
  ["Vegetable oil", "oil|vegetable oil|cooking oil|palm oil|sunflower oil", 900, 0, 0, 100, "1 tablespoon=14|1 teaspoon=4.5"],
  ["Sugar", "sugar", 401, 0, 99.6, 0.32, "1 teaspoon=4.2|1 cube=2.3|1 tablespoon=12.5"],
  ["Honey", "honey", 304, 0.3, 82.4, 0, "1 tablespoon=20|1 teaspoon=7"],
  ["Jam", "jam|jelly|marmalade", 266, 0.15, 69.95, 0.02, "1 tablespoon=20"],
  ["Mayonnaise", "mayonnaise|mayo", 680, 0.96, 0.57, 74.85, "1 tablespoon=13.8"],
  ["Ketchup", "ketchup|tomato ketchup", 109, 1.08, 27.1, 0.32, "1 tablespoon=17"],

  // Snacks and meals
  ["Almonds", "almonds|almond", 598, 20.96, 21.01, 52.54, "1 oz=28.35|1 almond=1.2"],
  ["Peanuts", "peanuts|peanut|groundnuts|groundnut", 587, 24.35, 21.26, 49.66, "1 oz=28.35"],
  ["Cashews", "cashews|cashew|cashew nuts", 574, 15.31, 32.69, 46.35, "1 oz=28.35"],
  ["Milk chocolate", "chocolate|milk chocolate|chocolate bar", 535, 7.65, 59.4, 29.66, "1 bar=44"],
  ["Potato chips / crisps", "crisps|potato chips|potato crisps", 532, 6.39, 53.83, 33.98, "1 small bag=28|1 medium bag=57"],
  ["Popcorn", "popcorn", 518, 9.13, 54.99, 30.57, "1 cup popped=14|1 small bag=43"],
  ["Chocolate chip cookie", "cookie|cookies|chocolate chip cookie", 492, 5.1, 65.36, 24.72, "1 medium cookie=30|1 large cookie=45"],
  ["Doughnut", "doughnut|donut", 426, 5.52, 49.52, 22.86, "1 doughnut=75"],
  ["Muffin", "muffin", 375, 4.49, 53, 16.07, "1 medium=130|1 small=70|1 large=180"],
  ["Cheese pizza", "pizza|cheese pizza", 266, 11.39, 33.33, 9.69, "1 slice=86|1 large slice=119"],
  ["Hamburger", "burger|hamburger", 288, 17.51, 20.68, 14.38, "1 burger=145"],
  ["Chicken curry", "curry|chicken curry", 107, 6.48, 6.54, 6.48, "1 cup=240"],
  ["Soup", "soup", 49, 3.51, 6.09, 1.3, "1 cup=245"],
];

// Per 100 g, same order as ROWS: fibre g, sugar g, saturated fat g, sodium mg, potassium mg, calcium mg, iron mg, vitamin C mg, vitamin D µg
const MICROS = `
0,0.2,3.2,129,132,48,1.67,0,2.5
0,0.19,3.85,228,123,45,1.57,0,2.3
0,0.19,3.85,228,123,45,1.57,0,2.3
0.4,0.05,0.08,245,35,10,1.19,0,0
1,0.22,0.2,201,80,5,0.4,0,0
0.4,0.05,0.46,238,34,10,1.16,0,0
1.1,0.62,0.49,361,69,11,0.46,3.8,0
2.3,5.34,0.82,450,117,211,3.36,0,0
2.5,5.87,0.9,495,129,232,3.69,0,0
6,4.41,0.73,430,250,163,2.56,0,0
6.6,4.85,0.8,473,275,179,2.81,0,0
3.5,3.71,2.92,700,125,146,3.63,0,0
6.3,0.88,0.45,45,186,81,1.23,0,0
1.6,8.43,0.36,422,107,70,3.57,0,0
2.6,11.26,11.66,300,118,37,2.03,0.2,0
2.1,7.05,3.01,508,174,206,1.45,0,1
5.2,3.7,3.16,508,201,64,1.88,0,0
9.7,2.93,3.31,298,196,36,2.2,0,0
1.8,0.56,0.18,232,44,7,1.27,0,0
1.2,0.4,0.42,236,38,12,1.46,0,0.1
1,0.03,0.02,250,4,4,0.14,0,0
1.4,0.1,0.03,189,58,8,0.38,0,0
2.8,0.87,0.23,163,171,17,1.48,0,0
1.7,0.17,0.85,81,57,12,0.67,0,0
3.5,9.44,0.2,703,128,4,28.01,0,5
1.4,1.62,1.11,166,372,5,0.34,12.1,0
1.5,1.69,0.03,181,389,5,0.35,12.7,0
1.8,0.34,1.99,295,435,11,0.53,7.8,0
1.2,2.13,2.15,210,330,25,0.28,10.1,0
3.1,6.29,0.02,154,504,23,0.42,13.1,0
1.9,1.78,0.79,145,282,17,0.28,18.2,0
1.6,16.95,0.39,116,471,3,0.54,15.1,0
1.7,17.46,0,120,486,3,0.55,15.6,0
2,6.24,0.32,131,269,2,0.52,5.8,0
0,0,0.76,360,359,7,0.45,0,0
0,0,4.09,332,252,9,1.07,0,0.2
0.2,0.1,3.11,363,204,16,1.32,0,0.1
0.2,0.1,4.83,419,176,22,1.11,0,0.2
0.9,0.08,3.57,594,251,11,0.83,0.6,0.2
0,0,6.46,381,302,24,2.47,0,0
0,0,5.29,369,321,16,2.64,0,0.1
1.3,1.57,1.93,307,254,17,0.97,7,0
0,0,2.03,356,437,6,0.6,0,0.6
0,0,11.96,1684,499,11,0.95,0,0.4
0,1.09,8.83,814,342,9,1.2,0,1.4
0,1.26,11.4,828,326,15,1.14,0,0.9
0,0.01,4.28,294,452,11,0.44,2.9,13.7
0,0,0.22,219,176,18,1.67,0,1.2
0,0.01,1.91,280,376,13,0.7,0,3.9
0.3,0.12,2.84,350,329,17,0.86,0.9,5.3
0,0,0.33,248,143,68,0.26,0,0.1
2.3,,1.26,14,237,683,2.66,0.2,0
10.1,0.34,0.11,348,453,51,2.79,3.8,0
8,3.08,0.21,311,433,48,2.08,1.3,0
4.4,8.23,0.23,391,231,39,1.4,0,0
7.9,1.79,0.05,233,367,19,3.31,1.4,0
7.3,4.31,0.34,327,240,58,2.05,0.2,0
5.4,0.34,2.22,438,289,41,2.41,0,0
5,10.49,10.33,426,558,49,1.74,0,0
3.1,0,0.78,156,500,469,1.13,0,0
0,4.81,1.86,38,150,123,0,0,1.1
0,4.89,1.11,39,159,126,0,0.2,1.1
0,4.96,0.57,39,159,126,0,0,1.1
0,5.05,0.05,41,167,132,0,0,1.1
0,0.56,0.31,34,158,101,0.54,0,0.7
0.5,2.04,0.19,43,18,155,0.21,0,1.7
0,0,0.1,60,31,173,0.29,0,0.9
0.1,9.55,0.46,68,174,128,0.24,0.6,1.1
0,4.09,2.32,42,164,127,0,0.5,1.2
0,3.27,0.11,36,141,111,0.07,0,0
0,0.33,19.2,654,77,707,0.16,0,0.6
0,1.81,11.7,699,116,693,0.2,0,0.4
0,3.76,19.7,368,125,97,0,0,0
0,0.58,45.6,524,23,21,0.06,0,0.4
0.7,21.22,6.79,80,199,128,0.09,0.6,0.2
1.7,15.8,0.11,0,326,5,0,12,0
2.1,12.08,0.03,0,104,5,0.03,4.6,0
2.2,8.96,0.02,4,174,42,0.22,56.2,0
1.6,13.66,0.09,1,168,11,0.16,36.4,0
0.9,16.74,0.05,5,224,10,0.18,3.2,0
1.8,4.86,0,0,161,17,0.26,59.6,0
2.4,9.36,0.03,0,86,12,0.34,8.1,0
0.4,6.2,0.02,1,112,7,0.24,8.1,0
0.9,11.42,0.01,0,137,12,0.05,58.6,0
6.7,0.66,2.13,7,485,12,0.55,10,0
3.1,9.73,0.02,3,104,9,0.18,4.3,0
1.7,7.82,0.08,8,182,20,0.25,60.9,0
1.5,8.39,0.02,13,122,4,0.34,4.1,0
1.2,2.63,0.03,4,226,10,0.22,16.3,0
0.5,1.67,0.04,2,170,16,0,2.8,0
2.9,4.75,0.03,75,258,36,0.12,4.2,0
2.5,1.45,0.04,158,315,48,0.72,80.6,0
1.6,0.42,0.06,111,582,68,1.26,26.5,0
1.3,1.1,0.03,23,249,31,0.26,8,0
1.4,0.97,0.03,41,316,39,0.46,11.7,0
1.7,5.8,0.04,1,171,17,0.24,8.2,0
0,0,0,2,49,2,0.01,0,0
0,0,0,3,37,0,0.02,0,0
0,2.46,0.57,23,100,65,0.02,0.1,0.6
0,4.2,0.06,36,158,110,0.02,0,0.9
0.3,8.18,0.01,2,181,56,0.06,28.7,0.4
0,9.94,0,3,5,1,0.02,0,0
0,0,0,4,27,4,0.02,0,0
0,0.62,0,4,127,8,0.46,0,0
0,0,15.52,2,1,1,0.56,0,0
0,0,13.37,0,0,0,0.16,0,0
0,99.8,0,1,2,1,0.05,0,0
0.2,82.12,0,4,52,6,0.42,0.5,0
1,51.22,0.01,30,54,7,0.19,0.9,0
0,0.57,11.7,635,20,8,0.21,0,0.2
0.3,21.54,0.01,928,265,14,0.39,4.1,0
10.9,4.86,4.09,3,713,268,3.73,0,0
8.4,4.9,7.72,410,634,58,1.58,0,0
3,5.01,9.16,16,565,45,6,0,0
3.4,51.5,18.5,79,372,189,2.35,0,0
3.1,0.33,3.4,527,1196,21,1.28,21.6,0
10.2,0.61,14.3,764,232,6,2.26,0,0
2,32.9,8.09,311,171,21,5.58,0,0
1.8,23.51,9.85,378,113,69,2.36,0.6,0
1.1,31.47,2.84,336,121,44,1.3,0.9,0.1
2.3,3.58,4.47,540,172,188,2.48,1.4,0
0.7,3,5.5,355,229,66,2.83,0.5,0.1
1.4,2.56,1.56,376,280,20,0.71,8.9,0
1.8,1.31,0.35,247,169,14,0.66,5.2,0
`.trim().split("\n");

const MICRO_KEYS: NutrientKey[] = ["fiber", "sugar", "satFat", "sodium", "potassium", "calcium", "iron", "vitC", "vitD"];

const microsFor = (i: number): Nutrients | undefined => {
  const values = MICROS[i]?.split(",");
  if (!values) return undefined;
  const out: Nutrients = {};
  MICRO_KEYS.forEach((key, k) => {
    if (values[k] !== "" && values[k] !== undefined) out[key] = Number(values[k]);
  });
  return out;
};

const round1 = (n: number) => Math.round(n * 10) / 10;

export const COMMON_FOODS: (FoodOption & { aliases: string[] })[] = ROWS.map(([name, aliases, kcal, p, c, f, portions], i) => {
  const parsed = portions.split("|").map((part) => {
    const [label, grams] = part.split("=");
    return { label, grams: Number(grams) };
  });
  return {
    key: `common-${i}`,
    name,
    aliases: aliases.split("|"),
    unit: "g" as const,
    baseAmount: 100,
    defaultAmount: parsed[0].grams,
    calories: kcal,
    protein: round1(p),
    carbs: round1(c),
    fat: round1(f),
    portions: parsed,
    nutrients: microsFor(i),
    source: "common" as const,
  };
});
