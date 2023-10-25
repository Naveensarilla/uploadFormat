
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
        if (i < textSections.length) {
          // Insert the text content into the "images" table as per your original code.
          await connection.execute('INSERT INTO images (content_text, topic_id) VALUES (?, ?)', [textSections[i], topic_id]);
          console.log(`Text content ${i} inserted successfully into images table`);
        }
      }
  





      
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
      await connection.execute('INSERT INTO images (image_data, topic_id) VALUES (?, ?)', [images[i], topic_id]);
      console.log(`Image content ${i} inserted successfully into images table`);
    }

    currentImageIndex += 1; // Increment the current image index

    // After the 4th image, reset the counter to insert images with an increment of 2
    if (currentImageIndex === 5) {
      currentImageIndex = 1; // Reset to 1 to repeat the first 4 images
      i += 2; // Increment i by 2 to skip 2 images
    }
  }
  if (i < textSections.length) {
    // Insert the text content into the "images" table as per your original code.
    await connection.execute('INSERT INTO images (content_text, topic_id) VALUES (?, ?)', [textSections[i], topic_id]);
    console.log(`Text content ${i} inserted successfully into images table`);
  }
}
for (let i = 5; i < Math.max(textSections.length, images.length); i++) {
  if (i < images.length) {
    if (i % 5 === 0) {
      // Insert the image data into a new "image_set" table
      await connection.execute('INSERT INTO solustion (solustion_data, topic_id) VALUES (?, ?)', [images[i], topic_id]);
      console.log(`Image content ${i} inserted successfully into solustion table`);
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
}



      res.send('Text content and images extracted and saved to the database with the selected topic ID successfully.');
    } catch (error) {
      console.error(error);
      res.status(500).send('Error extracting content and saving it to the database.');
    }
  });