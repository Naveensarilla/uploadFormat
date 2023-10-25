const express = require('express');
const multer = require('multer');
const mysql = require('mysql2'); // Use mysql2 instead of mysql
const cors = require('cors');
const mammoth = require('mammoth');
const fs = require('fs');
const cheerio = require('cheerio');
const app = express();
const port = 4007;

const dbConfig = {
  host: 'localhost',
  user: 'root',
  password: 'naveen',
  database: 'egquizdatabase',
};

const connection = mysql.createConnection(dbConfig);

connection.connect((err) => {
  if (err) {
    console.error('Error connecting to the database: ' + err.message);
    throw err;
  }
  console.log('Connected to the database');
});

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, 'uploads/');
  },
  filename: (req, file, cb) => {
    cb(null, file.originalname);
  },
});

const upload = multer({ storage });

app.use(cors());

app.get('/quiz_coures', (req, res) => {
  const sql = 'SELECT * FROM 1egquiz_courses';
  connection.query(sql, (err, result) => {
    if (err) {
      console.error('Error querying the database: ' + err.message);
      res.status(500).json({ error: 'Error fetching coureses' });
      return;
    }
    res.json(result);
  });
});

app.get('/quiz_exams/:course_id', (req, res) => {
  const course_id = req.params.course_id;
  const sql = 'SELECT * FROM 2egquiz_exam WHERE course_id = ?';
  connection.query(sql, [course_id], (err, result) => {
    if (err) {
      console.error('Error querying the database: ' + err.message);
      res.status(500).json({ error: 'Error fetching exams' });
      return;
    }
    res.json(result);
  });
});

app.get('/quiz_Subjects/:exam_id', (req, res) => {
  const sql =
    'SELECT s.subi_id, s.subject_name FROM egquiz_subindex s,3egquiz_subject t WHERE t.subi_id=s.subi_id and exam_id=?';
  const exam_id = req.params.exam_id;
  connection.query(sql, [exam_id], (err, result) => {
    if (err) {
      console.error('Error querying the database: ' + err.message);
      res.status(500).json({ error: 'Error fetching subjects' });
      return;
    }
    res.json(result);
  });
});

app.get('/quiz_units/:subi_id', (req, res) => {
  const subi_id = req.params.subi_id;
  const sql = 'SELECT * FROM 4egquiz_unit WHERE subi_id=?';
  connection.query(sql, [subi_id], (err, result) => {
    if (err) {
      console.error('Error querying the database: ' + err.message);
      res.status(500).json({ error: 'Error fetching topics' });
      return;
    }
    res.json(result);
  });
});

app.get('/quiz_topics/:unit_id', (req, res) => {
  const unit_id = req.params.unit_id;
  const sql = 'SELECT * FROM 5egquiz_topics WHERE unit_id=?';
  connection.query(sql, [unit_id], (err, result) => {
    if (err) {
      console.error('Error querying the database: ' + err.message);
      res.status(500).json({ error: 'Error fetching topics' });
      return;
    }
    res.json(result);
  });
});

app.post('/upload', upload.single('document'), async (req, res) => {
    const docxFilePath = `uploads/${req.file.filename}`;
    const outputDir = `uploads/${req.file.originalname}_images`;
    const topic_id= req.body.topic_id;
    if (!fs.existsSync(outputDir)) {
      fs.mkdirSync(outputDir);
    }
  
    // Assuming the selected topic IDs are sent in the request body as an array
    // const selectedTopicIds = req.body.selectedTopicIds;
  
    try {
      const result = await mammoth.convertToHtml({ path: docxFilePath });
      const htmlContent = result.value;
      const $ = cheerio.load(htmlContent);
  
      $('img').each(async function (i, element) {
        const base64Data = $(this).attr('src').replace(/^data:image\/\w+;base64,/, '');
        const imageBuffer = Buffer.from(base64Data, 'base64');
  
        try {
          // Insert the image data and the selected topic ID into the image table
        //   for (const topicId of selectedTopicIds) {
        //     await connection.query('INSERT INTO images (image_data, topic_id) VALUES (?, ?)', [imageBuffer, topic_id]);
        //   }
        await connection.execute('INSERT INTO images (image_data,topic_id) VALUES (?, ?)', [imageBuffer, topic_id]);
        console.log('Image inserted successfully');
        } catch (error) {
            console.error('Error inserting image data:', error);
          res.status(500).send('Error inserting image data into the database.');
          return;
        }
      });
  
      // No need to close the connection here
  
      res.send('Images extracted and saved to the database with selected topic IDs successfully.');
    } catch (error) {
      console.error(error);
      res.status(500).send('Error extracting images and saving to the database.');
    }
  });

