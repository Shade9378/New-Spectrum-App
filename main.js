const MOL_CANVAS_WIDTH = 90;
const MOL_CANVAS_HEIGHT = 90;
const SPEC_CANVAS_WIDTH = 95;
const SPEC_CANVAS_HEIGHT = 95;

let displayingMol = "Ethanol"

function displayOrHideElement(elementName) {
    const element = document.querySelector(elementName);

    if (element) {
        const currentDisplay = window.getComputedStyle(element).display;
        const fragTableButton = document.querySelector(".frag-table-button");

        if (currentDisplay === "block") {
            element.style.display = "none";
            fragTableButton.innerText = "Open Fragment Table"
        }
        else {
            fragTableButton.innerText = "Close Fragment Table"
            element.style.display = "block";
        }
    } else {
        console.warn(`Element with selector "${elementName}" not found.`);
    }
}

function clickout(elementName) {
    const element = document.querySelector(elementName);

    if (element) {
        const currentDisplay = window.getComputedStyle(element).display;
        const fragTableButton = document.querySelector(".frag-table-button");

        if (currentDisplay === "block") {
            element.style.display = "none";
            fragTableButton.innerText = "Open Fragment Table"
        }
    } else {
        console.warn(`Element with selector "${elementName}" not found.`);
    }
}

document.querySelector(".frag-table-button").addEventListener("click", function() {
    event.stopPropagation()
    displayOrHideElement(".frag-table");
});

document.addEventListener("click", function() {
    const clickedElement = event.target

    if (clickedElement.className !== "frag-table" && clickedElement.className !== "f-t-general-instr") {
        clickout(".frag-table");
    }
});

///drag
dragElement(".frag-table", ".f-t-general-instr");

function dragElement(elementName, elementHeader) {
    let element = document.querySelector(elementName);

    if (!element) {
        console.error(`Element with selector "${elementName}" not found. Cannot make it draggable.`);
        return;
    }

    let pos1 = 0, pos2 = 0, pos3 = 0, pos4 = 0;

    let dragHandle = element;
    if (elementHeader) { 
        const headerElement = document.querySelector(elementHeader);
        if (headerElement) {
            dragHandle = headerElement; 
        } else {
            console.warn(`Element header with selector "${elementHeader}" not found. Using main element as drag handle.`);
        }
    }

    element.style.cursor = 'grab';
    element.style.touchAction = 'none';

    dragHandle.onmousedown = dragStart;   
    dragHandle.ontouchstart = dragStart;


    // --- Core Drag Functions ---
    function dragStart(e) {
        e = e || window.event;
        e.preventDefault(); 

        let currentClientX, currentClientY;
        if (e.type === 'touchstart') {
            const touch = e.touches[0];
            currentClientX = touch.clientX;
            currentClientY = touch.clientY;
        } else { 
            currentClientX = e.clientX;
            currentClientY = e.clientY;
        }

        pos3 = currentClientX; 
        pos4 = currentClientY; 

        if (e.type === 'touchstart') {
            document.ontouchend = dragEnd;
            document.ontouchmove = elementDrag;
        } else {
            document.onmouseup = dragEnd;
            document.onmousemove = elementDrag;
        }

        element.style.cursor = 'grabbing'; 
    }

    function elementDrag(e) {
        e = e || window.event;

        let currentClientX, currentClientY;
        if (e.type === 'touchmove') {
            e.preventDefault(); 
            const touch = e.touches[0];
            currentClientX = touch.clientX;
            currentClientY = touch.clientY;
        } else { // mousemove
            currentClientX = e.clientX;
            currentClientY = e.clientY;
        }

        pos1 = pos3 - currentClientX;
        pos2 = pos4 - currentClientY;

        pos3 = currentClientX;
        pos4 = currentClientY;

        let newTop = element.offsetTop - pos2;
        let newLeft = element.offsetLeft - pos1;

        const viewportWidth = window.innerWidth || document.documentElement.clientWidth || document.body.clientWidth;
        const viewportHeight = window.innerHeight || document.documentElement.clientHeight || document.body.clientHeight;

        const elementWidth = element.offsetWidth;
        const elementHeight = element.offsetHeight;

        const minX = 0;
        const minY = 0;
        const maxX = viewportWidth - elementWidth;
        const maxY = viewportHeight - elementHeight;

        newLeft = Math.max(minX, Math.min(newLeft, maxX));
        newTop = Math.max(minY, Math.min(newTop, maxY));

        element.style.top = newTop + "px";
        element.style.left = newLeft + "px";
    }

    function dragEnd() {
        document.onmouseup = null;
        document.onmousemove = null;
        document.ontouchend = null;
        document.ontouchmove = null;
    }
}


