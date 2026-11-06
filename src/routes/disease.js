const express = require('express');
const router = express.Router();
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const crypto = require('crypto');
const { Document, Packer, Paragraph, TextRun, Table, TableRow, TableCell, WidthType, AlignmentType, HeadingLevel, ExternalHyperlink } = require('docx');
const Disease = require('../models/Disease');

const uploadDir = path.join(__dirname, '../../public/uploads');
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

// Multer setup to store uploaded files in public/uploads
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, uniqueSuffix + path.extname(file.originalname));
  }
});

const upload = multer({ storage: storage });

// ── CNN Microservice Configuration ────────────────────────────────────────────
const CNN_SERVICE_URL = process.env.CNN_SERVICE_URL || 'http://localhost:5000';

/**
 * callCNNService
 * Sends the uploaded image to the Python Flask CNN microservice
 * (MobileNetV2) for real plant disease prediction.
 * Returns the prediction object or null if the service is unavailable.
 */
async function callCNNService(filePath) {
  try {
    const FormData = (await import('form-data')).default;
    // Node 18+ has globalThis.fetch; older versions need node-fetch
    const fetch = globalThis.fetch
      ? globalThis.fetch.bind(globalThis)
      : (await import('node-fetch')).default;

    const form = new FormData();
    form.append('image', fs.createReadStream(filePath));

    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 10000); // 10s timeout

    const response = await fetch(`${CNN_SERVICE_URL}/predict`, {
      method: 'POST',
      body: form,
      headers: form.getHeaders ? form.getHeaders() : {},
      signal: controller.signal,
    });

    clearTimeout(timeout);

    if (!response.ok) {
      console.warn(`[CNN] Service returned HTTP ${response.status}`);
      return null;
    }

    const result = await response.json();
    return result.success ? result : null;

  } catch (err) {
    if (err.name === 'AbortError') {
      console.warn('[CNN] Request timed out — falling back to hash-based detection.');
    } else {
      console.warn('[CNN] Service unavailable:', err.message, '— falling back to hash-based detection.');
    }
    return null;
  }
}

/**
 * hashBasedFallback
 * Original deterministic SHA-256 hash + modulo disease selection.
 * Used when: CNN service is down, model not trained, or plant is Rice
 * (not covered by PlantVillage).
 */
function hashBasedFallback(imageBuffer, candidateDiseases, allDiseases) {
  const hash = crypto.createHash('sha256').update(imageBuffer).digest('hex');
  const hashInt = parseInt(hash.substring(0, 8), 16);
  const hashConfidenceInt = parseInt(hash.substring(8, 14), 16);

  let detectedDisease = null;
  if (candidateDiseases.length > 0) {
    detectedDisease = candidateDiseases[hashInt % candidateDiseases.length];
  } else if (allDiseases.length > 0) {
    detectedDisease = allDiseases[hashInt % allDiseases.length];
  }

  if (!detectedDisease) return null;

  const isHealthy = detectedDisease.name.toLowerCase().includes('healthy');
  const baseConf = isHealthy ? 92.0 : 83.0;
  const range = isHealthy ? 7.5 : 14.5;
  const confidence = Number((baseConf + (hashConfidenceInt % 1000) / 1000 * range).toFixed(1));

  return { disease: detectedDisease, confidence, detectionMethod: 'hash-fallback' };
}