app.listen(port, () => {
  console.log(`Server is running on http://localhost:${port}`);
});













// const express = require('express');
// const multer = require('multer');
// const cors = require('cors');
// const mammoth = require('mammoth');
// const mysql = require('mysql');
// const fs = require('fs');
// const cheerio = require('cheerio');
// const app = express();

// const port = 5030;


// const db = mysql.createConnection({
//     host: "localhost",
//     user: "root",
//     password: "naveen",
//     database: "uploaded",
//   });
// db.connect((err) => {
//     if (err) throw err;
//     console.log("Connected to MySQL");
//   });
// app.use(cors());

// const storage = multer.diskStorage({
//     destination: (req, file, cb) => {
//         cb(null, 'uploads/'); // Define the folder where the DOCX files will be temporarily stored.
//     },
//     filename: (req, file, cb) => {
//         cb(null, file.originalname);
//     },
// });

// const upload = multer({ storage });

// app.post('/upload', upload.single('document'), async (req, res) => {
//     const docxFilePath = `uploads/${req.file.filename}`;
//     const outputDir = `uploads/${req.file.originalname}_images`;

//     // Create a directory for saving images.
//     if (!fs.existsSync(outputDir)) {
//         fs.mkdirSync(outputDir);
//     }
//     try {

//         const result = await mammoth.convertToHtml({ path: docxFilePath });
//         const htmlContent = result.value;
//         const $ = cheerio.load(htmlContent);

//         $('img').each(function (i, element) {
//             const base64Data = $(this).attr('src').replace(/^data:image\/\w+;base64,/, '');
//             const imageBuffer = Buffer.from(base64Data, 'base64');
//             fs.writeFileSync(`${outputDir}/image_${i}.png`, imageBuffer);

//         });
//         res.send('Images extracted and saved successfully.');
//     } catch (error) {
//         console.error(error);
//         res.status(500).send('Error extracting images.');
//     }
// });


// app.listen(port, () => {
//     console.log(`Server is running on port ${port}`);

// });








// const express = require('express');
// const multer = require('multer');
// const cors = require('cors');
// const mysql = require('mysql');
// const fs = require('fs');
// const app = express();

// const port = 5030;

// const pool = mysql.createPool({
//     host: "localhost",
//     user: "root",
//     password: "",
//     database: "uploaded",
// });

// pool.getConnection((err, connection) => {
//     if (err) {
//         console.error('Error connecting to MySQL:', err);
//     } else {
//         console.log("Connected to MySQL");
//     }
// });

// app.use(cors());

// const storage = multer.diskStorage({
//     destination: (req, file, cb) => {
//         cb(null, 'uploads/'); // Define the folder where the images will be temporarily stored.
//     },
//     filename: (req, file, cb) => {
//         cb(null, file.originalname);
//     },
// });

// const upload = multer({ storage });

// app.use(express.json());

// app.post('/upload', upload.single('document'), (req, res) => {
//     const { question_text, answer_text } = req.body;

//     // Read the uploaded image
//     const imageBuffer = fs.readFileSync(req.file.path);

//     // Insert question into Questions table
//     pool.query(
//         'INSERT INTO Questions (question_text) VALUES (?)',
//         [question_text],
//         (err, results) => {
//             if (err) {
//                 console.error('Error inserting question:', err);
//                 res.status(500).send('Error inserting question');
//                 return; // Exit the handler after sending the response
//             }

//             const questionId = results.insertId;

//             // Insert answer into Answers table
//             pool.query(
//                 'INSERT INTO Answers (question_id, answer_text) VALUES (?, ?)',
//                 [questionId, answer_text],
//                 (err) => {
//                     if (err) {
//                         console.error('Error inserting answer:', err);
//                         res.status(500).send('Error inserting answer');
//                         return; // Exit the handler after sending the response
//                     }

