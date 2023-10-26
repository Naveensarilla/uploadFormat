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


// app.post('/upload', upload.single('document'), async (req, res) => {
//     const docxFilePath = `uploads/${req.file.filename}`;
//     const outputDir = `uploads/${req.file.originalname}_images`;
//     const topic_id= req.body.topic_id;
//     if (!fs.existsSync(outputDir)) {
//       fs.mkdirSync(outputDir);
//     }

//     // Assuming the selected topic IDs are sent in the request body as an array
//     // const selectedTopicIds = req.body.selectedTopicIds;

//     try {
//       const result = await mammoth.convertToHtml({ path: docxFilePath });
//       const htmlContent = result.value;
//       const $ = cheerio.load(htmlContent);

//       $('img').each(async function (i, element) {
//         const base64Data = $(this).attr('src').replace(/^data:image\/\w+;base64,/, '');
//         const imageBuffer = Buffer.from(base64Data, 'base64');

//         try {
//           // Insert the image data and the selected topic ID into the image table
//         //   for (const topicId of selectedTopicIds) {
//         //     await connection.query('INSERT INTO images (image_data, topic_id) VALUES (?, ?)', [imageBuffer, topic_id]);
//         //   }
//         await connection.execute('INSERT INTO images (image_data,topic_id) VALUES (?, ?)', [imageBuffer, topic_id]);
//         console.log('Image inserted successfully');
//         } catch (error) {
//             console.error('Error inserting image data:', error);
//           res.status(500).send('Error inserting image data into the database.');
//           return;
//         }
//       });

//       // No need to close the connection here

//       res.send('Images extracted and saved to the database with selected topic IDs successfully.');
//     } catch (error) {
//       console.error(error);
//       res.status(500).send('Error extracting images and saving to the database.');
//     }
//   });
//   app.post('/upload', upload.single('document'), async (req, res) => {
//     const docxFilePath = `uploads/${req.file.filename}`;
//     const outputDir = `uploads/${req.file.originalname}_images`;
//     const topic_id = req.body.topic_id;

//     if (!fs.existsSync(outputDir)) {
//       fs.mkdirSync(outputDir);
//     }

//     try {
//       const result = await mammoth.convertToHtml({ path: docxFilePath });
//       const htmlContent = result.value;
//       const $ = cheerio.load(htmlContent);
//       const textResult = await mammoth.extractRawText({ path: docxFilePath });
//       const textContent = textResult.value;

//       // Split the text into sections based on a delimiter, e.g., paragraph separation.
//       // Assuming paragraphs are separated by double line breaks.
//       const textSections = textContent.split('\n\n');

//       // Get all images in the order they appear in the HTML
//       const images = [];
//       $('img').each(function (i, element) {
//         const base64Data = $(this).attr('src').replace(/^data:image\/\w+;base64,/, '');
//         const imageBuffer = Buffer.from(base64Data, 'base64');
//         images.push(imageBuffer);
//       });

//       // Variables to track the current image indices
//       let imageSetCounter = 0;
//       let currentImageIndex = 1;

//       for (let i = 0; i < Math.max(textSections.length, images.length); i++) {
//         if (i < images.length) {
//           if (imageSetCounter === 0) {
//             // Insert the image data into a new "image_set" table for every 6th image
//             await connection.execute('INSERT INTO questions (question_data, topic_id) VALUES (?, ?)', [images[i], topic_id]);
//             console.log(`Image content ${i} inserted successfully into questions table`);
//           } else if (currentImageIndex >= 1 && currentImageIndex <= 4) {
//             // Insert the image data into an "options_table" with an increment of 2 for the 1st to 4th images
//             await connection.execute('INSERT INTO options_table (option_data, topic_id) VALUES (?, ?)', [images[i], topic_id]);
//             console.log(`Image content ${i} inserted successfully into options_table table`);
//           } else if (imageSetCounter % 5 === 0) {
//             // Insert the image data into a "solution" table for every 5th image
//             await connection.execute('INSERT INTO solution (solution_data, topic_id) VALUES (?, ?)', [images[i], topic_id]);
//             console.log(`Image content ${i} inserted successfully into solution table`);
//           } else {
//             // Insert the image data into the existing "images" table for the rest
//             await connection.execute('INSERT INTO images (image_data, topic_id) VALUES (?, ?)', [images[i], topic_id]);
//             console.log(`Image content ${i} inserted successfully into images table`);
//           }

//           imageSetCounter++;
//           currentImageIndex++;

//           // When the imageSetCounter reaches 6, reset it to 0
//           if (imageSetCounter === 6) {
//             imageSetCounter = 0;
//           }

//           // After the 4th image, reset the currentImageIndex to insert images with an increment of 2
//           if (currentImageIndex === 5) {
//             currentImageIndex = 1;
//             i += 2;
//           }
//         }

//         if (i < textSections.length) {
//           // Insert the text content into the "images" table as per your original code.
//           await connection.execute('INSERT INTO images (content_text, topic_id) VALUES (?, ?)', [textSections[i], topic_id]);
//           console.log(`Text content ${i} inserted successfully into images table`);
//         }
//       }

//       res.send('Text content and images extracted and saved to the database with the selected topic ID successfully.');
//     } catch (error) {
//       console.error(error);
//       res.status(500).send('Error extracting content and saving it to the database.');
//     }
//   });





function extractAnswerText(text) {
    const ansPattern = /\[ans\](.*?)\[\/ans\]/g;
    const answers = [];
    let match;
    while ((match = ansPattern.exec(text)) !== null) {
        answers.push(match[1].trim()); // Extract text within [ans] tags
    }
    return answers;
}


