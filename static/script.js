function addCargoInput() {
    const div = document.createElement('div');
    div.className = 'input-group';
    div.innerHTML = `
        <div style="display: flex; gap: 10px; flex-wrap: wrap;">
            <div><label>Qty</label><input type="number" class="pQty" value="1" step="1"></div>
            <div><label>Length (m)</label><input type="number" class="pL" value="0.8" step="0.1"></div>
            <div><label>Width (m)</label><input type="number" class="pW" value="0.6" step="0.1"></div>
        </div>`;
    document.getElementById('cargoList').appendChild(div);
}

async function calculate() {
    const cargo = [];
    const pQty = document.querySelectorAll('.pQty');
    const pL = document.querySelectorAll('.pL');
    const pW = document.querySelectorAll('.pW');

    for (let i = 0; i < pL.length; i++) {
        cargo.push({
            qty: pQty[i].value,
            length: pL[i].value,
            width: pW[i].value
        });
    }

    const tL = document.getElementById('tLength').value;
    const tW = document.getElementById('tWidth').value;

    const response = await fetch('/optimize', {
        method: 'POST',
        headers: {'Content-Type': 'application/json'},
        body: JSON.stringify({ truck_length: tL, truck_width: tW, cargo: cargo })
    });

    const result = await response.json();

    const statusBox = document.getElementById('statusBox');
    const missingKeys = Object.keys(result.missing);

    if (missingKeys.length > 0) {
        statusBox.className = "status-msg warning";
        let details = missingKeys.map(id => `${result.missing[id]}x Type ${id}`).join(", ");
        statusBox.innerText = "Did not fit: " + details;
    } else {
        statusBox.className = "status-msg success";
        statusBox.innerText = "All cargo fits!";
    }

    drawTruck(result.fitted, tL, tW);
}

function drawTruck(fitted, tL, tW) {
    const canvas = document.getElementById('truckCanvas');
    const ctx = canvas.getContext('2d');
    const scale = 140;
    const margin = 80;

    canvas.width = (tL * scale) + (margin * 1.5);
    canvas.height = (tW * scale) + (margin * 1.5);

    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // Starting coordinates for the truck box
    const offsetX = 70;
    const offsetY = 50;

    // 1. Draw Truck Floor
    ctx.fillStyle = "#ffffff";
    ctx.fillRect(offsetX, offsetY, tL * scale, tW * scale);

    // 2. Draw Truck Outer Border
    ctx.strokeStyle = "#333";
    ctx.lineWidth = 2;
    ctx.strokeRect(offsetX, offsetY, tL * scale, tW * scale);

    // 3. Draw the "L-shaped" ruler dimensions (Your Screenshot Style)
    ctx.strokeStyle = "#000";
    ctx.fillStyle = "#000";
    ctx.lineWidth = 2;
    ctx.font = "bold 24px Arial"; // Larger text like your drawing
    ctx.textAlign = "center";

    // --- Vertical Dimension (Width) ---
    ctx.beginPath();
    ctx.moveTo(offsetX - 25, offsetY);
    ctx.lineTo(offsetX - 25, offsetY + (tW * scale));
    // Small feet on ruler
    ctx.moveTo(offsetX - 35, offsetY); ctx.lineTo(offsetX - 15, offsetY);
    ctx.moveTo(offsetX - 35, offsetY + (tW * scale)); ctx.lineTo(offsetX - 15, offsetY + (tW * scale));
    ctx.stroke();

    // Width text
    ctx.save();
    ctx.translate(offsetX - 50, offsetY + (tW * scale / 2));
    ctx.rotate(-Math.PI / 2);
    ctx.fillText(tW, 0, 0);
    ctx.restore();

    // --- Horizontal Dimension (Length) ---
    ctx.beginPath();
    ctx.moveTo(offsetX, offsetY + (tW * scale) + 25);
    ctx.lineTo(offsetX + (tL * scale), offsetY + (tW * scale) + 25);
    // Small feet on ruler
    ctx.moveTo(offsetX, offsetY + (tW * scale) + 15); ctx.lineTo(offsetX, offsetY + (tW * scale) + 35);
    ctx.moveTo(offsetX + (tL * scale), offsetY + (tW * scale) + 15); ctx.lineTo(offsetX + (tL * scale), offsetY + (tW * scale) + 35);
    ctx.stroke();

    // Length text
    ctx.fillText(tL, offsetX + (tL * scale / 2), offsetY + (tW * scale) + 55);

    // 4. Draw Cargo Boxes
    fitted.forEach((c) => {
        const x = offsetX + (c.x * scale);
        const y = offsetY + (c.y * scale);
        const w = c.w * scale;
        const h = c.h * scale;

        ctx.fillStyle = "#d4edda"; // Light green like your screenshot
        ctx.fillRect(x, y, w, h);

        ctx.strokeStyle = "#777";
        ctx.lineWidth = 1;
        ctx.strokeRect(x, y, w, h);

        // Center ID (Bold 1)
        ctx.fillStyle = "#000";
        ctx.font = "bold 16px Arial";
        ctx.fillText(c.id, x + (w / 2), y + (h / 2) - 5);

        // Dim Label (0.8x1.2)
        ctx.font = "11px Arial";
        ctx.fillText(`${c.w}x${c.h}`, x + (w / 2), y + (h / 2) + 12);
    });
}