//                     // Insert image into Images table
//                     pool.query(
//                         'INSERT INTO Images1 (image_data, question_id) VALUES (?, ?)',
//                         [imageBuffer, questionId],
//                         (err) => {
//                             if (err) {
//                                 console.error('Error inserting image:', err);
//                                 res.status(500).send('Error inserting image');
//                             } else {
//                                 res.send('Data inserted successfully.');
//                             }
//                         }
//                     );
//                 }
//             );
//         }
//     );
// });

// // Function to fetch image data from the database
// function fetchImageData() {
//     pool.query('SELECT id, image_name, image_data FROM img', (err, results) => {
//         if (err) {
//             console.error('Error fetching image data:', err);
//             pool.end(); // Close the database connection in case of an error
//         } else {
//             const imageRows = results; // Define imageRows here
//             processImageData(imageRows); // Start processing image data
//         }
//     });
// }
// // Function to process image data
// function processImageData(imageRows, i) {
//     if (i <= 6 && imageRows && imageRows.length > 0) {
//         const row = imageRows.shift(); // Get data based on 'i'
//         if (row) {
//             const { id, image_name, image_data } = row;
//             if (id === 1) {
//                 // Insert into Questions table
//                 pool.query('INSERT INTO questions (question_text) VALUES (?)', [image_name], (err, results) => {
//                     if (err) {
//                         console.error('Error inserting question:', err);
//                     } else {
//                         console.log(`Data inserted into Questions table (i = ${i}, id = ${id})`);
//                         i += 1; // Increment 'i' by 1
//                         processImageData(imageRows, i); // Pass 'i' as an argument
//                     }
//                 });
//             } else if (id >= 2 && id <= 5) {
//                 // Insert into Options table
//                 pool.query('INSERT INTO options (option_text, option_id) VALUES (?, ?)', [image_name, id], (err, results) => {
//                     if (err) {
//                         console.error('Error inserting option:', err);
//                     } else {
//                         console.log(`Data inserted into Options table (i = ${i}, id = ${id})`);
//                         i += 1; // Increment 'i' by 1
//                         processImageData(imageRows, i); // Pass 'i' as an argument
//                     }
//                 });
//             } else if (id === 6) {
//                 // Insert into Solution table
//                 pool.query('INSERT INTO solution (solution_text, solution_id) VALUES (?, ?)', [image_name, id], (err, results) => {
//                     if (err) {
//                         console.error('Error inserting solution:', err);
//                     } else {
//                         console.log(`Data inserted into Solution table (i = ${i}, id = ${id})`);
//                         i += 1; // Increment 'i' by 1
//                         processImageData(imageRows, i); // Pass 'i' as an argument
//                     }
//                 });
//             }
//         }
//     } else {
//         if (i <= 6) {
//             // Handle the case where there are no more image rows
//             console.log('No more image data to process.');
//             pool.end(); // Close the database connection
//         }
//     }
// }

// // Start by fetching image data from the database
// fetchImageData();


// app.get('/img', (req, res) => {
//     // Query the database to fetch images
//     const selectImagesSql = 'SELECT * FROM Images';

//     db.query(selectImagesSql, (error, results) => {
//         if (error) {
//             console.error(error);
//             res.status(500).send('Error fetching images from the database.');
//         } else {
//             // Send the images as a JSON response
//             const images = results.map(result => {
//                 return {
//                     image_name: result.image_name,
//                     image_data: result.image_data.toString('base64'),
//                 };
//             });
//             res.json(images);
//         }
//     });
// });

// app.listen(port, () => {
//     console.log(`Server is running on port ${port}`);
// });






// const express = require('express');
// const multer = require('multer');
// const cors = require('cors');
// const mammoth = require('mammoth');
// const mysql = require('mysql');
// const fs = require('fs');
// const cheerio = require('cheerio');
// const app = express();

// const port = 5030;

// const db = mysql.createConnection({
//     host: "localhost",
//     user: "root",
//     password: "",
//     database: "uploaded",
// });

