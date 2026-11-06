/**
 * FloraBot - Chatbot Processing Engine
 * ====================================
 * Intent classification, keyword matching, database querying,
 * product recommendations, and multilingual response generation.
 */

const translations = require('./translations');
const Disease = require('../models/Disease');
const Product = require('../models/Product');
const db = require('../models/db');

// Map of common plant names recognized by the bot
const PLANT_NAMES = [
  'tomato', 'potato', 'apple', 'grape', 'corn', 'rice', 
  'strawberry', 'pepper', 'cherry', 'cucumber', 'sunflower', 
  'basil', 'rose', 'mango', 'banana', 'lettuce', 'carrot', 'citrus'
];

/**
 * Main chat handler function
 */
function processUserMessage({ message, lang = 'en', userId = null, chatHistory = [] }) {
  const language = translations[lang] ? lang : 'en';
  const t = translations[language];
  const msgLower = (message || '').toLowerCase().trim();

  if (!msgLower) {
    return {
      text: t.greeting,
      language,
      suggestions: t.suggestions,
      products: []
    };
  }

  // 1. Greetings / Help / About
  if (isGreeting(msgLower)) {
    return {
      text: t.greeting,
      language,
      suggestions: t.suggestions,
      products: []
    };
  }

  if (msgLower.includes('help') || msgLower.includes('मदद') || msgLower.includes('ಸಹಾಯ') || msgLower.includes('సహాయం') || msgLower.includes('உதவி')) {
    return {
      text: t.help,
      language,
      suggestions: t.suggestions,
      products: []
    };
  }

  if (msgLower.includes('who are you') || msgLower.includes('about') || msgLower.includes('कौन हो') || msgLower.includes('ಯಾರು')) {
    return {
      text: t.about,
      language,
      suggestions: t.suggestions,
      products: []
    };
  }

  // 2. Image upload prompt request
  if (msgLower.includes('upload') || msgLower.includes('image') || msgLower.includes('photo') || msgLower.includes('leaf') || msgLower.includes('पत्ती') || msgLower.includes('ಎಲೆ') || msgLower.includes('ఫోటో') || msgLower.includes('படம்')) {
    if (msgLower.includes('how to') || msgLower.includes('where') || msgLower.includes('detect') || msgLower.includes('upload')) {
      return {
        text: `${t.ui.uploadPrompt}\n\n📸 *Click the paperclip/camera button in the chat box below to upload your leaf image.*`,
        language,
        suggestions: t.suggestions,
        products: []
      };
    }
  }

  // 3. Extract target plant if mentioned
  const detectedPlant = PLANT_NAMES.find(p => msgLower.includes(p));

  // 4. Disease / Symptom queries
  const diseaseMatch = matchDisease(msgLower, detectedPlant);
  if (diseaseMatch) {
    const recommendedProducts = getProductsForDisease(diseaseMatch);
    const responseText = formatDiseaseResponse(diseaseMatch, t);
    
    return {
      text: responseText,
      language,
      disease: diseaseMatch,
      products: recommendedProducts,
      suggestions: [
        `Fertilizer for ${diseaseMatch.plantType}`,
        `Buy ${recommendedProducts[0]?.name || 'Pesticides'}`,
        `How to prevent ${diseaseMatch.name}?`
      ]
    };
  }

  // 5. Fertilizer Intent
  if (isFertilizerQuery(msgLower)) {
    const fertilizerProducts = Product.findByCategory ? Product.findByCategory('Fertilizers') : db.find('products', { category: 'Fertilizers' });
    const plantName = detectedPlant ? capitalize(detectedPlant) : 'General Crops';
    
    let text = t.fertilizerGeneral.replace(/\{plant\}/g, plantName);

    return {
      text: `${text}\n\n${t.ui.safetyReminder}`,
      language,
      products: fertilizerProducts.slice(0, 4),
      suggestions: [
        'NPK 19-19-19 Fertilizer',
        'Organic Compost',
        'Liquid Seaweed Extract'
      ]
    };
  }

  // 6. Pesticide / Pest Control Intent
  if (isPesticideQuery(msgLower)) {
    const pesticideProducts = Product.findByCategory ? Product.findByCategory('Pesticides') : db.find('products', { category: 'Pesticides' });
    
    let text = t.pesticideGeneral;

    return {
      text: `${text}\n\n${t.ui.disclaimer}`,
      language,
      products: pesticideProducts.slice(0, 4),
      suggestions: [
        'Neem Oil Spray',
        'Copper Fungicide',
        'Insecticidal Soap Spray'
      ]
    };
  }

  // 7. Gardening Tools Intent
  if (isToolQuery(msgLower)) {
    const toolProducts = db.find('products', { category: 'Gardening Tools' });

    return {
      text: t.toolGeneral,
      language,
      products: toolProducts.slice(0, 4),
      suggestions: [
        'Bypass Pruning Shears',
        '3-in-1 Soil Moisture Meter',
        'Stainless Steel Trowel'
      ]
    };
  }

  // 8. Seeds Intent
  if (isSeedQuery(msgLower)) {
    const seedProducts = db.find('products', { category: 'Seeds' });

    return {
      text: "🌱 **Seed Recommendations & Care:**\n\n• Use certified disease-resistant seeds for best yield.\n• Store seeds in a cool, dry place before sowing.\n• Maintain optimal moisture during the germination stage.\n\nHere are popular seeds available in our shop:",
      language,
      products: seedProducts,
      suggestions: [
        'Cherry Tomato Seeds',
        'Potato Seed Tubers',
        'Planting Tips'
      ]
    };
  }

  // 9. Plant Care / General Care Tips
  if (isCareQuery(msgLower)) {
    if (detectedPlant) {
      const careTipsList = getCareTips();
      const tip = careTipsList.find(c => c.plant.toLowerCase() === detectedPlant);
      if (tip) {
        let responseText = t.careResponse
          .replace('{plant}', tip.plant)
          .replace('{watering}', tip.watering)
          .replace('{fertilizing}', tip.fertilizing)
          .replace('{maintenance}', tip.maintenance);

        const plantProducts = db.find('products').filter(p => 
          p.description.toLowerCase().includes(detectedPlant) || p.name.toLowerCase().includes(detectedPlant)
        ).slice(0, 3);

        return {
          text: responseText,
          language,
          products: plantProducts,
          suggestions: [
            `Diseases in ${tip.plant}`,
            `Fertilizer for ${tip.plant}`,
            `Watering guide for ${tip.plant}`
          ]
        };
      }
    }
  }

  // 10. General Search in Products Database
  const productMatches = db.find('products').filter(p => 
    msgLower.includes(p.name.toLowerCase()) || 
    p.description.toLowerCase().includes(msgLower) ||
    msgLower.includes(p.category.toLowerCase())
  );

  if (productMatches.length > 0) {
    return {
      text: `${t.productRecommend}\nFound ${productMatches.length} matching item(s) in our store:`,
      language,
      products: productMatches.slice(0, 4),
      suggestions: t.suggestions.slice(0, 3)
    };
  }

  // 11. Fallback Response
  return {
    text: `${t.ui.noResults}\n\n💡 **Tip:** You can ask about plant diseases (e.g. *Early Blight*), fertilizers (e.g. *NPK, Neem Oil*), tools, or upload a leaf photo for CNN diagnosis.`,
    language,
    suggestions: t.suggestions.slice(0, 4),
    products: []
  };
}

