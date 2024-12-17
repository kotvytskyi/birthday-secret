var isDrawing = false;
var isRunning = false;

var input = [];
var amplitude = [];
var phase = [];
var indices = [];
var fourierDrawing = []

var sliderNMax;
var sliderDt;
var nMax = 0;
var drawingOffset = 0;
var dt = 0.28;
var verified = false;
var statusText = '';

function setup() {
  canvas = createCanvas(1200, 700);
  canvas.canvas.style.width = '100%';
  canvas.canvas.style.height = 'calc(100vh - 60px)';
  canvas.canvas.style.padding = '50px 0';
  background(0, 0, 50);

  canvas.mousePressed(mousePressed1);
  canvas.mouseReleased(mouseReleased1);

  sliderDt = createSlider(0.01, 2, 1, 0.01);
  sliderDt.position(width/2-200, height-80);
  sliderDt.style('width', '400px');
  sliderDt.style('display', 'none');
  sliderDt.changed(() => dt = sliderDt.value());

  // Create a button
  statusText = createElement('div');
  statusText.html("Твоє ім'я — це чарівний ключ, який будить сплячого робота Фур’є. Введи ключ і отримай скарб!");
  statusText.style('text-align', 'center');
  statusText.style('position', 'absolute');
  statusText.style('top', '20px');
  statusText.style('right', '10px');
  statusText.style('width', 'calc(100% - 20px)'); // Style the button
  statusText.style('height', '40px');
  statusText.style('font-size', '16px');

  return canvas;
}

async function verify() {
  const canvas = document.querySelector('canvas');
  reset();
  isRunning = false

  // open in new tab in a chrome supported way
  setTimeout(() => {
    const base64Image = canvas.toDataURL("image/png");

    try {
      fetch("https://api.openai.com/v1/chat/completions", {
        method: "POST",
        headers: {
          "Authorization": "Bearer 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", // Replace with your OpenAI API key
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          model: "gpt-3.5-turbo",
          messages: [
            {
              role: "system",
              content: "Look at this picture and tell me if it looks like someone wrote a name without picking up their pencil. Do you think it looks like something a kid might draw? Check if all the letters are connected and wiggly, like it was done in one go! It's a child work. It must not be perfect. SAY 'YES' even if it's somewhat similiar. YES NO NO. YOU RECEIVE IMAGE. YOU REPLY YES OR NO"
            },
            {
              role: "user",
              content: [
                {
                  type: "image_url",
                  image_url: {
                    url: base64Image
                  }
                }
              ]
            }
          ],
          max_tokens: 2
        })
      }).then(response => response.json()).then(data => {
        const textContent = data.choices[0]?.message?.content || "No result found.";
      
        if (textContent == "YES") {
          const link = document.createElement('a'); // Create a link element
          link.download = 'cert.jpg'; // File name
          link.href = './cert.jpg'; // File URL
          link.click(); // Simulate click to trigger download
          return true;
        } else {
          return false;
        }
      });
  
    } catch (error) {
      return false;
    }

    isDrawing = false;
    isRunning = true;
  }, 50);

  return false;
}

async function draw() {
  background(0, 0, 50);

  // User drawing mode
  if (isDrawing){
    if ((pow(mouseX - width/2 -input[input.length-1].x, 2) + pow(mouseY - height/2 - input[input.length-1].y, 2)) > pow(1, 2)){
      input.push(createVector(mouseX - width/2, mouseY - height/2));
    }
  }

  // Original shape
  stroke(255);
  noFill();
  strokeWeight(5);
  beginShape();
  for (let i=0;i<input.length;i++){
    vertex(width/2 + input[i].x, height/2 + input[i].y)
  }
  endShape();

  // DRAW CIRCLES
  if (isRunning && amplitude[0]){
    let currentX = width/2 + amplitude[0].x;
    let currentY = height/2 + amplitude[0].y;
    let center = createVector(currentX, currentY);

    fill(255, 255, 255, 100);
    noStroke();
    ellipse(currentX, currentY, 10)

    for (let n = 1;n<nMax;n++){
      let currentN = indices[n];
      let k = currentN <= input.length/2 ? currentN : currentN - input.length;

      if (abs(amplitude[currentN]) > 5){

        let phi = (drawingOffset * k * TWO_PI / input.length) + phase[currentN];
        currentX += amplitude[currentN] * Math.cos(phi);
        currentY += amplitude[currentN] * Math.sin(phi);

        drawCircles(center, amplitude[currentN], currentX, currentY);

        center.x = currentX;
        center.y = currentY;
      }
    }
    if (nMax > 0){fourierDrawing.push(createVector(currentX, currentY));}
  }

  // fourierDrawing
    if (!isDrawing && isRunning){
    stroke(255, 0, 0, 255);
    noFill();
    strokeWeight(5);
    beginShape();
    for (let i=0;i<fourierDrawing.length;i++){
      vertex(fourierDrawing[i].x, fourierDrawing[i].y)
    }

    endShape();
  }

  // Info Text
  stroke(255);
  fill(255);
  strokeWeight(0.5);
  textAlign(LEFT);
  textSize(15);
  textAlign(CENTER);

  // motion
  if (isRunning){drawingOffset = drawingOffset + dt;}
  if (drawingOffset > input.length){

    if (!verified) {
      verified = true;
      const res = await verify();
      if (!res) {
        statusText.html('Ох, якби ж то я міг прочитати...Трошки чіткіше, будь ласка!');
      }
    }

    drawingOffset = 0;
    fourierDrawing = [];
  }
}

function reset() {
  performFourier();
  fourierDrawing = [];
  drawingOffset = 0;
  nMax = 100; //sliderNMax.value()
}


function mousePressed1() {
  verified = false;
  if (!((mouseX > width/2-200 || mouseX < width/2+200) && mouseY > height-100)){
    drawingOffset = 0;
    isRunning = false;
    input = [createVector(mouseX - width/2, mouseY - height/2)];
    isDrawing = true;
  }

}


function mouseReleased1() {
  statusText.html('Сканування та перевірка...');
  if (!((mouseX > width/2-200 || mouseX < width/2+200) && mouseY > height-100)){
    isDrawing = false;
    refreshNMaxSlider();
    reset();
    isRunning = true;
  }
}


function refreshNMaxSlider() {
  if (sliderNMax){sliderNMax.remove();}
  sliderNMax = createSlider(1, max(1, input.length), int(input.length/2), 1);
  sliderNMax.position(width/2-200, height-40);
  sliderNMax.style('display', 'none');
  sliderNMax.changed(reset);
}


function performFourier() {
  fourier = fourierTrafo(input);
  amplitude = fourier.amplitude;
  phase = fourier.phase;
  indices = fourier.indices;
}


function drawCircles(center, amplitude, currentX, currentY){
  noFill();
  stroke(255, 255, 255, 100)
  ellipse(center.x, center.y, 2*amplitude)

  fill(255, 255, 255, 100);
  noStroke();
  ellipse(currentX, currentY, 10)

  stroke(255, 255, 255, 100);
  noFill();
  strokeWeight(2.5);
  line(currentX, currentY, center.x, center.y);
  strokeWeight(5);
}