// db.connect((err) => {
//     if (err) {
//         console.error('Error connecting to MySQL:', err);
//     } else {
//         console.log("Connected to MySQL");
//     }
// });

// app.use(cors());

// const storage = multer.diskStorage({
//     destination: (req, file, cb) => {
//         cb(null, 'uploads/'); // Define the folder where the DOCX files will be temporarily stored.
//     },
//     filename: (req, file, cb) => {
//         cb(null, file.originalname);
//     },
// });

// const upload = multer({ storage });

// // working main

// // app.post('/upload', upload.single('document'), async (req, res) => {
// //     const docxFilePath = `uploads/${req.file.filename}`;
// //     const documentName = req.file.originalname; // Assuming you have a document name

// //     const outputDir = `uploads/${documentName}_images`;

// //     // Create a directory for saving images.
// //     if (!fs.existsSync(outputDir)) {
// //         fs.mkdirSync(outputDir);
// //     }
    
// //     try {
// //         // Insert the document information into the documents table
// //         const insertDocumentSql = 'INSERT INTO documents (document_name) VALUES (?)';
// //         const documentResult = await db.query(insertDocumentSql, [documentName]);
// //         const documentId = documentResult.insertId;

// //         const result = await mammoth.convertToHtml({ path: docxFilePath });
// //         const htmlContent = result.value;
// //         const $ = cheerio.load(htmlContent);

// //         $('img').each(async (i, element) => {
// //             const base64Data = $(element).attr('src').replace(/^data:image\/\w+;base64,/, '');
// //             const imageBuffer = Buffer.from(base64Data, 'base64');
// //             const imageName = `image_${i}.png`;

// //             fs.writeFileSync(`${outputDir}/${imageName}`, imageBuffer);

// //             // Insert the image information into the images table
// //             const insertImageSql = 'INSERT INTO img (document_id, image_name, image_data) VALUES (?, ?, ?)';
// //             await db.query(insertImageSql, [documentId, imageName, imageBuffer]);
// //         });

// //         res.send('Images extracted and saved successfully.');
// //     } catch (error) {
// //         console.error(error);
// //         res.status(500).send('Error extracting images.');
// //     }
// // });
// // end ===========================================================================================

// app.post('/upload', upload.single('document'), async (req, res) => {
//     const docxFilePath = `uploads/${req.file.filename}`;
//     const documentName = req.file.originalname; // Assuming you have a document name

//     const outputDir = `uploads/${documentName}_images`;
//     const questionImages = {}; // To store question-related image data
//     const optionImages = {};   // To store option-related image data
//     const answerImages = {};   // To store answer-related image data

//     // Create a directory for saving images.
//     if (!fs.existsSync(outputDir)) {
//         fs.mkdirSync(outputDir);
//     }

//     try {
//         const result = await mammoth.convertToHtml({ path: docxFilePath });
//         const htmlContent = result.value;
//         const $ = cheerio.load(htmlContent);

//         let currentText = '';  // To store the current text
//         let currentImages = {}; // To store the current images

//         $('p').each(async (i, element) => {
//             const text = $(element).text();

//             if (text.includes('[Q]')) {
//                 // If the paragraph contains [Q], it's a question.
//                 currentText = text.replace('[Q]', ''); // Remove the [Q] marker
//                 currentImages = questionImages;
//             } else if (text.includes('(a)') || text.includes('(b)') || text.includes('(c)') || text.includes('(d)')) {
//                 // If the paragraph contains [a], [b], [c], or [d], it's an option.
//                 const optionKey = text.charAt(1); // Extract the option letter
//                 currentText = text.slice(3); // Remove the [a], [b], [c], or [d] marker
//                 currentImages = optionImages[optionKey] = optionImages[optionKey] || {};
//             } else if (text.includes('[ans]')) {
//                 // If the paragraph contains [ans], it's an answer.
//                 currentText = text.replace('[ans]', ''); // Remove the [ans] marker
//                 currentImages = answerImages;
//             } else {
//                 // No marker, append the text based on the current context
//                 if (currentText) {
//                     currentText += '\n' + text;
//                 }
//             }

