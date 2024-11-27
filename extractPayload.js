const parser = require("@babel/parser");
const traverse = require("@babel/traverse").default;
const fs = require("fs");

// Загрузка кода из файла `src/js/main.js`
const code = fs.readFileSync("./src/js/main.js", "utf-8");

// Парсим код в абстрактное синтаксическое дерево AST
const ast = parser.parse(code, {
    sourceType: "module",
    plugins: ["jsx", "asyncFunctions"], // Enable modern JavaScript features
});

// Граф зависимостей и граф контроля потока инициализированы как объекты
const dependencyGraph = {};
const controlFlowGraph = { nodes: new Set(), edges: [] };

/**
 * Добавляем узел в граф зависимостей
 */
function addDependencyNode(graph, nodeName) {
    if (!graph[nodeName]) {
        graph[nodeName] = [];
    }
}

/**
 * Добавляем ребро в граф зависимостей
 */
function addDependencyEdge(graph, from, to) {
    if (!graph[from]) {
        graph[from] = [];
    }
    if (!graph[from].includes(to)) {
        graph[from].push(to);
    }
}

/**
 * Добавляем узел в граф контроля потока
 */
function addControlFlowNode(graph, nodeName) {
    graph.nodes.add(nodeName);
}

/**
 * Добавляем ребро в граф контроля потока
 */
function addControlFlowEdge(graph, from, to) {
    graph.edges.push({ from, to });
}

/**
 * Извлекаем информацию о функции
 */
function extractFunctionPayload(path) {
    return {
        name: path.node.id ? path.node.id.name : "anonymous",
        params: getFunctionParams(path.node.params),
        body: getFunctionBody(path),
    };
}

/**
 * Получаем параметры о функции
 */
function getFunctionParams(params) {
    return params.map((param) => (param.type === "Identifier" ? param.name : null)).filter(Boolean);
}

/**
 * Получаем тело функции в виде строки
 */
function getFunctionBody(path) {
    return path.get("body").toString();
}

/**
 * Получаем полезную информацию из AST
 */
function extractPayload(ast) {
    const payload = [];
    traverse(ast, {
        FunctionDeclaration(path) {
            const funcDetails = extractFunctionPayload(path);
            payload.push(funcDetails);
        },
        ArrowFunctionExpression(path) {
            const funcDetails = extractFunctionPayload(path);
            payload.push(funcDetails);
        },
        FunctionExpression(path) {
            const funcDetails = extractFunctionPayload(path);
            payload.push(funcDetails);
        },
    });
    return payload;
}

// Получаем информацию и записываем в файл
const result = extractPayload(ast);
fs.writeFileSync("payloadResult.json", JSON.stringify(result, null, 2));
console.log("Payload extracted:", result);

// Обходим по AST для дальнейшего заполнения графов
traverse(ast, {
    FunctionDeclaration(path) {
        const funcName = path.node.id.name;
        addDependencyNode(dependencyGraph, funcName);

        path.traverse({
            CallExpression(callPath) {
                const callee = callPath.node.callee.name;
                if (callee) {
                    addDependencyEdge(dependencyGraph, funcName, callee);
                }
            },
        });
    },
    ExpressionStatement(path) {
        const expr = path.node.expression;
        if (expr.type === "CallExpression") {
            const callee = expr.callee.name;
            if (callee) {
                addControlFlowNode(controlFlowGraph, callee);
                addControlFlowEdge(controlFlowGraph, "start", callee);
            }
        }
    },
});

/**
 * Конвертируем граф зависимостей в формат .dot
 * @param {Object} graph - Граф зависимостей.
 * @returns {string} - Строка в формате Graphviz DOT, представляющая граф зависимостей
 */
function dependencyGraphToDot(graph) {
    let dot = "digraph DependencyGraph {\n";
    for (const [node, edges] of Object.entries(graph)) {
        dot += `    "${node}";\n`;
        edges.forEach((edge) => {
            dot += `    "${node}" -> "${edge}";\n`;
        });
    }
    dot += "}";
    return dot;
}

/**
 * Конвертируем граф контроля потока в формат .dot
 * @param {Object} graph - Граф контроля потока.
 * @returns {string} - Строка в формате Graphviz DOT, представляющая граф контроля потока
 */
function controlFlowGraphToDot(graph) {
    let dot = "digraph ControlFlowGraph {\n";
    graph.nodes.forEach((node) => {
        dot += `    "${node}";\n`;
    });
    graph.edges.forEach(({ from, to }) => {
        dot += `    "${from}" -> "${to}";\n`;
    });
    dot += "}";
    return dot;
}

// Сохраняем графы как .dot файлы
const dependencyGraphDot = dependencyGraphToDot(dependencyGraph);
const controlFlowGraphDot = controlFlowGraphToDot(controlFlowGraph);

fs.writeFileSync("dependencyGraph.dot", dependencyGraphDot);
fs.writeFileSync("controlFlowGraph.dot", controlFlowGraphDot);

console.log("Dependency Graph saved as DOT:");
console.log(dependencyGraphDot);

console.log("Control Flow Graph saved as DOT:");
console.log(controlFlowGraphDot);
