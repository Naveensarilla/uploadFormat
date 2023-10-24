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








const express = require('express');
const multer = require('multer');
const cors = require('cors');
const mysql = require('mysql');
const fs = require('fs');
const app = express();

const port = 5030;

const pool = mysql.createPool({
    host: "localhost",
    user: "root",
    password: "",
    database: "uploaded",
});

pool.getConnection((err, connection) => {
    if (err) {
        console.error('Error connecting to MySQL:', err);
    } else {
        console.log("Connected to MySQL");
    }
});

app.use(cors());

const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, 'uploads/'); // Define the folder where the images will be temporarily stored.
    },
    filename: (req, file, cb) => {
        cb(null, file.originalname);
    },
});

const upload = multer({ storage });

app.use(express.json());

app.post('/upload', upload.single('document'), (req, res) => {
    const { question_text, answer_text } = req.body;

    // Read the uploaded image
    const imageBuffer = fs.readFileSync(req.file.path);

    // Insert question into Questions table
    pool.query(
        'INSERT INTO Questions (question_text) VALUES (?)',
        [question_text],
        (err, results) => {
            if (err) {
                console.error('Error inserting question:', err);
                res.status(500).send('Error inserting question');
                return; // Exit the handler after sending the response
            }

            const questionId = results.insertId;

            // Insert answer into Answers table
            pool.query(
                'INSERT INTO Answers (question_id, answer_text) VALUES (?, ?)',
                [questionId, answer_text],
                (err) => {
                    if (err) {
                        console.error('Error inserting answer:', err);
                        res.status(500).send('Error inserting answer');
                        return; // Exit the handler after sending the response
                    }

                    // Insert image into Images table
                    pool.query(
                        'INSERT INTO Images1 (image_data, question_id) VALUES (?, ?)',
                        [imageBuffer, questionId],
                        (err) => {
                            if (err) {
                                console.error('Error inserting image:', err);
                                res.status(500).send('Error inserting image');
                            } else {
                                res.send('Data inserted successfully.');
                            }
                        }
                    );
                }
            );
        }
    );
});

// Determine the starting values for 'i' and 'questionId'
let i = 1; // Starting value for 'i'
let id = 1; // Starting value for 'questionId'

// Function to insert data into Questions table
function insertQuestion(image_name, image_data) {
    pool.query('INSERT INTO Questions (question_text) VALUES (?)', [image_name], (err, results) => {
        if (err) {
            console.error('Error inserting question:', err);
        } else {
            console.log(`Data inserted into Questions table (i = ${i}, id = ${id})`);
            i += 5; // Increment 'i' by 5
            id = results.insertId; // Update 'questionId'
            processImageData(); // Process the next image data
        }
    });
}

function insertOption(image_name, image_data) {
    pool.query('INSERT INTO Options (option_text, id) VALUES (?, ?)', [image_name, id], (err, results) => {
        if (err) {
            console.error('Error inserting option:', err);
        } else {
            console.log(`Data inserted into Options table (i = ${i}, id = ${id})`);
            i += 2; // Increment 'i' by 2
            id += 1; // Increment 'id'
            processImageData();
        }
    });
}

// Function to insert data into Solution table
function insertSolution(image_name, image_data) {
    pool.query('INSERT INTO Solution (solution_text, id) VALUES (?, ?)', [image_name, id], (err, results) => {
        if (err) {
            console.error('Error inserting solution:', err);
        } else {
            console.log(`Data inserted into Solution table (i = ${i}, id = ${id})`);
            i += 1; // Increment 'i' by 1
            id += 1; // Increment 'id'
            processImageData();
        }
    });
}

// Function to fetch image data from the database
function fetchImageData() {
    pool.query('SELECT id, image_name, image_data FROM img', (err, results) => {
        if (err) {
            console.error('Error fetching image data:', err);
            pool.end(); // Close the database connection in case of an error
        } else {
            const imageRows = results;
            processImageData(imageRows); // Start processing image data
        }
    });
}

// Function to process image data
function processImageData(imageRows) {
    if (i <= 6 && imageRows && imageRows.length > 0) {
        const { id, image_name, image_data } = imageRows.shift(); // Get data based on 'i'
        if (id === 1) {
            insertQuestion(image_name, image_data);
        } else if (id >= 2 && id <= 5) {
            insertOption(image_name, image_data);
        } else if (id === 6) {
            insertSolution(image_name, image_data);
        }
    } else if (i <= 6) {
        // Handle the case where there are no more image rows
        console.log('No more image data to process.');
        pool.end(); // Close the database connection
    }
}

// Start by fetching image data from the database
fetchImageData();


app.get('/img', (req, res) => {
    // Query the database to fetch images
    const selectImagesSql = 'SELECT * FROM Images';

    db.query(selectImagesSql, (error, results) => {
        if (error) {
            console.error(error);
            res.status(500).send('Error fetching images from the database.');
        } else {
            // Send the images as a JSON response
            const images = results.map(result => {
                return {
                    image_name: result.image_name,
                    image_data: result.image_data.toString('base64'),
                };
            });
            res.json(images);
        }
    });
});

app.listen(port, () => {
    console.log(`Server is running on port ${port}`);
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
