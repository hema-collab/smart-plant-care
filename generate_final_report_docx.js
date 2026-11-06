const fs = require('fs');
const path = require('path');
const {
  Document,
  Packer,
  Paragraph,
  TextRun,
  Table,
  TableRow,
  TableCell,
  Header,
  Footer,
  PageNumber,
  NumberFormat,
  AlignmentType,
  HeadingLevel,
  BorderStyle,
  WidthType,
  ImageRun,
  PageBreak,
  ShadingType
} = require('docx');

const ASSETS_DIR = path.join(__dirname, 'report_assets');
const OUTPUT_PATH = path.join(__dirname, 'Smart_Plant_Care_Project_Report.docx');

// Common typography styles
const FONT_FAMILY = 'Times New Roman';
const LINE_SPACING_1_5 = 360; // 1.5 line spacing (240 * 1.5)

// Helper functions for paragraphs
function createChapterTitle(chapterNumber, chapterTitle) {
  return [
    new Paragraph({
      alignment: AlignmentType.LEFT,
      spacing: { before: 240, after: 120, line: LINE_SPACING_1_5 },
      children: [
        new TextRun({
          text: chapterNumber,
          font: FONT_FAMILY,
          size: 32, // 16pt
          bold: true
        })
      ]
    }),
    new Paragraph({
      alignment: AlignmentType.CENTER,
      spacing: { before: 120, after: 360, line: LINE_SPACING_1_5 },
      children: [
        new TextRun({
          text: chapterTitle,
          font: FONT_FAMILY,
          size: 36, // 18pt
          bold: true
        })
      ]
    })
  ];
}

function createSectionHeading(text) {
  return new Paragraph({
    alignment: AlignmentType.LEFT,
    spacing: { before: 280, after: 140, line: LINE_SPACING_1_5 },
    children: [
      new TextRun({
        text: text,
        font: FONT_FAMILY,
        size: 28, // 14pt
        bold: true
      })
    ]
  });
}

function createSubSectionHeading(text) {
  return new Paragraph({
    alignment: AlignmentType.LEFT,
    spacing: { before: 220, after: 100, line: LINE_SPACING_1_5 },
    children: [
      new TextRun({
        text: text,
        font: FONT_FAMILY,
        size: 26, // 13pt
        bold: true
      })
    ]
  });
}

function createBodyParagraph(text, options = {}) {
  return new Paragraph({
    alignment: options.alignment || AlignmentType.JUSTIFIED,
    spacing: { before: options.before || 0, after: options.after || 140, line: LINE_SPACING_1_5 },
    children: [
      new TextRun({
        text: text,
        font: FONT_FAMILY,
        size: 24, // 12pt
        bold: options.bold || false,
        italics: options.italics || false
      })
    ]
  });
}

function createBulletParagraph(title, desc) {
  return new Paragraph({
    alignment: AlignmentType.JUSTIFIED,
    spacing: { before: 60, after: 100, line: LINE_SPACING_1_5 },
    indent: { left: 360, hanging: 240 },
    children: [
      new TextRun({
        text: `•  ${title}: `,
        font: FONT_FAMILY,
        size: 24,
        bold: true
      }),
      new TextRun({
        text: desc,
        font: FONT_FAMILY,
        size: 24
      })
    ]
  });
}

function createTableCaption(tableNo, tableName) {
  return new Paragraph({
    alignment: AlignmentType.LEFT,
    spacing: { before: 240, after: 100, line: LINE_SPACING_1_5 },
    children: [
      new TextRun({
        text: `${tableNo}: `,
        font: FONT_FAMILY,
        size: 22, // 11pt
        bold: true
      }),
      new TextRun({
        text: tableName,
        font: FONT_FAMILY,
        size: 22,
        bold: true
      })
    ]
  });
}

function createFigure(imagePath, figNumber, figCaption, width = 500, height = 280) {
  const elements = [];
  if (fs.existsSync(imagePath)) {
    const imgData = fs.readFileSync(imagePath);
    elements.push(
      new Paragraph({
        alignment: AlignmentType.CENTER,
        spacing: { before: 200, after: 100 },
        children: [
          new ImageRun({
            data: imgData,
            transformation: { width: width, height: height }
          })
        ]
      })
    );
  }
  elements.push(
    new Paragraph({
      alignment: AlignmentType.CENTER,
      spacing: { before: 60, after: 240, line: LINE_SPACING_1_5 },
      children: [
        new TextRun({
          text: `${figNumber} `,
          font: FONT_FAMILY,
          size: 20, // 10pt
          bold: true
        }),
        new TextRun({
          text: figCaption,
          font: FONT_FAMILY,
          size: 20, // 10pt
          italics: true
        })
      ]
    })
  );
  return elements;
}

function buildTable(headers, rows, colWidths = [15, 30, 25, 20, 10]) {
  const tableRows = [];

  // Header Row
  tableRows.push(
    new TableRow({
      tableHeader: true,
      children: headers.map((h, i) =>
        new TableCell({
          width: { size: colWidths[i], type: WidthType.PERCENTAGE },
          shading: { fill: 'E2E8F0', type: ShadingType.CLEAR },
          margins: { top: 120, bottom: 120, left: 140, right: 140 },
          children: [
            new Paragraph({
              alignment: AlignmentType.CENTER,
              children: [
                new TextRun({ text: h, font: FONT_FAMILY, size: 20, bold: true })
              ]
            })
          ]
        })
      )
    })
  );

  // Body Rows
  rows.forEach((row, rIdx) => {
    tableRows.push(
      new TableRow({
        children: row.map((cellText, i) =>
          new TableCell({
            width: { size: colWidths[i], type: WidthType.PERCENTAGE },
            shading: { fill: rIdx % 2 === 0 ? 'FFFFFF' : 'F8FAFC', type: ShadingType.CLEAR },
            margins: { top: 100, bottom: 100, left: 120, right: 120 },
            children: [
              new Paragraph({
                alignment: i === 0 || i === 4 ? AlignmentType.CENTER : AlignmentType.LEFT,
                children: [
                  new TextRun({
                    text: cellText,
                    font: FONT_FAMILY,
                    size: 19,
                    bold: i === 4 && cellText === 'Pass'
                  })
                ]
              })
            ]
          })
        )
      })
    );
  });

  return new Table({
    width: { size: 100, type: WidthType.PERCENTAGE },
    rows: tableRows
  });
}

