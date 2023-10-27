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

        // Create a variable to keep track of the current question id
        let currentQuestionId = 0;
        let currentAnswerText = ''; // To store the answer text

        for (let i = 0; i < Math.max(textSections.length, images.length); i++) {
            if (i < images.length) {
                if (i % 6 === 0) {
                    currentQuestionId++;

                    // Insert the image data into the "questions" table with the current question id
                    await connection.execute('INSERT INTO questions (id, qustion_data, topic_id) VALUES (?, ?, ?)', [currentQuestionId, images[i], topic_id]);
                    console.log(`Question content ${i} inserted successfully into questions table for question id ${currentQuestionId}`);
                } else {
                    // Insert the image data into the existing "images" table
                    await connection.execute('INSERT INTO images (image_data, topic_id) VALUES (?, ?)', [images[i], topic_id]);
                    console.log(`Image content ${i} inserted successfully into images table`);
                }
            }

            if (i < textSections.length) {
                // Check for answer text marked with [ans]
                if (textSections[i].trim().startsWith('[ans]')) {
                    // Extract and store the answer text in the "answers_table"
                    const answerText = textSections[i].trim().replace('[ans]', '');
                    await connection.execute('INSERT INTO answer_text_table (answer_text, topic_id) VALUES (?, ?)', [answerText, topic_id]);
                    console.log(`Answer text '${answerText}' inserted successfully into answer_text_table for topic ${topic_id}`);
                } else {
                    // Insert the text content into the "images" table as per your original code.
                    await connection.execute('INSERT INTO images (content_text, topic_id) VALUES (?, ?)', [textSections[i], topic_id]);
                    console.log(`Text content ${i} inserted successfully into images table`);
                }
            }
        }

        let currentImageIndex = 1;
        let currentSetQuestionId = 1; // Initialize currentSetQuestionId

        for (let i = 1; i < Math.max(textSections.length, images.length); i++) {
            if (i < images.length) {
                if (currentImageIndex >= 1 && currentImageIndex <= 4) {
                    // Insert the image data into a new "image_set" table for the first 4 images
                    await connection.execute('INSERT INTO options_table (question_id, option_data, topic_id) VALUES (?, ?, ?)', [currentSetQuestionId, images[i], topic_id]);
                    console.log(`Image content ${i} inserted successfully into options_table table for question id ${currentSetQuestionId}`);
                } else {
                    // Insert the image data into the existing "images" table
                    await connection.execute('INSERT INTO images (image_data, topic_id) VALUES (?, ?)', [images[i], topic_id]);
                    console.log(`Image content ${i} inserted successfully into images table`);
                }

                currentImageIndex += 1; // Increment the current image index

                if (currentImageIndex === 5) {
                    currentImageIndex = 1; // Reset to 1 to repeat the first 4 images
                    i += 2; // Increment i by 2 to skip 2 images

                    // Increment currentSetQuestionId only once for every set of 4 options
                    currentSetQuestionId++;
                }
            }
        }

        let currentSet_QuestionId = 1; // Initialize currentSetQuestionId

        for (let i = 0; i < Math.max(textSections.length, images.length); i++) {
            if (i < images.length) {
                if (i >= 5 && (i - 5) % 6 === 0) {
                    // Insert the image data into a new "solustion" table for every 5th image
                    await connection.execute('INSERT INTO solustion (qustion_id, solustion_data, topic_id) VALUES (?, ?, ?)', [currentSet_QuestionId, images[i], topic_id]);
                    console.log(`Image content ${i} inserted successfully into solustion table for question id ${currentSet_QuestionId}`);
                } else {
                    // Insert the image data into the existing "images" table
                    await connection.execute('INSERT INTO images (image_data, topic_id) VALUES (?, ?)', [images[i], topic_id]);
                    console.log(`Image content ${i} inserted successfully into images table`);
                }
            }
            if (i < textSections.length) {
                // Insert the text content into the "images" table as per your original code.
                await connection.execute('INSERT INTO images (content_text, topic_id) VALUES (?, ?)', [textSections[i], topic_id]);
                console.log(`Text content ${i} inserted successfully into images table`);
            }

            // Increment currentSetQuestionId for every set of 5 images
            if (i >= 5 && (i - 5) % 6 === 0) {
                currentSet_QuestionId++;
            }
        }

        // end-------------

        res.send('Text content and images extracted and saved to the database with the selected topic ID successfully.');
    } catch (error) {
        console.error(error);
        res.status(500).send('Error extracting content and saving it to the database.');
    }
});

app.get('/api/questions', async (req, res) => {
    try {
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
        res.json({ questions, options, answers });
    } catch (error) {
        console.error('Error fetching data:', error);
        res.status(500).json({ error: 'Error fetching data' });
    }
});

app.listen(port, () => {
    console.log(`Server is running on http://localhost:${port}`);
});
