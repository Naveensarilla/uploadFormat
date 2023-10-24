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
const mammoth = require('mammoth');
const mysql = require('mysql');
const fs = require('fs');
const cheerio = require('cheerio');
const app = express();

const port = 5030;

const db = mysql.createConnection({
    host: "localhost",
    user: "root",
    password: "Ks@9494270722",
    database: "folderupload",
});

db.connect((err) => {
    if (err) {
        console.error('Error connecting to MySQL:', err);
    } else {
        console.log("Connected to MySQL");
    }
});

app.use(cors());

const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, 'uploads/'); // Define the folder where the DOCX files will be temporarily stored.
    },
    filename: (req, file, cb) => {
        cb(null, file.originalname);
    },
});

const upload = multer({ storage });

app.post('/upload', upload.single('document'), async (req, res) => {
    const docxFilePath = `uploads/${req.file.filename}`;
    const documentName = req.file.originalname; // Assuming you have a document name

    const outputDir = `uploads/${documentName}_images`;

    // Create a directory for saving images.
    if (!fs.existsSync(outputDir)) {
        fs.mkdirSync(outputDir);
    }
    
    try {
        // Insert the document information into the documents table
        const insertDocumentSql = 'INSERT INTO documents (document_name) VALUES (?)';
        const documentResult = await db.query(insertDocumentSql, [documentName]);
        const documentId = documentResult.insertId;

        const result = await mammoth.convertToHtml({ path: docxFilePath });
        const htmlContent = result.value;
        const $ = cheerio.load(htmlContent);

        $('img').each(async (i, element) => {
            const base64Data = $(element).attr('src').replace(/^data:image\/\w+;base64,/, '');
            const imageBuffer = Buffer.from(base64Data, 'base64');
            const imageName = `image_${i}.png`;

            fs.writeFileSync(`${outputDir}/${imageName}`, imageBuffer);

            // Insert the image information into the images table
            const insertImageSql = 'INSERT INTO img (document_id, image_name, image_data) VALUES (?, ?, ?)';
            await db.query(insertImageSql, [documentId, imageName, imageBuffer]);
        });

        res.send('Images extracted and saved successfully.');
    } catch (error) {
        console.error(error);
        res.status(500).send('Error extracting images.');
    }
});

app.get('/images/:id', (req, res) => {
    const id = req.params.id; // Use req.params.id to get the ID from the route

    // Query the database to fetch images for the specified document_id
    const selectImagesSql = 'SELECT image_data FROM img WHERE id = ?'; // Change "id" to "document_id"
    db.query(selectImagesSql, [id], (error, results) => {
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


app.get('/img', (req, res) => {
 // Use req.params.id to get the ID from the route

    // Query the database to fetch images for the specified document_id
    const selectImagesSql = 'SELECT * FROM img '; // Change "id" to "document_id"
    db.query(selectImagesSql,(error, results) => {
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
