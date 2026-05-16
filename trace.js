const potrace = require('potrace');
const fs = require('fs');
const path = require('path');

const inputImagePath = 'c:\\Users\\admin\\Documents\\Freelance Projects\\tramem\\public\\images\\z7832446416603_832a2a66db3562caa64214f73e2bdc8e.jpg';
const outputSvgPath = 'c:\\Users\\admin\\Documents\\Freelance Projects\\tramem\\public\\images\\logo-traced.svg';

potrace.trace(inputImagePath, function(err, svg) {
  if (err) {
    console.error('Error tracing image:', err);
    return;
  }
  fs.writeFileSync(outputSvgPath, svg);
  console.log('Successfully traced image to logo-traced.svg');
});
