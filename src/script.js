import Potrace from 'potrace';
import { getPathLengthLookup } from "svg-getpointatlength"
import { ifftPath, generateCircleCenters } from './fourierTransform';

let MAX_NUMBER_OF_POINTS = 3000;
let globalCounter = 1;
let freqs = [];

document.addEventListener('DOMContentLoaded', () => {
    const fileInput = document.getElementById('fileInput');
    const canvas = document.getElementById('imageCanvas');
    const ctx = canvas.getContext('2d');

    // Function to convert image to SVG
    function imageToSVG(img) {
        return new Promise((resolve, reject) => {
            const tempCanvas = document.createElement('canvas');
            const tempCtx = tempCanvas.getContext('2d');
            tempCanvas.width = canvas.width;
            tempCanvas.height = canvas.height;
            tempCtx.drawImage(img, 0, 0);

            const imageData = tempCtx.getImageData(0, 0, tempCanvas.width, tempCanvas.height);
            
            Potrace.trace(imageData, (err, svg) => {
                if (err) {
                    console.error('Potrace error:', err);
                    reject(err);
                    return;
                }
                resolve(svg);

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

    fileInput.addEventListener('change', (e) => {
        const file = e.target.files[0];
        if (file && file.type.startsWith('image/')) {
            const reader = new FileReader();
            reader.onload = (event) => {
                const img = new Image();
                img.onload = async () => {
                    // Set canvas size to 90% of the smaller viewport dimension
                    const size = Math.min(window.innerWidth, window.innerHeight) * 0.9;
                    canvas.width = size;
                    canvas.height = size;
                    canvas.style.display = 'block';

                    document.getElementById("upload-container").style.display = 'none';

                    try {
                        // Calculate scaling to fit image in canvas while maintaining aspect ratio
                        const scale = Math.min(canvas.width / img.width, canvas.height / img.height);
                        const scaledWidth = img.width * scale;
                        const scaledHeight = img.height * scale;

                        // Calculate position to center the image in the canvas
                        const translateX = (canvas.width - scaledWidth) / 2;
                        const translateY = (canvas.height - scaledHeight) / 2;

                        // Create a temporary canvas for the scaled image
                        const tempCanvas = document.createElement('canvas');
                        tempCanvas.width = canvas.width;
                        tempCanvas.height = canvas.height;
                        const tempCtx = tempCanvas.getContext('2d');
                        tempCtx.translate(canvas.width/2,canvas.height/2);
                        // Draw the scaled image on the temporary canvas
                        tempCtx.drawImage(img, -scaledWidth/2, -scaledHeight/2, scaledWidth, scaledHeight);

                        // Convert scaled image to SVG
                        const svg = await imageToSVG(tempCanvas);
                        // Connect SVG paths
                        const connectedPath = connectSVGPaths(svg);
                        const svgElement = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
                        svgElement.setAttribute('style', `position: absolute; background-color: #fff; opacity: 0.1; transform: translate(${translateX}px, ${translateY}px)`);
                        svgElement.setAttribute('width', canvas.width);
                        svgElement.setAttribute('height', canvas.height);
                        svgElement.setAttribute('stroke', 'black');
                        svgElement.setAttribute('fill', 'none');


                        // add stroke width if you want it to be seen
                        const pathElement = document.createElementNS('http://www.w3.org/2000/svg', 'path');
                        pathElement.setAttribute('d', connectedPath);
                        svgElement.appendChild(pathElement);

                        document.body.appendChild(svgElement);
                        // Clear the canvas
                        ctx.clearRect(0, 0, canvas.width, canvas.height);

                        // Animate path traversal
                        animatePath(connectedPath, tempCanvas, translateX, translateY);
                    } catch (error) {
                        console.error('Error processing image:', error);
                        alert('Error processing image. Please try another image.');
                        document.getElementById("upload-container").style.display = 'block';

                    }
                };
                img.src = event.target.result;
            };
            reader.readAsDataURL(file);
        } else {
            alert('Please select a valid image file.');
        }
    });

    // Update the imageToSVG function to accept a canvas instead of an image
    function imageToSVG(canvas) {
        return new Promise((resolve, reject) => {
            const imageData = canvas.getContext('2d').getImageData(0, 0, canvas.width, canvas.height);

            Potrace.trace(imageData, (err, svg) => {
                if (err) {
                    console.error('Potrace error:', err);
                    reject(err);
                    return;
                }
                resolve(svg);
            });
        });
    }

    // Update the animatePath function to use the canvas dimensions
    function animatePath(path, canvas, translateX, translateY) {
        let pathLengthLookup = getPathLengthLookup(path);
        let totalLength = pathLengthLookup.totalLength;
    
        const points = [];
        let incremebt = totalLength > 2 * MAX_NUMBER_OF_POINTS ? Math.floor(totalLength / MAX_NUMBER_OF_POINTS) : 1;
        for (let i = 0; i <= totalLength; i += incremebt) {
            points.push(pathLengthLookup.getPointAtLength(i));
        }

        let freqs = ifftPath(points);
        
        ctx.lineWidth = 1;
        let iteration = 0;
        globalCounter = freqs.length - 1;
        let tracedPoints = [];
        function draw() {

            let newFreqs = generateCircleCenters(freqs, iteration);

            tracedPoints.push(newFreqs[globalCounter]);

            ctx.clearRect(0, 0, canvas.width, canvas.height);

            let nextX;
            let nextY;

            ctx.beginPath();

            ctx.lineWidth = 1;
            ctx.strokeStyle = 'black';
            for (let i = 1; i < iteration; i++) {
                ctx.moveTo(tracedPoints[i-1][0] + translateX, tracedPoints[i-1][1] + translateY);
                ctx.lineTo(tracedPoints[i][0] + translateX, tracedPoints[i][1] + translateY);
            }

            for (let j = 0; j < globalCounter; j++) {
                if (j < newFreqs.length - 1) {
                    nextX = newFreqs[j + 1][0];
                    nextY = newFreqs[j + 1][1];
                } else {
                    nextX = newFreqs[j][0];
                    nextY = newFreqs[j][1];
                }

                const center = newFreqs[j];
                let r = Math.sqrt((nextX - center[0]) ** 2 + (nextY - center[1]) ** 2);
                if (j < newFreqs.length - 1) {
                    ctx.moveTo(center[0] + translateX, center[1] + translateY);
                    ctx.lineTo(nextX + translateX, nextY + translateY);
                    // ctx.fillRect(center[0] + translateX, center[1] + translateY, 2, 2);
                    ctx.moveTo(center[0] + translateX + r, center[1] + translateY);
                    ctx.arc(center[0] + translateX, center[1] + translateY, r, 0, 2 * Math.PI);
                }
            }
            ctx.closePath();
            ctx.stroke();

            iteration += 1;
            if (iteration < freqs.length) {
                requestAnimationFrame(draw);
            } else {
                // Draw original image in black and white
                ctx.globalCompositeOperation = 'source-atop';
                ctx.filter = 'grayscale(100%)';
                ctx.drawImage(canvas, 0, 0);
                ctx.globalCompositeOperation = 'source-over';
                ctx.filter = 'none';
            }
        }
    
        requestAnimationFrame(draw);
    }

    canvas.addEventListener("click", (e) => {
        if (e.detail === 2) {
            if (globalCounter > 0) {
                globalCounter--
            }
        } else if (e.detail === 1) {
            if (globalCounter < freqs.length - 1) {
                globalCounter++
            }
        }
    });
});