/// Change alert
window.onbeforeunload = function() {
  return "Data will be lost if you leave the page, are you sure?";
};

/// Display molecules and spectral graph
async function getData(path = "") {
    const response = await fetch(path);

    if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status} - Could not load file from URL.`);
    }

    const contentString = await response.text();
    
    return contentString;
}

/// !!!NOTICE: For anyone who try to work on this part, the original ChemDoodle lib only support 

async function setUpCanvas(path='', molCanvasId, specCanvasId) {
    removeCanvas(molCanvasId)
    removeCanvas(specCanvasId)

    let data = await getData(path) 

    let canvas = new ChemDoodle.io.JCAMPInterpreter().makeStructureSpectrumSet(
        'sample', 
        data, 
        percentage("#" + molCanvasId, MOL_CANVAS_WIDTH, "width"), 
        percentage("#" + molCanvasId, MOL_CANVAS_HEIGHT, "height"), 
        percentage("#" + specCanvasId, SPEC_CANVAS_WIDTH, "width"), 
        percentage("#" + specCanvasId, SPEC_CANVAS_HEIGHT, "height"),
    )

    console.log(canvas);
    return canvas;
}

const MOL_CANVAS_ID = "sample_molecule";
const SPEC_CANVAS_ID = "sample_spectrum";
let canvases = setUpCanvas(
    'data/Spectra/MS/' + displayingMol + 'MS.jdx',
    MOL_CANVAS_ID,
    SPEC_CANVAS_ID
);


function getDivAndParentEl(divSelector) {
    div = document.querySelector(divSelector);

    if (!div) {
        console.error(`Element with selector "${divSelector}" not found.`);
        return null;
    }

    parent = div.parentNode;
    
    if (!parent) {
        console.error(`Element with selector "${divSelector}" has no parent.`);
        return null;
    }

    return {
        element: div,
        parent: parent

    };
}

function percentage(divSelector, percentage, dimension) {
    let divAndParent = getDivAndParentEl(divSelector)

    if (!divAndParent) {
        return
    }

    let parent = divAndParent.parent;

    parentDimension = (dimension === "width") ? parent.offsetWidth : parent.offsetHeight 
    caculatedDimension = parentDimension * percentage / 100;

    return caculatedDimension
}

async function initializeCanvas(canvas, url="") {
    
}

function removeCanvas(canvasId) {
	let canvasAndParent = getDivAndParentEl("#" + canvasId);

    if (!canvasAndParent) {
        return
    }

    let canvas = canvasAndParent.element;
    let parent = canvasAndParent.parent;
    let newCanvas = document.createElement("canvas");
    
    newCanvas.id = canvasId;

	parent.replaceChild(newCanvas, canvas);
}

async function createCompoundSubmenu(menuFilePath) {
    let dropdownMenu = document.querySelector(".dropdown");  

    let ddContentWrapper = document.createElement("div");
    ddContentWrapper.classList.add("dropdown-content");

    dropdownMenu.appendChild(ddContentWrapper);

    fetch(menuFilePath)
    .then(response => response.text())
    .then(data => {
        const lines = data.split('\n');
        const itemArray = lines.map(line => line.trim()).filter(line => line !== '');
        
        for(let i = 0; i < itemArray.length; i += 1) {
            let subItem = document.createElement("a");
            subItem.textContent = itemArray[i];
            subItem.id = "dropdown-item-" + i;
            subItem.classList.add('dropdown-item');
            ddContentWrapper.appendChild(subItem);

            subItem.addEventListener('click', function(event) {
                event.preventDefault(); // Prevent default link behavior if you're handling navigation with JS
                displayingMol = itemArray[i];
                setUpCanvas('data/Spectra/MS/' + itemArray[i] + 'MS.jdx',
                    MOL_CANVAS_ID,
                    SPEC_CANVAS_ID
                )
            });
        }
    })
    .catch(error => console.error('Error reading file:', error));

    dropdownMenu.appendChild(ddContentWrapper)
}


function refreshCanvas() {

}

createCompoundSubmenu("data/Spectra/CompondMenu.txt")

document.querySelectorAll(".nav-bar-section").forEach(button => {
    button.addEventListener("click", function() {
        if (this.id === "compounds") {
            return;
        }
        setUpCanvas('data/Spectra/' + this.id + '/' + displayingMol + this.id + '.jdx',
            MOL_CANVAS_ID,
            SPEC_CANVAS_ID
        ) 
    });
})

async function getDataJSON(jsonPath) {
    const response = await getData(jsonPath);
    const dataObject = JSON.parse(response);

    return dataObject;
}

// You can attach a mousemove listener directly to the ChemDoodle Canvas instance
// canvases.then(canvasesArray => {
//     let spectrumData = canvasesArray[1].spectrum.data;
//     let dataLength = spectrumData.length;
//     console.log("Total data points:", dataLength);

//     let plotMinDataX = Math.min(spectrumData[0].x, spectrumData[dataLength - 1].x); 
//     let plotMaxDataX = Math.max(spectrumData[0].x, spectrumData[dataLength - 1].x); 

//     let dataRange = plotMaxDataX - plotMinDataX;
//     console.log("Data range:", dataRange);

//     let canvasWidth = canvasesArray[1].width;
//     console.log("Canvas total pixel width:", canvasWidth);

//     let targetCanvasElement = document.querySelector("#sample_spectrum");

//     targetCanvasElement.addEventListener("mousemove", function(event) {
//         const xCoordinate = event.offsetX; // Pixel X position relative to the canvas element

//         let calculatedDataX = plotMaxDataX - (xCoordinate / canvasWidth) * dataRange;

//         console.log(`Mouse X position (pixel): ${xCoordinate.toFixed(0)}px`);
//         console.log(`Estimated Data X position (flipped axis): ${calculatedDataX.toFixed(0)}`);

//         let textBox  = document.querySelector(".spec-desc")

//         getDataJSON("data/Spectra/SpecDescription/2-Pentanone.json").then(text => {
//             if (calculatedDataX.toFixed(0) == 31) {
//                 textBox.innerHTML = text.description;
//                 console.log(text.description);
//             }
//             else {
//                  textBox.innerHTML = text.name;
//                 console.log(text.name);
//             }
            
//         })
//     });

// }).catch(error => {
//     // This code runs if any Promise in the chain (getData or makeStructureSpectrumSet) rejects
//     console.error("An error occurred during canvas setup:", error);
// });

async function setupSpectrumInteractivity(canvases, mode, path) {
    try {
        const canvasesArray = await canvases;

        let specCanvas = canvasesArray[1];

        let targetCanvasElement = document.querySelector("#sample_spectrum");

        targetCanvasElement.addEventListener("mousemove", async function(event) {
            const xCoordinate = event.offsetX; 

            let calculatedDataX = convertPxToChem(specCanvas, xCoordinate);
            console.log("Real X Coordinate " + xCoordinate)
            console.log("Converted X Coordinate " + calculatedDataX)

            displayTextWhenHovered("data/Spectra/SpecDescription/Ethanol.json", calculatedDataX, "MS")
        });

    } catch (mainSetupError) {
        console.error("An error occurred during initial spectrum setup:", mainSetupError);
    }
}


function convertPxToChem(canvas, xCoordinate) {
    let spectrumData = canvas.spectrum.data;
    let dataLength = spectrumData.length;
    // console.log("Total data points:", dataLength);

    let plotMinDataX = Math.min(spectrumData[0].x, spectrumData[dataLength - 1].x);
    let plotMaxDataX = Math.max(spectrumData[0].x, spectrumData[dataLength - 1].x);

    let dataRange = plotMaxDataX - plotMinDataX;
    // console.log("Data range:", dataRange);

    let canvasWidth = canvas.width;
    // console.log("Canvas total pixel width:", canvasWidth);

    let calculatedDataX = plotMaxDataX - (xCoordinate / canvasWidth) * dataRange;

    return calculatedDataX.toFixed(0);
}
/// Things need to be done:
/// - Add function for text description for each viewing mode
/// - Add ratio calculation for viewing mode other than MS 
/// - Need to return the text to general description when hover out of the canvas

async function displayTextWhenHovered(path, hoveredX, mode="", elSelector=".spec-desc") {
    let textBox = document.querySelector(elSelector); 
    
    try {
        const specJSON = await getDataJSON(path);
        if (mode === "") {
            textBox.innerText = specJSON.description;
            console.log(specJSON.general_description);
        }
        else {
            let modeObj;
            switch (mode) {
                case "MS":
                    modeObj = specJSON.spectra_info.MS;
                    break
                case "IR":
                    modeObj = specJSON.spectra_info.IR;
                    break
                case "HNMR":
                    modeObj = specJSON.spectra_info.HNMR;
                    break
                case "CNMR":
                    modeObj = specJSON.spectra_info.CNMR;
                    break
            }

            let peaksArray = modeObj.peaks

            textBox.innerText = modeObj.general_description;

            for(let i = 0; i < peaksArray.length; i += 1)  {
                if (hoveredX == peaksArray[i].x) {
                    textBox.innerHTML = peaksArray[i].description;
                }
            }
        }
        
    } catch (jsonError) {
        console.error("Error fetching or parsing JSON in mousemove:", jsonError);
        textBox.innerHTML = "Error loading description."; // Inform user of error
    }
}

setupSpectrumInteractivity(canvases)

function displayText() {

}

