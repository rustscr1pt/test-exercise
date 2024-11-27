const parser = require("@babel/parser");
const traverse = require("@babel/traverse").default;
const fs = require("fs");

// Загружаем код из директории src
const code = fs.readFileSync("./src/js/main.js", "utf-8");

// Парсим код в AST
const ast = parser.parse(code, {
    sourceType: "module",
    plugins: ["jsx", "asyncFunctions"], // Поддержка новых возможностей ES6+
});

/**
 * Функция для извлечения полезной нагрузки (обработчик функций)
 */
function extractFunctionPayload(path) {
    const details = {
        name: path.node.id ? path.node.id.name : "anonymous", // Если функция анонимная
        params: getFunctionParams(path.node.params),
        body: getFunctionBody(path),
    };

    return details;
}

/**
 * Извлекаем параметры функции
 */
function getFunctionParams(params) {
    return params.map((param) => {
        if (param.type === "Identifier") {
            return param.name;
        }
        return null; // Обрабатываем только параметры Identifier
    }).filter(Boolean); // Убираем пустые значения
}

/**
 * Получаем тело функции как строку
 */
function getFunctionBody(path) {
    return path.get("body").toString();
}

/**
 * Основная функция для извлечения полезной нагрузки из всего дерева
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
        }
    });

    return payload;
}

// Извлекаем полезную нагрузку
const result = extractPayload(ast);

// Записываем результат в файл и выводим в консоль
fs.writeFileSync("payloadResult.json", JSON.stringify(result, null, 2));
console.log("Payload extracted:", result);