// Helper Functions
function isGreeting(msg) {
  const greetings = ['hi', 'hello', 'hey', 'namaste', 'namaskara', 'vanakkam', 'namaskaram', 'namskar', 'good morning', 'good evening'];
  return greetings.some(g => msg === g || msg.startsWith(g + ' ') || msg.endsWith(' ' + g));
}

function isFertilizerQuery(msg) {
  const terms = ['fertilizer', 'npk', 'compost', 'manure', 'seaweed', 'nutrient', 'खाद', 'उर्वरक', 'ಗೊಬ್ಬರ', 'ఎరువు', 'உரம்', 'വളം'];
  return terms.some(t => msg.includes(t));
}

function isPesticideQuery(msg) {
  const terms = ['pesticide', 'fungicide', 'insecticide', 'neem oil', 'spray', 'aphid', 'mite', 'pest', 'disease', 'कीटनाशक', 'ಕೀಟನಾಶಕ', 'పురుగుమందు', 'பூச்சிக்கொல்லி'];
  return terms.some(t => msg.includes(t));
}

function isToolQuery(msg) {
  const terms = ['tool', 'shear', 'pruner', 'trowel', 'meter', 'water can', 'hoe', 'equipment', 'उपकरण', 'ಉಪಕರಣ', 'పరికరాలు', 'கருவிகள்'];
  return terms.some(t => msg.includes(t));
}

function isSeedQuery(msg) {
  const terms = ['seed', 'tuber', 'variety', 'बीज', 'બીજ', 'ಬೀಜ', 'విత్తనాలు', 'விதை', 'വിത്ത്'];
  return terms.some(t => msg.includes(t));
}