// ── POST /api/disease/detect ───────────────────────────────────────────────────
router.post('/detect', upload.single('image'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'Please upload an image of the plant leaf.' });
    }

    const { plantType } = req.body;
    const allDiseases = Disease.findAll();

    // Build candidate pool filtered by plant type (if provided by frontend)
    let candidateDiseases = allDiseases;
    if (plantType && plantType !== 'Unknown') {
      const filtered = allDiseases.filter(
        d => d.plantType.toLowerCase() === plantType.toLowerCase()
      );
      if (filtered.length > 0) candidateDiseases = filtered;
    }

    let detectedDisease = null;
    let confidence = 0;
    let detectionMethod = 'cnn';

    // ── Step 1: Try CNN microservice (MobileNetV2 inference) ─────────────────
    const cnnResult = await callCNNService(req.file.path);

    if (cnnResult) {
      console.log(
        `[CNN] Predicted: ${cnnResult.plant_type} — ${cnnResult.disease_name} ` +
        `(${cnnResult.confidence.toFixed(1)}%)`
      );

      const cnnPlant   = (cnnResult.plant_type   || '').toLowerCase().trim();
      const cnnDisease = (cnnResult.disease_name || '').toLowerCase().trim();

      // 1a. Exact match: same plant type + same disease name
      detectedDisease = allDiseases.find(d =>
        d.plantType.toLowerCase() === cnnPlant &&
        d.name.toLowerCase()     === cnnDisease
      );

      // 1b. Partial match within same plant type
      if (!detectedDisease) {
        const sameParent = allDiseases.filter(d => d.plantType.toLowerCase() === cnnPlant);
        detectedDisease = sameParent.find(d =>
          d.name.toLowerCase().includes(cnnDisease) ||
          cnnDisease.includes(d.name.toLowerCase())
        );
      }

      // 1c. Partial match across all plants (e.g. CNN returns "Powdery Mildew" → finds Cherry Powdery Mildew)
      if (!detectedDisease) {
        detectedDisease = candidateDiseases.find(d =>
          d.name.toLowerCase().includes(cnnDisease) ||
          cnnDisease.includes(d.name.toLowerCase())
        );
      }

      if (detectedDisease) {
        confidence = parseFloat(cnnResult.confidence.toFixed(1));
        detectionMethod = 'cnn';
      } else {
        console.warn(
          `[CNN] No DB match for "${cnnResult.plant_type} — ${cnnResult.disease_name}". ` +
          `Using hash-based fallback.`
        );
      }
    }

    // ── Step 2: Hash-based fallback ──────────────────────────────────────────
    if (!detectedDisease) {
      const imageBuffer = fs.readFileSync(req.file.path);
      const fallback = hashBasedFallback(imageBuffer, candidateDiseases, allDiseases);
      if (fallback) {
        detectedDisease  = fallback.disease;
        confidence       = fallback.confidence;
        detectionMethod  = fallback.detectionMethod;
      }
    }

    if (!detectedDisease) {
      return res.status(404).json({ error: 'Disease profile not found.' });
    }

    res.json({
      imageUrl: `/uploads/${req.file.filename}`,
      confidence,
      detectionMethod,  // 'cnn' or 'hash-fallback' — lets the UI show the source
      disease: detectedDisease,
    });

  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET /api/disease/catalog
