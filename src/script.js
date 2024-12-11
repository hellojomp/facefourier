import Potrace from 'potrace';

document.addEventListener('DOMContentLoaded', () => {
    const fileInput = document.getElementById('fileInput');
    const canvas = document.getElementById('imageCanvas');
    const ctx = canvas.getContext('2d');

    // Function to convert image to SVG
    function imageToSVG(img) {
        return new Promise((resolve, reject) => {
            const tempCanvas = document.createElement('canvas');
            const tempCtx = tempCanvas.getContext('2d');
            tempCanvas.width = img.width;
            tempCanvas.height = img.height;
            tempCtx.drawImage(img, 0, 0, 400, 400);

            const imageData = tempCtx.getImageData(0, 0, 400, 400);
            console.log('starting to run potrace');
            
            Potrace.trace(imageData, (err, svg) => {
                if (err) {
                    console.error('Potrace error:', err);
                    reject(err);
                    return;
                }
                console.log('potrace to SVG started');
                resolve(svg);
                console.log('potrace to SVG finished');

            });
        });
    }


    // Function to connect SVG paths
    function connectSVGPaths(svgString) {
        const parser = new DOMParser();
        const svgDoc = parser.parseFromString(svgString, 'image/svg+xml');
        const paths = svgDoc.querySelectorAll('path');

        let connectedPath = '';
        let lastPoint = null;

        paths.forEach((path, index) => {
            const d = path.getAttribute('d');
            const commands = d.match(/[MLHVCSQTAZmlhvcsqtaz][^MLHVCSQTAZmlhvcsqtaz]*/g);

            commands.forEach((cmd) => {
                const type = cmd[0];
                const points = cmd.slice(1).trim().split(/[\s,]+/).map(Number);

                if (type.toUpperCase() === 'M') {
                    if (lastPoint) {
                        const [x, y] = points;
                        connectedPath += `L${x},${y} `;
                    } else {
                        connectedPath += cmd + ' ';
                    }
                } else {
                    connectedPath += cmd + ' ';
                }

                if (points.length >= 2) {
                    lastPoint = [points[points.length - 2], points[points.length - 1]];
                }
            });
        });

        return connectedPath.trim();
    }

    // Function to animate path traversal
    function animatePath(path, img, translateX, translateY) {
        const pathLength = path.getTotalLength();
        const points = [];
        for (let i = 0; i <= pathLength; i += 1) {
            points.push(path.getPointAtLength(i));
        }

        let currentPoint = 0;
        function draw() {
            ctx.fillStyle = 'black';
            ctx.fillRect(points[currentPoint].x + translateX, points[currentPoint].y + translateY, 2, 2);
            currentPoint++;

            if (currentPoint < points.length) {
                requestAnimationFrame(draw);
            } else {
                // Draw original image in black and white
                ctx.globalCompositeOperation = 'source-atop';
                ctx.filter = 'grayscale(100%)';
                ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
                ctx.globalCompositeOperation = 'source-over';
                ctx.filter = 'none';
            }
        }

        requestAnimationFrame(draw);
    }

    fileInput.addEventListener('change', (e) => {
        const file = e.target.files[0];
        if (file && file.type.startsWith('image/')) {
            const reader = new FileReader();
            reader.onload = (event) => {
                const img = new Image();
                img.onload = async () => {
                    canvas.width = window.innerWidth;
                    canvas.height = window.innerHeight;
                    canvas.style.display = 'block';
    
                    try {
                        // Convert image to SVG
                        const svg = await imageToSVG(img);
    
                        console.log('SVG path connecting started');
                        // Connect SVG paths
                        const connectedPath = connectSVGPaths(svg);
                        console.log('SVG path connecting finished');
    
                        // Create SVG path element
                        const svgElement = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
                        svgElement.setAttribute('width', canvas.width);
                        svgElement.setAttribute('height', canvas.height);
                        const pathElement = document.createElementNS('http://www.w3.org/2000/svg', 'path');
                        pathElement.setAttribute('d', connectedPath);
    
                        // Calculate scale to fit the image within the canvas
                        console.log(canvas.width, canvas.height, img.width, img.height);
                        const scaleX = canvas.width / img.width;
                        const scaleY = canvas.height / img.height;
                        const scale = 1
    
                        // Calculate translation to center the image
                        const translateX = (canvas.width - img.width * scale) / 2;
                        const translateY = (canvas.height - img.height * scale) / 2;
    
                        // Apply transformation to center and scale the image
                        // pathElement.setAttribute('transform', `translate(${translateX}, ${translateY}) scale(${scale})`);
                        svgElement.appendChild(pathElement);
    
                        // Clear the canvas
                        ctx.clearRect(0, 0, canvas.width, canvas.height);
    
                        // Animate path traversal
                        animatePath(pathElement, img, translateX, translateY);
                    } catch (error) {
                        console.error('Error processing image:', error);
                        alert('Error processing image. Please try another image.');
                    }
                };
                img.src = event.target.result;
            };
            reader.readAsDataURL(file);
        } else {
            alert('Please select a valid image file.');
        }
    });
    
    // Resize canvas when window is resized
    window.addEventListener('resize', () => {
        if (canvas.style.display === 'block') {
            canvas.width = window.innerWidth;
            canvas.height = window.innerHeight;
            // Re-draw the image here if needed
        }
    });
});