function isCareQuery(msg) {
  const terms = ['care', 'water', 'sunlight', 'prune', 'soil', 'how to grow', 'देखभाल', 'ಆರೈಕೆ', 'సంరక్షణ', 'பராமரிப்பு', 'പരിപാലനം'];
  return terms.some(t => msg.includes(t));
}

function matchDisease(msg, detectedPlant) {
  const allDiseases = Disease.findAll ? Disease.findAll() : db.find('diseases');
  
  // Direct match by disease name
  let matched = allDiseases.find(d => 
    msg.includes(d.name.toLowerCase()) || 
    d.name.toLowerCase().includes(msg)
  );

  if (matched) return matched;

  // Symptom keyword match
  const symptomKeywords = ['spot', 'blight', 'rot', 'rust', 'mildew', 'scorch', 'yellow', 'wilt', 'mold', 'mosaic', 'curl', 'pustule'];
  const hasSymptomWord = symptomKeywords.some(kw => msg.includes(kw));

  if (hasSymptomWord) {
    if (detectedPlant) {
      const plantDiseases = allDiseases.filter(d => d.plantType.toLowerCase() === detectedPlant.toLowerCase());
      if (plantDiseases.length > 0) {
        return plantDiseases[0]; // Best candidate
      }
    } else {
      // Return first matching disease by symptom word
      return allDiseases.find(d => 
        symptomKeywords.some(kw => d.name.toLowerCase().includes(kw) && msg.includes(kw))
      );
    }
  }

  return null;
}

function getProductsForDisease(disease) {
  const allProducts = Product.findAll ? Product.findAll() : db.find('products');
  const dName = disease.name.toLowerCase();

  return allProducts.filter(p => {
    const desc = p.description.toLowerCase();
    return desc.includes(dName) || 
           (dName.includes('blight') && desc.includes('blight')) ||
           (dName.includes('rust') && desc.includes('rust')) ||
           (dName.includes('scab') && desc.includes('scab')) ||
           (dName.includes('rot') && desc.includes('rot')) ||
           (dName.includes('mildew') && desc.includes('mildew'));
  }).slice(0, 3);
}

function formatDiseaseResponse(disease, t) {
  return t.diseaseResponse
    .replace('{disease}', disease.name)
    .replace('{scientific}', disease.scientificName || 'N/A')
    .replace('{plant}', disease.plantType)
    .replace('{symptoms}', Array.isArray(disease.symptoms) ? disease.symptoms.map(s => `• ${s}`).join('\n') : disease.symptoms)
    .replace('{causes}', disease.causes || 'Fungal/bacterial infection')
    .replace('{treatment}', Array.isArray(disease.treatment) ? disease.treatment.map(tr => `✔ ${tr}`).join('\n') : disease.treatment)
    .replace('{prevention}', Array.isArray(disease.prevention) ? disease.prevention.map(pr => `🛡️ ${pr}`).join('\n') : disease.prevention);
}

function getCareTips() {
  return [
    { plant: "Tomato", watering: "Water deeply at root level 1-2 inches per week.", fertilizing: "Balanced NPK at planting, low-nitrogen at bloom.", maintenance: "Pinch suckers and stake vines." },
    { plant: "Potato", watering: "Consistent 1-1.5 inches water per week.", fertilizing: "5-10-10 fertilizer for tuber growth.", maintenance: "Hill soil 6 inches high every 2-3 weeks." },
    { plant: "Apple", watering: "1-2 gallons twice a week for young trees.", fertilizing: "10-10-10 NPK in early spring.", maintenance: "Prune dormant season for open center." },
    { plant: "Grape", watering: "Irrigate deeply every 10-14 days.", fertilizing: "Organic compost in early spring.", maintenance: "Spur pruning in late winter." },
    { plant: "Corn", watering: "1-1.5 inches per week, critical at tasseling.", fertilizing: "High nitrogen side-dress at knee-height.", maintenance: "Thin seedlings to 8-12 inches." },
    { plant: "Rice", watering: "2-5 cm water depth during vegetative growth.", fertilizing: "Split nitrogen applications with silicon.", maintenance: "Weed within 30 days of transplanting." },
    { plant: "Strawberry", watering: "1-1.5 inches weekly using drip irrigation.", fertilizing: "High potassium during fruit set.", maintenance: "Mulch with straw and thin runners." },
    { plant: "Pepper", watering: "1-2 inches per week consistently.", fertilizing: "Low-nitrogen high-phosphorus at flowering.", maintenance: "Pinch first flower bud for strong roots." }
  ];
}

function capitalize(str) {
  return str.charAt(0).toUpperCase() + str.slice(1);
}

module.exports = {
  processUserMessage,
  formatDiseaseResponse
};
