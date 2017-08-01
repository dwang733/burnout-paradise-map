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
                const elemFinish = $("<area>");
                elemFinish.prop("shape", "circle");
                elemFinish.prop("coords", `${xCoord}, ${yCoord}, 0`);
                elemFinish.prop("id", `Finish: ${eventName}`)

                // DOM elements for Tooltipster
                elem.addClass("tooltip");
                elemFinish.addClass("tooltip");
                elem.prop("title", eventName);
                elemFinish.prop("title", `Finish: ${eventName}`);
                if (sheetName === "Events" && sheet[`F${row}`]) {
                    const dest = $(`[id='Finish: ${sheet[`F${row}`].v}']`);
                    elem.tooltipster({
                        functionBefore: () => dest.tooltipster("open"),
                        functionAfter: () => dest.tooltipster("close"),
                        distance: 0 // Need this to correctly activate on event nodes
                    });
                } else {
                    elem.tooltipster({distance: 0});
                }
                elemFinish.tooltipster({distance: 0});
                imageMap.append(elem);
                imageMap.append(elemFinish);
                row++;
            }
        }
    } catch (e) {
        console.error(e);
    }
}

main();