//             // Extract and save images
//             $('img', element).each(async (i, imgElement) => {
//                 const base64Data = $(imgElement).attr('src').replace(/^data:image\/\w+;base64,/, '');
//                 const imageBuffer = Buffer.from(base64Data, 'base64');
//                 const imageName = `image_${Date.now()}_${i}.png`;

//                 currentImages[imageName] = imageBuffer;

//                 fs.writeFileSync(`${outputDir}/${imageName}`, imageBuffer);
//             });
//         });

//         // Insert the document information into the documents table
//         const insertDocumentSql = 'INSERT INTO documents (document_name) VALUES (?)';
//         const documentResult = await db.query(insertDocumentSql, [documentName]);
//         const documentId = documentResult.insertId;

//         // Insert question text into the questions table
//         if (questionText) {
//             const insertQuestionSql = 'INSERT INTO questions (document_id, text) VALUES (?, ?)';
//             await db.query(insertQuestionSql, [documentId, questionText]);

//             // Insert question-related images
//             for (const [imageName, imageBuffer] of Object.entries(questionImages)) {
//                 const insertImageSql = 'INSERT INTO question_images (question_id, image_name, image_data) VALUES (?, ?, ?)';
//                 await db.query(insertImageSql, [questionId, imageName, imageBuffer]);
//             }
//         }

//         // Insert options text into the options table
//         const options = ['a', 'b', 'c', 'd'];
//         for (const optionKey of options) {
//             if (optionsText[optionKey]) {
//                 const insertOptionSql = 'INSERT INTO options (document_id, option_key, text) VALUES (?, ?, ?)';
//                 await db.query(insertOptionSql, [documentId, optionKey, optionsText[optionKey]]);

//                 // Insert option-related images
//                 for (const [imageName, imageBuffer] of Object.entries(optionImages[optionKey])) {
//                     const insertImageSql = 'INSERT INTO option_images (option_id, image_name, image_data) VALUES (?, ?, ?)';
//                     await db.query(insertImageSql, [optionId, imageName, imageBuffer]);
//                 }
//             }
//         }

//         // Insert answer text into the answers table
//         if (answerText) {
//             const insertAnswerSql = 'INSERT INTO answers (document_id, text) VALUES (?, ?)';
//             await db.query(insertAnswerSql, [documentId, answerText]);

//             // Insert answer-related images
//             for (const [imageName, imageBuffer] of Object.entries(answerImages)) {
//                 const insertImageSql = 'INSERT INTO answer_images (answer_id, image_name, image_data) VALUES (?, ?, ?)';
//                 await db.query(insertImageSql, [answerId, imageName, imageBuffer]);
//             }
//         }

//         res.send('Text and images extracted and saved successfully.');
//     } catch (error) {
//         console.error(error);
//         res.status(500).send('Error extracting text and images.');
//     }
// });






// app.get('/images/:id', (req, res) => {
//     const id = req.params.id; // Use req.params.id to get the ID from the route

//     // Query the database to fetch images for the specified document_id
//     const selectImagesSql = 'SELECT image_data FROM img WHERE id = ?'; // Change "id" to "document_id"
//     db.query(selectImagesSql, [id], (error, results) => {
//         if (error) {
//             console.error(error);
//             res.status(500).send('Error fetching images from the database.');
//         } else {
//             // Send the images as a JSON response
//             const images = results.map(result => {
//                 return {
//                     image_name: result.image_name,
//                     image_data: result.image_data.toString('base64'),
//                 };
//             });
//             res.json(images);
//         }
//     });
// });


// app.get('/img', (req, res) => {
//  // Use req.params.id to get the ID from the route

//     // Query the database to fetch images for the specified document_id
//     const selectImagesSql = 'SELECT * FROM img '; // Change "id" to "document_id"
//     db.query(selectImagesSql,(error, results) => {
//         if (error) {
//             console.error(error);
//             res.status(500).send('Error fetching images from the database.');
//         } else {
//             // Send the images as a JSON response
//             const images = results.map(result => {
//                 return {
//                     image_name: result.image_name,
//                     image_data: result.image_data.toString('base64'),
//                 };
//             });
//             res.json(images);
//         }
//     });
// });


// app.listen(port, () => {
//     console.log(`Server is running on port ${port}`);
// });


