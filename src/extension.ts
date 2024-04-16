import * as vscode from 'vscode';
import { get_selected_text, init_textutils, get_cursor_index, get_cursor_start_end_offsets } from './textutils';
import { searchKvKeywords, searchKivyKeywords, isInsideComment, isInsideStringKv } from './textutils';
import { move_cursor_back, handle_insertion_text, get_hover_for, get_suggestions, handleTextDocumentChange } from './textutils';
import { kivymd_exist } from './textutils';
import * as w from "./windowutil";
import * as tools from "./tools";
import path from 'path';

let customProvider: vscode.Disposable | undefined;
let defaultProvider: vscode.Disposable | undefined;

export function activate(context: vscode.ExtensionContext) {



    const disposable = vscode.commands.registerTextEditorCommand('extension.handleCompletionInsertion', (textEditor, edit, completionItem) => {
        handle_insertion_text(completionItem);
    });


    vscode.workspace.onDidChangeTextDocument((event) => {
        handleTextDocumentChange(event);
        if (!defaultProvider) {
            set_up_suggestions(context);
        }
    });


    context.subscriptions.push(
        vscode.languages.registerHoverProvider({ scheme: 'file' }, {
            provideHover(document, position, token) {
                // Logic to provide hover information
                const hoveredWord = document.getText(document.getWordRangeAtPosition(position));
                const hover = get_hover_for(hoveredWord);
                if (hover.trim() === "") {
                    return null;
                }
                return new vscode.Hover(hover);
            }
        })
    );





    const config = vscode.workspace.getConfiguration();

    config.update('editor.quickSuggestions', {
        other: true,
        comments: true,
        strings: true
    }, vscode.ConfigurationTarget.Global);



    let runKvCmd = vscode.commands.registerCommand('extension.runKvFile', () => {
        vscode.window.showInformationMessage('Running .kv file...');
        run_kv();
    });



    let show_suggestions = vscode.commands.registerCommand('extension.displaySuggestions', () => {
        show_up_cust_suggestions(context);
    });




    init_textutils(context);


    exports.activate = function () {
        console.log(`I am active!`);
        vscode.commands.registerCommand('type', (args) => {
            console.log(`type with args`, args);
            return vscode.commands.executeCommand('default:type', args);
        });
    };



    context.subscriptions.push(disposable);
    context.subscriptions.push(runKvCmd);
    context.subscriptions.push(show_suggestions);


}


function run_kv() {
    const editor = vscode.window.activeTextEditor;
    let script = path.join(path.dirname(__dirname), "tools/kvviewer.py");

    if (kivymd_exist()) {
        script = path.join(path.dirname(__dirname), "tools/kvmdviewer.py");
    }

    if (editor && editor.document.languageId === 'kv') {
        const filePath = "'" + editor.document.uri.fsPath + "'";

        if (tools.is_pip_package_installed("watchdog")) {
            tools.executeCmd("python " + script + " " + filePath);
        } else {
            tools.executeCmd("pip install watchdog");
            tools.executeCmd("python " + script + " " + filePath);
        }

    }
}


function set_up_suggestions(context: vscode.ExtensionContext) {
    if (defaultProvider) {
        defaultProvider.dispose();
        defaultProvider = undefined;
    }
    if (customProvider) {
        customProvider.dispose();
    }
    defaultProvider = vscode.languages.registerCompletionItemProvider(
        { scheme: 'file' },
        {
            provideCompletionItems(document: vscode.TextDocument, position: vscode.Position) {

                const fileExtension = document.fileName.split(".").pop()?.toLowerCase();
                if (fileExtension === "kv") {
                    const suggestions = searchKvKeywords();
                    return suggestions;
                }

                return [];
            },
            resolveCompletionItem(item: vscode.CompletionItem, token: vscode.CancellationToken) {
                item.command = {
                    command: 'extension.handleCompletionInsertion',
                    title: 'Handle Completion Insertion',
                    arguments: [item],
                };
                return item;
            }
        }
    );
    context.subscriptions.push(defaultProvider);
}


function handle_enter_press(context: vscode.ExtensionContext) {

}


function show_up_cust_suggestions(context: vscode.ExtensionContext) {
    if (defaultProvider) {
        defaultProvider.dispose();
        defaultProvider = undefined;
    }
    if (customProvider) {
        customProvider.dispose();
        defaultProvider = undefined;
    }

    const sugs = get_suggestions();


    // Register a new completion provider with the updated custom completion items
    customProvider = vscode.languages.registerCompletionItemProvider(
        { scheme: 'file' }, {
        provideCompletionItems(document: vscode.TextDocument, position: vscode.Position) {
            const fileExtension = document.fileName.split(".").pop()?.toLowerCase();
            if (fileExtension === "kv") {
                const suggestions = get_suggestions();
                return suggestions;
            }
        },
        resolveCompletionItem(item: vscode.CompletionItem, token: vscode.CancellationToken) {
            item.command = {
                command: 'extension.handleCompletionInsertion',
                title: 'Handle Completion Insertion',
                arguments: [item],
            };
            return item;
        }
    }
    );

    // Trigger the suggestion panel
    if (sugs.length > 0) {
        context.subscriptions.push(customProvider);
        vscode.commands.executeCommand('editor.action.triggerSuggest');
    } else {
        vscode.window.showInformationMessage('No suggestions found');
        set_up_suggestions(context);
    }
}

export function deactivate() {
    if (defaultProvider) {
        defaultProvider.dispose();
        defaultProvider = undefined;
    }
    if (customProvider) {
        customProvider.dispose();
        defaultProvider = undefined;
    }
}

