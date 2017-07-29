"use strict";

function readExcelFile(url) {
    return new Promise((resolve, reject) => {
        let xhr = new XMLHttpRequest();
        xhr.open("GET", url, true);
        xhr.responseType = "arraybuffer";
        xhr.onload = () => {
            if (xhr.status === 200) {
                resolve(xhr.response);
            } else {
                reject(xhr.statusText);
            }
        };
        xhr.onerror = () => reject(xhr.statusText);
        xhr.send();
    });
}

async function main() {
    try {
        const excelFilePath = "map_data.xlsx";
        const arrayBuffer = await readExcelFile(excelFilePath);
        const data = new Uint8Array(arrayBuffer);
        const arr = [];
        for(let i = 0; i !== data.length; i++) {
            arr[i] = String.fromCharCode(data[i]);
        }
        const bStr = arr.join("");
        const workbook = XLSX.read(bStr, {type: "binary"});

        const sizeMultiplier = 0.6;
        const img = $("#burnoutmap");
        img.height(img.height() * sizeMultiplier); // Changing only height maintains aspect ratio
        img.removeAttr("hidden");

        const imageMap = $("#imageMap");
        // Shift event destinations to beginning so events can reference them
        workbook.SheetNames.splice(workbook.SheetNames.indexOf("Event Destinations"), 1);
        workbook.SheetNames.unshift("Event Destinations");
        for (let i = 0; i < workbook.SheetNames.length; i++) {
            const sheetName = workbook.SheetNames[i];
            const sheet = workbook.Sheets[sheetName];
            let row = 2;
            while (sheet[`A${row}`]) {
                const eventName = sheet[`A${row}`].v;
                const xCoord = sheet[`B${row}`].v * sizeMultiplier;
                const yCoord = sheet[`C${row}`].v * sizeMultiplier;
                const areaRadius = sheetName === "Event Destinations" ? 0 : 7 * sizeMultiplier;

                const elem = $("<area>");
                elem.prop("shape", "circle");
                elem.prop("coords", `${xCoord}, ${yCoord}, ${areaRadius}`);
                elem.prop("id", eventName);

                // DOM elements for Tooltipster
                elem.addClass("tooltip");
                elem.prop("title", eventName);
                if (sheetName === "Event Destinations") {
                    elem.prop("title", `Finish: ${elem.prop("title")}`);
                }
                if (sheetName === "Events") {
                    const dest = $(`[id='${sheet[`F${row}`].v}']`);
                    console.log(dest);
                    elem.tooltipster({
                        functionBefore: () => dest.tooltipster("open"),
                        functionAfter: () => dest.tooltipster("close"),
                        distance: 0 // Need this to correctly activate on event nodes
                    });
                }
                imageMap.append(elem);
                row++;
            }
        }
        $(".tooltip").tooltipster({distance: 0});
    } catch (e) {
        console.error(e);
    }
}

main();