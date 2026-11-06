const express = require('express');
const path = require('path');
const fs = require('fs');
const db = require('./models/db');

const app = express();
const PORT = process.env.PORT || 3000;

// Body parsing middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Serve static frontend files
app.use(express.static(path.join(__dirname, '../public')));

// Ensure static asset folders exist
const uploadsDir = path.join(__dirname, '../public/uploads');
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
}

const imagesDir = path.join(__dirname, '../public/images');
if (!fs.existsSync(imagesDir)) {
  fs.mkdirSync(imagesDir, { recursive: true });
}

// Import routes
const authRoutes = require('./routes/auth');
const shopRoutes = require('./routes/shop');
const diseaseRoutes = require('./routes/disease');
const adminRoutes = require('./routes/admin');
const chatbotRoutes = require('./routes/chatbot');

// Map API endpoints
app.use('/api/auth', authRoutes);
app.use('/api', shopRoutes);
app.use('/api/disease', diseaseRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/chatbot', chatbotRoutes);

// Dedicated login page route
app.get('/login', (req, res) => {
  res.sendFile(path.join(__dirname, '../public/login.html'));
});

// Catch-all route to serve SPA frontend
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, '../public/index.html'));
});

// Database Seeding Logic
function seedDatabase() {
  console.log('Checking database seed state...');

  // 1. Seed Diseases
  const defaultDiseases = [
    // --- TOMATO ---
    {
      plantType: "Tomato",
      name: "Early Blight",
      scientificName: "Alternaria solani",
      symptoms: [
        "Dark brown spots with concentric ring patterns (bullseye look) appearing first on older lower leaves.",
        "Yellowing of leaf tissue surrounding the spots, followed by leaves turning brown and dropping off.",
        "Leathery, black spots near the stem connection of the tomatoes."
      ],
      causes: "Alternaria solani fungus. Thrives in warm, humid weather. Spreads through air and water splash from contaminated soil or debris.",
      prevention: [
        "Rotate solanaceous crops (tomato, potato, pepper) every 2-3 years.",
        "Avoid overhead sprinkler watering; use drip irrigation systems at ground level.",
        "Leave adequate space between tomato cages to maximize drying winds."
      ],
      treatment: [
        "Apply organic copper-based fungicides at the first sign of leaf spots.",
        "Prune and dispose of lower leaves (up to 12 inches from ground) to stop soil fungi from splashing onto leaves.",
        "Strictly clear all plant debris at the end of the harvest season."
      ]
    },
    {
      plantType: "Tomato",
      name: "Late Blight",
      scientificName: "Phytophthora infestans",
      symptoms: [
        "Large, irregular water-soaked spots on leaves that rapidly turn dark brown or black.",
        "White, velvety fungal growth on the underside of leaves during damp or humid mornings.",
        "Greasy, copper-brown blotches on the tomatoes that ruin the flesh."
      ],
      causes: "Phytophthora infestans oomycete (water mold). Extremely destructive. Spreads like wildfire in cool, wet, foggy conditions.",
      prevention: [
        "Plant only certified disease-resistant tomato varieties (e.g., Mountain Magic, Defiant).",
        "Destroy self-seeded volunteer tomato plants which can harbor pathogens over winter.",
        "Ensure high air circulation and avoid pruning during wet weather."
      ],
      treatment: [
        "Apply preventive copper sprays or chlorothalonil immediately if late blight is reported in your region.",
        "Remove and bag infected plants completely. Do not compost them, as the mold spores survive.",
        "Harvest remaining unaffected tomatoes immediately to save them from rotting."
      ]
    },
    {
      plantType: "Tomato",
      name: "Healthy",
      scientificName: "Solanum lycopersicum",
      symptoms: [
        "Leaves exhibit healthy green pigmentation and show no spotting or decay.",
        "Vines are upright and sturdy, showcasing high structural vigor.",
        "Fruit has smooth, uniform skin matching its ripeness stage."
      ],
      causes: "Proper care, well-drained fertile soil, balanced watering, and sufficient sunlight.",
      prevention: [
        "Maintain routine weed cleaning and soil mulching.",
        "Keep watering consistent, focusing on the root zone.",
        "Perform light weekly prunings of unnecessary suckers to keep airflow high."
      ],
      treatment: [
        "No treatment required! Maintain current watering and fertilizing schedules.",
        "Apply light organic mulch (straw/bark) to insulate the soil and lock moisture."
      ]
    },
    // --- POTATO ---
    {
      plantType: "Potato",
      name: "Early Blight",
      scientificName: "Alternaria solani",
      symptoms: [
        "Concentric target-board brown spots appearing on mature leaves.",
        "Lower leaves yellow, wither, and prematurely drop off, leaving stems exposed.",
        "Tubers develop dry, dark, corky lesions, showing skin sinking."
      ],
      causes: "Alternaria solani fungus. Survives in crop stubble and soil. Spreads in high humidity alternating with dry periods.",
      prevention: [
        "Plant certified disease-free seed tubers.",
        "Avoid overhead irrigation to keep potato leaves dry.",
        "Keep potato plants well-fertilized; nitrogen-stressed plants are highly susceptible."
      ],
      treatment: [
        "Apply copper-based fungicides when spots first appear on lower foliage.",
        "Harvest potatoes only after vines have died completely to allow skin to harden, preventing infection during storage.",
        "Prune and destroy infected foliage."
      ]
    },
    {
      plantType: "Potato",
      name: "Late Blight",
      scientificName: "Phytophthora infestans",
      symptoms: [
        "Dark, water-soaked leaf spots starting from margins and spreading across the entire stem.",
        "White mildew-like fuzz surrounding spots on leaf undersides in high humidity.",
        "Tubers show reddish-brown dry rot on the surface, spreading inwards."
      ],
      causes: "Phytophthora infestans water mold. Responsible for the Irish Potato Famine. Multiplies incredibly fast in damp, cool environments.",
      prevention: [
        "Avoid planting potatoes in soil where tomatoes or potatoes grew in the last 3 years.",
        "Apply thick soil hills over potato tubers to prevent spores washing down from leaves.",
        "Destroy volunteer potatoes immediately."
      ],
      treatment: [
        "Spray defensive fungicides regularly if cool, rainy weather persists.",
        "Mow/cut infected potato vines down to the soil level to prevent tuber infection, then harvest tubers 2 weeks later.",
        "Segregate and discard soft, smelling tubers during storage."
      ]
    },
    {
      plantType: "Potato",
      name: "Healthy",
      scientificName: "Solanum tuberosum",
      symptoms: [
        "Green foliage is lush, broad, and free of spots or white growth.",
        "Stems are strong and upright.",
        "Tubers are firm, uniform, and skin is clean."
      ],
      causes: "High soil drainage, rich organic content, clean seed tubers, and dry leaf conditions.",
      prevention: [
        "Continue hilling potatoes to keep tubers shielded from sunlight.",
        "Rotate crops routinely.",
        "Ensure soil pH is kept slightly acidic (5.0 - 5.5) to naturally prevent potato scab disease."
      ],
      treatment: [
        "No treatment required. Maintain current care parameters."
      ]
    },
    // --- APPLE ---
    {
      plantType: "Apple",
      name: "Apple Scab",
      scientificName: "Venturia inaequalis",
      symptoms: [
        "Olive-green, velvety spots appearing on the top and bottom of leaves.",
        "Leaves twist, pucker, and turn yellow, resulting in early leaf drop.",
        "Apples show corky, scabby brown lesions that crack as they expand, distorting fruit shape."
      ],
      causes: "Venturia inaequalis fungus. Overwinters on fallen dead leaves. Spores are released by spring rains and blown by wind onto new leaves.",
      prevention: [
        "Rake and destroy all fallen leaves in autumn to eliminate overwintering spores.",
        "Plant scab-resistant cultivars (e.g., Honeycrisp, Liberty, Enterprise).",
        "Prune branches to open up the canopy, letting leaves dry quickly after rains."
      ],
      treatment: [
        "Apply organic sulfur or copper fungicides starting from green tip stage in spring through petal fall.",
        "Remove scabby fruit from the tree early to focus tree energy on healthy fruit.",
        "Apply agricultural lime to fallen leaves in autumn to accelerate leaf decomposition."
      ]
    },
    {
      plantType: "Apple",
      name: "Healthy",
      scientificName: "Malus domestica",
      symptoms: [
        "Leaves are wide, green, with clean margins and no spotting.",
        "Apples have smooth skins, vibrant color, and zero corky skin patches.",
        "Tree limbs show clean bark and robust new growth buds."
      ],
      causes: "Proper seasonal pruning, cleanup of fallen leaves, and preventive spring care.",
      prevention: [
        "Prune annually in late winter to maximize sunlight penetration.",
        "Apply organic compost at the drip line in early spring.",
        "Maintain orchard floor cleanliness by removing debris."
      ],
      treatment: [
        "No treatment required. Ensure tree gets adequate water during fruiting season."
      ]
    },
    // --- GRAPE ---
    {
      plantType: "Grape",
      name: "Black Rot",
      scientificName: "Guignardia bidwellii",
      symptoms: [
        "Small, round, cream-colored spots with dark reddish-brown borders on leaves.",
        "Elongated black lesions on petioles and young green shoots.",
        "Grape berries turn purple-brown, shrivel, and dry into hard, wrinkled black 'mummies'."
      ],
      causes: "Guignardia bidwellii fungus. Thrives in warm, rainy weather. Spores shoot out from overwintered berry mummies during spring rains.",
      prevention: [
        "Remove all grape berry mummies from the vines and vineyard floor during winter pruning.",
        "Prune vines to keep them off the ground on trellis systems, maximizing ventilation.",
        "Keep wild grapevines away from your vineyard as they harbor the fungus."
      ],
      treatment: [
        "Spray with organic copper or Mancozeb fungicides starting from early spring shoot growth until grapes turn color.",
        "Prune and destroy infected leaves and fruit clusters immediately during the growing season.",
        "Ensure trellis training exposes fruit to direct sunlight for quick drying."
      ]
    },
    {
      plantType: "Grape",
      name: "Healthy",
      scientificName: "Vitis vinifera",
      symptoms: [
        "Leaves are large, healthy green, and clear of circular spots.",
        "Shoots are strong and climbing vigorously.",
        "Grapes are plump, glassy, and ripening uniformly in healthy clusters."
      ],
      causes: "Pruning discipline, trellis support, well-aerated soil, and full sun exposure.",
      prevention: [
        "Practice vine training to maximize air currents.",
        "Check leaf undersides weekly for signs of pests or spotting.",
        "Apply organic potash fertilizer in spring to support grape sweetness and vine health."
      ],
      treatment: [
        "No treatment required. Keep tying new shoots to the trellis guides."
      ]
    },
    // --- CORN ---
    {
      plantType: "Corn",
      name: "Northern Leaf Blight",
      scientificName: "Exserohilum turcicum",
      symptoms: [
        "Long, elliptical, grayish-green to tan lesions (1-6 inches) running parallel to leaf margins.",
        "Lesions develop dark olive-green centers as fungal sporulation intensifies.",
        "Severe infection causes complete leaf blighting, reducing photosynthesis drastically."
      ],
      causes: "Exserohilum turcicum fungus. Spreads via windborne spores in warm (65-80°F), moist conditions. Survives in infected crop residue.",
      prevention: [
        "Plant NLB-resistant hybrid corn varieties with Ht1, Ht2, or HtN resistance genes.",
        "Rotate corn with non-host crops like soybeans or wheat for at least 1-2 seasons.",
        "Till crop residues after harvest to reduce overwintering inoculum in the field."
      ],
      treatment: [
        "Apply foliar fungicides (Azoxystrobin, Propiconazole) at tassel emergence for high-value fields.",
        "Scout fields frequently during silking stage when the crop is most susceptible.",
        "Avoid excessive nitrogen fertilization which promotes lush, infection-prone canopy."
      ]
    },
    {
      plantType: "Corn",
      name: "Common Rust",
      scientificName: "Puccinia sorghi",
      symptoms: [
        "Small, oval to circular, golden-brown to brick-red pustules scattered across both leaf surfaces.",
        "Pustules rupture and release powdery rust-brown spore masses that rub off on hands.",
        "Heavily infected leaves turn yellow then die, collapsing the canopy prematurely."
      ],
      causes: "Puccinia sorghi obligate fungal parasite. Spread by airborne urediniospores. Thrives in cool (60-77°F), humid weather with heavy dew.",
      prevention: [
        "Grow rust-resistant corn hybrids; most modern commercial hybrids carry good rust tolerance.",
        "Early planting avoids late-season rust pressure when spore populations peak.",
        "Monitor weather forecasts for cool, cloudy, dew-heavy periods and scout proactively."
      ],
      treatment: [
        "Spray triazole or strobilurin fungicides (e.g., Headline, Quilt Xcel) before disease establishes.",
        "Fungicide application is most effective between V10 (10-leaf) and VT (tasseling) growth stages.",
        "If rust is severe at VT stage, prioritize fields with high yield potential for spraying."
      ]
    },
    {
      plantType: "Corn",
      name: "Gray Leaf Spot",
      scientificName: "Cercospora zeae-maydis",
      symptoms: [
        "Narrow, rectangular, tan to gray lesions with well-defined parallel leaf vein boundaries.",
        "Lesions expand to create large necrotic patches that kill entire leaf sections.",
        "Humid mornings reveal a gray powdery coating (sporulation) on lesion undersides."
      ],
      causes: "Cercospora zeae-maydis fungus. Primary threat in no-till and high-residue corn systems. Requires 12+ hours of leaf wetness at 75-85°F.",
      prevention: [
        "Avoid continuous corn cropping; rotate with soybeans to reduce residue inoculum.",
        "Choose GLS-tolerant hybrids especially in no-till, irrigated, or humid regions.",
        "Maximize row spacing and plant populations to reduce canopy humidity."
      ],
      treatment: [
        "Apply strobilurin + triazole premix fungicides at VT/R1 growth stage for maximum ROI.",
        "Avoid overhead irrigation late in the day when wet leaves overnight worsens infection.",
        "Manage corn borers and other insects that create wound entry points for fungal infection."
      ]
    },
    {
      plantType: "Corn",
      name: "Healthy",
      scientificName: "Zea mays",
      symptoms: [
        "Leaves are broad, bright green with no pustules, spots, or necrotic lesions.",
        "Stalks are upright and thick with strong root systems anchoring the plant.",
        "Ears fill uniformly with plump, tightly packed kernels of consistent color."
      ],
      causes: "Proper hybrid selection, adequate soil fertility, good drainage, and timely planting.",
      prevention: [
        "Test soil annually and apply balanced NPK fertilizer based on soil test recommendations.",
        "Scout weekly for insects (corn borer, rootworm) which open plants to secondary infections.",
        "Maintain proper plant populations to ensure adequate canopy ventilation."
      ],
      treatment: [
        "No treatment required. Maintain current field management practices.",
        "Ensure adequate potassium nutrition which improves stalk strength and disease resistance."
      ]
    },
    // --- RICE ---
    {
      plantType: "Rice",
      name: "Brown Spot",
      scientificName: "Cochliobolus miyabeanus",
      symptoms: [
        "Oval to circular brown spots with yellow halos on leaves, glumes, and grain.",
        "Lesions have a white-gray center surrounded by a dark brown ring, resembling a bird's eye.",
        "Heavily infected grains appear discolored (black to orange) and have poor milling quality."
      ],
      causes: "Cochliobolus miyabeanus fungus. Strongly associated with nutrient-deficient (especially potassium and silicon) and drought-stressed rice.",
      prevention: [
        "Apply balanced fertilizers — ensure adequate potassium, silicon, and micronutrients.",
        "Use certified disease-free seeds and treat seeds with hot water (52°C for 10 min) before planting.",
        "Maintain proper water management; avoid prolonged drought stress in the paddy."
      ],
      treatment: [
        "Spray organic copper oxychloride or Mancozeb at the first sign of infection.",
        "Apply silicon-based soil amendments to strengthen rice cell walls against fungal penetration.",
        "Harvest promptly at maturity to reduce grain quality loss from field exposure."
      ]
    },
    {
      plantType: "Rice",
      name: "Leaf Blast",
      scientificName: "Magnaporthe oryzae",
      symptoms: [
        "Diamond or spindle-shaped spots with gray-white centers and dark brown or red-brown borders on leaves.",
        "Severe infection causes leaves to wither and collapse; the 'rotten neck' symptom breaks the panicle.",
        "Nodes and neck turn dark brown to black, causing the panicle to fall over (neck rot stage)."
      ],
      causes: "Magnaporthe oryzae. The most damaging rice disease globally. Explosive spread in cool nights (60-70°F), humid days, and high nitrogen conditions.",
      prevention: [
        "Plant blast-resistant rice varieties (e.g., IR64, Swarna Sub1, BRRI dhan29).",
        "Avoid excessive nitrogen fertilizer, especially at the tillering stage.",
        "Drain and re-flood paddies to reduce prolonged leaf wetness periods."
      ],
      treatment: [
        "Apply systemic fungicides (Tricyclazole, Isoprothiolane) at the onset of lesion appearance.",
        "Spray at the boot stage to protect the panicle from neck blast.",
        "Avoid late planting which coincides with peak airborne spore seasons."
      ]
    },
    {
      plantType: "Rice",
      name: "Bacterial Leaf Blight",
      scientificName: "Xanthomonas oryzae pv. oryzae",
      symptoms: [
        "Water-soaked, grayish-green stripes appearing on leaf margins that quickly turn yellow then straw-white.",
        "'Kresek' symptom: entire seedlings wilt and die within 3 weeks of transplanting in severe cases.",
        "Bacterial ooze (yellowish droplets) visible on lesions in early humid mornings."
      ],
      causes: "Xanthomonas oryzae bacteria. Enters leaves through natural hydathodes or wounds. Spreads rapidly with rain splash, wind, and flood irrigation.",
      prevention: [
        "Use resistant rice varieties (e.g., IR20, IR72, IRRI selections with Xa genes).",
        "Avoid deep water flooding which spreads bacteria through paddies.",
        "Reduce nitrogen fertilizer; high nitrogen creates lush, susceptible leaf tissue."
      ],
      treatment: [
        "Drain the field immediately and reduce nitrogen applications upon disease detection.",
        "Copper-based bactericides offer partial suppression but cannot eliminate established infections.",
        "Remove and destroy severely infected plants and volunteer rice from field borders."
      ]
    },
    {
      plantType: "Rice",
      name: "Healthy",
      scientificName: "Oryza sativa",
      symptoms: [
        "Leaves are long, narrow, and vivid green without any spots, stripes, or lesions.",
        "Tillers are upright with strong culms (stems) and well-anchored root systems.",
        "Panicles are heavy, fully-filled, and standing erect without discoloration."
      ],
      causes: "Well-managed paddy with balanced nutrition, proper water control, and pest monitoring.",
      prevention: [
        "Maintain consistent 2-5 cm water depth in the paddy during vegetative growth.",
        "Apply silicon fertilizer to strengthen cell walls and improve blast resistance.",
        "Monitor for insect pests (stem borer, BPH) weekly and act immediately on threshold."
      ],
      treatment: [
        "No treatment required. Maintain good agronomic practices.",
        "Drain the paddy 1-2 weeks before harvest to allow uniform grain ripening."
      ]
    },
    // --- STRAWBERRY ---
    {
      plantType: "Strawberry",
      name: "Leaf Scorch",
      scientificName: "Diplocarpon earlianum",
      symptoms: [
        "Numerous small, irregular, dark purple to red spots scattered across the upper leaf surface.",
        "Spots enlarge and their centers turn grayish-brown while margins remain dark purple.",
        "Severely infected leaves appear 'scorched', curl upward, and drop prematurely."
      ],
      causes: "Diplocarpon earlianum fungus. Overwinters in infected leaf tissue and crowns. Wet, rainy spring weather triggers mass spore release.",
      prevention: [
        "Remove and destroy all old leaf debris before new growth emerges each spring.",
        "Avoid overhead watering; use drip irrigation to keep leaves dry.",
        "Space strawberry plants adequately (12-18 inches apart) for good air circulation."
      ],
      treatment: [
        "Apply captan, thiram, or myclobutanil fungicides at 7-10 day intervals during wet spring seasons.",
        "Renovate strawberry beds after harvest by mowing and removing old foliage.",
        "Mulch beds with straw to reduce soil splash that spreads fungal spores."
      ]
    },
    {
      plantType: "Strawberry",
      name: "Powdery Mildew",
      scientificName: "Podosphaera aphanis",
      symptoms: [
        "White, powdery fungal coating appears on the underside of leaves, curling edges upward.",
        "Upper leaf surfaces develop reddish-purple blotches or discoloration.",
        "Fruit infected early becomes bronzed, deformed, seedy, and unmarketable."
      ],
      causes: "Podosphaera aphanis obligate fungus. Thrives in warm days (68-86°F) and cool nights. High humidity alone is sufficient — wet leaves not required.",
      prevention: [
        "Plant powdery mildew-resistant strawberry varieties (e.g., Chandler, Camarosa).",
        "Avoid excessive nitrogen which drives lush, susceptible new growth.",
        "Maintain airflow through proper spacing and trellising to reduce humidity."
      ],
      treatment: [
        "Apply sulfur-based fungicides, potassium bicarbonate, or neem oil at first symptom signs.",
        "Spray in the evening to avoid phytotoxicity from sulfur in full sun.",
        "Remove and bag severely infected leaves and fruit to prevent further spore spread."
      ]
    },
    {
      plantType: "Strawberry",
      name: "Healthy",
      scientificName: "Fragaria x ananassa",
      symptoms: [
        "Leaves are trifoliate, bright green, turgid, with no spots or powdery coating.",
        "Runners are vigorous and extending actively across the bed.",
        "Berries are deep red, plump, aromatic, and fully formed with no sunken spots."
      ],
      causes: "Well-drained, slightly acidic soil (pH 5.5-6.5), clean planting stock, and consistent moisture.",
      prevention: [
        "Mulch beds with straw to maintain soil moisture and prevent soil splash.",
        "Renovate beds after harvest (mow, thin, fertilize) for next season productivity.",
        "Inspect crowns monthly for crown rot and remove infected plants promptly."
      ],
      treatment: [
        "No treatment required. Continue current drip irrigation and fertilization schedule.",
        "Apply a balanced fertilizer after harvest to rebuild plant nutrients for next season."
      ]
    },
    // --- PEPPER ---
    {
      plantType: "Pepper",
      name: "Bacterial Spot",
      scientificName: "Xanthomonas euvesicatoria",
      symptoms: [
        "Water-soaked, greasy-looking circular spots (1-5mm) on leaves, stems, and fruit.",
        "Spots turn brown-black with yellow halos, giving leaves a 'shot-hole' appearance as centers drop out.",
        "Infected fruit develops raised, scabby, corky lesions that reduce marketability."
      ],
      causes: "Xanthomonas euvesicatoria bacteria. Spreads explosively via rain splash and wind during warm (75-86°F), wet weather. Enters through stomata and wounds.",
      prevention: [
        "Use certified disease-free seeds and transplants; always buy from reputable nurseries.",
        "Rotate peppers with non-solanaceous crops for 2-3 years.",
        "Avoid overhead irrigation; water at the base and early in the day."
      ],
      treatment: [
        "Apply copper-based bactericides (copper hydroxide, copper octanoate) at first symptom.",
        "Tank-mix copper with Mancozeb fungicide for improved coverage and efficacy.",
        "Remove and destroy severely infected plant parts; never compost infected tissue."
      ]
    },
    {
      plantType: "Pepper",
      name: "Healthy",
      scientificName: "Capsicum annuum",
      symptoms: [
        "Leaves are glossy, deep green, turgid, and free from spots or lesions.",
        "Stems are strong and upright, supporting a full canopy of foliage.",
        "Fruit is firm, smooth-skinned, and developing good size and color uniformly."
      ],
      causes: "Well-drained fertile soil, consistent drip irrigation, and adequate sun (6+ hours/day).",
      prevention: [
        "Stake plants when they reach 12 inches tall to prevent stem damage in wind.",
        "Apply balanced fertilizer (5-10-10) at transplanting and switch to low-nitrogen after flowering.",
        "Scout weekly for aphids, pepper weevil, and mites which transmit viral diseases."
      ],
      treatment: [
        "No treatment required. Maintain current watering and fertilization program.",
        "Pinch the first flower buds to redirect plant energy to establishing a stronger root system."
      ]
    },
    // --- CHERRY ---
    {
      plantType: "Cherry",
      name: "Powdery Mildew",
      scientificName: "Podosphaera clandestina",
      symptoms: [
        "White, powdery, flour-like fungal growth coating young leaves, shoots, and fruit surfaces.",
        "Infected leaves curl, pucker, and exhibit a reddish-purple discoloration on the upper surface.",
        "Young cherries covered in white powder fail to develop properly, resulting in misshapen, russeted fruit."
      ],
      causes: "Podosphaera clandestina obligate fungus. Overwinters in infected buds. Spore release peaks in warm, dry days (59-86°F) with high relative humidity at night.",
      prevention: [
        "Prune cherry trees annually in late winter to open the canopy and maximize airflow.",
        "Avoid excess nitrogen fertilization which stimulates lush, susceptible shoot growth.",
        "Plant resistant cherry varieties (e.g., Lapins, Sweetheart, Skeena) where disease pressure is chronic."
      ],
      treatment: [
        "Apply sulfur sprays, potassium bicarbonate, or sterol-inhibiting fungicides (myclobutanil) at budbreak.",
        "Repeat applications every 10-14 days through the growing season during high-pressure periods.",
        "Prune out and destroy powdery mildew-infected shoots immediately after detection."
      ]
    },
    {
      plantType: "Cherry",
      name: "Healthy",
      scientificName: "Prunus avium",
      symptoms: [
        "Leaves are broad, shiny dark green, with serrated margins and no powdery coating or spots.",
        "Shoots show vigorous green growth with no stunting or distortion.",
        "Cherries develop full red color, firm texture, and sweet flavor uniformly across clusters."
      ],
      causes: "Well-drained loamy soil, full sun exposure, good canopy ventilation, and preventive spring fungicide program.",
      prevention: [
        "Net trees before fruit ripening to prevent bird damage which opens wound entry points for bacteria.",
        "Remove and destroy all diseased or mummified fruit and leaves at the end of each season.",
        "Apply dormant copper sprays in late winter before buds swell to clean up overwintering pathogens."
      ],
      treatment: [
        "No treatment required. Maintain regular irrigation and balanced annual pruning.",
        "Apply organic potash fertilizer in early spring to strengthen fruit set and improve fruit quality."
      ]
    }
  ];

  db.seed('diseases', defaultDiseases);

  // 2. Seed Products
  const defaultProducts = [
    {
      name: "Premium Neem Oil Spray",
      category: "Pesticides",
      price: 14.99,
      stock: 45,
      description: "Organic cold-pressed neem oil concentrate. Excellent broad-spectrum treatment for aphids, spider mites, whiteflies, leaf spots, and rust.",
      imageUrl: "/images/neem_oil.jpg"
    },
    {
      name: "Liquid Seaweed Extract",
      category: "Fertilizers",
      price: 16.99,
      stock: 30,
      description: "Concentrated cold-processed organic kelp fertilizer. Packed with natural trace elements that promote root growth, stress tolerance, and foliage color.",
      imageUrl: "/images/seaweed.jpg"
    },
    {
      name: "NPK 19-19-19 Soluble Fertilizer",
      category: "Fertilizers",
      price: 12.49,
      stock: 50,
      description: "Highly water-soluble balanced NPK fertilizer. Ideal for young vegetable plants, tomatoes, and indoor potted plants to accelerate growth.",
      imageUrl: "/images/npk.jpg"
    },
    {
      name: "Copper Fungicide Solution",
      category: "Pesticides",
      price: 18.49,
      stock: 25,
      description: "Ready-to-use organic copper soap spray. Highly effective in treating and preventing potato late blight, tomato early blight, and apple scab.",
      imageUrl: "/images/copper_fungicide.jpg"
    },
    {
      name: "Certified Organic Compost",
      category: "Fertilizers",
      price: 9.99,
      stock: 60,
      description: "Rich, aged forest leaf and manure organic compost. Enriches soil microbiome, improves moisture retention, and acts as a slow-release natural food.",
      imageUrl: "/images/compost.jpg"
    },
    {
      name: "Insecticidal Soap Spray",
      category: "Pesticides",
      price: 10.99,
      stock: 35,
      description: "Foliage contact insect killer. Made from natural fatty acid soaps, safe to use up to the day of harvest on edible plants.",
      imageUrl: "/images/insect_soap.jpg"
    },
    {
      name: "Hybrid Cherry Tomato Seeds",
      category: "Seeds",
      price: 3.49,
      stock: 120,
      description: "Premium seeds for sweet, bite-sized cherry tomatoes. High germination rate, disease resistant, and yields heavily from summer to autumn.",
      imageUrl: "/images/tomato_seeds.jpg"
    },
    {
      name: "Heirloom Potato Seed Tubers",
      category: "Seeds",
      price: 5.99,
      stock: 80,
      description: "Certified disease-free potato seed tubers (Russet variety). Ready for hilling in soil beds or planting bags.",
      imageUrl: "/images/potato_seeds.jpg"
    },
    {
      name: "Bypass Pruning Shears",
      category: "Gardening Tools",
      price: 21.99,
      stock: 20,
      description: "Stainless steel blade bypass pruners with spring-loaded mechanism and ergonomic handles. Cuts stems up to 3/4 inch diameter cleanly.",
      imageUrl: "/images/shears.jpg"
    },
    {
      name: "3-in-1 Soil Moisture & pH Meter",
      category: "Gardening Tools",
      price: 11.99,
      stock: 40,
      description: "Probe sensor to monitor soil moisture, pH value, and sunlight exposure. No battery required. Prevent underwatering and overwatering.",
      imageUrl: "/images/moisture_meter.jpg"
    },
    {
      name: "Stainless Steel Hand Trowel",
      category: "Gardening Tools",
      price: 8.99,
      stock: 35,
      description: "Polished heavy-duty stainless steel hand shovel with scale markings. Gel padded ergonomic handle for comfortable digging.",
      imageUrl: "/images/trowel.jpg"
    },
    {
      name: "Classic 2-Gallon Watering Can",
      category: "Gardening Tools",
      price: 13.99,
      stock: 15,
      description: "High-grade weather-proof plastic watering can with dual handles for balanced carrying, and a removable brass sprinkler rosette.",
      imageUrl: "/images/watering_can.jpg"
    },
    {
      name: "Mancozeb Broad-Spectrum Fungicide",
      category: "Pesticides",
      price: 22.99,
      stock: 30,
      description: "Contact multi-site fungicide with both protective and curative action. Controls rust, early blight, late blight, downy mildew, and black rot on corn, grapes, tomatoes, and potatoes.",
      imageUrl: "/images/mancozeb.jpg"
    },
    {
      name: "Chlorothalonil Contact Fungicide",
      category: "Pesticides",
      price: 19.75,
      stock: 22,
      description: "Broad-spectrum protective fungicide. Highly effective against gray leaf spot, early blight, and leaf spots on corn, tomato, and ornamentals. No resistance risk due to multi-site action.",
      imageUrl: "/images/chlorothalonil.jpg"
    },
    {
      name: "Trichoderma Bio-Fungicide",
      category: "Pesticides",
      price: 24.99,
      stock: 18,
      description: "Soil-drench biological fungicide using beneficial Trichoderma harzianum fungi. Suppresses Pythium, Fusarium, and Rhizoctonia root rots. Safe for organic farming and compatible with most beneficial insects.",
      imageUrl: "/images/trichoderma.jpg"
    },
    {
      name: "Pyrethrin Organic Insecticide",
      category: "Pesticides",
      price: 16.49,
      stock: 40,
      description: "Fast-acting plant-derived pyrethrin spray. Controls aphids, whiteflies, leafhoppers, thrips, and beetles on vegetables and ornamentals. Breaks down rapidly in sunlight — safe for pollinators when applied at dusk.",
      imageUrl: "/images/pyrethrin.jpg"
    },
    {
      name: "Bacillus thuringiensis (Bt) Spray",
      category: "Pesticides",
      price: 17.99,
      stock: 28,
      description: "OMRI-listed biological insecticide targeting caterpillars, armyworms, corn borers, and tomato hornworms. Ingested by larvae, causing gut paralysis. Safe for birds, bees, fish, and mammals.",
      imageUrl: "/images/bt_spray.jpg"
    },
    {
      name: "Sulfur Dust Fungicide",
      category: "Pesticides",
      price: 11.49,
      stock: 50,
      description: "Fine-grade elemental sulfur dust for powdery mildew, rust, and leaf scorch control on strawberries, cherries, grapes, and ornamentals. Approved for certified organic operations.",
      imageUrl: "/images/sulfur_dust.jpg"
    },
    {
      name: "Diatomaceous Earth Insect Killer",
      category: "Pesticides",
      price: 13.25,
      stock: 45,
      description: "Food-grade diatomaceous earth powder. Kills slugs, snails, earwigs, ants, and crawling soil insects by abrading their exoskeletons. Safe around children and pets when dry. Reapply after heavy rain.",
      imageUrl: "/images/diatomaceous_earth.jpg"
    },
    {
      name: "Spinosad Biological Insecticide",
      category: "Pesticides",
      price: 26.49,
      stock: 20,
      description: "Fermentation-derived biological insecticide from Saccharopolyspora spinosa bacteria. Rapidly controls leaf miners, thrips, fire ants, and caterpillars. OMRI-listed for organic use with very low mammalian toxicity.",
      imageUrl: "/images/spinosad.jpg"
    },
    {
      name: "Azoxystrobin Systemic Fungicide",
      category: "Pesticides",
      price: 28.99,
      stock: 24,
      description: "Broad-spectrum strobilurin (QoI) systemic fungicide providing both protective and curative action. Controls gray leaf spot, northern leaf blight, powdery mildew, and rust on corn, grapes, and vegetables. Absorbed and translocated throughout the plant.",
      imageUrl: "/images/azoxystrobin.jpg"
    },
    {
      name: "Propiconazole Triazole Fungicide",
      category: "Pesticides",
      price: 23.75,
      stock: 18,
      description: "Systemic triazole (DMI) fungicide with curative and protective activity. Highly effective against common rust, gray leaf spot, brown spot (rice), and leaf scorch on cereals, corn, and ornamentals. Excellent rainfast performance within 1 hour of application.",
      imageUrl: "/images/propiconazole.jpg"
    },
    {
      name: "Tricyclazole Rice Blast Fungicide",
      category: "Pesticides",
      price: 31.49,
      stock: 15,
      description: "Specialised systemic fungicide for controlling rice leaf blast and neck blast caused by Magnaporthe oryzae. Interferes with melanin biosynthesis in the fungal cell wall. Apply at early blast lesion stage and again at boot/heading stage for maximum protection.",
      imageUrl: "/images/tricyclazole.jpg"
    },
    {
      name: "Potassium Bicarbonate Fungicide",
      category: "Pesticides",
      price: 15.99,
      stock: 38,
      description: "OMRI-listed contact fungicide for powdery mildew, botrytis, and leaf scorch on strawberries, grapes, cherries, and cucurbits. Disrupts fungal cell membranes. Safe for use up to day of harvest. Compatible with most beneficial insects and bee activity.",
      imageUrl: "/images/potassium_bicarbonate.jpg"
    },
    {
      name: "Myclobutanil Systemic Fungicide",
      category: "Pesticides",
      price: 19.99,
      stock: 22,
      description: "Systemic sterol-inhibiting (DMI) fungicide for controlling powdery mildew on cherries, strawberries, and apple scab. Excellent upward and downward translocation stops disease progression within infected tissue. Provides up to 21-day protection interval.",
      imageUrl: "/images/myclobutanil.jpg"
    },
    {
      name: "Imidacloprid Soil Drench",
      category: "Pesticides",
      price: 24.49,
      stock: 28,
      description: "Systemic neonicotinoid insecticide absorbed through roots for long-lasting protection against aphids, whiteflies, thrips, and leafhoppers. Apply as a soil drench at transplanting. Not for use during bloom period to protect pollinators.",
      imageUrl: "/images/imidacloprid.jpg"
    },
    {
      name: "Kaolin Clay Particle Film",
      category: "Pesticides",
      price: 18.75,
      stock: 32,
      description: "Natural mineral-based particle film spray that physically deters insects and reduces fruit sunburn. Repels apple maggot fly, pear psylla, leafhoppers, and thrips. OMRI-listed and safe for organic operations. Apply to create a white reflective barrier on foliage and fruit.",
      imageUrl: "/images/kaolin_clay.jpg"
    },
    {
      name: "Abamectin Acaricide & Insecticide",
      category: "Pesticides",
      price: 29.99,
      stock: 16,
      description: "Natural fermentation product from Streptomyces avermitilis. Highly effective against spider mites, russet mites, leafminers, and psyllids. Acts on the nervous system causing paralysis. Translaminar activity reaches pests feeding inside leaf tissue.",
      imageUrl: "/images/abamectin.jpg"
    }
  ];

  db.seed('products', defaultProducts);
  console.log('Database seed check completed.');
}

// Start backend
app.listen(PORT, () => {
  console.log(`Server running at http://localhost:${PORT}`);
  seedDatabase();
});