// const express = require('express');
// const multer = require('multer');
// const cors = require('cors');
// const mysql = require('mysql');
// const fs = require('fs');
// const app = express();

// const port = 5030;

// const pool = mysql.createPool({
//     host: "localhost",
//     user: "root",
//     password: "",
//     database: "uploaded",
// });

// pool.getConnection((err, connection) => {
//     if (err) {
//         console.error('Error connecting to MySQL:', err);
//     } else {
//         console.log("Connected to MySQL");
//     }
// });

// app.use(cors());

// const storage = multer.diskStorage({
//     destination: (req, file, cb) => {
//         cb(null, 'uploads/'); // Define the folder where the images will be temporarily stored.
//     },
//     filename: (req, file, cb) => {
//         cb(null, file.originalname);
//     },
// });

// const upload = multer({ storage });

// app.use(express.json());

// app.post('/upload', upload.single('document'), (req, res) => {
//     const { i, data } = req.body;
//     const { question_text, answer_text } = req.body;

//     // Read the uploaded image
//     const imageBuffer = fs.readFileSync(req.file.path);

//     // Insert question into Questions table
//     pool.query(
//         'INSERT INTO Questions (question_text) VALUES (?)',
//         [question_text],
//         (err, results) => {
//             if (err) {
//                 console.error('Error inserting question:', err);
//                 res.status(500).send('Error inserting question');
//                 return; // Exit the handler after sending the response
//             }

//             const questionId = results.insertId;

//             // Insert answer into Answers table
//             pool.query(
//                 'INSERT INTO Answers (question_id, answer_text) VALUES (?, ?)',
//                 [questionId, answer_text],
//                 (err) => {
//                     if (err) {
//                         console.error('Error inserting answer:', err);
//                         res.status(500).send('Error inserting answer');
//                         return; // Exit the handler after sending the response
//                     }

//                     // Insert image into Images table
//                     pool.query(
//                         'INSERT INTO Images1 (image_data, question_id) VALUES (?, ?)',
//                         [imageBuffer, questionId],
//                         (err) => {
//                             if (err) {
//                                 console.error('Error inserting image:', err);
//                                 res.status(500).send('Error inserting image');
//                             } else {
//                                 res.send('Data inserted successfully.');
//                             }
//                         }
//                     );
//                 }
//             );
//         }
//     );


//     // Check the value of 'i' and insert data into the appropriate table
//     if (i === 1) {
//         // Insert into Questions table
//         pool.query('INSERT INTO Questions (question_text) VALUES (?)', [data], (err, results) => {
//             if (err) {
//                 console.error('Error inserting question:', err);
//                 res.status(500).send('Error inserting question');
//             } else {
//                 res.send('Data inserted into Questions table successfully.');
//             }
//         });
//     } else if (i >= 2 && i <= 5) {
//         // Insert into Options table
//         pool.query('INSERT INTO Options (option_text) VALUES (?)', [data], (err, results) => {
//             if (err) {
//                 console.error('Error inserting option:', err);
//                 res.status(500).send('Error inserting option');
//             } else {
//                 res.send('Data inserted into Options table successfully.');
//             }
//         });
//     } else if (i === 6) {
//         // Insert into Solution table
//         pool.query('INSERT INTO Solution (solution_text) VALUES (?)', [data], (err, results) => {
//             if (err) {
//                 console.error('Error inserting solution:', err);
//                 res.status(500).send('Error inserting solution');
//             } else {
//                 res.send('Data inserted into Solution table successfully.');
//             }
//         });
//     } else {
//         res.status(400).send('Invalid value of i');
//     }
// });

// app.get('/img', (req, res) => {
//     // Query the database to fetch images
//     const selectImagesSql = 'SELECT * FROM Images';

//     pool.query(selectImagesSql, (error, results) => {
//         if (error) {
//             console.error(error);
//             res.status(500).send('Error fetching images from the database.');
//         } else {
//             // Send the images as a JSON response
//             const images = results.map(result => {
//                 return {
//                     image_name: result.image_name,
//                     image_data: result.image_data.toString('base64'),
//                 };
//             });
//             res.json(images);
//         }
//     });
// });

// app.listen(port, () => {
//     console.log(`Server is running on port ${port}`);
// });