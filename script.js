let buildLabel = obj => {
    let specials = ["label", "type", "id", "inV", "outV", "inVs"];
    var body = [`[${obj.id}] ${obj.label}`];
    let handleProps = obj => {
        var body = [];
        for (const prop in obj) {
            if (specials.includes(prop)) {
                continue;
            }
            if (typeof obj[prop] === "object") {
                if (obj[prop].line !== undefined && obj[prop].character !== undefined) {
                    body.push(`${prop}: ${obj[prop].line}:${obj[prop].character}`);
                } else {
                    body.push(`${prop}:`);
                    body = body.concat(handleProps(obj[prop]).map(x => "  " + x));
                }
            } else {
                body.push(`${prop}: ${obj[prop]}`);
            }
        }
        return body;
    }
    body = body.concat(handleProps(obj));
    return `\"${body.join("\n")}\"`;
}

let lsifToDot = lsif => {
    try {
        let items = lsif.split("\n");
        let nodes = [];
        let edges = [];
        items.forEach(item => {
            if (item.trim() === "") {
                return;
            }
            console.log(`parsing: ${item}`);
            let parsed = JSON.parse(item);
            if (parsed.type === "edge") {
                let inVs = parsed.inVs === undefined ? [parsed.inV] : parsed.inVs;
                inVs.forEach(inV => {
                    edges.push(`${parsed.outV} -> ${inV} [label=${buildLabel(parsed)}]`)
                });
            } else {
                nodes.push(`${parsed.id} [label=${buildLabel(parsed)}, shape="box"]`)
            }
        });
        return {
            dot: `digraph {\n ${nodes.join("\n")}\n${edges.join("\n")}\n}`,
            error: null
        };
    } catch (error) {
        return {
            dot: null,
            error: error.message
        };
    }
}

let render = dot => {
    d3.select("#graph").graphviz()
        .renderDot(dot);
}

d3.select("#submit").on("click", () => {
    let lsif = document.getElementById("input").value;
    let result = lsifToDot(lsif);
    if (result.dot !== null) {
        render(result.dot);
        document.getElementById("output").value = result.dot;
    } else {
        document.getElementById("output").value = result.error;
    }
});