async function generateReport() {
  console.log('Generating BE Project Report in Word (.docx) format...');

  // Common Header and Footers
  const header = new Header({
    children: [
      new Paragraph({
        alignment: AlignmentType.LEFT,
        border: { bottom: { color: '999999', space: 4, value: 'single', size: 6 } },
        spacing: { after: 120 },
        children: [
          new TextRun({
            text: 'Smart Plant Care and Disease Detection System',
            font: FONT_FAMILY,
            size: 18,
            italics: true
          })
        ]
      })
    ]
  });

  const footerPreliminary = new Footer({
    children: [
      new Paragraph({
        border: { top: { color: '999999', space: 4, value: 'single', size: 6 } },
        spacing: { before: 120 },
        children: [
          new TextRun({
            text: 'Dept. of CS & E, RLJIT',
            font: FONT_FAMILY,
            size: 18
          }),
          new TextRun({
            text: '\t\t2025-26\t\t',
            font: FONT_FAMILY,
            size: 18
          }),
          new TextRun({
            children: [PageNumber.CURRENT],
            font: FONT_FAMILY,
            size: 18
          })
        ]
      })
    ]
  });

  const footerMain = new Footer({
    children: [
      new Paragraph({
        border: { top: { color: '999999', space: 4, value: 'single', size: 6 } },
        spacing: { before: 120 },
        children: [
          new TextRun({
            text: 'Dept. of CS & E, RLJIT',
            font: FONT_FAMILY,
            size: 18
          }),
          new TextRun({
            text: '\t\t2025-26\t\t',
            font: FONT_FAMILY,
            size: 18
          }),
          new TextRun({
            children: [PageNumber.CURRENT],
            font: FONT_FAMILY,
            size: 18
          })
        ]
      })
    ]
  });

  // ── SECTION 1: PRELIMINARY PAGES (ROMAN NUMERALS) ──────────────────────────
  const prelimChildren = [];

  // 1. COVER / TITLE PAGE
  prelimChildren.push(
    new Paragraph({
      alignment: AlignmentType.CENTER,
      spacing: { before: 120, after: 60, line: LINE_SPACING_1_5 },
      children: [
        new TextRun({
          text: 'VISVESVARAYA TECHNOLOGICAL UNIVERSITY\n',
          font: FONT_FAMILY,
          size: 30, // 15pt
          bold: true,
          color: '990000'
        }),
        new TextRun({
          text: 'JNANA SANGAMA, BELAGAVI - 590 014',
          font: FONT_FAMILY,
          size: 26,
          bold: true,
          color: '990000'
        })
      ]
    }),
    new Paragraph({
      alignment: AlignmentType.CENTER,
      spacing: { before: 360, after: 120, line: LINE_SPACING_1_5 },
      children: [
        new TextRun({ text: 'Project Report\non', font: FONT_FAMILY, size: 26, bold: true })
      ]
    }),
    new Paragraph({
      alignment: AlignmentType.CENTER,
      spacing: { before: 180, after: 360, line: LINE_SPACING_1_5 },
      children: [
        new TextRun({
          text: '“Smart Plant Care and Disease Detection System”',
          font: FONT_FAMILY,
          size: 34, // 17pt
          bold: true,
          color: '003366'
        })
      ]
    }),
    new Paragraph({
      alignment: AlignmentType.CENTER,
      spacing: { before: 180, after: 240, line: LINE_SPACING_1_5 },
      children: [
        new TextRun({
          text: 'Submitted for partial fulfillment of requirement for the award of Degree of\n',
          font: FONT_FAMILY,
          size: 24
        }),
        new TextRun({
          text: 'Bachelor of Engineering\nin\nComputer Science and Engineering',
          font: FONT_FAMILY,
          size: 26,
          bold: true
        })
      ]
    }),
    new Paragraph({
      alignment: AlignmentType.CENTER,
      spacing: { before: 240, after: 120, line: LINE_SPACING_1_5 },
      children: [
        new TextRun({ text: 'Submitted by\n', font: FONT_FAMILY, size: 24, italics: true }),
        new TextRun({ text: 'HEMANTH KUMAR R\t[1RL22CS034]\n', font: FONT_FAMILY, size: 24, bold: true }),
        new TextRun({ text: 'KIRAN M\t[1RL22CS045]\n', font: FONT_FAMILY, size: 24, bold: true }),
        new TextRun({ text: 'MANOJ K\t[1RL22CS052]\n', font: FONT_FAMILY, size: 24, bold: true }),
        new TextRun({ text: 'NAVEEN S\t[1RL22CS061]', font: FONT_FAMILY, size: 24, bold: true })
      ]
    }),
    new Paragraph({
      alignment: AlignmentType.CENTER,
      spacing: { before: 240, after: 120, line: LINE_SPACING_1_5 },
      children: [
        new TextRun({ text: 'Under the guidance of\n', font: FONT_FAMILY, size: 24, italics: true }),
        new TextRun({ text: 'Prof. Anitha K P\n', font: FONT_FAMILY, size: 26, bold: true }),
        new TextRun({ text: 'Assistant Professor, Dept. of CS&E, RLJIT', font: FONT_FAMILY, size: 24 })
      ]
    }),
    new Paragraph({
      alignment: AlignmentType.CENTER,
      spacing: { before: 360, after: 80, line: LINE_SPACING_1_5 },
      children: [
        new TextRun({
          text: 'Department of Computer Science and Engineering\n',
          font: FONT_FAMILY,
          size: 26,
          bold: true,
          color: '006633'
        }),
        new TextRun({
          text: 'R. L. JALAPPA INSTITUTE OF TECHNOLOGY\n',
          font: FONT_FAMILY,
          size: 28,
          bold: true,
          color: '006633'
        }),
        new TextRun({
          text: '(Approved by AICTE, New Delhi, Affiliated to VTU, Belagavi & Accredited by NAAC - “A” Grade)\n',
          font: FONT_FAMILY,
          size: 20
        }),
        new TextRun({
          text: 'Doddaballapur, Bangalore Rural Dist - 561 203\n2025-26',
          font: FONT_FAMILY,
          size: 24,
          bold: true
        })
      ]
    }),
    new Paragraph({ children: [new PageBreak()] })
  );

  // 2. COLLEGE CERTIFICATE
  prelimChildren.push(
    new Paragraph({
      alignment: AlignmentType.CENTER,
      spacing: { before: 120, after: 60, line: LINE_SPACING_1_5 },
      children: [
        new TextRun({ text: 'Sri Devaraj Urs Educational Trust (R.)\n', font: FONT_FAMILY, size: 24, bold: true }),
        new TextRun({ text: 'R. L. JALAPPA INSTITUTE OF TECHNOLOGY\n', font: FONT_FAMILY, size: 28, bold: true, color: '990000' }),
        new TextRun({ text: '(Approved by AICTE, New Delhi, Affiliated to VTU, Belagavi & Accredited by NAAC - “A” Grade)\nKodigehalli, Doddaballapur - 561 203\n', font: FONT_FAMILY, size: 20 }),
        new TextRun({ text: 'Department of Computer Science and Engineering', font: FONT_FAMILY, size: 24, bold: true, color: '006633' })
      ]
    }),
    new Paragraph({
      alignment: AlignmentType.CENTER,
      spacing: { before: 240, after: 240 },
      children: [
        new TextRun({ text: 'CERTIFICATE', font: FONT_FAMILY, size: 32, bold: true, underline: {} })
      ]
    }),
    createBodyParagraph(
      'This is to certify that the Project Phase–II work entitled “Smart Plant Care and Disease Detection System,” carried out by Hemanth Kumar R [1RL22CS034], Kiran M [1RL22CS045], Manoj K [1RL22CS052], and Naveen S [1RL22CS061], bonafide students of R. L. Jalappa Institute of Technology, has been completed in partial fulfillment of the requirements for the award of the Bachelor of Engineering in Computer Science and Engineering of Visvesvaraya Technological University, Belagavi, during the academic year 2025–26.'
    ),
    createBodyParagraph(
      'It is certified that all corrections and suggestions indicated for Internal Assessment have been incorporated in the Report deposited in the departmental library. The project report has been approved as it satisfies the academic requirements in respect of Project work prescribed for the said Degree.'
    ),
    new Paragraph({
      alignment: AlignmentType.CENTER,
      spacing: { before: 400, after: 200 },
      children: [
        new TextRun({
          text: '_____________________\t\t_____________________\t\t_____________________\n',
          font: FONT_FAMILY,
          size: 22
        }),
        new TextRun({ text: 'Guide Signature\t\tDr. Sunil Kumar R M\t\tDr. Murali G\n', font: FONT_FAMILY, size: 22, bold: true }),
        new TextRun({ text: 'Prof. Anitha K P\t\tHoD, Dept. of CS&E\t\tPrincipal, RLJIT\n', font: FONT_FAMILY, size: 20 }),
        new TextRun({ text: 'Dept. of CS&E, RLJIT\t\tRLJIT, Doddaballapur\t\tRLJIT, Doddaballapur', font: FONT_FAMILY, size: 20 })
      ]
    }),
    new Paragraph({
      alignment: AlignmentType.LEFT,
      spacing: { before: 300, after: 120 },
      children: [
        new TextRun({ text: 'External Viva-Voce Examination:\n', font: FONT_FAMILY, size: 22, bold: true }),
        new TextRun({ text: 'Name of the Examiners\t\t\t\tSignature with date\n', font: FONT_FAMILY, size: 20, bold: true }),
        new TextRun({ text: '1. ___________________________________\t\t________________________\n', font: FONT_FAMILY, size: 20 }),
        new TextRun({ text: '2. ___________________________________\t\t________________________', font: FONT_FAMILY, size: 20 })
      ]
    }),
    new Paragraph({ children: [new PageBreak()] })
  );

  // 3. DECLARATION
  prelimChildren.push(
    new Paragraph({
      alignment: AlignmentType.CENTER,
      spacing: { before: 120, after: 60, line: LINE_SPACING_1_5 },
      children: [
        new TextRun({ text: 'Sri Devaraj Urs Educational Trust (R.)\n', font: FONT_FAMILY, size: 24, bold: true }),
        new TextRun({ text: 'R. L. JALAPPA INSTITUTE OF TECHNOLOGY\n', font: FONT_FAMILY, size: 28, bold: true, color: '990000' }),
        new TextRun({ text: '(Approved by AICTE, New Delhi, Affiliated to VTU, Belagavi & Accredited by NAAC - “A” Grade)\nKodigehalli, Doddaballapur - 561 203\n', font: FONT_FAMILY, size: 20 }),
        new TextRun({ text: 'Department of Computer Science and Engineering', font: FONT_FAMILY, size: 24, bold: true, color: '006633' })
      ]
    }),
    new Paragraph({
      alignment: AlignmentType.CENTER,
      spacing: { before: 240, after: 240 },
      children: [
        new TextRun({ text: 'DECLARATION', font: FONT_FAMILY, size: 32, bold: true, underline: {} })
      ]
    }),
    createBodyParagraph(
      'We hereby declare that the work presented in the Project Phase–II Report, entitled “SMART PLANT CARE AND DISEASE DETECTION SYSTEM”, in partial fulfillment of the requirements for the award of the Degree of Bachelor of Engineering in Computer Science & Engineering, is a record of our own work carried out under the guidance of Prof. Anitha K P, Assistant Professor, Department of Computer Science & Engineering, R. L. Jalappa Institute of Technology, Doddaballapur, Bengaluru Rural, affiliated to Visvesvaraya Technological University, Belagavi, during the academic year 2025–26. We also declare that this work has not formed the basis for the award of any degree or other academic distinction to any other student.'
    ),
    new Paragraph({
      alignment: AlignmentType.RIGHT,
      spacing: { before: 360, after: 120, line: LINE_SPACING_1_5 },
      children: [
        new TextRun({ text: 'Hemanth Kumar R [1RL22CS034]\t(Signature)\n', font: FONT_FAMILY, size: 22 }),
        new TextRun({ text: 'Kiran M [1RL22CS045]\t(Signature)\n', font: FONT_FAMILY, size: 22 }),
        new TextRun({ text: 'Manoj K [1RL22CS052]\t(Signature)\n', font: FONT_FAMILY, size: 22 }),
        new TextRun({ text: 'Naveen S [1RL22CS061]\t(Signature)', font: FONT_FAMILY, size: 22 })
      ]
    }),
    new Paragraph({
      alignment: AlignmentType.LEFT,
      spacing: { before: 240, after: 80 },
      children: [
        new TextRun({ text: 'Place: Doddaballapur\nDate: 13-10-2026', font: FONT_FAMILY, size: 22, bold: true })
      ]
    }),
    new Paragraph({ children: [new PageBreak()] })
  );

  // 4. ACKNOWLEDGEMENT
  prelimChildren.push(
    new Paragraph({
      alignment: AlignmentType.CENTER,
      spacing: { before: 120, after: 240 },
      children: [
        new TextRun({ text: 'ACKNOWLEDGEMENT', font: FONT_FAMILY, size: 32, bold: true, underline: {} })
      ]
    }),
    createBodyParagraph(
      'With great pride, we express our heartfelt gratitude to our college, R. L. Jalappa Institute of Technology, for providing us with the platform and resources necessary to fulfill the requirements of the Project Phase - II titled “Smart Plant Care and Disease Detection System”, as prescribed by Visvesvaraya Technological University (VTU) for the Eighth Semester.'
    ),
    createBodyParagraph(
      'We extend our sincere thanks to Dr. Murali G, Principal, RLJIT, for providing excellent infrastructure, laboratories, and support to successfully complete this Project Phase - II.'
    ),
    createBodyParagraph(
      'We are deeply grateful to Dr. M. Sreenivasa Reddy, Director, RLJIT (Quality in Academics and R&D), for his steadfast support, academic insights, and motivation that greatly contributed to the completion of our Project.'
    ),
    createBodyParagraph(
      'Our special thanks go to Dr. Sunil Kumar R M, Vice Principal and HoD, Department of Computer Science and Engineering, RLJIT, for his valuable guidance, constructive critiques, and continuous encouragement across all stages of project execution.'
    ),
    createBodyParagraph(
      'Our heartfelt appreciation to Mrs. Navitha R M, Assistant Professor and Major Project Coordinator, Department of Computer Science and Engineering, RLJIT, for her systematic planning, guidance, and coordination throughout the duration of this project.'
    ),
    createBodyParagraph(
      'We extend our deepest gratitude to our guide, Prof. Anitha K P, Assistant Professor, Department of Computer Science and Engineering, for her continuous mentorship, technical guidance, patience, and review at every stage of this research and software development endeavor.'
    ),
    createBodyParagraph(
      'We would also like to thank all the Faculty Members and Technical Staff of the Department of CS&E, RLJIT, for their cooperation and valuable suggestions, which were instrumental in making this work a resounding success.'
    ),
    createBodyParagraph(
      'Finally, we are deeply thankful to our beloved Parents and Friends for their unwavering blessings, moral support, love, and constant encouragement throughout our academic journey.'
    ),
    new Paragraph({
      alignment: AlignmentType.RIGHT,
      spacing: { before: 240, after: 120 },
      children: [
        new TextRun({ text: 'Project Associates:\nHemanth Kumar R | Kiran M | Manoj K | Naveen S', font: FONT_FAMILY, size: 22, bold: true })
      ]
    }),
    new Paragraph({ children: [new PageBreak()] })
  );

  // 5. ABSTRACT
  prelimChildren.push(
    new Paragraph({
      alignment: AlignmentType.CENTER,
      spacing: { before: 120, after: 240 },
      children: [
        new TextRun({ text: 'ABSTRACT', font: FONT_FAMILY, size: 32, bold: true, underline: {} })
      ]
    }),
    createBodyParagraph(
      'Agriculture serves as the backbone of the global economy and food security; however, crop yield and farmer livelihoods are persistently threatened by virulent phytopathogens including fungi, bacteria, and viruses. Traditional crop disease identification relies heavily on visual scouting by agricultural extension officers or physical laboratory cultures, methods that are subjective, labor-intensive, error-prone, and inaccessible to rural smallholder farmers. Delays in diagnosis frequently result in catastrophic harvest loss or indiscriminate pesticide overuse that degrades ecological soil health.'
    ),
    createBodyParagraph(
      'To address this critical gap, this project develops the “Smart Plant Care and Disease Detection System,” an end-to-end intelligent agricultural diagnosis and remediation platform. The core artificial intelligence engine leverages a Convolutional Neural Network (CNN) built upon the MobileNetV2 architecture featuring depthwise separable convolutions and linear bottleneck inverted residuals. Trained on over 54,000 augmented leaf images across 38 distinct plant-disease classes from the PlantVillage and field benchmark datasets, the model achieves a state-of-the-art testing accuracy of 96.4% while maintaining a lightweight footprint suitable for edge deployment.'
    ),
    createBodyParagraph(
      'The software is architected as a high-performance decoupled full-stack system comprising a Node.js/Express application gateway and a Python Flask microservice. Beyond automated disease diagnosis and confidence scoring, the system integrates a symptom-remedy mapping engine, an agro-chemical and organic care marketplace, an interactive AI agronomy chatbot (AgroBot), and an automated clinical Word (.docx) report generator. The resulting platform provides instantaneous, deterministic, and actionable crop healthcare, bridging the divide between advanced deep learning and grassroots farming communities.'
    ),
    new Paragraph({
      spacing: { before: 180, after: 120 },
      children: [
        new TextRun({ text: 'Keywords: ', font: FONT_FAMILY, size: 24, bold: true }),
        new TextRun({ text: 'Convolutional Neural Networks (CNN), MobileNetV2, Plant Disease Detection, Transfer Learning, Node.js Microservices, Precision Agriculture, Automated Agronomic Reporting.', font: FONT_FAMILY, size: 24, italics: true })
      ]
    }),
    new Paragraph({ children: [new PageBreak()] })
  );

  // 6. TABLE OF CONTENTS
  prelimChildren.push(
    new Paragraph({
      alignment: AlignmentType.CENTER,
      spacing: { before: 120, after: 240 },
      children: [
        new TextRun({ text: 'TABLE OF CONTENTS', font: FONT_FAMILY, size: 32, bold: true, underline: {} })
      ]
    })
  );

  const tocData = [
    ['ACKNOWLEDGEMENT', 'i'],
    ['ABSTRACT', 'ii'],
    ['LIST OF FIGURES', 'v'],
    ['LIST OF TABLES', 'vi'],
    ['ABBREVIATIONS', 'vii'],
    ['CHAPTER 1   INTRODUCTION', '1'],
    ['CHAPTER 2   LITERATURE SURVEY', '2'],
    ['   2.1 Literature Overview', '2'],
    ['   2.2 Existing System', '6'],
    ['      2.2.1 Research Gap', '7'],
    ['   2.3 Proposed System', '7'],
    ['      2.3.1 Problem Statement', '10'],
    ['      2.3.2 Objectives', '10'],
    ['   2.4 System Requirements and Specifications', '11'],
    ['      2.4.1 Functional Requirements', '11'],
    ['      2.4.2 Non-Functional Requirements', '12'],
    ['      2.4.3 Software Requirements', '13'],
    ['      2.4.4 Hardware Requirements', '14'],
    ['CHAPTER 3   METHODOLOGY AND DESIGN', '15'],
    ['   3.1 Algorithms', '15'],
    ['      3.1.1 Algorithm 1: Depthwise Separable Convolution & Feature Extraction', '15'],
    ['      3.1.2 Algorithm 2: Softmax Classification and Confidence Scoring', '16'],
    ['   3.2 Dataflow Diagram (Level 0, Level 1, Level 2)', '17'],
    ['   3.3 Use Case Diagram', '19'],
    ['   3.4 Activity Diagram', '20'],
    ['   3.5 Sequence Diagram', '22'],
    ['   3.6 Class Diagram', '24'],
    ['CHAPTER 4   IMPLEMENTATION', '27'],
    ['   4.1 Technology Used', '27'],
    ['      4.1.1 Deep Learning Frameworks', '27'],
    ['      4.1.2 Web & Backend Architecture', '28'],
    ['      4.1.3 Frontend Presentation Tier', '28'],
    ['      4.1.4 Data Persistence & Cloud Infrastructure', '29'],
    ['      4.1.5 Performance Metrics', '29'],
    ['CHAPTER 5   TESTING', '30'],
    ['   5.1 Testing Methods', '30'],
    ['   5.2 Test Cases', '31'],
    ['      5.2.1 Unit Testing', '31'],
    ['      5.2.2 Integration Testing', '31'],
    ['      5.2.3 Functional Testing', '32'],
    ['      5.2.4 System Testing', '32'],
    ['      5.2.5 Regression Testing', '33'],
    ['      5.2.6 Performance Testing', '33'],
    ['CHAPTER 6   RESULTS', '34'],
    ['   6.1 Snapshots', '34'],
    ['   6.2 Result Analysis', '37'],
    ['CONCLUSION', '38'],
    ['FUTURE ENHANCEMENT', '39'],
    ['REFERENCES', '40']
  ];

  tocData.forEach(([item, pg]) => {
    prelimChildren.push(
      new Paragraph({
        spacing: { before: 40, after: 40 },
        children: [
          new TextRun({
            text: item,
            font: FONT_FAMILY,
            size: 22,
            bold: item.startsWith('CHAPTER') || !item.startsWith(' ')
          }),
          new TextRun({
            text: '\t' + pg,
            font: FONT_FAMILY,
            size: 22,
            bold: item.startsWith('CHAPTER')
          })
        ]
      })
    );
  });
  prelimChildren.push(new Paragraph({ children: [new PageBreak()] }));

  // 7. LIST OF FIGURES
  prelimChildren.push(
    new Paragraph({
      alignment: AlignmentType.CENTER,
      spacing: { before: 120, after: 240 },
      children: [
        new TextRun({ text: 'LIST OF FIGURES', font: FONT_FAMILY, size: 32, bold: true, underline: {} })
      ]
    })
  );
  const figuresList = [
    ['Figure 2.3', 'System Architecture Block Diagram of Smart Plant Care', '9'],
    ['Figure 3.2', 'Multi-Level Data Flow Diagram (Level 0, Level 1 & Level 2)', '17'],
    ['Figure 3.3', 'UML Use Case Diagram of Plant Care System', '19'],
    ['Figure 3.4', 'UML Activity Diagram for Disease Diagnosis and Care Workflow', '20'],
    ['Figure 3.5', 'UML Sequence Diagram for Microservice Interaction', '22'],
    ['Figure 3.6', 'UML Class Diagram for Object Model Architecture', '24'],
    ['Figure 6.1.1', 'User Authentication and Authorization Portal', '34'],
    ['Figure 6.1.2', 'Plant Leaf Disease Scan and Upload Interface', '34'],
    ['Figure 6.1.3', 'MobileNetV2 Diagnostic Result and Symptom Profile', '35'],
    ['Figure 6.1.4', 'Integrated Agro-Chemicals and Organic Care Store', '35'],
    ['Figure 6.1.5', 'Smart Plant AI Agronomy Chatbot Assistant (AgroBot)', '36'],
    ['Figure 6.1.6', 'Automated Word (.docx) Clinical Health Report Generator', '36'],
    ['Figure 6.1.7', 'Amazon RDS Cloud PostgreSQL Database Infrastructure', '37'],
    ['Figure 6.1.8', 'Deep Learning Model Training & Validation Performance Curves', '37']
  ];
  figuresList.forEach(([fNo, fName, fPg]) => {
    prelimChildren.push(
      new Paragraph({
        spacing: { before: 60, after: 60 },
        children: [
          new TextRun({ text: `${fNo}\t`, font: FONT_FAMILY, size: 22, bold: true }),
          new TextRun({ text: `${fName}\t\t`, font: FONT_FAMILY, size: 22 }),
          new TextRun({ text: fPg, font: FONT_FAMILY, size: 22, bold: true })
        ]
      })
    );
  });
  prelimChildren.push(new Paragraph({ children: [new PageBreak()] }));

  // 8. LIST OF TABLES
  prelimChildren.push(
    new Paragraph({
      alignment: AlignmentType.CENTER,
      spacing: { before: 120, after: 240 },
      children: [
        new TextRun({ text: 'LIST OF TABLES', font: FONT_FAMILY, size: 32, bold: true, underline: {} })
      ]
    })
  );
  const tablesList = [
    ['Table 5.2.1', 'Unit Testing Test Cases', '31'],
    ['Table 5.2.2', 'Integration Testing Test Cases', '31'],
    ['Table 5.2.3', 'Functional Testing Test Cases', '32'],
    ['Table 5.2.4', 'System Testing Test Cases', '32'],
    ['Table 5.2.5', 'Regression Testing Test Cases', '33'],
    ['Table 5.2.6', 'Performance Testing Test Cases', '33']
  ];
  tablesList.forEach(([tNo, tName, tPg]) => {
    prelimChildren.push(
      new Paragraph({
        spacing: { before: 60, after: 60 },
        children: [
          new TextRun({ text: `${tNo}\t`, font: FONT_FAMILY, size: 22, bold: true }),
          new TextRun({ text: `${tName}\t\t`, font: FONT_FAMILY, size: 22 }),
          new TextRun({ text: tPg, font: FONT_FAMILY, size: 22, bold: true })
        ]
      })
    );
  });
  prelimChildren.push(new Paragraph({ children: [new PageBreak()] }));

  // 9. ABBREVIATIONS
  prelimChildren.push(
    new Paragraph({
      alignment: AlignmentType.CENTER,
      spacing: { before: 120, after: 240 },
      children: [
        new TextRun({ text: 'ABBREVIATIONS', font: FONT_FAMILY, size: 32, bold: true, underline: {} })
      ]
    })
  );
  const abbreviationsList = [
    ['AI', 'Artificial Intelligence'],
    ['ANN', 'Artificial Neural Network'],
    ['API', 'Application Programming Interface'],
    ['AWS', 'Amazon Web Services'],
    ['CNN', 'Convolutional Neural Network'],
    ['CPU', 'Central Processing Unit'],
    ['CORS', 'Cross-Origin Resource Sharing'],
    ['DFD', 'Data Flow Diagram'],
    ['DMI', 'Demethylation Inhibitor (Fungicide Class)'],
    ['DOM', 'Document Object Model'],
    ['GPU', 'Graphics Processing Unit'],
    ['HTTP', 'Hypertext Transfer Protocol'],
    ['IoT', 'Internet of Things'],
    ['JSON', 'JavaScript Object Notation'],
    ['JWT', 'JSON Web Token'],
    ['ML', 'Machine Learning'],
    ['NMS', 'Non-Maximum Suppression'],
    ['OMRI', 'Organic Materials Review Institute'],
    ['RAM', 'Random Access Memory'],
    ['RDBMS', 'Relational Database Management System'],
    ['RDS', 'Relational Database Service'],
    ['ReLU', 'Rectified Linear Unit'],
    ['REST', 'Representational State Transfer'],
    ['SPA', 'Single Page Application'],
    ['SSD', 'Solid State Drive'],
    ['UI', 'User Interface'],
    ['UML', 'Unified Modeling Language'],
    ['URI', 'Uniform Resource Identifier'],
    ['URL', 'Uniform Resource Locator'],
    ['VGG', 'Visual Geometry Group'],
    ['VTU', 'Visvesvaraya Technological University'],
    ['YOLO', 'You Only Look Once']
  ];
  abbreviationsList.forEach(([abbr, full]) => {
    prelimChildren.push(
      new Paragraph({
        spacing: { before: 50, after: 50 },
        children: [
          new TextRun({ text: `${abbr}\t\t`, font: FONT_FAMILY, size: 22, bold: true }),
          new TextRun({ text: full, font: FONT_FAMILY, size: 22 })
        ]
      })
    );
  });
  prelimChildren.push(new Paragraph({ children: [new PageBreak()] }));

  // ── SECTION 2: MAIN CHAPTERS (ARABIC NUMERALS) ────────────────────────────
  const mainChildren = [];

  // ──────────────────────────────────────────────────────────────────────────
  // CHAPTER 1: INTRODUCTION
  // Note: Exactly 1 page with proper paragraphs, Times New Roman, 1.5 line spacing
  // Chapter Name 16pt, Main Heading 18pt, Body 12pt
  // ──────────────────────────────────────────────────────────────────────────
  mainChildren.push(
    ...createChapterTitle('CHAPTER 1', 'INTRODUCTION'),
    createBodyParagraph(
      'Agriculture is universally recognized as the bedrock of global human civilization, sustaining global nutritional requirements and serving as the economic backbone for developing nations. Tomato plants (Solanum lycopersicum) and related staple crops, including potatoes, bell peppers, corn, and apples, rank among the most widely cultivated crops worldwide, contributing significantly to agrarian revenue, industrial processing, and food security. However, these horticultural crops exhibit exceptional biological vulnerability to diverse plant pathogens, ranging from virulent fungal spores and bacterial blights to debilitating viruses and predatory insect infestations. Phytopathogens such as Alternaria solani (Early Blight), Phytophthora infestans (Late Blight), and Xanthomonas campestris rapidly decimate leaf foliar tissue, inhibit photosynthetic capacity, stunt vegetative development, and ultimately reduce commercial harvest yields by up to 50% to 70% if left unchecked.'
    ),
    createBodyParagraph(
      'Early and accurate detection of crop diseases is essential for effective agronomic management and crop preservation, enabling agricultural practitioners to initiate targeted, curative countermeasures before pathological outbreaks spread catastrophically across entire fields. Traditionally, disease identification relies upon manual visual scouting conducted by experienced agricultural extension officers or upon physical laboratory testing involving microbial culturing and Polymerase Chain Reaction (PCR) assays. While accurate under controlled circumstances, these legacy methods suffer from inherent human subjectivity, high diagnostic latency, exorbitant laboratory costs, and extreme scarcity of certified plant pathologists across rural agrarian sectors. Consequently, resource-constrained farmers frequently resort to late diagnosis or indiscriminate broad-spectrum chemical pesticide applications, which precipitate environmental soil toxicity, contaminate groundwater reservoirs, foster pathogen resistance, and impose severe financial burdens on farming families.'
    ),
    createBodyParagraph(
      'Recent breakthroughs in computing hardware, digital image capture, and deep learning algorithms have created transformative opportunities to democratize automated plant disease diagnosis. Convolutional Neural Networks (CNNs) have established unprecedented performance benchmarks in computer vision, exhibiting the capacity to extract subtle pathological patterns from leaf imagery that elude human perception. Nevertheless, significant practical barriers remain: existing agricultural AI research often exists in isolation as standalone mathematical models, disconnected from usable farm-management workflows, lacking integrated treatment guidance, requiring excessive computational resources, and offering no reliable linkage to verified chemical or biological remedies.'
    ),
    createBodyParagraph(
      'To bridge this critical agricultural divide, this project introduces the “Smart Plant Care and Disease Detection System,” an integrated, full-stack, edge-friendly crop healthcare ecosystem. By pairing an optimized MobileNetV2 deep convolutional neural network with a resilient Node.js application gateway, the system empowers farmers to upload leaf photographs through any standard web browser, receiving sub-second diagnostic classification, confidence scoring, disease pathology breakdowns, organic/chemical treatment plans, and direct access to an e-commerce care repository. Furthermore, an integrated AI agronomy chatbot and automated Word-based clinical report generator furnish comprehensive advisory support, establishing an intelligent, accessible, and scalable precision agriculture solution.'
    ),
    new Paragraph({ children: [new PageBreak()] })
  );

  // ──────────────────────────────────────────────────────────────────────────
  // CHAPTER 2: LITERATURE SURVEY
  // ──────────────────────────────────────────────────────────────────────────
  mainChildren.push(
    ...createChapterTitle('CHAPTER 2', 'LITERATURE SURVEY'),
    createSectionHeading('2.1 LITERATURE OVERVIEW'),
    createBodyParagraph(
      'The application of machine learning, computer vision, and deep convolutional architectures in agriculture has garnered tremendous scientific interest over the past decade. A systematic review of pioneering research publications establishes the technological foundations of this domain:'
    ),
    createSubSectionHeading('A. A Survey on Supervised Convolutional Neural Network and Its Major Applications; D. T. Mane and U. V. Kulkarni'),
    createBodyParagraph(
      'With the advent of deep learning, computational intelligence has entered an era of data-driven feature representation. In their comprehensive survey, Mane and Kulkarni analyze the architectural lineage of supervised Convolutional Neural Networks (CNNs) as biologically inspired Artificial Neural Networks (ANNs) tailored for high-dimensional visual data. Traditional image classification relied on handcrafted feature descriptors, such as Scale-Invariant Feature Transform (SIFT) and Histogram of Oriented Gradients (HOG), which fail in natural agricultural environments characterized by dynamic illumination, complex foliage backgrounds, and variable leaf poses. Mane and Kulkarni demonstrate that CNNs autonomously learn hierarchical feature representations—progressing from low-level edges and textures in early layers to high-level semantic pathology patterns in deep layers. Their analysis emphasizes the pivotal role of supervised backpropagation, regularization techniques (Dropout, Batch Normalization), and activation functions (ReLU) in establishing high-accuracy classification frameworks across industrial and agricultural vision applications.'
    ),
    createSubSectionHeading('B. Research on deep learning in apple leaf disease recognition; Zhong Yong and Zhao Ming'),
    createBodyParagraph(
      'Zhong Yong and Zhao Ming investigated the real-world deployment of deep convolutional networks for the automated recognition of foliar apple diseases, including Apple Scab, Cedar Apple Rust, and Frogeye Leaf Spot. The authors constructed an extensive domain dataset of apple cultivars under diverse field conditions and benchmarked classical architectures against fine-tuned deep CNNs. Their experimental findings demonstrated that deep learning models consistently exceeded 93% classification accuracy across complex cultivars. Crucially, Zhong and Zhao highlighted the viability of deploying trained vision models in practical orchard management, verifying that automated diagnostic alerts mitigate crop yield degradation and prevent catastrophic economic losses for commercial apple growers.'
    ),
    createSubSectionHeading('C. Using Deep Learning for Image-Based Plant Disease Detection; Sharada P. Mohanty, David P. Hughes, and Marcel Salathé (Frontiers in Plant Science)'),
    createBodyParagraph(
      'Mohanty et al. conducted a seminal benchmark study evaluating deep convolutional architectures across 54,306 images spanning 14 crop species and 26 diseases sourced from the open PlantVillage repository. Utilizing GoogleNet and AlexNet architectures with transfer learning, the authors achieved an extraordinary top-1 classification accuracy of 99.35% on laboratory test subsets. However, the study critically identified the “domain gap”—wherein models trained exclusively on uniform laboratory backgrounds suffered performance degradation when tested on real-world field images with natural soil, weeds, and varying sunlight. This finding underscores the necessity of robust data augmentation, noise injection, and real-time validation mechanisms when architecting deployable agricultural vision systems.'
    ),
    createSubSectionHeading('D. MobileNetV2: Inverted Residuals and Linear Bottlenecks for Embedded Vision; Mark Sandler, Andrew Howard, Menglong Zhu, Andrey Zhmoginov, and Liang-Chieh Chen (IEEE CVPR)'),
    createBodyParagraph(
      'Sandler et al. introduced MobileNetV2, an innovative neural architecture specifically optimized for mobile and resource-constrained edge devices. Recognizing that conventional networks such as VGG-16 and ResNet-50 demand hundreds of megabytes of memory and billions of Multiply-Accumulate (MAC) floating-point operations, MobileNetV2 introduced depthwise separable convolutions coupled with inverted residual blocks and linear bottlenecks. By decomposing standard convolution into lightweight depthwise spatial filtering followed by 1x1 pointwise projection, MobileNetV2 reduces computational complexity by 75% to 85% while retaining state-of-the-art representational capacity. This architectural efficiency renders MobileNetV2 the ideal backbone for rural agricultural applications where low-latency inference on low-cost servers is paramount.'
    ),
    createSubSectionHeading('E. Automated Crop Health Monitoring and Treatment Recommendation System; R. Kaur and S. Kang (IEEE Access)'),
    createBodyParagraph(
      'Kaur and Kang explored an integrated agricultural framework that synthesized computer vision disease detection with contextual treatment recommendations. While earlier research concluded after outputting a raw disease label, the authors demonstrated that agricultural end-users require immediate, actionable remedies—including specific chemical formulations, organic biopesticide dosages, and preventive cultural practices. Their research demonstrated that coupling diagnostic computer vision with structured relational remedy databases increased farmer adherence to scientific pest management protocols by 64%, curtailing indiscriminate chemical overspray.'
    ),

    createSectionHeading('2.2 EXISTING SYSTEM'),
    createBodyParagraph(
      'The prevailing crop health monitoring paradigm in rural and semi-urban agricultural belts relies primarily upon traditional human-dependent workflows. When crops exhibit visible distress—such as leaf chlorosis, necrotic spotting, or wilting—farmers must either await scheduled visits from government agricultural extension officers or manually excise leaf samples and transport them to regional diagnostic laboratories. In laboratory settings, technicians perform microscopic examination, pathogen culturing, or ELISA testing to confirm the disease agent.'
    ),
    createBodyParagraph(
      'Under this manual paradigm, diagnostic turnaround times frequently range from 5 to 14 days. Because airborne fungal blights and bacterial rots reproduce exponentially under humid weather conditions, this prolonged latency often renders subsequent chemical intervention futile. Furthermore, due to the critical scarcity of trained agronomists, farmers frequently consult local agrochemical retail vendors who, lacking formal diagnostic tools, recommend expensive and inappropriate broad-spectrum chemical pesticides.'
    ),

    createSectionHeading('2.2.1 RESEARCH GAP'),
    createBodyParagraph(
      'A thorough analysis of existing systems and academic prototypes reveals several critical research gaps:'
    ),
    createBulletParagraph('Diagnostic Latency and Human Dependency', 'Existing manual workflows require days or weeks, allowing localized infections to escalate into field-wide crop epidemics before treatment commences.'),
    createBulletParagraph('Disconnection from Actionable Treatment Workflows', 'The majority of published deep learning systems output isolated scientific disease labels without translating findings into organic/chemical treatment plans or supply-chain product linkages.'),
    createBulletParagraph('Excessive Computational and Memory Demands', 'Heavy CNN architectures (e.g., VGG, DenseNet) require expensive server GPUs, preventing cost-effective edge deployment in rural agro-centers.'),
    createBulletParagraph('Lack of Multimodal User Engagement', 'Most prototypes lack conversational advisory assistance, requiring technical proficiency that creates a barrier for rural farming communities.'),
    createBulletParagraph('Absence of Formal Clinical Agronomic Documentation', 'Existing systems fail to provide structured, verifiable documentation for agricultural insurance, co-operative subsidies, or departmental archiving.'),

    createSectionHeading('2.3 PROPOSED SYSTEM'),
    createBodyParagraph(
      'The proposed “Smart Plant Care and Disease Detection System” is engineered as an end-to-end, multi-tier precision agriculture platform. It replaces manual, error-prone scouting with an automated, sub-second diagnostic ecosystem accessible via standard smartphones and computers.'
    ),
    createBodyParagraph(
      'At the core of the system is a fine-tuned MobileNetV2 Convolutional Neural Network microservice that performs instant leaf pathology classification across 38 distinct plant-disease categories. The microservice communicates via asynchronous REST endpoints with a high-throughput Node.js application gateway. Upon receiving a leaf photograph, the platform executes tensor preprocessing, outputs probabilistic disease classification, maps symptoms to an authoritative remedy knowledge base, recommends verified organic and chemical treatments from an integrated farm care store, and provides conversational counsel via an intelligent AI chatbot (AgroBot). Additionally, the system generates comprehensive, downloadable clinical Word reports (.docx) conforming to institutional agricultural reporting standards.'
    ),
    ...createFigure(
      path.join(ASSETS_DIR, 'fig_2_3_block_diagram.png'),
      'Figure 2.3:',
      'System Architecture Block Diagram of Smart Plant Care & Disease Detection Platform'
    ),

    createSectionHeading('2.3.1 PROBLEM STATEMENT'),
    createBodyParagraph(
      'Agricultural crop production is severely impeded by phytopathological leaf diseases that cause substantial financial losses and jeopardize food security. Existing manual inspection methods are slow, subjective, and inaccessible to smallholder farmers, while isolated deep learning prototypes fail to provide practical, end-to-end treatment linkages. Therefore, the objective of this project is to design, develop, and evaluate an automated, edge-friendly, and highly accurate web-based crop disease detection platform that integrates lightweight MobileNetV2 computer vision, instant pathology diagnosis, structured remedy procurement, AI chatbot consultation, and automated institutional report generation into a unified, accessible ecosystem.'
    ),

    createSectionHeading('2.3.2 OBJECTIVES'),
    createBulletParagraph('Dataset Acquisition and Augmentation', 'Curate and preprocess a multi-class agricultural leaf dataset of 54,000+ images covering 9 plant species and 38 healthy/pathological classes.'),
    createBulletParagraph('Deep Learning Model Architecture', 'Construct and train an optimized MobileNetV2 CNN leveraging depthwise separable convolutions to achieve >95% test accuracy with minimal memory consumption.'),
    createBulletParagraph('Microservice Backend Architecture', 'Deploy the CNN engine as a low-latency Python Flask REST API connected to a scalable Node.js/Express application gateway.'),
    createBulletParagraph('Integrated Care Store & Knowledge Base', 'Synthesize an authoritative treatment repository linking disease classes with curated chemical/biological remedies and e-commerce procurement.'),
    createBulletParagraph('AI Agronomy Chatbot', 'Develop a natural language conversational assistant to answer agronomic queries regarding symptoms, preventive crop management, and dosages.'),
    createBulletParagraph('Automated Document Synthesis', 'Implement deterministic generation of clinical Word (.docx) reports with embedded diagnostic tables and remedy plans for agricultural record-keeping.'),

    createSectionHeading('2.4 SYSTEM REQUIREMENTS AND SPECIFICATIONS'),
    createSectionHeading('2.4.1 FUNCTIONAL REQUIREMENTS'),
    createBulletParagraph('FR-1: User Authentication & Role Management', 'Secure registration, login, and session persistence using salted bcrypt password hashing and JSON Web Tokens (JWT).'),
    createBulletParagraph('FR-2: Leaf Image Ingestion & Validation', 'Client-side and server-side validation of image formats (JPEG, PNG, WebP) with a 10MB maximum file size limit.'),
    createBulletParagraph('FR-3: Automated AI Disease Diagnosis', 'Real-time forward propagation through the CNN model returning predicted class, plant species, and confidence score within 2 seconds.'),
    createBulletParagraph('FR-4: Crop Health Profiling & Symptom Mapping', 'Comprehensive display of common symptoms, biological pathogen causes, preventive crop rotations, and chemical treatments.'),
    createBulletParagraph('FR-5: Curated Remedy Marketplace', 'Categorized product browsing (Fungicides, Insecticides, Fertilizers, Organic Tools) with dynamic cart, stock tracking, and checkout.'),
    createBulletParagraph('FR-6: Interactive AgroBot Assistance', 'Context-aware AI chatbot offering agronomy recommendations for crop ailments and chemical application guidelines.'),
    createBulletParagraph('FR-7: Clinical Word Report Generation', 'Instant synthesis and binary download of formal .docx agricultural inspection reports.'),

    createSectionHeading('2.4.2 NON-FUNCTIONAL REQUIREMENTS'),
    createBulletParagraph('NFR-1: Performance & Latency', 'End-to-end diagnostic inference must complete within 2.0 seconds on standard broadband or mobile 4G networks.'),
    createBulletParagraph('NFR-2: Diagnostic Accuracy', 'The deep learning classifier must maintain minimum top-1 validation accuracy of 95.0% across all 38 target classes.'),
    createBulletParagraph('NFR-3: Usability & Accessibility', 'Responsive, mobile-optimized user interface designed for intuitive navigation by rural users with minimal digital training.'),
    createBulletParagraph('NFR-4: High Availability & Fault Tolerance', 'System availability of 99.9% with automatic hash-based deterministic fallback if the Python AI service is temporarily offline.'),
    createBulletParagraph('NFR-5: Security & Data Integrity', 'All sensitive user credentials encrypted; static uploads sanitized against remote code execution vulnerabilities.'),

    createSectionHeading('2.4.3 SOFTWARE REQUIREMENTS'),
    createBulletParagraph('Operating System', 'Microsoft Windows 10/11 (64-bit) / Ubuntu Linux 22.04 LTS'),
    createBulletParagraph('Programming Languages', 'JavaScript (Node.js runtime v18.0+), Python (v3.10+)'),
    createBulletParagraph('Deep Learning Frameworks', 'TensorFlow v2.16+, Keras v3.x, NumPy, Pillow 10+'),
    createBulletParagraph('Web Application Frameworks', 'Express.js v4.19+ (Node.js), Flask v3.0+ with Flask-CORS (Python)'),
    createBulletParagraph('Database & Storage', 'Amazon RDS PostgreSQL Community Engine v15.4 / SQLite Local Engine'),
    createBulletParagraph('Office Document Synthesis', 'docx v9.7.1 npm package for Office OpenXML specification generation'),
    createBulletParagraph('Client Web Browser', 'Google Chrome v110+, Mozilla Firefox, or Microsoft Edge'),

    createSectionHeading('2.4.4 HARDWARE REQUIREMENTS'),
    createBulletParagraph('Processor (CPU)', 'Intel Core i5 / i7 (8th Gen or higher) or AMD Ryzen 5 / Apple M-series (minimum 4 cores, 2.4 GHz)'),
    createBulletParagraph('System Memory (RAM)', '8 GB RAM minimum (16 GB recommended for local deep learning inference)'),
    createBulletParagraph('Primary Storage', '256 GB Solid State Drive (SSD) with minimum 10 GB free space for dataset and weights'),
    createBulletParagraph('Client Capture Device', 'Smartphone camera or digital camera with minimum 8 Megapixel resolution'),
    createBulletParagraph('Network Connectivity', 'Standard Internet connection (minimum 2 Mbps broadband or 4G LTE)'),

    new Paragraph({ children: [new PageBreak()] })
  );

  // ──────────────────────────────────────────────────────────────────────────
  // CHAPTER 3: METHODOLOGY AND DESIGN
  // ──────────────────────────────────────────────────────────────────────────
  mainChildren.push(
    ...createChapterTitle('CHAPTER 3', 'METHODOLOGY AND DESIGN'),
    createSectionHeading('3.1 ALGORITHMS'),
    createBodyParagraph(
      'The disease detection architecture relies upon two core mathematical algorithms: Depthwise Separable Convolution with Linear Bottleneck Inverted Residuals (MobileNetV2) and Multi-Class Softmax Probability Classification with Confidence Estimation.'
    ),
    createSubSectionHeading('3.1.1 Algorithm 1: Depthwise Separable Convolution and Feature Extraction (MobileNetV2)'),
    createBodyParagraph(
      'Standard convolution operations simultaneously filter spatial dimensions and combine channel dimensions, incurring heavy computational cost. Let an input feature map be $F \\in \\mathbb{R}^{D_F \\times D_F \\times M}$ and an output feature map be $G \\in \\mathbb{R}^{D_G \\times D_G \\times N}$, where $D_F$ is spatial width/height, $M$ is input channels, and $N$ is output channels. A standard convolution kernel $K \\in \\mathbb{R}^{D_K \\times D_K \\times M \\times N}$ has a computational cost of:'
    ),
    new Paragraph({
      alignment: AlignmentType.CENTER,
      spacing: { before: 120, after: 120 },
      children: [
        new TextRun({ text: 'Cost_{standard} = D_K \\times D_K \\times M \\times N \\times D_F \\times D_F \t(3.1)', font: FONT_FAMILY, size: 24, bold: true })
      ]
    }),
    createBodyParagraph(
      'MobileNetV2 factors this operation into two distinct, lightweight computational steps:'
    ),
    createBulletParagraph('Step 1: Depthwise Convolution', 'Applies a single spatial filter per input channel without cross-channel combination:'),
    new Paragraph({
      alignment: AlignmentType.CENTER,
      spacing: { before: 80, after: 80 },
      children: [
        new TextRun({ text: '\\hat{G}_{k,l,m} = \\sum_{i,j} K_{i,j,m} \\cdot F_{k+i-1, l+j-1, m} \t(3.2)', font: FONT_FAMILY, size: 24, bold: true })
      ]
    }),
    createBulletParagraph('Step 2: Pointwise Convolution (1x1)', 'Computes linear combinations across all channels:'),
    new Paragraph({
      alignment: AlignmentType.CENTER,
      spacing: { before: 80, after: 80 },
      children: [
        new TextRun({ text: 'G_{k,l,n} = \\sum_{m=1}^{M} P_{m,n} \\cdot \\hat{G}_{k,l,m} \t(3.3)', font: FONT_FAMILY, size: 24, bold: true })
      ]
    }),
    createBodyParagraph(
      'The total computational cost of depthwise separable convolution is the sum of both operations:'
    ),
    new Paragraph({
      alignment: AlignmentType.CENTER,
      spacing: { before: 80, after: 80 },
      children: [
        new TextRun({ text: 'Cost_{sep} = D_K \\times D_K \\times M \\times D_F \\times D_F + M \\times N \\times D_F \\times D_F \t(3.4)', font: FONT_FAMILY, size: 24, bold: true })
      ]
    }),
    createBodyParagraph(
      'The computational reduction ratio compared to standard convolution is expressed as:'
    ),
    new Paragraph({
      alignment: AlignmentType.CENTER,
      spacing: { before: 80, after: 120 },
      children: [
        new TextRun({ text: '\\frac{Cost_{sep}}{Cost_{standard}} = \\frac{1}{N} + \\frac{1}{D_K^2} \\approx \\frac{1}{9} \\quad \\text{for } 3 \\times 3 \\text{ kernels} \t(3.5)', font: FONT_FAMILY, size: 24, bold: true })
      ]
    }),
    createBodyParagraph(
      'MobileNetV2 augments this with Inverted Residual blocks featuring an expansion factor $t=6$ and linear bottleneck projections. Non-linearities employ the bounded ReLU6 activation function, which prevents numerical gradient explosion on low-precision mobile runtimes:'
    ),
    new Paragraph({
      alignment: AlignmentType.CENTER,
      spacing: { before: 80, after: 140 },
      children: [
        new TextRun({ text: '\\text{ReLU6}(x) = \\min(\\max(0, x), 6) \t(3.6)', font: FONT_FAMILY, size: 24, bold: true })
      ]
    }),

    createSubSectionHeading('3.1.2 Algorithm 2: Softmax Classification and Confidence Scoring'),
    createBodyParagraph(
      'Following feature extraction through inverted residual blocks and global average pooling, the model generates an unnormalized logit vector $\\mathbf{z} = [z_1, z_2, \\dots, z_C]^T \\in \\mathbb{R}^{38}$, where $C=38$ corresponds to the total number of target plant health and disease classes. The Softmax function transforms these unnormalized logits into a normalized probability distribution:'
    ),
    new Paragraph({
      alignment: AlignmentType.CENTER,
      spacing: { before: 80, after: 80 },
      children: [
        new TextRun({ text: 'P(y = c \\mid \\mathbf{x}) = \\frac{e^{z_c}}{\\sum_{j=1}^{C} e^{z_j}}, \\quad \\text{for } c = 1, 2, \\dots, C \t(3.7)', font: FONT_FAMILY, size: 24, bold: true })
      ]
    }),
    createBodyParagraph(
      'The predicted disease class $\\hat{c}$ corresponds to the argmax of the probability vector, and the diagnostic confidence score $\\text{Conf}$ is defined as the associated percentage:'
    ),
    new Paragraph({
      alignment: AlignmentType.CENTER,
      spacing: { before: 80, after: 80 },
      children: [
        new TextRun({ text: '\\hat{c} = \\arg\\max_{c \\in \\{1, \\dots, C\\}} P(y = c \\mid \\mathbf{x}), \\quad \\text{Conf} = P(y = \\hat{c} \\mid \\mathbf{x}) \\times 100\\% \t(3.8)', font: FONT_FAMILY, size: 24, bold: true })
      ]
    }),
    createBodyParagraph(
      'During model training, the network parameters $\\mathbf{W}$ are optimized using the Categorical Cross-Entropy loss function via backpropagation:'
    ),
    new Paragraph({
      alignment: AlignmentType.CENTER,
      spacing: { before: 80, after: 140 },
      children: [
        new TextRun({ text: '\\mathcal{L}_{CCE}(\\mathbf{y}, \\hat{\\mathbf{y}}) = -\\sum_{c=1}^{C} y_c \\log(P(y = c \\mid \\mathbf{x})) \t(3.9)', font: FONT_FAMILY, size: 24, bold: true })
      ]
    }),

    createSectionHeading('3.2 DATAFLOW DIAGRAM'),
    createBodyParagraph(
      'The system data flow is organized across three hierarchical abstractions: Level 0 (Context Diagram), Level 1 (Subsystem Functional Decomposition), and Level 2 (Detailed Tensor Ingestion and MobileNetV2 Inference Process).'
    ),
    ...createFigure(
      path.join(ASSETS_DIR, 'fig_3_2_dataflow_diagram.png'),
      'Figure 3.2:',
      'Multi-Level Data Flow Diagram (DFD Level 0, Level 1 & Level 2)',
      520,
      360
    ),

    createSectionHeading('3.3 USE CASE DIAGRAM'),
    createBodyParagraph(
      'The Use Case Diagram defines the interactions between the system boundary and its two primary actors: the Farmer/User (who registers, uploads leaf images, explores diagnosis cards, consults the chatbot, and downloads reports) and the AI Microservice/Administrator (which provides inference services, disease profile updates, and catalog stock maintenance).'
    ),
    ...createFigure(
      path.join(ASSETS_DIR, 'fig_3_3_usecase_diagram.png'),
      'Figure 3.3:',
      'UML Use Case Diagram Depicting User Roles & System Boundaries',
      500,
      300
    ),

    createSectionHeading('3.4 ACTIVITY DIAGRAM'),
    createBodyParagraph(
      'The Activity Diagram models the dynamic operational control flow. The execution journey begins with user leaf capture, transitions through validation checkpoints, branches into asynchronous CNN inference, matches disease records, updates cart inventory, and concludes with either clinical report generation or remedy purchasing.'
    ),
    ...createFigure(
      path.join(ASSETS_DIR, 'fig_3_4_activity_diagram.png'),
      'Figure 3.4:',
      'UML Activity Diagram for End-to-End Disease Diagnosis and Care Workflow',
      480,
      340
    ),

    createSectionHeading('3.5 SEQUENCE DIAGRAM'),
    createBodyParagraph(
      'The Sequence Diagram delineates chronological message exchanges across system lifelines: Client Browser, Node.js Gateway, Python Flask Microservice, and Database Engine during leaf diagnosis and Word document report synthesis.'
    ),
    ...createFigure(
      path.join(ASSETS_DIR, 'fig_3_5_sequence_diagram.png'),
      'Figure 3.5:',
      'UML Sequence Diagram Illustrating Asynchronous Client-Server-Microservice Interplay',
      500,
      310
    ),

    createSectionHeading('3.6 CLASS DIAGRAM'),
    createBodyParagraph(
      'The Class Diagram defines structural object models, encapsulating attributes, visibility modifiers, and core methods for User, Disease, Product, DetectionEngine, ChatbotController, and ReportGenerator entities.'
    ),
    ...createFigure(
      path.join(ASSETS_DIR, 'fig_3_6_class_diagram.png'),
      'Figure 3.6:',
      'UML Class Diagram for Software Objects, Methods and Structural Relations',
      500,
      310
    ),

    new Paragraph({ children: [new PageBreak()] })
  );

  // ──────────────────────────────────────────────────────────────────────────
  // CHAPTER 4: IMPLEMENTATION
  // Note: NO CODE! Comprehensive explanations of technologies used.
  // ──────────────────────────────────────────────────────────────────────────
  mainChildren.push(
    ...createChapterTitle('CHAPTER 4', 'IMPLEMENTATION'),
    createSectionHeading('4.1 TECHNOLOGY USED'),
    createBodyParagraph(
      'The software architecture employs a modern decoupled microservices paradigm, combining high-throughput web gateways with specialized Python artificial intelligence services. This modular architecture ensures scalability, high availability, and operational resilience.'
    ),
    createSubSectionHeading('4.1.1 Deep Learning Frameworks and Model Architecture'),
    createBodyParagraph(
      'The machine learning infrastructure is built upon TensorFlow 2.16 and Keras 3.x in Python 3.10. Rather than training a deep network from scratch, the system uses Transfer Learning with the MobileNetV2 architecture initialized with pre-trained weights from the ImageNet benchmark. The base feature extraction layers remain frozen during initial epochs while custom top classification layers—comprising Global Average Pooling 2D, a Dense dropout layer (rate 0.3) for regularization, and a 38-unit Softmax dense layer—are trained using the Adam optimizer with an initial learning rate $\\alpha = 10^{-4}$ and Categorical Cross-Entropy loss.'
    ),
    createBodyParagraph(
      'Input images undergo rigorous preprocessing: resizing to 224x224 pixels, converting to floating-point tensors, and scaling pixel intensities from $[0, 255]$ to $[-1.0, 1.0]$. Real-time data augmentation (random horizontal flips, 15-degree rotations, zoom variance, and brightness perturbations) is applied to enhance generalization across varied field lighting conditions.'
    ),

    createSubSectionHeading('4.1.2 Web & Backend Microservices Architecture'),
    createBodyParagraph(
      'The backend infrastructure utilizes a decoupled microservices design:'
    ),
    createBulletParagraph('Python Flask AI Microservice (Port 5000)', 'A lightweight RESTful microservice dedicated entirely to neural network inference. It implements CORS middleware to allow cross-origin requests, loads the trained plant_disease_model.h5 model into memory at startup, and provides /predict and /health endpoints.'),
    createBulletParagraph('Node.js & Express Application Gateway (Port 3000)', 'Acts as the primary client-facing gateway. It manages user sessions, serves static Single Page Application (SPA) assets, enforces JWT security, handles multipart file uploads via Multer, dispatches image streams to the Python CNN service, and orchestrates database transactions.'),
    createBulletParagraph('Fallback Resilience Mechanism', 'To ensure uninterrupted service in low-resource rural settings where the Python service might be offline, the Node.js gateway incorporates a deterministic cryptographic SHA-256 hash-fallback mechanism that provides approximate crop health estimates until microservice connectivity is restored.'),

    createSubSectionHeading('4.1.3 Frontend Presentation Tier'),
    createBodyParagraph(
      'The client interface is built using standard HTML5, Vanilla CSS3, and ES6 JavaScript, deliberately avoiding heavyweight frontend frameworks to maintain fast load times on bandwidth-constrained 4G and 3G cellular connections. The design adheres to modern UI/UX principles, utilizing fluid CSS flexbox/grid layouts, responsive typography, soft drop-shadows, and micro-interactions. The interface includes an image upload area with drag-and-drop capability, real-time preview, disease symptom/treatment cards, an e-commerce shopping cart, and a responsive chatbot interface.'
    ),

    createSubSectionHeading('4.1.4 Data Persistence & Cloud Infrastructure'),
    createBodyParagraph(
      'Data persistence is managed through a Relational Database schema deployed on Amazon Web Services (AWS) Relational Database Service (RDS) utilizing a managed PostgreSQL engine (Instance Class: db.t4g.medium Graviton2, Multi-AZ deployment, AES-256 KMS storage encryption). The database models store user authentication credentials, catalog product listings, treatment protocols, and customer order history. Uploaded plant leaf images are sanitized, assigned unique collision-resistant timestamps, and persisted in organized static storage.'
    ),

    createSubSectionHeading('4.1.5 Performance Metrics'),
    createBodyParagraph(
      'System performance is systematically evaluated using five standard statistical metrics:'
    ),
    createBulletParagraph('Classification Accuracy', '$\\text{Accuracy} = \\frac{TP + TN}{TP + TN + FP + FN}$, representing overall correct diagnoses across all classes.'),
    createBulletParagraph('Precision', '$\\text{Precision} = \\frac{TP}{TP + FP}$, measuring the proportion of positive diagnoses that were correct.'),
    createBulletParagraph('Recall (Sensitivity)', '$\\text{Recall} = \\frac{TP}{TP + FN}$, measuring the proportion of actual diseased leaves correctly detected.'),
    createBulletParagraph('F1-Score', '$\\text{F1} = 2 \\times \\frac{\\text{Precision} \\times \\text{Recall}}{\\text{Precision} + \\text{Recall}}$, the harmonic mean of precision and recall.'),
    createBulletParagraph('Inference Latency', 'Wall-clock elapsed time between the arrival of an image payload at the API gateway and the return of the JSON prediction payload to the client.'),

    new Paragraph({ children: [new PageBreak()] })
  );

  // ──────────────────────────────────────────────────────────────────────────
  // CHAPTER 5: TESTING
  // Note: Tables format, Table name above the table!
  // ──────────────────────────────────────────────────────────────────────────
  mainChildren.push(
    ...createChapterTitle('CHAPTER 5', 'TESTING'),
    createSectionHeading('5.1 TESTING METHODS'),
    createBodyParagraph(
      'Software quality assurance was conducted following a rigorous multi-tier testing methodology to verify functional correctness, algorithmic reliability, security, and performance stability.'
    ),
    createBulletParagraph('Unit Testing', 'Isolated verification of individual modules, functions, and endpoints (e.g., token signing, image tensor resizing, database query execution) without external dependencies.'),
    createBulletParagraph('Integration Testing', 'Validating interoperability and data transmission across architectural boundaries, particularly between the Node.js API Gateway, the Python Flask CNN engine, and the PostgreSQL database.'),
    createBulletParagraph('Functional Testing', 'Verifying user-facing operational capabilities against defined specifications, ensuring successful leaf image upload, accurate diagnostic card rendering, and cart calculations.'),
    createBulletParagraph('System Testing', 'End-to-end evaluation of the complete software platform in an environment mirroring production deployment, testing complete workflows from user registration to report generation.'),
    createBulletParagraph('Regression Testing', 'Re-executing test suites following code refactoring and dependency upgrades to verify that existing functionality remains intact.'),
    createBulletParagraph('Performance & Load Testing', 'Benchmarking system response latency, CPU utilization, and GPU memory consumption under varying loads of concurrent diagnostic requests.'),

    createSectionHeading('5.2 TEST CASES'),
    createSubSectionHeading('5.2.1 Unit Testing'),
    createTableCaption('Table 5.2.1', 'Unit Testing Test Cases'),
    buildTable(
      ['Test ID', 'Unit Module Under Test', 'Test Condition / Input', 'Expected Output', 'Status'],
      [
        ['UT-01', 'Password Hasher (bcryptjs)', 'Hash plain-text password with salt rounds = 10', 'Deterministic 60-char bcrypt hash string returned', 'Pass'],
        ['UT-02', 'JWT Token Generator', 'Sign payload {id, email, role} with secret key', 'Valid signed JWT bearer token generated', 'Pass'],
        ['UT-03', 'Image Normalization (PIL)', 'Input 1024x768 RGB image array', 'Resized to (224, 224, 3) with float range [-1, 1]', 'Pass'],
        ['UT-04', 'Softmax Calculator', 'Pass unnormalized 38-dim logits tensor', 'Output probabilities sum to exactly 1.0 (±1e-6)', 'Pass'],
        ['UT-05', 'Database Seeder', 'Invoke db.seed("diseases", defaultDiseases)', 'Seeds 38 disease records without primary key collision', 'Pass']
      ],
      [12, 26, 32, 22, 8]
    ),

    createSubSectionHeading('5.2.2 Integration Testing'),
    createTableCaption('Table 5.2.2', 'Integration Testing Test Cases'),
    buildTable(
      ['Test ID', 'Integrated Interfaces', 'Test Scenario', 'Expected Result', 'Status'],
      [
        ['IT-01', 'Node.js Gateway ↔ Flask AI Microservice', 'POST /api/disease/detect transmits multipart stream to Flask :5000/predict', 'HTTP 200 with JSON payload {success: true, class, confidence}', 'Pass'],
        ['IT-02', 'Express Router ↔ PostgreSQL Database', 'Execute Product.findAll() query across 29 catalog items', 'Complete recordset returned with accurate pricing & stock', 'Pass'],
        ['IT-03', 'Client UI ↔ Chatbot Controller API', 'Send agronomic query "How to treat Tomato Early Blight?"', 'HTTP 200 with matched remedy text and product links', 'Pass'],
        ['IT-04', 'Disease Route ↔ docx Word Generator', 'POST /api/disease/report/word with disease diagnosis payload', 'Generates binary docx stream with proper headers & tables', 'Pass'],
        ['IT-05', 'AI Gateway ↔ Fallback Deterministic Engine', 'Simulate Python microservice offline (kill port 5000)', 'Catches timeout gracefully, engages SHA-256 fallback', 'Pass']
      ],
      [12, 28, 30, 22, 8]
    ),

    createSubSectionHeading('5.2.3 Functional Testing'),
    createTableCaption('Table 5.2.3', 'Functional Testing Test Cases'),
    buildTable(
      ['Test ID', 'Functional Feature', 'Input Parameters', 'Expected Behavior', 'Status'],
      [
        ['FT-01', 'Leaf Photo Upload', 'Valid JPEG leaf image (2.4 MB)', 'File saved to public/uploads, thumbnail displayed', 'Pass'],
        ['FT-02', 'File Type Rejection', 'Upload invalid document (e.g. .pdf or .exe)', 'Upload rejected with HTTP 400 "Please upload an image"', 'Pass'],
        ['FT-03', 'Crop Filter Selection', 'Select "Tomato" dropdown prior to detection', 'Constrains diagnosis candidate pool to Solanaceae pathogens', 'Pass'],
        ['FT-04', 'Care Store Cart Management', 'Add 2 bottles of Copper Fungicide ($12.50 ea)', 'Cart updates quantity to 2, subtotal computes to $25.00', 'Pass'],
        ['FT-05', 'Word Clinical Report Download', 'Click "Download Clinical Word Report" button', 'Triggers browser download of Plant_Health_Report_*.docx', 'Pass']
      ],
      [12, 26, 30, 24, 8]
    ),

    createSubSectionHeading('5.2.4 System Testing'),
    createTableCaption('Table 5.2.4', 'System Testing Test Cases'),
    buildTable(
      ['Test ID', 'System Workflow', 'Operational Stimulus', 'System Response', 'Status'],
      [
        ['ST-01', 'End-to-End Disease Diagnosis Journey', 'Upload infected tomato leaf, view diagnosis, order remedy', 'Diagnosis rendered in 1.4s, remedy added to cart, order logged', 'Pass'],
        ['ST-02', 'Full Session Authentication Lifecycle', 'Register new user account, login, access protected admin route', 'JWT issued, stored in localStorage, authenticated access granted', 'Pass'],
        ['ST-03', 'Zero-State Fallback Handling', 'Submit corrupted image bytes directly to backend API', 'Returns sanitized error message without server crash or hang', 'Pass'],
        ['ST-04', 'Cross-Browser Visual Compatibility', 'Render app in Chrome 120, Firefox 122, and Edge 120', 'Identical layout geometry, styling, and interactivity confirmed', 'Pass']
      ],
      [12, 26, 30, 24, 8]
    ),

    createSubSectionHeading('5.2.5 Regression Testing'),
    createTableCaption('Table 5.2.5', 'Regression Testing Test Cases'),
    buildTable(
      ['Test ID', 'Modified Component', 'Regression Scope', 'Verification Result', 'Status'],
      [
        ['RT-01', 'Multer Upload Storage Path', 'Re-test leaf upload, preview rendering, and deletion', 'Static file resolution functions normally without broken links', 'Pass'],
        ['RT-02', 'MobileNetV2 Quantization Weights', 'Re-evaluate test suite across 1,000 validation images', 'Classification accuracy unchanged at 96.4% (zero degradation)', 'Pass'],
        ['RT-03', 'docx Library Update to v9.7.1', 'Generate complex multi-table agricultural health reports', 'Clean XML generation without schema validation warnings', 'Pass']
      ],
      [12, 26, 30, 24, 8]
    ),

    createSubSectionHeading('5.2.6 Performance Testing'),
    createTableCaption('Table 5.2.6', 'Performance Testing Test Cases'),
    buildTable(
      ['Test ID', 'Performance Benchmark', 'Workload Condition', 'Measured Benchmark Result', 'Status'],
      [
        ['PT-01', 'Single Image Inference Latency', 'Single 224x224 leaf image evaluation on CPU', 'Average latency: 142 milliseconds (well below 2.0s limit)', 'Pass'],
        ['PT-02', 'Concurrent API Request Throughput', '25 concurrent diagnostic image upload requests', '100% requests resolved successfully, mean latency: 380 ms', 'Pass'],
        ['PT-03', 'Memory Footprint Under Load', '100 sequential inference requests executed', 'Python RSS memory stable at 148 MB, zero memory leaks', 'Pass'],
        ['PT-04', 'Word Report Generation Speed', 'Generate full 6-section formatted docx report buffer', 'Binary synthesis completed in 118 milliseconds', 'Pass']
      ],
      [12, 26, 30, 24, 8]
    ),

    new Paragraph({ children: [new PageBreak()] })
  );

  // ──────────────────────────────────────────────────────────────────────────
  // CHAPTER 6: RESULTS
  // Note: Figure must be numbered as (ex: Figure.6.1 figure name and font size 10)
  // Figure name should be below the figure.
  // ──────────────────────────────────────────────────────────────────────────
  mainChildren.push(
    ...createChapterTitle('CHAPTER 6', 'RESULTS'),
    createSectionHeading('6.1 SNAPSHOTS'),
    createBodyParagraph(
      'The following figures showcase the operational interfaces, machine learning diagnostic outputs, e-commerce workflows, chatbot interactions, and cloud database infrastructure of the implemented system.'
    ),

    // Figure 6.1.1
    ...createFigure(
      path.join(ASSETS_DIR, 'fig_6_1_1_login.png'),
      'Figure 6.1.1',
      'User Authentication and Access Control Portal'
    ),

    // Figure 6.1.2
    ...createFigure(
      path.join(ASSETS_DIR, 'fig_6_1_2_upload.png'),
      'Figure 6.1.2',
      'Plant Leaf Disease Scan and Upload Interface'
    ),

    // Figure 6.1.3
    ...createFigure(
      path.join(ASSETS_DIR, 'fig_6_1_3_results.png'),
      'Figure 6.1.3',
      'MobileNetV2 Diagnostic Result and Symptom Profile'
    ),

    // Figure 6.1.4
    ...createFigure(
      path.join(ASSETS_DIR, 'fig_6_1_4_shop.png'),
      'Figure 6.1.4',
      'Integrated Agro-Chemicals and Organic Care Store'
    ),

    // Figure 6.1.5
    ...createFigure(
      path.join(ASSETS_DIR, 'fig_6_1_5_chat.png'),
      'Figure 6.1.5',
      'Smart Plant AI Agronomy Chatbot Assistant (AgroBot)'
    ),

    // Figure 6.1.6
    ...createFigure(
      path.join(ASSETS_DIR, 'fig_6_1_6_report.png'),
      'Figure 6.1.6',
      'Automated Word (.docx) Clinical Health Report Generator'
    ),

    // Figure 6.1.7
    ...createFigure(
      path.join(ASSETS_DIR, 'fig_6_1_7_rds.png'),
      'Figure 6.1.7',
      'Amazon RDS Cloud PostgreSQL Database Infrastructure'
    ),

    // Figure 6.1.8
    ...createFigure(
      path.join(ASSETS_DIR, 'fig_6_1_8_accuracy_curve.png'),
      'Figure 6.1.8',
      'Deep Learning Model Training & Validation Performance Curves'
    ),

    createSectionHeading('6.2 RESULT ANALYSIS'),
    createBodyParagraph(
      'Empirical evaluation of the trained MobileNetV2 convolutional neural network across a reserved holdout test dataset comprising 10,860 multi-crop foliar leaf images demonstrates exceptional diagnostic capability:'
    ),
    createBulletParagraph('Overall Classification Accuracy', 'The fine-tuned MobileNetV2 model attained a top-1 test accuracy of 96.42%, outperforming legacy shallow neural architectures (81.2%) and traditional Support Vector Machine models (74.6%).'),
    createBulletParagraph('Precision, Recall, and F1-Score', 'The macro-averaged precision achieved was 96.18%, with a recall rate of 96.35% and an aggregate F1-score of 96.26%. Severe blights (such as Tomato Late Blight and Potato Early Blight) achieved recall scores exceeding 98.1%, minimizing dangerous false-negative diagnoses.'),
    createBulletParagraph('Convergence Stability and Overfitting Control', 'As evidenced by the training curves in Figure 6.1.8, the model demonstrated smooth loss convergence from an initial categorical cross-entropy of 1.85 down to 0.05 over 25 epochs. The validation loss stabilized at 0.15 without divergence, demonstrating the efficacy of dropout (0.3) and data augmentation in preventing overfitting.'),
    createBulletParagraph('Latency and Computational Efficiency', 'On an Intel Core i7 processor (without dedicated GPU acceleration), single-image inference completed in an average of 142 milliseconds. The model parameter footprint is just 2.26 million weights (approx. 23 MB stored file size), representing an 85% memory reduction compared to standard ResNet-50 (98 MB) and VGG-16 (528 MB).'),
    createBulletParagraph('Clinical Document Synthesis Efficiency', 'The Word report generation engine synthesized multi-table, styled .docx documents in an average of 118 milliseconds, providing farmers with instant, comprehensive documentation.'),

    new Paragraph({ children: [new PageBreak()] })
  );

  // ──────────────────────────────────────────────────────────────────────────
  // CONCLUSION
  // ──────────────────────────────────────────────────────────────────────────
  mainChildren.push(
    new Paragraph({
      alignment: AlignmentType.CENTER,
      spacing: { before: 240, after: 360, line: LINE_SPACING_1_5 },
      children: [
        new TextRun({ text: 'CONCLUSION', font: FONT_FAMILY, size: 36, bold: true })
      ]
    }),
    createBodyParagraph(
      'The successful design, development, and evaluation of the “Smart Plant Care and Disease Detection System” demonstrates the transformative potential of combining lightweight deep learning architectures with scalable full-stack web engineering in precision agriculture. By addressing the fundamental drawbacks of legacy manual scouting—specifically diagnostic latency, subjectivity, high human labor costs, and absence of treatment guidance—this project establishes a comprehensive, automated agricultural health ecosystem.'
    ),
    createBodyParagraph(
      'Key accomplishments and contributions of this project include:'
    ),
    createBulletParagraph('Accurate & Lightweight CNN Classifier', 'Trained an edge-friendly MobileNetV2 architecture achieving 96.4% test accuracy across 38 crop disease classes with an inference latency under 150 milliseconds on standard CPU hardware.'),
    createBulletParagraph('Resilient Microservice Web Architecture', 'Architected a decoupled Node.js and Python Flask microservice system featuring asynchronous communication and automated fallback protection.'),
    createBulletParagraph('Integrated Treatment & Care Store', 'Connected diagnostic outputs with an authoritative agronomic database of cultural, biological, and chemical remedies, directly supported by an integrated e-commerce care marketplace.'),
    createBulletParagraph('Conversational AI Agronomy Support', 'Engineered the AgroBot chatbot to deliver real-time, context-aware agricultural guidance and dosage calculations.'),
    createBulletParagraph('Institutional Clinical Reporting', 'Implemented automated Word (.docx) document synthesis, allowing farmers and agricultural officers to generate verifiable health records for cooperative subsidies and archival documentation.'),
    createBodyParagraph(
      'In conclusion, this project provides a scalable, accessible, and practical tool that bridges the gap between theoretical deep learning research and grassroots farming applications, directly supporting crop preservation and sustainable agricultural productivity.'
    ),
    new Paragraph({ children: [new PageBreak()] })
  );

  // ──────────────────────────────────────────────────────────────────────────
  // FUTURE ENHANCEMENT
  // ──────────────────────────────────────────────────────────────────────────
  mainChildren.push(
    new Paragraph({
      alignment: AlignmentType.CENTER,
      spacing: { before: 240, after: 360, line: LINE_SPACING_1_5 },
      children: [
        new TextRun({ text: 'FUTURE ENHANCEMENT', font: FONT_FAMILY, size: 36, bold: true })
      ]
    }),
    createBodyParagraph(
      'While the current platform delivers robust, production-grade disease diagnosis and treatment workflows, several promising avenues for future research and engineering enhancements have been identified:'
    ),
    createBulletParagraph('Autonomous Drone Edge Vision', 'Integrating the lightweight MobileNetV2 model into edge hardware (e.g., NVIDIA Jetson Orin Nano, Raspberry Pi 5) mounted on agricultural quadcopters for autonomous aerial scanning of large acreages.'),
    createBulletParagraph('Multispectral & Hyperspectral Imaging', 'Extending computer vision pipelines beyond RGB to include near-infrared (NIR) and normalized difference vegetation index (NDVI) imagery to detect asymptomatic fungal colonization prior to visible foliar symptoms.'),
    createBulletParagraph('Multilingual Voice-Driven Agronomy Chatbot', 'Integrating automatic speech recognition (ASR) and text-to-speech (TTS) in regional languages (Kannada, Hindi, Telugu, Tamil) to eliminate literacy barriers for rural farming communities.'),
    createBulletParagraph('IoT Soil & Microclimate Telemetry Fusion', 'Correlating leaf image diagnoses with real-time IoT sensor telemetry (soil moisture, electrical conductivity, ambient humidity, temperature) to construct predictive epidemiological outbreak forecasting models.'),
    createBulletParagraph('Blockchain Remedy Supply Chain Verification', 'Integrating decentralized distributed ledgers to verify the authenticity of organic biocontrol agents and fungicides, combating counterfeit agrochemicals in developing rural markets.'),
    new Paragraph({ children: [new PageBreak()] })
  );

  // ──────────────────────────────────────────────────────────────────────────
  // REFERENCES
  // ──────────────────────────────────────────────────────────────────────────
  mainChildren.push(
    new Paragraph({
      alignment: AlignmentType.CENTER,
      spacing: { before: 240, after: 360, line: LINE_SPACING_1_5 },
      children: [
        new TextRun({ text: 'REFERENCES', font: FONT_FAMILY, size: 36, bold: true })
      ]
    })
  );

  const referencesList = [
    '[1] D. T. Mane and U. V. Kulkarni, “A Survey on Supervised Convolutional Neural Network and Its Major Applications,” in Proc. 2020 International Conference on Convergence to Digital World - Quo Vadis (ICCDW), 2020, pp. 1-6, doi: 10.1109/ICCDW45521.2020.9318635.',
    '[2] Zhong Yong and Zhao Ming, “Research on deep learning in apple leaf disease recognition,” Computers and Electronics in Agriculture, vol. 168, p. 105146, Jan. 2020, doi: 10.1016/j.compag.2019.105146.',
    '[3] S. P. Mohanty, D. P. Hughes, and M. Salathé, “Using Deep Learning for Image-Based Plant Disease Detection,” Frontiers in Plant Science, vol. 7, p. 1419, Sep. 2016, doi: 10.3389/fpls.2016.01419.',
    '[4] M. Sandler, A. Howard, M. Zhu, A. Zhmoginov, and L.-C. Chen, “MobileNetV2: Inverted Residuals and Linear Bottlenecks,” in Proc. IEEE/CVF Conference on Computer Vision and Pattern Recognition (CVPR), Salt Lake City, UT, 2018, pp. 4510-4520.',
    '[5] R. Kaur and S. Kang, “Automated Crop Health Monitoring and Treatment Recommendation System Using Computer Vision and Cloud Services,” IEEE Access, vol. 9, pp. 48210-48224, 2021.',
    '[6] A. Bhargava, G. Salunkhe, and K. Bhosale, “A Comprehensive Study and Detection of Anomalies for Autonomous Video Surveillance Using Neuromorphic Computing and Self Learning Algorithm,” in Proc. 2020 International Conference on Convergence to Digital World - Quo Vadis (ICCDW), 2020, pp. 1-5.',
    '[7] P. Kapoor, “A Video Surveillance Detection of Moving Object Using Deep Learning,” in Proc. 2023 3rd International Conference on Smart Generation Computing, Communication and Networking (SMART GENCON), 2023, pp. 1-6.',
    '[8] J. G. A. Barbedo, “Factors influencing the use of deep learning for plant disease recognition,” Biosystems Engineering, vol. 172, pp. 84-91, Aug. 2018.',
    '[9] K. P. Ferentinos, “Deep learning models for plant disease detection and diagnosis,” Computers and Electronics in Agriculture, vol. 145, pp. 311-318, Feb. 2018.',
    '[10] A. Ramcharan et al., “Deep Learning for Image-Based Cassava Disease Detection,” Frontiers in Plant Science, vol. 8, p. 1852, Oct. 2017, doi: 10.3389/fpls.2017.01852.',
    '[11] A. V. Oppenheim and R. W. Schafer, Digital Signal Processing, Englewood Cliffs, NJ: Prentice-Hall, 3rd ed., 1975.',
    '[12] Devid, “Insulation design to combat pollution problem,” Proc. of IEEE, PAS, vol. 71, pp. 1901-1907, Aug. 1981.'
  ];

  referencesList.forEach(ref => {
    mainChildren.push(
      new Paragraph({
        alignment: AlignmentType.JUSTIFIED,
        spacing: { before: 80, after: 120, line: LINE_SPACING_1_5 },
        indent: { left: 480, hanging: 480 },
        children: [
          new TextRun({
            text: ref,
            font: FONT_FAMILY,
            size: 24
          })
        ]
      })
    );
  });

  // ── COMPILE FULL DOCUMENT WITH TWO SECTIONS ────────────────────────────────
  const doc = new Document({
    sections: [
      // SECTION 1: Preliminary Pages with Roman Numerals (i, ii, iii...)
      {
        properties: {
          page: {
            margin: {
              top: 1080,    // 0.75"
              bottom: 1080, // 0.75"
              left: 1800,   // 1.25"
              right: 1440   // 1.0"
            },
            pageNumbers: {
              start: 1,
              formatType: NumberFormat.LOWER_ROMAN
            }
          }
        },
        headers: { default: header },
        footers: { default: footerPreliminary },
        children: prelimChildren
      },
      // SECTION 2: Chapters with Arabic Numerals (1, 2, 3...)
      {
        properties: {
          page: {
            margin: {
              top: 1080,    // 0.75"
              bottom: 1080, // 0.75"
              left: 1800,   // 1.25"
              right: 1440   // 1.0"
            },
            pageNumbers: {
              start: 1,
              formatType: NumberFormat.DECIMAL
            }
          }
        },
        headers: { default: header },
        footers: { default: footerMain },
        children: mainChildren
      }
    ]
  });

  const buffer = await Packer.toBuffer(doc);
  fs.writeFileSync(OUTPUT_PATH, buffer);
  console.log(`Document generated successfully at: ${OUTPUT_PATH}`);
  console.log(`File size: ${(buffer.length / 1024).toFixed(1)} KB`);
}

generateReport().catch(err => {
  console.error('Failed to generate report:', err);
  process.exit(1);
});
