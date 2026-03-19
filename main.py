from flask import Flask, request, jsonify, render_template
from rectpack import newPacker

app = Flask(__name__)


@app.route('/')
def index():
    return render_template('index.html')


@app.route('/optimize', methods=['POST'])
def optimize():
    data = request.json
    precision = 1000

    t_l = int(float(data.get('truck_length', 4.3)) * precision)
    t_w = int(float(data.get('truck_width', 2.1)) * precision)

    packer = newPacker(rotation=True)
    packer.add_bin(t_l, t_w)

    raw_cargo = data.get('cargo', [])
    all_rects = []

    for i, c in enumerate(raw_cargo):
        qty = int(c.get('qty', 1))
        cl = int(float(c['length']) * precision)
        cw = int(float(c['width']) * precision)
        for _ in range(qty):
            packer.add_rect(cl, cw, rid=i + 1)
            all_rects.append(i + 1)

    packer.pack()

    packed_results = []
    packed_ids = []
    for rect in packer.rect_list():
        b, x, y, w, h, rid = rect
        packed_results.append({
            "x": x / precision,
            "y": y / precision,
            "w": w / precision,
            "h": h / precision,
            "id": rid
        })
        packed_ids.append(rid)

    missing_summary = {}
    temp_all = list(all_rects)
    for p_id in packed_ids:
        if p_id in temp_all:
            temp_all.remove(p_id)

    for m_id in temp_all:
        missing_summary[m_id] = missing_summary.get(m_id, 0) + 1

    return jsonify({
        "status": "success",
        "fitted": packed_results,
        "missing": missing_summary
    })


if __name__ == '__main__':
    import os
    port = int(os.environ.get("PORT", 5000))
    app.run(host='0.0.0.0', port=port)