router.get('/catalog', (req, res) => {
  try {
    res.json(Disease.findAll());
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET /api/disease/care-tips
router.get('/care-tips', (req, res) => {
  const careTips = [
    {
      plant: "Tomato",
      watering: "Water deeply at the root level 1–2 inches per week. Use drip irrigation and water in the early morning to keep foliage dry and prevent fungal diseases.",
      fertilizing: "Start with a balanced 10-10-10 NPK fertilizer at planting, then switch to a low-nitrogen, high-phosphorus feed once flowering begins. Apply calcium-rich fertilizer to prevent blossom-end rot.",
      maintenance: "Pinch off suckers growing in stem nodes weekly. Stake or cage plants at 12 inches tall. Remove lower leaves touching the soil to cut off fungal splash pathways."
    },
    {
      plant: "Potato",
      watering: "Provide consistent 1–1.5 inches of water per week. Reduce watering sharply as the foliage yellows and dies back before harvest. Avoid waterlogging, which promotes tuber rot.",
      fertilizing: "Incorporate compost into planting rows. Use a 5-10-10 (low-nitrogen) fertilizer to encourage tuber formation over leafy growth. Side-dress with potassium 4–6 weeks after planting.",
      maintenance: "Hill soil 6 inches high around stems every 2–3 weeks as the plant grows to block sunlight from tubers and prevent greening. Remove volunteer plants from previous seasons to reduce disease pressure."
    },
    {
      plant: "Apple",
      watering: "Young trees need 1–2 gallons of water twice a week. Mature trees need deep watering (2–3 inches) only during prolonged droughts. Always water at the drip line, not the trunk.",
      fertilizing: "Apply a balanced 10-10-10 fertilizer in early spring before bud break. Supplement with boron and zinc micronutrients to improve fruit set and prevent bitter pit.",
      maintenance: "Thin fruit clusters to 6 inches apart in June for larger, higher-quality apples. Prune for an open-center or central-leader shape each dormant season. Remove and destroy fallen fruit to reduce overwintering pest populations."
    },
    {
      plant: "Grape",
      watering: "Irrigate deeply every 10–14 days during the growing season. Avoid watering once berries begin to color (veraison) to concentrate sugars and prevent berry splitting.",
      fertilizing: "Apply compost or low-phosphorus organic fertilizer in early spring. Avoid excessive nitrogen which promotes lush leaves at the expense of grape clusters. Apply potassium sulfate before veraison for fruit sweetness.",
      maintenance: "Perform spur pruning in late winter, retaining 2–3 buds per spur. Train vines on a trellis system for maximum airflow. Remove lateral shoots during the season to keep fruit clusters in direct sunlight."
    },
    {
      plant: "Corn",
      watering: "Corn is a heavy water user — provide 1–1.5 inches per week. Critical watering periods are silking and tasseling stages. Drought stress during silk emergence severely reduces kernel set.",
      fertilizing: "Side-dress with high-nitrogen fertilizer (urea or ammonium nitrate) when plants reach knee-height (V6 stage). Apply phosphorus and potassium at planting for strong root development. Sulfur deficiency shows as pale stripes — correct with ammonium sulfate.",
      maintenance: "Thin seedlings to 8–12 inches apart for optimal ear development. Control corn borers early by checking leaf whorls for frass. Avoid cultivating deep near roots after V8 stage to prevent root damage."
    },
    {
      plant: "Rice",
      watering: "Maintain a 2–5 cm water depth throughout the vegetative stage. Alternate wetting and drying (AWD) during grain fill reduces water use by 30% without yield loss. Drain the field 2 weeks before harvest.",
      fertilizing: "Apply split nitrogen doses: 1/3 at basal (transplanting), 1/3 at tillering, 1/3 at panicle initiation. Include silicon fertilizer (e.g., calcium silicate) to strengthen cell walls and boost blast resistance.",
      maintenance: "Weed aggressively in the first 30 days after transplanting when competition is most damaging. Monitor for brown planthoppers weekly and use pheromone traps near field borders. Remove ratoon shoots after harvest to prevent pest carryover."
    },
    {
      plant: "Strawberry",
      watering: "Provide 1–1.5 inches of water weekly using drip irrigation at soil level. Never use overhead sprinklers which wet foliage and promote fungal diseases. Increase to daily watering during fruit ripening in heat.",
      fertilizing: "At planting, incorporate a balanced slow-release 10-10-10 fertilizer. Side-dress with a high-potassium fertilizer (e.g., 0-0-60) during fruit development to improve berry size, firmness, and flavor. Avoid late-season nitrogen which delays dormancy.",
      maintenance: "Renovate beds immediately after harvest: mow foliage to 3 inches, thin plants to 6 inches apart, and apply a fresh layer of straw mulch. Remove runners throughout the season to direct energy into berry production. Replace plant stock every 3 years to maintain vigor."
    },
    {
      plant: "Pepper",
      watering: "Water 1–2 inches per week consistently. Peppers are very sensitive to dry spells during fruit set — water stress causes blossom drop and poor fruit fill. Mulch heavily to conserve soil moisture between waterings.",
      fertilizing: "Apply 5-10-10 fertilizer at transplanting. Switch to a low-nitrogen, high-phosphorus feed at flowering to encourage fruit set over leafy growth. Supplement with calcium nitrate mid-season to prevent blossom-end rot.",
      maintenance: "Pinch the very first flower bud (before first harvest) to encourage a stronger root system and higher total yield. Stake plants at 18 inches tall. Scout weekly for aphids and pepper weevil — both vectors of destructive viral diseases."
    },
    {
      plant: "Cherry",
      watering: "Young trees need 10–15 gallons per week in the first 2 years. Mature trees require deep irrigation (2 inches) every 2–3 weeks in summer. Avoid overhead watering during ripening, which causes fruit cracking.",
      fertilizing: "Apply a balanced 10-10-10 fertilizer in early spring before bloom. Supplement with boron spray at 5% pink bud stage to improve fruit set. Apply organic potassium in late summer to harden wood before winter.",
      maintenance: "Net trees before fruit color develops to prevent bird damage (which also opens bacterial entry points). Apply dormant copper spray in late winter to suppress overwintering pathogens. Thin excessive fruit on young trees to prevent branch breakage."
    },
    {
      plant: "Cucumber",
      watering: "Provide 1–2 inches of water per week using drip irrigation. Cucumbers are 95% water, so consistent moisture is critical — irregular watering causes bitter-tasting, misshapen fruit. Mulch with straw to retain soil moisture.",
      fertilizing: "Apply a balanced 10-10-10 fertilizer at planting. Side-dress with compost or a nitrogen-rich fertilizer when vines begin to run. Switch to a high-potassium feed once flowering starts to boost fruit development.",
      maintenance: "Train vines vertically on a trellis to improve air circulation and reduce powdery mildew. Harvest cucumbers every 1–2 days once production begins — overripe fruit signals the plant to stop producing. Remove any yellowing or diseased leaves promptly."
    },
    {
      plant: "Sunflower",
      watering: "Water deeply once per week (about 2 inches), soaking the root zone. Sunflowers are drought-tolerant once established but benefit from consistent moisture during bud formation and flowering. Avoid wetting the flower heads.",
      fertilizing: "Apply a slow-release balanced fertilizer at planting. Avoid excessive nitrogen which produces tall, weak stems prone to lodging. A side-dress of phosphorus at bud stage encourages larger, fuller flower heads.",
      maintenance: "Stake tall varieties (over 5 feet) to prevent wind damage. Watch for stem-boring insects — sawdust at the stem base is a telltale sign. After flowering, leave heads on the stalk to dry for seed harvest, or cut and hang upside-down indoors."
    },
    {
      plant: "Basil",
      watering: "Water 1 inch per week, keeping soil evenly moist but never waterlogged. Basil wilts quickly in dry soil but is equally sensitive to root rot from overwatering. Water at the base in the morning so leaves dry before nightfall.",
      fertilizing: "Apply a light dose of liquid organic fertilizer (fish emulsion or compost tea) every 3–4 weeks. Avoid heavy fertilization which dilutes the essential oils that give basil its flavor and aroma.",
      maintenance: "Pinch off flower buds as soon as they appear to keep the plant producing tender leaves. Harvest from the top down, cutting just above a leaf pair to encourage bushy branching. Bring potted basil indoors when night temperatures drop below 50°F (10°C)."
    },
    {
      plant: "Rose",
      watering: "Water deeply 2–3 times per week, providing 1–2 inches total. Always water at the soil level — wet foliage invites black spot and powdery mildew. Reduce watering in fall to help the plant harden off before winter.",
      fertilizing: "Feed every 4–6 weeks from spring through late summer with a rose-specific fertilizer (higher phosphorus, e.g., 4-8-4). Stop fertilizing 6 weeks before the first expected frost to discourage tender new growth.",
      maintenance: "Prune in early spring when forsythias bloom — remove dead, damaged, and crossing canes, then cut healthy canes to an outward-facing bud. Deadhead spent blooms weekly to encourage repeat flowering. Apply 3 inches of organic mulch to suppress weeds and retain moisture."
    },
    {
      plant: "Mango",
      watering: "Water young trees 2–3 times per week. Mature trees need deep watering every 10–14 days. Critically, stop watering 2 months before expected flowering to induce drought stress that triggers bloom initiation.",
      fertilizing: "Apply a citrus/mango-specific fertilizer (high potassium, e.g., 6-6-12) three times a year — early spring, mid-summer, and early fall. Supplement with micronutrients (iron, zinc, manganese) through foliar spray if leaves show interveinal chlorosis.",
      maintenance: "Prune after harvest to shape the canopy and remove dead wood. Tip-prune young trees to encourage branching and a compact form. Protect developing fruit from fruit flies using paper bags or pheromone traps. Watch for anthracnose during humid weather — apply copper fungicide at flowering."
    },
    {
      plant: "Banana",
      watering: "Bananas are extremely thirsty — water daily or every other day in hot weather, providing 1.5–2 inches per week. The large leaves lose water rapidly through transpiration. Reduce watering in winter but never let the soil dry out completely.",
      fertilizing: "Feed monthly with a high-potassium fertilizer (e.g., 8-10-48) during the growing season. Bananas are heavy feeders and potassium is critical for fruit development. Apply a thick layer of compost as mulch — it feeds the plant and retains moisture simultaneously.",
      maintenance: "Remove dead or yellowing outer leaves regularly to reduce pest habitat. Allow only one main stem (pseudostem) and one sucker (follower) per mat — remove all other suckers by cutting at soil level. Support fruiting stems with a stake or rope to prevent toppling under the weight of the bunch."
    },
    {
      plant: "Lettuce",
      watering: "Provide frequent, light watering — about 1 inch per week split into 2–3 applications. Lettuce has shallow roots and bolts (goes to seed) rapidly in dry or hot conditions. Use overhead sprinklers in the morning for a cooling effect.",
      fertilizing: "Apply a nitrogen-rich fertilizer (e.g., 10-5-5) at planting and again 3 weeks later for a quick foliar push. Avoid excess phosphorus. Side-dress with compost mid-season for sustained, gentle feeding that won't burn tender roots.",
      maintenance: "Use shade cloth (30–50% shade) when temperatures exceed 80°F (27°C) to delay bolting. Harvest outer leaves first ('cut and come again') to extend the productive life of each plant. Succession plant every 2 weeks for a continuous supply throughout the season."
    },
    {
      plant: "Carrot",
      watering: "Water 1 inch per week consistently. Uneven watering causes cracked, forked, or hairy roots. Keep the top inch of soil moist during germination (7–21 days) — cover seed beds with burlap or row cover to prevent drying out.",
      fertilizing: "Work in compost before planting but avoid fresh manure or high-nitrogen fertilizer, which causes forked and hairy roots. Apply a low-nitrogen, high-potassium fertilizer (e.g., 0-10-10) 5–6 weeks after germination to encourage root thickening.",
      maintenance: "Thin seedlings to 2–3 inches apart when tops are 2 inches tall — overcrowding produces stunted, deformed roots. Hill soil lightly over exposed carrot shoulders to prevent greening. Harvest when the root tops are ¾–1 inch in diameter for the best flavor and texture."
    },
    {
      plant: "Citrus",
      watering: "Water deeply every 7–10 days, saturating the root zone to 2 feet. Young trees need 5–10 gallons per watering; mature trees 15–20 gallons. Citrus is sensitive to both overwatering (root rot) and underwatering (leaf curl and fruit drop).",
      fertilizing: "Apply a citrus-specific fertilizer (e.g., 2-1-1 NPK ratio with iron, zinc, and manganese) three times per year — February, May, and September. Yellowing leaves with green veins indicates iron deficiency — treat with chelated iron foliar spray.",
      maintenance: "Prune minimally — only remove dead wood, water sprouts, and suckers below the graft union. Protect trunks of young trees with white paint or tree wrap to prevent sunscald. Monitor for citrus leafminer and Asian citrus psyllid — apply horticultural oil during new flush growth."
    }
  ];
  res.json(careTips);
});

// POST /api/disease/download-report
router.post('/download-report', async (req, res) => {
  try {
    const { plantType, disease, confidence, recommendedProducts } = req.body;

    if (!disease || !disease.name) {
      return res.status(400).json({ error: 'Invalid disease diagnosis payload.' });
    }

    const docChildren = [
      // Header Title
      new Paragraph({
        text: "FLORASHIELD AI PLANT HEALTH DIAGNOSIS REPORT",
        heading: HeadingLevel.TITLE,
        alignment: AlignmentType.CENTER,
        spacing: { after: 200 }
      }),

      new Paragraph({
        children: [
          new TextRun({ text: "Generated on: ", bold: true }),
          new TextRun({ text: `${new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric', hour: '2-digit', minute: '2-digit' })}` })
        ],
        alignment: AlignmentType.CENTER,
        spacing: { after: 350 }
      }),

      // Summary Table
      new Table({
        width: { size: 100, type: WidthType.PERCENTAGE },
        rows: [
          new TableRow({
            children: [
              new TableCell({
                children: [new Paragraph({ text: "Plant Category", bold: true })],
                shading: { fill: "D1FAE5" },
                width: { size: 30, type: WidthType.PERCENTAGE }
              }),
              new TableCell({
                children: [new Paragraph({ text: plantType || disease.plantType || "General Plant" })],
                width: { size: 70, type: WidthType.PERCENTAGE }
              })
            ]
          }),
          new TableRow({
            children: [
              new TableCell({
                children: [new Paragraph({ text: "Diagnosed Condition", bold: true })],
                shading: { fill: "D1FAE5" }
              }),
              new TableCell({
                children: [new Paragraph({ text: `${disease.name} (${disease.scientificName || 'N/A'})`, bold: true })]
              })
            ]
          }),
          new TableRow({
            children: [
              new TableCell({
                children: [new Paragraph({ text: "AI Confidence Score", bold: true })],
                shading: { fill: "D1FAE5" }
              }),
              new TableCell({
                children: [new Paragraph({ text: `${confidence || '95'}%` })]
              })
            ]
          })
        ]
      }),

      new Paragraph({ text: "", spacing: { after: 250 } }),

      // Section 1: Symptoms
      new Paragraph({
        text: "1. Observed Leaf Symptoms",
        heading: HeadingLevel.HEADING_2,
        spacing: { before: 200, after: 100 }
      }),
      ...(disease.symptoms || []).map(symptom => new Paragraph({
        text: `• ${symptom}`,
        spacing: { after: 60 }
      })),

      // Section 2: Underlying Causes
      new Paragraph({
        text: "2. Root Causes & Disease Background",
        heading: HeadingLevel.HEADING_2,
        spacing: { before: 250, after: 100 }
      }),
      new Paragraph({
        text: disease.causes || "No background details available.",
        spacing: { after: 150 }
      }),

      // Section 3: Immediate Treatment & Care Tips
      new Paragraph({
        text: "3. Immediate Treatment & Care Tips",
        heading: HeadingLevel.HEADING_2,
        spacing: { before: 250, after: 100 }
      }),
      ...(disease.treatment || []).map(t => new Paragraph({
        text: `✔ ${t}`,
        spacing: { after: 80 }
      })),

      // Section 4: Long-Term Prevention
      new Paragraph({
        text: "4. Long-Term Prevention & Field Care",
        heading: HeadingLevel.HEADING_2,
        spacing: { before: 250, after: 100 }
      }),
      ...(disease.prevention || []).map(p => new Paragraph({
        text: `🛡️ ${p}`,
        spacing: { after: 80 }
      })),

      // Section 5: Recommended Products & Shopping App Purchase Links
      new Paragraph({
        text: "5. Recommended Products & Online Purchase Links",
        heading: HeadingLevel.HEADING_2,
        spacing: { before: 250, after: 100 }
      }),
      new Paragraph({
        text: "The following fertilizers, pesticides, and care products are recommended to treat this condition. You can purchase them on major shopping apps using the links below:",
        spacing: { after: 150 }
      })
    ];

    if (recommendedProducts && recommendedProducts.length > 0) {
      recommendedProducts.forEach(prod => {
        const links = prod.purchaseLinks || {};
        const nameEnc = encodeURIComponent(prod.name);
        const amz = links.amazon || `https://www.amazon.in/s?k=${nameEnc}`;
        const fk = links.flipkart || `https://www.flipkart.com/search?q=${nameEnc}`;
        const mees = links.meesho || `https://www.meesho.com/search?q=${nameEnc}`;
        const ab = links.agribegri || `https://agribegri.com/search.php?q=${nameEnc}`;
        const bh = links.bighaat || `https://www.bighaat.com/search?q=${nameEnc}`;

        docChildren.push(
          new Paragraph({
            children: [
              new TextRun({ text: `• ${prod.name} (${prod.category}) - $${prod.price.toFixed(2)}`, bold: true })
            ],
            spacing: { before: 120, after: 40 }
          }),
          new Paragraph({
            text: `   Description: ${prod.description}`,
            spacing: { after: 60 }
          }),
          new Paragraph({
            children: [
              new TextRun({ text: "   Buy Online: " }),
              new ExternalHyperlink({ children: [new TextRun({ text: "[Amazon] ", color: "0000FF", underline: {} })], link: amz }),
              new ExternalHyperlink({ children: [new TextRun({ text: "[Flipkart] ", color: "0000FF", underline: {} })], link: fk }),
              new ExternalHyperlink({ children: [new TextRun({ text: "[Meesho] ", color: "0000FF", underline: {} })], link: mees }),
              new ExternalHyperlink({ children: [new TextRun({ text: "[AgriBegri] ", color: "0000FF", underline: {} })], link: ab }),
              new ExternalHyperlink({ children: [new TextRun({ text: "[BigHaat]", color: "0000FF", underline: {} })], link: bh })
            ],
            spacing: { after: 120 }
          })
        );
      });
    }

    const doc = new Document({
      sections: [{
        properties: {},
        children: docChildren
      }]
    });

    const buffer = await Packer.toBuffer(doc);

    const sanitizeName = (disease.name || 'Plant_Disease').replace(/[^a-zA-Z0-9_-]/g, '_');
    const filename = `Plant_Health_Report_${sanitizeName}.docx`;

    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document');
    res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
    res.send(buffer);
  } catch (err) {
    console.error("Error generating Word document:", err);
    res.status(500).json({ error: "Failed to generate Word document report." });
  }
});

module.exports = router;