app.post('/upload', upload.single('document'), async (req, res) => {
    const docxFilePath = `uploads/${req.file.filename}`;
    const outputDir = `uploads/${req.file.originalname}_images`;
    const topic_id = req.body.topic_id;

    if (!fs.existsSync(outputDir)) {
        fs.mkdirSync(outputDir);
    }

    try {
        const result = await mammoth.convertToHtml({ path: docxFilePath });
        const htmlContent = result.value;
        const $ = cheerio.load(htmlContent);
        const textResult = await mammoth.extractRawText({ path: docxFilePath });
        const textContent = textResult.value;

        // Split the text into sections based on a delimiter, e.g., paragraph separation.
        // Assuming paragraphs are separated by double line breaks.
        const textSections = textContent.split('\n\n');

        // Get all images in the order they appear in the HTML
        const images = [];
        $('img').each(function (i, element) {
            const base64Data = $(this).attr('src').replace(/^data:image\/\w+;base64,/, '');
            const imageBuffer = Buffer.from(base64Data, 'base64');
            images.push(imageBuffer);
        });


        //   this for questions----------------------
        // Save content in the same order, but store every 6th image in a separate table
        for (let i = 0; i < Math.max(textSections.length, images.length); i++) {
            if (i < images.length) {
                if (i % 6 === 0) {
                    // Insert the image data into a new "image_set" table
                    await connection.execute('INSERT INTO questions (qustion_data, topic_id) VALUES (?, ?)', [images[i], topic_id]);
                    console.log(`Image content ${i} inserted successfully into image_set table`);
                } else {
                    // Insert the image data into the existing "images" table
                    await connection.execute('INSERT INTO images (image_data, topic_id) VALUES (?, ?)', [images[i], topic_id]);
                    console.log(`Image content ${i} inserted successfully into images table`);
                }
            }
            // if (i < textSections.length) {
            //     // Insert the text content into the "images" table as per your original code.
            //     await connection.execute('INSERT INTO images (content_text, topic_id) VALUES (?, ?)', [textSections[i], topic_id]);
            //     console.log(`Text content ${i} inserted successfully into images table`);
            // }
        }
        // end-------------



        //   this for options----------------------

        // Variable to track the current image index
        let currentImageIndex = 1;

        for (let i = 1; i < Math.max(textSections.length, images.length); i++) {
            if (i < images.length) {
                if (currentImageIndex >= 1 && currentImageIndex <= 4) {
                    // Insert the image data into a new "image_set" table for the first 4 images
                    await connection.execute('INSERT INTO options_table (option_data, topic_id) VALUES (?, ?)', [images[i], topic_id]);
                    console.log(`Image content ${i} inserted successfully into options_table table`);
                } else {
                    // Insert the image data into the existing "images" table for the rest
                    // await connection.execute('INSERT INTO images (image_data, topic_id) VALUES (?, ?)', [images[i], topic_id]);
                    console.log(`Image content ${i} inserted successfully into images table`);
                }

                currentImageIndex += 1; // Increment the current image index

                // After the 4th image, reset the counter to insert images with an increment of 2
                if (currentImageIndex === 5) {
                    currentImageIndex = 1; // Reset to 1 to repeat the first 4 images
                    i += 2; // Increment i by 2 to skip 2 images
                }
            }
            // if (i < textSections.length) {
            //     // Insert the text content into the "images" table as per your original code.
            //     await connection.execute('INSERT INTO images (content_text, topic_id) VALUES (?, ?)', [textSections[i], topic_id]);
            //     console.log(`Text content ${i} inserted successfully into images table`);
            // }
        }
        // end-------------

        //   this for solustion----------------------

        for (let i = 0; i < Math.max(textSections.length, images.length); i++) {
            if (i < images.length) {
                if (i >= 5 && (i - 5) % 6 === 0) {
                    // Insert the image data into a new "solustion" table for every 5th image
                    await connection.execute('INSERT INTO solustion (solustion_data, topic_id) VALUES (?, ?)', [images[i], topic_id]);
                    console.log(`Image content ${i} inserted successfully into solustion table`);
                } else {
                    // Insert the image data into the existing "images" table
                    // await connection.execute('INSERT INTO images (image_data, topic_id) VALUES (?, ?)', [images[i], topic_id]);
                    console.log(`Image content ${i} inserted successfully into images table`);
                }
            }
            // if (i < textSections.length) {
            //     // Insert the text content into the "images" table as per your original code.
            //     await connection.execute('INSERT INTO images (content_text, topic_id) VALUES (?, ?)', [textSections[i], topic_id]);
            //     console.log(`Text content ${i} inserted successfully into images table`);
            // }
        }
        // end-------------
      
        // Extract and insert answer text

        
        const answerTexts = extractAnswerText(textContent);
for (const answer of answerTexts) {
    try {
        await connection.execute('INSERT INTO answers_table (answer_text, topic_id) VALUES (?, ?)', [answer, topic_id]);
        console.log('Answer text inserted successfully into answers_table');
    } catch (error) {
        console.error('Error inserting answer text:', error);
    }
}

        res.send('Text content and images extracted and saved to the database with the selected topic ID successfully.');
    } catch (error) {
        console.error(error);
        res.status(500).send('Error extracting content and saving it to the database.');
    }
});






app.listen(port, () => {
    console.log(`Server is running on http://localhost:${port}`);
});