

// Define a function to insert an image into the appropriate table
async function insertImage(connection, image, topic_id, table) {
    const query = `INSERT INTO ${table} (image_data, topic_id) VALUES (?, ?)`;
    await connection.execute(query, [image, topic_id]);
  }
  
  // Define a function to handle image insertion for sets of 4 images
  async function handleImageSets(connection, images, topic_id, table) {
    for (let i = 0; i < images.length; i++) {
      if (i % 6 === 0) {
        // Insert the image data into a new "image_set" table for every set of 4 images
        await insertImage(connection, images[i], topic_id, table);
      } else {
        // Insert the image data into the existing "images" table
        await insertImage(connection, images[i], topic_id, 'images');
      }
    }
  }
  
  // Define a function to extract and save content to the database
  async function extractAndSaveContent(req, res) {
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
  
      // Handle the insertion of images for sets of 4
      await handleImageSets(connection, images, topic_id, 'questions');
  
      // Handle the insertion of images for sets of 5 with solution
      await handleImageSets(connection, images, topic_id, 'solustion');
  
      // Handle the insertion of text content
      for (let i = 0; i < textSections.length; i++) {
        if (textSections[i].trim().startsWith('[ans]')) {
          const answerText = textSections[i].trim().replace('[ans]', '');
          await connection.execute('INSERT INTO answer_text_table (answer_text, topic_id) VALUES (?, ?)', [answerText, topic_id]);
        } else {
          await insertImage(connection, textSections[i], topic_id, 'images');
        }
      }
  
      res.send('Text content and images extracted and saved to the database with the selected topic ID successfully.');
    } catch (error) {
      console.error(error);
      res.status(500).send('Error extracting content and saving it to the database.');
    }
  }
  
  // Use the express route with the simplified function
  app.post('/upload', filesFromUser.single('document'), extractAndSaveContent);