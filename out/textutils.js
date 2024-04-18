"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (k !== "default" && Object.prototype.hasOwnProperty.call(mod, k)) __createBinding(result, mod, k);
    __setModuleDefault(result, mod);
    return result;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.kivymd_exist = exports.get_hover_for = exports.get_cursor_index_in_line = exports.get_current_line_index = exports.getCursorIndex = exports.get_line_text = exports.get_text = exports.get_next_line_text = exports.get_previous_line_text = exports.get_current_line_tab_number = exports.get_previous_line_tab_number = exports.get_tabs_number = exports.get_default_tabs_number = exports.get_parent_of_child = exports.get_attribue_value = exports.get_attribue_key = exports.get_attr = exports.get = exports.get_word_before_parenths_kv = exports.handle_insertion_text = exports.isInsideComment = exports.inside_brackets = exports.isInsideStringKv = exports.isInsideStringPy = exports.searchStringsValue = exports.searchPaths = exports.get_suggestions = exports.is_parent_name = exports.is_parent_line = exports.get_all_sugestions = exports.searchKvKeywords = exports.get_selected_text = exports.handleTextDocumentChange = exports.init_textutils = void 0;
const vscode = __importStar(require("vscode"));
const fs = __importStar(require("fs"));
const path = __importStar(require("path"));
const file = __importStar(require("./fileutils"));
const settings = __importStar(require("./settings"));
const ed = __importStar(require("./editor"));
let selected_text = "";
let cursor_index = [-1, -1];
let cursor_pos_in_line = [-1, -1];
let kv_vars = [];
const filePath = path.join(__dirname, '..', 'data', 'all_kivy.json');
const fileImports = path.join(__dirname, '..', 'data', 'imports.txt');
const fileValuesPath = path.join(__dirname, '..', 'data', 'in_strings.json');
let fileExtension;
function init_textutils(context) {
    vscode.workspace.onDidOpenTextDocument((document) => {
        if (document.languageId === 'kv') {
            const disposable = vscode.commands.registerCommand('extension.runKvFile', () => {
                // Add your logic to run the .kv file here
                vscode.window.showInformationMessage('Running .kv file...');
                // Add code to execute the .kv file or perform the desired action
            });
            // Bind the F5 key to your command for .kv files
            vscode.commands.executeCommand('setContext', 'runKvFileEnabled', true);
            vscode.workspace.onDidCloseTextDocument(() => disposable.dispose());
        }
    });
    // on tab changes event
    vscode.window.onDidChangeTextEditorSelection((event) => {
        if (event.textEditor) {
            fileExtension = event.textEditor.document.fileName.split(".").pop()?.toLowerCase();
            if (fileExtension === "py") {
            }
            else if (fileExtension === "kv") {
            }
        }
    });
    vscode.window.onDidChangeTextEditorSelection((event) => {
        handleTextEditorSelectionChange(event);
    });
}
exports.init_textutils = init_textutils;
let previousText = "";
function handleTextDocumentChange(event) {
    if (vscode.window.activeTextEditor && event.document === vscode.window.activeTextEditor.document) {
        if (settings.auto_indent) {
            for (const change of event.contentChanges) {
                if (change.text.includes('\n') && previousText.length < get_text().length) {
                    const previousLine = get_line_text();
                    let tabs_default = get_default_tabs_number();
                    if (tabs_default < 1) {
                        tabs_default = 4;
                    }
                    const editor = vscode.window.activeTextEditor;
                    if (!editor) {
                        return;
                    }
                    const cursorPosition = editor.selection.active;
                    if (is_parent_line(previousLine)) {
                        const newPos = new vscode.Position(cursorPosition.line + 1, 0);
                        ed.insert_text_in(get_tabs_string(tabs_default), newPos);
                    }
                }
            }
        }
    }
    previousText = get_text();
    init_lists();
}
exports.handleTextDocumentChange = handleTextDocumentChange;
function handleTextEditorSelectionChange(event) {
    const editor = event.textEditor;
    if (!editor) {
        return;
    }
    const cursorPosition = editor.selection.active;
    const document = editor.document;
    cursor_pos_in_line = [cursorPosition.character, -1];
    // Get the text before the cursor
    const textBeforeCursor = document.getText(new vscode.Range(new vscode.Position(0, 0), cursorPosition));
    // Find the nearest opening and closing parentheses before the cursor
    const openingParenIndex = textBeforeCursor.lastIndexOf("(");
    const closingParenIndex = textBeforeCursor.lastIndexOf(")");
    if (openingParenIndex > closingParenIndex && openingParenIndex !== -1) {
        // Cursor is inside parentheses
    }
    else {
        // Cursor is not inside parentheses
    }
    let startPosition;
    let endPosition;
    if (editor.selection.isEmpty) {
        startPosition = editor.selection.active;
        endPosition = editor.selection.active;
        cursor_index = [startPosition.line * 1000 + startPosition.character, endPosition.line * 1000 + endPosition.character];
    }
    else {
        startPosition = editor.selection.start;
        endPosition = editor.selection.end;
        cursor_index = [startPosition.line * 1000 + startPosition.character, endPosition.line * 1000 + endPosition.character];
    }
}
function get_selected_text() {
    return selected_text;
}
exports.get_selected_text = get_selected_text;
function searchKvKeywords() {
    const searchResult = [];
    const searchTerm = getWordBeforeCursor();
    const line = get_line_text();
    if (isInsideStringKv()) {
        const prefix = getTextBeforeFirstQuote();
        const listPaths = searchPaths(prefix);
        const listValues = searchStringsValue(prefix);
        return [...listPaths, ...listValues];
    }
    if (line.trim().startsWith("#: import") || line.trim().startsWith("#:import")) {
        return get_imports_for(searchTerm);
    }
    const parent_name = get_parent_of_child();
    const current_word = getWordBeforeCursor();
    try {
        const data = fs.readFileSync(filePath, "utf8");
        const jsonData = JSON.parse(data);
        for (const key in jsonData) {
            if (jsonData.hasOwnProperty(key)) {
                const item = jsonData[key];
                const type = item["type"];
                const name = item["name"];
                let prefix = item["prefix_kv"];
                const parents_list = item["parent"];
                const is_parent = is_parent_name(searchTerm);
                let completion_item = new vscode.CompletionItem(name);
                completion_item.detail = type;
                if (inside_brackets() || isInsideComment()) {
                    completion_item.insertText = name;
                }
                else if (line.trim().startsWith("<")) {
                    completion_item.insertText = name + ">:";
                }
                else {
                    completion_item.insertText = handle_prefix(item);
                }
                set_sorting_level(item, completion_item);
                if (parent_name.trim().length > 0 && jsonData.hasOwnProperty(parent_name) && !is_parent) {
                    if (parents_list.includes(parent_name)) {
                        if (!searchResult.includes(completion_item)) {
                            searchResult.push(completion_item);
                        }
                    }
                }
                else {
                    if (name.startsWith(searchTerm.trim())) {
                        if (!searchResult.includes(completion_item)) {
                            searchResult.push(completion_item);
                        }
                    }
                }
            }
        }
    }
    catch (err) {
        console.error(err);
    }
    return searchResult;
}
exports.searchKvKeywords = searchKvKeywords;
function get_all_sugestions() {
    return [...searchKvKeywords(), ...kv_vars];
}
exports.get_all_sugestions = get_all_sugestions;
function handle_prefix(item) {
    const type = item["type"];
    const mtype = item["mtype"];
    const name = item["name"];
    const prefix = item["prefix_kv"];
    let prr = prefix;
    const parents_list = item["parent"];
    if (mtype === "attribute") {
        if (!prr.trim().includes(":")) {
            prr = prr + ":";
        }
        if (prr.includes("text")) {
            if (!(prefix.trim().includes("\"") || prefix.trim().includes("'"))) {
                prr = prr + " \"\"";
            }
        }
    }
    return prr;
}
function get_imports_for(searchTerm) {
    const searchResult = [];
    const content = fs.readFileSync(fileImports, "utf8");
    const lines = content.split("\n");
    for (let line of lines) {
        const line_text = line.trim();
        if (line_text.includes(searchTerm)) {
            let completion_item = new vscode.CompletionItem(line_text);
            completion_item.insertText = line_text.replace("#: import", "").replace("#:import", "").trim();
            completion_item.label = line_text;
            searchResult.push(completion_item);
        }
    }
    return searchResult;
}
function set_sorting_level(jsObject, completionItem) {
    const type = jsObject["type"];
    const mtype = jsObject["mtype"];
    const name = jsObject["name"];
    let prefix = jsObject["prefix_kv"];
    const parents_list = jsObject["parent"];
    const is_callable = jsObject.hasOwnProperty("callable") && jsObject["callable"] === "true";
    if (name.startsWith("_")) {
        completionItem.sortText = "z";
    }
    else {
        if (name.length < 10) {
            completionItem.sortText = sortTextKey(name, "a");
        }
        else if (name.length > 10 && name.length < 20) {
            completionItem.sortText = sortTextKey(name, "b");
        }
        else {
            completionItem.sortText = sortTextKey(name, "c");
        }
    }
}
function sortTextKey(name, alphabet) {
    let result = alphabet;
    let counter = alphabets().indexOf(alphabet) + 1;
    for (var i = 0; i < name.length; i++) {
        if (counter >= alphabets().length) {
            counter = 0;
        }
        result += alphabets()[counter];
        counter++;
    }
    return result;
}
function alphabets() {
    return ['a', 'b', 'c', 'd', 'e', 'f', 'g', 'h', 'i', 'j', 'k'];
}
function is_parent_line(lineText) {
    return get_attr(lineText, 1).trim().charAt(0).match("[A-Z<]") !== null || lineText.trim().endsWith(":");
}
exports.is_parent_line = is_parent_line;
function is_parent_name(name) {
    return name.trim().charAt(0).match("[A-Z<]") !== null;
}
exports.is_parent_name = is_parent_name;
function get_search_results_for(searchTerm, jsonData) {
    const searchResult = [];
    for (const key in jsonData) {
        if (jsonData.hasOwnProperty(key)) {
            const item = jsonData[key];
            const type = item["type"];
            const name = item["name"];
            let prefix = item["prefix_kv"];
            if (isInsideComment()) {
                //prefix = item.prefix;
            }
            let completion_item = new vscode.CompletionItem(name);
            completion_item.detail = type;
            if (inside_brackets()) {
                completion_item.insertText = name;
            }
            else {
                completion_item.insertText = prefix;
            }
            if (name.startsWith(searchTerm.trim())) {
                searchResult.push(completion_item);
            }
        }
    }
    return searchResult;
}
function get_suggestions() {
    const searchResult = [];
    const parent_name = get_parent_of_child();
    try {
        const data = fs.readFileSync(filePath, "utf8");
        const jsonData = JSON.parse(data);
        for (const key in jsonData) {
            if (jsonData.hasOwnProperty(key)) {
                const item = jsonData[key];
                const type = item["type"];
                const name = item["name"];
                let prefix = item["prefix_kv"];
                const parents_list = item["parent"];
                if (parent_name.trim().length > 0 && jsonData.hasOwnProperty(parent_name)) {
                    if (parents_list.includes(parent_name)) {
                        let completion_item = new vscode.CompletionItem(name);
                        completion_item.detail = type;
                        set_sorting_level(item, completion_item);
                        if (name.startsWith("_")) {
                            completion_item.sortText = "z";
                        }
                        else {
                            completion_item.sortText = "_";
                        }
                        if (inside_brackets() || isInsideComment()) {
                            completion_item.insertText = name;
                        }
                        else {
                            completion_item.insertText = prefix;
                        }
                        if (!searchResult.includes(completion_item)) {
                            searchResult.push(completion_item);
                        }
                    }
                }
            }
        }
    }
    catch (err) {
        console.error(err);
    }
    return searchResult;
}
exports.get_suggestions = get_suggestions;
function searchPaths(searchTerm) {
    const searchResult = [];
    try {
        if (searchTerm.startsWith(".\\") || searchTerm.startsWith("./")) {
            const activeEditor = vscode.window.activeTextEditor;
            let currentPath = searchTerm.startsWith(".\\") ? ".\\" : "./";
            if (activeEditor) {
                currentPath = path.dirname(activeEditor.document.uri.fsPath);
            }
            searchTerm = searchTerm.replace(".\\", "");
            searchTerm = path.join(currentPath, searchTerm);
        }
        const listFile = file.listFilesInPath(path.dirname(searchTerm));
        for (const filePath of listFile) {
            searchResult.push(new vscode.CompletionItem(path.basename(filePath)));
        }
    }
    catch (err) {
        console.error(err);
    }
    return searchResult;
}
exports.searchPaths = searchPaths;
function searchStringsValue(searchTerm) {
    const searchResult = [];
    try {
        const data = fs.readFileSync(fileValuesPath, "utf8");
        const jsonData = JSON.parse(data);
        for (const item of jsonData) {
            searchResult.push(new vscode.CompletionItem(item));
        }
    }
    catch (err) {
        console.error(err);
    }
    return searchResult;
}
exports.searchStringsValue = searchStringsValue;
function isInsideStringPy() {
    return is_inside("\"", "\"") || is_inside("'", "'");
}
exports.isInsideStringPy = isInsideStringPy;
function isInsideStringKv() {
    const editor = vscode.window.activeTextEditor;
    if (!editor) {
        vscode.window.showErrorMessage('No active text editor found.');
        return false;
    }
    const document = editor.document;
    const selection = editor.selection;
    const currentPosition = editor.selection.start.character;
    const text = editor.document.lineAt(get_current_line_index()).text;
    let find_open = false;
    let find_close = false;
    for (let i = currentPosition - 1; i >= 0; i--) {
        const char = text.charAt(i);
        if (char === "\"" || char === "'") {
            find_open = true;
            break;
        }
    }
    for (let i = currentPosition; i < text.length; i++) {
        const char = text.charAt(i);
        if (char === "\"" || char === "'") {
            find_close = true;
            break;
        }
    }
    return find_open && find_close;
}
exports.isInsideStringKv = isInsideStringKv;
function inside_brackets() {
    return is_inside("(", ")") || is_inside("{", "}") || is_inside("<", ">") || is_inside("[", "]");
}
exports.inside_brackets = inside_brackets;
function is_inside(open, close) {
    let find_open = false;
    let find_close = false;
    const line_text = get_line_text();
    const cursor_index_in_line = get_cursor_index_in_line();
    const open_index = line_text.indexOf(open);
    const close_index = line_text.indexOf(close) + 1;
    return open_index < cursor_index_in_line && cursor_index_in_line < close_index;
}
function isInsideComment() {
    const editor = vscode.window.activeTextEditor;
    const position = editor?.selection.active;
    if (!position) {
        return false; // Return false if cursor position is undefined
    }
    const line = editor?.document.lineAt(position.line);
    const lineText = line?.text;
    if (!lineText) {
        return false; // Return false if line text is undefined
    }
    for (let i = 0; i < position.character; i++) {
        const char = lineText.charAt(i);
        if (char === '#') {
            return true;
        }
    }
    return false;
}
exports.isInsideComment = isInsideComment;
function init_lists() {
    kv_vars = [];
    for (let line of get_text().split("\n")) {
        if (line.trim().startsWith("#") && line.includes(":") && line.includes("set")) {
            const words = line.split(" ");
            for (let i = 0; i < words.length; i++) {
                const word = words[i];
                if (word.trim().endsWith("set")) {
                    const completion = words[i + 1];
                    let citem = new vscode.CompletionItem(completion);
                    citem.detail = "Variable";
                    citem.insertText = completion;
                    kv_vars.push(citem);
                }
            }
        }
        if (line.trim().startsWith("<") && line.includes(">") && line.trim().endsWith(":") && !line.trim().includes("@")) {
            const kvVar = line.slice(line.indexOf("<") + 1, line.indexOf(">"));
            let citem = new vscode.CompletionItem(kvVar);
            citem.detail = "Py Class";
            citem.insertText = kvVar + ":\n";
            kv_vars.push(citem);
        }
        if (line.trim().startsWith("<") && line.includes(">") && line.trim().endsWith(":") && line.trim().includes("@")) {
            const kvVar = line.slice(line.indexOf("<") + 1, line.indexOf("@"));
            const parent = line.slice(line.indexOf("@") + 1, line.indexOf(">"));
            let citem = new vscode.CompletionItem(kvVar);
            citem.detail = "Kv " + parent;
            citem.insertText = kvVar + ":\n";
            kv_vars.push(citem);
        }
    }
}
function handle_insertion_text(item) {
    const searchTerm = item.label.trim();
    const line = get_line_text();
    try {
        const data = fs.readFileSync(filePath, "utf8");
        const jsonData = JSON.parse(data);
        for (const key in jsonData) {
            if (jsonData.hasOwnProperty(key)) {
                const js_item = jsonData[key];
                const type = js_item["type"];
                const mtype = js_item["mtype"];
                let name = js_item["name"];
                const prefix = js_item["prefix_kv"];
                if (name === searchTerm.trim()) {
                    if (inside_brackets()) {
                        // return;
                    }
                    const func = types.parenths.includes(type) && fileExtension === "kv";
                    if (fileExtension === "kv" && mtype === "function") {
                        return;
                    }
                    if (type === "WidgetMetaclass" || types.special_class.includes(name)) {
                        if (item.insertText?.toString().endsWith(":")) {
                            ed.move_cursor_next_line(1);
                        }
                        else if (line.trim().endsWith(">")) {
                            ed.move_cursor_forward(1);
                            ed.insert_text(":");
                            ed.move_cursor_next_line(1);
                        }
                    }
                    if (prefix.trim().endsWith(")") || prefix.trim().endsWith("\"") || prefix.trim().endsWith("'") ||
                        prefix.trim().endsWith("}") || prefix.trim().endsWith("]")) {
                        ed.move_cursor_back(1);
                    }
                }
            }
        }
    }
    catch (err) {
    }
}
exports.handle_insertion_text = handle_insertion_text;
function get_tabs_string(num) {
    let tabs = "";
    for (let i = 0; i < num; i++) {
        tabs += " ";
    }
    return tabs;
}
function getWordBeforeCursor() {
    const editor = vscode.window.activeTextEditor;
    if (editor) {
        const position = editor.selection.active;
        const wordRange = editor.document.getWordRangeAtPosition(position);
        if (wordRange) {
            return editor.document.getText(wordRange);
        }
    }
    return "/><5%";
}
function getTextBeforeFirstQuote() {
    const editor = vscode.window.activeTextEditor;
    if (!editor) {
        vscode.window.showErrorMessage('No active text editor found.');
        return '';
    }
    const position = editor.selection.active;
    const line = editor.document.lineAt(position.line);
    const lineText = line.text;
    let textBeforeQuote = '';
    for (let i = position.character - 1; i >= 0; i--) {
        const char = lineText.charAt(i);
        if (char === '"' || char === "'") {
            if (i - 1 >= 0) {
                if (lineText.charAt(i - 1) === "\\") {
                    continue;
                }
            }
            textBeforeQuote = lineText.substring(i + 1, position.character);
            break;
        }
    }
    return textBeforeQuote;
}
function get_word_before_parenths_kv() {
    const editor = vscode.window.activeTextEditor;
    if (!editor) {
        vscode.window.showErrorMessage('No active text editor found.');
        return "";
    }
    const document = editor.document;
    const selection = editor.selection;
    const position = editor.selection.start;
    // Ensure a single character selection to get precise index
    if (selection.active.character !== selection.anchor.character) {
        return ""; // Not a single character selection
    }
    // Get the line at the cursor position
    const line = document.lineAt(selection.active.line).text;
    if (!inside_brackets()) {
        return "";
    }
    let word = "";
    let start_collect = false;
    for (let i = selection.active.character; i >= 0; i--) {
        const char = line.charAt(i);
        if (char === " ") {
            continue;
        }
        ;
        if (char.match("[^\\w\\s\\:]") && start_collect) {
            break;
        }
        ;
        if (start_collect) {
            word = char + word;
        }
        if (char === "(") {
            start_collect = true;
        }
        ;
    }
    return word.trim().replace(":", "");
}
exports.get_word_before_parenths_kv = get_word_before_parenths_kv;
function get(index, which) {
    const editor = vscode.window.activeTextEditor;
    if (!editor) {
        vscode.window.showErrorMessage('No active text editor found.');
        return "";
    }
    if (which > 2) {
        return "get(col_num, key = 1 or value = 2)";
    }
    const document = editor.document;
    const lines = document.getText().slice(0, index).split("\n");
    const line = document.lineAt(lines.length - 1).text.trim();
    if (!line.includes(":")) {
        return "";
    }
    const indexOfFirstColon = line.indexOf(":");
    if (indexOfFirstColon !== -1) {
        let stringWithoutFirstColon = null;
        if (which === 1) {
            return line.slice(0, indexOfFirstColon).trim();
        }
        if (which === 2) {
            return line.slice(indexOfFirstColon + 1).trim();
        }
    }
    return line.split(":")[1];
}
exports.get = get;
function get_attr(line, which) {
    const editor = vscode.window.activeTextEditor;
    if (!editor) {
        vscode.window.showErrorMessage('No active text editor found.');
        return "";
    }
    if (which > 2) {
        return "get(line text, key = 1 or value = 2)";
    }
    if (!line.includes(":")) {
        return "";
    }
    const indexOfFirstColon = line.indexOf(":");
    if (indexOfFirstColon !== -1) {
        let stringWithoutFirstColon = null;
        if (which === 1) {
            return line.slice(0, indexOfFirstColon).trim();
        }
        if (which === 2) {
            return line.slice(indexOfFirstColon + 1).trim();
        }
    }
    return line.split(":")[1].trim();
}
exports.get_attr = get_attr;
function get_attribue_key() {
    const editor = vscode.window.activeTextEditor;
    if (!editor) {
        vscode.window.showErrorMessage('No active text editor found.');
        return "";
    }
    return get(getCursorIndex(), 1);
}
exports.get_attribue_key = get_attribue_key;
function get_attribue_value() {
    const editor = vscode.window.activeTextEditor;
    if (!editor) {
        vscode.window.showErrorMessage('No active text editor found.');
        return "";
    }
    return get(getCursorIndex(), 2);
}
exports.get_attribue_value = get_attribue_value;
function get_parent_of_child() {
    const editor = vscode.window.activeTextEditor;
    if (!editor) {
        vscode.window.showErrorMessage('No active text editor found.');
        return "";
    }
    const document = editor.document;
    const line_index = get_current_line_index();
    const line = document.lineAt(line_index).text;
    const current_tabs = get_tabs_number(line);
    if (current_tabs === 0) {
        return "";
    }
    const tabs_number = get_default_tabs_number();
    if (tabs_number <= 0) {
        console.error("tabs number not determined !");
        return "";
    }
    for (let i = line_index; i >= 0; i--) {
        const line_loop = document.lineAt(i).text;
        const tabs_num = get_tabs_number(line_loop);
        if (tabs_num === current_tabs) {
            continue;
        }
        if (tabs_num === (current_tabs - tabs_number)) {
            if (line_loop.includes("@")) {
                const parent = line_loop.match("@\\w+");
                if (parent) {
                    return parent[0].replace("@", "");
                }
            }
            else if (line_loop.includes("<") && line_loop.includes(">")) {
                const parent = line_loop.match("<\\w+>");
                if (parent) {
                    return parent[0].replace(">", "").replace("<", "");
                }
            }
            else {
                return get_attr(line_loop, 1);
            }
        }
    }
    return "";
}
exports.get_parent_of_child = get_parent_of_child;
function get_default_tabs_number(text) {
    const lines = text.split("\n");
    let tabs_numer = 0;
    if (lines.length > 0) {
        for (let i = 0; i < lines.length; i++) {
            const line = lines[i];
            const tabs_num = get_tabs_number(line);
            if (tabs_num === 0) {
                continue;
            }
            if (line.trim().length === 0) {
                continue;
            }
            if (line.trim().startsWith("#")) {
                continue;
            }
            console.log("default tabs num", tabs_num, line);
            return tabs_num;
        }
    }
    return 4;
}
exports.get_default_tabs_number = get_default_tabs_number;
function get_tabs_number(line) {
    if (line.trim() === "") {
        return get_cursor_index_in_line();
    }
    const spaces = line.match("^\\s+");
    if (spaces) {
        return spaces[0].length;
    }
    return 0;
}
exports.get_tabs_number = get_tabs_number;
function get_previous_line_tab_number() {
    let tabs = 0;
    const editor = vscode.window.activeTextEditor;
    if (!editor) {
        vscode.window.showErrorMessage('No active text editor found.');
        return -1;
    }
    const lineNum = get_current_line_index();
    const text = get_text();
    const lines = text.split("\n");
    for (let i = lineNum - 1; i >= 0; i--) {
        const line_loop = lines[i];
        if (line_loop.trim().length === 0) {
            continue;
        }
        if (line_loop.trim().startsWith("#")) {
            continue;
        }
        const tabs = get_tabs_number(line_loop);
        if (tabs === 0) {
            continue;
        }
        return tabs;
    }
    return 0;
}
exports.get_previous_line_tab_number = get_previous_line_tab_number;
function get_current_line_tab_number() {
    let tabs = 0;
    const editor = vscode.window.activeTextEditor;
    if (!editor) {
        vscode.window.showErrorMessage('No active text editor found.');
        return -1;
    }
    const lineText = get_line_text();
    return get_tabs_number(lineText);
}
exports.get_current_line_tab_number = get_current_line_tab_number;
function get_previous_line_text() {
    let tabs = 0;
    const editor = vscode.window.activeTextEditor;
    if (!editor) {
        vscode.window.showErrorMessage('No active text editor found.');
        return "";
    }
    const lineNum = get_current_line_index();
    const text = get_text();
    const lines = text.split("\n");
    for (let i = lineNum - 1; i >= 0; i--) {
        const line_loop = lines[i];
        if (line_loop.trim().length === 0) {
            continue;
        }
        if (line_loop.trim().startsWith("#")) {
            continue;
        }
        return line_loop;
    }
    return "";
}
exports.get_previous_line_text = get_previous_line_text;
function get_next_line_text() {
    let tabs = 0;
    const editor = vscode.window.activeTextEditor;
    if (!editor) {
        vscode.window.showErrorMessage('No active text editor found.');
        return "";
    }
    const lineNum = get_current_line_index();
    const text = get_text();
    const lines = text.split("\n");
    for (let i = lineNum; i < lines.length; i++) {
        const line_loop = lines[i];
        if (line_loop.trim().length === 0) {
            continue;
        }
        if (line_loop.trim().startsWith("#")) {
            continue;
        }
        return line_loop;
    }
    return "";
}
exports.get_next_line_text = get_next_line_text;
function get_text() {
    const editor = vscode.window.activeTextEditor;
    if (!editor) {
        vscode.window.showErrorMessage('No active text editor found.');
        return "";
    }
    return editor.document.getText();
}
exports.get_text = get_text;
function get_line_text() {
    const editor = vscode.window.activeTextEditor;
    if (!editor) {
        vscode.window.showErrorMessage('No active text editor found.');
        return "";
    }
    return editor.document.lineAt(get_current_line_index()).text;
}
exports.get_line_text = get_line_text;
function getCursorIndex() {
    const editor = vscode.window.activeTextEditor;
    if (!editor) {
        vscode.window.showErrorMessage('No active text editor found.');
        return -1;
    }
    if (editor) {
        const document = editor.document;
        const position = editor.selection.active;
        // Calculate the character offset from the beginning of the document
        const offset = document.offsetAt(position);
        return offset;
    }
    else {
    }
    return -1;
}
exports.getCursorIndex = getCursorIndex;
function get_current_line_index() {
    const editor = vscode.window.activeTextEditor;
    if (!editor) {
        vscode.window.showErrorMessage('No active text editor found.');
        return -1;
    }
    const document = editor.document;
    const selection = editor.selection;
    const currentLineIndex = selection.active.line;
    return currentLineIndex;
}
exports.get_current_line_index = get_current_line_index;
function get_cursor_index_in_line() {
    const editor = vscode.window.activeTextEditor;
    if (!editor) {
        vscode.window.showErrorMessage('No active text editor found.');
        return -1;
    }
    const document = editor.document;
    const selection = editor.selection;
    const currentLineIndex = selection.active.character;
    return currentLineIndex;
}
exports.get_cursor_index_in_line = get_cursor_index_in_line;
function get_hover_for(searchTerm) {
    try {
        const data = fs.readFileSync(filePath, "utf8");
        const jsonData = JSON.parse(data);
        for (const key in jsonData) {
            if (jsonData.hasOwnProperty(key)) {
                const item = jsonData[key];
                const type = item["type"];
                let prefix = item["name"];
                if (isInsideComment()) {
                    //prefix = item.prefix;
                }
                if (key === searchTerm.trim()) {
                    return item["name"] + " is a " + item["type"] + ".\n " + item["help"].trim();
                }
            }
        }
    }
    catch (err) {
    }
    return "";
}
exports.get_hover_for = get_hover_for;
function kivymd_exist() {
    try {
        const data = get_text();
        for (const line of data.split("\n")) {
            if (line.trim().endsWith(":") && line.trim().startsWith("MD")) {
                return true;
            }
        }
    }
    catch (err) {
        console.log(err);
    }
    return false;
}
exports.kivymd_exist = kivymd_exist;
class types {
    static special_class = ["Rectangle", "Color", "Ellipse"];
    static widgets = ["WidgetMetaclass"];
    static classes = ["Class", "ABCMeta", "Pattern", "Interpolation", "VariableListProperty", "NoneType"];
    static parenths = ["method_descriptor", "tuple", "function", "getset_descriptor", "ColorProperty"];
    static numbers = ["int", "float", "NumericProperty", "BoundedNumericProperty"];
    static lists = ["list", "ListProperty", "ReferenceListProperty"];
    static booleans = ["BooleanProperty", "bool"];
    static dicts_and_set = ["dict", "DictProperty", "set"];
    static strings = ["str", "StringProperty", "OptionProperty"];
    static others = ["property", "member_descriptor", "ObjectProperty"];
    static not_use = ["_abc_data", "cython_function_or_method", "module", "builtin_function_or_method", "defaultdict", "object", "AliasProperty"];
}
//# sourceMappingURL=textutils.js.map