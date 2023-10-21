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

app.listen(port, () => {
    console.log(`Server is running on port ${port}`);
});